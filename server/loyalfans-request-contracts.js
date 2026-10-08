import { createHash } from 'node:crypto';

const UID=/^[A-Za-z0-9_-]{16,255}$/;
const FIELD=/^[A-Za-z_][A-Za-z0-9_-]{0,79}$/;
const RESERVED=new Set(['__proto__','prototype','constructor']);
const SENSITIVE=/authorization|bearer|cookie|xsrf|signature|session|password|secret/i;
export const LOYALFANS_COMMENT_LIST_CONTINUATION_FIELDS=Object.freeze(['page_token','page_token_newer','token_id','token_newer_id']);
export const LOYALFANS_OBSERVED_INITIAL_COMMENTS_CONTRACT=freeze({version:1,observed:true,method:'POST',
  pathTemplate:'/api/v1/comments',query:{'ngsw-bypass':true},payload:{uid:'{postUid}'},
  pagination:{maxPages:1,maxComments:10000,continuation:[],terminal:{all:
    LOYALFANS_COMMENT_LIST_CONTINUATION_FIELDS.map(field=>({responsePath:[field],equals:null}))}}});
// Observed POST contract validated against the authenticated page-2 response.
// This is a request default only; response page_meta always governs traversal.
export const LOYALFANS_OBSERVED_STORE_DEFAULT_LIMIT=36;
export function createObservedLoyalFansStoreContract({creatorSlug,limit=LOYALFANS_OBSERVED_STORE_DEFAULT_LIMIT,maxPages=100,maxItems=10000}={}) {
  assert(typeof creatorSlug==='string' && /^[A-Za-z0-9_-]{1,255}$/.test(creatorSlug));
  assert(Number.isInteger(limit) && limit>=1 && limit<=1000);
  return parseLoyalFansRequestContract({version:1,observed:true,method:'POST',pathTemplate:'/api/v2/videos-store',
    query:{'ngsw-bypass':true},payload:{slug:creatorSlug,type:'video'},pagination:{maxPages,maxItems,
      page:{location:'body',requestPath:['page'],type:'string'},
      pageSize:{location:'body',requestPath:['limit'],value:limit}}},'catalogue');
}
export function isObservedInitialCommentsContract(contract) {
  return contract?.method==='POST' && contract.pathTemplate==='/api/v1/comments';
}
export function isTerminalLoyalFansCommentList(payload) {
  return payload?.success===true && Number(payload.httpCode)===200 && Array.isArray(payload.comments) &&
    payload.comments.every(comment=>object(comment) && typeof comment.uid==='string' && UID.test(comment.uid) &&
      typeof comment.parent?.uid==='string' && UID.test(comment.parent.uid) &&
      typeof comment.user?.uid==='string' && UID.test(comment.user.uid)) &&
    LOYALFANS_COMMENT_LIST_CONTINUATION_FIELDS.every(field=>!Object.hasOwn(payload,field) || payload[field]===null);
}
export function requestContractError(code='LOYALFANS_REQUEST_CONTRACT_INVALID') {
  return Object.assign(new Error('The observed LoyalFans request contract is invalid or incomplete.'),{code});
}
function assert(condition,code) {if(!condition)throw requestContractError(code);}
function object(value) {return value!==null && typeof value==='object' && !Array.isArray(value);}
function keys(value,allowed) {assert(object(value) && Object.keys(value).every(key=>allowed.includes(key)));}
function fieldPath(value) {
  assert(Array.isArray(value) && value.length>0 && value.length<=8 && value.every(key=>typeof key==='string' && FIELD.test(key) && !RESERVED.has(key)));
}
function scalar(value) {return value===null || ['string','boolean'].includes(typeof value) || (typeof value==='number' && Number.isFinite(value));}
function fixedFields(value,query=false,depth=0) {
  assert(object(value) && depth<=8);
  for(const [key,item] of Object.entries(value)){
    assert(FIELD.test(key) && !RESERVED.has(key) && !SENSITIVE.test(key));
    if(object(item) && !query)fixedFields(item,false,depth+1);
    else if(Array.isArray(item) && !query)assert(item.length<=100 && item.every(scalar));
    else assert(scalar(item));
  }
}
function placeholderCount(value) {
  if(typeof value==='string')return value.split('{postUid}').length-1;
  if(Array.isArray(value))return value.reduce((n,item)=>n+placeholderCount(item),0);
  if(object(value))return Object.values(value).reduce((n,item)=>n+placeholderCount(item),0);
  return 0;
}
function validateTarget(target) {
  keys(target,['location','requestPath','responsePath','type','value']);
  assert(['query','body'].includes(target.location));fieldPath(target.requestPath);
  assert(!target.requestPath.some(key=>SENSITIVE.test(key)));
  if(target.location==='query')assert(target.requestPath.length===1);
}
function freeze(value) {if(value && typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function at(value,path) {
  let cursor=value;
  for(const key of path){if(!object(cursor) || !Object.hasOwn(cursor,key))throw requestContractError('LOYALFANS_PAGINATION_MALFORMED');cursor=cursor[key];}
  return cursor;
}
function assign(root,path,value) {
  let cursor=root;
  for(const key of path.slice(0,-1)){
    if(!Object.hasOwn(cursor,key))cursor[key]={};
    assert(object(cursor[key]));cursor=cursor[key];
  }
  assert(!Object.hasOwn(cursor,path.at(-1)));cursor[path.at(-1)]=value;
}
function template(value,postUid) {
  if(typeof value==='string')return value.replaceAll('{postUid}',postUid);
  if(Array.isArray(value))return value.map(item=>template(item,postUid));
  if(object(value))return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,template(item,postUid)]));
  return value;
}

/** Local operator configuration, never inferred from a response or supplied by a customer. */
export function parseLoyalFansRequestContract(value,kind) {
  if(value==null || value==='')return null;
  let contract;
  try{contract=typeof value==='string'?JSON.parse(value):structuredClone(value);}catch{throw requestContractError();}
  keys(contract,['version','observed','method','pathTemplate','query','payload','pagination']);
  assert(contract.version===1 && contract.observed===true && ['GET','POST'].includes(contract.method));
  assert(typeof contract.pathTemplate==='string' && contract.pathTemplate.startsWith('/') &&
    !contract.pathTemplate.startsWith('//') && !/[?#\\\s]/.test(contract.pathTemplate) &&
    !/%(?![a-f0-9]{2})/i.test(contract.pathTemplate));
  let decoded;
  try{decoded=decodeURIComponent(contract.pathTemplate);}catch{throw requestContractError();}
  assert(!/[?#\\\s]/.test(decoded) && !decoded.split('/').some(part=>part==='.' || part==='..') &&
    !decoded.startsWith('//') && !decoded.replaceAll('{postUid}','').match(/[{}]/));
  fixedFields(contract.query);assert(contract.payload===null || object(contract.payload));
  if(contract.payload!==null)fixedFields(contract.payload);
  assert(contract.method!=='GET' || contract.payload===null);
  const p=contract.pagination;
  assert(object(p) && Number.isInteger(p.maxPages) && p.maxPages>=1 && p.maxPages<=100);
  const targets=[];
  const requestPlaceholders=placeholderCount(contract.pathTemplate)+placeholderCount(contract.query)+placeholderCount(contract.payload);
  if(kind==='comments'){
    assert(!JSON.stringify(contract.payload).includes('"uid_comment"') && !Object.hasOwn(contract.query,'uid_comment'));
    assert(requestPlaceholders===1 && placeholderCount(contract)===1);
    keys(p,['maxPages','maxComments','continuation','terminal']);
    assert(Number.isInteger(p.maxComments) && p.maxComments>=1 && p.maxComments<=10000);
    assert(Array.isArray(p.continuation) && p.continuation.length<=8);
    for(const token of p.continuation){
      validateTarget(token);assert(Object.keys(token).every(key=>['location','requestPath','responsePath','type'].includes(key)));
      assert(!token.requestPath.includes('uid_comment'));
      fieldPath(token.responsePath);assert(['string','integer'].includes(token.type));targets.push(token);
    }
    keys(p.terminal,['all']);assert(Array.isArray(p.terminal.all) && p.terminal.all.length>=1 && p.terminal.all.length<=8);
    for(const predicate of p.terminal.all){
      keys(predicate,['responsePath','equals']);fieldPath(predicate.responsePath);
      assert(Object.hasOwn(predicate,'equals') && scalar(predicate.equals));
    }
    if(isObservedInitialCommentsContract(contract)){
      assert(JSON.stringify(contract.payload)===JSON.stringify({uid:'{postUid}'}) &&
        Object.keys(contract.query).length===1 && String(contract.query['ngsw-bypass'])==='true');
      assert(LOYALFANS_COMMENT_LIST_CONTINUATION_FIELDS.every(field=>p.terminal.all.some(rule=>
        rule.responsePath.length===1 && rule.responsePath[0]===field && rule.equals===null)));
    }
  }else{
    assert(kind==='catalogue' && placeholderCount(contract)===0);
    keys(p,['maxPages','maxItems','page','pageSize']);validateTarget(p.page);
    if(p.maxItems!==undefined)assert(Number.isInteger(p.maxItems) && p.maxItems>=1 && p.maxItems<=100000);
    assert(Object.keys(p.page).every(key=>['location','requestPath','type'].includes(key)) &&
      (p.page.type===undefined || ['string','integer'].includes(p.page.type)));targets.push(p.page);
    if(p.pageSize!=null){
      validateTarget(p.pageSize);assert(Object.keys(p.pageSize).every(key=>['location','requestPath','value'].includes(key)));
      assert(Number.isInteger(p.pageSize.value) && p.pageSize.value>=1 && p.pageSize.value<=1000);targets.push(p.pageSize);
    }
    if(contract.pathTemplate==='/api/v2/videos-store'){
      assert(contract.method==='POST' && Object.keys(contract.query).length===1 && String(contract.query['ngsw-bypass'])==='true' &&
        object(contract.payload) && Object.keys(contract.payload).length===2 &&
        typeof contract.payload.slug==='string' && /^[A-Za-z0-9_-]{1,255}$/.test(contract.payload.slug) && contract.payload.type==='video');
      assert(p.page.location==='body' && p.page.requestPath.length===1 && p.page.requestPath[0]==='page' && p.page.type==='string');
      assert(p.pageSize?.location==='body' && p.pageSize.requestPath.length===1 && p.pageSize.requestPath[0]==='limit');
    }
  }
  const query=structuredClone(contract.query);const body=structuredClone(contract.payload || {});
  for(const target of targets){
    assert(target.location!=='body' || (contract.method==='POST' && contract.payload!==null));
    assign(target.location==='query'?query:body,target.requestPath,'contract-validation-placeholder');
  }
  return freeze(contract);
}

export function buildLoyalFansContractRequest(contract,{baseUrl,postUid,page=1,continuation=null}={}) {
  assert(contract,'LOYALFANS_REQUEST_CONTRACT_NOT_CONFIGURED');
  if(placeholderCount(contract))assert(typeof postUid==='string' && UID.test(postUid),'LOYALFANS_COMMENTS_SCOPE_INVALID');
  assert(Number.isInteger(page) && page>=1 && page<=contract.pagination.maxPages,'LOYALFANS_PAGINATION_BOUND');
  const query=template(contract.query,postUid);const payload=template(contract.payload,postUid);
  const url=new URL(template(contract.pathTemplate,postUid),baseUrl);
  assert(url.origin===new URL(baseUrl).origin && url.protocol==='https:' && !url.username && !url.password);
  const write=(target,value)=>assign(target.location==='query'?query:payload,target.requestPath,value);
  if(contract.pagination.page){
    write(contract.pagination.page,contract.pagination.page.type==='string'?String(page):page);
    if(contract.pagination.pageSize)write(contract.pagination.pageSize,contract.pagination.pageSize.value);
  }else if(continuation){
    assert(Array.isArray(continuation) && continuation.length===contract.pagination.continuation.length);
    contract.pagination.continuation.forEach((target,index)=>write(target,continuation[index]));
  }
  for(const [key,value] of Object.entries(query))url.searchParams.set(key,String(value));
  return{url,method:contract.method,...(payload!==null?{body:JSON.stringify(payload)}:{})};
}

function nextPage(payload,pagination,observedInitial=false) {
  if(observedInitial){
    assert(LOYALFANS_COMMENT_LIST_CONTINUATION_FIELDS.every(field=>!Object.hasOwn(payload,field) || payload[field]===null),
      'LOYALFANS_COMMENTS_CONTINUATION_CONTRACT_REQUIRED');
  }
  // Only the observed top-level continuation markers are optional. Other configured predicates stay strict.
  const terminal=pagination.terminal.all.map(rule=>{
    const optional=observedInitial && rule.responsePath.length===1 && rule.equals===null &&
      LOYALFANS_COMMENT_LIST_CONTINUATION_FIELDS.includes(rule.responsePath[0]);
    return optional && !Object.hasOwn(payload,rule.responsePath[0]) || Object.is(at(payload,rule.responsePath),rule.equals);
  }).every(Boolean);
  if(terminal)return null;
  if(observedInitial)assert(false,'LOYALFANS_COMMENTS_CONTINUATION_CONTRACT_REQUIRED');
  assert(pagination.continuation.length>0,'LOYALFANS_COMMENTS_CONTINUATION_CONTRACT_REQUIRED');
  return pagination.continuation.map(token=>{
    const value=at(payload,token.responsePath);
    // eslint-disable-next-line no-control-regex -- Opaque pagination tokens must not contain control characters.
    assert(token.type==='string'?typeof value==='string' && value.length>0 && value.length<=4096 && !/[\x00-\x1f\x7f]/.test(value)
      :Number.isSafeInteger(value) && value>=0,'LOYALFANS_PAGINATION_MALFORMED');
    return value;
  });
}
const fingerprint=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Completion is returned only after an explicitly configured terminal page. */
export async function traverseLoyalFansComments(loadPage,contract,postUid) {
  const pages=new Set();const tokens=new Set();const ids=new Set();const comments=[];
  let continuation=null;
  for(let page=1;page<=contract.pagination.maxPages;page++){
    const payload=await loadPage({page,continuation});
    assert(payload?.success===true && Number(payload.httpCode)===200 && Array.isArray(payload.comments),'LOYALFANS_RESPONSE_VALIDATION_FAILED');
    assert(payload.comments.length+comments.length<=contract.pagination.maxComments,'LOYALFANS_COMMENTS_BOUND');
    // Inspect only the list envelope. An unobserved continuation cannot supply a proof,
    // even if this partial response contains the requested challenge.
    const next=nextPage(payload,contract.pagination,isObservedInitialCommentsContract(contract));
    const pageIds=[];
    for(const comment of payload.comments){
      assert(UID.test(comment?.uid || ''),'LOYALFANS_COMMENTS_MALFORMED');
      for(const scope of [comment.post?.uid,comment.post_uid,comment.parent?.uid]){
        if(scope!=null)assert(scope===postUid,'LOYALFANS_COMMENTS_SCOPE_INVALID');
      }
      if(isObservedInitialCommentsContract(contract)){
        assert(comment.parent?.uid===postUid,'LOYALFANS_COMMENTS_SCOPE_INVALID');
        assert(typeof comment.user?.uid==='string' && UID.test(comment.user.uid),'LOYALFANS_COMMENTS_MALFORMED');
      }
      pageIds.push(comment.uid);
    }
    const signature=fingerprint([...pageIds].sort());
    assert(!pages.has(signature),'LOYALFANS_COMMENTS_PAGE_REPEATED');pages.add(signature);
    for(const comment of payload.comments){
      assert(!ids.has(comment.uid),'LOYALFANS_COMMENTS_DUPLICATE');ids.add(comment.uid);comments.push(comment);
    }
    assert(comments.length<=contract.pagination.maxComments,'LOYALFANS_COMMENTS_BOUND');
    continuation=next;
    if(continuation===null)return{authority:'creator_authenticated',scope_post_uid:postUid,complete:true,comments,page_count:page,
      ...(isObservedInitialCommentsContract(contract)?{proof_requires_parent_uid:true}:{})};
    // An empty non-terminal page does not demonstrate forward progress.
    assert(payload.comments.length>0,'LOYALFANS_COMMENTS_INCOMPLETE');
    const tokenKey=fingerprint(continuation);
    assert(!tokens.has(tokenKey),'LOYALFANS_COMMENTS_CONTINUATION_REPEATED');tokens.add(tokenKey);
  }
  throw requestContractError('LOYALFANS_COMMENTS_INCOMPLETE');
}

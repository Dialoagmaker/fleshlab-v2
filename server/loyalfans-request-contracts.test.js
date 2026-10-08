import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLoyalFansRequestContract,buildLoyalFansContractRequest,
  createObservedLoyalFansStoreContract,
  LOYALFANS_OBSERVED_INITIAL_COMMENTS_CONTRACT,LOYALFANS_COMMENT_LIST_CONTINUATION_FIELDS } from './loyalfans-request-contracts.js';
import { LoyalFansProviderClient } from './loyalfans-provider-client.js';
import { parseLoyalFansCommentProof } from './loyalfans-comment-proof.js';
import { loadConfig } from './config.js';
import { validateLoyalFansCataloguePage } from './loyalfans-catalogue.js';

const postUid='post-neutral-0000000000000000001';
const buyerUid='buyer-neutral-000000000000000001';
const challenge='FL-LF-00000000000000000000000000000000';
const options={enabled:true,environment:'test',bearerToken:'synthetic',cookieHeader:'synthetic',xsrfToken:'synthetic'};
function commentsContract(){return{version:1,observed:true,method:'GET',pathTemplate:'/observed-test/{postUid}/comments',
  query:{'ngsw-bypass':true},payload:null,pagination:{maxPages:10,maxComments:100,
    continuation:[{responsePath:['page_token'],location:'query',requestPath:['cursor'],type:'string'}],
    terminal:{all:[{responsePath:['page_token'],equals:null},{responsePath:['page_token_newer'],equals:null}]}}};}
function storeContract(location='query'){return{version:1,observed:true,method:location==='query'?'GET':'POST',
  pathTemplate:'/observed-test/videos-store',query:{'ngsw-bypass':true},payload:location==='query'?null:{scope:'neutral'},
  pagination:{maxPages:10,page:{location,requestPath:location==='query'?['page']:['pagination','page']},
    pageSize:{location,requestPath:location==='query'?['limit']:['pagination','limit'],value:12}}};}
function comment(index,text=challenge,uid=buyerUid){return{uid:`comment-neutral-${String(index).padStart(16,'0')}`,
  user:{uid,name:'Neutral Member',slug:'neutral'},comment:text,created_at:'2026-01-01T00:00:01Z'};}
function commentsPage(comments,token=null){return{success:true,httpCode:200,comments,page_token:token,page_token_newer:null,token_id:null,token_newer_id:null};}
function clientWithPages(pages,contract=commentsContract()){
  let calls=0;const requests=[];
  const client=new LoyalFansProviderClient({...options,commentsRequestContract:contract,fetchImpl:async(url,request)=>{
    requests.push({url,request});const payload=pages[calls++];return new Response(JSON.stringify(payload),{status:200});
  }});
  return{client,requests,calls:()=>calls};
}
function storePage(page,total=116,size=12){
  const start=(page-1)*size;const list=Array.from({length:Math.min(size,total-start)},(_,index)=>({uid:`post-neutral-${String(start+index).padStart(20,'0')}`}));
  return{success:true,httpCode:200,creator:{uid:'creator-neutral-0000000000000001'},list,
    page_meta:{total,per_page:size,current_page:page,last_page:Math.max(1,Math.ceil(total/size)),from:start,to:start+list.length}};
}

// Exact metadata from the authenticated page-2 capture. Product UIDs below are synthetic.
const observedStorePage2Metadata=Object.freeze({total:116,per_page:36,current_page:2,last_page:4,from:36,to:72});
const observedStorePage2Fixture=()=>({...storePage(2,116,36),page_meta:{...observedStorePage2Metadata}});

test('captured Store page-2 metadata validates the exact observed request/response contract',async()=>{
  let sent;
  const client=new LoyalFansProviderClient({...options,catalogueCreatorSlug:'fleshlabstudios',fetchImpl:async(url,request)=>{
    sent={url,request};return new Response(JSON.stringify(observedStorePage2Fixture()),{status:200});
  }});
  assert.equal(client.catalogueRequestContract.observed,true);
  const response=await client.listCataloguePage({page:2});
  assert.equal(sent.request.method,'POST');
  assert.equal(new URL(sent.url).pathname,'/api/v2/videos-store');
  assert.deepEqual(Object.fromEntries(new URL(sent.url).searchParams),{'ngsw-bypass':'true'});
  assert.deepEqual(JSON.parse(sent.request.body),{slug:'fleshlabstudios',type:'video',page:'2',limit:36});
  assert.deepEqual(response.page_meta,observedStorePage2Metadata);
  const parsed=validateLoyalFansCataloguePage(response,2);
  assert.equal(parsed.records.length,36);assert.equal(parsed.from,36);assert.equal(parsed.to,72);
  assert.equal(parsed.last_page,4);assert.equal(parsed.total,116);
  assert.throws(()=>validateLoyalFansCataloguePage(response,1),{code:'INVALID_LOYALFANS_CATALOGUE_PAGINATION'});
});

test('four-page neutral traversal includes exact observed page-2 metadata without extra terminal request',async()=>{
  const requests=[];
  const client=new LoyalFansProviderClient({...options,catalogueCreatorSlug:'neutralcreator',fetchImpl:async(_url,request)=>{
    const body=JSON.parse(request.body);requests.push(body);
    const page=Number(body.page);
    return new Response(JSON.stringify(page===2?observedStorePage2Fixture():storePage(page,116,36)),{status:200});
  }});
  const capture=await client.listAllCatalogue();
  assert.deepEqual(requests.map(body=>body.page),['1','2','3','4']);
  assert.equal(requests.every(body=>body.limit===36),true);
  assert.equal(capture.records.length,116);assert.equal(new Set(capture.records.map(item=>item.uid)).size,116);
  assert.equal(capture.pages[1].current_page,2);assert.equal(capture.pages[3].records.length,8);
  assert.equal(capture.pages[3].current_page,capture.pages[3].last_page);
});

const observedComment=(index=1)=>({...comment(index),parent:{uid:postUid}});
test('observed normal comments POST contains uid only and terminal response proves completeness',async()=>{
  const h=clientWithPages([commentsPage([observedComment()])],LOYALFANS_OBSERVED_INITIAL_COMMENTS_CONTRACT);
  assert.equal(h.client.supportsCompleteComments(),true);
  assert.equal(h.client.canAttestCompleteComments(),false);
  const result=await h.client.listComments({postUid,commentUid:'ignored-neutral-comment-0000000001'});
  assert.equal(result.complete,true);assert.equal(result.proof_requires_parent_uid,true);
  assert.equal(h.client.canAttestCompleteComments(),true);
  const {url,request}=h.requests[0];
  assert.equal(new URL(url).pathname,'/api/v1/comments');
  assert.deepEqual(Object.fromEntries(new URL(url).searchParams),{'ngsw-bypass':'true'});
  assert.equal(request.method,'POST');assert.equal(request.headers['content-type'],'application/json');
  assert.deepEqual(JSON.parse(request.body),{uid:postUid});
  assert.equal(Object.hasOwn(JSON.parse(request.body),'uid_comment'),false);
});

test('observed request is the default while provider enablement remains required',async()=>{
  const client=new LoyalFansProviderClient({...options,fetchImpl:async()=>new Response(JSON.stringify(commentsPage([])),{status:200})});
  assert.deepEqual(client.commentsRequestContract,LOYALFANS_OBSERVED_INITIAL_COMMENTS_CONTRACT);
  assert.equal((await client.listComments({postUid})).complete,true);
  const disabled=new LoyalFansProviderClient({...options,enabled:false,fetchImpl:async()=>{throw Error('must not request');}});
  assert.equal(disabled.supportsCompleteComments(),false);
  await assert.rejects(disabled.listComments({postUid}),{code:'LOYALFANS_CLIENT_DISABLED'});
});

test('comment-level page_token never changes top-level terminal attestation',async()=>{
  const raw={...observedComment(),page_token:'comment-local-token'};
  const h=clientWithPages([commentsPage([raw])],LOYALFANS_OBSERVED_INITIAL_COMMENTS_CONTRACT);
  assert.equal(h.client.canAttestCompleteComments(commentsPage([raw])),true);
  assert.equal((await h.client.listComments({postUid})).complete,true);assert.equal(h.calls(),1);
});

for(const field of LOYALFANS_COMMENT_LIST_CONTINUATION_FIELDS){
  test(`observed non-null top-level ${field} requires continuation contract and returns no proof`,async()=>{
    const payload={...commentsPage([observedComment()]),[field]:'neutral-ephemeral-marker'};
    const h=clientWithPages([payload],LOYALFANS_OBSERVED_INITIAL_COMMENTS_CONTRACT);
    assert.equal(h.client.canAttestCompleteComments(payload),false);
    await assert.rejects(h.client.listComments({postUid}),{code:'LOYALFANS_COMMENTS_CONTINUATION_CONTRACT_REQUIRED'});
    assert.equal(h.client.canAttestCompleteComments(),false);assert.equal(h.calls(),1);
    assert.equal(h.client.status().status,'CONNECTED');
  });
  test(`observed missing top-level ${field} is an absent continuation marker`,async()=>{
    const payload=commentsPage([observedComment()]);delete payload[field];
    const h=clientWithPages([payload],LOYALFANS_OBSERVED_INITIAL_COMMENTS_CONTRACT);
    assert.equal(h.client.canAttestCompleteComments(payload),true);
    assert.equal((await h.client.listComments({postUid})).complete,true);
    assert.equal(h.client.canAttestCompleteComments(),true);
  });
}

test('live envelope with only page_token null attests; every other non-null marker still blocks',async()=>{
  const payload={success:true,httpCode:200,page_token:null,comments:[observedComment()]};
  const h=clientWithPages([payload],LOYALFANS_OBSERVED_INITIAL_COMMENTS_CONTRACT);
  assert.equal((await h.client.listComments({postUid})).complete,true);
  for(const field of LOYALFANS_COMMENT_LIST_CONTINUATION_FIELDS){
    for(const value of ['',0,false,{},'neutral-next']){
      const partial=clientWithPages([{...payload,[field]:value}],LOYALFANS_OBSERVED_INITIAL_COMMENTS_CONTRACT);
      await assert.rejects(partial.client.listComments({postUid}),{code:'LOYALFANS_COMMENTS_CONTINUATION_CONTRACT_REQUIRED'});
      assert.equal(partial.client.canAttestCompleteComments(),false);
    }
  }
});

test('observed list with all optional markers omitted is terminal but malformed identities are not',async()=>{
  const h=clientWithPages([{success:true,httpCode:200,comments:[observedComment()]}],LOYALFANS_OBSERVED_INITIAL_COMMENTS_CONTRACT);
  assert.equal((await h.client.listComments({postUid})).complete,true);
  for(const comments of [null,[null],[{...observedComment(),user:{name:'Neutral'}}]]){
    assert.equal(h.client.canAttestCompleteComments({success:true,httpCode:200,comments}),false);
  }
});

for(const [name,parent] of [['wrong',{uid:'other-neutral-post-000000000001'}],['missing',undefined]]){
  test(`observed ${name} parent UID is rejected despite request-level scope`,async()=>{
    const h=clientWithPages([commentsPage([{...observedComment(),parent}])],LOYALFANS_OBSERVED_INITIAL_COMMENTS_CONTRACT);
    await assert.rejects(h.client.listComments({postUid}),{code:'LOYALFANS_COMMENTS_SCOPE_INVALID'});
    assert.equal(h.client.canAttestCompleteComments(),false);
  });
}

test('targeted uid_comment lookup stays separate and never attests list completeness',async()=>{
  const raw=observedComment();const h=clientWithPages([commentsPage([raw])],LOYALFANS_OBSERVED_INITIAL_COMMENTS_CONTRACT);
  const result=await h.client.lookupComment({postUid,commentUid:raw.uid});
  assert.deepEqual(JSON.parse(h.requests[0].request.body),{uid:postUid,uid_comment:raw.uid});
  assert.equal(new URL(h.requests[0].url).pathname,'/api/v1/comments');
  assert.equal(h.requests[0].request.method,'POST');
  assert.equal(result.complete,false);assert.equal(result.lookup,'targeted');
  assert.equal(h.client.canAttestCompleteComments(),false);
  const contract=structuredClone(LOYALFANS_OBSERVED_INITIAL_COMMENTS_CONTRACT);contract.payload.uid_comment=raw.uid;
  assert.throws(()=>parseLoyalFansRequestContract(contract,'comments'),{code:'LOYALFANS_REQUEST_CONTRACT_INVALID'});
  const continuation=structuredClone(LOYALFANS_OBSERVED_INITIAL_COMMENTS_CONTRACT);
  continuation.pagination.continuation=[{responsePath:['token_id'],location:'body',requestPath:['uid_comment'],type:'string'}];
  assert.throws(()=>parseLoyalFansRequestContract(continuation,'comments'),{code:'LOYALFANS_REQUEST_CONTRACT_INVALID'});
});

test('malformed observed list cannot attest or return a completed page',async()=>{
  for(const payload of [{...commentsPage([]),success:false},commentsPage([null]),{...commentsPage([]),comments:{}}]){
    const h=clientWithPages([payload],LOYALFANS_OBSERVED_INITIAL_COMMENTS_CONTRACT);
    assert.equal(h.client.canAttestCompleteComments(payload),false);
    await assert.rejects(h.client.listComments({postUid}));
    assert.equal(h.client.canAttestCompleteComments(),false);
  }
});

test('terminal response after incomplete first-page response restores attestation safely',async()=>{
  const h=clientWithPages([commentsPage([observedComment()],'requires-capture'),commentsPage([observedComment()])],LOYALFANS_OBSERVED_INITIAL_COMMENTS_CONTRACT);
  await assert.rejects(h.client.listComments({postUid}),{code:'LOYALFANS_COMMENTS_CONTINUATION_CONTRACT_REQUIRED'});
  assert.equal(h.client.canAttestCompleteComments(),false);
  assert.equal((await h.client.listComments({postUid})).complete,true);
  assert.equal(h.client.canAttestCompleteComments(),true);
});

for(const status of [401,403,419,500])test(`HTTP ${status} with terminal-looking body never attests list completeness`,async()=>{
  const client=new LoyalFansProviderClient({...options,fetchImpl:async()=>new Response(JSON.stringify(commentsPage([observedComment()])),{status})});
  await assert.rejects(client.listComments({postUid}),{code:status===500?'LOYALFANS_REQUEST_FAILED':'LOYALFANS_REAUTH_REQUIRED'});
  assert.equal(client.canAttestCompleteComments(),false);
  assert.equal(client.status().status,status===500?'UPSTREAM_ERROR':'AUTH_EXPIRED');
});

test('normal POST contract cannot weaken the four top-level null predicates',()=>{
  for(const field of LOYALFANS_COMMENT_LIST_CONTINUATION_FIELDS){
    const contract=structuredClone(LOYALFANS_OBSERVED_INITIAL_COMMENTS_CONTRACT);
    contract.pagination.terminal.all=contract.pagination.terminal.all.filter(rule=>rule.responsePath[0]!==field);
    assert.throws(()=>parseLoyalFansRequestContract(contract,'comments'),{code:'LOYALFANS_REQUEST_CONTRACT_INVALID'});
  }
});

test('no observed configuration means no complete comment capability',()=>{
  const client=new LoyalFansProviderClient({...options,commentPathTemplate:'/api/v2/posts/{postUid}/comments?ngsw-bypass=true'});
  assert.equal(client.canAttestCompleteComments(),false);
  assert.equal(parseLoyalFansRequestContract('','comments'),null);
  const c=commentsContract();c.observed=false;
  assert.throws(()=>new LoyalFansProviderClient({...options,commentsRequestContract:c}),{code:'LOYALFANS_REQUEST_CONTRACT_INVALID'});
});

test('single-page terminal comment response attests exact scope',async()=>{
  const h=clientWithPages([commentsPage([comment(1)])]);
  assert.equal(h.client.canAttestCompleteComments(),true);
  const result=await h.client.listComments({postUid});assert.equal(result.complete,true);assert.equal(result.page_count,1);
  assert.equal(result.scope_post_uid,postUid);assert.equal(h.calls(),1);
  assert.equal(new URL(h.requests[0].url).pathname,`/observed-test/${postUid}/comments`);
  assert.equal(new URL(h.requests[0].url).searchParams.has('cursor'),false);
});

test('multi-page traversal finds exact challenge on later page and proves terminal',async()=>{
  const h=clientWithPages([commentsPage([comment(1,'neutral unrelated marker')],'next-token'),commentsPage([comment(2)])]);
  const result=await h.client.listComments({postUid});assert.equal(result.complete,true);assert.equal(result.comments.length,2);
  assert.equal(new URL(h.requests[1].url).searchParams.get('cursor'),'next-token');
  const proofs=result.comments.map(raw=>parseLoyalFansCommentProof(raw,postUid,challenge,result.scope_post_uid)).filter(Boolean);
  assert.equal(proofs.length,1);assert.equal(proofs[0].provider_member_uid,buyerUid);
});

test('same display name never substitutes another UID and challenge match is exact',async()=>{
  const otherUid='other-neutral-000000000000000001';
  const h=clientWithPages([commentsPage([comment(1,challenge),comment(2,challenge,otherUid),comment(3,`X${challenge}`)])]);
  const r=await h.client.listComments({postUid});
  const proofs=r.comments.map(raw=>parseLoyalFansCommentProof(raw,postUid,challenge,postUid)).filter(Boolean);
  assert.deepEqual(proofs.map(p=>p.provider_member_uid),[buyerUid,otherUid]);
});

test('POST comments forwards fixed payload, exact post scope and multiple continuation fields',async()=>{
  const c=commentsContract();c.method='POST';c.pathTemplate='/observed-test/comments';c.payload={scope:{post:'{postUid}'},filter:'neutral'};
  c.pagination.continuation=[{responsePath:['page_token'],location:'body',requestPath:['paging','cursor'],type:'string'},
    {responsePath:['token_id'],location:'body',requestPath:['paging','id'],type:'integer'}];
  const first={...commentsPage([comment(1)],'next'),token_id:42};
  const h=clientWithPages([first,commentsPage([comment(2)])],c);
  assert.equal((await h.client.listComments({postUid})).complete,true);
  assert.equal(h.requests[0].request.method,'POST');
  assert.deepEqual(JSON.parse(h.requests[0].request.body),{scope:{post:postUid},filter:'neutral'});
  assert.deepEqual(JSON.parse(h.requests[1].request.body).paging,{cursor:'next',id:42});
});

for(const [name,pages,code] of [
  ['repeated continuation',[commentsPage([comment(1)],'repeat'),commentsPage([comment(2)],'repeat')],'LOYALFANS_COMMENTS_CONTINUATION_REPEATED'],
  ['repeated page',[commentsPage([comment(1)],'first'),commentsPage([comment(1)],'second')],'LOYALFANS_COMMENTS_PAGE_REPEATED'],
  ['duplicate comments',[commentsPage([comment(1),comment(2)],'first'),commentsPage([comment(2),comment(3)])],'LOYALFANS_COMMENTS_DUPLICATE'],
  ['malformed continuation',[commentsPage([comment(1)],{opaque:'object'})],'LOYALFANS_PAGINATION_MALFORMED'],
  ['missing terminal field',[{success:true,httpCode:200,comments:[comment(1)],page_token:'next'}],'LOYALFANS_PAGINATION_MALFORMED'],
  ['empty nonterminal',[commentsPage([],'next')],'LOYALFANS_COMMENTS_INCOMPLETE'],
  ['wrong post scope',[commentsPage([{...comment(1),post:{uid:'wrong-neutral-000000000000000001'}}])],'LOYALFANS_COMMENTS_SCOPE_INVALID']
])test(`${name} cannot attest completeness`,async()=>{
  const h=clientWithPages(pages);await assert.rejects(h.client.listComments({postUid}),error=>{
    assert.equal(error.code,code);assert.equal(error.message.includes('repeat'),false);return true;
  });
});

test('bounded traversal cannot return a challenge before terminal evidence',async()=>{
  const c=commentsContract();c.pagination.maxPages=1;
  const h=clientWithPages([commentsPage([comment(1)],'next')],c);
  await assert.rejects(h.client.listComments({postUid}),{code:'LOYALFANS_COMMENTS_INCOMPLETE'});assert.equal(h.calls(),1);
});

test('empty terminal page is a valid completion; comment bound is enforced',async()=>{
  const h=clientWithPages([commentsPage([comment(1)],'next'),commentsPage([])]);
  assert.equal((await h.client.listComments({postUid})).complete,true);
  const c=commentsContract();c.pagination.maxComments=1;
  await assert.rejects(clientWithPages([commentsPage([comment(1),comment(2)])],c).client.listComments({postUid}),{code:'LOYALFANS_COMMENTS_BOUND'});
});

test('observed terminal-only contract proves one page and rejects nonterminal results',async()=>{
  const c=commentsContract();c.pagination.continuation=[];
  assert.equal((await clientWithPages([commentsPage([comment(1)])],c).client.listComments({postUid})).complete,true);
  await assert.rejects(clientWithPages([commentsPage([comment(1)],'next')],c).client.listComments({postUid}),{code:'LOYALFANS_COMMENTS_CONTINUATION_CONTRACT_REQUIRED'});
});

test('no terminal inference from a null token while other required pagination marker is nonterminal',async()=>{
  const h=clientWithPages([{...commentsPage([comment(1)]),page_token_newer:'unhandled'}]);
  await assert.rejects(h.client.listComments({postUid}),{code:'LOYALFANS_PAGINATION_MALFORMED'});
});

for(const [name,change] of [
  ['missing method',c=>{delete c.method;}],['missing full path',c=>{c.pathTemplate='comments';}],
  ['cross-origin path',c=>{c.pathTemplate='//evil.example.test/{postUid}/comments';}],
  ['encoded traversal',c=>{c.pathTemplate='/%2e%2e/{postUid}/comments';}],
  ['missing terminal',c=>{delete c.pagination.terminal;}],['unbounded pages',c=>{c.pagination.maxPages=101;}],
  ['missing post scope',c=>{c.pathTemplate='/test/comments';}],
  ['credential query',c=>{c.query.Authorization='forbidden';}],
  ['GET body',c=>{c.payload={fixed:'value'};}],
  ['fixed and cursor collision',c=>{c.query.cursor='fixed';}],
  ['prototype path',c=>{c.pagination.continuation[0].requestPath=['__proto__'];}]
])test(`contract rejects ${name} before any request`,()=>{
  const c=commentsContract();change(c);assert.throws(()=>parseLoyalFansRequestContract(c,'comments'),{code:'LOYALFANS_REQUEST_CONTRACT_INVALID'});
});

test('query page builder supplies only explicitly configured page and size fields',()=>{
  const c=parseLoyalFansRequestContract(storeContract(),'catalogue');
  const r=buildLoyalFansContractRequest(c,{baseUrl:'https://www.loyalfans.com',page:2});
  assert.equal(r.method,'GET');assert.equal(r.body,undefined);
  assert.deepEqual(Object.fromEntries(r.url.searchParams),{'ngsw-bypass':'true',page:'2',limit:'12'});
});

test('body page builder leaves fixed fields intact and never derives request pagination from response',()=>{
  const c=parseLoyalFansRequestContract(storeContract('body'),'catalogue');
  const r=buildLoyalFansContractRequest(c,{baseUrl:'https://www.loyalfans.com',page:2});
  assert.equal(r.method,'POST');assert.equal(r.url.searchParams.has('page'),false);
  assert.deepEqual(JSON.parse(r.body),{scope:'neutral',pagination:{page:2,limit:12}});
});

function observedStoreClient({limit=36,total=77,transform=payload=>payload,...settings}={}){
  const requests=[];
  const client=new LoyalFansProviderClient({...options,catalogueCreatorSlug:'fleshlabstudios',catalogueLimit:limit,...settings,
    fetchImpl:async(url,request)=>{
      const body=JSON.parse(request.body);requests.push({url,request,body});
      return new Response(JSON.stringify(transform(storePage(Number(body.page),total,limit))),{status:200});
    }});
  return{client,requests};
}

test('observed page-2 Store request preserves POST path, bypass, slug, string page, numeric limit and video type',()=>{
  const h=observedStoreClient();const request=h.client.catalogueRequest(2);
  assert.equal(request.method,'POST');assert.equal(request.url.pathname,'/api/v2/videos-store');
  assert.deepEqual(Object.fromEntries(request.url.searchParams),{'ngsw-bypass':'true'});
  const body=JSON.parse(request.body);
  assert.deepEqual(body,{slug:'fleshlabstudios',type:'video',page:'2',limit:36});
  assert.equal(typeof body.page,'string');assert.equal(typeof body.limit,'number');
  assert.equal(typeof body.slug,'string');assert.equal(typeof body.type,'string');
  assert.equal(h.requests.length,0);
});

for(const [limit,total,pages] of [[36,77,3],[7,17,3],[12,116,10],[36,116,4],[36,2,1],[36,0,1]]){
  test(`Store response drives traversal with limit ${limit}, total ${total}, last_page ${pages}`,async()=>{
    const h=observedStoreClient({limit,total});const result=await h.client.listAllCatalogue();
    assert.equal(result.records.length,total);assert.equal(result.page_meta.last_page,pages);
    assert.equal(result.page_meta.per_page,limit);
    assert.deepEqual(h.requests.map(({body})=>body.page),Array.from({length:pages},(_,i)=>String(i+1)));
    assert.equal(h.requests.every(({body,request})=>body.limit===limit && request.method==='POST'),true);
  });
}

test('authoritative last_page governs traversal even when pages are not filled to per_page',async()=>{
  const requests=[];
  const client=new LoyalFansProviderClient({...options,catalogueCreatorSlug:'neutralcreator',catalogueLimit:36,
    fetchImpl:async(_url,request)=>{
      const page=Number(JSON.parse(request.body).page);requests.push(page);
      const from=page===1?0:3;const length=page===1?3:2;
      return new Response(JSON.stringify({success:true,httpCode:200,
        list:Array.from({length},(_,i)=>({uid:`neutral-product-${String(from+i).padStart(20,'0')}`})),
        page_meta:{total:5,per_page:36,current_page:page,last_page:2,from,to:from+length}}),{status:200});
    }});
  const result=await client.listAllCatalogue();assert.equal(result.records.length,5);
  assert.equal(result.page_meta.last_page,2);assert.deepEqual(requests,[1,2]);
});

test('server environment and config preserve configurable Store slug and numeric limit',()=>{
  const env={LOYALFANS_CREATOR_CATALOGUE_SLUG:'neutralcreator',LOYALFANS_CREATOR_CATALOGUE_LIMIT:'36'};
  const config=loadConfig(env);assert.equal(config.loyalFans.catalogueCreatorSlug,'neutralcreator');
  assert.equal(config.loyalFans.catalogueLimit,36);
  const client=LoyalFansProviderClient.fromRuntimeEnvironment(env);
  assert.deepEqual(JSON.parse(client.catalogueRequest(2).body),{slug:'neutralcreator',type:'video',page:'2',limit:36});
  assert.equal(client.enabled,false);
  assert.equal(loadConfig({}).loyalFans.catalogueLimit,36);
  assert.equal(JSON.parse(new LoyalFansProviderClient({...options,catalogueCreatorSlug:'neutralcreator'}).catalogueRequest(2).body).limit,36);
  assert.throws(()=>new LoyalFansProviderClient({...options,catalogueCreatorSlug:'neutralcreator',catalogueLimit:0}),{code:'LOYALFANS_REQUEST_CONTRACT_INVALID'});
});

test('observed default limit applies consistently through constructor, environment, config and contract factory',()=>{
  const env={LOYALFANS_CREATOR_CATALOGUE_SLUG:'neutralcreator'};
  const config=loadConfig(env);
  const clients=[new LoyalFansProviderClient({...options,catalogueCreatorSlug:'neutralcreator'}),
    LoyalFansProviderClient.fromRuntimeEnvironment(env),
    new LoyalFansProviderClient({...options,catalogueCreatorSlug:config.loyalFans.catalogueCreatorSlug,catalogueLimit:config.loyalFans.catalogueLimit})];
  for(const client of clients){
    const body=JSON.parse(client.catalogueRequest(2).body);
    assert.equal(body.limit,36);assert.equal(body.page,'2');
  }
  assert.equal(createObservedLoyalFansStoreContract({creatorSlug:'neutralcreator'}).pagination.pageSize.value,36);
  assert.equal(new LoyalFansProviderClient().catalogueRequestContract,null);
  assert.throws(()=>new LoyalFansProviderClient().catalogueRequest(1),{code:'LOYALFANS_CATALOGUE_NOT_CONFIGURED'});
  const overridden=loadConfig({...env,LOYALFANS_CREATOR_CATALOGUE_LIMIT:'48'});
  assert.equal(overridden.loyalFans.catalogueLimit,48);
  assert.equal(JSON.parse(LoyalFansProviderClient.fromRuntimeEnvironment({...env,LOYALFANS_CREATOR_CATALOGUE_LIMIT:'48'}).catalogueRequest(2).body).limit,48);
});

test('response page_meta remains authoritative when its per_page differs from default request limit',async()=>{
  const requests=[];
  const client=new LoyalFansProviderClient({...options,catalogueCreatorSlug:'neutralcreator',fetchImpl:async(_url,request)=>{
    const body=JSON.parse(request.body);requests.push(body);
    return new Response(JSON.stringify(storePage(Number(body.page),17,7)),{status:200});
  }});
  const result=await client.listAllCatalogue();
  assert.equal(requests.every(body=>body.limit===36),true);
  assert.deepEqual(requests.map(body=>body.page),['1','2','3']);
  assert.deepEqual(result.page_meta,{total:17,per_page:7,last_page:3});
  assert.equal(result.records.length,17);
});

test('explicit observed JSON Store contract supports string pagination and adjustable limit',()=>{
  const contract=createObservedLoyalFansStoreContract({creatorSlug:'neutralcreator',limit:48,maxPages:20,maxItems:4000});
  const client=new LoyalFansProviderClient({...options,catalogueRequestContract:JSON.stringify(contract)});
  const body=JSON.parse(client.catalogueRequest(2).body);
  assert.equal(body.page,'2');assert.equal(body.limit,48);
  assert.equal(client.catalogueRequestContract.pagination.maxPages,20);
  for(const change of [c=>{c.pagination.page.type='integer';},c=>{c.pagination.pageSize.value='36';},
    c=>{c.payload.type='other';},c=>{c.method='GET';},c=>{c.pagination.maxItems=0;}]){
    const bad=structuredClone(contract);change(bad);
    assert.throws(()=>parseLoyalFansRequestContract(bad,'catalogue'),{code:'LOYALFANS_REQUEST_CONTRACT_INVALID'});
  }
});

for(const [name,transform,code] of [
  ['repeated page',p=>{if(p.page_meta.current_page===2)p.page_meta.current_page=1;return p;},'LOYALFANS_RESPONSE_VALIDATION_FAILED'],
  ['page regression',p=>{if(p.page_meta.current_page===3)p.page_meta.current_page=1;return p;},'LOYALFANS_RESPONSE_VALIDATION_FAILED'],
  ['requested/returned mismatch',p=>{if(p.page_meta.current_page===2)p.page_meta.current_page=3;return p;},'LOYALFANS_RESPONSE_VALIDATION_FAILED'],
  ['duplicate UID',p=>{if(p.page_meta.current_page===2)p.list[0].uid=storePage(1,77,36).list[0].uid;return p;},'REPEATED_LOYALFANS_CATALOGUE_ITEM'],
  ['impossible last_page',p=>{p.page_meta.last_page=0;return p;},'LOYALFANS_RESPONSE_VALIDATION_FAILED'],
  ['changing last_page',p=>{if(p.page_meta.current_page===2)p.page_meta.last_page=4;return p;},'INCONSISTENT_LOYALFANS_CATALOGUE_PAGES'],
  ['malformed page_meta',p=>{p.page_meta.current_page='1';return p;},'LOYALFANS_RESPONSE_VALIDATION_FAILED'],
  ['success false',p=>{p.success=false;return p;},'LOYALFANS_RESPONSE_VALIDATION_FAILED'],
  ['range gap',p=>{if(p.page_meta.current_page===2){p.page_meta.from++;p.page_meta.to++;}return p;},'INCONSISTENT_LOYALFANS_CATALOGUE_PAGES']
])test(`observed Store fails closed on ${name}`,async()=>{
  const h=observedStoreClient({transform});await assert.rejects(h.client.listAllCatalogue(),{code});
});

for(const status of [401,403,419,500])test(`observed Store HTTP ${status} rejects a valid-looking envelope`,async()=>{
  const client=new LoyalFansProviderClient({...options,catalogueCreatorSlug:'neutralcreator',catalogueLimit:36,
    fetchImpl:async()=>new Response(JSON.stringify(storePage(1,1,36)),{status})});
  await assert.rejects(client.listAllCatalogue(),{code:status===500?'LOYALFANS_REQUEST_FAILED':'LOYALFANS_REAUTH_REQUIRED'});
});

test('observed Store enforces item and page bounds without further requests',async()=>{
  for(const bounds of [{maxItems:30},{maxPages:2}]){
    const h=observedStoreClient();await assert.rejects(h.client.listAllCatalogue(bounds),{code:'INCOMPLETE_LOYALFANS_CATALOGUE'});
    assert.equal(h.requests.length,1);
  }
});

for(const field of ['total','per_page','current_page','last_page','from','to'])test(`observed Store rejects malformed ${field}`,async()=>{
  for(const value of [undefined,'1',null,1.5,Number.MAX_SAFE_INTEGER+1]){
    const h=observedStoreClient({transform:payload=>{payload.page_meta[field]=value;return payload;}});
    await assert.rejects(h.client.listAllCatalogue(),{code:'LOYALFANS_RESPONSE_VALIDATION_FAILED'});
    assert.equal(h.requests.length,1);
  }
});

test('different declared per_page during one traversal fails safely rather than skipping products',async()=>{
  const h=observedStoreClient({transform:payload=>{
    if(payload.page_meta.current_page===2)payload.page_meta.per_page=48;
    return payload;
  }});
  await assert.rejects(h.client.listAllCatalogue(),{code:'INCONSISTENT_LOYALFANS_CATALOGUE_PAGES'});
  assert.equal(h.requests.length,2);
});

for(const location of ['query','body'])test(`configured ${location} store pagination traverses 10 pages / 116 exact IDs`,async()=>{
  const requests=[];
  const client=new LoyalFansProviderClient({...options,catalogueRequestContract:storeContract(location),fetchImpl:async(url,request)=>{
    const page=location==='query'?Number(new URL(url).searchParams.get('page')):JSON.parse(request.body).pagination.page;
    requests.push(page);return new Response(JSON.stringify(storePage(page)),{status:200});
  }});
  const result=await client.listAllCatalogue();assert.equal(result.records.length,116);
  assert.deepEqual(requests,[1,2,3,4,5,6,7,8,9,10]);assert.equal(result.page_meta.last_page,10);
});

for(const [name,change,code] of [
  ['page repetition',()=>storePage(1),'LOYALFANS_RESPONSE_VALIDATION_FAILED'],
  ['missing page_meta',p=>{delete p.page_meta;return p;},'LOYALFANS_RESPONSE_VALIDATION_FAILED'],
  ['last_page mismatch',p=>{p.page_meta.last_page=9;return p;},'INCONSISTENT_LOYALFANS_CATALOGUE_PAGES'],
  ['duplicate identities',p=>{p.list=storePage(1).list;return p;},'REPEATED_LOYALFANS_CATALOGUE_ITEM']
])test(`store rejects ${name}`,async()=>{
  const client=new LoyalFansProviderClient({...options,catalogueRequestContract:storeContract(),fetchImpl:async(url)=>{
    const page=Number(new URL(url).searchParams.get('page'));
    const payload=page===1?storePage(1):change(storePage(page));
    return new Response(JSON.stringify(payload),{status:200});
  }});
  await assert.rejects(client.listAllCatalogue(),{code});
});

test('store bound is configured and missing request-page shape is rejected before network',async()=>{
  const c=storeContract();c.pagination.maxPages=1;let calls=0;
  const client=new LoyalFansProviderClient({...options,catalogueRequestContract:c,fetchImpl:async()=>{
    calls++;return new Response(JSON.stringify(storePage(1)),{status:200});
  }});
  await assert.rejects(client.listAllCatalogue(),{code:'INCOMPLETE_LOYALFANS_CATALOGUE'});assert.equal(calls,1);
  delete c.pagination.page;assert.throws(()=>parseLoyalFansRequestContract(c,'catalogue'),{code:'LOYALFANS_REQUEST_CONTRACT_INVALID'});
});

test('runtime configuration loads the explicit JSON contracts without production values',()=>{
  const env={LOYALFANS_CREATOR_COMMENTS_REQUEST_CONTRACT_JSON:JSON.stringify(commentsContract()),
    LOYALFANS_CREATOR_CATALOGUE_REQUEST_CONTRACT_JSON:JSON.stringify(storeContract())};
  const config=loadConfig(env);
  const client=new LoyalFansProviderClient({...options,commentsRequestContract:config.loyalFans.commentsRequestContract,
    catalogueRequestContract:config.loyalFans.catalogueRequestContract});
  assert.equal(client.canAttestCompleteComments(),true);
  assert.equal(loadConfig({}).loyalFans.commentsRequestContract,null);
});

test('authentication expiry on a later comment page discards all partial evidence',async()=>{
  let calls=0;
  const client=new LoyalFansProviderClient({...options,commentsRequestContract:commentsContract(),fetchImpl:async()=>{
    calls++;return calls===1?new Response(JSON.stringify(commentsPage([comment(1)],'next')),{status:200}):new Response('',{status:401});
  }});
  await assert.rejects(client.listComments({postUid}),{code:'LOYALFANS_REAUTH_REQUIRED'});
  assert.equal(client.status().status,'AUTH_EXPIRED');assert.equal(calls,2);
});

test('noninteger continuation and body target collision are rejected',async()=>{
  const c=commentsContract();c.pagination.continuation[0].type='integer';
  await assert.rejects(clientWithPages([commentsPage([comment(1)],1.5)],c).client.listComments({postUid}),{code:'LOYALFANS_PAGINATION_MALFORMED'});
  const store=storeContract('body');store.payload.pagination={page:2};
  assert.throws(()=>parseLoyalFansRequestContract(store,'catalogue'),{code:'LOYALFANS_REQUEST_CONTRACT_INVALID'});
});

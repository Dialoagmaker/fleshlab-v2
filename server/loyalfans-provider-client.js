import { normalizeLoyalFansTransaction } from './loyalfans-transactions.js';
import { fetchAllLoyalFansCataloguePages, validateLoyalFansCataloguePage } from './loyalfans-catalogue.js';
import { projectLoyalFansCreatorLedgerRecord } from './loyalfans-fulfillment-adapter.js';
import { parseLoyalFansRequestContract,buildLoyalFansContractRequest,traverseLoyalFansComments,
  createObservedLoyalFansStoreContract,LOYALFANS_OBSERVED_STORE_DEFAULT_LIMIT,
  LOYALFANS_OBSERVED_INITIAL_COMMENTS_CONTRACT,isObservedInitialCommentsContract,isTerminalLoyalFansCommentList } from './loyalfans-request-contracts.js';

const API_BASE = 'https://www.loyalfans.com';
const TRANSACTIONS_PATH = '/api/v2/funds/transactions-history/list?ngsw-bypass=true';
const TRANSACTIONS_URL = `${API_BASE}${TRANSACTIONS_PATH}`;
const TRANSACTIONS_ORIGIN = 'https://www.loyalfans.com';
const TRANSACTIONS_REFERER = 'https://www.loyalfans.com/settings/earnings/statements';
const API_VERSION = '3.4.4';
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const UID = /^[A-Za-z0-9_-]{16,255}$/;
const STRUCTURE_MAX_DEPTH = 3;
const STRUCTURE_MAX_KEYS = 40;

function invalid(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function failed(code, message, diagnostics) {
  const error = invalid(code, message);
  error.diagnostics = Object.freeze(diagnostics);
  return error;
}

function safeText(value, max = 240) {
  if (typeof value !== 'string') return null;
  return value
    .replace(/https?:\/\/[^\s<>"']+/gi,'[REDACTED_URL]')
    .replace(/Bearer\s+[^\s,;]+/gi, 'Bearer [REDACTED]')
    .replace(/\b(NEXOSESSION|XSRF-TOKEN|loyalXlm3)(\s*[=:])\s*[^\s;,]+/gi, (_match, name, separator) => `${name}${separator}[REDACTED]`)
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, max) || null;
}

function requestDiagnostics(stage, response = null, requestUrl = TRANSACTIONS_URL) {
  return {
    failure_stage: stage,
    request_url: requestUrl,
    request_path: '/api/v2/funds/transactions-history/list',
    request_method: 'POST',
    http_status: response ? response.status : null,
    http_status_text: response ? safeText(response.statusText, 120) : null,
    response_content_type: response ? safeText(response.headers.get('content-type') || '', 120) : null
  };
}

function providerErrorDetails(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
  const directError = typeof payload.error === 'string' ? payload.error : null;
  const nested = payload.error && typeof payload.error === 'object' && !Array.isArray(payload.error) ? payload.error : {};
  return {
    provider_error_code: safeText(String(payload.code ?? nested.code ?? ''), 120),
    provider_error_message: safeText(payload.message || directError || nested.message || '', 240)
  };
}

function integer(value, field, { min = 1, max = 100 } = {}) {
  const result = Number(value);
  if (!Number.isInteger(result) || result < min || result > max) throw invalid('INVALID_LOYALFANS_REQUEST', `${field} must be an integer between ${min} and ${max}.`);
  return result;
}

function date(value, field) {
  if (typeof value !== 'string' || !DATE.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw invalid('INVALID_LOYALFANS_REQUEST', `${field} must be an ISO date.`);
  }
  return value;
}

function responseRecords(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || payload.success !== true || Number(payload.httpCode) !== 200) {
    throw invalid('INVALID_LOYALFANS_RESPONSE', 'The provider response does not match the confirmed transaction-history envelope.');
  }
  const pageMeta = payload.page_meta;
  for (const key of ['total', 'per_page', 'current_page', 'last_page', 'from', 'to']) {
    if (!Number.isInteger(Number(pageMeta?.[key]))) throw invalid('INVALID_LOYALFANS_RESPONSE', `Missing page_meta.${key}.`);
  }
  if (Object.hasOwn(payload, 'transactions')) {
    if (!Array.isArray(payload.transactions)) throw invalid('INVALID_LOYALFANS_RESPONSE', 'transactions must be an array of date groups.');
    const records = [];
    for (const group of payload.transactions) {
      if (!group || typeof group !== 'object' || Array.isArray(group) || typeof group.dateKey !== 'string' || !Array.isArray(group.transactions)) {
        throw invalid('INVALID_LOYALFANS_RESPONSE', 'Each transaction date group requires dateKey and transactions.');
      }
      records.push(...group.transactions);
    }
    return { records, page_meta: pageMeta };
  }

  // Explicit compatibility for the earlier flat response fixtures only.
  const records = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.records) ? payload.records : null;
  if (!records) throw invalid('INVALID_LOYALFANS_RESPONSE', 'The provider response does not contain transaction records.');
  return { records, page_meta: pageMeta };
}

/**
 * Value-free diagnostic for local validation failures. It intentionally emits
 * only JSON shape: key names, types, and array lengths. Response values never
 * enter this representation.
 */
export function safeResponseShape(value, depth = 0) {
  if (value === null) return { type: 'null' };
  if (Array.isArray(value)) {
    const summary = { type: 'array', length: value.length };
    if (value.length > 0 && depth < STRUCTURE_MAX_DEPTH) summary.first_item = safeResponseShape(value[0], depth + 1);
    return summary;
  }
  if (typeof value !== 'object') return { type: typeof value };

  const keys = Object.keys(value).slice(0, STRUCTURE_MAX_KEYS);
  const summary = { type: 'object', keys };
  if (depth < STRUCTURE_MAX_DEPTH) {
    summary.properties = Object.fromEntries(keys.map(key => [key, safeResponseShape(value[key], depth + 1)]));
  }
  return summary;
}

/**
 * Creator-account web API client. Authentication belongs to a dedicated
 * FLESHLAB-controlled account and is supplied only by server configuration.
 * This is not OAuth or an official LoyalFans API.
 */
export class LoyalFansProviderClient {
  constructor({
    fetchImpl = globalThis.fetch,
    baseUrl = API_BASE,
    apiVersion = API_VERSION,
    cookieHeader = '',
    xsrfToken = '',
    bearerToken = '',
    userAgent = '',
    commentPathTemplate = '',
    cataloguePath = '',
    cataloguePageParameter = '',
    commentsRequestContract = null,
    catalogueRequestContract = null,
    catalogueCreatorSlug = '',
    catalogueLimit = LOYALFANS_OBSERVED_STORE_DEFAULT_LIMIT,
    enabled = false,
    environment = process.env.NODE_ENV || 'development',
    timeoutMs = 10_000
  } = {}) {
    if (typeof fetchImpl !== 'function') throw invalid('LOYALFANS_CLIENT_UNAVAILABLE', 'A fetch implementation is required.');
    this.fetch = fetchImpl;
    this.baseUrl = String(baseUrl).replace(/\/$/, '');
    this.apiVersion = String(apiVersion);
    this.cookieHeader = String(cookieHeader || '');
    this.xsrfToken = String(xsrfToken || '');
    this.bearerToken = String(bearerToken || '');
    this.userAgent = String(userAgent || '');
    this.commentPathTemplate = String(commentPathTemplate || '');
    this.cataloguePath = String(cataloguePath || '').trim();
    this.cataloguePageParameter = String(cataloguePageParameter || '').trim();
    this.commentsRequestContract=parseLoyalFansRequestContract(commentsRequestContract ||
      (!commentPathTemplate?LOYALFANS_OBSERVED_INITIAL_COMMENTS_CONTRACT:null),'comments');
    this.lastObservedCommentCompleteness=null;
    this.catalogueRequestContract=parseLoyalFansRequestContract(catalogueRequestContract,'catalogue');
    if(!this.catalogueRequestContract && catalogueCreatorSlug!==''){
      this.catalogueRequestContract=createObservedLoyalFansStoreContract({creatorSlug:catalogueCreatorSlug,limit:catalogueLimit});
    }
    this.enabled = Boolean(enabled);
    this.environment = String(environment || 'development').toLowerCase();
    this.timeoutMs = integer(timeoutMs, 'timeoutMs', { min: 100, max: 60_000 });
    this.connectionState = 'UPSTREAM_ERROR';
  }

  static fromRuntimeEnvironment(env = process.env, options = {}) {
    return new LoyalFansProviderClient({
      ...options,
      environment: env.NODE_ENV || 'development',
      enabled: env.LOYALFANS_PROVIDER_CLIENT_ENABLED === 'true',
      cookieHeader: env.LOYALFANS_CREATOR_COOKIE_HEADER || '',
      xsrfToken: env.LOYALFANS_XSRF_TOKEN || '',
      bearerToken: env.LOYALFANS_CREATOR_BEARER_TOKEN || '',
      userAgent: env.LOYALFANS_CREATOR_USER_AGENT || '',
      commentPathTemplate: env.LOYALFANS_CREATOR_COMMENTS_PATH_TEMPLATE || '',
      cataloguePath: env.LOYALFANS_CREATOR_CATALOGUE_PATH || '',
      cataloguePageParameter: env.LOYALFANS_CREATOR_CATALOGUE_PAGE_PARAMETER || '',
      commentsRequestContract:env.LOYALFANS_CREATOR_COMMENTS_REQUEST_CONTRACT_JSON || null,
      catalogueRequestContract:env.LOYALFANS_CREATOR_CATALOGUE_REQUEST_CONTRACT_JSON || null,
      catalogueCreatorSlug:env.LOYALFANS_CREATOR_CATALOGUE_SLUG || '',
      catalogueLimit:env.LOYALFANS_CREATOR_CATALOGUE_LIMIT?Number(env.LOYALFANS_CREATOR_CATALOGUE_LIMIT):LOYALFANS_OBSERVED_STORE_DEFAULT_LIMIT
    });
  }

  assertReady() {
    if (!this.enabled) {
      throw invalid('LOYALFANS_CLIENT_DISABLED', 'The LoyalFans provider client is disabled.');
    }
    if (!this.cookieHeader || !this.xsrfToken || !this.bearerToken || (this.environment === 'production' && !this.userAgent)) {
      throw invalid('LOYALFANS_AUTH_NOT_CONFIGURED', 'The observed runtime creator authentication bundle is incomplete.');
    }
    if (this.connectionState === 'AUTH_EXPIRED') {
      throw invalid('LOYALFANS_REAUTH_REQUIRED', 'The LoyalFans creator credential requires renewal.');
    }
  }

  status() {
    if (!this.enabled || !this.cookieHeader || !this.xsrfToken || !this.bearerToken || (this.environment === 'production' && !this.userAgent)) return { status: 'NOT_CONFIGURED' };
    return { status: this.connectionState };
  }

  commentsConfigured() {
    return this.status().status !== 'NOT_CONFIGURED' &&
      (Boolean(this.commentsRequestContract) ||
      (/^\/api\/v2\/[A-Za-z0-9_/{}/-]+\/comments\?ngsw-bypass=true$/.test(this.commentPathTemplate) &&
      this.commentPathTemplate.split('{postUid}').length === 2));
  }

  supportsCompleteComments() {
    return this.commentsConfigured() && this.commentsRequestContract?.observed===true;
  }

  canAttestCompleteComments(response) {
    // Availability of the observed request allows onboarding to start. Actual
    // first-page attestation additionally requires a successful terminal response.
    if(!this.commentsConfigured() || this.commentsRequestContract?.observed!==true)return false;
    if(isObservedInitialCommentsContract(this.commentsRequestContract)){
      if(response!==undefined)return isTerminalLoyalFansCommentList(response);
      return this.lastObservedCommentCompleteness===true;
    }
    return true;
  }

  catalogueRequest(page) {
    if(this.catalogueRequestContract)return buildLoyalFansContractRequest(this.catalogueRequestContract,{baseUrl:this.baseUrl,page});
    return{url:this.catalogueRequestUrl(page),method:'GET'};
  }

  catalogueRequestUrl(page) {
    if (!this.cataloguePath) throw invalid('LOYALFANS_CATALOGUE_NOT_CONFIGURED', 'The observed creator catalogue path is not configured.');
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(this.cataloguePath) || this.cataloguePath.startsWith('//') || this.cataloguePath.includes('#') || this.cataloguePath.includes('\\')) {
      throw invalid('LOYALFANS_CATALOGUE_PATH_INVALID', 'The configured creator catalogue path must be a relative path.');
    }
    const relative = this.cataloguePath.replace(/^\/+/, '');
    if (relative.split(/[/?]/).some(part => part === '..')) throw invalid('LOYALFANS_CATALOGUE_PATH_INVALID', 'The configured creator catalogue path is invalid.');
    let url;
    try { url = new URL(relative, `${this.baseUrl}/`); }
    catch { throw invalid('LOYALFANS_CATALOGUE_PATH_INVALID', 'The configured creator catalogue path is invalid.'); }
    if (url.origin !== new URL(this.baseUrl).origin) throw invalid('LOYALFANS_CATALOGUE_PATH_INVALID', 'The configured creator catalogue path is invalid.');
    if ([...url.searchParams.keys()].some(key => /^(authorization|cookie|token|auth|signature|sig|session|xsrf)$/i.test(key))) {
      throw invalid('LOYALFANS_CATALOGUE_PATH_INVALID', 'The configured creator catalogue path must not contain credential parameters.');
    }
    if (page > 1) {
      if (!/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(this.cataloguePageParameter)) {
        throw invalid('LOYALFANS_CATALOGUE_PAGINATION_NOT_CONFIGURED', 'Configure the observed creator catalogue page parameter before requesting later pages.');
      }
      url.searchParams.set(this.cataloguePageParameter, String(page));
    }
    return url;
  }

  async listCataloguePage({ page = 1 } = {}) {
    this.assertReady();
    if (!Number.isInteger(page) || page < 1 || page > 100) throw invalid('INVALID_LOYALFANS_REQUEST', 'Catalogue page must be an integer from 1 to 100.');
    const request = this.catalogueRequest(page);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const headers = { accept: 'application/json, text/plain, */*', 'x-api-version': this.apiVersion,
        'x-xsrf-token': this.xsrfToken, cookie: this.cookieHeader,
        authorization: `Bearer ${this.bearerToken}`, origin: new URL(this.baseUrl).origin };
      if (this.userAgent) headers['user-agent'] = this.userAgent;
      if(request.body!==undefined)headers['content-type']='application/json';
      const response = await this.fetch(request.url.toString(), { method:request.method,
        ...(request.body!==undefined?{body:request.body}:{}),headers,signal:controller.signal,redirect:'error' });
      if ([401, 403, 419].includes(response.status)) {
        this.connectionState = 'AUTH_EXPIRED';
        throw invalid('LOYALFANS_REAUTH_REQUIRED', 'The LoyalFans creator credential requires renewal.');
      }
      if (!response.ok) {
        this.connectionState = 'UPSTREAM_ERROR';
        throw invalid('LOYALFANS_REQUEST_FAILED', 'LoyalFans creator catalogue is unavailable.');
      }
      let payload;
      try { payload = await response.json(); }
      catch {
        this.connectionState = 'UPSTREAM_ERROR';
        throw invalid('LOYALFANS_JSON_PARSE_FAILED', 'LoyalFans creator catalogue could not be parsed.');
      }
      if (payload?.success === false && /(?:token|session|auth|expired|refresh)/i.test(String(payload?.message || payload?.error || ''))) {
        this.connectionState = 'AUTH_EXPIRED';
        throw invalid('LOYALFANS_REAUTH_REQUIRED', 'The LoyalFans creator credential requires renewal.');
      }
      try { validateLoyalFansCataloguePage(payload, page); }
      catch {
        this.connectionState = 'AUTH_FAILED';
        throw invalid('LOYALFANS_RESPONSE_VALIDATION_FAILED', 'LoyalFans creator catalogue failed validation.');
      }
      this.connectionState = 'CONNECTED';
      return payload;
    } catch (error) {
      if (error?.code?.startsWith('LOYALFANS_')) throw error;
      this.connectionState = 'UPSTREAM_ERROR';
      throw invalid(error?.name === 'AbortError' ? 'LOYALFANS_REQUEST_TIMEOUT' : 'LOYALFANS_NETWORK_FAILED',
        'LoyalFans creator catalogue could not be retrieved.');
    } finally { clearTimeout(timer); }
  }

  async listAllCatalogue({ maxPages = 100, maxItems = 10000 } = {}) {
    this.assertReady();
    if(!Number.isInteger(maxPages) || maxPages<1 || maxPages>100)throw invalid('INVALID_LOYALFANS_REQUEST','Invalid catalogue page bound.');
    return fetchAllLoyalFansCataloguePages(({ page }) => this.listCataloguePage({ page }),
      { maxPages:Math.min(maxPages,this.catalogueRequestContract?.pagination.maxPages || 100),
        maxItems:Math.min(maxItems,this.catalogueRequestContract?.pagination.maxItems || 10000) });
  }

  /**
   * Reacquire a temporary full-video source from a fresh, authenticated Store
   * traversal. The URL is deliberately non-enumerable and is never returned
   * through an API response or persisted by this client.
   */
  async getCatalogueFullVideoSource({postUid,videoUid,dateFrom,dateTo=new Date().toISOString().slice(0,10)}={}) {
    if(!UID.test(postUid||'')||!UID.test(videoUid||''))throw invalid('LOYALFANS_FULL_VIDEO_ID_REQUIRED','Exact post and media UIDs are required.');
    const capture=await this.listAllCatalogue();
    const matches=capture.records.filter(item=>item?.uid===postUid);
    if(matches.length!==1)throw invalid(matches.length?'LOYALFANS_CATALOGUE_ITEM_AMBIGUOUS':'LOYALFANS_CATALOGUE_ITEM_NOT_FOUND',
      'The exact LoyalFans catalogue item could not be resolved.');
    const video=matches[0]?.video_object;
    if(video?.uid!==videoUid)throw invalid('LOYALFANS_MEDIA_UID_MISMATCH','The exact catalogue media UID changed.');
    let videoUrl=typeof video?.video_url==='string'&&video.video_url.trim()?video.video_url:null;
    if(!videoUrl){
      if(typeof dateFrom!=='string'||!DATE.test(dateFrom)||!DATE.test(dateTo)||dateFrom>dateTo)throw invalid('LOYALFANS_FULL_VIDEO_SOURCE_UNAVAILABLE',
        'The fresh authenticated Store response has no full-video source and no safe creator-ledger date range is available.');
      const history=await this.listAllFulfillmentTransactions({dateFrom,dateTo});
      if(history?.authority!=='creator_authenticated'||history.complete!==true||!Array.isArray(history.transactions))throw invalid('LOYALFANS_INCOMPLETE_HISTORY',
        'The bounded authenticated creator ledger was incomplete.');
      const candidates=history.transactions.filter(entry=>entry?.id&&entry.type==='clip_store'&&entry.attached_to?.uid===postUid&&
        entry.attached_to?.video_object?.uid===videoUid&&typeof entry.attached_to.video_object.video_url==='string'&&entry.attached_to.video_object.video_url);
      const resourceKeys=new Set(candidates.map(entry=>{
        try{const url=new URL(entry.attached_to.video_object.video_url);return `${url.protocol}//${url.host}${url.pathname}`;}
        catch{return 'invalid';}
      }));
      if(candidates.length===0||resourceKeys.size!==1||resourceKeys.has('invalid'))throw invalid(candidates.length?
        'LOYALFANS_FULL_VIDEO_SOURCE_AMBIGUOUS':'LOYALFANS_FULL_VIDEO_SOURCE_UNAVAILABLE',
        'The exact creator-ledger media source could not be resolved.');
      videoUrl=candidates[0].attached_to.video_object.video_url;
    }
    const source={postUid,videoUid,mime:typeof video.mime==='string'?video.mime:null,
      duration:video.duration==null?null:video.duration,
      dimensions:video.size&&typeof video.size==='object'?{width:video.size.width,height:video.size.height}:null};
    Object.defineProperty(source,'sourceUrl',{value:videoUrl,enumerable:false});
    return source;
  }

  async retrieveOwnedOriginal({ postUid, videoUid } = {}) {
    this.assertReady();
    if (!UID.test(postUid || '') || !UID.test(videoUid || '')) {
      throw invalid('LOYALFANS_ORIGINAL_MEDIA_ID_REQUIRED', 'Exact LoyalFans post and video UIDs are required.');
    }
    // This legacy standalone lookup has no captured endpoint. D2 instead uses
    // the confirmed Store request and, when its source is absent, an exact
    // bounded creator-ledger record through getCatalogueFullVideoSource().
    throw invalid('LOYALFANS_ORIGINAL_MEDIA_NOT_SUPPORTED', 'Standalone original lookup is unsupported; use creator-ledger media fulfillment.');
  }

  async listComments({ postUid } = {}) {
    this.assertReady();
    if (!this.commentsConfigured() || !UID.test(postUid || '')) {
      throw invalid('LOYALFANS_COMMENTS_NOT_CONFIGURED', 'The post-scoped creator comment request is not configured.');
    }
    if(this.commentsRequestContract){
      try{
        const result=await traverseLoyalFansComments(({page,continuation})=>this.listObservedCommentsPage({postUid,page,continuation}),
          this.commentsRequestContract,postUid);
        if(isObservedInitialCommentsContract(this.commentsRequestContract))this.lastObservedCommentCompleteness=true;
        return result;
      }catch(error){
        if(isObservedInitialCommentsContract(this.commentsRequestContract))this.lastObservedCommentCompleteness=false;
        if(this.connectionState!=='AUTH_EXPIRED' && error?.code!=='LOYALFANS_COMMENTS_CONTINUATION_CONTRACT_REQUIRED')this.connectionState='UPSTREAM_ERROR';
        throw invalid(/^LOYALFANS_[A-Z_]+$/.test(error?.code || '')?error.code:'LOYALFANS_COMMENTS_INCOMPLETE',
          error?.code==='LOYALFANS_COMMENTS_CONTINUATION_CONTRACT_REQUIRED'
            ?'The observed comment list requires an unconfigured continuation request contract.'
            :'The complete post-scoped creator comments could not be verified.');
      }
    }
    const path = this.commentPathTemplate.replace('{postUid}',encodeURIComponent(postUid));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(),this.timeoutMs);
    try {
      const headers = { accept:'application/json, text/plain, */*', 'x-api-version':this.apiVersion,
        'x-xsrf-token':this.xsrfToken, cookie:this.cookieHeader,
        authorization:`Bearer ${this.bearerToken}`, origin:TRANSACTIONS_ORIGIN };
      if (this.userAgent) headers['user-agent'] = this.userAgent;
      const response = await this.fetch(`${this.baseUrl}${path}`,{method:'GET',headers,signal:controller.signal,redirect:'error'});
      if ([401,403,419].includes(response.status)) {
        this.connectionState = 'AUTH_EXPIRED';
        throw invalid('LOYALFANS_REAUTH_REQUIRED','The LoyalFans creator credential requires renewal.');
      }
      if (!response.ok) {
        this.connectionState = 'UPSTREAM_ERROR';
        throw invalid('LOYALFANS_REQUEST_FAILED','LoyalFans creator comments are unavailable.');
      }
      let payload;
      try { payload = await response.json(); }
      catch {
        this.connectionState = 'UPSTREAM_ERROR';
        throw invalid('LOYALFANS_JSON_PARSE_FAILED','LoyalFans creator comments could not be parsed.');
      }
      if (!payload || payload.success !== true || Number(payload.httpCode) !== 200 || !Array.isArray(payload.comments) ||
          !['page_token','page_token_newer','token_id','token_newer_id'].every(key => Object.hasOwn(payload,key))) {
        this.connectionState = 'AUTH_FAILED';
        throw invalid('LOYALFANS_RESPONSE_VALIDATION_FAILED','LoyalFans creator comments failed validation.');
      }
      this.connectionState = 'CONNECTED';
      // This legacy GET path is not the observed normal POST list contract.
      // Only the observed POST/terminal rules can attest list completeness.
      return { authority:'creator_authenticated',scope_post_uid:postUid,complete:false,comments:payload.comments };
    } catch(error) {
      if (error?.code?.startsWith('LOYALFANS_')) throw error;
      this.connectionState = 'UPSTREAM_ERROR';
      throw invalid(error?.name === 'AbortError'?'LOYALFANS_REQUEST_TIMEOUT':'LOYALFANS_NETWORK_FAILED',
        'LoyalFans creator comments could not be retrieved.');
    } finally { clearTimeout(timer); }
  }

  async listObservedCommentsPage({postUid,page,continuation}) {
    this.assertReady();
    const request=buildLoyalFansContractRequest(this.commentsRequestContract,{baseUrl:this.baseUrl,postUid,page,continuation});
    return this.fetchCreatorCommentsRequest(request);
  }

  // Targeted lookup is never a list-completeness proof and never updates list attestation.
  async lookupComment({postUid,commentUid}={}) {
    this.assertReady();
    if(!UID.test(postUid || '') || !UID.test(commentUid || ''))throw invalid('LOYALFANS_COMMENTS_SCOPE_INVALID','Exact post and comment UIDs are required.');
    const payload=await this.fetchCreatorCommentsRequest({method:'POST',
      url:new URL('/api/v1/comments?ngsw-bypass=true',this.baseUrl),body:JSON.stringify({uid:postUid,uid_comment:commentUid})});
    if(payload?.success!==true || Number(payload.httpCode)!==200 || !Array.isArray(payload.comments))throw invalid('LOYALFANS_RESPONSE_VALIDATION_FAILED','Targeted creator comment response is invalid.');
    return{authority:'creator_authenticated',scope_post_uid:postUid,complete:false,lookup:'targeted',
      comments:payload.comments.filter(comment=>comment?.uid===commentUid && comment.parent?.uid===postUid)};
  }

  async fetchCreatorCommentsRequest(request) {
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),this.timeoutMs);
    try{
      const headers={accept:'application/json, text/plain, */*','x-api-version':this.apiVersion,
        'x-xsrf-token':this.xsrfToken,cookie:this.cookieHeader,authorization:`Bearer ${this.bearerToken}`,
        origin:new URL(this.baseUrl).origin};
      if(this.userAgent)headers['user-agent']=this.userAgent;
      if(request.body!==undefined)headers['content-type']='application/json';
      const response=await this.fetch(request.url.toString(),{method:request.method,
        ...(request.body!==undefined?{body:request.body}:{}),headers,signal:controller.signal,redirect:'error'});
      if([401,403,419].includes(response.status)){
        this.connectionState='AUTH_EXPIRED';throw invalid('LOYALFANS_REAUTH_REQUIRED','Creator authentication requires renewal.');
      }
      if(!response.ok)throw invalid('LOYALFANS_REQUEST_FAILED','Creator comments are unavailable.');
      let payload;
      try{payload=await response.json();}catch{throw invalid('LOYALFANS_JSON_PARSE_FAILED','Creator comments could not be parsed.');}
      if(payload?.success===false && /(?:token|session|auth|expired|refresh)/i.test(String(payload?.message || payload?.error || ''))){
        this.connectionState='AUTH_EXPIRED';throw invalid('LOYALFANS_REAUTH_REQUIRED','Creator authentication requires renewal.');
      }
      this.connectionState='CONNECTED';return payload;
    }catch(error){
      if(error?.code?.startsWith('LOYALFANS_'))throw error;
      throw invalid(error?.name==='AbortError'?'LOYALFANS_REQUEST_TIMEOUT':'LOYALFANS_NETWORK_FAILED','Creator comments are unavailable.');
    }finally{clearTimeout(timer);}
  }

  async listAllFulfillmentTransactions(range={}) {
    const history=await this.listAllTransactions({...range,fulfillment:true});
    return {...history,authority:'creator_authenticated',complete:true};
  }

  async listAllTransactions({ dateFrom, dateTo, observedAt = new Date().toISOString(),fulfillment=false } = {}) {
    const transactions = [];
    let lastPage = 1;
    let firstMeta;
    for (let page = 1; page <= 100; page += 1) {
      const result = await this.listTransactions({ dateFrom, dateTo, page, limit: 10, observedAt,fulfillment });
      const meta = result.page_meta;
      if(!firstMeta)firstMeta=meta;
      lastPage = Number(meta.last_page);
      if (!Number.isInteger(lastPage) || lastPage < 1 || lastPage > 100 || Number(meta.current_page) !== page ||
          Number(meta.per_page) < 1 || Number(meta.per_page) > 100 || Number(meta.total)<0 ||
          ['total','per_page','last_page'].some(key=>Number(meta[key])!==Number(firstMeta[key])) ||
          result.transactions.length>Number(meta.per_page)) {
        this.connectionState = 'UPSTREAM_ERROR';
        throw invalid('LOYALFANS_INCOMPLETE_HISTORY', 'Creator transaction history pagination is incomplete.');
      }
      transactions.push(...result.transactions);
      if (page === lastPage) {
        if (transactions.length !== Number(meta.total)) {
          this.connectionState = 'UPSTREAM_ERROR';
          throw invalid('LOYALFANS_INCOMPLETE_HISTORY', 'Creator transaction history count is incomplete.');
        }
        return { transactions, observed_at: observedAt };
      }
    }
    this.connectionState = 'UPSTREAM_ERROR';
    throw invalid('LOYALFANS_INCOMPLETE_HISTORY', 'Creator transaction history exceeds the bounded scan.');
  }

  async listTransactions({ dateFrom, dateTo, page = 1, limit = 10, withCalendarAddons = true, observedAt = null,fulfillment=false } = {}) {
    this.assertReady();
    const requestPayload = {
      page: integer(page, 'page'),
      limit: integer(limit, 'limit'),
      date_from: date(dateFrom, 'dateFrom'),
      date_to: date(dateTo, 'dateTo'),
      withCalendarAddons: Boolean(withCalendarAddons)
    };
    if (requestPayload.date_from > requestPayload.date_to) throw invalid('INVALID_LOYALFANS_REQUEST', 'dateFrom must be on or before dateTo.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const headers = {
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json',
        'x-api-version': this.apiVersion,
        'x-xsrf-token': this.xsrfToken,
        cookie: this.cookieHeader,
        authorization: `Bearer ${this.bearerToken}`,
        origin: TRANSACTIONS_ORIGIN,
        referer: TRANSACTIONS_REFERER
      };
      if (this.userAgent) headers['user-agent'] = this.userAgent;
      const requestUrl = `${this.baseUrl}${TRANSACTIONS_PATH}`;
      const response = await this.fetch(requestUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
        redirect: 'error'
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403 || response.status === 419) {
          this.connectionState = 'AUTH_EXPIRED';
          throw failed('LOYALFANS_REAUTH_REQUIRED', 'The LoyalFans creator credential requires renewal.', requestDiagnostics('auth', response, requestUrl));
        }
        this.connectionState = 'UPSTREAM_ERROR';
        const diagnostics = requestDiagnostics('http', response, requestUrl);
        if ((response.headers.get('content-type') || '').toLowerCase().includes('application/json')) {
          try {
            Object.assign(diagnostics, providerErrorDetails(await response.json()));
          } catch {
            // A failed HTTP response remains an HTTP failure even if its declared JSON is malformed.
          }
        }
        throw failed('LOYALFANS_REQUEST_FAILED', 'LoyalFans transaction history returned a non-success HTTP response.', diagnostics);
      }
      let responsePayload;
      try {
        responsePayload = await response.json();
      } catch {
        this.connectionState = 'UPSTREAM_ERROR';
        throw failed('LOYALFANS_JSON_PARSE_FAILED', 'LoyalFans transaction history response could not be parsed as JSON.', requestDiagnostics('json-parse', response, requestUrl));
      }
      if (responsePayload?.success === false && /(?:token|session|auth|expired|refresh)/i.test(String(responsePayload?.message || responsePayload?.error || ''))) {
        this.connectionState = 'AUTH_EXPIRED';
        throw failed('LOYALFANS_REAUTH_REQUIRED', 'The LoyalFans creator credential requires renewal.', requestDiagnostics('auth', response, requestUrl));
      }
      let parsed;
      let transactions;
      try {
        parsed = responseRecords(responsePayload);
        transactions = parsed.records.map(record => fulfillment?projectLoyalFansCreatorLedgerRecord(record)
          :normalizeLoyalFansTransaction(record, { observedAt }));
      } catch (error) {
        this.connectionState = 'AUTH_FAILED';
        throw failed('LOYALFANS_RESPONSE_VALIDATION_FAILED', 'LoyalFans transaction history response failed validation.', {
          ...requestDiagnostics('validation', response, requestUrl),
          validation_code: error.code || null,
          response_shape: fulfillment?{type:typeof responsePayload}:safeResponseShape(responsePayload)
        });
      }
      this.connectionState = 'CONNECTED';
      return {
        http_status: response.status,
        page_meta: parsed.page_meta,
        transactions
      };
    } catch (error) {
      if (error?.code?.startsWith('LOYALFANS_')) throw error;
      this.connectionState = 'UPSTREAM_ERROR';
      if (error?.name === 'AbortError') throw failed('LOYALFANS_REQUEST_TIMEOUT', 'LoyalFans transaction history request timed out.', { ...requestDiagnostics('network'), network_error: 'timeout' });
      throw failed('LOYALFANS_NETWORK_FAILED', 'LoyalFans transaction history request could not be completed.', { ...requestDiagnostics('network'), network_error: safeText(error?.name || 'network_error', 80) || 'network_error' });
    } finally {
      clearTimeout(timer);
    }
  }
}

export const LOYALFANS_TRANSACTION_HISTORY_REQUEST = Object.freeze({
  url: TRANSACTIONS_URL,
  path: TRANSACTIONS_PATH,
  method: 'POST',
  content_type: 'application/json',
  api_version: API_VERSION,
  origin: TRANSACTIONS_ORIGIN,
  referer: TRANSACTIONS_REFERER,
  xsrf_header: 'X-XSRF-TOKEN',
  authorization_header: 'Authorization',
  cookie_header: 'Cookie'
});

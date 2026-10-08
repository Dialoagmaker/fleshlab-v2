import test from 'node:test';
import assert from 'node:assert/strict';
import { V3BuyerCommentLinkService } from './v3-buyer-comment-links.js';
import { parseLoyalFansCommentProof,containsLoyalFansChallengeToken } from './loyalfans-comment-proof.js';
import { LoyalFansCommerceAdapter, CommerceProviderRegistry } from './commerce-providers.js';
import { LoyalFansProviderClient } from './loyalfans-provider-client.js';
import { LOYALFANS_COMMENT_LIST_CONTINUATION_FIELDS } from './loyalfans-request-contracts.js';

const postUid = 'post-uid-000000000000000000000001';
const memberUid = 'member-uid-00000000000000000001';
const commentUid = 'comment-uid-000000000000000001';
const buyer = { id: 'buyer-a' };
const clock = { now: new Date('2026-10-06T12:00:00Z') };
const makeComment = (challenge, overrides = {}) => ({
  uid: commentUid, user: { uid: memberUid, name: 'Joe Test', slug: 'joetest' },
  post: { uid: postUid }, text: challenge, created_at: '2026-10-06T12:00:01Z', ...overrides
});

function harness() {
  const state = { links: new Map(), challenges: [], grants: [], comments: [], commentPage: null, now: new Date(clock.now) };
  let tail = Promise.resolve();
  const db = {
    state,
    async query(sql, values) {
      if (sql.includes('FROM v3_commerce_buyer_comment_challenges')) {
        const row = state.challenges.find(c => c.user_id === values[1] && c.status === 'pending');
        return { rows: row ? [structuredClone(row)] : [] };
      }
      if (sql.includes('FROM v3_commerce_buyer_links')) {
        const row = state.links.get(values[1]); return { rows: row ? [structuredClone(row)] : [] };
      }
      throw Error(`Unexpected query: ${sql}`);
    },
    async connect() {
      const prior = tail; let release;
      tail = new Promise(resolve => { release = resolve; });
      await prior;
      let snapshot;
      return { release, async query(sql, values = []) {
        if (sql === 'BEGIN') { snapshot = structuredClone({ links: [...state.links], challenges: state.challenges }); return { rows: [] }; }
        if (sql === 'ROLLBACK') { state.links = new Map(snapshot.links); state.challenges = snapshot.challenges; return { rows: [] }; }
        if (sql === 'COMMIT' || sql.includes('pg_advisory_xact_lock')) return { rows: [] };
        if (sql.includes("SET status='expired'") && sql.includes('v3_commerce_buyer_comment_challenges')) {
          for (const c of state.challenges) if (c.status === 'pending' && Date.parse(c.expires_at) <= state.now.getTime()) c.status = 'expired';
          return { rows: [] };
        }
        if (sql.includes('FROM v3_commerce_orders')) {
          return values[0] === 'order-1' && values[1] === buyer.id
            ? { rows: [{ id: 'order-1', user_id: buyer.id, status: 'pending', processor: 'loyalfans', external_content_uid: postUid }] }
            : { rows: [] };
        }
        if (sql.includes('FROM v3_commerce_buyer_links')) {
          const row = state.links.get(values[1]); return { rows: row ? [structuredClone(row)] : [] };
        }
        if (sql.includes('FROM v3_commerce_buyer_comment_challenges')) {
          const row = sql.includes('WHERE id=$1')
            ? state.challenges.find(c => c.id === values[0] && c.user_id === values[2])
            : state.challenges.find(c => c.user_id === values[1] && c.status === 'pending');
          return { rows: row ? [structuredClone(row)] : [] };
        }
        if (sql.includes('INSERT INTO v3_commerce_buyer_links')) {
          state.links.set(values[1], { user_id: values[1], status: 'pending_verification' }); return { rows: [] };
        }
        if (sql.includes('INSERT INTO v3_commerce_buyer_comment_challenges')) {
          const c = { id: values[0], provider: values[1], user_id: values[2], order_id: values[3], post_uid: values[4], challenge_code: values[5], status: 'pending', created_at: state.now.toISOString(), expires_at: new Date(state.now.getTime() + 600000).toISOString() };
          state.challenges.push(c); return { rows: [structuredClone(c)] };
        }
        if (sql.includes("SET status='consumed'")) {
          if (state.challenges.some(c => c.comment_uid === values[1])) { const e = Error('duplicate comment'); e.code = '23505'; throw e; }
          const c = state.challenges.find(c => c.id === values[0]); Object.assign(c, { status: 'consumed', comment_uid: values[1], provider_member_uid: values[2], consumed_at: state.now.toISOString() });
          return { rows: [] };
        }
        if (sql.includes("SET status='verified'")) {
          if ([...state.links.entries()].some(([userId, link]) => userId !== values[1] && link.status === 'verified' && link.provider_member_uid === values[2])) {
            const e = Error('duplicate member'); e.code = '23505'; throw e;
          }
          const row = state.links.get(values[1]); Object.assign(row, { status: 'verified', provider_member_uid: values[2], proof_reference: values[3], verification_method: 'comment_challenge', evidence_metadata: JSON.parse(values[4]), verified_at: state.now.toISOString() });
          return { rows: [] };
        }
        if (sql.includes("UPDATE v3_commerce_buyer_links SET status='expired'")) {
          state.links.get(values[1]).status = 'expired'; return { rows: [] };
        }
        throw Error(`Unexpected transaction query: ${sql}`);
      } };
    }
  };
  const adapter = { key: 'loyalfans', capabilities: { commentLookup: true }, observeComments: async () => state.commentPage || {
    authority: 'creator_authenticated', scope_post_uid: postUid, complete: true, comments: state.comments
  } };
  const service = new V3BuyerCommentLinkService(db, new CommerceProviderRegistry([adapter]), { customer: async user => { if (!user?.id) throw Error('auth'); } }, { now: () => state.now });
  return { db, state, adapter, service };
}

test('comment parser uses exact UID, post and challenge; name and slug cannot substitute', () => {
  const challenge = 'FL-LF-0123456789ABCDEF0123456789ABCDEF';
  assert.deepEqual(parseLoyalFansCommentProof(makeComment(challenge), postUid, challenge), {
    comment_uid: commentUid, provider_member_uid: memberUid, post_uid: postUid, created_at: '2026-10-06T12:00:01.000Z'
  });
  for (const bad of [
    makeComment(challenge, { text: `X${challenge}` }),
    makeComment(challenge, { post: { uid: 'other-post-000000000000000000000' } }),
    makeComment(challenge, { user: { name: 'Joe Test', slug: memberUid } }),
    makeComment(challenge, { user: { uid: memberUid, slug: 'joetest' } }),
    makeComment(challenge, { uid: 'bad' })
  ]) assert.equal(parseLoyalFansCommentProof(bad, postUid, challenge), null);
});

test('observed comment shape uses user.uid and exact text under an attested post scope', () => {
  const challenge = 'FL-LF-0123456789ABCDEF0123456789ABCDEF';
  const observed = { uid: commentUid, comment: challenge, created_at: '2026-10-06T12:00:01Z',
    user: { name: 'Joe Test', slug: 'joetest', uid: memberUid } };
  assert.equal(parseLoyalFansCommentProof(observed, postUid, challenge), null);
  const proof = parseLoyalFansCommentProof(observed, postUid, challenge, postUid);
  assert.equal(proof.provider_member_uid, memberUid);
  assert.equal(proof.post_uid, postUid);
  assert.equal(parseLoyalFansCommentProof(observed, postUid, challenge, 'different-post-000000000000000001'), null);
  assert.equal(parseLoyalFansCommentProof({ ...observed, user: { name: 'Joe Test', slug: 'joetest' } }, postUid, challenge, postUid), null);
});

test('start binds an authenticated order to its exact LF post and returns a random reusable challenge', async () => {
  const h = harness();
  const first = await h.service.start(buyer, 'order-1');
  const second = await h.service.start(buyer, 'order-1');
  assert.match(first.challenge, /^FL-LF-[0-9A-F]{32}$/);
  assert.deepEqual(second, first);
  assert.equal(h.state.challenges[0].post_uid, postUid);
  await assert.rejects(() => h.service.start({ id: 'another-user' }, 'order-1'), { code: 'ORDER_NOT_FOUND' });
  assert.deepEqual(h.state.grants, []);
});

test('trusted exact comment consumes once and binds the immutable member UID without a grant', async () => {
  const h = harness();
  const start = await h.service.start(buyer, 'order-1');
  h.state.now = new Date('2026-10-06T12:00:02Z');
  const observed = { uid: commentUid, comment: start.challenge, created_at: '2026-10-06T12:00:01Z',
    user: { name: 'Joe Test', slug: 'joetest', uid: memberUid } };
  h.state.comments = [observed, structuredClone(observed)];
  assert.equal((await h.service.verify(buyer)).status, 'verified');
  assert.equal((await h.service.verify(buyer)).status, 'verified');
  assert.equal(h.state.links.get(buyer.id).provider_member_uid, memberUid);
  assert.equal(h.state.challenges[0].comment_uid, commentUid);
  assert.equal(h.state.challenges[0].status, 'consumed');
  assert.deepEqual(h.state.grants, []);
});

test('wrong challenge, other actor, stale comment and unavailable adapter never bind', async () => {
  for (const comments of [
    [makeComment('FL-LF-OTHER')],
    [makeComment('PLACEHOLDER', { created_at: '2026-10-06T11:59:59Z' })],
    [makeComment('PLACEHOLDER', { post: { uid: 'wrong-post-00000000000000000000' } })]
  ]) {
    const h = harness(); const start = await h.service.start(buyer, 'order-1');
    h.state.now = new Date('2026-10-06T12:00:02Z');
    h.state.comments = comments.map(c => ({ ...c, text: c.text === 'PLACEHOLDER' ? start.challenge : c.text }));
    assert.equal((await h.service.verify(buyer)).status, 'pending');
    assert.equal(h.state.links.get(buyer.id).status, 'pending_verification');
  }
  const h = harness(); await h.service.start(buyer, 'order-1');
  h.adapter.capabilities.commentLookup = false;
  assert.equal((await h.service.verify(buyer)).verification_status, 'unable_to_verify');
});

test('incomplete or unscoped creator comment pages cannot verify a buyer link', async () => {
  for (const page of [
    { authority: 'creator_authenticated', scope_post_uid: postUid, complete: false },
    { authority: 'browser_capture', scope_post_uid: postUid, complete: true },
    { authority: 'creator_authenticated', scope_post_uid: 'wrong-post-00000000000000000000', complete: true }
  ]) {
    const h = harness(); const start = await h.service.start(buyer, 'order-1');
    h.state.now = new Date('2026-10-06T12:00:02Z');
    h.state.commentPage = { ...page, comments: [makeComment(start.challenge)] };
    assert.equal((await h.service.verify(buyer)).verification_status, 'unable_to_verify');
    assert.equal(h.state.links.get(buyer.id).status, 'pending_verification');
  }
});

test('ambiguous exact challenge and expired challenge fail closed', async () => {
  const h = harness(); const start = await h.service.start(buyer, 'order-1');
  h.state.now = new Date('2026-10-06T12:00:02Z');
  h.state.comments = [makeComment(start.challenge), makeComment(start.challenge, { uid: 'second-comment-00000000000000001', user: { uid: 'other-member-000000000000000001', name: 'Another Member', slug: 'another' } })];
  assert.equal((await h.service.verify(buyer)).verification_status, 'unable_to_verify');
  h.state.now = new Date('2026-10-06T12:10:01Z');
  assert.equal((await h.service.verify(buyer)).status, 'expired');
  assert.equal(h.state.links.get(buyer.id).status, 'expired');
});

test('comment replay and a member UID already bound to another customer are rejected atomically', async () => {
  const h = harness(); const first = await h.service.start(buyer, 'order-1');
  h.state.now = new Date('2026-10-06T12:00:02Z');
  h.state.comments = [makeComment(first.challenge)];
  assert.equal((await h.service.verify(buyer)).status, 'verified');
  const second = { id: 'second-challenge', provider: 'loyalfans', user_id: 'buyer-b', order_id: 'order-2',
    post_uid: postUid, challenge_code: 'FL-LF-0123456789ABCDEF0123456789ABCDEF', status: 'pending',
    created_at: '2026-10-06T12:00:00Z', expires_at: '2026-10-06T12:10:00Z' };
  h.state.challenges.push(second);
  h.state.links.set('buyer-b', { user_id: 'buyer-b', status: 'pending_verification' });
  const replay = parseLoyalFansCommentProof(makeComment(second.challenge_code), postUid, second.challenge_code);
  assert.equal((await h.service.consume('buyer-b', second, replay)).verification_status, 'unable_to_verify');
  assert.equal(h.state.challenges[1].status, 'pending');
  const fresh = { ...replay, comment_uid: 'fresh-comment-000000000000000001' };
  assert.equal((await h.service.consume('buyer-b', second, fresh)).verification_status, 'unable_to_verify');
  assert.equal(h.state.links.get('buyer-b').status, 'pending_verification');
  assert.equal(h.state.challenges[1].status, 'pending');
});

test('unconfigured adapter cannot fetch comments or accept injected production evidence', async () => {
  const adapter = new LoyalFansCommerceAdapter({ controlled: true, environment: 'production',
    commentObservationClient: { listComments: async () => { throw Error('called'); } },
    observationClient: { listTransactions: async () => { throw Error('called'); } } });
  assert.equal(adapter.capabilities.commentLookup, false);
  assert.equal(adapter.capabilities.transactionLookup, false);
  assert.equal(adapter.capabilities.authorizedCommentRetrieval, false);
  assert.equal(adapter.capabilities.authorizedTransactionHistory, false);
  assert.equal(adapter.readiness.status, 'NOT_READY');
  await assert.rejects(() => adapter.observeComments({}));
  await assert.rejects(() => adapter.verifyTransaction({}), { code: 'LOYALFANS_BRIDGE_NOT_READY' });
  const h = harness(); h.adapter.capabilities.commentLookup = false;
  await assert.rejects(() => h.service.start(buyer, 'order-1'), { code: 'VERIFICATION_UNAVAILABLE' });
  assert.equal(h.state.challenges.length, 0);
});

test('controlled adapter enforces the complete creator-scope contract', async () => {
  const challenge = { postUid, createdAt: '2026-10-06T12:00:00Z', expiresAt: '2026-10-06T12:10:00Z' };
  let page = { authority: 'creator_authenticated', scope_post_uid: postUid, complete: true, comments: [] };
  const adapter = new LoyalFansCommerceAdapter({ controlled: true, environment: 'test',
    commentObservationClient: { listComments: async input => { assert.deepEqual(input, challenge); return page; } } });
  assert.equal(adapter.capabilities.commentLookup, true);
  assert.equal(adapter.readiness.status, 'NOT_READY');
  assert.deepEqual(await adapter.observeComments(challenge), page);
  page = { ...page, complete: false };
  await assert.rejects(() => adapter.observeComments(challenge), { code: 'VERIFICATION_UNAVAILABLE' });
});

function observedCommentClient(pages){
  let calls=0;
  return new LoyalFansProviderClient({enabled:true,environment:'test',cookieHeader:'synthetic',bearerToken:'synthetic',xsrfToken:'synthetic',
    commentsRequestContract:{version:1,observed:true,method:'GET',pathTemplate:'/neutral-capture/{postUid}/comments',
      query:{'ngsw-bypass':true},payload:null,pagination:{maxPages:4,maxComments:20,
        continuation:[{location:'query',requestPath:['cursor'],responsePath:['page_token'],type:'string'}],
        terminal:{all:[{responsePath:['page_token'],equals:null}]}}},
    fetchImpl:async()=>new Response(JSON.stringify(pages[calls++]),{status:200})});
}
const neutralPage=(comments,token)=>({success:true,httpCode:200,comments,page_token:token});

test('configured observed client verifies a later-page challenge through existing buyer-link verifier',async()=>{
  const h=harness();const start=await h.service.start(buyer,'order-1');h.state.now=new Date('2026-10-06T12:00:02Z');
  const proofComment={...makeComment(start.challenge),user:{uid:memberUid,name:'Neutral Member',slug:'neutral'}};
  const client=observedCommentClient([neutralPage([makeComment('neutral-marker')],'continue'),
    neutralPage([{...proofComment,uid:'comment-neutral-later-000000000001'}],null)]);
  const installed=new LoyalFansCommerceAdapter({providerClient:client});assert.equal(installed.capabilities.buyerIdentity,true);
  h.adapter.observeComments=installed.observeComments.bind(installed);
  assert.equal((await h.service.verify(buyer)).status,'verified');
  assert.equal(h.state.links.get(buyer.id).provider_member_uid,memberUid);assert.equal(h.state.challenges[0].status,'consumed');
  assert.deepEqual(h.state.grants,[]);
});

test('an exact challenge on an incomplete traversal does not consume the challenge or bind the buyer',async()=>{
  const h=harness();const start=await h.service.start(buyer,'order-1');h.state.now=new Date('2026-10-06T12:00:02Z');
  const client=observedCommentClient([neutralPage([makeComment(start.challenge)],'repeat'),
    neutralPage([{...makeComment('neutral-marker'),uid:'comment-neutral-second-0000000001'}],'repeat')]);
  const installed=new LoyalFansCommerceAdapter({providerClient:client});h.adapter.observeComments=installed.observeComments.bind(installed);
  assert.equal((await h.service.verify(buyer)).verification_status,'unable_to_verify');
  assert.equal(h.state.challenges[0].status,'pending');assert.equal(h.state.links.get(buyer.id).status,'pending_verification');
  assert.deepEqual(h.state.grants,[]);
});

test('complete observed pages with same display name and distinct UIDs remain ambiguous',async()=>{
  const h=harness();const start=await h.service.start(buyer,'order-1');h.state.now=new Date('2026-10-06T12:00:02Z');
  const first={...makeComment(start.challenge),user:{name:'Neutral Member',slug:'neutral',uid:memberUid}};
  const second={...first,uid:'comment-neutral-second-0000000001',user:{...first.user,uid:'member-neutral-other-000000000001'}};
  const client=observedCommentClient([neutralPage([first],'next'),neutralPage([second],null)]);
  const installed=new LoyalFansCommerceAdapter({providerClient:client});h.adapter.observeComments=installed.observeComments.bind(installed);
  assert.equal((await h.service.verify(buyer)).verification_status,'unable_to_verify');
  assert.equal(h.state.challenges[0].status,'pending');assert.deepEqual(h.state.grants,[]);
});

test('wrong explicit post UID on any observed page prevents buyer verification',async()=>{
  const h=harness();const start=await h.service.start(buyer,'order-1');h.state.now=new Date('2026-10-06T12:00:02Z');
  const client=observedCommentClient([neutralPage([makeComment(start.challenge,{post:{uid:'wrong-neutral-post-00000000000001'}})],null)]);
  const installed=new LoyalFansCommerceAdapter({providerClient:client});h.adapter.observeComments=installed.observeComments.bind(installed);
  assert.equal((await h.service.verify(buyer)).verification_status,'unable_to_verify');
  assert.equal(h.state.challenges[0].status,'pending');assert.deepEqual(h.state.grants,[]);
});

async function terminalListHarness(transform=comments=>comments) {
  const h=harness();const start=await h.service.start(buyer,'order-1');h.state.now=new Date('2026-10-06T12:00:02Z');
  const comment={uid:commentUid,comment:start.challenge,parent:{uid:postUid},created_at:'2026-10-06T12:00:01Z',
    user:{uid:memberUid,name:'Neutral Member',slug:'neutral'},page_token:'comment-only-pagination-marker'};
  const payload={success:true,httpCode:200,comments:transform([comment]),
    page_token:null,page_token_newer:null,token_id:null,token_newer_id:null};
  const requests=[];
  const client=new LoyalFansProviderClient({enabled:true,environment:'test',bearerToken:'synthetic',cookieHeader:'synthetic',xsrfToken:'synthetic',
    fetchImpl:async(url,request)=>{requests.push({url,request});return new Response(JSON.stringify(payload),{status:200});}});
  const installed=new LoyalFansCommerceAdapter({providerClient:client});
  assert.equal(installed.capabilities.commentLookup,true);
  h.adapter.observeComments=installed.observeComments.bind(installed);
  return{...h,payload,client,installed,requests,start};
}

test('terminal normal POST verifies exact authoritative buyer UID and consumes challenge once without entitlements',async()=>{
  const h=await terminalListHarness();
  // A UID attached to caller input is not proof and is ignored by the verifier.
  assert.equal((await h.service.verify({...buyer,provider_member_uid:'wrong-client-uid-000000000000001'})).status,'verified');
  assert.equal(h.state.links.get(buyer.id).provider_member_uid,memberUid);
  assert.equal(h.state.challenges[0].provider_member_uid,memberUid);
  assert.equal(h.state.challenges[0].status,'consumed');
  assert.equal(h.client.canAttestCompleteComments(),true);
  assert.deepEqual(JSON.parse(h.requests[0].request.body),{uid:postUid});
  assert.equal((await h.service.verify(buyer)).status,'verified');assert.equal(h.requests.length,1);
  assert.deepEqual(h.state.grants,[]);
});

test('observed parent-bound proof verifies solely by buyer UID without display name or slug',async()=>{
  const h=await terminalListHarness(comments=>comments.map(c=>({...c,user:{uid:memberUid}})));
  assert.equal((await h.service.verify(buyer)).status,'verified');
  assert.equal(h.state.links.get(buyer.id).provider_member_uid,memberUid);
  assert.equal(h.state.challenges[0].status,'consumed');assert.deepEqual(h.state.grants,[]);
});

for(const field of LOYALFANS_COMMENT_LIST_CONTINUATION_FIELDS)test(`non-null top-level ${field} blocks buyer link with explicit continuation-required state`,async()=>{
  const h=await terminalListHarness();h.payload[field]='neutral-continuation';
  const result=await h.service.verify(buyer);
  assert.deepEqual(result,{status:'pending',verification_status:'continuation_contract_required'});
  assert.equal(h.state.challenges[0].status,'pending');assert.equal(h.state.links.get(buyer.id).status,'pending_verification');
  assert.equal(h.client.canAttestCompleteComments(),false);assert.equal(h.requests.length,1);assert.deepEqual(h.state.grants,[]);
});

for(const [name,transform] of [
  ['wrong parent UID',comments=>comments.map(c=>({...c,parent:{uid:'wrong-neutral-post-00000000000001'}}))],
  ['missing parent UID despite exact challenge and requested scope',comments=>comments.map(c=>({...c,parent:undefined}))],
  ['missing buyer UID despite identical display name',comments=>comments.map(c=>({...c,user:{name:'Neutral Member',slug:memberUid}}))],
  ['invalid buyer UID',comments=>comments.map(c=>({...c,user:{...c.user,uid:'invalid'}}))],
  ['same display name with competing buyer UID',comments=>[...comments,{...comments[0],uid:'neutral-other-comment-00000000001',
    user:{...comments[0].user,uid:'neutral-other-member-000000000001'}}]]
])test(`terminal observed list rejects ${name}`,async()=>{
  const h=await terminalListHarness(transform);
  assert.equal((await h.service.verify(buyer)).verification_status,'unable_to_verify');
  assert.equal(h.state.challenges[0].status,'pending');assert.equal(h.state.links.get(buyer.id).status,'pending_verification');
  assert.deepEqual(h.state.grants,[]);
});

test('a substring-spoofed challenge on a terminal page leaves verification waiting and unconsumed',async()=>{
  const h=await terminalListHarness(comments=>comments.map(c=>({...c,comment:`X${c.comment}`})));
  assert.deepEqual(await h.service.verify(buyer),{status:'pending',verification_status:'waiting'});
  assert.equal(h.state.challenges[0].status,'pending');assert.equal(h.state.links.get(buyer.id).status,'pending_verification');
  assert.deepEqual(h.state.grants,[]);
});

test('challenge matching accepts distinct tokens with neutral surrounding text and rejects spoofs',()=>{
  const token='FL-LF-7K4P-92XM';
  for(const text of [token,`hello! ${token}`,`hello ${token} thanks`,`(${token})`,`\n${token}\t`]){
    assert.equal(containsLoyalFansChallengeToken(text,token),true);
    assert.notEqual(parseLoyalFansCommentProof(makeComment(token,{text}),postUid,token),null);
  }
  for(const text of ['FL-LF-7K4P-92X',`X${token}`,`${token}99`,`${token}-other`,`_${token}`,`é${token}`,
    `${token}\u200d`,token.replace('4','5'),token.toLowerCase(),token.replace('P','Р')]){
    assert.equal(containsLoyalFansChallengeToken(text,token),false);
  }
});

test('live comment added_at object, surrounding token and omitted markers verify once without an entitlement',async()=>{
  const h=await terminalListHarness(comments=>comments.map(c=>({...c,created_at:undefined,
    added_at:{date:'2026-10-06 12:00:01',timezone_type:3,timezone:'UTC'},comment:`hello ${c.comment} thanks`})));
  for(const field of ['page_token_newer','token_id','token_newer_id'])delete h.payload[field];
  assert.equal((await h.service.verify(buyer)).status,'verified');
  assert.equal(h.state.links.get(buyer.id).provider_member_uid,memberUid);
  assert.equal(h.state.challenges[0].status,'consumed');assert.deepEqual(h.state.grants,[]);
  assert.equal((await h.service.verify(buyer)).status,'verified');assert.equal(h.requests.length,1);
});

test('malformed added_at object cannot consume a terminal-page challenge',async()=>{
  const h=await terminalListHarness(comments=>comments.map(c=>({...c,created_at:undefined,added_at:{date:'missing-zone'},
    comment:`hello ${c.comment}`})));
  assert.deepEqual(await h.service.verify(buyer),{status:'pending',verification_status:'waiting'});
  assert.equal(h.state.challenges[0].status,'pending');assert.deepEqual(h.state.grants,[]);
});

test('terminal challenge cannot bind a buyer UID already verified for a different customer',async()=>{
  const h=await terminalListHarness();
  h.state.links.set('another-customer',{status:'verified',provider_member_uid:memberUid});
  assert.equal((await h.service.verify(buyer)).verification_status,'unable_to_verify');
  assert.equal(h.state.challenges[0].status,'pending');assert.equal(h.state.links.get(buyer.id).status,'pending_verification');
  assert.equal(h.state.links.get('another-customer').status,'verified');assert.deepEqual(h.state.grants,[]);
});

test('terminal first-page concurrent verifications preserve one-time challenge and buyer UID binding',async()=>{
  const h=await terminalListHarness();
  const results=await Promise.all([h.service.verify(buyer),h.service.verify(buyer)]);
  assert.equal(results.every(result=>result.status==='verified'),true);
  assert.equal(h.state.challenges.filter(c=>c.status==='consumed').length,1);
  assert.equal(h.state.links.get(buyer.id).provider_member_uid,memberUid);assert.deepEqual(h.state.grants,[]);
});

test('targeted comment response cannot prove complete list to the existing buyer verifier',async()=>{
  const h=await terminalListHarness();
  h.adapter.observeComments=()=>h.client.lookupComment({postUid,commentUid});
  assert.equal((await h.service.verify(buyer)).verification_status,'unable_to_verify');
  assert.deepEqual(JSON.parse(h.requests[0].request.body),{uid:postUid,uid_comment:commentUid});
  assert.equal(h.client.canAttestCompleteComments(),false);assert.equal(h.state.challenges[0].status,'pending');
  assert.equal(h.state.links.get(buyer.id).status,'pending_verification');assert.deepEqual(h.state.grants,[]);
});

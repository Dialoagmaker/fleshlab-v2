import test from 'node:test';
import assert from 'node:assert/strict';
import { auditLoyalFansCataloguePages, normalizeLoyalFansProduct, normalizeLoyalFansCatalogueItem } from './loyalfans-catalogue.js';

const uidA = '9qFxq1guvyloHmfuLytDHyIEPA85k9riFipAqFhiIj0';
const uidB = '1qFxq1guvyloHmfuLytDHyIEPA85k9riFipAqFhiIj1';
const product = overrides => ({
  uid: uidA,
  short_url: 'https://tinylf.com/6vwI0vC7CJrlsP',
  slug: 'example-product',
  title: 'Example Product',
  content: 'A real description from an authorized capture.',
  price: '12.50',
  currency: 'usd',
  thumbnail_url: 'https://images.example.test/product-cover.jpg',
  video_object: { video_url: 'https://cdn2.loyalfans.com/private.mp4?Expires=123&Signature=secret' },
  ...overrides
});

test('normalizes only safe catalogue metadata and never exports a media URL', () => {
  const result = normalizeLoyalFansProduct(product());
  assert.deepEqual(result, {
    provider: 'loyalfans',
    external_product_id: uidA,
    external_product_slug: 'example-product',
    external_product_url: 'https://tinylf.com/6vwI0vC7CJrlsP',
    external_checkout_url: null,
    external_thumbnail_url: 'https://images.example.test/product-cover.jpg',
    external_price_minor: 1250,
    external_currency: 'USD',
    title: 'Example Product',
    description: 'A real description from an authorized capture.',
    published_at: null,
    updated_at: null,
    sync_capability: 'manual_authorized_capture_only',
    checkout_capability: 'unverified',
    entitlement_capability: 'unverified',
    playback_capability: 'unsupported'
  });
  assert.equal(JSON.stringify(result).includes('video_url'), false);
  assert.equal(JSON.stringify(result).includes('Signature='), false);
});

test('audits pagination snapshots and deduplicates strictly by LoyalFans product UID', () => {
  const result = auditLoyalFansCataloguePages([
    { page: 1, records: [product(), product({ uid: uidB, short_url: 'https://www.loyalfans.com/creator/video/product-b' })] },
    { page: 2, records: [product()] },
    { page: 3, records: [] },
    { page: 4, records: [] }
  ]);
  assert.equal(result.page_count, 4);
  assert.equal(result.item_count, 3);
  assert.equal(result.unique_uid_count, 2);
  assert.equal(result.duplicate_count, 1);
  assert.deepEqual(result.duplicates, [{ external_product_id: uidA, first_page: 1, duplicate_page: 2 }]);
});

test('rejects unsafe provider URLs and ephemeral external thumbnails', () => {
  assert.throws(() => normalizeLoyalFansProduct(product({ short_url: 'https://evil.example/product' })), { code: 'INVALID_PROVIDER_PRODUCT_URL' });
  assert.throws(() => normalizeLoyalFansProduct(product({ thumbnail_url: 'https://cdn.example/cover.jpg?X-Amz-Signature=secret' })), { code: 'EPHEMERAL_EXTERNAL_URL' });
});

test('requires complete manual price metadata and never accepts an invented checkout URL', () => {
  assert.throws(() => normalizeLoyalFansProduct(product({ currency: null })), { code: 'INCOMPLETE_EXTERNAL_PRICE' });
  const result = normalizeLoyalFansProduct(product({ checkout_url: 'https://www.loyalfans.com/checkout/unknown' }));
  assert.equal(result.external_checkout_url, null);
});


const neutralStoreItem=(size)=>({uid:uidA,title:'Neutral fixture',price:1.99,owner:{uid:uidB},
  created_at:{date:'2026-07-22 20:24:19',timezone_type:3,timezone:'UTC'},
  video_object:{uid:uidB,mime:'video/mp4',duration:60,size:{width:1920,height:1080},
    downloadable_video_meta:{format:'mp4',resolution:'1080p',size}}});

for(const size of ['262.41MB','1.13GB','84.34MB','16.61MB',' 262.41MB ','262.41 MB','1.13GiB']){
  test(`rounded optional file size ${JSON.stringify(size)} retains exact display text without claiming bytes`,()=>{
    const metadata=normalizeLoyalFansCatalogueItem(neutralStoreItem(size),{currency:'USD'}).metadata;
    assert.equal(metadata.downloadable_size_display,size);assert.equal(metadata.downloadable_size_bytes,null);
    assert.equal(metadata.width,1920);assert.equal(metadata.height,1080);assert.equal(metadata.duration_seconds,60);
    assert.equal(metadata.downloadable_format,'mp4');assert.equal(metadata.current_price_minor,199);
  });
}

test('optional absent file size or downloadable metadata stays null; exact numeric bytes remain supported',()=>{
  for(const size of [undefined,null,'']){
    const metadata=normalizeLoyalFansCatalogueItem(neutralStoreItem(size),{currency:'USD'}).metadata;
    assert.equal(metadata.downloadable_size_bytes,null);assert.equal(metadata.downloadable_size_display,null);
  }
  const item=neutralStoreItem();delete item.video_object.downloadable_video_meta;
  const missing=normalizeLoyalFansCatalogueItem(item,{currency:'USD'}).metadata;
  assert.equal(missing.downloadable_size_bytes,null);assert.equal(missing.downloadable_size_display,null);
  item.video_object.downloadable_video_meta=null;
  assert.equal(normalizeLoyalFansCatalogueItem(item,{currency:'USD'}).metadata.downloadable_size_display,null);
  for(const size of [123456789,'123456789']){
    const exact=normalizeLoyalFansCatalogueItem(neutralStoreItem(size),{currency:'USD'}).metadata;
    assert.equal(exact.downloadable_size_bytes,123456789);assert.equal(exact.downloadable_size_display,typeof size==='string'?size:null);
  }
});

test('human-readable file metadata never weakens real video dimension checks',()=>{
  for(const field of ['width','height'])for(const size of [0,-1,1.5,'1920px','262.41MB',{},NaN]){
    const item=neutralStoreItem('262.41MB');item.video_object.size[field]=size;
    assert.throws(()=>normalizeLoyalFansCatalogueItem(item,{currency:'USD'}),{code:'INVALID_CATALOGUE_DIMENSION'});
  }
});

test('invalid optional file sizes fail with their own technical code, never a dimension error',()=>{
  for(const size of [0,-1,1.5,NaN,Infinity,{},false,'0MB','-1GB','unknown','https://media.example.test/file?sig=synthetic']){
    assert.throws(()=>normalizeLoyalFansCatalogueItem(neutralStoreItem(size),{currency:'USD'}),{code:'INVALID_CATALOGUE_FILE_SIZE'});
  }
});


test('changing only the upstream size representation preserves every other normalized metadata field',()=>{
  const original=neutralStoreItem(123456789);
  const exact=normalizeLoyalFansCatalogueItem(original,{currency:'USD'}).metadata;
  const displayed=normalizeLoyalFansCatalogueItem({...original,video_object:{...original.video_object,
    downloadable_video_meta:{...original.video_object.downloadable_video_meta,size:'262.41MB'}}},{currency:'USD'}).metadata;
  const rest=metadata=>Object.fromEntries(Object.entries(metadata).filter(([key])=>
    !['downloadable_size_bytes','downloadable_size_display','metadata_fingerprint'].includes(key)));
  assert.deepEqual(rest(exact),rest(displayed));
  assert.notEqual(exact.metadata_fingerprint,displayed.metadata_fingerprint);
});

test('preserves full upstream content exactly, including Unicode, boundary whitespace, and text over 10k',()=>{
  const description=` \n${'Neutral café 内容 '.repeat(900)}\t `;
  const cleanContent=`\nClean résumé 内容 ${'x'.repeat(12000)}\n`;
  const metadata=normalizeLoyalFansCatalogueItem(neutralStoreItem(null),{currency:'USD'}).metadata;
  const item=neutralStoreItem(null);
  item.content=description;
  item.clean_content=cleanContent;
  const normalized=normalizeLoyalFansCatalogueItem(item,{currency:'USD'}).metadata;
  assert.equal(normalized.description,description);
  assert.equal(normalized.clean_description,cleanContent);
  assert.equal(metadata.description,null);
  assert.equal(metadata.clean_description,null);
});

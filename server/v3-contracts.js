import crypto from 'node:crypto';
import fs from 'node:fs';
import zlib from 'node:zlib';
import { Readable } from 'node:stream';
import { HttpError } from './errors.js';

export const contractTemplateStates = new Set(['draft','legal_review_required','approved','retired']);
export const contractInstanceStates = new Set(['internal_draft','ready_for_review','assigned','viewed','performer_signed','awaiting_company_signature','fully_executed','signed','cancelled','superseded','legacy_imported']);
export const contractSigningEnabled = false;

const catalog = {
  performer_services: ['Parties','Services','Independent contractor status','Eligibility and verification','Compensation basis (LEGAL_REVIEW_REQUIRED)','Termination (LEGAL_REVIEW_REQUIRED)'],
  content_rights_release: ['Parties','Content rights and permitted uses (LEGAL_REVIEW_REQUIRED)','Territory and term','Name, likeness and voice','Sublicensing'],
  consent_standards: ['Consent and boundaries','Production standards','Third-party releases','Prohibited content','Publishing gate'],
  confidentiality_data: ['Confidential information','Data protection purposes','Access and retention (LEGAL_REVIEW_REQUIRED)','Remedies (LEGAL_REVIEW_REQUIRED)'],
  compensation_schedule: ['Revenue share (LEGAL_REVIEW_REQUIRED)','Compensation basis (LEGAL_REVIEW_REQUIRED)','Settlement cycle','Statements and payout threshold'],
  management_optional: ['Appointment','Authority','No additional commission currently applies','Term and termination (LEGAL_REVIEW_REQUIRED)']
};
const defaultBody = key => `FLESHLAB STUDIOS\nA division of Dialogmakers International Ltd.\n\n${(catalog[key] || ['Parties','Terms','Signatures']).map((s, i) => `${i + 1}. ${s}\nThis section is a structured draft for legal review.}`).join('\n\n')}\n\nSignature readiness: LEGAL_REVIEW_REQUIRED.`;
const hash = value => crypto.createHash('sha256').update(Buffer.isBuffer(value) ? value : String(value)).digest('hex');
const rendererRevisionMarker='FLESHLAB_RENDERER_PROFILE: contract_pdf_v2';
const withRendererRevision=snapshot=>`${String(snapshot).trim()}\n\n${rendererRevisionMarker}`;
const bufferFromStream = async stream => { const chunks=[]; for await (const chunk of stream) chunks.push(Buffer.from(chunk)); return Buffer.concat(chunks); };
const safe = row => { if (!row) return null; const { rendered_snapshot, legacy_file_hash, ...rest } = row; return { ...rest, has_snapshot: Boolean(rendered_snapshot), legacy_file_hash: legacy_file_hash || null }; };
const replaceVariables = (body, variables) => String(body).replace(/\{\{([a-z0-9_]+)\}\}/gi, (whole, key) => Object.prototype.hasOwnProperty.call(variables, key) ? String(variables[key]) : whole);
// Approval and execution eligibility are deliberately separate.  An immutable
// historical version can retain an approval record while being blocked from
// issuance if its actual stored text is still a legal-review preview.
const prohibitedExecutionMarkers = [/LEGAL_REVIEW_REQUIRED/i, /TEMPLATE\s+PREVIEW/i, /NOT\s+A\s+SIGNED\s+CONTRACT/i];
const serverIssuedVariables = new Set([
  'company_legal_name','company_address','company_number','creator_legal_name','creator_address',
  'performer_name','contract_number','effective_date','template_version','contract_status',
  'studio_signer_name','studio_signature','studio_signed_at','creator_signature','creator_signed_at',
  'document_hash','acknowledgement_state','acknowledged_at'
]);
export const executionEligibility = body => {
  const source=String(body||'');
  const marker=prohibitedExecutionMarkers.find(pattern=>pattern.test(source));
  return { eligible:!marker, reason:marker ? 'PROHIBITED_DRAFT_MARKER' : null };
};
export const issueRequiredVariables = version => {
  const schema=Array.isArray(version?.variables)?version.variables:[];
  return schema.filter(name=>!serverIssuedVariables.has(String(name)));
};
const pdfEscape = value => printableText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\r?\n/g, ' ');
const ink='0.067 0.067 0.067', muted='0.37 0.37 0.37', light='0.90 0.90 0.89', red='0.72 0.08 0.10';
const pdfText=(x,y,size,value,bold=false,color=ink)=>`BT /F${bold?'2':'1'} ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${pdfEscape(value)}) Tj ET`;
const rule=(y, x1=54, x2=541, color=red)=>`${color} RG .7 w ${x1} ${y} m ${x2} ${y} l S`;
const line=(x1,y,x2)=>`${ink} RG .45 w ${x1} ${y} m ${x2} ${y} l S`;
const label=value=>String(value||'').replaceAll('_',' ').toUpperCase();
const formatLegalDate=value=>{
  if (!value || /effective on electronic signature/i.test(String(value))) return 'Effective on electronic signature';
  const date = value instanceof Date ? value : new Date(`${String(value || '').slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return 'Effective on electronic signature';
  return new Intl.DateTimeFormat('en-GB', { timeZone:'UTC', day:'numeric', month:'long', year:'numeric' }).format(date);
};
const formatSignedAt=value=>{
  const date=new Date(value); if(Number.isNaN(date.getTime()))return '—';
  return new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',timeZoneName:'short'}).format(date);
};
const canonicalName=value=>String(value||'').trim().replace(/\s+/g,' ').normalize('NFKC').toLocaleLowerCase('en');
// The built-in Type1 PDF fonts do not expose browser layout metrics.  Keep a
// deliberately conservative line length inside a 479pt A4 text column and
// split unbroken tokens as well, so a URL, hash or long legal identifier can
// never extend beyond the right printable edge.
const words=value=>String(value || '').trim().split(/\s+/).filter(Boolean);
const printableText=value=>String(value ?? '')
  .replace(/[\u2018\u2019]/g,"'").replace(/[\u201C\u201D]/g,'"')
  .replace(/[\u2013\u2014]/g,'-').replace(/\u2026/g,'...').replace(/\u00a0/g,' ')
  .replace(/[\u0000-\u001f\u007f-\u009f]/g,' ');
const textUnits=value=>[...String(value)].reduce((total,char)=>total+(char===' '?0.25:/[WM@%]/.test(char)?0.9:/[A-Z0-9]/.test(char)?0.68:/[ilI.,;:!|']/ .test(char)?0.28:0.52),0);
const splitToken=(token,max,maxUnits)=>{ const chunks=[]; let row=''; for(const char of token){const candidate=row+char;if(row&&(candidate.length>max||textUnits(candidate)>maxUnits)){chunks.push(row);row=char;}else row=candidate;}if(row)chunks.push(row);return chunks; };
const wrapText=(value, max=72)=>{
  const result=[]; let row=''; const maxUnits=max*0.58;
  for (const original of words(printableText(value))) {
    const pieces=(original.length>max||textUnits(original)>maxUnits) ? splitToken(original,max,maxUnits) : [original];
    for (const word of pieces) { const candidate=row ? `${row} ${word}` : word; if((candidate.length>max||textUnits(candidate)>maxUnits)&&row){result.push(row);row=word;}else row=candidate; }
  }
  if(row)result.push(row); return result.length?result:[''];
};
const bodySections=snapshot=>{
  const lines=String(snapshot || '').split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
  const beforeSignature=lines.findIndex(line=>/^SIGNATURE PAGE$/i.test(line));
  const source=beforeSignature >= 0 ? lines.slice(0,beforeSignature) : lines;
  // The immutable template contains its own cover metadata and raw internal
  // draft marker.  The document shell presents those facts once, cleanly.
  const firstClause=source.findIndex(line=>/^\d+\.\s+/.test(line));
  const contractual=firstClause >= 0 ? source.slice(firstClause) : source;
  const summaryStart=contractual.findIndex(line=>/^COMPENSATION SUMMARY$/i.test(line));
  const body=(summaryStart >= 0 ? contractual.slice(0,summaryStart) : contractual).filter(line=>!/TEMPLATE PREVIEW\s*\/\s*NOT A SIGNED CONTRACT/i.test(line)&&line!==rendererRevisionMarker);
  const sections=[]; let current=null;
  for (const entry of body) {
    const match=entry.match(/^(\d+)\.\s+(.+)$/);
    if (match) { current={ number:match[1].padStart(2,'0'), title:match[2], paragraphs:[] }; sections.push(current); continue; }
    if (/^[A-Z][A-Z /&—-]{4,}$/.test(entry)) { current={ number:String(sections.length+1).padStart(2,'0'), title:entry, paragraphs:[] }; sections.push(current); continue; }
    if (!current) { current={ number:String(sections.length+1).padStart(2,'0'), title:'AGREEMENT', paragraphs:[] }; sections.push(current); }
    current.paragraphs.push(entry);
  }
  return sections.length ? sections : [{number:'01',title:'AGREEMENT',paragraphs:['Contract terms are recorded in the immutable snapshot.']}];
};
const pngLogo=()=>{
  const source=fs.readFileSync(new URL('../v3/src/assets/brand/fleshlab-amateur-wins-approved.png', import.meta.url));
  let cursor=8, width=0, height=0, bitDepth=0, colorType=0, interlace=0; const parts=[];
  while(cursor < source.length) { const size=source.readUInt32BE(cursor); const type=source.toString('ascii',cursor+4,cursor+8); const data=source.subarray(cursor+8,cursor+8+size); if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);bitDepth=data[8];colorType=data[9];interlace=data[12];} if(type==='IDAT')parts.push(data); cursor+=size+12; }
  if(bitDepth!==8 || colorType!==6 || interlace!==0) throw new Error('Official FLESHLAB logo must be a non-interlaced RGBA PNG.');
  const filtered=zlib.inflateSync(Buffer.concat(parts)), stride=width*4, rgba=Buffer.alloc(width*height*4); let input=0, output=0, previous=Buffer.alloc(stride);
  for(let row=0;row<height;row++) { const filter=filtered[input++]; const current=Buffer.alloc(stride); for(let column=0;column<stride;column++){const raw=filtered[input++];const left=column>=4?current[column-4]:0;const up=previous[column];const upLeft=column>=4?previous[column-4]:0;let value=raw;if(filter===1)value=(raw+left)&255;else if(filter===2)value=(raw+up)&255;else if(filter===3)value=(raw+Math.floor((left+up)/2))&255;else if(filter===4){const p=left+up-upLeft,pa=Math.abs(p-left),pb=Math.abs(p-up),pc=Math.abs(p-upLeft);value=(raw+(pa<=pb&&pa<=pc?left:pb<=pc?up:upLeft))&255;} else if(filter!==0)throw new Error('Unsupported official logo PNG filter.');current[column]=value;} current.copy(rgba,output); output+=stride; previous=current; }
  const rgb=Buffer.alloc(width*height*3); for(let pixel=0,rgbaIndex=0,rgbIndex=0;pixel<width*height;pixel++,rgbaIndex+=4,rgbIndex+=3){const alpha=rgba[rgbaIndex+3]/255;rgb[rgbIndex]=Math.round(rgba[rgbaIndex]*alpha+255*(1-alpha));rgb[rgbIndex+1]=Math.round(rgba[rgbaIndex+1]*alpha+255*(1-alpha));rgb[rgbIndex+2]=Math.round(rgba[rgbaIndex+2]*alpha+255*(1-alpha));}
  return { width,height,data:zlib.deflateSync(rgb) };
};
const logo=pngLogo();
const logoDraw=(x,y,width=122)=>`q ${width} 0 0 ${width*logo.height/logo.width} ${x} ${y} cm /Logo Do Q`;
const footer=(page,total,contractNumber,version)=>[rule(49,54,541,light),pdfText(54,31,7,'FLESHLAB STUDIOS | A division of Dialogmakers International Ltd.',false,muted),pdfText(345,31,7,`Contract ${contractNumber} | Page ${page} of ${total} | v${version}`,false,muted)];
const documentProfiles={
  content_rights_release:{title:'CONTENT RIGHTS & PERFORMER RELEASE',subtitle:'Content rights, likeness & release terms',compensation:'reference'},
  content_rights_performer_release:{title:'CONTENT RIGHTS & PERFORMER RELEASE',subtitle:'Content rights, likeness & release terms',compensation:'reference'},
  consent_standards:{title:'CONSENT & PRODUCTION STANDARDS',subtitle:'Consent, boundaries & production standards',compensation:'reference'},
  consent_production_standards:{title:'CONSENT & PRODUCTION STANDARDS',subtitle:'Consent, boundaries & production standards',compensation:'reference'},
  management_optional:{title:'OPTIONAL MANAGEMENT AGREEMENT',subtitle:'Optional management terms',compensation:'reference'},
  management_agreement:{title:'OPTIONAL MANAGEMENT AGREEMENT',subtitle:'Optional management terms',compensation:'reference'},
  performer_services:{title:'PERFORMER SERVICES AGREEMENT',subtitle:'Performer services terms',compensation:'reference'},
  performer_services_agreement:{title:'PERFORMER SERVICES AGREEMENT',subtitle:'Performer services terms',compensation:'reference'},
  confidentiality_data:{title:'CONFIDENTIALITY & DATA PROTECTION AGREEMENT',subtitle:'Confidentiality & data protection terms',compensation:'reference'},
  confidentiality_data_protection:{title:'CONFIDENTIALITY & DATA PROTECTION AGREEMENT',subtitle:'Confidentiality & data protection terms',compensation:'reference'},
  compensation_schedule:{title:'COMPENSATION SCHEDULE',subtitle:'Revenue share & payout terms',compensation:'schedule'}
};
const legacyPdfProfile={title:'PERFORMER SERVICES AGREEMENT',subtitle:'Revenue Share & Payout Terms',compensation:'schedule'};
const profileFor=(details,snapshot)=>String(snapshot||'').includes(rendererRevisionMarker)?(documentProfiles[details.template_key]||documentProfiles[details.contract_type]||{title:String(details.title||'FLESHLAB AGREEMENT').toUpperCase(),subtitle:'Agreement terms',compensation:'reference'}):legacyPdfProfile;
const pageHeader=(contractNumber,documentTitle)=>{
  const titleLines=wrapText(documentTitle,30).slice(0,2);
  return ['1 1 1 rg 0 0 595 842 re f',logoDraw(54,769,58),...titleLines.map((value,index)=>pdfText(332,801-index*8,6,value,true,muted)),pdfText(332,783,7,contractNumber,false,muted),rule(770)];
};
const layoutBodyPages=sections=>{
  const pages=[]; let page=[]; let y=732;
  const fresh=()=>{ if(page.length)pages.push(page); page=[]; y=732; };
  const room=height=>{ if(y-height<82)fresh(); };
  for(const section of sections){
    const titleLines=wrapText(section.title,54);
    const paragraphs=section.paragraphs.length?section.paragraphs:[`No additional text is recorded for ${section.title}.`];
    const firstLines=wrapText(paragraphs[0],72);
    // Keep a heading with at least the first line of its following clause.
    room(Math.max(18,titleLines.length*13)+firstLines.length*12+12);
    page.push({kind:'heading',number:section.number,titleLines,y});
    y-=Math.max(18,titleLines.length*13)+6;
    for(const paragraph of paragraphs){
      for(const value of wrapText(paragraph,72)){room(12);page.push({kind:'text',value,y});y-=12;}
      y-=6;
    }
    y-=6;
  }
  if(page.length)pages.push(page); return pages.length?pages:[[]];
};
const statusLabel=status=>['signed','fully_executed'].includes(status)?'EXECUTED':'DRAFT - NOT YET EXECUTED';

export function renderPdf(snapshot, details={}) {
  const raw=String(snapshot || '').split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
  const contractNumber=details.contract_number||raw.find(line=>/FLS-/.test(line))||'FLESHLAB CONTRACT';
  const version=details.version||'1.0'; const legal=details.creator_legal_name||'Legal identity required'; const stage=details.performer_name||'Stage name not recorded';
  const effective=formatLegalDate(details.effective_date); const status=statusLabel(details.status); const profile=profileFor(details,snapshot); const title=profile.title;
  const sections=bodySections(snapshot); const bodyPages=layoutBodyPages(sections); const total=bodyPages.length+2;
  const titleLines=wrapText(title,30).slice(0,2);
  const titleBottom=588-(titleLines.length-1)*29;
  const cover=['1 1 1 rg 0 0 595 842 re f',logoDraw(54,714,124),pdfText(54,693,8,'FLESHLAB STUDIOS',true),pdfText(54,680,8,'A division of Dialogmakers International Ltd.',false,muted),rule(657),pdfText(54,631,8,'AGREEMENT TYPE',true,red),...titleLines.map((line,index)=>pdfText(54,588-index*29,24,line,true)),pdfText(54,titleBottom-39,11,profile.subtitle,false,muted),pdfText(54,484,8,'CONTRACTING PERFORMER',true,red),pdfText(54,464,14,legal,true),pdfText(54,444,9,`Stage Name: ${stage}`,false,muted),rule(420),pdfText(54,398,8,'CONTRACT DETAILS',true,red),pdfText(54,373,8,'CONTRACT NO.',true,muted),pdfText(54,358,10,contractNumber,true),pdfText(54,327,8,'EFFECTIVE DATE',true,muted),pdfText(54,312,9,effective,true),pdfText(300,373,8,'VERSION',true,muted),pdfText(300,358,10,version,true),pdfText(300,327,8,'DOCUMENT STATUS',true,muted),pdfText(300,312,9,status,true,red),rule(285)];
  if(profile.compensation==='schedule') cover.push(pdfText(54,263,8,'COMPENSATION',true,red),pdfText(54,223,28,'30%',true),pdfText(54,207,8,'PERFORMER SHARE',true,muted),pdfText(300,223,28,'70%',true),pdfText(300,207,8,'STUDIO SHARE',true,muted),line(54,186,541),pdfText(54,167,8,'Currency',true,muted),pdfText(180,167,9,'USD'),pdfText(300,167,8,'Minimum Payout',true,muted),pdfText(430,167,9,'USD 50'),pdfText(54,144,8,'Recorded Content',true,muted),pdfText(180,144,9,'Monthly'),pdfText(300,144,8,'Live Cam',true,muted),pdfText(430,144,9,'Every 14 days'));
  else cover.push(pdfText(54,263,8,'COMPENSATION',true,red),pdfText(54,238,9,'Compensation and payment terms are governed by the applicable signed',false,ink),pdfText(54,223,9,'Compensation Schedule between the parties.',false,ink));
  cover.push(...footer(1,total,contractNumber,version));
  const streams=[cover.join('\n')];
  bodyPages.forEach((items,index)=>{const content=pageHeader(contractNumber,title);for(const item of items){if(item.kind==='heading'){content.push(pdfText(54,item.y,9,item.number,true,red),...item.titleLines.map((value,lineIndex)=>pdfText(82,item.y-lineIndex*13,10,value,true)));}else content.push(pdfText(82,item.y,9,item.value,false,ink));}content.push(...footer(index+2,total,contractNumber,version));streams.push(content.join('\n'));});
  const studioSignature=details.studio_signature||''; const performerSignature=details.signature_representation||details.creator_signature||'';
  const signature=['1 1 1 rg 0 0 595 842 re f',...pageHeader(contractNumber,title),pdfText(54,716,20,'SIGNATURES',true),pdfText(54,694,9,status==='EXECUTED'?'The performer has electronically signed this agreement.':'This draft is not yet executed.',false,muted),rule(671),pdfText(54,635,9,'PERFORMER',true,red),pdfText(54,613,9,'Legal Name:',true,muted),pdfText(145,613,11,legal,true),pdfText(54,593,9,'Stage Name:',true,muted),pdfText(145,593,10,stage),pdfText(54,549,8,'Electronically Signed',true,muted),line(54,532,262),pdfText(54,513,9,performerSignature || ' ',false),pdfText(54,480,8,'Signed',true,muted),line(54,463,262),pdfText(54,444,8,details.creator_signed_at ? formatSignedAt(details.creator_signed_at) : ' ',false),pdfText(330,635,9,'FOR FLESHLAB STUDIOS',true,red),pdfText(330,613,11,'Dialogmakers International Ltd.',true),pdfText(330,595,9,details.studio_signer_title||'Authorized Representative',false,muted),pdfText(330,549,8,'Signature',true,muted),line(330,532,541),pdfText(330,513,9,studioSignature || ' ',false),pdfText(330,480,8,'Date',true,muted),line(330,463,541),pdfText(330,444,9,details.studio_signed_at ? formatSignedAt(details.studio_signed_at) : ' ',false),rule(382),pdfText(54,358,8,'DOCUMENT VERIFICATION',true,red),pdfText(54,335,8,'Contract Number',true,muted),pdfText(180,335,9,contractNumber),pdfText(54,315,8,'Version',true,muted),pdfText(180,315,9,version),pdfText(54,295,8,'Document Hash',true,muted),pdfText(180,295,7,details.snapshot_hash||hash(snapshot),false,muted),...footer(total,total,contractNumber,version)].join('\n');streams.push(signature);
  const pageStart=3, font1=pageStart+streams.length, font2=font1+1, image=font2+1, contentStart=image+1;
  const objects=[Buffer.from('<< /Type /Catalog /Pages 2 0 R >>'),Buffer.from(`<< /Type /Pages /Kids [${streams.map((_,i)=>`${pageStart+i} 0 R`).join(' ')}] /Count ${streams.length} >>`)];
  streams.forEach((_,i)=>objects.push(Buffer.from(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${font1} 0 R /F2 ${font2} 0 R >> /XObject << /Logo ${image} 0 R >> >> /Contents ${contentStart+i} 0 R >>`)));
  objects.push(Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'));
  objects.push(Buffer.concat([Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${logo.data.length} >>\nstream\n`),logo.data,Buffer.from('\nendstream')]));
  streams.forEach(stream=>objects.push(Buffer.from(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`)));
  let pdf=Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n','binary');const offsets=[0];objects.forEach((object,index)=>{offsets[index+1]=pdf.length;pdf=Buffer.concat([pdf,Buffer.from(`${index+1} 0 obj\n`),object,Buffer.from('\nendobj\n')]);});const xref=pdf.length;pdf=Buffer.concat([pdf,Buffer.from(`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(value=>`${String(value).padStart(10,'0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`)]);return pdf;
}

export class V3ContractService {
  constructor(db, blob = null) { this.db = db; this.blob = blob; }
  async event(action, actor, contractId, templateId, metadata = {}) {
    await this.db.query('INSERT INTO v3_contract_events(contract_id,template_id,actor_id,action,metadata) VALUES($1,$2,$3,$4,$5)', [contractId, templateId, actor?.id || null, action, metadata]);
  }
  async overview() {
    const counts = await this.db.query(`SELECT
      (SELECT count(*)::int FROM v3_contract_templates WHERE status='draft') drafts,
      (SELECT count(*)::int FROM v3_contract_templates WHERE status='legal_review_required') legal_review_required,
      (SELECT count(*)::int FROM v3_contract_templates WHERE status='approved') approved,
      (SELECT count(*)::int FROM v3_contract_instances WHERE status IN ('assigned','viewed')) awaiting_action,
      (SELECT count(*)::int FROM v3_contract_instances WHERE status='signed') signed,
      (SELECT count(*)::int FROM v3_contract_instances WHERE status IN ('cancelled','superseded')) superseded`);
    const setting = await this.db.query(`SELECT value FROM v3_contract_settings WHERE key='contract_signing_enabled'`);
    return { counts: counts.rows[0], signing_enabled: setting.rows[0]?.value === true, legal_identity: { name:'FLESHLAB Studios', division:'A division of Dialogmakers International Ltd.', company_number:'83273694', address:'2F, No. 2-1, Lane 23, Wenhua St., Taoyuan City, Taoyuan, 324010, Taiwan' } };
  }
  async setSigningEnabled(input, actor) {
    if (typeof input?.signing_enabled !== 'boolean') throw new HttpError(422,'SIGNING_SETTING_REQUIRED','A signing-enabled value is required.');
    if (input.signing_enabled && input.legal_approval_confirmed !== true) throw new HttpError(422,'LEGAL_APPROVAL_CONFIRMATION_REQUIRED','Legal approval must be explicitly confirmed before enabling electronic signing.');
    const result=await this.db.query(`INSERT INTO v3_contract_settings(key,value,updated_at) VALUES('contract_signing_enabled',$1,now()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now() RETURNING value,updated_at`,[input.signing_enabled]);
    await this.event('contract.signing_setting_changed',actor,null,null,{signing_enabled:input.signing_enabled});
    return { signing_enabled:result.rows[0].value===true,updated_at:result.rows[0].updated_at };
  }
  async templates() { const rows = await this.db.query(`SELECT t.*,count(v.id)::int AS version_count,max(v.created_at) AS latest_version_at FROM v3_contract_templates t LEFT JOIN v3_contract_template_versions v ON v.template_id=t.id GROUP BY t.id ORDER BY t.created_at`); return { records: rows.rows }; }
  async creators(q='') { const value=`%${String(q).trim()}%`; const result=await this.db.query(`SELECT c.id,a.full_name,a.country,cp.preferred_name,c.lifecycle,c.user_id,p.display_name,p.legacy_id AS performer_legacy_id,p.status AS performer_status,coalesce(c.user_id IS NOT NULL,false) AS identity_verified FROM v3_creator_records c JOIN performer_applications a ON a.id=c.application_id LEFT JOIN v3_creator_profiles cp ON cp.creator_id=c.id LEFT JOIN v3_creator_performer_links l ON l.creator_id=c.id LEFT JOIN catalog_performers p ON p.legacy_id=l.performer_legacy_id WHERE ($1='' OR a.full_name ILIKE $1 OR cp.preferred_name ILIKE $1 OR p.display_name ILIKE $1) ORDER BY coalesce(cp.preferred_name,a.full_name) LIMIT 50`,[q ? value : '']); return { records:result.rows }; }
  async template(id) { const result = await this.db.query('SELECT * FROM v3_contract_templates WHERE id::text=$1 OR template_key=$1', [id]); if (!result.rowCount) throw new HttpError(404,'TEMPLATE_NOT_FOUND','Contract template was not found.'); const versions = await this.db.query('SELECT id,template_id,version,body,sections,variables,body_hash,created_at FROM v3_contract_template_versions WHERE template_id=$1 ORDER BY created_at DESC',[result.rows[0].id]); return { template: result.rows[0], versions: versions.rows.map(version=>({ ...version, execution_eligibility:executionEligibility(version.body), issue_required_variables:issueRequiredVariables(version) })) }; }
  async createVersion(templateId, input, actor) {
    const template = await this.db.query('SELECT * FROM v3_contract_templates WHERE id::text=$1 OR template_key=$1',[templateId]); if (!template.rowCount) throw new HttpError(404,'TEMPLATE_NOT_FOUND','Contract template was not found.');
    const body = String(input.body || defaultBody(template.rows[0].template_key)); const version = String(input.version || '').trim(); if (!version) throw new HttpError(422,'VERSION_REQUIRED','Template version is required.');
    const result = await this.db.query(`INSERT INTO v3_contract_template_versions(template_id,version,body,sections,variables,body_hash,created_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,template_id,version,sections,variables,body_hash,created_at`, [template.rows[0].id,version,body,input.sections || catalog[template.rows[0].template_key] || [],input.variables || [],hash(body),actor.id]);
    await this.event('contract.template.version_created',actor,null,template.rows[0].id,{ version, body_hash:hash(body) }); return result.rows[0];
  }
  async adminDelete(id,input,actor) {
    const reason=String(input?.reason||'').trim()||'Removed by administrator';
    const client=await this.db.connect();
    try { await client.query('BEGIN');
      const found=await client.query(`SELECT id,status,template_id,contract_number,admin_deleted_at FROM v3_contract_instances WHERE id=$1 FOR UPDATE`,[id]);
      if(!found.rowCount)throw new HttpError(404,'CONTRACT_NOT_FOUND','Contract was not found.');
      const row=found.rows[0];
      if(row.admin_deleted_at){await client.query('COMMIT');return {id,status:row.status,deleted:true,idempotent:true};}
      const terminal=['signed','performer_signed','awaiting_company_signature','fully_executed','superseded'].includes(row.status);
      const next=terminal?row.status:'cancelled';
      const saved=await client.query(`UPDATE v3_contract_instances SET status=$2,admin_deleted_at=now(),admin_deleted_by=$3,admin_deletion_reason=$4 WHERE id=$1 RETURNING id,status,admin_deleted_at`,[id,next,actor.id,reason]);
      await client.query(`INSERT INTO v3_contract_events(contract_id,template_id,actor_id,action,metadata) VALUES($1,$2,$3,'contract.admin_removed',$4)`,[id,row.template_id,actor.id,{contract_number:row.contract_number,previous_status:row.status,resulting_status:next,reason,physical_delete:false}]);
      await client.query('COMMIT');return {...saved.rows[0],deleted:true};
    } catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;} finally {client.release();}
  }
  async assign(input, actor) {
    const version = await this.db.query(`SELECT v.*,t.template_key,t.title,t.contract_type,t.status FROM v3_contract_template_versions v JOIN v3_contract_templates t ON t.id=v.template_id WHERE v.id=$1`,[input.template_version_id]); if (!version.rowCount) throw new HttpError(404,'TEMPLATE_VERSION_NOT_FOUND','Template version was not found.');
    if (version.rows[0].status === 'retired') throw new HttpError(409,'TEMPLATE_RETIRED','Retired templates cannot create contracts.');
    const creator = await this.db.query(`SELECT c.id,a.full_name,cp.preferred_name,c.private_profile,p.display_name,p.legacy_id AS performer_legacy_id FROM v3_creator_records c JOIN performer_applications a ON a.id=c.application_id LEFT JOIN v3_creator_profiles cp ON cp.creator_id=c.id LEFT JOIN v3_creator_performer_links l ON l.creator_id=c.id LEFT JOIN catalog_performers p ON p.legacy_id=l.performer_legacy_id WHERE c.id=$1`,[input.creator_id]); if (!creator.rowCount) throw new HttpError(404,'CREATOR_NOT_FOUND','Creator was not found.');
    if (!creator.rows[0].full_name || !creator.rows[0].display_name) throw new HttpError(422,'LEGAL_IDENTITY_REQUIRED','A verified legal name and linked stage name are required before contract issuance.');
    const number = String(input.contract_number || `FLS-${version.rows[0].contract_type.slice(0,3).toUpperCase()}-${new Date().getUTCFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`); const values={ company_legal_name:'Dialogmakers International Ltd.', company_number:'83273694', creator_legal_name:creator.rows[0].full_name, performer_name:creator.rows[0].display_name, contract_number:number, effective_date:input.effective_date || new Date().toISOString().slice(0,10), template_version:version.rows[0].version, contract_status:'internal_draft', compensation_plan:input.compensation_plan || 'LEGAL_REVIEW_REQUIRED', payment_cycle:input.payment_cycle || 'LEGAL_REVIEW_REQUIRED', license_term:input.license_term || 'LEGAL_REVIEW_REQUIRED', territory:input.territory || 'worldwide', governing_law:input.governing_law || 'LEGAL_REVIEW_REQUIRED' }; const snapshot=withRendererRevision(replaceVariables(version.rows[0].body,values)); const instance=await this.db.query(`INSERT INTO v3_contract_instances(template_version_id,template_id,creator_id,performer_legacy_id,contract_number,status,rendered_snapshot,snapshot_hash,creator_legal_name,performer_name,effective_date,variables,created_by) VALUES($1,$2,$3,$4,$5,'internal_draft',$6,$7,$8,$9,$10,$11,$12) RETURNING *`,[version.rows[0].id,version.rows[0].template_id,creator.rows[0].id,creator.rows[0].performer_legacy_id || null,number,snapshot,hash(snapshot),values.creator_legal_name,values.performer_name,values.effective_date,values,actor.id]); await this.event('contract.draft_created',actor,instance.rows[0].id,version.rows[0].template_id,{ contract_number:number, legal_review_required:version.rows[0].status !== 'approved' }); await this.db.query(`INSERT INTO v3_creator_notifications(creator_id,kind,title,body,action_path) VALUES($1,'contract_assigned','Contract available','A new contract draft is available for review.','/v3/creator/contracts')`,[creator.rows[0].id]); return safe(instance.rows[0]);
  }
  async issue(input,actor) {
    const creatorId=String(input?.creator_id||''), versionId=String(input?.template_version_id||''), key=String(input?.idempotency_key||'').trim();
    if(!creatorId||!versionId||!key)throw new HttpError(422,'ISSUE_DETAILS_REQUIRED','Creator, exact version, and issuance reference are required.');
    if(key.length>160)throw new HttpError(422,'ISSUE_IDEMPOTENCY_INVALID','The issuance reference is invalid.');
    const client=await this.db.connect();
    try { await client.query('BEGIN');
      const version=await client.query(`SELECT v.*,t.title,t.contract_type,t.template_key FROM v3_contract_template_versions v JOIN v3_contract_templates t ON t.id=v.template_id WHERE v.id=$1 FOR UPDATE`,[versionId]);
      if(!version.rowCount)throw new HttpError(404,'TEMPLATE_VERSION_NOT_FOUND','Template version was not found.');
      const eligibility=executionEligibility(version.rows[0].body);
      if(!eligibility.eligible)throw new HttpError(409,'CONTRACT_VERSION_NOT_ELIGIBLE_FOR_ISSUE','This immutable version is approved but not eligible for issuance because it contains prohibited draft/legal-review markers.');
      const required=issueRequiredVariables(version.rows[0]);
      if(required.some(field=>!String(input?.[field]||'').trim()))throw new HttpError(422,'ISSUE_TEMPLATE_DETAILS_REQUIRED',`The exact template version requires: ${required.join(', ') || 'no additional client values'}.`);
      if(required.includes('management_opt_in') && input?.management_opt_in!==true)throw new HttpError(422,'MANAGEMENT_OPT_IN_REQUIRED','This Management Agreement version requires an explicit performer opt-in.');
      const terms=Object.fromEntries(required.map(field=>[field,String(input[field]).trim()]));
      if(version.rows[0].template_key==='management_optional') terms.management_opt_in=true;
      const requestHash=hash(JSON.stringify({creatorId,versionId,terms}));
      const prior=await client.query(`SELECT * FROM v3_contract_issue_requests WHERE idempotency_key=$1 FOR UPDATE`,[key]);
      if(prior.rowCount){const row=prior.rows[0];if(row.creator_id!==creatorId||row.template_version_id!==versionId||row.request_hash!==requestHash)throw new HttpError(409,'ISSUE_IDEMPOTENCY_CONFLICT','This issuance reference is already bound to a different request.');if(!row.contract_instance_id)throw new HttpError(409,'ISSUE_IN_PROGRESS','This issuance is still being recorded.');const contract=await client.query(`SELECT * FROM v3_contract_instances WHERE id=$1`,[row.contract_instance_id]);await client.query('COMMIT');return {...safe(contract.rows[0]),idempotent:true};}
      const approval=await client.query(`SELECT approval_reference FROM v3_contract_version_approvals WHERE contract_template_version_id=$1 AND status='approved' AND revoked_at IS NULL FOR UPDATE`,[versionId]);
      if(!approval.rowCount)throw new HttpError(409,'CONTRACT_VERSION_NOT_LEGALLY_APPROVED','Only an actively approved immutable template version may be issued.');
      const creator=await client.query(`SELECT c.id,c.user_id,a.full_name,p.legacy_id AS performer_legacy_id,p.display_name FROM v3_creator_records c JOIN performer_applications a ON a.id=c.application_id JOIN v3_creator_performer_links l ON l.creator_id=c.id JOIN catalog_performers p ON p.legacy_id=l.performer_legacy_id JOIN app_users u ON u.id=c.user_id AND u.role='performer' AND u.account_status='active' WHERE c.id=$1 FOR UPDATE`,[creatorId]);
      if(!creator.rowCount)throw new HttpError(422,'PERFORMER_LINK_REQUIRED','A verified performer, active linked authenticated user, and performer linkage are required.');
      await client.query(`INSERT INTO v3_contract_issue_requests(idempotency_key,creator_id,template_version_id,request_hash,created_by) VALUES($1,$2,$3,$4,$5)`,[key,creatorId,versionId,requestHash,actor.id]);
      const number=`FLS-${version.rows[0].contract_type.slice(0,3).toUpperCase()}-${new Date().getUTCFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const values={company_legal_name:'Dialogmakers International Ltd.',company_number:'83273694',creator_legal_name:creator.rows[0].full_name,performer_name:creator.rows[0].display_name,contract_number:number,effective_date:'Effective on electronic signature',template_version:version.rows[0].version,contract_status:'assigned',...terms};
      const snapshot=withRendererRevision(replaceVariables(version.rows[0].body,values));
      if(/\{\{[a-z0-9_]+\}\}/i.test(snapshot))throw new HttpError(422,'ISSUE_TEMPLATE_VARIABLE_UNRESOLVED','The immutable template still has unresolved variables and cannot be issued.');
      const snapshotHash=hash(snapshot);
      const saved=await client.query(`INSERT INTO v3_contract_instances(template_version_id,template_id,creator_id,performer_legacy_id,contract_number,status,rendered_snapshot,snapshot_hash,creator_legal_name,performer_name,effective_date,variables,created_by) VALUES($1,$2,$3,$4,$5,'assigned',$6,$7,$8,$9,NULL,$10,$11) RETURNING *`,[versionId,version.rows[0].template_id,creatorId,creator.rows[0].performer_legacy_id,number,snapshot,snapshotHash,creator.rows[0].full_name,creator.rows[0].display_name,values,actor.id]);
      const event=await client.query(`INSERT INTO v3_contract_events(contract_id,template_id,actor_id,action,metadata) VALUES($1,$2,$3,'contract.assigned',$4) RETURNING id`,[saved.rows[0].id,version.rows[0].template_id,actor.id,{idempotency_key:key,performer_user_id:creator.rows[0].user_id,template_version_id:versionId,document_hash:snapshotHash,approval_reference:approval.rows[0].approval_reference,effective_date_rule:'effective_on_electronic_signature'}]);
      await client.query(`UPDATE v3_contract_issue_requests SET contract_instance_id=$2 WHERE idempotency_key=$1`,[key,saved.rows[0].id]);
      await client.query(`INSERT INTO v3_creator_notifications(creator_id,kind,title,body,action_path) VALUES($1,'contract_assigned','Contract assigned','A contract is ready for your review and electronic signature.','/v3/creator/contracts')`,[creatorId]);
      await client.query('COMMIT');return {...safe(saved.rows[0]),performer_user_id:creator.rows[0].user_id,approval_reference:approval.rows[0].approval_reference,assignment_event_id:event.rows[0].id,idempotency_key:key};
    } catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;} finally {client.release();}
  }
  async rendererReissueCandidates() {
    const result=await this.db.query(`SELECT i.id,i.contract_number,i.status,i.snapshot_hash,i.template_version_id,i.creator_id,i.creator_legal_name,i.performer_name,t.title,t.contract_type,v.version,c.user_id AS performer_user_id,p.display_name AS performer_display_name
      FROM v3_contract_instances i
      JOIN v3_contract_template_versions v ON v.id=i.template_version_id
      JOIN v3_contract_templates t ON t.id=v.template_id
      JOIN v3_creator_records c ON c.id=i.creator_id
      LEFT JOIN catalog_performers p ON p.legacy_id=i.performer_legacy_id
      WHERE i.status IN ('assigned','viewed') AND i.rendered_snapshot NOT LIKE $1
      ORDER BY i.issued_at DESC`,[`%${rendererRevisionMarker}%`]);
    return { records:result.rows };
  }
  async reissueRenderer(id, actor) {
    const client=await this.db.connect();
    try {
      await client.query('BEGIN');
      const current=await client.query(`SELECT i.*,v.version,v.body,v.template_id,t.title,t.contract_type,c.user_id AS performer_user_id,p.display_name AS performer_display_name
        FROM v3_contract_instances i
        JOIN v3_contract_template_versions v ON v.id=i.template_version_id
        JOIN v3_contract_templates t ON t.id=v.template_id
        JOIN v3_creator_records c ON c.id=i.creator_id
        LEFT JOIN catalog_performers p ON p.legacy_id=i.performer_legacy_id
        WHERE i.id=$1 FOR UPDATE OF i,v,t,c`,[id]);
      if(!current.rowCount)throw new HttpError(404,'CONTRACT_NOT_FOUND','Contract was not found.');
      const old=current.rows[0];
      const prior=await client.query(`SELECT metadata->>'replacement_contract_id' AS replacement_contract_id FROM v3_contract_events WHERE contract_id=$1 AND action='contract.renderer_superseded' ORDER BY created_at DESC LIMIT 1`,[id]);
      if(prior.rowCount&&prior.rows[0].replacement_contract_id){
        const replacement=await client.query(`SELECT * FROM v3_contract_instances WHERE id=$1`,[prior.rows[0].replacement_contract_id]);
        await client.query('COMMIT');
        return { old_contract_id:id, replacement:safe(replacement.rows[0]), idempotent:true };
      }
      if(!['assigned','viewed'].includes(old.status))throw new HttpError(409,'CONTRACT_REISSUE_NOT_ALLOWED','Only an unsigned assigned contract can be corrected and reissued.');
      if(String(old.rendered_snapshot||'').includes(rendererRevisionMarker))throw new HttpError(409,'CONTRACT_RENDERER_CURRENT','This contract already uses the current document renderer.');
      if(!old.performer_user_id||!old.performer_legacy_id||!old.performer_display_name)throw new HttpError(422,'PERFORMER_LINK_REQUIRED','The original contract no longer has a valid linked performer user.');
      const approval=await client.query(`SELECT approval_reference FROM v3_contract_version_approvals WHERE contract_template_version_id=$1 AND status='approved' AND revoked_at IS NULL FOR UPDATE`,[old.template_version_id]);
      if(!approval.rowCount)throw new HttpError(409,'CONTRACT_VERSION_NOT_LEGALLY_APPROVED','The exact immutable version is no longer actively approved for reissue.');
      const number=`FLS-${old.contract_type.slice(0,3).toUpperCase()}-${new Date().getUTCFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const oldValues=old.variables&&typeof old.variables==='object'?old.variables:{};
      const values={...oldValues,company_legal_name:oldValues.company_legal_name||'Dialogmakers International Ltd.',company_number:oldValues.company_number||'83273694',creator_legal_name:old.creator_legal_name,performer_name:old.performer_display_name,contract_number:number,effective_date:'Effective on electronic signature',template_version:old.version,contract_status:'assigned'};
      const snapshot=withRendererRevision(replaceVariables(old.body,values)),snapshotHash=hash(snapshot);
      const replacement=await client.query(`INSERT INTO v3_contract_instances(template_version_id,template_id,creator_id,performer_legacy_id,contract_number,status,rendered_snapshot,snapshot_hash,creator_legal_name,performer_name,effective_date,variables,created_by) VALUES($1,$2,$3,$4,$5,'assigned',$6,$7,$8,$9,NULL,$10,$11) RETURNING *`,[old.template_version_id,old.template_id,old.creator_id,old.performer_legacy_id,number,snapshot,snapshotHash,old.creator_legal_name,old.performer_display_name,values,actor.id]);
      const replacementId=replacement.rows[0].id;
      const event=await client.query(`INSERT INTO v3_contract_events(contract_id,template_id,actor_id,action,metadata) VALUES($1,$2,$3,'contract.renderer_superseded',$4) RETURNING id`,[id,old.template_id,actor.id,{replacement_contract_id:replacementId,old_document_hash:old.snapshot_hash,new_document_hash:snapshotHash,renderer_revision:'contract_pdf_v2',reason:'renderer_profile_correction'}]);
      await client.query(`UPDATE v3_contract_instances SET status='superseded' WHERE id=$1`,[id]);
      const entitlements=await client.query(`SELECT id FROM v3_contract_signing_entitlements WHERE contract_instance_id=$1 AND revoked_at IS NULL FOR UPDATE`,[id]);
      for(const entitlement of entitlements.rows){
        const revokeEvent=await client.query(`INSERT INTO v3_contract_events(contract_id,template_id,actor_id,action,metadata) VALUES($1,$2,$3,'contract.signing_entitlement_revoked',$4) RETURNING id`,[id,old.template_id,actor.id,{entitlement_id:entitlement.id,reason:'contract_renderer_superseded'}]);
        await client.query(`UPDATE v3_contract_signing_entitlements SET revoked_at=now(),revoked_by=$2,revocation_reason='contract_renderer_superseded',revocation_event_id=$3 WHERE id=$1`,[entitlement.id,actor.id,revokeEvent.rows[0].id]);
      }
      const assigned=await client.query(`INSERT INTO v3_contract_events(contract_id,template_id,actor_id,action,metadata) VALUES($1,$2,$3,'contract.assigned',$4) RETURNING id`,[replacementId,old.template_id,actor.id,{reissued_from_contract_id:id,performer_user_id:old.performer_user_id,template_version_id:old.template_version_id,document_hash:snapshotHash,approval_reference:approval.rows[0].approval_reference,effective_date_rule:'effective_on_electronic_signature'}]);
      await client.query(`INSERT INTO v3_creator_notifications(creator_id,kind,title,body,action_path) VALUES($1,'contract_assigned','Corrected contract assigned','A corrected contract version is ready for review.','/v3/creator/contracts')`,[old.creator_id]);
      await client.query('COMMIT');
      return { old_contract_id:id, old_document_hash:old.snapshot_hash, replacement:{...safe(replacement.rows[0]),performer_user_id:old.performer_user_id,approval_reference:approval.rows[0].approval_reference,assignment_event_id:assigned.rows[0].id}, supersede_event_id:event.rows[0].id, revoked_entitlement_count:entitlements.rowCount };
    } catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;} finally {client.release();}
  }
  async preview(input) {
    const version = await this.db.query(`SELECT v.*,t.template_key,t.title,t.contract_type,t.status FROM v3_contract_template_versions v JOIN v3_contract_templates t ON t.id=v.template_id WHERE v.id=$1`, [input.template_version_id]);
    if (!version.rowCount) throw new HttpError(404, 'TEMPLATE_VERSION_NOT_FOUND', 'Template version was not found.');
    if (version.rows[0].status === 'retired') throw new HttpError(409, 'TEMPLATE_RETIRED', 'Retired templates cannot create contracts.');
    const creator = input.creator_id ? await this.db.query(`SELECT c.id,a.full_name,cp.preferred_name,p.display_name FROM v3_creator_records c JOIN performer_applications a ON a.id=c.application_id LEFT JOIN v3_creator_profiles cp ON cp.creator_id=c.id LEFT JOIN v3_creator_performer_links l ON l.creator_id=c.id LEFT JOIN catalog_performers p ON p.legacy_id=l.performer_legacy_id WHERE c.id=$1`, [input.creator_id]) : { rowCount: 0, rows: [] };
    if (input.creator_id && !creator.rowCount) throw new HttpError(404, 'CREATOR_NOT_FOUND', 'Creator was not found.');
    const contractNumber = String(input.contract_number || `FLS-${version.rows[0].contract_type.slice(0,3).toUpperCase()}-${new Date().getUTCFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`);
    const values = { company_legal_name:'Dialogmakers International Ltd.', company_number:'83273694', creator_legal_name:input.creator_legal_name || creator.rows[0]?.full_name || 'SAMPLE CREATOR — NOT A CONTRACT', performer_name:input.performer_name || creator.rows[0]?.display_name || creator.rows[0]?.preferred_name || 'SAMPLE PERFORMER', contract_number:contractNumber, effective_date:input.effective_date || new Date().toISOString().slice(0,10), template_version:version.rows[0].version, contract_status:'internal_draft', compensation_plan:input.compensation_plan || 'LEGAL_REVIEW_REQUIRED', payment_cycle:input.payment_cycle || 'LEGAL_REVIEW_REQUIRED', license_term:input.license_term || 'LEGAL_REVIEW_REQUIRED', territory:input.territory || 'worldwide', governing_law:input.governing_law || 'LEGAL_REVIEW_REQUIRED', studio_signer_name:'AUTHORIZED REPRESENTATIVE — LEGAL REVIEW', studio_signature:'[NO SIGNATURE]', studio_signed_at:'[NOT SIGNED]', creator_signature:'[NO SIGNATURE]', creator_signed_at:'[NOT SIGNED]', document_hash:'[GENERATED FOR PREVIEW]' };
    const snapshot = withRendererRevision(replaceVariables(version.rows[0].body, values));
    return { template: { id:version.rows[0].template_id, title:version.rows[0].title, contract_type:version.rows[0].contract_type, status:version.rows[0].status, version:version.rows[0].version }, values, snapshot, hash:hash(snapshot), legal_review_required:version.rows[0].status !== 'approved', signing_enabled:contractSigningEnabled, sample_preview:!input.creator_id };
  }
  async versionApprovals(templateVersionId) { const version=await this.db.query(`SELECT v.id,v.version,v.body_hash,t.id AS template_id,t.title,t.contract_type FROM v3_contract_template_versions v JOIN v3_contract_templates t ON t.id=v.template_id WHERE v.id=$1`,[templateVersionId]); if(!version.rowCount)throw new HttpError(404,'TEMPLATE_VERSION_NOT_FOUND','Template version was not found.'); const result=await this.db.query(`SELECT a.*,u.username AS approved_by_username,r.username AS revoked_by_username FROM v3_contract_version_approvals a JOIN app_users u ON u.id=a.approved_by LEFT JOIN app_users r ON r.id=a.revoked_by WHERE a.contract_template_version_id=$1 ORDER BY a.created_at DESC`,[templateVersionId]); return { version:version.rows[0], records:result.rows }; }
  async approveVersion(templateVersionId,input,actor) { const reference=String(input?.approval_reference||'').trim(); if(!reference)throw new HttpError(422,'LEGAL_APPROVAL_REFERENCE_REQUIRED','A legal approval reference is required.'); const client=await this.db.connect(); try { await client.query('BEGIN'); const version=await client.query(`SELECT id,template_id,version,body_hash FROM v3_contract_template_versions WHERE id=$1 FOR UPDATE`,[templateVersionId]); if(!version.rowCount)throw new HttpError(404,'TEMPLATE_VERSION_NOT_FOUND','Template version was not found.'); const active=await client.query(`SELECT id FROM v3_contract_version_approvals WHERE contract_template_version_id=$1 AND status='approved' AND revoked_at IS NULL FOR UPDATE`,[templateVersionId]); if(active.rowCount)throw new HttpError(409,'VERSION_ALREADY_APPROVED','This exact template version already has an active legal approval.'); const event=await client.query(`INSERT INTO v3_contract_events(template_id,actor_id,action,metadata) VALUES($1,$2,'contract.version.legally_approved',$3) RETURNING id`,[version.rows[0].template_id,actor.id,{template_version_id:templateVersionId,version:version.rows[0].version,body_hash:version.rows[0].body_hash,approval_reference:reference}]); const saved=await client.query(`INSERT INTO v3_contract_version_approvals(contract_template_id,contract_template_version_id,status,approved_by,approval_reference,approval_note,approval_event_id) VALUES($1,$2,'approved',$3,$4,$5,$6) RETURNING *`,[version.rows[0].template_id,templateVersionId,actor.id,reference,String(input?.approval_note||'').trim()||null,event.rows[0].id]); await client.query('COMMIT'); return saved.rows[0]; } catch(error) { await client.query('ROLLBACK').catch(()=>{}); throw error; } finally { client.release(); } }
  async revokeVersionApproval(approvalId,input,actor) { const reason=String(input?.revocation_reason||'').trim(); if(!reason)throw new HttpError(422,'LEGAL_REVOCATION_REASON_REQUIRED','A revocation reason is required.'); const client=await this.db.connect(); try { await client.query('BEGIN'); const approval=await client.query(`SELECT * FROM v3_contract_version_approvals WHERE id=$1 FOR UPDATE`,[approvalId]); if(!approval.rowCount)throw new HttpError(404,'LEGAL_APPROVAL_NOT_FOUND','Legal approval was not found.'); if(approval.rows[0].status!=='approved'||approval.rows[0].revoked_at)throw new HttpError(409,'LEGAL_APPROVAL_NOT_ACTIVE','Legal approval is not active.'); const event=await client.query(`INSERT INTO v3_contract_events(template_id,actor_id,action,metadata) VALUES($1,$2,'contract.version.legal_approval_revoked',$3) RETURNING id`,[approval.rows[0].contract_template_id,actor.id,{approval_id:approvalId,template_version_id:approval.rows[0].contract_template_version_id,reason}]); const saved=await client.query(`UPDATE v3_contract_version_approvals SET status='revoked',revoked_at=now(),revoked_by=$2,revocation_reason=$3,revocation_event_id=$4 WHERE id=$1 RETURNING *`,[approvalId,actor.id,reason,event.rows[0].id]); await client.query('COMMIT'); return saved.rows[0]; } catch(error) { await client.query('ROLLBACK').catch(()=>{}); throw error; } finally { client.release(); } }
  async acceptanceEntitlements(contractId) { const contract=await this.db.query(`SELECT i.id,i.contract_number,i.status,i.snapshot_hash,i.template_version_id,i.performer_name,c.user_id,p.display_name AS performer_display_name,t.title,v.version FROM v3_contract_instances i JOIN v3_creator_records c ON c.id=i.creator_id LEFT JOIN catalog_performers p ON p.legacy_id=i.performer_legacy_id LEFT JOIN v3_contract_template_versions v ON v.id=i.template_version_id LEFT JOIN v3_contract_templates t ON t.id=v.template_id WHERE i.id=$1`,[contractId]); if(!contract.rowCount)throw new HttpError(404,'CONTRACT_NOT_FOUND','Contract was not found.'); const records=await this.db.query(`SELECT e.*,u.username AS authorized_by_username FROM v3_contract_signing_entitlements e JOIN app_users u ON u.id=e.authorized_by WHERE e.contract_instance_id=$1 ORDER BY e.created_at DESC`,[contractId]); return { contract:contract.rows[0], records:records.rows }; }
  async grantAcceptanceEntitlement(contractId,input,actor) { const userId=String(input?.performer_user_id||''); const expiresAt=new Date(input?.expires_at); if(!userId||Number.isNaN(expiresAt.getTime())||expiresAt<=new Date()||expiresAt-Date.now()>7*24*60*60*1000)throw new HttpError(422,'ACCEPTANCE_ENTITLEMENT_INVALID','A performer user and expiry within seven days are required.'); const client=await this.db.connect(); try { await client.query('BEGIN'); const contract=await client.query(`SELECT i.id,i.contract_number,i.creator_id,i.template_id,i.template_version_id,c.user_id FROM v3_contract_instances i JOIN v3_creator_records c ON c.id=i.creator_id WHERE i.id=$1 AND c.user_id=$2 AND i.status IN ('assigned','viewed') FOR UPDATE`,[contractId,userId]); if(!contract.rowCount)throw new HttpError(404,'ACCEPTANCE_CONTRACT_NOT_FOUND','The controlled contract must be assigned to that exact performer user.'); if(!contract.rows[0].contract_number.startsWith('ACCEPTANCE-TEST-'))throw new HttpError(422,'ACCEPTANCE_CONTRACT_REQUIRED','Only a dedicated acceptance-test contract can receive this entitlement.'); const existing=await client.query(`SELECT id FROM v3_contract_signing_entitlements WHERE contract_instance_id=$1 AND performer_user_id=$2 AND revoked_at IS NULL FOR UPDATE`,[contractId,userId]); if(existing.rowCount)throw new HttpError(409,'ACCEPTANCE_ENTITLEMENT_EXISTS','An active acceptance entitlement already exists for this exact contract and performer.'); const event=await client.query(`INSERT INTO v3_contract_events(contract_id,template_id,actor_id,action,metadata) VALUES($1,$2,$3,'contract.acceptance_entitlement_granted',$4) RETURNING id`,[contractId,contract.rows[0].template_id,actor.id,{performer_user_id:userId,purpose:'production_acceptance_test',expires_at:expiresAt.toISOString()}]); const saved=await client.query(`INSERT INTO v3_contract_signing_entitlements(contract_instance_id,performer_user_id,purpose,authorized_by,expires_at,audit_event_id) VALUES($1,$2,'production_acceptance_test',$3,$4,$5) RETURNING *`,[contractId,userId,actor.id,expiresAt,event.rows[0].id]); await client.query('COMMIT'); return saved.rows[0]; } catch(error) { await client.query('ROLLBACK').catch(()=>{}); throw error; } finally { client.release(); } }
  async productionSigningEntitlements(contractId) {
    const result=await this.db.query(`SELECT e.*,u.username AS authorized_by_username FROM v3_contract_signing_entitlements e JOIN app_users u ON u.id=e.authorized_by WHERE e.contract_instance_id=$1 AND e.purpose='production_contract_signing' ORDER BY e.created_at DESC`,[contractId]);
    return { records:result.rows };
  }
  async grantProductionSigningEntitlement(contractId,input,actor) {
    const expiresAt=new Date(input?.expires_at);
    if(input?.confirmed!==true||Number.isNaN(expiresAt.getTime())||expiresAt<=new Date()||expiresAt-Date.now()>7*24*60*60*1000)throw new HttpError(422,'PRODUCTION_SIGNING_ENTITLEMENT_INVALID','Explicit confirmation and an expiry within seven days are required.');
    const client=await this.db.connect();
    try { await client.query('BEGIN');
      const contract=await client.query(`SELECT i.id,i.contract_number,i.creator_id,i.template_id,i.template_version_id,i.status,i.snapshot_hash,c.user_id,p.display_name AS performer_display_name
        FROM v3_contract_instances i JOIN v3_creator_records c ON c.id=i.creator_id
        JOIN app_users u ON u.id=c.user_id AND u.role='performer' AND u.account_status='active'
        LEFT JOIN catalog_performers p ON p.legacy_id=i.performer_legacy_id
        WHERE i.id=$1 FOR UPDATE OF i,c,u`,[contractId]);
      if(!contract.rowCount)throw new HttpError(404,'CONTRACT_NOT_FOUND','The contract or its active performer linkage was not found.');
      const row=contract.rows[0];
      if(String(row.contract_number||'').startsWith('ACCEPTANCE-TEST-'))throw new HttpError(422,'PRODUCTION_CONTRACT_REQUIRED','Acceptance-test contracts use their dedicated entitlement workflow.');
      if(!['assigned','viewed'].includes(row.status))throw new HttpError(409,'CONTRACT_NOT_SIGNABLE','Only an assigned, unsigned contract can receive a signing entitlement.');
      const approval=await client.query(`SELECT id FROM v3_contract_version_approvals WHERE contract_template_version_id=$1 AND status='approved' AND revoked_at IS NULL FOR UPDATE`,[row.template_version_id]);
      if(!approval.rowCount)throw new HttpError(409,'CONTRACT_VERSION_NOT_LEGALLY_APPROVED','The exact immutable contract version is not actively legally approved.');
      const existing=await client.query(`SELECT id,expires_at FROM v3_contract_signing_entitlements WHERE contract_instance_id=$1 AND performer_user_id=$2 AND purpose='production_contract_signing' AND revoked_at IS NULL FOR UPDATE`,[contractId,row.user_id]);
      if(existing.rowCount) { await client.query('COMMIT'); return {...existing.rows[0],idempotent:true}; }
      const event=await client.query(`INSERT INTO v3_contract_events(contract_id,template_id,actor_id,action,metadata) VALUES($1,$2,$3,'contract.production_signing_entitlement_granted',$4) RETURNING id`,[contractId,row.template_id,actor.id,{performer_user_id:row.user_id,purpose:'production_contract_signing',expires_at:expiresAt.toISOString(),document_hash:row.snapshot_hash,template_version_id:row.template_version_id}]);
      const saved=await client.query(`INSERT INTO v3_contract_signing_entitlements(contract_instance_id,performer_user_id,purpose,authorized_by,expires_at,audit_event_id) VALUES($1,$2,'production_contract_signing',$3,$4,$5) RETURNING *`,[contractId,row.user_id,actor.id,expiresAt,event.rows[0].id]);
      await client.query('COMMIT'); return {...saved.rows[0],performer_user_id:row.user_id,performer_display_name:row.performer_display_name};
    } catch(error) { await client.query('ROLLBACK').catch(()=>{}); throw error; } finally { client.release(); }
  }
  async revokeAcceptanceEntitlement(entitlementId,input,actor) { const reason=String(input?.revocation_reason||'').trim(); if(!reason)throw new HttpError(422,'ACCEPTANCE_REVOCATION_REASON_REQUIRED','A revocation reason is required.'); const client=await this.db.connect(); try { await client.query('BEGIN'); const entitlement=await client.query(`SELECT e.*,i.template_id FROM v3_contract_signing_entitlements e JOIN v3_contract_instances i ON i.id=e.contract_instance_id WHERE e.id=$1 FOR UPDATE`,[entitlementId]); if(!entitlement.rowCount)throw new HttpError(404,'ACCEPTANCE_ENTITLEMENT_NOT_FOUND','Acceptance entitlement was not found.'); if(entitlement.rows[0].revoked_at)throw new HttpError(409,'ACCEPTANCE_ENTITLEMENT_NOT_ACTIVE','Acceptance entitlement is not active.'); const event=await client.query(`INSERT INTO v3_contract_events(contract_id,template_id,actor_id,action,metadata) VALUES($1,$2,$3,'contract.acceptance_entitlement_revoked',$4) RETURNING id`,[entitlement.rows[0].contract_instance_id,entitlement.rows[0].template_id,actor.id,{entitlement_id:entitlementId,reason}]); const saved=await client.query(`UPDATE v3_contract_signing_entitlements SET revoked_at=now(),revoked_by=$2,revocation_reason=$3,revocation_event_id=$4 WHERE id=$1 RETURNING *`,[entitlementId,actor.id,reason,event.rows[0].id]); await client.query('COMMIT'); return saved.rows[0]; } catch(error) { await client.query('ROLLBACK').catch(()=>{}); throw error; } finally { client.release(); } }
  async instances(actor) { const result=await this.db.query(`SELECT i.id,i.contract_number,i.status,i.creator_id,i.creator_legal_name,i.performer_name,i.issued_at,i.viewed_at,i.signed_at,i.source,i.snapshot_hash,t.title,t.contract_type,v.version,s.legal_signer_name,s.signature_representation,s.document_hash AS signed_document_hash,s.signing_event_id,a.object_key AS signed_pdf_object_key,a.content_hash AS signed_pdf_hash,c.user_id AS performer_user_id,p.display_name AS performer_display_name FROM v3_contract_instances i LEFT JOIN v3_creator_records c ON c.id=i.creator_id LEFT JOIN catalog_performers p ON p.legacy_id=i.performer_legacy_id LEFT JOIN v3_contract_template_versions v ON v.id=i.template_version_id LEFT JOIN v3_contract_templates t ON t.id=v.template_id LEFT JOIN v3_contract_signatures s ON s.contract_id=i.id AND s.signer_role='creator' LEFT JOIN v3_contract_attachments a ON a.contract_id=i.id AND a.attachment_type='final_signed_pdf' WHERE i.admin_deleted_at IS NULL ORDER BY i.issued_at DESC`); return { records:result.rows }; }
  async creatorInstances(user) {
    const [result,setting]=await Promise.all([
      this.db.query(`SELECT i.id,i.contract_number,i.status,i.creator_id,i.creator_legal_name,i.performer_name,i.issued_at,i.viewed_at,i.signed_at,i.source,i.snapshot_hash,t.title,t.contract_type,v.version,CASE WHEN EXISTS (SELECT 1 FROM v3_contract_version_approvals va WHERE va.contract_template_version_id=v.id AND va.status='approved' AND va.revoked_at IS NULL) THEN 'approved' ELSE t.status END AS template_status,
        EXISTS(SELECT 1 FROM v3_contract_version_approvals va WHERE va.contract_template_version_id=i.template_version_id AND va.status='approved' AND va.revoked_at IS NULL) AS version_approved,
        s.legal_signer_name,s.signature_representation,s.document_hash AS signed_document_hash,a.content_hash AS signed_pdf_hash,
        EXISTS(SELECT 1 FROM v3_contract_signing_entitlements e WHERE e.contract_instance_id=i.id AND e.performer_user_id=$1 AND e.purpose IN ('production_acceptance_test','production_contract_signing') AND e.revoked_at IS NULL AND e.expires_at>now()) AND i.rendered_snapshot LIKE '%FLESHLAB_RENDERER_PROFILE: contract_pdf_v2%' AND i.rendered_snapshot !~* 'LEGAL_REVIEW_REQUIRED|TEMPLATE[[:space:]]+PREVIEW|NOT[[:space:]]+A[[:space:]]+SIGNED[[:space:]]+CONTRACT' AS signing_available,
        i.rendered_snapshot !~* 'LEGAL_REVIEW_REQUIRED|TEMPLATE[[:space:]]+PREVIEW|NOT[[:space:]]+A[[:space:]]+SIGNED[[:space:]]+CONTRACT' AS execution_eligible
        FROM v3_contract_instances i JOIN v3_creator_records c ON c.id=i.creator_id LEFT JOIN v3_contract_template_versions v ON v.id=i.template_version_id LEFT JOIN v3_contract_templates t ON t.id=v.template_id LEFT JOIN v3_contract_signatures s ON s.contract_id=i.id AND s.signer_role='creator' LEFT JOIN v3_contract_attachments a ON a.contract_id=i.id AND a.attachment_type='final_signed_pdf' WHERE c.user_id=$1 AND i.admin_deleted_at IS NULL ORDER BY i.issued_at DESC`,[user.id]),
      this.db.query(`SELECT value FROM v3_contract_settings WHERE key='contract_signing_enabled'`)
    ]);
    return { records:result.rows, signing_enabled:setting.rows[0]?.value === true };
  }
  async instance(id,user,{admin=false}={}) { const query=admin?`SELECT i.*,t.title,t.contract_type,v.version,s.legal_signer_name,s.signature_representation,s.signed_at AS creator_signed_at,s.document_hash AS signed_document_hash,s.signature_method,s.acknowledgement_at,s.user_agent,s.signing_event_id,a.content_hash AS signed_pdf_hash,a.object_key AS signed_pdf_object_key FROM v3_contract_instances i LEFT JOIN v3_contract_template_versions v ON v.id=i.template_version_id LEFT JOIN v3_contract_templates t ON t.id=v.template_id LEFT JOIN v3_contract_signatures s ON s.contract_id=i.id AND s.signer_role='creator' LEFT JOIN v3_contract_attachments a ON a.contract_id=i.id AND a.attachment_type='final_signed_pdf' WHERE i.id=$1`:`SELECT i.*,t.title,t.contract_type,v.version,s.legal_signer_name,s.signature_representation,s.signed_at AS creator_signed_at,s.document_hash AS signed_document_hash,s.signature_method,s.acknowledgement_at,s.user_agent,s.signing_event_id,a.content_hash AS signed_pdf_hash,a.object_key AS signed_pdf_object_key FROM v3_contract_instances i JOIN v3_creator_records c ON c.id=i.creator_id LEFT JOIN v3_contract_template_versions v ON v.id=i.template_version_id LEFT JOIN v3_contract_templates t ON t.id=v.template_id LEFT JOIN v3_contract_signatures s ON s.contract_id=i.id AND s.signer_role='creator' LEFT JOIN v3_contract_attachments a ON a.contract_id=i.id AND a.attachment_type='final_signed_pdf' WHERE i.id=$1 AND c.user_id=$2`; const result=await this.db.query(query,admin?[id]:[id,user.id]); if(!result.rowCount)throw new HttpError(404,'CONTRACT_NOT_FOUND','Contract was not found.'); const row=result.rows[0]; if(!row.viewed_at && row.status!=='signed'){await this.db.query('UPDATE v3_contract_instances SET viewed_at=now(),status=CASE WHEN status=\'assigned\' THEN \'viewed\' ELSE status END WHERE id=$1',[id]); await this.event('contract.viewed',user,id,row.template_id || null,{});} return { ...safe(row), rendered_snapshot:row.rendered_snapshot };
  }
  async pdf(id,user,opts={}) { const item=await this.instance(id,user,opts); const attachmentType=item.status==='fully_executed'?'final_executed_pdf':item.status==='signed'?'final_signed_pdf':['awaiting_company_signature','performer_signed'].includes(item.status)?'performer_signed_pdf':null; let bytes,documentHash=item.snapshot_hash; if(attachmentType){const attachment=await this.db.query(`SELECT object_key,content_hash FROM v3_contract_attachments WHERE contract_id=$1 AND attachment_type=$2`,[id,attachmentType]);if(!attachment.rowCount||!this.blob)throw new HttpError(409,'SIGNED_PDF_UNAVAILABLE','The finalized contract is not available.');const file=await this.blob.downloadStream(attachment.rows[0].object_key);bytes=await bufferFromStream(file.stream);if(hash(bytes)!==attachment.rows[0].content_hash)throw new HttpError(409,'SIGNED_PDF_INTEGRITY_FAILED','The finalized contract failed its integrity check.');documentHash=attachment.rows[0].content_hash;}else bytes=renderPdf(item.rendered_snapshot,item); await this.event('contract.pdf_download',user,id,null,{ hash:documentHash,finalized:Boolean(attachmentType),attachment_type:attachmentType }); return { bytes, hash:documentHash, contract_number:item.contract_number }; }
  async sign(id, user, input = {}, request = null) {
    if(input.reviewed_complete_contract!==true||input.legal_name_confirmed!==true||input.electronic_signature_consent!==true)throw new HttpError(422,'SIGNATURE_DECLARATIONS_REQUIRED','Confirm review, legal name, and electronic-signature consent before signing.');
    if(!String(input.legal_name||'').trim())throw new HttpError(422,'LEGAL_NAME_REQUIRED','Enter your legal name to sign this contract.');
    const client=await this.db.connect();
    try { await client.query('BEGIN');
      const result=await client.query(`SELECT i.*,t.status AS template_status,t.contract_type,v.template_id,v.version,a.full_name AS canonical_legal_name,l.performer_legacy_id AS linked_performer_legacy_id FROM v3_contract_instances i JOIN v3_creator_records c ON c.id=i.creator_id JOIN performer_applications a ON a.id=c.application_id JOIN v3_creator_performer_links l ON l.creator_id=c.id AND l.performer_legacy_id=i.performer_legacy_id LEFT JOIN v3_contract_template_versions v ON v.id=i.template_version_id LEFT JOIN v3_contract_templates t ON t.id=v.template_id WHERE i.id=$1 AND c.user_id=$2 FOR UPDATE`,[id,user.id]);
      if(!result.rowCount)throw new HttpError(404,'CONTRACT_NOT_FOUND','Contract was not found.'); const contract=result.rows[0];
      if(canonicalName(input.legal_name)!==canonicalName(contract.canonical_legal_name))throw new HttpError(422,'LEGAL_NAME_MISMATCH','Your legal name could not be verified.');
      if(String(input.contract_version||'')!==String(contract.version||'')||String(input.document_hash||'')!==String(contract.snapshot_hash||''))throw new HttpError(409,'DOCUMENT_CHANGED','This contract has been updated. Please review the latest version.');
      if(!String(contract.rendered_snapshot||'').includes(rendererRevisionMarker))throw new HttpError(409,'CONTRACT_RENDERING_SUPERSEDED','This contract was issued with a retired document renderer and cannot be signed. A corrected immutable replacement must be issued.');
      if(!executionEligibility(contract.rendered_snapshot).eligible)throw new HttpError(409,'CONTRACT_NOT_ELIGIBLE_FOR_EXECUTION','This immutable contract contains prohibited draft/legal-review markers and cannot be signed.');
      if(['awaiting_company_signature','performer_signed','fully_executed','signed'].includes(contract.status)){const prior=await client.query(`SELECT legal_signer_name,document_version,document_hash FROM v3_contract_signatures WHERE contract_id=$1 AND signer_role='creator'`,[id]); if(!prior.rowCount)throw new HttpError(409,'SIGNED_EVIDENCE_MISSING','This signed contract is missing its signature evidence.'); await client.query('COMMIT'); return {id,status:contract.status,contract_number:contract.contract_number,snapshot_hash:contract.snapshot_hash,signer:prior.rows[0].legal_signer_name,version:prior.rows[0].document_version,document_hash:prior.rows[0].document_hash,idempotent:true};}
      const approval=await client.query(`SELECT id FROM v3_contract_version_approvals WHERE contract_template_version_id=$1 AND status='approved' AND revoked_at IS NULL`,[contract.template_version_id]);
      if(!approval.rowCount)throw new HttpError(409,'CONTRACT_VERSION_NOT_LEGALLY_APPROVED','This exact contract version is not legally approved for signing.');
      const setting=await client.query(`SELECT value FROM v3_contract_settings WHERE key='contract_signing_enabled'`);
      if(setting.rows[0]?.value!==true){const entitlement=await client.query(`SELECT id FROM v3_contract_signing_entitlements WHERE contract_instance_id=$1 AND performer_user_id=$2 AND purpose IN ('production_acceptance_test','production_contract_signing') AND revoked_at IS NULL AND expires_at>now()`,[id,user.id]); if(!entitlement.rowCount)throw new HttpError(409,'CONTRACT_SIGNING_DISABLED','Signing is temporarily unavailable.');}
      if(!['assigned','viewed'].includes(contract.status))throw new HttpError(409,'INVALID_CONTRACT_STATE','This contract is not available for signature.');
      const signed=await client.query(`UPDATE v3_contract_instances SET status='awaiting_company_signature',signed_at=now(),performer_signed_at=now() WHERE id=$1 AND creator_id=$2 AND status IN ('assigned','viewed') RETURNING id,status,signed_at,contract_number,snapshot_hash`,[id,contract.creator_id]);
      if(!signed.rowCount)throw new HttpError(409,'INVALID_CONTRACT_STATE','This contract is not available for signature.');
      if(!this.blob)throw new HttpError(503,'SIGNED_PDF_STORAGE_UNAVAILABLE','Private signed-contract storage is unavailable.');
      const finalPdf=renderPdf(contract.rendered_snapshot,{...contract,status:'awaiting_company_signature',creator_signed_at:signed.rows[0].signed_at,signature_representation:contract.canonical_legal_name,snapshot_hash:contract.snapshot_hash}); const finalPdfHash=hash(finalPdf); const objectKey=`contracts/performer-signed/${id}/${contract.snapshot_hash}.pdf`;
      try { await this.blob.uploadStream(objectKey,Readable.from(finalPdf),'application/pdf'); } catch { throw new HttpError(503,'SIGNED_PDF_STORAGE_UNAVAILABLE','The signed contract could not be finalized in private storage.'); }
      const event=await client.query(`INSERT INTO v3_contract_events(contract_id,template_id,actor_id,action,metadata) VALUES($1,$2,$3,'contract.performer_signed',$4) RETURNING id`,[id,contract.template_id,user.id,{creator_id:contract.creator_id,performer_legacy_id:contract.performer_legacy_id,signature_method:'typed_legal_name',document_version:contract.version,document_hash:contract.snapshot_hash,performer_signed_pdf_hash:finalPdfHash,next_status:'awaiting_company_signature'}]);
      const evidence=await client.query(`INSERT INTO v3_contract_signatures(contract_id,signer_role,signer_user_id,creator_id,performer_legacy_id,legal_signer_name,signature_method,signature_reference,signature_representation,acknowledgement_at,signed_at,document_version,document_hash,user_agent,signing_event_id) VALUES($1,'creator',$2,$3,$4,$5,'typed_legal_name',$5,$5,now(),$6,$7,$8,$9,$10) RETURNING legal_signer_name,document_version,document_hash`,[id,user.id,contract.creator_id,contract.performer_legacy_id,contract.canonical_legal_name,signed.rows[0].signed_at,contract.version,contract.snapshot_hash,String(request?.headers?.['user-agent']||'').slice(0,2048)||null,event.rows[0].id]);
      await client.query(`INSERT INTO v3_contract_attachments(contract_id,attachment_type,object_key,content_hash) VALUES($1,'performer_signed_pdf',$2,$3)`,[id,objectKey,finalPdfHash]);
      await client.query('COMMIT'); return {...signed.rows[0],signer:evidence.rows[0].legal_signer_name,version:evidence.rows[0].document_version,document_hash:evidence.rows[0].document_hash,final_pdf_hash:finalPdfHash};
    } catch(error) { await client.query('ROLLBACK').catch(()=>{});if(error?.code==='23505')throw new HttpError(409,'ALREADY_SIGNED','This contract has already been signed.');throw error; } finally { client.release(); }
  }
  async adminInstance(id) {
    const result=await this.db.query(`SELECT i.*,t.title,t.contract_type,v.version,c.user_id AS performer_user_id,p.display_name AS performer_display_name,
      s.legal_signer_name,s.signature_representation,s.signed_at AS creator_signed_at,s.document_hash AS signed_document_hash,s.signature_method,s.acknowledgement_at,s.user_agent,s.signing_event_id,
      a.content_hash AS signed_pdf_hash,a.object_key AS signed_pdf_object_key
      FROM v3_contract_instances i LEFT JOIN v3_creator_records c ON c.id=i.creator_id LEFT JOIN catalog_performers p ON p.legacy_id=i.performer_legacy_id
      LEFT JOIN v3_contract_template_versions v ON v.id=i.template_version_id LEFT JOIN v3_contract_templates t ON t.id=v.template_id
      LEFT JOIN v3_contract_signatures s ON s.contract_id=i.id AND s.signer_role='creator'
      LEFT JOIN v3_contract_attachments a ON a.contract_id=i.id AND a.attachment_type IN ('final_signed_pdf','final_executed_pdf')
      WHERE i.id=$1`,[id]);
    if(!result.rowCount)throw new HttpError(404,'CONTRACT_NOT_FOUND','Contract was not found.');
    const row=result.rows[0]; return {...safe(row),rendered_snapshot:row.rendered_snapshot};
  }
  async countersign(id,user,input={},request=null) {
    if(!String(input.contract_version||'').trim()||!String(input.document_hash||'').trim())throw new HttpError(422,'DOCUMENT_EVIDENCE_REQUIRED','Contract version and document hash are required for company countersignature.');
    const client=await this.db.connect();
    try { await client.query('BEGIN');
      const result=await client.query(`SELECT i.*,v.version,v.template_id,t.title,t.contract_type,creator.legal_signer_name AS performer_legal_name,creator.signed_at AS performer_signature_at FROM v3_contract_instances i JOIN v3_contract_template_versions v ON v.id=i.template_version_id JOIN v3_contract_templates t ON t.id=v.template_id LEFT JOIN v3_contract_signatures creator ON creator.contract_id=i.id AND creator.signer_role='creator' WHERE i.id=$1 FOR UPDATE`,[id]);
      if(!result.rowCount)throw new HttpError(404,'CONTRACT_NOT_FOUND','Contract was not found.'); const contract=result.rows[0];
      if(String(input.contract_version)!==String(contract.version)||String(input.document_hash)!==String(contract.snapshot_hash))throw new HttpError(409,'DOCUMENT_CHANGED','The contract version or immutable document hash does not match.');
      if(!executionEligibility(contract.rendered_snapshot).eligible)throw new HttpError(409,'CONTRACT_NOT_ELIGIBLE_FOR_EXECUTION','This immutable contract contains prohibited draft/legal-review markers and cannot be countersigned.');
      const signatory=await client.query(`SELECT s.* FROM v3_contract_authorized_signatories s JOIN app_users u ON u.id=s.user_id WHERE s.user_id=$1 AND s.revoked_at IS NULL AND u.role='admin' AND u.account_status='active' FOR UPDATE`,[user.id]);
      if(!signatory.rowCount)throw new HttpError(403,'COMPANY_SIGNATORY_REQUIRED','Only an active, explicitly authorized FLESHLAB company signatory may countersign.');
      if(contract.status==='fully_executed'){const prior=await client.query(`SELECT legal_signer_name,signed_at FROM v3_contract_signatures WHERE contract_id=$1 AND signer_role='company'`,[id]);if(!prior.rowCount)throw new HttpError(409,'COMPANY_SIGNATURE_EVIDENCE_MISSING','The executed contract is missing company signature evidence.');await client.query('COMMIT');return {id,status:'fully_executed',contract_number:contract.contract_number,company_signer:prior.rows[0].legal_signer_name,company_signed_at:prior.rows[0].signed_at,idempotent:true};}
      if(!['awaiting_company_signature','performer_signed'].includes(contract.status)||!contract.performer_legal_name)throw new HttpError(409,'PERFORMER_SIGNATURE_REQUIRED','Company countersignature is available only after a valid performer signature.');
      if(!this.blob)throw new HttpError(503,'SIGNED_PDF_STORAGE_UNAVAILABLE','Private signed-contract storage is unavailable.');
      const signedAt=new Date(); const signedAtIso=signedAt.toISOString();
      const finalPdf=renderPdf(contract.rendered_snapshot,{...contract,status:'fully_executed',creator_signed_at:contract.performer_signature_at,signature_representation:contract.performer_legal_name,studio_signature:signatory.rows[0].legal_name,studio_signer_title:signatory.rows[0].title,studio_signed_at:signedAtIso,snapshot_hash:contract.snapshot_hash});
      const finalPdfHash=hash(finalPdf); const objectKey=`contracts/executed/${id}/${contract.snapshot_hash}.pdf`;
      try { await this.blob.uploadStream(objectKey,Readable.from(finalPdf),'application/pdf'); } catch { throw new HttpError(503,'SIGNED_PDF_STORAGE_UNAVAILABLE','The executed contract PDF could not be finalized in private storage.'); }
      const event=await client.query(`INSERT INTO v3_contract_events(contract_id,template_id,actor_id,action,metadata) VALUES($1,$2,$3,'contract.company_countersigned',$4) RETURNING id`,[id,contract.template_id,user.id,{signatory_authorization_id:signatory.rows[0].id,company_legal_name:signatory.rows[0].legal_name,company_title:signatory.rows[0].title,signature_method:'authenticated_admin_typed_authority',document_version:contract.version,document_hash:contract.snapshot_hash,final_executed_pdf_hash:finalPdfHash}]);
      const evidence=await client.query(`INSERT INTO v3_contract_signatures(contract_id,signer_role,signer_user_id,legal_signer_name,signature_method,signature_reference,signature_representation,acknowledgement_at,signed_at,document_version,document_hash,user_agent,signing_event_id) VALUES($1,'company',$2,$3,'authenticated_admin_typed_authority',$3,$3,now(),$4,$5,$6,$7,$8) RETURNING legal_signer_name,signed_at,document_version,document_hash`,[id,user.id,signatory.rows[0].legal_name,signedAtIso,contract.version,contract.snapshot_hash,String(request?.headers?.['user-agent']||'').slice(0,2048)||null,event.rows[0].id]);
      const updated=await client.query(`UPDATE v3_contract_instances SET status='fully_executed',company_signed_at=$2,company_signatory_user_id=$3 WHERE id=$1 AND status IN ('awaiting_company_signature','performer_signed') RETURNING id,status,contract_number,company_signed_at`,[id,signedAtIso,user.id]);
      if(!updated.rowCount)throw new HttpError(409,'INVALID_CONTRACT_STATE','The contract state changed before company countersignature could be recorded.');
      await client.query(`INSERT INTO v3_contract_attachments(contract_id,attachment_type,object_key,content_hash) VALUES($1,'final_executed_pdf',$2,$3)`,[id,objectKey,finalPdfHash]);
      await client.query('COMMIT'); return {...updated.rows[0],company_signer:evidence.rows[0].legal_signer_name,version:evidence.rows[0].document_version,document_hash:evidence.rows[0].document_hash,final_pdf_hash:finalPdfHash};
    } catch(error) { await client.query('ROLLBACK').catch(()=>{});if(error?.code==='23505')throw new HttpError(409,'COMPANY_SIGNATURE_ALREADY_RECORDED','This contract has already been company-countersigned.');throw error; } finally { client.release(); }
  }
  async importLegacy(input,actor) { if(!input.contract_number||!input.legacy_file_hash||!input.performer_legacy_id)throw new HttpError(422,'LEGACY_METADATA_REQUIRED','Contract number, file hash and performer are required.'); const performer=await this.db.query('SELECT display_name FROM catalog_performers WHERE legacy_id=$1',[input.performer_legacy_id]);if(!performer.rowCount)throw new HttpError(404,'PERFORMER_NOT_FOUND','Performer was not found.'); const snapshot=`LEGACY_IMPORTED\nContract ${input.contract_number}\nSource: ${input.source || 'historical archive'}\nFile hash: ${input.legacy_file_hash}`; const result=await this.db.query(`INSERT INTO v3_contract_instances(contract_number,status,rendered_snapshot,snapshot_hash,performer_name,legacy_contract_date,legacy_file_hash,source,created_by) VALUES($1,'legacy_imported',$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[input.contract_number,snapshot,hash(snapshot),performer.rows[0].display_name,input.contract_date || null,input.legacy_file_hash,input.source || 'legacy_import',actor.id]); await this.event('contract.legacy_imported',actor,result.rows[0].id,null,{ file_hash:input.legacy_file_hash,source:input.source || 'legacy_import' }); return safe(result.rows[0]); }
}

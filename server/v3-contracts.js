import crypto from 'node:crypto';
import { HttpError } from './errors.js';

export const contractTemplateStates = new Set(['draft','legal_review_required','approved','retired']);
export const contractInstanceStates = new Set(['internal_draft','ready_for_review','assigned','viewed','signed','cancelled','superseded','legacy_imported']);
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
const hash = value => crypto.createHash('sha256').update(String(value)).digest('hex');
const safe = row => { if (!row) return null; const { rendered_snapshot, legacy_file_hash, ...rest } = row; return { ...rest, has_snapshot: Boolean(rendered_snapshot), legacy_file_hash: legacy_file_hash || null }; };
const replaceVariables = (body, variables) => String(body).replace(/\{\{([a-z0-9_]+)\}\}/gi, (whole, key) => Object.prototype.hasOwnProperty.call(variables, key) ? String(variables[key]) : whole);
const pdfEscape = value => String(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\r?\n/g, ' ');
export function renderPdf(snapshot) {
  const raw = String(snapshot).split(/\r?\n/);
  const cover = raw.slice(0, 9);
  const body = raw.slice(9);
  const pages = [cover, ...Array.from({ length: Math.max(1, Math.ceil(body.length / 38)) }, (_, index) => body.slice(index * 38, index * 38 + 38))];
  const pageObjects = [];
  const contentObjects = [];
  const font1Id = 3 + pages.length;
  const font2Id = 4 + pages.length;
  const contentStartId = 5 + pages.length;
  pages.forEach((lines, pageIndex) => {
    const isCover = pageIndex === 0;
    const titleSize = isCover ? 24 : 12;
    const bodySize = isCover ? 12 : 9;
    const startY = isCover ? 700 : 735;
    const text = lines.map((line, index) => `${index ? `0 -${isCover ? 28 : 15} Td ` : ''}/F${index === 0 && isCover ? '2' : '1'} ${index === 0 && isCover ? titleSize : bodySize} Tf (${pdfEscape(line.slice(0, 105))}) Tj`).join(' ');
    const footer = `/F1 7 Tf 54 -18 Td (FLESHLAB Studios - Page ${pageIndex + 1} - LEGAL_REVIEW_REQUIRED) Tj`;
    const stream = `q ${isCover ? '0.08 0.08 0.08 rg 0 0 612 792 re f 1 1 1 rg' : '0.96 0.95 0.92 rg 0 0 612 792 re f 0.08 0.08 0.08 rg'} Q BT 54 ${startY} Td ${text} 0 -${isCover ? 44 : 18} Td ${footer} ET`;
    const contentId = contentStartId + pageIndex;
    contentObjects.push({ id: contentId, stream });
    pageObjects.push({ id: 3 + pageIndex, contentId });
  });
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>',`<< /Type /Pages /Kids [${pageObjects.map(page => `${page.id} 0 R`).join(' ')}] /Count ${pageObjects.length} >>`];
  pageObjects.forEach(page => objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${font1Id} 0 R /F2 ${font2Id} 0 R >> >> /Contents ${page.contentId} 0 R >>`));
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  contentObjects.forEach(content => objects.push(`<< /Length ${Buffer.byteLength(content.stream)} >>\nstream\n${content.stream}\nendstream`));
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets[index + 1] = Buffer.byteLength(pdf); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf); pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(value => `${String(value).padStart(10,'0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'binary');
}

export class V3ContractService {
  constructor(db) { this.db = db; }
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
  async templates() { const rows = await this.db.query(`SELECT t.*,count(v.id)::int AS version_count,max(v.created_at) AS latest_version_at FROM v3_contract_templates t LEFT JOIN v3_contract_template_versions v ON v.template_id=t.id GROUP BY t.id ORDER BY t.created_at`); return { records: rows.rows }; }
  async creators(q='') { const value=`%${String(q).trim()}%`; const result=await this.db.query(`SELECT c.id,a.full_name,a.country,cp.preferred_name,c.lifecycle,c.user_id,p.display_name,p.legacy_id AS performer_legacy_id,p.status AS performer_status,coalesce(c.user_id IS NOT NULL,false) AS identity_verified FROM v3_creator_records c JOIN performer_applications a ON a.id=c.application_id LEFT JOIN v3_creator_profiles cp ON cp.creator_id=c.id LEFT JOIN v3_creator_performer_links l ON l.creator_id=c.id LEFT JOIN catalog_performers p ON p.legacy_id=l.performer_legacy_id WHERE ($1='' OR a.full_name ILIKE $1 OR cp.preferred_name ILIKE $1 OR p.display_name ILIKE $1) ORDER BY coalesce(cp.preferred_name,a.full_name) LIMIT 50`,[q ? value : '']); return { records:result.rows }; }
  async template(id) { const result = await this.db.query('SELECT * FROM v3_contract_templates WHERE id=$1 OR template_key=$1', [id]); if (!result.rowCount) throw new HttpError(404,'TEMPLATE_NOT_FOUND','Contract template was not found.'); const versions = await this.db.query('SELECT id,template_id,version,body,sections,variables,body_hash,created_at FROM v3_contract_template_versions WHERE template_id=$1 ORDER BY created_at DESC',[result.rows[0].id]); return { template: result.rows[0], versions: versions.rows }; }
  async createVersion(templateId, input, actor) {
    const template = await this.db.query('SELECT * FROM v3_contract_templates WHERE id=$1 OR template_key=$1',[templateId]); if (!template.rowCount) throw new HttpError(404,'TEMPLATE_NOT_FOUND','Contract template was not found.');
    const body = String(input.body || defaultBody(template.rows[0].template_key)); const version = String(input.version || '').trim(); if (!version) throw new HttpError(422,'VERSION_REQUIRED','Template version is required.');
    const result = await this.db.query(`INSERT INTO v3_contract_template_versions(template_id,version,body,sections,variables,body_hash,created_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,template_id,version,sections,variables,body_hash,created_at`, [template.rows[0].id,version,body,input.sections || catalog[template.rows[0].template_key] || [],input.variables || [],hash(body),actor.id]);
    await this.event('contract.template.version_created',actor,null,template.rows[0].id,{ version, body_hash:hash(body) }); return result.rows[0];
  }
  async assign(input, actor) {
    const version = await this.db.query(`SELECT v.*,t.template_key,t.title,t.contract_type,t.status FROM v3_contract_template_versions v JOIN v3_contract_templates t ON t.id=v.template_id WHERE v.id=$1`,[input.template_version_id]); if (!version.rowCount) throw new HttpError(404,'TEMPLATE_VERSION_NOT_FOUND','Template version was not found.');
    if (version.rows[0].status === 'retired') throw new HttpError(409,'TEMPLATE_RETIRED','Retired templates cannot create contracts.');
    const creator = await this.db.query(`SELECT c.id,a.full_name,cp.preferred_name,c.private_profile,p.display_name,p.legacy_id AS performer_legacy_id FROM v3_creator_records c JOIN performer_applications a ON a.id=c.application_id LEFT JOIN v3_creator_profiles cp ON cp.creator_id=c.id LEFT JOIN v3_creator_performer_links l ON l.creator_id=c.id LEFT JOIN catalog_performers p ON p.legacy_id=l.performer_legacy_id WHERE c.id=$1`,[input.creator_id]); if (!creator.rowCount) throw new HttpError(404,'CREATOR_NOT_FOUND','Creator was not found.');
    const number = String(input.contract_number || `FLS-${version.rows[0].contract_type.slice(0,3).toUpperCase()}-${new Date().getUTCFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`); const values={ company_legal_name:'Dialogmakers International Ltd.', company_number:'83273694', creator_legal_name:input.creator_legal_name || creator.rows[0].full_name, performer_name:input.performer_name || creator.rows[0].display_name || creator.rows[0].preferred_name || '', contract_number:number, effective_date:input.effective_date || new Date().toISOString().slice(0,10), template_version:version.rows[0].version, contract_status:'internal_draft', compensation_plan:input.compensation_plan || 'LEGAL_REVIEW_REQUIRED', payment_cycle:input.payment_cycle || 'LEGAL_REVIEW_REQUIRED', license_term:input.license_term || 'LEGAL_REVIEW_REQUIRED', territory:input.territory || 'worldwide', governing_law:input.governing_law || 'LEGAL_REVIEW_REQUIRED' }; const snapshot=replaceVariables(version.rows[0].body,values); const instance=await this.db.query(`INSERT INTO v3_contract_instances(template_version_id,template_id,creator_id,performer_legacy_id,contract_number,status,rendered_snapshot,snapshot_hash,creator_legal_name,performer_name,effective_date,variables,created_by) VALUES($1,$2,$3,$4,$5,'internal_draft',$6,$7,$8,$9,$10,$11,$12) RETURNING *`,[version.rows[0].id,version.rows[0].template_id,creator.rows[0].id,creator.rows[0].performer_legacy_id || null,number,snapshot,hash(snapshot),values.creator_legal_name,values.performer_name,values.effective_date,values,actor.id]); await this.event('contract.draft_created',actor,instance.rows[0].id,version.rows[0].template_id,{ contract_number:number, legal_review_required:version.rows[0].status !== 'approved' }); await this.db.query(`INSERT INTO v3_creator_notifications(creator_id,kind,title,body,action_path) VALUES($1,'contract_assigned','Contract available','A new contract draft is available for review.','/v3/creator/contracts')`,[creator.rows[0].id]); return safe(instance.rows[0]);
  }
  async preview(input) {
    const version = await this.db.query(`SELECT v.*,t.template_key,t.title,t.contract_type,t.status FROM v3_contract_template_versions v JOIN v3_contract_templates t ON t.id=v.template_id WHERE v.id=$1`, [input.template_version_id]);
    if (!version.rowCount) throw new HttpError(404, 'TEMPLATE_VERSION_NOT_FOUND', 'Template version was not found.');
    if (version.rows[0].status === 'retired') throw new HttpError(409, 'TEMPLATE_RETIRED', 'Retired templates cannot create contracts.');
    const creator = input.creator_id ? await this.db.query(`SELECT c.id,a.full_name,cp.preferred_name,p.display_name FROM v3_creator_records c JOIN performer_applications a ON a.id=c.application_id LEFT JOIN v3_creator_profiles cp ON cp.creator_id=c.id LEFT JOIN v3_creator_performer_links l ON l.creator_id=c.id LEFT JOIN catalog_performers p ON p.legacy_id=l.performer_legacy_id WHERE c.id=$1`, [input.creator_id]) : { rowCount: 0, rows: [] };
    if (input.creator_id && !creator.rowCount) throw new HttpError(404, 'CREATOR_NOT_FOUND', 'Creator was not found.');
    const contractNumber = String(input.contract_number || `FLS-${version.rows[0].contract_type.slice(0,3).toUpperCase()}-${new Date().getUTCFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`);
    const values = { company_legal_name:'Dialogmakers International Ltd.', company_number:'83273694', creator_legal_name:input.creator_legal_name || creator.rows[0]?.full_name || 'SAMPLE CREATOR — NOT A CONTRACT', performer_name:input.performer_name || creator.rows[0]?.display_name || creator.rows[0]?.preferred_name || 'SAMPLE PERFORMER', contract_number:contractNumber, effective_date:input.effective_date || new Date().toISOString().slice(0,10), template_version:version.rows[0].version, contract_status:'internal_draft', compensation_plan:input.compensation_plan || 'LEGAL_REVIEW_REQUIRED', payment_cycle:input.payment_cycle || 'LEGAL_REVIEW_REQUIRED', license_term:input.license_term || 'LEGAL_REVIEW_REQUIRED', territory:input.territory || 'worldwide', governing_law:input.governing_law || 'LEGAL_REVIEW_REQUIRED', studio_signer_name:'AUTHORIZED REPRESENTATIVE — LEGAL REVIEW', studio_signature:'[NO SIGNATURE]', studio_signed_at:'[NOT SIGNED]', creator_signature:'[NO SIGNATURE]', creator_signed_at:'[NOT SIGNED]', document_hash:'[GENERATED FOR PREVIEW]' };
    const snapshot = replaceVariables(version.rows[0].body, values);
    return { template: { id:version.rows[0].template_id, title:version.rows[0].title, contract_type:version.rows[0].contract_type, status:version.rows[0].status, version:version.rows[0].version }, values, snapshot, hash:hash(snapshot), legal_review_required:version.rows[0].status !== 'approved', signing_enabled:contractSigningEnabled, sample_preview:!input.creator_id };
  }
  async instances(actor) { const result=await this.db.query(`SELECT i.id,i.contract_number,i.status,i.creator_id,i.creator_legal_name,i.performer_name,i.issued_at,i.viewed_at,i.signed_at,i.source,i.snapshot_hash,t.title,t.contract_type,v.version FROM v3_contract_instances i LEFT JOIN v3_contract_template_versions v ON v.id=i.template_version_id LEFT JOIN v3_contract_templates t ON t.id=v.template_id ORDER BY i.issued_at DESC`); return { records:result.rows }; }
  async creatorInstances(user) { const result=await this.db.query(`SELECT i.id,i.contract_number,i.status,i.creator_id,i.creator_legal_name,i.performer_name,i.issued_at,i.viewed_at,i.signed_at,i.source,i.snapshot_hash,t.title,t.contract_type,v.version FROM v3_contract_instances i JOIN v3_creator_records c ON c.id=i.creator_id LEFT JOIN v3_contract_template_versions v ON v.id=i.template_version_id LEFT JOIN v3_contract_templates t ON t.id=v.template_id WHERE c.user_id=$1 ORDER BY i.issued_at DESC`,[user.id]); return { records:result.rows }; }
  async instance(id,user,{admin=false}={}) { const query=admin?`SELECT i.*,t.title,t.contract_type,v.version FROM v3_contract_instances i LEFT JOIN v3_contract_template_versions v ON v.id=i.template_version_id LEFT JOIN v3_contract_templates t ON t.id=v.template_id WHERE i.id=$1`:`SELECT i.*,t.title,t.contract_type,v.version FROM v3_contract_instances i JOIN v3_creator_records c ON c.id=i.creator_id LEFT JOIN v3_contract_template_versions v ON v.id=i.template_version_id LEFT JOIN v3_contract_templates t ON t.id=v.template_id WHERE i.id=$1 AND c.user_id=$2`; const result=await this.db.query(query,admin?[id]:[id,user.id]); if(!result.rowCount)throw new HttpError(404,'CONTRACT_NOT_FOUND','Contract was not found.'); const row=result.rows[0]; if(!row.viewed_at){await this.db.query('UPDATE v3_contract_instances SET viewed_at=now(),status=CASE WHEN status=\'assigned\' THEN \'viewed\' ELSE status END WHERE id=$1',[id]); await this.event('contract.viewed',user,id,row.template_version_id,{});} return { ...safe(row), rendered_snapshot:row.rendered_snapshot };
  }
  async pdf(id,user,opts={}) { const item=await this.instance(id,user,opts); const bytes=renderPdf(item.rendered_snapshot); await this.event('contract.pdf_download',user,id,null,{ hash:item.snapshot_hash }); return { bytes, hash:item.snapshot_hash, contract_number:item.contract_number }; }
  async importLegacy(input,actor) { if(!input.contract_number||!input.legacy_file_hash||!input.performer_legacy_id)throw new HttpError(422,'LEGACY_METADATA_REQUIRED','Contract number, file hash and performer are required.'); const performer=await this.db.query('SELECT display_name FROM catalog_performers WHERE legacy_id=$1',[input.performer_legacy_id]);if(!performer.rowCount)throw new HttpError(404,'PERFORMER_NOT_FOUND','Performer was not found.'); const snapshot=`LEGACY_IMPORTED\nContract ${input.contract_number}\nSource: ${input.source || 'historical archive'}\nFile hash: ${input.legacy_file_hash}`; const result=await this.db.query(`INSERT INTO v3_contract_instances(contract_number,status,rendered_snapshot,snapshot_hash,performer_name,legacy_contract_date,legacy_file_hash,source,created_by) VALUES($1,'legacy_imported',$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[input.contract_number,snapshot,hash(snapshot),performer.rows[0].display_name,input.contract_date || null,input.legacy_file_hash,input.source || 'legacy_import',actor.id]); await this.event('contract.legacy_imported',actor,result.rows[0].id,null,{ file_hash:input.legacy_file_hash,source:input.source || 'legacy_import' }); return safe(result.rows[0]); }
}

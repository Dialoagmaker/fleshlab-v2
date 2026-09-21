CREATE TABLE IF NOT EXISTS v3_content_rights_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id text,
  content_legacy_id text REFERENCES catalog_videos(legacy_id) ON DELETE RESTRICT,
  performer_legacy_id text REFERENCES catalog_performers(legacy_id) ON DELETE RESTRICT,
  creator_id uuid REFERENCES v3_creator_records(id) ON DELETE RESTRICT,
  rights_source text NOT NULL DEFAULT 'unknown' CHECK (rights_source IN ('v3_contract','legacy_import','production_release','submitted_content','unknown')),
  rights_contract_instance_id uuid REFERENCES v3_contract_instances(id) ON DELETE RESTRICT,
  rights_status text NOT NULL DEFAULT 'missing' CHECK (rights_status IN ('missing','pending','active','expired','blocked','superseded','legacy_unknown')),
  exclusive boolean NOT NULL DEFAULT false,
  territory text NOT NULL DEFAULT 'worldwide',
  rights_start_at timestamptz,
  rights_end_at timestamptz,
  post_termination_end_at timestamptz,
  commercial_exploitation_allowed boolean NOT NULL DEFAULT false,
  marketing_allowed boolean NOT NULL DEFAULT false,
  editing_allowed boolean NOT NULL DEFAULT false,
  sublicensing_allowed boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS v3_content_rights_content_idx ON v3_content_rights_records(content_legacy_id);
CREATE INDEX IF NOT EXISTS v3_content_rights_production_idx ON v3_content_rights_records(production_id);
CREATE INDEX IF NOT EXISTS v3_content_rights_status_idx ON v3_content_rights_records(rights_status);

CREATE TABLE IF NOT EXISTS v3_content_rights_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rights_record_id uuid NOT NULL REFERENCES v3_content_rights_records(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

WITH target AS (SELECT id FROM v3_contract_templates WHERE template_key='content_rights_release'), document AS (
  SELECT $$FLESHLAB STUDIOS
A division of Dialogmakers International Ltd.
02
CONTENT RIGHTS & PERFORMER RELEASE
Performer: {{performer_name}}
Contract: {{contract_number}}
Effective: {{effective_date}}
Version: {{template_version}}

LEGAL_REVIEW_REQUIRED — TEMPLATE PREVIEW / NOT A SIGNED CONTRACT

1. Purpose and Parties
This agreement is between FLESHLAB Studios, a division of Dialogmakers International Ltd., 2F, No. 2-1, Lane 23, Wenhua St., Taoyuan City, Taoyuan 324010, Taiwan, Company No. 83273694, and {{creator_legal_name}}, {{creator_address}}, {{performer_name}}. It governs rights and release for identifiable Covered Content only.

2. Definitions
Content, Covered Content, Recorded Content, Live Content, Source Files, Master Files, Performer, Studio, Platform, Distribution Partner, Commercial Exploitation, Promotional Materials and Rights Period have the controlled meanings in this agreement and linked production records. No undefined grant of “all rights” is created.

3. Covered Content and Scope
Covered Content is identified by a Studio production record, asset record, accepted voluntary submission or explicit agreement linkage. This agreement does not claim every work ever created by the Performer.

4. Source and Master Files
The Studio retains possession and operational control of Source Files and Master Files for Covered Content. File control is distinct from copyright, performer rights, publicity or personality rights and exploitation rights.

5. Exclusive Commercial Exploitation
Subject to applicable law and the Rights Period, the Performer grants FLESHLAB exclusive worldwide commercial exploitation rights for Covered Content, including reproduction, publication, distribution, display, making available, streaming, sale, monetization, licensing, hosting, advertising and promotion. The legal assignment versus exclusive-license structure is LEGAL_REVIEW_REQUIRED.

6. Platforms and Distribution Partners
Covered Content may be used through FLESHLAB services and authorized adult, subscription, streaming, marketplace, licensing and distribution partners where lawful and contractually authorized.

7. Necessary Sublicensing
Sublicensing is permitted only as reasonably necessary for hosting, streaming, distribution, sales, licensing, promotion, platform operation and technical delivery. Unlimited unrelated sublicensing is not granted.

8. Editing and Technical Adaptation
The Studio may edit, cut, crop, resize, encode, reformat, translate, subtitle, create thumbnails, covers, trailers, previews and promotional excerpts. No edit may materially misrepresent consented conduct or falsely depict an activity that did not occur.

9. Name, Image, Likeness and Voice
The Performer grants rights reasonably required for Covered Content exploitation and related promotion to use stage name, image, likeness, voice and approved profile material, and legal name only where reasonably necessary. No unrelated endorsement right is granted.

10. Promotional Use
Stills, thumbnails, banners, trailers, previews, short excerpts, social assets and promotional copy may promote Covered Content and FLESHLAB services containing it. Misleading unrelated endorsement is excluded.

11. Content Exclusivity
During the Rights Period, the Performer may not independently sell, publish, distribute, sublicense or commercially exploit the same Covered Content without written Studio authorization. This is not career-wide exclusivity.

12. Rights Period
Rights apply during the active contract relationship plus five years after termination. Rights are not perpetual. The enforceability and structure of this period are LEGAL_REVIEW_REQUIRED.

13. Post-Termination Revenue Share
During the five-year post-termination exploitation period, the Performer continues to receive the applicable 30% revenue share under the separate Compensation Schedule. Calculation rules are not duplicated here.

14. End of Five-Year Period
New distribution, existing customer access, previously downloaded copies, platform takedown, caching, archival copies, compliance copies and existing licences after the Rights Period are BUSINESS_DECISION_REQUIRED and LEGAL_REVIEW_REQUIRED.

15. Performer-Created and Submitted Content
Independently created Content becomes covered only after explicit submission, acceptance, identifiable asset or production linkage, participant verification and required release documentation.

16. Participant Rights
Every identifiable sexual participant requires independent identity and age verification, consent evidence and release documentation. The primary Performer cannot grant another participant’s rights.

17. Consent and Production Standards
Rights apply only to lawfully produced and approved Content and remain independent from the Consent & Production Standards Agreement. Rights language never cures absent or invalid consent.

18. Prohibited Content
No rights are granted for minors, animal sexual content, prohibited violence, non-consensual sexual content, covert recordings or unconsented sexual deepfakes of identifiable real persons.

19. Warranties
To the best of the Performer’s knowledge, they control the rights they personally grant, submitted Content does not knowingly infringe third-party rights, participant information is accurate and no participant is falsely represented as verified.

20. Platform Removal Limitations
FLESHLAB cannot guarantee immediate deletion from every third-party system, cache, customer device or lawfully delivered download. Exact notice, takedown and removal duties are LEGAL_REVIEW_REQUIRED.

21. Archival and Compliance Copies
Limited copies may be retained where legally required or reasonably necessary for audit, legal defense, recordkeeping, fraud prevention or compliance. Archival retention does not authorize continued commercial exploitation.

22. No Implied Management
This release creates no management, agency, employment, partnership or joint venture. Those relationships require separate agreements.

23. Relationship to Other Agreements
Performer Services, Consent Standards, Confidentiality, Compensation Schedule and Optional Management remain separate instruments. This agreement does not set compensation or production consent.

24. Privacy and Records
Rights records identify scope and readiness without exposing identity documents or private storage keys. Operational records are retained only for documented purposes and lawful periods.

25. Audit and Status
Rights records may be MISSING, PENDING, ACTIVE, EXPIRED, BLOCKED, SUPERSEDED or LEGACY_RIGHTS_STATUS_UNKNOWN. Status changes are recorded in immutable audit events.

26. Publishing Gate
Commercial publication requires active rights, required participant rights, completed Consent & Production Standards records, verified participants, required releases and no prohibited-content flag. Consent readiness and rights readiness are evaluated independently.

27. International Exploitation
Worldwide exploitation and international participant/consumer implications require jurisdiction-specific legal review. Taiwan law and forum are the current business intent.

28. Governing Law and Forum
Taiwan law, Taiwan forum and English controlling language are intended. Court versus arbitration and international-law treatment are LEGAL_REVIEW_REQUIRED.

29. Electronic Contracting and Changes
Electronic execution requires approved template status, feature activation and safeguards. Material changes require an approved new version or written amendment. Signing is currently disabled.

30. Severability
If a provision is unenforceable, the remainder continues to the extent permitted by law and a lawful closest equivalent should be used.

LEGAL REVIEW ISSUES
Copyright assignment versus exclusive licence; performer and neighbouring rights; publicity/personality rights; five-year enforceability; end-of-period handling; international exploitation; sublicensing; archival retention; third-party takedown limits; Taiwan/international interaction.

SIGNATURE PAGE
FOR FLESHLAB STUDIOS
Authorized Representative: {{studio_signer_name}}
Signature: {{studio_signature}}
Date: {{studio_signed_at}}

PERFORMER
Legal Name: {{creator_legal_name}}
Stage Name: {{performer_name}}
Signature: {{creator_signature}}
Date: {{creator_signed_at}}

DOCUMENT VERIFICATION
Contract Number: {{contract_number}}
Version: {{template_version}}
Document Hash: {{document_hash}}
This is a legal-review draft. No signature is asserted by this preview.$$ AS body
)
INSERT INTO v3_contract_template_versions(template_id,version,body,sections,variables,body_hash)
SELECT target.id,'2.1',document.body,
  to_jsonb(ARRAY['Purpose and Parties','Definitions','Covered Content and Scope','Source and Master Files','Exclusive Commercial Exploitation','Platforms and Distribution Partners','Necessary Sublicensing','Editing and Technical Adaptation','Name, Image, Likeness and Voice','Promotional Use','Content Exclusivity','Rights Period','Post-Termination Revenue Share','End of Five-Year Period','Performer-Created and Submitted Content','Participant Rights','Consent and Production Standards','Prohibited Content','Warranties','Platform Removal Limitations','Archival and Compliance Copies','No Implied Management','Relationship to Other Agreements','Privacy and Records','Audit and Status','Publishing Gate','International Exploitation','Governing Law and Forum','Electronic Contracting and Changes','Severability','Legal Review Issues','Signature Page','Document Verification']),
  to_jsonb(ARRAY['company_legal_name','company_address','company_number','creator_legal_name','creator_address','performer_name','contract_number','effective_date','template_version','studio_signer_name','studio_signature','studio_signed_at','creator_signature','creator_signed_at','document_hash']),
  encode(digest(document.body,'sha256'),'hex')
FROM target,document ON CONFLICT(template_id,version) DO NOTHING;

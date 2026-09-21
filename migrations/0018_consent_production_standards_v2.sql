CREATE TABLE IF NOT EXISTS v3_production_consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id text NOT NULL,
  performer_legacy_id text REFERENCES catalog_performers(legacy_id) ON DELETE RESTRICT,
  creator_id uuid REFERENCES v3_creator_records(id) ON DELETE RESTRICT,
  video_legacy_id text REFERENCES catalog_videos(legacy_id) ON DELETE RESTRICT,
  production_date date,
  categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  approved_activities jsonb NOT NULL DEFAULT '[]'::jsonb,
  excluded_activities jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','acknowledged','changed','withdrawn_partially','blocked')),
  acknowledged_at timestamptz,
  withdrawn_at timestamptz,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(production_id, performer_legacy_id)
);
CREATE TABLE IF NOT EXISTS v3_production_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_record_id uuid NOT NULL REFERENCES v3_production_consent_records(id) ON DELETE CASCADE,
  performer_legacy_id text REFERENCES catalog_performers(legacy_id) ON DELETE RESTRICT,
  display_name text,
  role text NOT NULL DEFAULT 'co_performer',
  age_verified boolean NOT NULL DEFAULT false,
  identity_verified boolean NOT NULL DEFAULT false,
  release_status text NOT NULL DEFAULT 'missing' CHECK (release_status IN ('missing','pending','accepted','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS v3_participant_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES v3_production_participants(id) ON DELETE CASCADE,
  consent_record_id uuid NOT NULL REFERENCES v3_production_consent_records(id) ON DELETE CASCADE,
  release_document_ref text,
  identity_evidence_ref text,
  selfie_evidence_ref text,
  age_verified boolean NOT NULL DEFAULT false,
  identity_verified boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  reviewed_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS v3_production_consent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_record_id uuid NOT NULL REFERENCES v3_production_consent_records(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS v3_production_consent_video_idx ON v3_production_consent_records(video_legacy_id);
CREATE INDEX IF NOT EXISTS v3_production_participants_consent_idx ON v3_production_participants(consent_record_id);

WITH target AS (SELECT id FROM v3_contract_templates WHERE template_key='consent_standards'), document AS (
  SELECT $$FLESHLAB STUDIOS
A division of Dialogmakers International Ltd.
03
CONSENT & PRODUCTION STANDARDS
PERFORMER SAFETY & PRODUCTION RULES
Performer: {{performer_name}}
Contract: {{contract_number}}
Effective: {{effective_date}}
Version: {{template_version}}

LEGAL_REVIEW_REQUIRED · TEMPLATE PREVIEW / NOT A SIGNED CONTRACT

1. Purpose
This Agreement defines production consent, boundaries, participant verification, prohibited content, production records and publishing eligibility. It does not replace the separate Performer Services, Content Rights, Compensation, Confidentiality or Management agreements.

2. Scope
It applies to approved production activities and the master standards used to create a Production Consent Record. A Performer does not sign a new master contract for every production.

3. Definitions
Production, Content, Performer, Creator, Co-Performer, Participant, Release, Verification and Publishing Gate have the operational meanings assigned in the V3 production record and approved policies.

4. Performer Eligibility
Every Performer and identifiable sexual participant must be 18 or older. No exception applies.

5. Identity and Age Verification
Accepted documents are National ID, Driver's License or Passport plus a selfie with the same document. FLESHLAB performs verification. Production or submission may occur before verification, but publication cannot.

6. Production Consent
Each production has its own Production Consent Record identifying the production, Performer, categories, approved activities, exclusions, participants, notes and status. Prior productions do not imply consent for a new production.

7. Production Categories
Categories are selected for each production from the available controlled FLESHLAB category set. The absence of an exclusion is not automatic consent to every possible activity.

8. Performer Boundaries
The Performer may record global boundaries and production-specific boundaries, including excluded activities, activities requiring explicit confirmation, content types and participant restrictions.

9. Production-Specific Records
The record contains production date, content linkage, categories, approved and excluded activities, participant states, acknowledgement and audit history. Required records must be complete before publishing.

10. Changes During Production
A material scope change creates an append-only revision event showing the original scope, change, actor and timestamp. The original consent state is never silently overwritten.

11. Withdrawal Before Activity
The Performer may withdraw consent for an activity that has not occurred. The system records the activity, actor, timestamp and production impact. This does not erase prior history.

12. Previously Produced Content
Lawfully produced, consented, properly released and approved Content is not automatically invalidated by a later change of mind. Exact jurisdiction-specific treatment and rights interaction are LEGAL_REVIEW_REQUIRED.

13. Third-Party Participants
Another identifiable person may appear only when written consent or release, accepted identity evidence, selfie evidence and successful age verification are recorded. The primary Performer's contract does not grant another person's rights.

14. Participant Releases
Each participant has independent consent evidence linked to the production and a release status. FLESHLAB must confirm required documentation before publication.

15. Co-Performer Verification
Every co-performer must be individually age- and identity-verified, with a complete release. Missing verification blocks publication.

16. Prohibited Content
Sexual content involving minors, sexual activity involving animals, prohibited violence, non-consensual sexual activity, covert sexual recordings and sexual deepfakes of identifiable real persons without verified consent are prohibited.

17. Non-Consensual Content
No production may proceed or publish where a participant has not freely consented to the recorded activity. Consent records do not cure coercion or missing evidence.

18. Covert Recording
Recording without the required participant knowledge and consent is prohibited. Any suspected covert recording is a publishing blocker and compliance issue.

19. Deepfake and Synthetic Media
Synthetic or altered sexual media involving an identifiable real person requires verified consent specific to that use. Unconsented sexual deepfakes are prohibited.

20. Production Safety
FLESHLAB must maintain reasonable production, identity, consent and participant-safety controls. Operational acknowledgement is not a legal signature of this master Agreement.

21. Studio Responsibilities
FLESHLAB records consent, verifies participants, accepts releases, blocks unverified publication and maintains immutable audit history.

22. Performer Responsibilities
The Performer must provide accurate information, state boundaries, identify participants, report changes and not knowingly submit prohibited or unverified Content.

23. Publishing Restrictions
Publishing requires primary verification, all co-performer verification, required releases, a complete consent record, no prohibited-content flag and the required rights documentation. The V3 publishing gate returns explicit blockers.

24. Production Records
Records must identify the production, participants, categories, boundaries, acknowledgement, changes, withdrawal and review events. Private identity evidence is restricted and is never exposed in public or Creator projections.

25. Privacy
Identity documents, addresses, private notes and storage references are restricted to authorized review roles. Creator views expose only safe status such as Verified, Pending or Release required.

26. Audit and Recordkeeping
Creation, category selection, boundary changes, participant changes, acknowledgement, withdrawal, release review, verification changes and publishing-gate evaluations are append-only events.

27. Relationship to Other Agreements
This Agreement is separate from Performer Services, Content Rights, Compensation, Confidentiality and Optional Management. It does not grant rights or compensation by itself.

28. Governing Law
The business intent is Taiwan law and a Taiwan forum for international Performers. Consent law, retention and jurisdiction-specific language are LEGAL_REVIEW_REQUIRED.

29. Electronic Records
Operational acknowledgement may be recorded separately from legal contract signature. Electronic execution of this master Agreement remains disabled until approval and safeguards are configured.

30. Severability
If a provision is unenforceable, the remainder continues to the extent permitted by law and a lawful closest equivalent should be used. Final wording is LEGAL_REVIEW_REQUIRED.

PRODUCTION SUMMARY
PERFORMER RIGHTS: define boundaries; see production scope; withdraw consent before an activity occurs; refuse unagreed activity.
STUDIO REQUIREMENTS: verify participants; record releases; block unverified publication; maintain audit history.
PUBLISHING REQUIREMENTS: verified age and identity; required releases; consent record; rights documentation.

ACKNOWLEDGEMENT PAGE
This page records operational acknowledgement only and is not a simulated legal signature.
Performer: {{performer_name}}
Acknowledgement: {{acknowledgement_state}}
Date: {{acknowledged_at}}

DOCUMENT VERIFICATION
Contract Number: {{contract_number}}
Version: {{template_version}}
Document Hash: {{document_hash}}
This is a legal-review draft. No signature is asserted by this preview.$$ AS body
)
INSERT INTO v3_contract_template_versions(template_id,version,body,sections,variables,body_hash)
SELECT target.id,'2.0',document.body,
  to_jsonb(ARRAY['Purpose','Scope','Definitions','Performer Eligibility','Identity and Age Verification','Production Consent','Production Categories','Performer Boundaries','Production-Specific Records','Changes During Production','Withdrawal Before Activity','Previously Produced Content','Third-Party Participants','Participant Releases','Co-Performer Verification','Prohibited Content','Non-Consensual Content','Covert Recording','Deepfake and Synthetic Media','Production Safety','Studio Responsibilities','Performer Responsibilities','Publishing Restrictions','Production Records','Privacy','Audit and Recordkeeping','Relationship to Other Agreements','Governing Law','Electronic Records','Severability','Production Summary','Acknowledgement Page','Document Verification']),
  to_jsonb(ARRAY['company_legal_name','company_address','company_number','creator_legal_name','creator_address','performer_name','contract_number','effective_date','template_version','acknowledgement_state','acknowledged_at','document_hash']),
  encode(digest(document.body,'sha256'),'hex')
FROM target,document ON CONFLICT(template_id,version) DO NOTHING;

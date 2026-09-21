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

1. Definitions
Content means the identifiable material covered by this release. Recorded Content, Live Content, Source Files and Master Files mean their respective recorded or original technical forms. Performer means {{performer_name}} and the contracting person. Studio means FLESHLAB Studios, a division of Dialogmakers International Ltd. Platforms means FLESHLAB-owned and approved third-party services. Distribution Partners means approved hosting, sales, streaming and promotion partners. Commercial Exploitation means lawful publication, sale, streaming, licensing, distribution and promotion.

2. Parties
FLESHLAB Studios, a division of Dialogmakers International Ltd., 2F, No. 2-1, Lane 23, Wenhua St., Taoyuan City, Taoyuan 324010, Taiwan, Company No. 83273694, and {{creator_legal_name}}, {{creator_address}}, {{performer_name}}.

3. Covered Content and Scope
This release covers only Content identified by a submission, production record, asset record, agreement linkage or other explicit acceptance record. It does not cover every file ever created by the Performer.

4. Source and Master Files
The Studio retains possession and operational control of original Source Files and Master Files created under the relationship. File possession is distinct from copyright, performer rights, publicity rights and exploitation rights.

5. Exclusive Commercial Rights
Subject to applicable law, the Performer grants the Studio exclusive worldwide commercial exploitation rights in covered Content: reproduce, publish, distribute, stream, display, make available, sell, license, sublicense as reasonably necessary, advertise, promote, edit, cut, format, crop, resize, translate, subtitle, create previews, thumbnails, covers and promotional excerpts.

6. Platforms and Distribution Partners
Covered Content may be used through FLESHLAB-owned platforms, partner platforms, marketplaces, streaming and subscription services, adult platforms, social media promotional channels and Distribution Partners where lawful and contractually authorized. Necessary sublicensing is limited to distribution and operation.

7. Name, Image, Likeness and Voice
The Performer grants the rights reasonably required for Content exploitation and related promotion to use legal name where necessary, stage name, image, likeness, voice and approved biographical/profile material. No unrelated endorsement use is granted without separate consent.

8. Editing and Technical Adaptation
The Studio may edit, cut, combine, subtitle, translate, reformat, crop, resize and adapt Content for platform requirements and create thumbnails, covers, previews and excerpts. Edits must not materially misrepresent consented conduct or falsely depict an activity that did not occur.

9. Duration
The rights apply during the active contract relationship and for five years after termination. They are not perpetual rights. The exact legal structure is LEGAL_REVIEW_REQUIRED.

10. Post-Termination Compensation
During the five-year post-termination exploitation period, the Performer continues to receive the applicable 30% revenue share under the separate Compensation Schedule. Calculation mechanics are not duplicated here.

11. End of Five-Year Period
Removal, takedown, archival copies, third-party persistence, compliance retention, existing customer access and previously delivered downloads after the five-year period are unresolved and LEGAL_REVIEW_REQUIRED.

12. Exclusivity of Covered Content
During the exclusive rights period the Performer may not independently sell, publish, license or distribute the same covered Content without written Studio consent. This clause does not create career-wide exclusivity.

13. Performer-Created and Submitted Content
Independently produced Content becomes covered only when voluntarily submitted and accepted through an identifiable production, asset or release process. Submission alone does not grant rights in unrelated material.

14. Third-Party Participants
Content containing another identifiable participant may not be commercially released until written release, identity evidence, selfie with identity evidence and age verification are complete. Submission by the primary Performer does not grant another person's rights.

15. Consent and Boundaries
Rights apply only to lawfully produced and approved Content and are subject to the separate Consent & Production Standards Agreement. Rights language never overrides absent or invalid participant consent.

16. Prohibited Content
No rights are granted for minors, animal sexual content, prohibited violence, non-consensual sexual content, covert sexual recordings or unconsented sexual deepfakes of identifiable real persons.

17. Marketing and Promotion
The Studio may use excerpts, stills, thumbnails, trailers, previews, social clips, banners and promotional copy to market covered Content and FLESHLAB services. Misleading unrelated endorsement is excluded absent separate consent.

18. Limited Sublicensing
Sublicensing is permitted only to the extent reasonably necessary for hosting, streaming, distribution, sales, payment/content partners, platform operation and promotion. Unlimited unrelated sublicensing is not granted.

19. Warranties
To the best of the Performer's knowledge, they have authority over rights they personally control, submitted Content does not knowingly infringe third-party rights, participant information is accurate and no person is falsely represented as verified. No impossible guarantee is imposed.

20. Platform Removal
The Studio cannot guarantee immediate deletion from every third-party system, cache, customer device or lawfully delivered download. Exact notice, takedown and removal duties are LEGAL_REVIEW_REQUIRED.

21. Archival and Compliance Copies
Limited archival or compliance copies may be retained where legally required or reasonably necessary for audit, legal defense, recordkeeping, fraud prevention or compliance. Archival retention does not automatically authorize continued commercial exploitation.

22. No Implied Management
This release creates no management, agency, employment or partnership relationship. Those relationships require separate agreements.

23. Governing Law and Forum
The business intent is Taiwan law and a Taiwan forum for an international Performer. The court versus arbitration mechanism and international-law treatment are LEGAL_REVIEW_REQUIRED.

24. Controlling Language
English is intended to control. Translations may assist understanding but do not replace the approved controlling-language version.

25. Electronic Contracting and Changes
Electronic execution is available only after template approval, feature activation and applicable safeguards. Material changes require an approved new version or written amendment. Signing is currently disabled.

26. Entire Agreement and Severability
This release, its approved schedules and expressly incorporated documents form the agreement for covered Content. Performer Services, Consent Standards, Confidentiality, Compensation Schedule and optional Management remain separate instruments. Invalid provisions are replaced with a lawful closest equivalent; final wording is LEGAL_REVIEW_REQUIRED.

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
SELECT target.id,'2.0',document.body,
  to_jsonb(ARRAY['Definitions','Parties','Covered Content and Scope','Source and Master Files','Exclusive Commercial Rights','Platforms and Distribution Partners','Name, Image, Likeness and Voice','Editing and Technical Adaptation','Duration','Post-Termination Compensation','End of Five-Year Period','Exclusivity of Covered Content','Performer-Created and Submitted Content','Third-Party Participants','Consent and Boundaries','Prohibited Content','Marketing and Promotion','Limited Sublicensing','Warranties','Platform Removal','Archival and Compliance Copies','No Implied Management','Governing Law and Forum','Controlling Language','Electronic Contracting and Changes','Entire Agreement and Severability','Signature Page','Document Verification']),
  to_jsonb(ARRAY['company_legal_name','company_address','company_number','creator_legal_name','creator_address','performer_name','contract_number','effective_date','template_version','studio_signer_name','studio_signature','studio_signed_at','creator_signature','creator_signed_at','document_hash']),
  encode(digest(document.body,'sha256'),'hex')
FROM target,document ON CONFLICT(template_id,version) DO NOTHING;

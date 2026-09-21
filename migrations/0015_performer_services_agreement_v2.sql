WITH target AS (
  SELECT id FROM v3_contract_templates WHERE template_key='performer_services'
), document AS (
  SELECT $$FLESHLAB STUDIOS
A division of Dialogmakers International Ltd.
2F, No. 2-1, Lane 23, Wenhua St., Taoyuan City, Taoyuan 324010, Taiwan
Company No. 83273694

PERFORMER SERVICES AGREEMENT
Contract: {{contract_number}}
Performer: {{performer_name}}
Effective date: {{effective_date}}
Version: {{template_version}}

LEGAL_REVIEW_REQUIRED — TEMPLATE PREVIEW / NOT A SIGNED CONTRACT

1. Purpose of this Agreement
This Agreement describes the proposed independent-contractor relationship between FLESHLAB Studios, a division of Dialogmakers International Ltd., and the Performer for adult performance and model services.

2. Independent Contractor Status
The Performer is intended to provide services as an independent contractor and not as an employee, partner or agent. Classification remains subject to applicable law and LEGAL_REVIEW_REQUIRED.

3. Eligibility
The Performer must be at least 18. FLESHLAB accepts a National ID, Driver's License or Passport together with a selfie showing the same ID. FLESHLAB performs age and identity verification.

4. Services
The Performer may provide recorded content, live-cam services or another approved service variant selected in the applicable Compensation Schedule. No service variant is automatically imposed.

5. Minimum Activity Commitment
Recorded Content variant: 10 videos per calendar month, minimum 20 minutes per video. Live Cam variant: 15 hours per week. The selected variant and any approved changes must be recorded in writing.

6. Professional and Platform Standards
The Performer must follow production instructions, platform rules, safety requirements, consent records and lawful operational policies. FLESHLAB may hold publication while a required review is incomplete.

7. Prohibited Content
Minors or sexual content involving minors, animal sexual content, prohibited violence, non-consensual sexual content, covert recordings and sexual deepfakes of real persons without verified consent are prohibited.

8. Third-Party Participants
Every participant must have written consent or release, identity documentation and completed legal-age verification before covered content is published. FLESHLAB must record the required releases.

9. Compensation
The proposed standard split is 30% Performer and 70% Studio in USD. Multi-performer splits are configured individually per production. The applicable schedule is incorporated by reference.

10. Revenue Share Base
The 30% Performer share is calculated on the defined Revenue Share Base, not an undefined concept of profit. Production expenses do not reduce that base. Payment-provider charges and third-party platform commissions are borne by the Studio under the current business model. Exact refund and chargeback treatment is LEGAL_REVIEW_REQUIRED.

11. Accounting and Payment
FLESHLAB will provide detailed statements where available. Minimum payout is USD 50; balances below the threshold carry forward. Payment methods may include GCash, PayPal and Bank Transfer. Recorded/video/streaming settlements are monthly; Live Cam settlements are every 14 days, with applicable dates on the 5th and 20th. Final payment operations remain subject to provider configuration.

12. Production Expenses
FLESHLAB may cover production-related expenses for a revenue-generating Performer only after prior Studio approval. Travel, accommodation, equipment and services do not create an automatic reimbursement obligation and are not silently deducted from the 30% Revenue Share Base.

13. Content and Intellectual Property
Subject to legal approval, FLESHLAB receives exclusive commercial rights for covered content worldwide, including publication, sale, streaming, licensing, distribution, editing, formatting, translation, subtitles, thumbnails, covers, advertising, social promotion, name, stage name, image, likeness and voice uses, and necessary sublicensing. Rights are intended during the Agreement and five years after termination, with the agreed share continuing. The precise license/assignment structure is LEGAL_REVIEW_REQUIRED.

14. Consent and Production Boundaries
Each production records categories, boundaries, participants and release status. The Performer may pre-declare excluded practices and withdraw consent for an activity that has not occurred. Jurisdiction-specific consent language and treatment of completed released content are LEGAL_REVIEW_REQUIRED.

15. Confidentiality and Data Protection
Confidential information includes customer information, unpublished content, pricing, business models, credentials, provider information, other Performer information and operational information. The working survival period is two years after termination, subject to applicable law. Identity documents and contracts are retained only for documented purposes and applicable retention obligations.

16. Exclusivity
The business intent is no work for competing adult studios and prior Studio consent for commercial activity on OnlyFans, Fansly or equivalent platforms. Broad professional exclusivity and enforceability are LEGAL_REVIEW_REQUIRED and must not be treated as finally approved.

17. Management Services
Management is separate and optional. If separately assigned and signed, FLESHLAB may represent the Performer and negotiate with third parties. No additional management commission currently applies. This Agreement does not activate Management.

18. Term
The intended term is indefinite unless the parties agree otherwise in an approved version. The exact legal formulation is LEGAL_REVIEW_REQUIRED.

19. Ordinary Termination
Ordinary termination is intended to take effect at calendar month-end. The required notice period is unresolved and LEGAL_REVIEW_REQUIRED. Already earned compensation remains payable subject to lawful adjustments or counterclaims.

20. Immediate Termination
Serious breach, unlawful conduct, safety or consent failure, fraud or material violation may support immediate termination, subject to applicable law and LEGAL_REVIEW_REQUIRED procedure.

21. Effect of Termination
Accrued payment rights remain addressed under the approved compensation terms. Rights in lawfully created, approved and released content remain subject to the approved rights period and the Performer share. No automatic forfeiture of earned compensation applies.

22. Taxes
The Performer is responsible for taxes and filings applicable to independent contractor income, subject to mandatory withholding or reporting obligations in the relevant jurisdiction.

23. Representations and Warranties
Each party represents that it has authority to enter an approved Agreement. The Performer confirms age, identity information, consent and the accuracy of submitted information. FLESHLAB does not waive mandatory legal protections.

24. Notices
Notices must use the contact channels recorded for the parties and be retained in the contract history. Delivery and effective-time rules are LEGAL_REVIEW_REQUIRED.

25. Governing Law
The business intent is Taiwan law and a Taiwan forum for an international Performer. The final court or arbitration mechanism is LEGAL_REVIEW_REQUIRED.

26. Controlling Language
English is intended to control. Translations may assist understanding but do not replace the approved controlling-language version.

27. Electronic Contracting
Electronic records, review and signatures may be used only when the template is APPROVED, the signing feature is enabled and applicable identity, consent and evidentiary safeguards are configured. Signing is currently disabled.

28. Changes to Material Terms
Material changes require an approved new template version or written amendment. Existing immutable snapshots must not be edited. Compensation and rights changes require explicit review.

29. Entire Agreement
The approved Agreement, its approved schedules and expressly incorporated documents form the agreement on the covered subject. Referenced Content Rights, Consent Standards, Confidentiality, Compensation Schedule and optional Management Agreement remain separate instruments.

30. Severability
If a provision is unenforceable, the remaining provisions continue to the extent permitted by law and the parties should replace the provision with a lawful closest equivalent. Final jurisdiction-specific wording is LEGAL_REVIEW_REQUIRED.

SIGNATURE PAGE
FOR FLESHLAB STUDIOS
Authorized Representative: {{studio_signer_name}}
Signature: {{studio_signature}}
Date: {{studio_signed_at}}

PERFORMER
Legal Name: {{creator_legal_name}}
Performer / Stage Name: {{performer_name}}
Signature: {{creator_signature}}
Date: {{creator_signed_at}}

DOCUMENT VERIFICATION
Contract Number: {{contract_number}}
Version: {{template_version}}
Document Hash: {{document_hash}}
This document is a legal-review draft until the template is approved. No signature is asserted by this preview.$$ AS body
)
INSERT INTO v3_contract_template_versions(template_id,version,body,sections,variables,body_hash)
SELECT target.id,'2.0',document.body,
  to_jsonb(ARRAY['Purpose of this Agreement','Independent Contractor Status','Eligibility','Services','Minimum Activity Commitment','Professional and Platform Standards','Prohibited Content','Third-Party Participants','Compensation','Revenue Share Base','Accounting and Payment','Production Expenses','Content and Intellectual Property','Consent and Production Boundaries','Confidentiality and Data Protection','Exclusivity','Management Services','Term','Ordinary Termination','Immediate Termination','Effect of Termination','Taxes','Representations and Warranties','Notices','Governing Law','Controlling Language','Electronic Contracting','Changes to Material Terms','Entire Agreement','Severability','Signature Page','Document Verification']),
  to_jsonb(ARRAY['company_legal_name','company_address','company_number','creator_legal_name','performer_name','contract_number','effective_date','template_version','studio_signer_name','studio_signature','studio_signed_at','creator_signature','creator_signed_at','document_hash','compensation_plan','payment_cycle','license_term','territory','governing_law']),
  encode(digest(document.body,'sha256'),'hex')
FROM target, document
ON CONFLICT(template_id,version) DO NOTHING;

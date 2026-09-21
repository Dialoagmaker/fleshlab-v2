WITH target AS (SELECT id FROM v3_contract_templates WHERE template_key='management_optional'), document AS (
  SELECT $$FLESHLAB STUDIOS
A division of Dialogmakers International Ltd.
06
MANAGEMENT AGREEMENT
OPTIONAL CREATOR MANAGEMENT
Performer: {{performer_name}}
Contract: {{contract_number}}
Effective: {{effective_date}}
Version: {{template_version}}

OPTIONAL · LEGAL_REVIEW_REQUIRED · TEMPLATE PREVIEW / NOT A SIGNED CONTRACT

1. Purpose
This optional Agreement governs a separate management and representation relationship between FLESHLAB Studios, a division of Dialogmakers International Ltd., and the individual Performer. It does not govern production compensation, content exploitation rights, production consent or publishing eligibility.

2. Parties
FLESHLAB Studios, a division of Dialogmakers International Ltd., 2F, No. 2-1, Lane 23, Wenhua St., Taoyuan City, Taoyuan 324010, Taiwan, Company No. 83273694, and {{creator_legal_name}}, {{creator_address}}, {{performer_name}}.

3. Optional Appointment
The Performer may separately appoint FLESHLAB Studios as exclusive manager and representative within the professional scope defined here. This Agreement is optional and is never automatically assigned because a Performer Services Agreement exists.

4. Management Services
FLESHLAB may provide career planning, strategic advice, commercial and platform strategy, brand positioning, stage-name development, opportunity sourcing, negotiation support, scheduling, publicity coordination, booking support and related management services.

5. Third-Party Representation
FLESHLAB may receive offers, request terms, communicate the Performer's position, negotiate and present opportunities in communications with studios, agencies, platforms, producers, distributors and commercial partners.

6. Authority Matrix
Search and present opportunities: ALLOWED.
Negotiate commercial terms: ALLOWED.
Represent the Performer in discussions: ALLOWED.
Sign a new third-party contract without Performer approval: NOT ALLOWED.
Bind the Performer under specific written authority: ONLY WITH SEPARATE AUTHORIZATION.
Additional management commission: 0%.

7. Authority to Bind
FLESHLAB may negotiate and represent but may not bind the Performer to a new third-party contract without the Performer's separate approval or a specific written authorization for that transaction. A broader power of attorney requires separate explicit written authorization. This authority boundary is LEGAL_REVIEW_REQUIRED.

8. Commercial Opportunities
FLESHLAB may identify and negotiate bookings, collaborations, studio engagements, platform opportunities, licensing opportunities, appearances, creator partnerships and commercial campaigns. Material terms must be communicated before a binding commitment unless separate authorization expressly permits otherwise.

9. Management Exclusivity
During the term, FLESHLAB is intended to be the exclusive manager within the defined professional scope. The Performer should not appoint another manager for substantially the same role without prior written consent. Scope, proportionality and international enforceability are LEGAL_REVIEW_REQUIRED.

10. Relationship to Other Agreements
This Agreement does not replace or absorb the Performer Services Agreement, Content Rights & Performer Release, Consent & Production Standards Agreement, Confidentiality & Data Protection Agreement or Compensation Schedule. Those instruments remain separate.

11. Management Commission
Management Commission: 0%.
FLESHLAB receives no additional percentage merely for providing management services under this Agreement. This does not modify the separate 30/70 Performer/Studio structure in the Compensation Schedule.

12. Expenses
Management expenses incurred by the Performer require prior written Studio approval before reimbursement. Unilateral expenses do not create an automatic Studio liability and may not reduce Performer earnings unless another written agreement expressly permits it.

13. Performer Responsibilities
The Performer should provide accurate information, cooperate reasonably with agreed opportunities, communicate availability, disclose material conflicts, avoid knowingly undermining authorized negotiations and promptly report relevant direct approaches within the management scope.

14. Studio Responsibilities
FLESHLAB should act in good faith, communicate material deal terms, accurately represent its authority, avoid falsely claiming Performer approval, keep reasonable negotiation records, protect confidential commercial information and disclose material conflicts where appropriate.

15. Other Performers and Conflicts
FLESHLAB may manage other Performers in similar markets. It must not improperly use one Performer's confidential information for another. Material conflicts should be disclosed where appropriate. Conflict-of-interest standards are LEGAL_REVIEW_REQUIRED.

16. Confidentiality
Management confidential information includes proposed deals, non-public rates, counterparties, negotiation positions, strategy, unreleased opportunities and private correspondence. The separate Confidentiality & Data Protection Agreement applies.

17. Term
The business intent is an indefinite term beginning {{effective_date}}. The final legal termination structure is LEGAL_REVIEW_REQUIRED.

18. Ordinary Termination
Either party may terminate by written notice effective at the end of a calendar month. The final notice period is LEGAL_REVIEW_REQUIRED. Ending Management does not automatically end the Performer Services Agreement.

19. Immediate Termination
Where legally available, immediate termination may follow material breach such as fraud, deliberate material misrepresentation, serious confidentiality misuse, an unauthorized binding commitment or a material breach of representation authority. Final procedure is LEGAL_REVIEW_REQUIRED.

20. Existing Opportunities After Termination
Termination does not automatically invalidate contracts or opportunities validly concluded before termination. The parties should cooperate reasonably on transition. With management commission at 0%, no continuing management commission arises merely because an opportunity originated during the term unless separately agreed.

21. No Employment, Partnership or Ownership
Management appointment creates no employment, partnership or joint venture and gives no ownership of the Performer's identity or content. Authority is limited to the scope expressly granted.

22. No Production or Content Rights
This Agreement does not grant content exploitation rights, production consent, publishing eligibility or compensation rights. Those remain governed by the separate Contract Pack instruments.

23. No Implied Signing Authority
Review, negotiation or representation does not imply authority to sign a third-party agreement. Each binding transaction requires Performer approval or a specific written authority.

24. Notices and Records
Material opportunities, approvals, authorities, conflicts and termination notices should be recorded through the FLESHLAB contract history and agreed contact channels. Delivery rules are LEGAL_REVIEW_REQUIRED.

25. Governing Law and Forum
The business intent is Taiwan law, a Taiwan forum and English controlling language for an international Performer. Court versus arbitration remains LEGAL_REVIEW_REQUIRED.

26. Electronic Contracting
Electronic execution is available only after template approval, feature activation and applicable identity, consent and evidentiary safeguards. Signing is currently disabled.

27. Changes to Material Terms
Material changes require an approved new template version or written amendment. Immutable snapshots are never edited. A new version does not automatically amend an existing instance.

28. Entire Agreement
This Management Agreement and its approved schedules form the agreement for management scope only. Separate Services, Rights, Consent, Confidentiality and Compensation instruments remain independent.

29. Severability
If a provision is unenforceable, the remaining provisions continue to the extent permitted by law and the parties should use a lawful closest equivalent. Final jurisdiction-specific language is LEGAL_REVIEW_REQUIRED.

30. Legal Review Items
Authority to bind; broader power-of-attorney implications; management exclusivity; Taiwan/international enforceability; notice period; conflicts of interest; court versus arbitration; and independent-contractor interaction all require legal review.

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
This optional agreement is a legal-review draft. No signature is asserted by this preview.$$ AS body
)
INSERT INTO v3_contract_template_versions(template_id,version,body,sections,variables,body_hash)
SELECT target.id,'2.0',document.body,
  to_jsonb(ARRAY['Purpose','Parties','Optional Appointment','Management Services','Third-Party Representation','Authority Matrix','Authority to Bind','Commercial Opportunities','Management Exclusivity','Relationship to Other Agreements','Management Commission','Expenses','Performer Responsibilities','Studio Responsibilities','Other Performers and Conflicts','Confidentiality','Term','Ordinary Termination','Immediate Termination','Existing Opportunities After Termination','No Employment, Partnership or Ownership','No Production or Content Rights','No Implied Signing Authority','Notices and Records','Governing Law and Forum','Electronic Contracting','Changes to Material Terms','Entire Agreement','Severability','Legal Review Items','Signature Page','Document Verification']),
  to_jsonb(ARRAY['company_legal_name','company_address','company_number','creator_legal_name','creator_address','performer_name','contract_number','effective_date','template_version','studio_signer_name','studio_signature','studio_signed_at','creator_signature','creator_signed_at','document_hash']),
  encode(digest(document.body,'sha256'),'hex')
FROM target,document ON CONFLICT(template_id,version) DO NOTHING;

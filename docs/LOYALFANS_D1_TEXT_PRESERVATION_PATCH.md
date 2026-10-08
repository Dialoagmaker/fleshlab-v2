# LoyalFans D1 text-preservation patch

Base release: `413bf9e82a9bab77376f4d99cc3fbf6c893bcf68`.

The Store normalizer now carries `content` and `clean_content` into the existing
catalogue text columns without trimming or length truncation. Other bounded
identity/display fields keep their existing normalization. This preserves
Unicode and the exact upstream text while keeping signed media URLs out of
catalogue and provenance records.

No schema change or migration is required; the existing columns are PostgreSQL
`text`. A neutral regression covers Unicode, boundary whitespace, and content
longer than the previous 10,000-character normalization limit.

The patch does not change the customer provider, media fulfillment, catalogue
sync, trailer, publication, purchase, entitlement, or full-video settings.

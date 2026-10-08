# Observed comments and Store pagination contracts

The provider reads two optional server-only configuration keys:

- `LOYALFANS_CREATOR_COMMENTS_REQUEST_CONTRACT_JSON`
- `LOYALFANS_CREATOR_CATALOGUE_REQUEST_CONTRACT_JSON`

Both environment keys default to empty and are passed into the API by the existing Compose configuration.
The comments client now supplies the observed terminal-first-page contract below when neither an explicit
JSON contract nor a legacy comments path is configured. The observed Store pagination contract requires
the configured creator slug and numeric limit below, or an explicit JSON request contract.
These keys contain request structure and pagination rules, never credentials. The existing creator
credential files remain separate. The provider remains disabled by default; this change makes no upstream requests.
Malformed nonempty contracts fail local validation; they do not silently fall back to legacy requests.

## Shared JSON schema (version 1)

| Field | Meaning |
| --- | --- |
| `version` | `1` |
| `observed` | Explicit `true` only after checking authenticated DevTools captures |
| `method` | Captured retrieval method: `GET` or `POST` |
| `pathTemplate` | Full absolute API path beginning `/`; no guessed prefix, origin, query string or fragment |
| `query` | Object of fixed query fields copied from the request; scalar values only |
| `payload` | Fixed JSON request body for POST, or explicit `null`; GET bodies are rejected |
| `pagination.maxPages` | Operator traversal bound, integer 1–100 |

Nested JSON bodies are supported. Response and body paths are arrays of literal field names,
not executable expressions or dotted strings. Dynamic fields must not collide with fixed fields.
Only approved retrieval methods are supported; no generic mutation endpoint is exposed.
Credentials, custom Authorization headers and cookies cannot be included in the request contract.

## Comments

### OBSERVED normal initial list request

```http
POST /api/v1/comments?ngsw-bypass=true
Content-Type: application/json
```

```json
{"uid":"<POST_UID>"}
```

The normal list request contains only `uid`. It never contains `uid_comment`, including in a configured
list request or continuation mapping. The post UID comes from the stored one-time challenge.

The observed complete one-page response has `success: true`, `httpCode: 200`, a structurally valid
`comments` array. Live validation confirmed that each of these four **top-level** continuation markers
may be absent or `null` on a terminal first page:

- `page_token`
- `page_token_newer`
- `token_id`
- `token_newer_id`

A comment object's own `page_token` is unrelated to list completeness and is ignored for pagination.
No continuation mapping has been observed. If any top-level marker is non-null, the default client stops
after the initial request with `LOYALFANS_COMMENTS_CONTINUATION_CONTRACT_REQUIRED`. The buyer verifier returns
`status: pending`, `verification_status: continuation_contract_required`; it does not consume the challenge or
bind a buyer. Absent/null markers mean no continuation; every non-null value (including an empty string,
zero or false) requires continuation. Malformed responses and invalid comment identities still fail closed.

The built-in observed contract is equivalent to this optional server configuration:

```json
{
  "version": 1,
  "observed": true,
  "method": "POST",
  "pathTemplate": "/api/v1/comments",
  "query": {"ngsw-bypass": true},
  "payload": {"uid": "{postUid}"},
  "pagination": {
    "maxPages": 1,
    "maxComments": 10000,
    "continuation": [],
    "terminal": {"all": [
      {"responsePath": ["page_token"], "equals": null},
      {"responsePath": ["page_token_newer"], "equals": null},
      {"responsePath": ["token_id"], "equals": null},
      {"responsePath": ["token_newer_id"], "equals": null}
    ]}
  }
}
```

`maxPages` and `maxComments` are local safety bounds, not invented upstream parameters.
An existing legacy `LOYALFANS_CREATOR_COMMENTS_PATH_TEMPLATE` must be cleared, or this observed JSON contract
must be set explicitly, to select the normal POST flow. Legacy paths never attest completeness.

`supportsCompleteComments()` is a stable capability used to register the buyer-verification operation.
For the observed initial contract, `canAttestCompleteComments()` remains false before a successful terminal
list traversal and after any failed/incomplete traversal. Supplying a response to
`canAttestCompleteComments(response)` checks its structure and all four top-level terminal markers.
Only authenticated `listComments()` output can reach the buyer verifier; a response helper is not proof by itself.

Verification requires the generated challenge to occur exactly as a distinct token in the comment text,
`comment.parent.uid === expectedPostUid`, and valid
`comment.user.uid`. Request-level post scope cannot substitute for the observed parent UID. The persisted
external identity is solely `user.uid`; display name and slug are not required for this observed proof and
cannot replace the UID. Existing challenge lifetime,
single-use consumption and buyer/comment uniqueness checks remain in force. Ordinary surrounding text and
whitespace are allowed. Adjacent letters, numbers, combining marks, format characters, underscores or hyphens
reject the token match; modified, prefixed, suffixed or partial challenges cannot verify a buyer.
Verification creates no entitlements.

### OBSERVED targeted lookup (separate operation)

```http
POST /api/v1/comments?ngsw-bypass=true
Content-Type: application/json
```

```json
{"uid":"<POST_UID>","uid_comment":"<COMMENT_UID>"}
```

The internal `lookupComment()` operation filters by exact comment and parent UIDs and always returns
`complete: false`, `lookup: targeted`. Even a targeted response with four null top-level markers cannot prove
complete traversal of the post's comments and never updates list attestation. It is not used for buyer linking.

### Configuring continuation after observation

Place exactly one `{postUid}` placeholder in the request path, a fixed query value, or a fixed
body value. It is filled from the internal challenge's exact post UID. No client UID is accepted as proof.

Additional `pagination` fields:

- `maxComments`: integer 1–10,000.
- `continuation`: array of zero to eight mappings. Each mapping contains `responsePath`,
  `location` (`query` or `body`), `requestPath`, and `type` (`string` or `integer`).
  Query request paths have exactly one field; body paths may be nested.
- `terminal.all`: nonempty array of predicates `{ "responsePath": [...], "equals": ... }`.
  Custom predicate fields must exist and match. For the observed initial POST contract only, the four
  standard top-level null predicates accept absent fields as well as explicit null.

The first request contains only fixed fields. Later requests carry the mapped continuation values.
An empty continuation array supports only an explicitly proven single terminal page.
For custom pagination predicates, a missing field is distinct from explicit JSON `null`.
Strings and numbers are not coerced.
Nonterminal continuation values must be valid nonempty strings or nonnegative safe integers.
The confirmed absent-or-null terminal rule applies to the observed normal POST contract. No response-to-request
mapping is inferred for non-null `page_token`, `page_token_newer`, `token_id`, or `token_newer_id`.
If the captured endpoint has both older/newer directions, the contract must prove completeness of
the relevant challenge window; do not attest it from just one unexplained pagination marker.

Traversal rejects repeated continuation tuples, repeated pages, duplicate comment IDs, wrong explicit
post IDs, empty nonterminal pages, missing terminal evidence and exceeded limits. It returns no partial
proof on failure. A legacy path alone cannot attest completeness. The built-in observed initial contract
supports terminal first pages only. An explicit, validated contract with observed continuation mappings can
enable bounded multi-page retrieval; each traversal still has to prove terminal completion before the
existing one-time challenge verifier can consume anything.
Exact challenge text and `user.uid` drive verification. Display name and slug never replace that UID.

## Store

### OBSERVED request and typing

```http
POST /api/v2/videos-store?ngsw-bypass=true
Content-Type: application/json
```

Observed page-2 body:

```json
{"slug":"fleshlabstudios","page":"2","limit":36,"type":"video"}
```

`slug` and `type` are strings. The provider sends `page: String(pageNumber)` starting at `"1"`.
`limit` is a JSON number and remains adjustable; `36` is the observed active request default, overridden
by configured `LOYALFANS_CREATOR_CATALOGUE_LIMIT` or the explicit request contract's numeric `pageSize.value`.
No page number or limit is placed in the query string.

The existing server configuration and Compose API environment support:

- `LOYALFANS_CREATOR_CATALOGUE_SLUG`: creator slug; observed value `fleshlabstudios`.
- `LOYALFANS_CREATOR_CATALOGUE_LIMIT`: numeric page size; defaults to observed value `36`.

The creator slug defaults to empty; no creator identity is guessed. Supplying a slug selects the observed
POST contract with default limit `36`; an invalid configured limit fails local validation. An explicit
`LOYALFANS_CREATOR_CATALOGUE_REQUEST_CONTRACT_JSON` takes precedence. No live configuration is changed here.
The provider and catalogue write switches remain disabled by default.

### OBSERVED / VALIDATED page-2 response

The authenticated response to the observed page-2 request confirmed:

```json
{"total":116,"per_page":36,"current_page":2,"last_page":4,"from":36,"to":72}
```

These are current capture values, not traversal constants. The metadata establishes requested page `"2"`
→ returned page `2`, range `[36,72)`, and an upstream-declared last page of `4`. A neutral regression fixture
retains this exact metadata with synthetic UIDs; no catalogue descriptive content is copied from the capture.
The request contract is observed and validated against this response. Live full traversal has not been run
by this change; page-1 and terminal responses still undergo the same validation when authorized.

Equivalent explicit JSON configuration (example uses the observed slug and limit):

```json
{
  "version": 1,
  "observed": true,
  "method": "POST",
  "pathTemplate": "/api/v2/videos-store",
  "query": {"ngsw-bypass": true},
  "payload": {"slug": "fleshlabstudios", "type": "video"},
  "pagination": {
    "maxPages": 100,
    "maxItems": 10000,
    "page": {"location": "body", "requestPath": ["page"], "type": "string"},
    "pageSize": {"location": "body", "requestPath": ["limit"], "value": 36}
  }
}
```

The observed path requires this body shape, string page encoding and numeric limit. Legacy configured GET
paths remain separate; use the observed configuration above to select this POST flow.

### Traversal and safety

Additional `pagination` fields:

- `page`: `{ "location": "query" | "body", "requestPath": [...], "type": "string" | "integer" }`.
  Generic contracts without `type` retain integer encoding. The observed Store contract requires `string`.
- Optional `pageSize`: same fields plus `value`, the captured page size (integer 1–1000).
- Optional `maxItems`: local maximum item count (integer 1–100,000, default 10,000).

The provider inserts page numbers from 1 into the configured location, including the first request.
POST JSON bodies may retain nested fixed fields. No page parameter is inferred from `page_meta`.
The catalogue engine traverses through the actual authoritative `page_meta.last_page`; it does not compute
that field from `total/per_page` or assume 12 items, 10 pages, or 116 total products. It accepts different
configured limits and response page sizes across scans. Within one resumable scan, declared total,
page size and last page must remain consistent; a changed snapshot fails safely.

`total`, `per_page`, `current_page`, `last_page`, `from` and `to` must be safe integers. The returned
`current_page` must equal the requested page. Ranges use the observed zero-based, end-exclusive convention,
must continue the previous page's actual item count, and must end at the declared total on the terminal page.
Pages may contain fewer than `per_page` items: completeness follows actual ranges and authoritative last page.
Repeated/regressing/mismatched pages, invalid envelopes, impossible last pages, range gaps, unexpected duplicate
UIDs, authentication/provider errors, missing metadata and exceeded safety bounds all fail closed.

The default page bound is 100. Full scans and persistent sync also enforce the item bound, including before
processing a page declaring an excessive total. Persistent sync checks exact UIDs against prior pages in the
same run, including after resumption; replaying an interrupted page retains existing item idempotency.
Metadata, prices and poster/trailer behavior remain separate from fulfillment. Sync creates no entitlements.

Legacy keys `LOYALFANS_CREATOR_COMMENTS_PATH_TEMPLATE`, `LOYALFANS_CREATOR_CATALOGUE_PATH`, and
`LOYALFANS_CREATOR_CATALOGUE_PAGE_PARAMETER` remain compatible. Legacy comments never attest completeness.
Use the complete JSON contract for POST/body pagination and explicitly observed terminal semantics.

## Exact live evidence still needed

1. Comments: the authenticated continuation request after a non-null top-level marker: method, full path,
   complete query/body and the exact response-field-to-request-field mapping for each required marker.
   Include subsequent response envelopes and a terminal response proving the relevant challenge window
   is complete; establish both older/newer traversal directions if the API requires them. The normal initial
   POST, its `uid` body and the four-null terminal first-page response are already observed.
2. Store: no request-shape or page-2 metadata evidence remains missing. POST path/query/body, page/limit
   typing and page-2 `116/36/2/4/[36,72)` metadata are observed and validated. Live authenticated page-1
   and terminal responses for the selected slug/limit remain a full-traversal operational validation step;
   they must satisfy the implemented `page_meta` and exact UID checks.

Remove credentials and signed URLs before retaining evidence. Pagination tokens remain ephemeral and
must not be placed in fixed configuration or logs. Preserve only field shapes and redacted examples.
If pagination changes request methods/paths between pages or requires an unsupported encoding, leave
the contract disabled and report the observed difference rather than approximating it.

## Observed timestamp wire format

Catalogue `created_at`/`updated_at`, comment `added_at` (or existing `created_at`) and creator transaction
`created_at` use the same server timestamp normalizer. Existing ISO strings with an explicit timezone and
objects such as `{"date":"2026-07-22 20:24:19","timezone_type":3,"timezone":"UTC"}` normalize to
`2026-07-22T20:24:19.000Z`. Named IANA zones and type-1 numeric offsets are respected independently of
the server timezone. Invalid calendars, missing object fields, unknown zones, ambiguous/nonexistent local
DST times and unsupported timezone abbreviations fail closed. Optional missing timestamps stay null;
required timestamps are never invented. Internal precision is milliseconds.

## Observed downloadable file-size metadata

`video_object.size.width` and `.height` are video dimensions, validated as positive integers.
`video_object.downloadable_video_meta.size` is a separate optional file-size label. Observed examples
include `262.41MB`, `1.13GB`, `84.34MB` and `16.61MB`. Normalization preserves the exact original string
in `downloadable_size_display`; rounded unit labels do not establish exact bytes, so
`downloadable_size_bytes` is null. No decimal/binary unit multiplier or rounding estimate is applied.
Existing positive safe integer numbers (and unambiguous integer byte strings) still populate exact bytes.
Missing/null downloadable metadata or size remains optional. Invalid file-size input uses
`INVALID_CATALOGUE_FILE_SIZE`; malformed dimensions still use `INVALID_CATALOGUE_DIMENSION`.
Neither upstream display labels nor these metadata fields determine full-media validation or entitlement.

Migration `0063_v3_loyalfans_catalogue_display_size.sql` adds the nullable, bounded display column.
It must be separately reviewed/applied before authorizing durable sync with this patch; it is not applied
by patch preparation. Old applications ignore the additive column. Signed source URLs remain transient.

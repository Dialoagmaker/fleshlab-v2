> Historical evidence record. Implementation conclusions below describe an earlier stage and are superseded
> by LOYALFANS_INTEGRATION_AUDIT.md and LOYALFANS_REQUEST_CONTRACTS.md. Current creator history has stable
> transaction IDs and full-video sources; terminal first-page comments and Store pagination are implemented.

# LoyalFans public client comparison and provider decision

Reviewed 2026-10-06. Source snapshots:

- [Vergil9000/LoyalFans at 04ff6e4](https://github.com/Vergil9000/LoyalFans/tree/04ff6e4e3fb7bbfd54d91c7ee96e107c850c311c) (2021-01-05)
- [UltimaHoarder/UltimaScraperAPI at 8cf43fa](https://github.com/UltimaHoarder/UltimaScraperAPI/tree/8cf43fa3ac6981f78ed35b378b5f9d96517db6c7) (2026-09-16)

These are third-party implementations, not LoyalFans API or authorization
contracts. Their endpoint strings and response assumptions were not adopted as
provider guarantees. No credentials, browser cookies, or third-party code were
added to FLESHLAB.

| Topic | Vergil9000/LoyalFans | UltimaScraperAPI LoyalFans | FLESHLAB now |
|---|---|---|---|
| Authorization | README directs the user to copy a browser `Authorization: Bearer` value into `config.json`; requests reuse that header. [README](https://github.com/Vergil9000/LoyalFans/blob/04ff6e4e3fb7bbfd54d91c7ee96e107c850c311c/README.md#L25-L49), [config](https://github.com/Vergil9000/LoyalFans/blob/04ff6e4e3fb7bbfd54d91c7ee96e107c850c311c/config.json#L3-L11) | Parses a copied browser cURL for Bearer and cookie values; can substitute `NEXOSESSION` for the Bearer value. It returns authorization and User-Agent, not the parsed cookie, and its LoyalFans session uses an empty cookie map. It does not obtain a service credential. [parser](https://github.com/UltimaHoarder/UltimaScraperAPI/blob/8cf43fa3ac6981f78ed35b378b5f9d96517db6c7/ultima_scraper_api/apis/loyalfans/loyalfans.py#L17-L74), [session](https://github.com/UltimaHoarder/UltimaScraperAPI/blob/8cf43fa3ac6981f78ed35b378b5f9d96517db6c7/ultima_scraper_api/managers/session_manager.py#L114-L135), [authenticator](https://github.com/UltimaHoarder/UltimaScraperAPI/blob/8cf43fa3ac6981f78ed35b378b5f9d96517db6c7/ultima_scraper_api/apis/loyalfans/authenticator.py#L121-L133) | Isolated, non-production transaction probe requires runtime Bearer, cookie and XSRF values from the observed browser exchange. The installed adapter is not wired to that probe. |
| Session lifecycle | Creates a short-lived `requests.Session` for each call; the README tells users to recopy authorization after expiry. No refresh or server login is implemented. [script](https://github.com/Vergil9000/LoyalFans/blob/04ff6e4e3fb7bbfd54d91c7ee96e107c850c311c/loyalfans.py#L139-L150), [README](https://github.com/Vergil9000/LoyalFans/blob/04ff6e4e3fb7bbfd54d91c7ee96e107c850c311c/README.md#L44-L49) | Maintains an HTTP client session, tests the supplied token against `/api/v1/auth/user/me`, retries, and stops on token/refresh errors. No LoyalFans refresh-token or service-login flow is implemented. [authenticator](https://github.com/UltimaHoarder/UltimaScraperAPI/blob/8cf43fa3ac6981f78ed35b378b5f9d96517db6c7/ultima_scraper_api/apis/loyalfans/authenticator.py#L55-L119), [session manager](https://github.com/UltimaHoarder/UltimaScraperAPI/blob/8cf43fa3ac6981f78ed35b378b5f9d96517db6c7/ultima_scraper_api/managers/session_manager.py#L105-L202) | No production creator session or renewal lifecycle. Production disables the probe even if runtime values are configured. |
| User-Agent | README instructs copying the browser User-Agent into static request headers. [README](https://github.com/Vergil9000/LoyalFans/blob/04ff6e4e3fb7bbfd54d91c7ee96e107c850c311c/README.md#L40-L49) | cURL parser stores User-Agent, and an unused helper can construct a header. The LoyalFans authenticator's request-header method does not read that stored value, so this source does not demonstrate that a matching User-Agent is required or correctly forwarded. [parser](https://github.com/UltimaHoarder/UltimaScraperAPI/blob/8cf43fa3ac6981f78ed35b378b5f9d96517db6c7/ultima_scraper_api/apis/loyalfans/loyalfans.py#L59-L73), [authenticator](https://github.com/UltimaHoarder/UltimaScraperAPI/blob/8cf43fa3ac6981f78ed35b378b5f9d96517db6c7/ultima_scraper_api/apis/loyalfans/authenticator.py#L121-L133) | Probe does not forge a browser User-Agent. An added User-Agent would not turn a browser token into a service credential. |
| `/api/v2/profile` | GET is used to read the authenticated account's `following` count, not to issue credentials or verify purchases. [script](https://github.com/Vergil9000/LoyalFans/blob/04ff6e4e3fb7bbfd54d91c7ee96e107c850c311c/loyalfans.py#L140-L152), [config](https://github.com/Vergil9000/LoyalFans/blob/04ff6e4e3fb7bbfd54d91c7ee96e107c850c311c/config.json#L21-L28) | Uses `/api/v1/auth/user/me` for token validation and `/api/v2/profile/star/{identifier}` for another user's profile; no plain `/api/v2/profile` flow is shown. [authenticator](https://github.com/UltimaHoarder/UltimaScraperAPI/blob/8cf43fa3ac6981f78ed35b378b5f9d96517db6c7/ultima_scraper_api/apis/loyalfans/authenticator.py#L94-L107), [auth model](https://github.com/UltimaHoarder/UltimaScraperAPI/blob/8cf43fa3ac6981f78ed35b378b5f9d96517db6c7/ultima_scraper_api/apis/loyalfans/classes/auth_model.py#L65-L70) | Not used for commerce authorization. |
| `/api/v2/timeline/store` | POST enumerates videos by creator slug and checks `is_bought` to choose a media URL or trailer. It supplies no transaction ID, buyer UID, currency or finality. [script](https://github.com/Vergil9000/LoyalFans/blob/04ff6e4e3fb7bbfd54d91c7ee96e107c850c311c/loyalfans.py#L326-L358) | No use of this endpoint in the LoyalFans implementation; it requests social timeline posts by username. [user model](https://github.com/UltimaHoarder/UltimaScraperAPI/blob/8cf43fa3ac6981f78ed35b378b5f9d96517db6c7/ultima_scraper_api/apis/loyalfans/classes/user_model.py#L87-L95) | Not used as payment evidence. |
| Purchases and transactions | No purchase, creator transaction-history or refund handling. `is_bought` is an account-specific access flag, not a receipt. | `buy_ppv` methods construct `/api/v2/posts/{uid}/purchase` and `/api/v2/messages/{uid}/purchase`; those paths differ from the observed LoyalFans `/api/v2/ecommerce-engine/buy` request and have no transaction/finality verifier in this LoyalFans module. The project's own documentation lists payments as not implemented. [post model](https://github.com/UltimaHoarder/UltimaScraperAPI/blob/8cf43fa3ac6981f78ed35b378b5f9d96517db6c7/ultima_scraper_api/apis/loyalfans/classes/post_model.py#L98-L107), [documentation](https://github.com/UltimaHoarder/UltimaScraperAPI/blob/8cf43fa3ac6981f78ed35b378b5f9d96517db6c7/docs/api-reference/loyalfans.md#L58-L78) | Creator transaction-history parser and manual non-production probe exist. No installed authoritative transaction verifier; buy success never grants access. |
| Comments and notifications | Neither implemented. | A `get_comments` method constructs `/api/v2/posts/{uid}/comments`, but the documentation still calls comments unimplemented. No demonstrated pagination-complete creator response, notification retrieval or production contract. [post model](https://github.com/UltimaHoarder/UltimaScraperAPI/blob/8cf43fa3ac6981f78ed35b378b5f9d96517db6c7/ultima_scraper_api/apis/loyalfans/classes/post_model.py#L109-L117), [documentation](https://github.com/UltimaHoarder/UltimaScraperAPI/blob/8cf43fa3ac6981f78ed35b378b5f9d96517db6c7/docs/api-reference/loyalfans.md#L58-L78) | Comment retrieval is a controlled test-only adapter boundary; production capability is false. |

## Provider decision

**NOT READY.** Neither repository demonstrates a LoyalFans-issued dedicated
server credential, documented authorization scopes, token refresh/rotation,
durable creator access, complete comment retrieval, or authoritative purchase
and reversal finality. A dedicated FLESHLAB server configuration containing a
manually copied browser Bearer/cookie bundle would still be browser-session
replay. An account reserved for the server does not change that credential
type. Adding a copied User-Agent would not change it either.

The existing `loyalfans-provider-client` stays an isolated non-production
probe. The production adapter stays disabled for comment and transaction
verification. A production implementation requires a LoyalFans-approved
server authentication contract and lifecycle, authorized endpoint semantics,
complete pagination, transaction identity/currency/finality, reversal linkage,
and a controlled end-to-end validation under that contract. The two public
projects do not supply those prerequisites. No migrations or provider requests
were run for this comparison.

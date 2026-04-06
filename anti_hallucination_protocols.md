# Anti-Hallucination Protocols
## Omnichannel Supermarket System Architecture

> **[SKILL_TAG: WEB_SEARCH, CONTEXT7]**
> These protocols govern ALL technical decisions in this architecture session.

---

## Protocol 1: Zero-Invention API Rule

**Rule:** NO ERPNext/Frappe API endpoint may be referenced in the architecture unless it is verified via:
1. Official Frappe Framework REST API documentation (`frappeframework.com/docs`)
2. Official ERPNext documentation (`docs.erpnext.com`)
3. Live web search confirming endpoint existence

**If an endpoint does not exist natively:**
- It MUST be explicitly marked as `[CUSTOM_API]`
- A specification for a custom Frappe app with `@frappe.whitelist()` decorated Python methods must be provided
- The custom endpoint must follow Frappe's documented patterns

**Violations:** Any API endpoint written without a source citation is automatically flagged for review.

---

## Protocol 2: Documentation-First Design

**Rule:** Every technical claim MUST be grounded in retrieved documentation. The following documentation sources are mandatory:

| Technology | Primary Source | Verification Method |
|-----------|---------------|-------------------|
| ERPNext v15/v16 REST API | `docs.erpnext.com` | `[WEB_FETCH]` or `[WEB_SEARCH]` |
| Frappe Framework | `frappeframework.com/docs` | `[WEB_FETCH]` or `[WEB_SEARCH]` |
| Next.js (App Router) | `nextjs.org/docs` | `[CONTEXT7]` |
| React 19 | `react.dev` | `[CONTEXT7]` |
| Razorpay Integration | `razorpay.com/docs` | `[WEB_SEARCH]` + `[WEB_FETCH]` |
| Google Gemini API | `ai.google.dev/gemini-api/docs` | `[WEB_SEARCH]` + `[WEB_FETCH]` |
| Google Maps/Places API | `developers.google.com/maps` | `[WEB_SEARCH]` |

**Process:**
1. Before specifying ANY integration pattern, search for the latest documentation
2. Extract exact endpoint paths, request/response schemas, and authentication methods
3. Cite the documentation link inline in the architecture document

---

## Protocol 3: Feature Verification via Live Research

**Rule:** Swiggy Instamart feature parity claims must be verified by researching the actual product.

**Process:**
1. Web search for current Swiggy Instamart features and user flows
2. Cross-reference against our architecture to ensure no feature gaps
3. Document any features that require custom implementation beyond ERPNext native

---

## Protocol 4: Custom Code Boundary Marking

**Rule:** All components must be clearly categorized:

| Category | Marker | Meaning |
|----------|--------|---------|
| Native ERPNext | `[NATIVE]` | Uses stock ERPNext DocType/API with zero customization |
| Custom Field | `[CUSTOM_FIELD]` | Adds fields to existing DocType via Custom Field API |
| Custom DocType | `[CUSTOM_DOCTYPE]` | New DocType in a custom Frappe app |
| Custom API | `[CUSTOM_API]` | New `@frappe.whitelist()` endpoint |
| Custom Script | `[CUSTOM_SCRIPT]` | Client/Server script hooks |
| External Service | `[EXTERNAL]` | Third-party API (Razorpay, Google Maps, AI Vision) |

---

## Protocol 5: Schema Accuracy Guard

**Rule:** ERPNext DocType field definitions must match Frappe's actual field type system:

**Valid Frappe Field Types (verified):**
`Data`, `Link`, `Dynamic Link`, `Password`, `Int`, `Float`, `Currency`, `Percent`, `Check`, `Small Text`, `Long Text`, `Text Editor`, `Code`, `HTML Editor`, `Markdown Editor`, `Date`, `Datetime`, `Time`, `Duration`, `Select`, `Autocomplete`, `Attach`, `Attach Image`, `Table`, `Table MultiSelect`, `Color`, `Barcode`, `Geolocation`, `JSON`, `Read Only`, `Section Break`, `Column Break`, `Tab Break`, `Heading`, `HTML`

**Any field type NOT in this list must be verified before use.**

---

## Protocol 6: Version Pinning

**Rule:** All library/framework recommendations must specify exact versions:

| Technology | Target Version | Rationale |
|-----------|---------------|-----------|
| ERPNext | v15 LTS or v16 | Latest stable with headless API support |
| Frappe Framework | v15 or v16 (matching ERPNext) | Must match ERPNext version |
| Next.js | 15.x (App Router) | Latest stable with RSC support |
| React | 19.x | Latest stable |
| Node.js | 20 LTS or 22 LTS | Active LTS releases |
| Razorpay Node SDK | Latest stable | Per npm registry |

---

## Protocol 7: No Assumed Behavior

**Rule:** If unsure whether a feature exists in ERPNext:
1. Search documentation first
2. If not found, explicitly mark as `[NEEDS_VERIFICATION]`
3. Provide a fallback custom implementation specification
4. Never state "ERPNext supports X" without a source

---

## Enforcement

These protocols are checked at each architecture task boundary. Any violation results in:
1. Immediate correction with verified information
2. Re-citation of the corrected claim
3. Documentation of the correction for transparency

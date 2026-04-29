# Design principles — what AIDE-FIP will NOT do

AIDE-FIP is a field-tech aid, not a system-of-record for life-safety
compliance. The line between *helpful* and *liable* is real. These
anti-features are deliberately not implemented and should not be added
without going through this list first.

## 1. Will NOT auto-issue an AS 1851 pass/fail certificate

The standard requires a competent person to sign off the routine service.
The app supports the work — provides templates, captures evidence,
generates a PDF report — but the final pass/fail decision and the stamped
certificate are the tech's responsibility.

**Why:** generating a stamped pass certificate from app inputs creates a
liability time-bomb. If a site fire occurs and the certificate was
auto-generated, both the building owner and the service company are
exposed.

## 2. Will NOT paraphrase AS standards verbatim

Every clause page paraphrases the *intent* in one or two sentences and
links out to the authoritative source on the knowledge-base. Full clause
text is not stored in the database, copied into the PWA cache, or
returned by any API.

**Why:** AS standards are copyright Standards Australia. Verbatim copies
breach licence; paraphrasing is fair-use field reference.

## 3. Will NOT store or paraphrase vendor keystroke sequences in detail

Per-panel programming pages list the *names* of common tasks ("enter
engineer mode", "walk test", "force output") and link to the vendor
manual. They do not include "press Menu → 9 → enter passcode" sequences.

**Why:** keystrokes are vendor IP, panel-firmware-version-specific, and
wrong info could disable a system or void warranty. The KB is the
source of truth and tracks vendor revisions.

## 4. Will NOT autodial brigade or monitoring centre

Monitoring-centre contact details are read-only on every site / panel
record. The app will never initiate a phone call or signal to brigade,
not even with confirmation dialogs.

**Why:** one mis-tap initiates a real dispatch. Brigade response fee is
$1,500+ per false alarm, plus the operational distraction of pulling a
truck off real work. A confirmation dialog is not enough.

## 5. Will NOT auto-declare EWIS / STI compliance

The sounder coverage calculator will *estimate* dB at distance using
inverse-square attenuation. It will never declare an EWIS layout
compliant — that requires a calibrated SLM and a competent person.

**Why:** STI (speech transmission index) compliance needs measurement on
the as-installed system with the actual ambient noise at occupancy.
Calculations are a starting point, not a verdict.

## 6. Will NOT act as the system-of-record for AFSS

Fire Safety Statement / Annual Fire Safety Statement is the building
owner's statutory document. The app produces evidence (defect register,
service records, brigade tests) that supports an AFSS, but it is not
the certificate itself. The owner submits the AFSS; the tech provides
evidence.

**Why:** AFSS is a statutory document with the building owner's name on
it, lodged with the local council. App-generated AFSS would shift legal
weight in a way it cannot bear.

## 7. Will NOT LLM-generate cause-and-effect without human gate

If the app ever offers AI-assisted CBE, it will produce a *draft* with
every rule visible and a mandatory witness-test step before save. Saved
CBE rules cannot be auto-pushed to the panel.

**Why:** programming errors in cause-and-effect are life-safety. A
mis-mapped zone-to-output rule that prevents an AHU shutdown could
spread smoke through a building. Human in the loop is the floor.

## 8. Will NOT trust user-supplied input without bounds

All numeric inputs are bounded (min/max enforced in zod and HTML), all
file uploads are size-and-MIME-checked, all SQL is parameterised, and
all user-facing rendered HTML is auto-escaped by React. No
`dangerouslySetInnerHTML` with user content; no `eval`; no string-built
queries.

**Why:** the app stores life-safety data and runs in a public-internet
PWA / native shell. Defence-in-depth is the floor.

## 9. Will NOT silently retry destructive operations

Login failures aren't queued for retry. Defects that fail to save show
an explicit error rather than disappearing. Destructive operations
(delete defect, remove panel from site) require confirmation.

**Why:** a tech assuming a defect was saved when it wasn't is worse
than a tech seeing a clear failure and re-entering it.

## 10. Will NOT trust the network for life-safety logic

Cause-and-effect, brigade interface, and battery sizing all run
deterministically on the server with all inputs visible. They never
defer to a remote LLM, third-party API, or user device for the math.

**Why:** life-safety calc must be auditable, reproducible, and not
break if the internet goes down. The Replit deployment is internet-
dependent for *operation*, not for *correctness* of the calc itself.

---

If you find yourself adding code that conflicts with one of these
principles, stop and think. There is almost always a way to deliver
the *user value* without crossing the line.

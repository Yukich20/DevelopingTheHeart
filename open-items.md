# Open Items — Developing The Heart Counseling & Consulting

**Working document.** Update it as you go tonight and tomorrow.
Last updated: 2026-08-13

**Owner tags:** `[ASHLEY]` her decision or action · `[KENNY]` Kenny's action ·
`[BOTH]` decide together · `[WAIT]` blocked on someone external

**Dates:** Ideal launch **September 1, 2026** · Hard deadline **October 1, 2026**

> Realistic read: September 1 is roughly two weeks out and Board approval hasn't
> landed. Plan to October 1 and treat anything earlier as a bonus. Nothing below
> is hard except the items marked BLOCKER.

---

## 1. Blockers — nothing launches without these

### 1.1 `[WAIT]` OBLPCT associate registration approval

Everything downstream waits on this. The NPI application, malpractice insurance,
the registration number in the site footer, and permission to advertise at all
are gated behind it.

* [ ] Approval received — date: ____________
* [ ] Registration number recorded: ____________

**Do not publish the live site before this lands.** Advertising services as an
associate before approval is holding out to practice.

### 1.2 `[ASHLEY]` Full name as published

Needed in the site footer on all nine pages, the About heading, and every
directory listing. Currently a placeholder token.

* [ ] Name as it should appear publicly: ____________

### 1.3 `[BOTH]` Superbill structure — resolve with Justin first

**This is the highest-stakes open item in the document.**

The plan as stated in the intake was to put the supervisor's NPI on superbills.
That makes the document say the supervisor rendered the service, which is the
shape of a billing-fraud allegation even though she isn't the one filing a claim.

**The safe structure:**

* Rendering provider: her name, her NPI, her associate registration number
* Supervising provider: Justin Rock, LPC/LMFT, his license and NPI
* Diagnose only when clinically warranted — never to enable reimbursement

**Actions:**

* [ ] Raise with Justin — his license is the one exposed
* [ ] Call CPH risk-management line once the policy is issued (free consult)
* [ ] Decide: offer superbills at all in year one, or plain paid receipts only
* [ ] If superbills: build the template with both provider blocks

**Fallback worth considering:** no superbills until licensure. Plain receipts,
no diagnosis code, no NPI. It's cleaner legally and it's *on message* — "nothing
an insurer can use" is a stronger pitch than a superbill that probably won't be
reimbursed anyway.

### 1.4 `[ASHLEY]` Do payers reimburse an associate out of network?

Unanswered, and 1.3 partly depends on it. Many payers won't reimburse a
pre-licensed provider even out of network — which is exactly why people reach
for a supervisor's NPI.

Call provider relations at each and ask: *"Do you reimburse out-of-network
claims for a board-registered marriage and family therapist associate under
supervision, and must the supervisor be the rendering provider?"* Get a name
and date each time.

* [ ] Regence — answer: ____________
* [ ] Providence — answer: ____________
* [ ] PacificSource — answer: ____________
* [ ] Moda — answer: ____________

If the answer is no across the board, say so plainly on the site. Clients
deserve to know they're paying full cost with no offset.

### 1.5 `[ASHLEY]` NPI application — decide the address first

The NPPES registry is fully public and permanently searchable by name. Whatever
address goes on this application is findable forever. **Get the virtual or
registered-agent address in place before applying.**

* [ ] Business address decided (see 2.1)
* [ ] NPI applied for
* [ ] NPI number recorded: ____________

### 1.6 `[ASHLEY]` Malpractice insurance

* [ ] CPH (or alternative) policy bound — confirm it covers telehealth *and*
pre-licensed associate status
* [ ] Cyber liability / data breach coverage
* [ ] Homeowner's carrier called about a business rider

### 1.7 `[ASHLEY]` Professional Disclosure Statement approved by the Board

Written and live at `site/professional-disclosure-statement.html` (a page now,
not a PDF — see item 4.1). It requires Board approval, and it's linked in the
site footer of every page.

* [ ] Reviewed by Justin
* [ ] Submitted to the Board
* [ ] Approved

---

## 2. Privacy of her home address — her stated #1 worry

### 2.1 `[BOTH]` Business address strategy

The LLC is already registered, so **check what's public right now** — Oregon's
business registry is searchable and lists the registered agent address.

* [ ] Search Oregon SOS business registry, see what's exposed
* [ ] Commercial registered agent engaged (~$50–150/yr — Oregon requires a
physical street address for the agent, so a PO box won't work)
* [ ] Virtual business address / CMRA secured
* [ ] Amendment filed with Oregon SOS to change registered agent and principal
place of business
* [ ] Domain privacy enabled at GoDaddy
* [ ] Ask City of Sandy whether home-occupation license records are public
*(this may be what unsticks the license application)*
* [ ] City of Sandy business license obtained
* [ ] Home-occupation zoning confirmed
* [ ] Google Business Profile as **service-area business, address hidden**
* [ ] Business phone confirmed as a business line, not a personal cell

---

## 3. Systems — configuration, mostly Kenny

### 3.1 `[KENNY]` Google Workspace HIPAA setup

There's no EHR, so the compliance burden sits on configuration. **The "I don't
use AI" claim on the website is not true until this is done.**

* [ ] Confirm the Workspace edition supports the BAA (Business Plus recommended
— Vault retention and device management)
* [ ] **Accept the BAA:** Admin console → Account settings → Legal and
compliance → Security and Privacy Additional Terms → HIPAA Business
Associate Amendment. **Screenshot the acceptance for the file.**
* [ ] Gemini disabled org-wide at the org-unit level
* [ ] Gemini in Chrome disabled *(it operates outside the Workspace BAA)*
* [ ] Google Meet: "take notes for me," transcription, and recording all off
* [ ] Gmail smart features and smart compose off
* [ ] 2FA enforced
* [ ] Third-party app and add-on access disabled
* [ ] Drive external sharing restricted
* [ ] Vault retention policy set to match Oregon's records retention rule
* [ ] Written records destruction schedule
* [ ] Backup strategy that isn't just "it's in Drive"

### 3.2 `[BOTH]` Booking system

Site's single call to action. Leading option: **Google Calendar appointment
scheduling** — already paid for, covered by the Google BAA, produces a public
booking link, no extra vendor.

* [ ] Decided: ____________
* [ ] 30-minute free consult schedule created, restricted to Wed–Sat
* [ ] Booking URL: ____________
* [ ] URL pasted into the site (replaces `{{BOOKING_URL}}`, 13 places)

### 3.3 `[ASHLEY]` Payment processing

Google doesn't do payments. Stripe generally won't sign a BAA. IvyPay is built
for therapists and does.

* [ ] Decided: ____________
* [ ] Account opened, deposits routed to the business account

### 3.4 `[KENNY]` Deployment

* [ ] Netlify site claimed and renamed
* [ ] GitHub repo connected for automatic deploys *(optional but recommended)*
* [ ] `developingtheheart.com` DNS pointed at Netlify — **do this early**,
aimed at a holding page. DNS can take 48 hours.
* [ ] Holding page live: "Launching October 2026" + nothing clinical

### 3.5 `[KENNY]` At launch — two switches

* [ ] Delete `<meta name="robots" content="noindex, nofollow">` from all 11 pages
* [ ] Delete `Disallow: /` from `robots.txt`

### 3.6 `[KENNY]` Speaking request form backend — PARKED, do not deploy yet

**On hold.** The footer link was removed on 2026-09-02, so `speaking.html`
exists but nothing on the site points to it. Leave the checklist below unrun
until Ashley decides to bring the page back — there is no reason to deploy a
backend for a form no visitor can reach.

`site/speaking.html` posts to the same Apps Script endpoint as the consult form,
tagged `formType: "speaking"`. The routing for that tag was added to
`apps-script/Code.gs` in v7, but **editing Code.gs does not change the live
endpoint** — until a new version is pushed, every speaking request is read as a
consult inquiry and rejected, which the sender sees as "something went wrong".

* [ ] Paste the current `apps-script/Code.gs` into the Apps Script editor
* [ ] Run `createSpeakingLog()` once, from the editor, to create the log sheet
* [ ] Deploy > Manage deployments > pencil > New version
* [ ] Confirm: open the endpoint URL in a browser — the health check must report
`"version":"v7-…"` and a `routes` array containing `speaking`
* [ ] Send one test request through the live form and confirm the email arrives

---

## 4. Website content still needed

### 4.1 `[ASHLEY]` Copy and assets

* [ ] About page — final 1–2 paragraphs in her own voice
* [ ] "Who I work with" photos — ten frames on the homepage are placeholders
waiting on pictures: Fire, Police, Dispatch, Healthcare, Business owner,
Lawyer, Military/veteran, Air traffic control/pilots, Spouses & family,
Other. **Portrait orientation** (the frame crops to 3:4) and **under ~400KB
each** — a page of ten full-size phone photos would be slower than the rest
of the site put together. Licensed stock or her own; the markup to swap in
is written in a comment above the grid in `index.html`.
* [x] Professional Disclosure Statement — written, at
`site/professional-disclosure-statement.html`. Still needs her supervisor's
and the Board's sign-off before launch, and gates on OBLPCT registration
(item 1.1) like everything else. **Now write the confidentiality answer on
the FAQ page as this statement's plain-language version** — its rights
section is the source of truth for what that answer should say.
* [ ] Terms of Service — now a page, `site/terms-of-service.html`, not a PDF.
The section headings are in place and empty, and the footer links to it from
every page. Needs writing and review before launch.
* [ ] AI-free badge artwork — Ashley is making an image. Once it lands, drop
it in `site/img/`, then add one `<a class="foot-badge foot-badge--img">`
beside the Psychology Today seal in **all 11 footers** (the footer block is
duplicated per page). The `--img` style sizes it to 56px tall automatically.
* [ ] Portrait photograph **← longest lead time. Book a photographer this week.**
This is likely the highest-return few hundred dollars in the launch.
* [ ] Social share image (1200×630) for `img/og-image.jpg`
* [ ] Session hours within Wed–Sat: ____________
* [ ] Verified first-responder crisis lines to add to the crisis bar
* [ ] Privacy Policy content
* [ ] Notice of Privacy Practices content *(required HIPAA elements — have
Justin or an attorney review)*
* [ ] Referral partners for populations she doesn't take *(see 5.3)*

### 4.2 `[ASHLEY]` Design decisions

* [ ] **Red/white/blue vs. navy.** Current build is deep navy with a brass
accent and Oregon nature imagery. Flag-adjacent palettes can read
politically and may narrow her audience, including inside departments.
Decision: ____________
* [ ] **Faith framing — in or out?** Easier to weave in now than to retrofit.
If yes, it belongs in the About voice only, never on the confidentiality
or fees pages, which need to read as pure professional disclosure.
Decision: ____________
* [ ] Logo — wanted, not yet made. Type-only is a legitimate answer and ships
faster. Decision: ____________

### 4.3 `[BOTH]` Later, not a launch blocker

* [ ] Split into counseling side and consulting/training side *(structure the
URLs now so `/consulting` drops in later without a rebuild)*
* [ ] FAQ expansion as real client questions come in

---

## 5. Policy decisions

### 5.1 `[ASHLEY]` Cancellation policy — the holdover exception

Currently 24 hours' notice or the full fee. Her audience gets mandatory
holdovers and late calls, which aren't within their control. Charging a medic
$250 because a call ran long will cost the client and their referrals — and she
knows the job well enough to make that exception credibly.

* [ ] Decision: ____________

### 5.2 `[ASHLEY]` Pricing — set the trigger now, not in a panic

$250–$500 is at the very top of the market, and she named "not getting enough
clients at that price" as a worry. Decide the fallback while calm.

* [ ] Trigger: if fewer than ____ regular clients by ____________, then
____________ *(add a lower-priced entry option, adjust the 60-minute
rate, revisit sliding scale)*
* [ ] Cash plan built on 8–12 clients/week, not 30

### 5.3 `[ASHLEY]` Referral list

She's excluding gender-affirming care, sex therapy, addiction-focused work, and
high acuity — with no referral partners named yet. Naming where you'd send
someone reads as competence; having no answer reads as a list of refusals.

* [ ] Gender-affirming care → ____________
* [ ] Sex therapy → ____________
* [ ] Addiction / higher acuity → ____________
* [ ] Adolescents beyond her scope → ____________
* [ ] Crisis / higher level of care → ____________
* [ ] Start from the OSFM clinicians list she already has

### 5.4 `[ASHLEY]` Clinical paperwork

* [ ] Informed consent, including a distinct telehealth section
* [ ] Practice policies document (fees, cancellation, communication, termination)
* [ ] Good Faith Estimate template — **required for every client**, since all
are self-pay
* [ ] Written no-secrets policy for couples and families, signed by both
* [ ] Release-of-information forms
* [ ] Safety planning protocol built for telehealth *(local crisis resources,
on-file emergency contact, decision tree when a client is at risk and
hours away)*

---

## 6. Money and back office

* [ ] `[ASHLEY]` Bookkeeping tool decided — spreadsheet for year one, or Zoho Books
free tier (free under $50K revenue). **QuickBooks ruled out on cost.**
* [ ] `[ASHLEY]` **Keep client names out of the bookkeeping file.** Deposits by
date and amount only; client detail stays in the clinical record.
* [ ] `[ASHLEY]` CPA engaged for year-end and to set the real tax set-aside rate
*(the 25% in the spreadsheet is a placeholder, not a calculation)*
* [ ] `[ASHLEY]` Quarterly estimated tax dates calendared: Apr 15, Jun 15, Sep 15, Jan 15
* [ ] `[ASHLEY]` Ask the CPA about startup costs incurred before opening —
they may need to be amortized rather than deducted in year one
* [ ] `[ASHLEY]` Home office square footage recorded for Form 8829

---

## 7. Getting found

* [ ] `[ASHLEY]` Psychology Today profile *(realistically out-refers the website
for the first six months)*
* [ ] `[ASHLEY]` First-responder-specific directories
* [ ] `[ASHLEY]` Get listed on the OSFM clinicians list
* [ ] `[ASHLEY]` Oregon AMFT directory
* [ ] `[ASHLEY]` Union and department contacts — list the specific ones she'd
approach: ____________
* [ ] `[KENNY]` Submit sitemap in Google Search Console after launch
* [ ] `[BOTH]` No analytics installed. If wanted later: Plausible or Fathom
(cookieless). **Never Meta Pixel on a therapy site.**

---

## 8. Not blockers, but don't lose them

* [ ] AMFTRB national exam — schedule
* [ ] Oregon Law & Rules exam — schedule
* [ ] Supervision log system — the monthly compliance rules are strict and a
non-compliant month credits **zero** hours toward licensure
* [ ] CE tracking for the first renewal cycle

---

## Already done ✓

* LLC registered with Oregon Secretary of State
* EIN obtained
* Business bank account opened
* Professional Disclosure Statement drafted
* OBLPCT registration submitted
* Professional will / records custodian named
* Supervisor contracted (Justin Rock, LPC/LMFT)
* Domain purchased
* Private room with a locking door, empty house during session hours
* Website built — 6 pages plus legal stubs, ready for content
* Bookkeeping spreadsheet built

---

## Questions to bring to Justin

1. Superbill structure — rendering vs. supervising provider (item 1.3)
2. Whether he requires a diagnosis in the clinical record
3. Notice of Privacy Practices review
4. His expectations for the supervision log and monthly documentation
5. Whether he's comfortable with the no-EHR / Word-and-Drive setup in writing

## Questions for the malpractice carrier's risk line

1. Superbill structure (again — a second opinion is worth having)
2. Whether telehealth-only and pre-licensed status are both covered
3. Their guidance on subpoenas and custody cases
4. Whether they want to see the informed consent and telehealth consent

## Questions for the CPA

1. Real tax set-aside rate given total household income
2. Startup cost treatment — deductible now or amortized
3. Home office deduction and Form 8829
4. Whether the single-member LLC should elect S-corp treatment later

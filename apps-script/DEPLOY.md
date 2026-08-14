# Consult form — deployment

The consult form on `contact.html` posts directly to a Google Apps Script web
app that runs inside Ashley's Google Workspace account. The submission goes
browser → Google. Netlify never sees it and no third-party form service is
involved.

Each inquiry is **emailed** to the practice inbox and **logged** to a
spreadsheet in Ashley's Drive. The email is what she acts on; the sheet exists
so a message eaten by a spam filter isn't a lost client, and so she can see
which inquiries turned into consults.

The sheet is not a dependency. If it's deleted, renamed, or misconfigured, the
email still goes out and the visitor still sees a confirmation — the failure is
recorded in the script's execution log and nowhere else.

Apps Script is covered under the Google Workspace HIPAA BAA
([Included Functionality list](https://workspace.google.com/terms/2015/1/hipaa_functionality/)),
alongside Gmail and Drive.

**The script must be created under Ashley's login, not Kenny's.** It sends mail
as its owner, and the owner is whoever creates it. If it's created on the wrong
account the notifications will come from that account instead.

---

## 1. The token — already done

Both files already carry a matching token:

```
496a954c3b1430e8fa800fd389430fdc
```

**Nothing to do here.** Do not paste `openssl rand -hex 16` into the files —
that's the command that *generates* a token, not the token itself.

The token is not a secret; it ships in the site's JavaScript and anyone can
read it. Its only job is to turn away bots that scrape endpoint URLs and POST
blindly. To rotate it, run `openssl rand -hex 16` in a terminal and paste the
**output** into `FORM_TOKEN` in *both* `Code.gs` and `main.js`.

The two must match **byte for byte, case included**. A mismatch fails silently
by design: the script accepts the submission, discards it, and the visitor sees
a success message while nothing arrives. Nothing in the UI will tell you.

## 2. Create the script (signed in as Ashley)

1. Go to <https://script.google.com> and choose **New project**.
2. Delete the placeholder `myFunction` stub.
3. Paste the full contents of `Code.gs` from this folder. The token is already
   in it — don't edit `FORM_TOKEN`.
4. Confirm `TO_ADDRESS` is the address that should receive inquiries.
5. Rename the project something recognizable — *Consult inquiry endpoint* —
   so it isn't a mystery in her Drive a year from now.
6. Save.

## 3. Create the log spreadsheet

Do this **before** deploying, so the first real inquiry has somewhere to land.

1. In the Apps Script editor, pick `createInquiryLog` from the function
   dropdown at the top.
2. Click **Run**. Authorize when prompted.
3. Open **Execution log** — it prints the new spreadsheet's URL. Open it and
   confirm the header row is there.

The function stores the spreadsheet's ID in the project's Script Properties, so
the endpoint finds it automatically. Running it a second time is harmless — it
detects the existing log and won't create a duplicate.

The sheet lands in the root of Ashley's My Drive as *Consult inquiries
(website)*. She can move it into a folder or rename it freely; the script
tracks it by ID, not by name or location. **Don't share it more widely than she
would share the inbox itself** — it holds the same information.

Columns `Status` and `Notes` are left empty for her to fill in as she works the
list. Keep those to scheduling logistics — this is an inquiry log, not part of
the clinical record.

## 4. Deploy it

1. **Deploy → New deployment**.
2. Click the gear next to *Select type* and choose **Web app**.
3. Set:
   - **Description** — `consult form v1`
   - **Execute as** — **Me (ashley@…)**
   - **Who has access** — **Anyone**
4. **Deploy**.
5. Google will ask for authorization. It will show an "unverified app" warning
   because this is a personal script rather than a published add-on — that's
   expected. Choose **Advanced → Go to [project name] (unsafe)** and allow it.
   The permissions it wants are the ability to send mail and create a
   spreadsheet as her, which is exactly what the script does.
6. Copy the **Web app URL**.

### Getting "Who has access" right — this is where it breaks

The dropdown has several options that all *sound* permissive. Only one works:

| Setting | Result |
|---|---|
| **Anyone** | ✅ Correct. Public visitors can reach it. |
| Anyone with Google Account | ❌ Visitor must be signed into *some* Google account. |
| Anyone within developingtheheart.com | ❌ Only Ashley and staff. Public gets a login page. |
| Only myself | ❌ Nobody but the owner. |

Anything but **Anyone** makes Google answer the request with a `302` redirect
to `accounts.google.com`. The browser's `fetch` can't follow a cross-origin
redirect to a page with no CORS headers, so the promise rejects and the form
shows *"Something went wrong on our end."* The form is fine; the deployment
isn't.

**Read the URL to check your work.** If it looks like

```
https://script.google.com/a/macros/developingtheheart.com/s/AKfy…/exec
                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
```

the deployment is domain-restricted and **will not work for the public**. A
correctly-deployed public web app has no `/a/macros/<domain>/` segment:

```
https://script.google.com/macros/s/AKfy…/exec
```

Editing the URL by hand does not fix it — the restriction lives on the
deployment, not the address. Redeploy with **Anyone**.

### If "Anyone" isn't in the dropdown at all

If the only choices are *Only myself* and *Anyone within
developingtheheart.com*, the script is fine — the domain has external sharing
turned off. Apps Script inherits Drive's sharing policy, and with external
sharing off Google won't let a web app be reachable by non-members, so it hides
the option rather than offering one that can't work.

Ashley is her own admin. Signed in as her at **admin.google.com**:

1. **Menu → Apps → Google Workspace → Drive and Docs → Sharing settings →
   Sharing options**.
2. Set sharing outside of developingtheheart.com to **On**.
3. Allow files to be made visible to **anyone with the link**. Apps Script keys
   off this specifically — with external sharing on but link sharing still
   restricted, *Anyone* stays greyed out.
4. While in there, turn **on** the warning prompt for sharing outside the
   domain, and leave the default for newly created files private.
5. Save.

Google allows [up to 24 hours for this to
propagate](https://knowledge.workspace.google.com/admin/drive/manage-external-sharing-for-your-organization);
in practice it's usually minutes. Sign out of the Apps Script editor and back
in before checking — the deployment dialog caches the available options.

**What this does and doesn't do.** It grants the *capability* to share
externally; it shares nothing by itself, and every existing file keeps its
current permissions. It is reversible. But it does relax a protective default
on a domain that holds clinical records, so it belongs in the notes for her
supervisor rather than being flipped quietly — which is why steps 4 and 5 are
there.

**Why this is safe.** The URL being public means anyone can POST to it, so the
script defends itself: a honeypot field, a timing check, the shared token,
strict field validation against an allowlist, CR/LF stripping, and a
per-address rate limit. It can only ever send one email to one hard-coded
address and append one row to one sheet. There is no input that makes it do
anything else.

## 5. Wire up the site

In `site/js/main.js`, in the consult form block at the bottom, set `ENDPOINT`
to the Web app URL from step 4:

```js
var ENDPOINT   = 'https://script.google.com/macros/s/AKfy…/exec';
var FORM_TOKEN = '496a954c3b1430e8fa800fd389430fdc';  // already set — leave it
```

`ENDPOINT` is the only line to change. Commit and deploy to Netlify as usual.

**Sanity check before you commit:** paste the URL into a private/incognito
window, where you aren't signed into Google. You should see
`{"ok":true,"service":"consult-inquiry"}`. If you get a sign-in page, go back
to step 4 — a normal window will fool you here, because you *are* signed in.

## 6. Test it

Before launch, and again after any redeploy of the script:

- [ ] Open the web app URL **in a private/incognito window**. You should see
      `{"ok":true,...}` including `"tokenFingerprint":"496a…0fdc"` and the
      current `version`. A sign-in page means the deployment's access is
      restricted; an error page means it isn't live. Testing while signed in
      proves nothing — your visitors won't be.
- [ ] Confirm `tokenFingerprint` matches the token in `main.js`. If it doesn't,
      stop here — every submission will be silently discarded.
- [ ] Submit the real form. The button should read *Sending…*, then the form
      should be replaced by the confirmation panel. **No mail app should open.**
- [ ] Confirm the email lands at `connect@`, and that hitting reply addresses
      the inquirer rather than the script.
- [ ] Confirm a matching row appeared in the log spreadsheet, with a readable
      timestamp in column A.
- [ ] Submit with a malformed email — you should get an inline error, not a
      silent failure.
- [ ] Submit the same address four times in an hour — the fourth should be
      rate-limited.
- [ ] Test on a phone, and on a machine with no mail client configured. This is
      the case the old `mailto:` form failed silently on.

## Redeploying after a change

Editing `Code.gs` does **not** update the live endpoint. You have to go
**Deploy → Manage deployments → (pencil icon) → Version: New version → Deploy**.
Doing it this way keeps the same URL. Creating a *new deployment* instead issues
a different URL and the site will keep posting to the old one.

Bump the `VERSION` string at the top of `Code.gs` when you change anything real.
Then load the health check URL and confirm the new value came back — that is the
only way to be certain the code you are reading is the code that is running.

## Troubleshooting

Work from the symptom — the two failure modes look nothing alike.

### The form shows "Something went wrong on our end"

The browser could not reach the endpoint at all. In order of likelihood:

1. **Access isn't set to *Anyone*.** By far the most common cause. Open the URL
   in a private window; a sign-in page confirms it. See step 4. If *Anyone*
   isn't even offered, it's the Drive sharing policy — see step 4's
   "If *Anyone* isn't in the dropdown at all".
2. **The URL has `/a/macros/<domain>/` in it.** Domain-restricted deployment.
   Redeploy with *Anyone*; don't hand-edit the address.
3. **`ENDPOINT` in `main.js` is wrong or still the placeholder.**
4. **The deployment was deleted or never created.** Check
   **Deploy → Manage deployments**.

The browser console on `contact.html` will confirm it — a CORS or network error
on `script.google.com` means the request never got a usable answer.

### The form says thank you, but nothing arrives

Delivery is broken *behind* a working endpoint. This is the dangerous one: it
looks fine to everybody and inquiries vanish.

**Open the health check URL first.** It reports what is actually deployed:

```json
{"ok":true,"service":"consult-inquiry","version":"v2-2026-08-14",
 "tokenFingerprint":"496a…0fdc"}
```

- **`tokenFingerprint` is not `496a…0fdc`** → the deployed script has a
  different token than `main.js` sends. Every submission is being discarded.
  Fix `FORM_TOKEN` in `Code.gs` and push a new version.
- **`version` is older than the `VERSION` line in your local `Code.gs`** → you
  edited the file but never redeployed. Saving does not update the live
  endpoint. See *Redeploying* below.
- **No `version` field at all** → the deployment predates v2 entirely.

Then check **Executions** in the Apps Script editor. Since v2, every discarded
submission writes a warning saying exactly which check caught it, including a
`TOKEN MISMATCH` line that prints both the expected and received values. Every
delivered inquiry writes `INQUIRY DELIVERED` with the name and email.

If **Executions is empty** but the endpoint plainly works, you are looking at
the wrong script project or the wrong Google account. The deployment that
`main.js` points at lives in somebody's Drive — open *that* project, not a copy
of it. This is easy to get wrong when the script was drafted on one account and
deployed on another.

Remaining causes, once the above are ruled out:

- **`MailApp` quota exhausted** — unlikely at this volume, visible in
  **Executions** as a failed run.
- **The email is being delivered but filtered.** Check spam, and check that
  `TO_ADDRESS` is an address that actually receives mail.

### Email arrives but the sheet stays empty

That's the isolation working as designed — only the append failed. Look for
`inquiry emailed but not logged` in **Executions**. Usual causes: the
spreadsheet was trashed or moved, or its tab was renamed off `Inquiries`.
Running `createInquiryLog()` again provisions a fresh one.

## Retention

The log accumulates. Inquiries from people who never became clients don't need
to be kept forever, and holding them indefinitely is a liability with no
upside. Ashley should decide a retention window — many practices purge
non-client inquiries after a year — and put a recurring reminder on it. Worth
settling before launch rather than after there's a year of rows in it.

## Quotas

Consumer Gmail allows roughly 100 script-sent emails a day; Workspace accounts
1,500. At the volume this practice expects, this will never be the limiting
factor.

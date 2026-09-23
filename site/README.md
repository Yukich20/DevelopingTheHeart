# Developing The Heart — website

Static site. No build step, no dependencies. Open `index.html` in a browser,
or drag this whole folder onto Netlify to deploy.

## Before launch — find & replace

Search the folder for each token and replace everywhere:

| Token | Replace with | Appears |
|---|---|---|
| `{{THERAPIST_NAME}}` | Her full name as published | 9 pages (footer) |
| `{{REG_NUMBER}}` | OBLPCT associate registration number | 9 pages (footer) |

## The consult form

Every "Book a consult" link points at `contact.html`, which carries the inquiry
form. The form POSTs directly to a Google Apps Script web app running inside the
practice's own Workspace account — source in `../apps-script/Code.gs`, deployment
steps in `../apps-script/DEPLOY.md`. The script emails each inquiry to the
practice inbox and appends a row to a log spreadsheet in Ashley's Drive.

The request never touches Netlify and no third-party form service is involved,
which is what keeps the whole path inside the Google Workspace BAA. If the POST
fails, the visitor is shown the practice email address and told to write
directly, so there is always a fallback.

Two things must stay in sync or real inquiries are silently discarded:
`FORM_TOKEN` in `js/main.js` and `FORM_TOKEN` in `Code.gs`. Editing `Code.gs`
does not change the live endpoint until you push a new version from the Apps
Script editor (Deploy → Manage deployments → pencil → New version).

## Fonts

Headings use **Cormorant Garamond** (loaded from Google Fonts). Body text uses
**Book Antiqua**, which is a licensed system font, not a webfont — there is no
legal way to serve it. It renders on Windows and on Macs with MS Office
installed. Everywhere else (iPhone, Android, most Linux) the browser falls back
down the stack in `--body`: Palatino first, which is the same typeface design
under a different name, then Georgia. Roughly half of visitors will be on a
phone and will see Palatino or Georgia rather than Book Antiqua. If that matters,
the fix is to license a Palatino webfont or pick a Google-hosted serif instead.

In VS Code: Ctrl+Shift+H, enter the token, enter the value, "Replace All".

## Before launch — content

- [ ] Portrait photo → `img/portrait.jpg`, then replace the `.portrait .ph`
      placeholder div in `about.html` with `<img src="/img/portrait.jpg" alt="...">`
- [ ] Social share image → `img/og-image.jpg` (1200×630)
- [ ] Professional Disclosure Statement → write the content into
      `professional-disclosure-statement.html`. It is now a page on the site
      rather than a PDF download; the footer links to it from every page and the
      section headings are already in place, awaiting the text.
- [ ] Finish the About paragraphs (marked `[Placeholder]`)
- [ ] Add referral partners on `about.html`
- [ ] Complete `privacy-policy.html` and `notice-of-privacy-practices.html`
- [ ] Add verified first-responder crisis lines (appears in the crisis bar on every page)
- [ ] Decide the cancellation-policy exception noted on `fees.html`
- [ ] Confirm session hours within Wed–Sat

## Private preview (current state)

The site is deployed to a temporary `*.netlify.app` URL and sits behind a
password prompt, so Ashley can review it before the Board approves her
registration without anything being publicly reachable under her name.

The wall is `../netlify/edge-functions/auth.js`, wired up by the
`[[edge_functions]]` block in `../netlify.toml`. Credentials come from two
environment variables set in the Netlify UI — `PREVIEW_USER` and `PREVIEW_PASS`.
If either is missing the site returns 503 rather than serving; the failure mode
is deliberately closed.

The consult form still works from behind the wall, because it POSTs to
script.google.com rather than to Netlify. Test submissions therefore land in the
real inbox and the real log sheet — use an obvious fake name and delete the rows
afterward.

## At launch — flip these switches

The site is currently invisible to search engines *and* to the public, on
purpose. Do none of this until the Board has approved her registration.

1. Delete this line from every page:
   `<meta name="robots" content="noindex, nofollow">`
2. In `robots.txt`, delete the `Disallow: /` line.
3. Delete `../netlify/edge-functions/auth.js` and the `[[edge_functions]]`
   block in `../netlify.toml`, then deploy. That removes the password wall.

## Deploy

1. Netlify → Add new site → Import from Git → `Kenny-Yukich/Hart`
2. Leave the build settings alone — `netlify.toml` sets `publish = "site"` and
   there is no build command
3. Set `PREVIEW_USER` and `PREVIEW_PASS` under Site configuration →
   Environment variables, then trigger a deploy
4. When launching: Netlify → Domain management → add `developingtheheart.com`,
   then follow Netlify's DNS instructions at GoDaddy — the nameserver change is
   cleanest. Allow up to 48 hours for DNS.

`_headers` sets security headers automatically on Netlify. Nothing to configure.

## After launch

- Submit `sitemap.xml` in Google Search Console
- Google Business Profile as a **service-area business, address hidden**
- No analytics is installed. If she wants any, use Plausible or Fathom —
  cookieless and no personal data. Never Meta Pixel on a therapy site.

## Structure

```
├── index.html              home
├── about.html              her story, approach, fit
├── beyond-the-uniform.html who she works with, lived experience, crisis lines
├── fees.html               rates, session lengths, GFE
├── telehealth.html         how it works + FAQ
├── contact.html            book a consultation — inquiry form, email, availability
├── privacy-policy.html     stub — needs content
├── notice-of-privacy-practices.html   stub — needs content
├── 404.html
├── css/style.css           all styling; palette in :root at the top
├── js/main.js              mobile menu + scroll reveals
├── img/favicon.svg
├── robots.txt              blocks crawlers until launch
├── sitemap.xml
└── _headers                Netlify security headers
```

To change the entire color scheme, edit the `:root` block at the top of
`css/style.css`. Everything else references those variables.

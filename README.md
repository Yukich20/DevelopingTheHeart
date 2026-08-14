# Developing The Heart — website

Static site. No build step, no dependencies. Open `index.html` in a browser,
or drag this whole folder onto Netlify to deploy.

## Before launch — find & replace

Search the folder for each token and replace everywhere:

| Token | Replace with | Appears |
|---|---|---|
| `{{THERAPIST_NAME}}` | Her full name as published | 9 pages (footer) |
| `{{BOOKING_URL}}` | Google Calendar appointment schedule link | 13 places |
| `{{REG_NUMBER}}` | OBLPCT associate registration number | 9 pages (footer) |

In VS Code: Ctrl+Shift+H, enter the token, enter the value, "Replace All".

## Before launch — content

- [ ] Portrait photo → `img/portrait.jpg`, then replace the `.portrait .ph`
      placeholder div in `about.html` with `<img src="/img/portrait.jpg" alt="...">`
- [ ] Social share image → `img/og-image.jpg` (1200×630)
- [ ] Professional Disclosure Statement → `docs/professional-disclosure-statement.pdf`
      (currently linked in the footer but the file does not exist yet)
- [ ] Finish the About paragraphs (marked `[Placeholder]`)
- [ ] Add referral partners on `about.html`
- [ ] Complete `privacy-policy.html` and `notice-of-privacy-practices.html`
- [ ] Add verified first-responder crisis lines (appears in the crisis bar on every page)
- [ ] Decide the cancellation-policy exception noted on `fees.html`
- [ ] Confirm session hours within Wed–Sat

## At launch — flip these two switches

The site is currently invisible to search engines on purpose.

1. Delete this line from every page:
   `<meta name="robots" content="noindex, nofollow">`
2. In `robots.txt`, delete the `Disallow: /` line.

Do not do either until the Board has approved her registration.

## Deploy

1. Drag this folder onto https://app.netlify.com/drop (or connect a GitHub repo)
2. Netlify → Domain management → add `developingtheheart.com`
3. Follow Netlify's DNS instructions at GoDaddy — nameserver change is cleanest
4. Allow up to 48 hours for DNS. Do this early, pointed at a holding page.

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
├── confidentiality.html    the ledger + FAQ
├── fees.html               rates, session lengths, GFE
├── telehealth.html         how it works + FAQ
├── contact.html            booking, phone, email
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

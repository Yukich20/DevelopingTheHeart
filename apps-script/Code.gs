/**
 * Developing The Heart Counseling & Consulting LLC
 * Consult inquiry endpoint
 *
 * This script runs inside Ashley's Google Workspace account and receives the
 * consult form from developingtheheart.com. The browser POSTs directly here —
 * the data never passes through Netlify or any third party.
 *
 * Each inquiry is emailed to the practice inbox and appended to a log
 * spreadsheet in Ashley's Drive. The email is what she acts on; the sheet is a
 * backstop so a message lost to a spam filter is not a lost client, and a place
 * to track which inquiries turned into consults.
 *
 * The sheet is deliberately NOT a dependency. If the append fails for any
 * reason, the email has already gone out and the visitor still sees success.
 *
 * Apps Script is covered under the Google Workspace HIPAA BAA:
 * https://workspace.google.com/terms/2015/1/hipaa_functionality/
 *
 * Deployment instructions: see DEPLOY.md
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Bumped by hand whenever this file changes. Reported by the health check, so
 * you can tell from a browser which build is actually deployed — editing
 * Code.gs does NOT update the live endpoint until you push a new version, and
 * that gap has already cost one debugging session.
 */
var VERSION = 'v7-2026-09-02';

/** Where inquiries are delivered. */
var TO_ADDRESS = 'ashley@developingtheheart.com';

/** Name shown as the sender on the notification email. */
var FROM_NAME = 'Developing The Heart website';

/** Filename of the log spreadsheet created in Ashley's Drive. */
var SHEET_NAME = 'Consult inquiries (website)';

/** Script Property holding the log spreadsheet's ID. Set by createInquiryLog(). */
var SHEET_ID_KEY = 'INQUIRY_SHEET_ID';

/** Timezone for timestamps in the email and the log. */
var TIMEZONE = 'America/Los_Angeles';

var SHEET_HEADERS = [
  'Received', 'First name', 'Last name', 'Email', 'Phone',
  'Interested in', 'Flagged', 'Status', 'Notes'
];

/**
 * Shared token. Must match FORM_TOKEN in site/js/main.js.
 * This is visible in the site's source — it is not a secret. It exists only to
 * turn away bots that scrape endpoint URLs and POST blindly. Real abuse
 * resistance comes from the honeypot, the timing check, and the rate limit.
 * Regenerate it (and update main.js) if the endpoint starts attracting junk.
 */
var FORM_TOKEN = '496a954c3b1430e8fa800fd389430fdc';

/**
 * Below this, a submission is flagged as possible spam — never discarded.
 * Autofill lets a real person finish in about a second, so this threshold is a
 * hint, not a verdict.
 */
var MIN_FILL_MS = 3000;

/** Same address cannot submit more than this many times per hour. */
var MAX_PER_HOUR = 3;

/** Must match the <option> values in contact.html exactly. */
var INTERESTS = [
  'Individual therapy',
  'Couples therapy',
  'Family therapy'
];

var MAX_LEN = {
  firstName: 80,
  lastName: 80,
  email: 254,
  phone: 40,
  interest: 60
};

// --- Speaking engagement requests (site/speaking.html) ----------------------

/** Filename of the speaking-request log. Separate from the consult inquiry log:
 *  these are different things and mixing them makes both harder to read. */
var SPEAKING_SHEET_NAME = 'Speaking requests (website)';

/** Script Property holding the speaking log's ID. Set by createSpeakingLog(). */
var SPEAKING_SHEET_ID_KEY = 'SPEAKING_SHEET_ID';

var SPEAKING_HEADERS = [
  'Received', 'First name', 'Last name', 'Organization', 'Role',
  'Email', 'Phone', 'Format', 'Topics', 'Date', 'Length', 'Location',
  'Audience', 'Budget', 'Details', 'Heard via', 'Flagged', 'Status', 'Notes'
];

var SPEAKING_MAX_LEN = {
  firstName: 80,
  lastName: 80,
  organization: 140,
  role: 120,
  email: 254,
  phone: 40,
  format: 60,
  topics: 500,
  eventDate: 120,
  length: 80,
  location: 180,
  audience: 180,
  budget: 60,
  details: 4000,
  referral: 180
};

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

/**
 * Health check. Lets you confirm the deployment is live by opening the web app
 * URL in a browser. Returns no data and accepts no input.
 */
function doGet() {
  return json({
    ok: true,
    service: 'consult-inquiry',
    version: VERSION,
    // If `routes` is missing from this response, the live deployment predates
    // the speaking request form and speaking.html submissions will be rejected.
    // Push a new version to fix it.
    routes: ['consult', 'speaking'],
    tokenFingerprint: FORM_TOKEN.slice(0, 4) + '…' + FORM_TOKEN.slice(-4),
    deliversTo: TO_ADDRESS,
    mailQuotaRemaining: MailApp.getRemainingDailyQuota()
  });
}

/**
 * RUN THIS FROM THE EDITOR when mail isn't arriving.
 *
 * Sends one message to TO_ADDRESS and reports the mail quota. It answers the
 * question the execution log cannot: MailApp accepts any well-formed address
 * without complaint, so "the script sent it" and "a mailbox received it" are
 * different claims. If this lands, the pipeline is fine. If it doesn't, the
 * address has no mailbox behind it and a bounce is sitting in the inbox of
 * whoever owns this script.
 */
function sendTestEmail() {
  var quota = MailApp.getRemainingDailyQuota();
  console.log('Mail quota remaining before send: ' + quota);

  if (quota < 1) {
    console.error('QUOTA EXHAUSTED — this account cannot send mail right now.');
    return;
  }

  MailApp.sendEmail({
    to: TO_ADDRESS,
    name: FROM_NAME,
    subject: 'Test from the consult form endpoint (' + VERSION + ')',
    body: [
      'If you are reading this, mail delivery from the script works and the',
      'address below is real:',
      '',
      '  ' + TO_ADDRESS,
      '',
      'If you are NOT reading this, that address has no mailbox behind it.',
      'Check the inbox of the account that owns this script for a bounce from',
      'Mail Delivery Subsystem, and confirm the address exists in the Admin',
      'console under Directory > Users (or as a group, or as an alias).'
    ].join('\n')
  });

  console.log('Test message handed to MailApp for: ' + TO_ADDRESS);
  console.log('Handed off successfully does NOT mean delivered. Check the ' +
    'inbox, and check spam.');
}

/**
 * Receives the consult form.
 *
 * The client sends a JSON string with no custom headers, which keeps the
 * request CORS-"simple" and avoids a preflight that Apps Script cannot answer.
 * That means the body arrives as text/plain and must be parsed by hand.
 */
function doPost(e) {
  try {
    var data = parseBody(e);
    if (!data) {
      return json({ ok: false, error: 'bad_request' });
    }

    // --- Bot checks. All three return ok:true so a bot learns nothing from ---
    // --- the response about why it was turned away. But every rejection is ---
    // --- LOUD in the execution log, because the difference between "a bot  ---
    // --- was blocked" and "the config is broken and real inquiries are     ---
    // --- silently vanishing" is invisible from the outside otherwise.      ---

    // 1. Honeypot: a field hidden from real users. Anything in it is a bot.
    //    The field is named to match no browser autofill heuristic — an
    //    earlier version called it `company`, which Chrome filled from the
    //    visitor's address profile and got real people classified as bots.
    if (String(data.dthRef2 || '').length > 0) {
      return rejected('honeypot filled — almost certainly a bot');
    }

    // 2. Timing. Suspicious, NOT disqualifying.
    //
    //    A bot submits instantly, but so does a person whose browser autofills
    //    the whole form in one click. Getting this wrong costs a prospective
    //    client, so a fast submission is delivered and flagged rather than
    //    discarded — Ashley can judge it in two seconds, and nothing is lost
    //    to a threshold guess made months earlier.
    var elapsed = Number(data.elapsed);
    var suspiciouslyFast = !isFinite(elapsed) || elapsed < MIN_FILL_MS;
    if (suspiciouslyFast) {
      console.warn('FLAGGED, NOT DISCARDED: submitted in ' + elapsed +
        'ms, under the ' + MIN_FILL_MS + 'ms minimum. Delivering anyway with ' +
        'a flagged subject line.');
    }

    // 3. Shared token.
    if (String(data.token || '') !== FORM_TOKEN) {
      return rejected(
        'TOKEN MISMATCH — this is a configuration error, not a bot. ' +
        'The site sent "' + String(data.token || '(nothing)') + '" but this ' +
        'script expects "' + FORM_TOKEN + '". A real inquiry was just ' +
        'discarded. Make FORM_TOKEN identical in Code.gs and main.js, then ' +
        'redeploy (Deploy > Manage deployments > pencil > New version).'
      );
    }

    // --- Route. --------------------------------------------------------- ---
    // --- The speaking request form shares this endpoint, the token and all ---
    // --- three bot checks above, but nothing below them: its fields are    ---
    // --- different. An older deployment that predates this branch falls    ---
    // --- through and reads the request as a consult inquiry, rejecting it  ---
    // --- on a field the form does not have — which is the symptom to look  ---
    // --- for if the site says a request failed to send.                    ---
    if (String(data.formType || '') === 'speaking') {
      return handleSpeaking(data, suspiciouslyFast);
    }

    // --- Validation. These DO report failure — a real person mistyping ---
    // --- their email deserves to be told.                              ---

    var firstName = clean(data.firstName, MAX_LEN.firstName);
    var lastName = clean(data.lastName, MAX_LEN.lastName);
    var email = clean(data.email, MAX_LEN.email);
    var phone = clean(data.phone, MAX_LEN.phone);
    var interest = clean(data.interest, MAX_LEN.interest);

    if (!firstName || !lastName) {
      return json({ ok: false, error: 'name_required' });
    }
    if (!isEmail(email)) {
      return json({ ok: false, error: 'email_invalid' });
    }
    if (INTERESTS.indexOf(interest) === -1) {
      return json({ ok: false, error: 'interest_invalid' });
    }

    // --- Rate limit, keyed on the submitted address. ---
    if (overRateLimit(email)) {
      return json({ ok: false, error: 'rate_limited' });
    }

    var inquiry = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone,
      interest: interest,
      receivedAt: new Date(),
      flagged: suspiciouslyFast
    };

    // Email first. If this throws, the visitor is told it failed and can email
    // directly — which is the outcome that actually matters.
    sendNotification(inquiry);

    // Then the log. Isolated: a broken or deleted sheet must never turn a
    // delivered inquiry into an error the visitor sees.
    try {
      appendToLog(inquiry);
    } catch (logErr) {
      console.error('inquiry emailed but not logged: ' + logErr);
    }

    console.log('INQUIRY HANDED TO MAIL: ' + firstName + ' ' + lastName +
      ' <' + email + '> — ' + interest + ' | to: ' + TO_ADDRESS +
      ' | quota left: ' + MailApp.getRemainingDailyQuota() +
      ' | NOTE: accepted by MailApp is not the same as delivered to a mailbox');

    return json({ ok: true });

  } catch (err) {
    // Never leak a stack trace to the browser. Log it for the script owner.
    console.error('consult-inquiry failed: ' + err);
    return json({ ok: false, error: 'server_error' });
  }
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

function sendNotification(f) {
  var fullName = f.firstName + ' ' + f.lastName;

  var lines = [
    'New consult inquiry from developingtheheart.com',
    '',
    'Name       ' + fullName,
    'Email      ' + f.email,
    'Phone      ' + (f.phone || '(not provided)'),
    'Interested ' + f.interest,
    'Received   ' + Utilities.formatDate(
      f.receivedAt, TIMEZONE, "EEEE, MMMM d, yyyy 'at' h:mm a"
    ),
    '',
    '---',
    'Reply directly to this message to reach ' + f.firstName + '.',
    '',
    'A copy has been logged to "' + SHEET_NAME + '" in your Drive.',
    'This inbox is not a secure channel for clinical information.'
  ];

  if (f.flagged) {
    lines.splice(1, 0,
      '',
      '! This one was submitted unusually fast. That is often a bot, but it is',
      '  also what a browser autofilling the whole form looks like. It has been',
      '  delivered rather than dropped so you can judge it yourself.');
  }

  MailApp.sendEmail({
    to: TO_ADDRESS,
    replyTo: f.email,
    name: FROM_NAME,
    subject: (f.flagged ? '[possible spam] ' : '') +
      'New consult inquiry — ' + fullName,
    body: lines.join('\n')
  });
}

// ---------------------------------------------------------------------------
// Inquiry log
// ---------------------------------------------------------------------------

/**
 * RUN THIS ONCE from the Apps Script editor before deploying.
 *
 * Creates the log spreadsheet in Ashley's Drive, formats it, and remembers its
 * ID in Script Properties. Safe to run again — if a log already exists it
 * reports the existing one rather than creating a duplicate.
 *
 * Check the execution log afterwards for the spreadsheet's URL.
 */
function createInquiryLog() {
  var props = PropertiesService.getScriptProperties();
  var existing = props.getProperty(SHEET_ID_KEY);

  if (existing) {
    try {
      var found = SpreadsheetApp.openById(existing);
      console.log('Log already exists: ' + found.getUrl());
      return found.getUrl();
    } catch (err) {
      console.log('Stored log ID is unreachable, creating a new one.');
    }
  }

  var ss = SpreadsheetApp.create(SHEET_NAME);
  ss.setSpreadsheetTimeZone(TIMEZONE);

  var sheet = ss.getSheets()[0];
  sheet.setName('Inquiries');
  sheet.appendRow(SHEET_HEADERS);

  var header = sheet.getRange(1, 1, 1, SHEET_HEADERS.length);
  header.setFontWeight('bold').setBackground('#1D2E49').setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
  sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm');
  sheet.setColumnWidth(1, 140);  // Received
  sheet.setColumnWidth(4, 220);  // Email
  sheet.setColumnWidth(6, 200);  // Interested in
  sheet.setColumnWidth(8, 320);  // Notes

  props.setProperty(SHEET_ID_KEY, ss.getId());

  console.log('Created log: ' + ss.getUrl());
  return ss.getUrl();
}

/**
 * Appends one inquiry. Called inside a try/catch by doPost — throwing here
 * costs the log entry, never the email or the visitor's confirmation.
 */
function appendToLog(f) {
  var sheet = getLogSheet();
  if (!sheet) {
    throw new Error('No log sheet configured. Run createInquiryLog() once.');
  }

  // A log created before v3 has 8 columns and no "Flagged" header. Widen it in
  // place rather than making the caller migrate by hand — appendRow would
  // otherwise write the flag under an unlabelled column.
  if (sheet.getLastColumn() < SHEET_HEADERS.length) {
    sheet.getRange(1, 1, 1, SHEET_HEADERS.length)
      .setValues([SHEET_HEADERS])
      .setFontWeight('bold')
      .setBackground('#1D2E49')
      .setFontColor('#FFFFFF');
  }

  sheet.appendRow([
    f.receivedAt,
    f.firstName,
    f.lastName,
    f.email,
    f.phone || '',
    f.interest,
    f.flagged ? 'possible spam' : '',
    '',  // Status — for Ashley to fill in
    ''   // Notes  — for Ashley to fill in
  ]);
}

function getLogSheet() {
  var id = PropertiesService.getScriptProperties().getProperty(SHEET_ID_KEY);
  if (!id) {
    return null;
  }
  return SpreadsheetApp.openById(id).getSheetByName('Inquiries');
}

// ---------------------------------------------------------------------------
// Speaking engagement requests
// ---------------------------------------------------------------------------

/**
 * Handles a submission from site/speaking.html.
 *
 * Called by doPost AFTER the honeypot, timing and token checks have run, so it
 * only concerns itself with the form's own fields.
 *
 * Unlike a consult inquiry this is a business enquiry, not a clinical one: it
 * carries no health information, so it is logged in full and quoted in full in
 * the notification email.
 */
function handleSpeaking(data, suspiciouslyFast) {
  var firstName = clean(data.firstName, SPEAKING_MAX_LEN.firstName);
  var lastName = clean(data.lastName, SPEAKING_MAX_LEN.lastName);
  var email = clean(data.email, SPEAKING_MAX_LEN.email);
  var details = clean(data.details, SPEAKING_MAX_LEN.details);

  if (!firstName || !lastName) {
    return json({ ok: false, error: 'name_required' });
  }
  if (!isEmail(email)) {
    return json({ ok: false, error: 'email_invalid' });
  }
  if (!details) {
    return json({ ok: false, error: 'details_required' });
  }
  if (overRateLimit(email)) {
    return json({ ok: false, error: 'rate_limited' });
  }

  var request = {
    firstName: firstName,
    lastName: lastName,
    organization: clean(data.organization, SPEAKING_MAX_LEN.organization),
    role: clean(data.role, SPEAKING_MAX_LEN.role),
    email: email,
    phone: clean(data.phone, SPEAKING_MAX_LEN.phone),
    format: clean(data.format, SPEAKING_MAX_LEN.format),
    topics: clean(data.topics, SPEAKING_MAX_LEN.topics),
    eventDate: clean(data.eventDate, SPEAKING_MAX_LEN.eventDate),
    length: clean(data.length, SPEAKING_MAX_LEN.length),
    location: clean(data.location, SPEAKING_MAX_LEN.location),
    audience: clean(data.audience, SPEAKING_MAX_LEN.audience),
    budget: clean(data.budget, SPEAKING_MAX_LEN.budget),
    details: details,
    referral: clean(data.referral, SPEAKING_MAX_LEN.referral),
    receivedAt: new Date(),
    flagged: suspiciouslyFast
  };

  sendSpeakingNotification(request);

  try {
    appendSpeakingToLog(request);
  } catch (logErr) {
    console.error('speaking request emailed but not logged: ' + logErr);
  }

  console.log('SPEAKING REQUEST HANDED TO MAIL: ' + firstName + ' ' + lastName +
    ' <' + email + '> — ' + (request.organization || '(no org)') +
    ' | quota left: ' + MailApp.getRemainingDailyQuota());

  return json({ ok: true });
}

function sendSpeakingNotification(f) {
  var fullName = f.firstName + ' ' + f.lastName;

  var lines = [
    'New speaking engagement request from developingtheheart.com',
    '',
    'Name         ' + fullName,
    'Organization ' + (f.organization || '(not given)'),
    'Role         ' + (f.role || '(not given)'),
    'Email        ' + f.email,
    'Phone        ' + (f.phone || '(not provided)'),
    '',
    'Format       ' + (f.format || '(not specified)'),
    'Topics       ' + (f.topics || '(none selected)'),
    'Date         ' + (f.eventDate || '(not given)'),
    'Length       ' + (f.length || '(not given)'),
    'Location     ' + (f.location || '(not given)'),
    'Audience     ' + (f.audience || '(not given)'),
    'Budget       ' + (f.budget || '(not answered)'),
    'Heard via    ' + (f.referral || '(not given)'),
    'Received     ' + Utilities.formatDate(
      f.receivedAt, TIMEZONE, "EEEE, MMMM d, yyyy 'at' h:mm a"
    ),
    '',
    'About the event',
    '---------------',
    f.details,
    '',
    '---',
    'Reply directly to this message to reach ' + f.firstName + '.',
    '',
    'A copy has been logged to "' + SPEAKING_SHEET_NAME + '" in your Drive.'
  ];

  if (f.flagged) {
    lines.splice(1, 0,
      '',
      '! Submitted unusually fast. Often a bot, but also what autofill looks',
      '  like. Delivered rather than dropped so you can judge it yourself.');
  }

  MailApp.sendEmail({
    to: TO_ADDRESS,
    replyTo: f.email,
    name: FROM_NAME,
    subject: (f.flagged ? '[possible spam] ' : '') +
      'Speaking request — ' + (f.organization || fullName),
    body: lines.join('\n')
  });
}

/**
 * RUN THIS ONCE from the Apps Script editor before the speaking form goes live.
 *
 * Creates the request log in Drive and remembers its ID. Safe to run again — an
 * existing log is reported rather than duplicated. Mirrors createInquiryLog.
 */
function createSpeakingLog() {
  var props = PropertiesService.getScriptProperties();
  var existing = props.getProperty(SPEAKING_SHEET_ID_KEY);

  if (existing) {
    try {
      var found = SpreadsheetApp.openById(existing);
      console.log('Speaking log already exists: ' + found.getUrl());
      return;
    } catch (err) {
      console.warn('Stored speaking log ID no longer opens. Creating a new one.');
    }
  }

  var ss = SpreadsheetApp.create(SPEAKING_SHEET_NAME);
  var sheet = ss.getSheets()[0].setName('Requests');

  sheet.getRange(1, 1, 1, SPEAKING_HEADERS.length)
    .setValues([SPEAKING_HEADERS])
    .setFontWeight('bold')
    .setBackground('#1D2E49')
    .setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);

  props.setProperty(SPEAKING_SHEET_ID_KEY, ss.getId());
  console.log('Speaking log created: ' + ss.getUrl());
}

/**
 * Appends one request. Called inside a try/catch by handleSpeaking — throwing
 * here costs the log row, never the email or the sender's confirmation.
 */
function appendSpeakingToLog(f) {
  var sheet = getSpeakingSheet();
  if (!sheet) {
    throw new Error('No speaking log configured. Run createSpeakingLog() once.');
  }

  sheet.appendRow([
    f.receivedAt, f.firstName, f.lastName, f.organization, f.role,
    f.email, f.phone, f.format, f.topics, f.eventDate, f.length,
    f.location, f.audience, f.budget, f.details, f.referral,
    f.flagged ? 'possible spam' : '',
    '',  // Status — for Ashley to fill in
    ''   // Notes  — for Ashley to fill in
  ]);
}

function getSpeakingSheet() {
  var id = PropertiesService.getScriptProperties()
    .getProperty(SPEAKING_SHEET_ID_KEY);
  if (!id) {
    return null;
  }
  return SpreadsheetApp.openById(id).getSheetByName('Requests');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseBody(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return null;
  }
  try {
    var parsed = JSON.parse(e.postData.contents);
    return (parsed && typeof parsed === 'object') ? parsed : null;
  } catch (err) {
    return null;
  }
}

/**
 * Trims, caps length, and strips control characters. The newline stripping
 * matters: these values land in an email subject and body, and CR/LF in a
 * header field is how header injection works.
 */
function clean(value, maxLen) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLen);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/**
 * Allows MAX_PER_HOUR submissions per address per hour. Apps Script does not
 * expose the client IP, so the address is the best key available — imperfect,
 * but it stops the common case of someone double-clicking or a script looping
 * on one identity.
 */
function overRateLimit(email) {
  var cache = CacheService.getScriptCache();
  var key = 'rl_' + Utilities.base64EncodeWebSafe(email.toLowerCase());
  var count = Number(cache.get(key) || 0);

  if (count >= MAX_PER_HOUR) {
    return true;
  }
  cache.put(key, String(count + 1), 3600);
  return false;
}

/**
 * Turn a submission away without telling the caller why, while recording the
 * reason in the execution log where the script owner can see it.
 *
 * The asymmetry is the point: a bot gets a bland success and learns nothing
 * about which check caught it, but a misconfiguration announces itself loudly
 * to whoever opens Executions, instead of quietly eating real inquiries.
 */
function rejected(reason) {
  console.warn('SUBMISSION DISCARDED: ' + reason);
  return json({ ok: true });
}

function json(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

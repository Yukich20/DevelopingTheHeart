(function () {
  var btn = document.querySelector('.nav-toggle');
  var menu = document.getElementById('menu');
  if (btn && menu) {
    btn.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rv = document.querySelectorAll('.rv');
  if (reduce || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(rv, function (n) { n.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (es, o) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); o.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    Array.prototype.forEach.call(rv, function (n) { io.observe(n); });
  }
})();

/* ---------------------------------------------------------------------------
   Consult form
   ---------------------------------------------------------------------------
   Posts straight to a Google Apps Script web app running inside the practice's
   Workspace account (source: apps-script/Code.gs). Nothing touches Netlify and
   nothing is stored — the script emails the inquiry and discards it.

   The request is deliberately shaped as a CORS-"simple" request: a plain
   string body and NO custom headers, so the browser skips the preflight that
   Apps Script cannot answer. Setting Content-Type here would break it.
--------------------------------------------------------------------------- */
(function () {
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbyKibEN4RTD2kqmyAWnKXdlKpBCRqFnfSoCSc4dcm8m3T2zulapDjGl5EhEngRCd-8/exec';
  var FORM_TOKEN = '496a954c3b1430e8fa800fd389430fdc'; // must match Code.gs
  var FALLBACK = 'ashley@developingtheheart.com';

  var form = document.getElementById('consult-form');
  if (!form) { return; }

  var btn = document.getElementById('consult-submit');
  var errorBox = document.getElementById('consult-error');
  var done = document.getElementById('consult-done');
  var loadedAt = Date.now();
  var sending = false;

  var MESSAGES = {
    email_invalid: 'That email address doesn’t look quite right — please check it and try again.',
    name_required: 'Please include both your first and last name.',
    rate_limited: 'It looks like this was already sent. If you haven’t heard back within two business days, please email ' + FALLBACK + ' directly.',
    fallback: 'Something went wrong on our end and your note didn’t send. Please email ' + FALLBACK + ' directly and I’ll get right back to you.'
  };

  function showError(key) {
    if (!errorBox) { return; }
    errorBox.textContent = MESSAGES[key] || MESSAGES.fallback;
    errorBox.hidden = false;
  }

  function clearError() {
    if (errorBox) { errorBox.hidden = true; errorBox.textContent = ''; }
  }

  function setBusy(on) {
    sending = on;
    if (!btn) { return; }
    btn.disabled = on;
    btn.textContent = on ? 'Sending…' : 'Let’s connect';
  }

  function succeed() {
    form.hidden = true;
    if (done) {
      done.hidden = false;
      // Move focus so screen readers land on the confirmation, not nowhere.
      done.focus();
    }
  }

  function value(name) {
    var el = form.elements[name];
    return el ? el.value : '';
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (sending) { return; }

    // Native constraint validation still runs before this fires for a real
    // submit, but a stray programmatic call should not slip past it.
    if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
      form.reportValidity();
      return;
    }

    clearError();
    setBusy(true);

    var payload = {
      firstName: value('firstName'),
      lastName: value('lastName'),
      email: value('email'),
      phone: value('phone'),
      interest: value('interest'),
      dthRef2: value('dthRef2'),        // honeypot — see contact.html
      elapsed: Date.now() - loadedAt,   // timing check
      token: FORM_TOKEN
    };

    fetch(ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(payload)     // no headers — keeps it preflight-free
    })
      .then(function (res) {
        if (!res.ok) { throw new Error('HTTP ' + res.status); }
        return res.json();
      })
      .then(function (data) {
        if (data && data.ok) {
          succeed();
        } else {
          setBusy(false);
          showError(data && data.error);
        }
      })
      .catch(function () {
        setBusy(false);
        showError('fallback');
      });
  });
})();

/* ---------------------------------------------------------------------------
   Speaking engagement requests
   ---------------------------------------------------------------------------
   Same transport as the consult form above — a preflight-free POST to the same
   Apps Script web app — but tagged `formType: 'speaking'` so the script routes
   it to the speaking handler instead of the consult one.

   IMPORTANT: the deployed script must be running a build that knows about
   `formType`. An older deployment ignores it, reads the submission as a consult
   inquiry, and rejects it on a field this form does not have. See
   apps-script/Code.gs, and open-items.md item 3.6 for the deploy steps.
--------------------------------------------------------------------------- */
(function () {
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbyKibEN4RTD2kqmyAWnKXdlKpBCRqFnfSoCSc4dcm8m3T2zulapDjGl5EhEngRCd-8/exec';
  var FORM_TOKEN = '496a954c3b1430e8fa800fd389430fdc'; // must match Code.gs
  var FALLBACK = 'ashley@developingtheheart.com';

  var form = document.getElementById('speaking-form');
  if (!form) { return; }

  var btn = document.getElementById('speaking-submit');
  var errorBox = document.getElementById('speaking-error');
  var done = document.getElementById('speaking-done');
  var loadedAt = Date.now();
  var sending = false;

  var MESSAGES = {
    name_required: 'Please include both your first and last name.',
    email_invalid: 'That email address doesn’t look quite right — please check it and try again.',
    details_required: 'Please tell me a little about the event before sending.',
    rate_limited: 'It looks like this was already sent. If you haven’t heard back within two business days, please email ' + FALLBACK + ' directly.',
    fallback: 'Something went wrong on our end and your request didn’t send. Please email ' + FALLBACK + ' directly and I’ll get right back to you.'
  };

  function showError(key) {
    if (!errorBox) { return; }
    errorBox.textContent = MESSAGES[key] || MESSAGES.fallback;
    errorBox.hidden = false;
  }

  function clearError() {
    if (errorBox) { errorBox.hidden = true; errorBox.textContent = ''; }
  }

  function setBusy(on) {
    sending = on;
    if (!btn) { return; }
    btn.disabled = on;
    btn.textContent = on ? 'Sending…' : 'Send request';
  }

  function value(name) {
    var el = form.elements[name];
    return el ? el.value : '';
  }

  /* form.elements[name] on a radio group is a RadioNodeList whose .value is ''
     when nothing is chosen — which is what we want for an unanswered optional
     question. */
  function choice(name) {
    var el = form.elements[name];
    return el && el.value ? el.value : '';
  }

  /* Checkbox groups need collecting by hand: RadioNodeList.value reports only
     the first checked box, which would silently drop every topic after the
     first one. */
  function checked(name) {
    var out = [];
    Array.prototype.forEach.call(
      form.querySelectorAll('input[name="' + name + '"]:checked'),
      function (b) { out.push(b.value); }
    );
    return out.join(', ');
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (sending) { return; }

    if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
      form.reportValidity();
      return;
    }

    clearError();
    setBusy(true);

    var payload = {
      formType: 'speaking',
      firstName: value('firstName'),
      lastName: value('lastName'),
      organization: value('organization'),
      role: value('role'),
      email: value('email'),
      phone: value('phone'),
      format: choice('format'),
      topics: checked('topics'),
      eventDate: value('eventDate'),
      length: value('length'),
      location: value('location'),
      audience: value('audience'),
      budget: choice('budget'),
      details: value('details'),
      referral: value('referral'),
      dthRef2: value('dthRef2'),        // honeypot — see speaking.html
      elapsed: Date.now() - loadedAt,   // timing check
      token: FORM_TOKEN
    };

    fetch(ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(payload)     // no headers — keeps it preflight-free
    })
      .then(function (res) {
        if (!res.ok) { throw new Error('HTTP ' + res.status); }
        return res.json();
      })
      .then(function (data) {
        if (data && data.ok) {
          form.hidden = true;
          if (done) { done.hidden = false; done.focus(); }
        } else {
          setBusy(false);
          showError(data && data.error);
        }
      })
      .catch(function () {
        setBusy(false);
        showError('fallback');
      });
  });
})();

/* ---------------------------------------------------------------------------
   Phone number formatting
   ---------------------------------------------------------------------------
   Formats a US number as it is typed: the parentheses appear once three digits
   are in, then the dash at seven. Applied to every tel input on the site, so it
   covers the consult form and any later one without further wiring.

   The fiddly parts are the two things that make hand-rolled formatters annoying
   to use, both handled below: backspacing over a bracket or dash must delete the
   digit rather than sit there re-inserting the punctuation, and the caret must
   stay where the typist expects when they edit the middle of a number.
--------------------------------------------------------------------------- */
(function () {
  var fields = document.querySelectorAll('input[type="tel"]');
  if (!fields.length) { return; }

  function digits(s) { return (s || '').replace(/\D/g, ''); }

  function format(d) {
    if (d.length <= 2) { return d; }
    if (d.length === 3) { return '(' + d + ') '; }
    if (d.length <= 6) { return '(' + d.slice(0, 3) + ') ' + d.slice(3); }
    return '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
  }

  Array.prototype.forEach.call(fields, function (input) {
    var previous = digits(input.value);

    input.addEventListener('input', function (ev) {
      var raw = input.value;
      var caret = input.selectionStart;
      var deleting = ev.inputType && ev.inputType.indexOf('delete') === 0;

      var d = digits(raw).slice(0, 10);

      /* Deleting a bracket, space or dash leaves the digits untouched, so the
         reformat below would put the character straight back and the caret
         would appear stuck. Take a digit instead — which is what the person
         pressing backspace meant. */
      if (deleting && d === previous) { d = d.slice(0, -1); }

      var before = digits(raw.slice(0, caret)).length;
      if (before > d.length) { before = d.length; }

      var out = format(d);
      input.value = out;
      previous = d;

      /* Restore the caret after the same digit it followed. Typing at the end —
         the overwhelmingly common case — just goes to the end, which keeps it
         clear of the trailing ") ". */
      var pos;
      if (before === 0) {
        pos = 0;
      } else if (before === d.length) {
        pos = out.length;
      } else {
        pos = out.length;
        for (var i = 0, seen = 0; i < out.length; i++) {
          if (/\d/.test(out.charAt(i))) {
            seen++;
            if (seen === before) { pos = i + 1; break; }
          }
        }
      }
      try { input.setSelectionRange(pos, pos); } catch (err) { /* older browsers */ }
    });
  });
})();

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

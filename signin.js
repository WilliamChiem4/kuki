/* signin.js — front-end mock for the Sign In page.
   No backend exists, so this validates the fields and shows a placeholder
   "code sent" confirmation. Modeled on the promo handler in checkout.js. */
(function () {
  'use strict';

  var form = document.getElementById('signin-form');
  var feedback = document.getElementById('signin-feedback');
  if (!form || !feedback) return;

  var nameInput = document.getElementById('signin-name');
  var phoneInput = document.getElementById('signin-phone');
  var submitBtn = form.querySelector('.signin__submit');

  // Translate via KukiI18n when present (it loads before this script).
  function tr(key, vars) { return window.KukiI18n ? window.KukiI18n.t(key, vars) : key; }

  function setFeedback(message, state) {
    feedback.textContent = message;
    feedback.className = 'signin__feedback' + (state ? ' is-' + state : '');
  }

  function digits(value) {
    return (value || '').replace(/\D/g, '');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var name = nameInput.value.trim();
    var phoneDigits = digits(phoneInput.value);

    if (!name) {
      setFeedback(tr('signin.errName'), 'err');
      nameInput.focus();
      return;
    }
    if (phoneDigits.length < 10) {
      setFeedback(tr('signin.errPhone'), 'err');
      phoneInput.focus();
      return;
    }

    setFeedback(tr('signin.codeSent', { phone: phoneInput.value.trim() }), 'ok');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = tr('signin.sent');
    }
  });

  // Clear an error as soon as the user edits a field.
  [nameInput, phoneInput].forEach(function (input) {
    input.addEventListener('input', function () {
      if (feedback.classList.contains('is-err')) setFeedback('');
    });
  });

  // Swap the art image to its fallback if the primary source fails to load.
  var art = document.querySelector('.signin__art img');
  if (art && art.dataset.fallback) {
    art.addEventListener('error', function onError() {
      art.removeEventListener('error', onError);
      art.src = art.dataset.fallback;
    });
  }
})();

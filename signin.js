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
      setFeedback('Please enter your first and last name.', 'err');
      nameInput.focus();
      return;
    }
    if (phoneDigits.length < 10) {
      setFeedback('Please enter a valid mobile phone number.', 'err');
      phoneInput.focus();
      return;
    }

    setFeedback('Confirmation code sent to ' + phoneInput.value.trim() +
      '. (Demo — no SMS is actually sent.)', 'ok');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Code Sent';
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

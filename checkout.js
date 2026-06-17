/* ============================================================
   KUKI — checkout page logic
   Requires cart.js (window.KukiCart). Renders the order review,
   summary, extras, and the in-page confirmation.
   ============================================================ */
(() => {
  'use strict';
  if (!window.KukiCart) return;

  const Cart = window.KukiCart;
  const fmt = Cart.formatPrice;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel) => document.querySelector(sel);
  // Translate via KukiI18n when present (it loads before this script).
  const tr = (k, vars) => (window.KukiI18n ? window.KukiI18n.t(k, vars) : k);

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const ICON = {
    minus: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 8h9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>',
    plus: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>',
    trash: '<svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3.5 5h11M7.5 5V3.8a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1V5m3 0-.6 8.6a1.4 1.4 0 0 1-1.4 1.3H6a1.4 1.4 0 0 1-1.4-1.3L4 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  /* ---- DOM refs -------------------------------------------- */
  const listEl = $('#checkout-list');
  const addonRow = $('#addon-row');
  const addonTrack = $('#addon-track');
  const barEl = $('#checkout-bar');
  const confirmEl = $('#confirm');
  const promoForm = $('#promo-form');
  const promoInput = $('#promo-input');
  const promoFeedback = $('#promo-feedback');
  const checkoutSection = document.querySelector('.checkout');

  let pendingPromoMsg = null; // transient (e.g. invalid-code) feedback

  /* ---- Helpers --------------------------------------------- */
  function imgAttrs(item, size) {
    if (!item.img) return '';
    return `<img src="${esc(item.img)}"${item.fallback ? ` data-fallback="${esc(item.fallback)}"` : ''} alt="" width="${size}" height="${size}" loading="lazy" decoding="async">`;
  }

  function clockIn(minutes) {
    const t = new Date(Date.now() + minutes * 60000);
    let h = t.getHours();
    const m = String(t.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    return `${h}:${m}${ampm}`;
  }
  function etaPhrase(mode) {
    return mode === 'pickup'
      ? tr('co.etaPickup', { time: clockIn(20) })
      : tr('co.etaDelivery', { time: clockIn(45) });
  }

  /* ---- Line items ------------------------------------------ */
  function lineHTML(l) {
    return (
      `<article class="cart-item">` +
        `<div class="img-frame cart-item__img">${imgAttrs(l, 96)}</div>` +
        `<div class="cart-item__info">` +
          `<p class="cart-item__name">${esc(l.name)}${l.tag ? ` <span class="cart-item__tag">${esc(l.tag)}</span>` : ''}</p>` +
          `<p class="cart-item__variant">${esc(l.variant || '')}</p>` +
          `<p class="cart-item__unit">${tr('co.each', { price: fmt(l.price) })}</p>` +
          `<button type="button" class="cart-item__remove cart-item__remove--text" data-action="remove" data-id="${l.id}">${ICON.trash}<span>${tr('co.remove')}</span></button>` +
        `</div>` +
        `<div class="cart-item__controls">` +
          `<div class="qty" role="group" aria-label="Quantity for ${esc(l.name)}">` +
            `<button type="button" class="qty__btn" data-action="dec" data-id="${l.id}"${l.qty <= 1 ? ' disabled' : ''} aria-label="Decrease ${esc(l.name)} quantity">${ICON.minus}</button>` +
            `<span class="qty__val" aria-live="polite">${l.qty}</span>` +
            `<button type="button" class="qty__btn" data-action="inc" data-id="${l.id}" aria-label="Increase ${esc(l.name)} quantity">${ICON.plus}</button>` +
          `</div>` +
          `<p class="cart-item__price">${fmt(l.lineTotal)}</p>` +
        `</div>` +
      `</article>`
    );
  }

  function emptyHTML() {
    return (
      `<div class="cart-empty">` +
        `<div class="cart-empty__icon">` +
          `<svg width="30" height="30" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 6.5h10l-.8 9.2a1.5 1.5 0 0 1-1.5 1.3H7.3a1.5 1.5 0 0 1-1.5-1.3L5 6.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M7.3 6.5a2.7 2.7 0 0 1 5.4 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>` +
        `</div>` +
        `<p class="cart-empty__title">${tr('drawer.empty')}</p>` +
        `<p class="cart-empty__sub">${tr('drawer.emptySub')}</p>` +
        `<a class="btn btn--primary" href="index.html#signature">${tr('drawer.browse')}</a>` +
      `</div>`
    );
  }

  /* ---- Add-on row (static — rendered once) ----------------- */
  function renderAddons() {
    const addons = Cart.addonItems();
    if (!addons.length) { addonRow.hidden = true; return; }
    addonTrack.innerHTML = addons.map((a) => (
      `<article class="addon-card">` +
        `<div class="img-frame addon-card__img">${imgAttrs(a, 200)}</div>` +
        `<div class="addon-card__body">` +
          `<p class="addon-card__name">${esc(a.name)}${a.tag ? ` <span class="cart-item__tag">${esc(a.tag)}</span>` : ''}</p>` +
          `<p class="addon-card__blurb">${esc(a.blurb || a.variant || '')}</p>` +
          `<div class="addon-card__foot">` +
            `<span class="addon-card__price">${fmt(a.price)}</span>` +
            `<button type="button" class="btn btn--secondary btn--compact" data-action="add-addon" data-id="${a.id}">${tr('co.add')}</button>` +
          `</div>` +
        `</div>` +
      `</article>`
    )).join('');
    addonRow.hidden = false;
  }

  /* ---- Delivery progress bar ------------------------------- */
  function deliveryBarHTML(t) {
    if (t.mode === 'pickup') {
      return `<div class="delivery-bar delivery-bar--done"><p class="delivery-bar__text">${tr('co.barPickupCheckout')}</p></div>`;
    }
    if (t.freeDeliveryRemaining <= 0) {
      return `<div class="delivery-bar delivery-bar--done"><p class="delivery-bar__text">${tr('co.barUnlocked')}</p><div class="delivery-bar__track"><span class="delivery-bar__fill" style="width:100%"></span></div></div>`;
    }
    const pct = Math.min(100, Math.round((t.subtotal / t.freeDeliveryOver) * 100));
    return (
      `<div class="delivery-bar">` +
        `<p class="delivery-bar__text">${tr('co.barProgress', { amount: fmt(t.freeDeliveryRemaining) })}</p>` +
        `<div class="delivery-bar__track"><span class="delivery-bar__fill" style="width:${pct}%"></span></div>` +
      `</div>`
    );
  }

  /* ---- Promo feedback -------------------------------------- */
  function renderPromoFeedback() {
    const applied = Cart.getPromo();
    if (applied) {
      const label = Cart.totals().promoLabel;
      promoFeedback.className = 'promo__feedback is-ok';
      promoFeedback.innerHTML = tr('co.promoApplied', { code: esc(applied), label: esc(label) });
    } else if (pendingPromoMsg) {
      promoFeedback.className = 'promo__feedback is-err';
      promoFeedback.textContent = pendingPromoMsg;
    } else {
      promoFeedback.className = 'promo__feedback';
      promoFeedback.textContent = tr('co.promoTry');
    }
  }

  /* ---- Main render ----------------------------------------- */
  function render() {
    const lines = Cart.lines();
    const t = Cart.totals();
    const hasItems = lines.length > 0;

    listEl.innerHTML = hasItems ? lines.map(lineHTML).join('') : emptyHTML;

    // Summary numbers
    $('#sum-subtotal').textContent = fmt(t.subtotal);
    $('#sum-tax').textContent = fmt(t.tax);
    $('#sum-total').textContent = fmt(t.total);

    const deliveryDd = $('#sum-delivery');
    if (t.mode === 'pickup') deliveryDd.textContent = '—';
    else if (t.delivery === 0) deliveryDd.textContent = tr('co.free');
    else deliveryDd.textContent = fmt(t.delivery);
    $('#delivery-label').textContent = t.mode === 'pickup' ? tr('co.pickup') : tr('co.delivery');

    const discountRow = $('#row-discount');
    if (t.discount > 0) {
      discountRow.hidden = false;
      $('#discount-label').textContent = t.promoLabel ? tr('co.discountCode', { code: t.promo }) : tr('checkout.discount');
      $('#sum-discount').textContent = '−' + fmt(t.discount);
    } else {
      discountRow.hidden = true;
    }

    // Delivery bar
    $('#delivery-bar-mount').innerHTML = hasItems ? deliveryBarHTML(t) : '';

    // Fulfilment toggle state + ETA
    document.querySelectorAll('.fulfilment-toggle__opt').forEach((btn) => {
      const active = btn.dataset.mode === t.mode;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-checked', String(active));
    });
    $('#eta-text').textContent = hasItems ? etaPhrase(t.mode) : '';

    // Earn-Dough preview
    const earn = $('#earn-dough');
    if (hasItems && t.doughEarned > 0) {
      earn.hidden = false;
      earn.innerHTML = tr('co.earnDough', { n: t.doughEarned });
    } else {
      earn.hidden = true;
    }

    // Promo feedback
    renderPromoFeedback();

    // Actions
    $('#proceed-btn').disabled = !hasItems;
    $('#bar-proceed').disabled = !hasItems;
    $('#bar-total').textContent = fmt(t.total);
    barEl.hidden = !hasItems;
  }

  /* ---- Events: line items + add-ons ------------------------ */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === 'inc' || action === 'dec') {
      const line = Cart.lines().find((l) => l.id === id);
      const qty = line ? line.qty : 0;
      Cart.setQty(id, action === 'inc' ? qty + 1 : qty - 1);
    } else if (action === 'remove') {
      Cart.remove(id);
    } else if (action === 'add-addon') {
      Cart.add(id, 1);
      if (window.KukiCartDrawer) window.KukiCartDrawer.open();
    } else if (action === 'clear-promo') {
      pendingPromoMsg = null;
      Cart.clearPromo();
    }
  });

  /* ---- Events: fulfilment toggle --------------------------- */
  document.querySelectorAll('.fulfilment-toggle__opt').forEach((btn) => {
    btn.addEventListener('click', () => Cart.setMode(btn.dataset.mode));
  });

  /* ---- Events: promo --------------------------------------- */
  promoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = promoInput.value.trim();
    if (!code) return;
    if (Cart.applyPromo(code)) {
      pendingPromoMsg = null;
      promoInput.value = '';
    } else {
      pendingPromoMsg = tr('co.promoInvalid', { code });
      render();
    }
  });
  promoInput.addEventListener('input', () => {
    if (pendingPromoMsg) { pendingPromoMsg = null; renderPromoFeedback(); }
  });

  /* ---- Proceed → confirmation ------------------------------ */
  function proceed() {
    if (!Cart.count()) return;
    const t = Cart.totals();
    const mode = t.mode;
    $('#confirm-total').textContent = fmt(t.total);
    $('#confirm-dough').textContent = t.doughEarned;
    $('#confirm-eta').textContent = etaPhrase(mode).replace(/^[A-Z]/, (c) => c.toLowerCase());

    Cart.clear();
    checkoutSection.hidden = true;
    barEl.hidden = true;
    confirmEl.hidden = false;
    const heading = $('#confirm-heading');
    heading.setAttribute('tabindex', '-1');
    confirmEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    heading.focus();
  }
  $('#proceed-btn').addEventListener('click', proceed);
  $('#bar-proceed').addEventListener('click', proceed);

  /* ---- Image fallback (mirrors index.html behaviour) ------- */
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement)) return;
    const fallback = img.dataset.fallback;
    if (fallback) {
      img.removeAttribute('data-fallback');
      img.removeAttribute('srcset');
      img.src = fallback;
    } else {
      img.style.visibility = 'hidden';
    }
  }, true);

  /* ---- Boot ------------------------------------------------ */
  renderAddons();
  Cart.subscribe(render);
  render();

  // Re-render in the new language when the toggle flips. (Static labels with
  // data-i18n are already handled by KukiI18n.setLang's apply pass.)
  if (window.KukiI18n) {
    window.KukiI18n.onChange(() => { renderAddons(); render(); });
  }
})();

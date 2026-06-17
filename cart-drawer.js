/* ============================================================
   KUKI — cart drawer + nav cart button (shared on every page)
   Requires cart.js (window.KukiCart). Injects all of its own
   markup, so a page only needs <header class="nav"> .nav__inner.
   ============================================================ */
(() => {
  'use strict';
  if (!window.KukiCart) return;

  const Cart = window.KukiCart;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Inline icons ---------------------------------------- */
  const ICON = {
    bag: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 6.5h10l-.8 9.2a1.5 1.5 0 0 1-1.5 1.3H7.3a1.5 1.5 0 0 1-1.5-1.3L5 6.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M7.3 6.5a2.7 2.7 0 0 1 5.4 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    close: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M4.5 4.5l9 9m0-9l-9 9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>',
    minus: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 8h9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>',
    plus: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>',
    trash: '<svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3.5 5h11M7.5 5V3.8a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1V5m3 0-.6 8.6a1.4 1.4 0 0 1-1.4 1.3H6a1.4 1.4 0 0 1-1.4-1.3L4 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const imgAttrs = (item) => {
    if (!item.img) return '';
    return `<img src="${esc(item.img)}"${item.fallback ? ` data-fallback="${esc(item.fallback)}"` : ''} alt="" width="64" height="64" loading="lazy" decoding="async">`;
  };

  /* ---- Nav cart button ------------------------------------- */
  const navInner = document.querySelector('.nav__inner');
  let cartBtn = null;
  if (navInner && !document.getElementById('cart-button')) {
    cartBtn = document.createElement('button');
    cartBtn.type = 'button';
    cartBtn.className = 'nav__cart';
    cartBtn.id = 'cart-button';
    cartBtn.setAttribute('aria-label', 'Open your cart');
    cartBtn.setAttribute('aria-haspopup', 'dialog');
    cartBtn.innerHTML =
      ICON.bag +
      '<span class="cart-badge" id="cart-badge" hidden>0</span>' +
      '<span class="visually-hidden" id="cart-live" aria-live="polite"></span>';
    const actionsHost = navInner.querySelector('.nav__actions') || navInner;
    const cta = actionsHost.querySelector('#nav-cta');
    actionsHost.insertBefore(cartBtn, cta || null);
    cartBtn.addEventListener('click', openDrawer);
  }

  /* ---- Drawer markup --------------------------------------- */
  const drawer = document.createElement('div');
  drawer.className = 'cart-drawer';
  drawer.hidden = true;
  drawer.innerHTML =
    '<div class="cart-drawer__backdrop" data-close></div>' +
    '<aside class="cart-drawer__panel" role="dialog" aria-modal="true" aria-label="Your cart" tabindex="-1">' +
      '<header class="cart-drawer__head">' +
        '<h2 class="cart-drawer__title">Your box</h2>' +
        '<button type="button" class="cart-drawer__close" data-close aria-label="Close cart">' + ICON.close + '</button>' +
      '</header>' +
      '<div class="cart-drawer__body"></div>' +
      '<footer class="cart-drawer__foot" hidden></footer>' +
    '</aside>';
  document.body.appendChild(drawer);

  const panel = drawer.querySelector('.cart-drawer__panel');
  const bodyEl = drawer.querySelector('.cart-drawer__body');
  const footEl = drawer.querySelector('.cart-drawer__foot');

  let isOpen = false;
  let lastFocus = null;

  /* ---- Open / close + focus management --------------------- */
  function openDrawer() {
    if (isOpen) return;
    isOpen = true;
    lastFocus = document.activeElement;
    drawer.hidden = false;
    // force reflow so the transition runs even right after unhiding
    void drawer.offsetWidth;
    drawer.classList.add('is-open');
    document.body.classList.add('cart-open');
    renderDrawer();
    panel.focus();
    document.addEventListener('keydown', onKeydown, true);
  }

  function closeDrawer() {
    if (!isOpen) return;
    isOpen = false;
    drawer.classList.remove('is-open');
    document.body.classList.remove('cart-open');
    document.removeEventListener('keydown', onKeydown, true);
    const hide = () => { drawer.hidden = true; };
    if (reduceMotion) hide();
    else setTimeout(hide, 280);
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); return; }
    if (e.key !== 'Tab') return;
    const focusables = panel.querySelectorAll(
      'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  drawer.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeDrawer();
  });

  /* ---- Line-item actions (event delegation) ---------------- */
  bodyEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const line = Cart.lines().find((l) => l.id === id);
    const qty = line ? line.qty : 0;
    if (btn.dataset.action === 'inc') Cart.setQty(id, qty + 1);
    else if (btn.dataset.action === 'dec') Cart.setQty(id, qty - 1);
    else if (btn.dataset.action === 'remove') Cart.remove(id);
  });

  /* ---- Rendering ------------------------------------------- */
  function lineHTML(l) {
    return (
      `<div class="cart-item cart-item--compact">` +
        `<div class="img-frame cart-item__img">${imgAttrs(l)}</div>` +
        `<div class="cart-item__info">` +
          `<p class="cart-item__name">${esc(l.name)}</p>` +
          `<p class="cart-item__variant">${esc(l.variant || '')}${l.tag ? ` · <span class="cart-item__tag">${esc(l.tag)}</span>` : ''}</p>` +
          `<div class="qty" role="group" aria-label="Quantity for ${esc(l.name)}">` +
            `<button type="button" class="qty__btn" data-action="dec" data-id="${l.id}"${l.qty <= 1 ? ' disabled' : ''} aria-label="Decrease ${esc(l.name)} quantity">${ICON.minus}</button>` +
            `<span class="qty__val" aria-live="polite">${l.qty}</span>` +
            `<button type="button" class="qty__btn" data-action="inc" data-id="${l.id}" aria-label="Increase ${esc(l.name)} quantity">${ICON.plus}</button>` +
          `</div>` +
        `</div>` +
        `<div class="cart-item__end">` +
          `<p class="cart-item__price">${Cart.formatPrice(l.lineTotal)}</p>` +
          `<button type="button" class="cart-item__remove" data-action="remove" data-id="${l.id}" aria-label="Remove ${esc(l.name)}">${ICON.trash}</button>` +
        `</div>` +
      `</div>`
    );
  }

  function deliveryBarHTML(t) {
    if (t.mode === 'pickup') {
      return `<div class="delivery-bar delivery-bar--done"><p class="delivery-bar__text">Pickup — ready warm, no delivery fee.</p></div>`;
    }
    if (t.freeDeliveryRemaining <= 0) {
      return `<div class="delivery-bar delivery-bar--done"><p class="delivery-bar__text">You’ve unlocked free delivery 🎉</p><div class="delivery-bar__track"><span class="delivery-bar__fill" style="width:100%"></span></div></div>`;
    }
    const pct = Math.min(100, Math.round((t.subtotal / t.freeDeliveryOver) * 100));
    return (
      `<div class="delivery-bar">` +
        `<p class="delivery-bar__text">Add <strong>${Cart.formatPrice(t.freeDeliveryRemaining)}</strong> more for free delivery</p>` +
        `<div class="delivery-bar__track"><span class="delivery-bar__fill" style="width:${pct}%"></span></div>` +
      `</div>`
    );
  }

  function renderDrawer() {
    const lines = Cart.lines();
    if (!lines.length) {
      bodyEl.innerHTML =
        `<div class="cart-empty cart-empty--drawer">` +
          `<div class="cart-empty__icon">${ICON.bag}</div>` +
          `<p class="cart-empty__title">Your box is empty</p>` +
          `<p class="cart-empty__sub">Warm, brown-butter cookies are one tap away.</p>` +
          `<a class="btn btn--primary" href="/order/menu.html">Browse the menu</a>` +
        `</div>`;
      footEl.hidden = true;
      return;
    }
    bodyEl.innerHTML = lines.map(lineHTML).join('');
    const t = Cart.totals();
    footEl.hidden = false;
    footEl.innerHTML =
      deliveryBarHTML(t) +
      `<div class="cart-drawer__subtotal"><span>Subtotal</span><span>${Cart.formatPrice(t.subtotal)}</span></div>` +
      `<a class="btn btn--gold cart-drawer__checkout" href="checkout.html">Checkout · ${Cart.formatPrice(t.subtotal)}</a>` +
      `<p class="cart-drawer__note">Taxes & delivery calculated at checkout.</p>`;
  }

  /* ---- Nav badge ------------------------------------------- */
  let prevCount = Cart.count();
  function renderBadge() {
    const n = Cart.count();
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.textContent = n;
      badge.hidden = n === 0;
      if (n > prevCount && !reduceMotion) {
        badge.classList.remove('pop');
        void badge.offsetWidth;
        badge.classList.add('pop');
      }
    }
    const live = document.getElementById('cart-live');
    if (live) live.textContent = `${n} item${n === 1 ? '' : 's'} in cart`;
    prevCount = n;
  }

  /* ---- Wire up --------------------------------------------- */
  Cart.subscribe(() => {
    renderBadge();
    if (isOpen) renderDrawer();
  });
  renderBadge();

  // Let other scripts open the drawer (e.g. "view cart" affordances).
  window.KukiCartDrawer = { open: openDrawer, close: closeDrawer };
})();

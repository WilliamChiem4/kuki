/* ============================================================
   KUKI — /order/menu interactions
   Requires cart.js (window.KukiCart); uses i18n.js (window.KukiI18n)
   when present so dynamic copy translates with the language toggle.
   Handles:
   - the pack-size selector + live price/label + Add to Cart
     (moved here from the marketing page),
   - the Delivery / Pickup fulfilment toggle (persists via Cart.setMode),
   - per-card background tones + image fallback.
   ============================================================ */
(() => {
  'use strict';
  const Cart = window.KukiCart;
  if (!Cart) return;
  const I18n = window.KukiI18n;

  /* ---- Localised dynamic strings (fall back to EN if i18n is absent) ---- */
  const addLabel = (qty, priceStr) => I18n
    ? (qty === 1 ? I18n.t('cart.add') : I18n.t('cart.addQty', { qty, price: priceStr }))
    : (qty === 1 ? 'Add to Cart' : `Add ${qty} · ${priceStr}`);

  const priceHTML = (qty, priceStr) => I18n
    ? (qty === 1 ? I18n.t('price.single', { price: priceStr }) : I18n.t('price.multiple', { qty, price: priceStr }))
    : (qty === 1 ? `${priceStr} <span>— single</span>` : `${priceStr} <span>— ${qty} cookies</span>`);

  const modeNote = (mode, amount) => I18n
    ? (mode === 'pickup' ? I18n.t('menu.notePickup') : I18n.t('menu.noteDelivery', { amount }))
    : (mode === 'pickup' ? 'Ready warm at our studio — no delivery fee.' : `Delivered warm. Free delivery on orders over ${amount}.`);

  /* ---- Things to re-run when the language changes ---- */
  const renders = [];

  /* ---------- Cards: rotating deep tones (mirrors the home palette) ---------- */
  const palette = ['#2B1B12', '#3A2233', '#163230', '#1F2B47', '#4A2718', '#3C2030'];
  document.querySelectorAll('.menu-card').forEach((card, i) => {
    card.style.setProperty('--cookie-bg', palette[i % palette.length]);
  });

  /* ---------- Pack size + Add to Cart ----------
     Every [data-add-to-cart] button is wired to its product. A pack
     selector (.pack__options) is optional — add-ons have none, so the
     quantity falls back to 1. Prices + pack labels render from the
     catalog (VND); add-on button labels are static (data-i18n="co.add"). */
  document.querySelectorAll('[data-add-to-cart]').forEach((addBtn) => {
    const id = addBtn.dataset.addToCart;
    const product = Cart.CATALOG[id];
    if (!product) return;

    const scope = addBtn.closest('.signature__buy, .menu-addon') || document;
    const group = scope.querySelector('.pack__options');
    const priceEl = scope.querySelector('[data-price-for]');
    const labelEl = addBtn.querySelector('.btn__label');
    const hasPack = !!group;
    let addedTimer;

    const qtyOf = () => {
      const sel = group && group.querySelector('input:checked');
      return sel ? Number(sel.dataset.qty) : 1;
    };

    const render = () => {
      const qty = qtyOf();
      const priceStr = Cart.formatPrice(product.price * qty);
      if (priceEl) priceEl.innerHTML = hasPack ? priceHTML(qty, priceStr) : priceStr;
      if (labelEl && hasPack) labelEl.textContent = addLabel(qty, priceStr);
    };
    renders.push(render);

    if (group) group.addEventListener('change', render);
    render();

    addBtn.addEventListener('click', () => {
      Cart.add(id, qtyOf());
      addBtn.classList.add('is-added');
      clearTimeout(addedTimer);
      addedTimer = setTimeout(() => addBtn.classList.remove('is-added'), 1400);
    });
  });

  /* ---------- Delivery / Pickup toggle ----------
     Reflects the mode chosen on /order (Cart remembers it) and writes any
     change straight back, so checkout reads the same fulfilment choice. */
  const modeInputs = document.querySelectorAll('input[name="fulfilment"]');
  const noteEl = document.querySelector('[data-mode-note]');

  const renderMode = () => {
    const mode = Cart.getMode();
    modeInputs.forEach((input) => { input.checked = input.value === mode; });
    if (noteEl) noteEl.textContent = modeNote(mode, Cart.formatPrice(Cart.CONFIG.freeDeliveryOver));
  };
  renders.push(renderMode);

  modeInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (input.checked) { Cart.setMode(input.value); renderMode(); }
    });
  });
  renderMode();

  /* ---------- Re-render dynamic copy on language switch ---------- */
  if (I18n && I18n.onChange) I18n.onChange(() => renders.forEach((fn) => fn()));

  /* ---------- Image fallback: swap to backup once, then hide the frame ---------- */
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
})();

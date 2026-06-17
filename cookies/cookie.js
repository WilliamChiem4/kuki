/* ============================================================
   KUKI — cookie detail page interactions
   Requires cart.js (window.KukiCart). Wires the pack-size
   selector + live price/label + Add to Cart for the page's
   [data-add-to-cart] button (same pattern as order/menu.js),
   plus the shared image fallback.
   ============================================================ */
(() => {
  'use strict';
  const Cart = window.KukiCart;
  if (!Cart) return;

  document.querySelectorAll('[data-add-to-cart]').forEach((addBtn) => {
    const id = addBtn.dataset.addToCart;
    const product = Cart.CATALOG[id];
    if (!product) return;

    const scope = addBtn.closest('.signature__buy') || document;
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
      const total = product.price * qty;
      if (priceEl) {
        priceEl.innerHTML = hasPack
          ? `${Cart.formatPrice(total)} <span>— ${qty === 1 ? 'single' : qty + ' cookies'}</span>`
          : Cart.formatPrice(total);
      }
      if (labelEl && hasPack) {
        labelEl.textContent = qty === 1 ? 'Add to Cart' : `Add ${qty} · ${Cart.formatPrice(total)}`;
      }
    };

    if (group) group.addEventListener('change', render);
    render();

    addBtn.addEventListener('click', () => {
      Cart.add(id, qtyOf());
      addBtn.classList.add('is-added');
      clearTimeout(addedTimer);
      addedTimer = setTimeout(() => addBtn.classList.remove('is-added'), 1400);
    });
  });

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

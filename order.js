/* order.js — /order page interactions.
   Requires cart.js (window.KukiCart). Delivery/Pickup cards remember the
   fulfilment choice via Cart.setMode (persists to localStorage synchronously)
   then let the anchor navigate to the menu; checkout reads that mode back.
   Placeholder cards (aria-disabled) are inert. */
(() => {
  'use strict';
  const Cart = window.KukiCart;

  document.querySelectorAll('.order-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (card.getAttribute('aria-disabled') === 'true') {
        e.preventDefault();
        return;
      }
      const mode = card.dataset.orderMode;
      if (mode && Cart) Cart.setMode(mode);
      // Anchor navigates normally — setMode has already written localStorage.
    });
  });
})();

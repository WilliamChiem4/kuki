/* ============================================================
   KUKI — hamburger nav drawer (shared on every page)
   The #nav-menu-toggle button opens a full-height panel that
   slides in from the left, over a dimmed backdrop. Modal:
   Escape, the ✕ button, a backdrop click, or picking a link
   closes it; Tab is trapped inside while open. Self-contained
   (injects its own backdrop + close button), like cart-drawer.js.
   ============================================================ */
(() => {
  'use strict';

  const toggle = document.getElementById('nav-menu-toggle');
  const menu = document.getElementById('nav-menu');
  if (!toggle || !menu) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Translate via KukiI18n when present (it loads before this script).
  const tr = (k) => (window.KukiI18n ? window.KukiI18n.t(k) : k);

  const CLOSE_ICON =
    '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">' +
    '<path d="M5 5l10 10m0-10L5 15" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>';

  /* Move the panel out of <header class="nav"> to a direct child of <body>.
     The nav gets `backdrop-filter` when scrolled/open, which would otherwise
     become the containing block for this position:fixed panel and clamp it to
     the 72px bar instead of the full viewport. */
  document.body.appendChild(menu);

  /* ---- Injected chrome: backdrop + close button ---- */
  const backdrop = document.createElement('div');
  backdrop.className = 'nav__menu-backdrop';
  backdrop.hidden = true;
  document.body.appendChild(backdrop);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'nav__menu__close';
  closeBtn.setAttribute('aria-label', tr('a11y.closeMenu'));
  closeBtn.setAttribute('data-i18n-attr', 'aria-label:a11y.closeMenu');
  closeBtn.innerHTML = CLOSE_ICON;
  menu.insertBefore(closeBtn, menu.firstChild);

  let isOpen = false;
  let hideTimer;

  function open() {
    if (isOpen) return;
    isOpen = true;
    clearTimeout(hideTimer);
    menu.hidden = false;
    backdrop.hidden = false;
    // force reflow so the slide-in transition runs right after unhiding
    void menu.offsetWidth;
    menu.classList.add('is-open');
    backdrop.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', tr('a11y.closeMenu'));
    document.body.classList.add('nav-menu-open');
    document.addEventListener('keydown', onKeydown, true);
    closeBtn.focus();
  }

  function close({ restoreFocus = true } = {}) {
    if (!isOpen) return;
    isOpen = false;
    menu.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', tr('a11y.openMenu'));
    document.body.classList.remove('nav-menu-open');
    document.removeEventListener('keydown', onKeydown, true);
    const hide = () => { menu.hidden = true; backdrop.hidden = true; };
    if (reduceMotion) hide();
    else hideTimer = setTimeout(hide, 280);
    if (restoreFocus) toggle.focus();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    const focusables = menu.querySelectorAll(
      'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  toggle.addEventListener('click', () => (isOpen ? close() : open()));
  closeBtn.addEventListener('click', () => close());
  backdrop.addEventListener('click', () => close({ restoreFocus: false }));

  // Picking a destination closes the drawer (let the link's own scroll happen).
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) close({ restoreFocus: false });
  });
})();

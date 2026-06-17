(() => {
  document.documentElement.classList.add('js');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nav: cream glass after 24px of scroll ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('nav--scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Scroll reveal + counters ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  const counters = document.querySelectorAll('[data-count]');

  const runCounter = (el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const duration = 1200;
    let start;
    const tick = (now) => {
      if (start === undefined) start = now;
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (reduceMotion || !('IntersectionObserver' in window)) {
    // Page is already fully visible (hidden states are gated behind
    // prefers-reduced-motion: no-preference); just skip the animations.
    revealEls.forEach((el) => el.removeAttribute('data-reveal'));
  } else {
    const seen = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        observer.unobserve(el);

        if (el.hasAttribute('data-reveal')) {
          el.classList.add('is-visible');
          // Drop the reveal styles once done so hover transforms work again.
          el.addEventListener('transitionend', function done(e) {
            if (e.propertyName !== 'transform') return;
            el.removeAttribute('data-reveal');
            el.classList.remove('is-visible');
            el.removeEventListener('transitionend', done);
          });
        }

        el.querySelectorAll('[data-count]').forEach((counter) => {
          if (seen.has(counter)) return;
          seen.add(counter);
          runCounter(counter);
        });
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    revealEls.forEach((el) => observer.observe(el));
  }

  /* ---------- Add to Cart ----------
     The marketing page no longer sells inline — its cookie sections link
     out to /order and /order/menu. The pack-size selector + Add to Cart
     wiring now lives on the menu page (menu.js). */

  /* ---------- Cookie sections: rotating background palette ----------
     Every .cookie section gets its own deep, cream-text-friendly tone,
     assigned by position and cycling through the palette. Add another
     .cookie section and it automatically picks up the next colour, so
     no two cookies in a row ever share a background. */
  const cookiePalette = [
    '#2B1B12', // espresso (the original signature dark)
    '#3A2233', // mulberry
    '#163230', // deep pine
    '#1F2B47', // midnight indigo
    '#4A2718', // cocoa
    '#3C2030', // deep wine
  ];
  document.querySelectorAll('.cookie').forEach((section, i) => {
    section.style.setProperty('--cookie-bg', cookiePalette[i % cookiePalette.length]);
  });

  /* ---------- Image fallback: swap to backup once, then hide ---------- */
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement)) return;
    const fallback = img.dataset.fallback;
    if (fallback) {
      img.removeAttribute('data-fallback');
      img.removeAttribute('srcset');
      img.src = fallback;
    } else {
      img.style.visibility = 'hidden'; // tan frame stays as the fallback
    }
  }, true);
})();

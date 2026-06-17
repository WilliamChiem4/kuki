/* ============================================================
   KUKI — cart store (shared by the marketing page + checkout)
   Vanilla, no build. Prices are in whole VND (no subunit) as
   integers; formatted via Intl at the edge. Exposes window.KukiCart.
   ============================================================ */
(() => {
  'use strict';

  const STORAGE_KEY = 'kuki.cart.v1';

  /* ---- Catalog ---------------------------------------------
     Images reuse the on-brand Unsplash IDs already verified in
     index.html; each carries a fallback like the site's <img>s.
     `addon: true` items appear only in the checkout add-on row. */
  const CATALOG = {
    signature: {
      id: 'signature',
      name: 'The Signature',
      variant: 'Single cookie',
      price: 50000,
      img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80',
      fallback: 'https://images.unsplash.com/photo-1618923850107-d1a234d7a73a?auto=format&fit=crop&w=400&q=80',
    },
    toffee: {
      id: 'toffee',
      name: 'Chocolate Chip + Toffee',
      variant: 'Single cookie',
      price: 60000,
      img: 'https://images.unsplash.com/photo-1590080874088-eec64895b423?auto=format&fit=crop&w=400&q=80',
      fallback: 'https://images.unsplash.com/photo-1618923850107-d1a234d7a73a?auto=format&fit=crop&w=400&q=80',
    },
    box6: {
      id: 'box6',
      name: 'Half Dozen',
      variant: 'Box of 6',
      price: 530000,
      img: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=400&q=80',
      fallback: 'https://images.unsplash.com/photo-1618923850107-d1a234d7a73a?auto=format&fit=crop&w=400&q=80',
    },
    box12: {
      id: 'box12',
      name: "Baker's Dozen",
      variant: 'Box of 12',
      price: 1000000,
      img: 'https://images.unsplash.com/photo-1590080874088-eec64895b423?auto=format&fit=crop&w=400&q=80',
      fallback: 'https://images.unsplash.com/photo-1618923850107-d1a234d7a73a?auto=format&fit=crop&w=400&q=80',
    },
    drop: {
      id: 'drop',
      name: 'Brown Butter Miso',
      variant: 'June Drop',
      tag: 'Drop',
      addon: true,
      blurb: 'This month only. Salted brown-butter dough, white miso, dark chocolate.',
      price: 135000,
      img: 'https://images.unsplash.com/photo-1618923850107-d1a234d7a73a?auto=format&fit=crop&w=400&q=80',
      fallback: 'https://images.unsplash.com/photo-1590080874088-eec64895b423?auto=format&fit=crop&w=400&q=80',
    },
    milk: {
      id: 'milk',
      name: 'Cold Oat Milk',
      variant: 'Pairing',
      addon: true,
      blurb: 'Ice-cold, in a glass bottle. The only correct partner.',
      price: 80000,
      img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
      fallback: '',
    },
  };

  /* ---- Pricing config -------------------------------------- */
  const CONFIG = {
    deliveryFee: 110000,       // ₫110.000
    freeDeliveryOver: 800000,  // free delivery once subtotal ≥ ₫800.000
    taxRate: 0.08,             // 8% VAT
    doughPer: 25000,           // 1 Dough earned per ₫25.000 of subtotal
  };

  /* ---- Promo / Dough codes --------------------------------- */
  const PROMOS = {
    WARM10:   { label: '10% off', percent: 0.10 },
    FREESHIP: { label: 'Free delivery', freeShip: true },
    DOUGH5:   { label: '100.000 ₫ Dough credit', amount: 100000 },
  };

  /* ---- State -----------------------------------------------
     { items: [{id, qty}], mode: 'delivery'|'pickup', promo: code|null } */
  let state = load();

  function emptyState() {
    return { items: [], mode: 'delivery', promo: null };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      const parsed = JSON.parse(raw);
      return {
        items: Array.isArray(parsed.items)
          ? parsed.items
              .filter((it) => it && CATALOG[it.id] && Number(it.qty) > 0)
              .map((it) => ({ id: it.id, qty: Math.max(1, Math.floor(Number(it.qty))) }))
          : [],
        mode: parsed.mode === 'pickup' ? 'pickup' : 'delivery',
        promo: typeof parsed.promo === 'string' && PROMOS[parsed.promo] ? parsed.promo : null,
      };
    } catch (e) {
      return emptyState();
    }
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage off */ }
  }

  /* ---- Pub/sub --------------------------------------------- */
  const subscribers = new Set();
  function emit() {
    save();
    subscribers.forEach((fn) => { try { fn(); } catch (e) { /* keep going */ } });
    try { window.dispatchEvent(new CustomEvent('kuki:cart-change')); } catch (e) { /* old browser */ }
  }

  /* ---- Helpers --------------------------------------------- */
  const findItem = (id) => state.items.find((it) => it.id === id);
  const vndFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
  const formatPrice = (vnd) => vndFormatter.format(Math.round(vnd));

  /* ---- i18n bridge -----------------------------------------
     Translate a key through KukiI18n when it's loaded, else fall back to
     the English default. The marketing page doesn't load i18n+cart, so
     this stays a safe no-op there. */
  const tr = (key, fallback) => (window.KukiI18n ? window.KukiI18n.t(key, null, fallback) : fallback);

  /* Return a copy of a catalog product with its display strings localized.
     Prices, ids, images, flags are untouched. */
  function localize(product) {
    return {
      ...product,
      name: tr('product.' + product.id + '.name', product.name),
      variant: product.variant ? tr('product.' + product.id + '.variant', product.variant) : product.variant,
      blurb: product.blurb ? tr('product.' + product.id + '.blurb', product.blurb) : product.blurb,
    };
  }

  /* ---- Cart mutations -------------------------------------- */
  function add(id, qty = 1) {
    if (!CATALOG[id]) return;
    const existing = findItem(id);
    if (existing) existing.qty += qty;
    else state.items.push({ id, qty: Math.max(1, Math.floor(qty)) });
    emit();
  }

  function setQty(id, qty) {
    qty = Math.floor(Number(qty));
    const existing = findItem(id);
    if (!existing) { if (qty > 0) add(id, qty); return; }
    if (qty <= 0) { remove(id); return; }
    existing.qty = qty;
    emit();
  }

  function remove(id) {
    state.items = state.items.filter((it) => it.id !== id);
    emit();
  }

  function clear() {
    state.items = [];
    state.promo = null;
    emit();
  }

  /* ---- Fulfilment + promo ---------------------------------- */
  function setMode(mode) { state.mode = mode === 'pickup' ? 'pickup' : 'delivery'; emit(); }
  function applyPromo(code) {
    const key = String(code || '').trim().toUpperCase();
    if (PROMOS[key]) { state.promo = key; emit(); return true; }
    return false;
  }
  function clearPromo() { state.promo = null; emit(); }

  /* ---- Derived views --------------------------------------- */
  function lines() {
    return state.items
      .filter((it) => CATALOG[it.id])
      .map((it) => {
        const product = localize(CATALOG[it.id]);
        return { ...product, qty: it.qty, lineTotal: product.price * it.qty };
      });
  }

  // Count distinct cookie types in the cart, not total quantity:
  // 12 chocolate chip cookies → 1, two different cookies → 2, etc.
  const count = () => lines().length;
  const subtotal = () => lines().reduce((sum, l) => sum + l.lineTotal, 0);

  function totals() {
    const sub = subtotal();
    const mode = state.mode;
    const promo = state.promo ? PROMOS[state.promo] : null;

    let delivery = mode === 'pickup'
      ? 0
      : (sub >= CONFIG.freeDeliveryOver ? 0 : CONFIG.deliveryFee);
    if (promo && promo.freeShip) delivery = 0;

    let discount = 0;
    if (promo) {
      if (promo.percent) discount += Math.round(sub * promo.percent);
      if (promo.amount) discount += Math.min(promo.amount, sub);
    }

    const taxable = Math.max(0, sub - discount);
    const tax = Math.round(taxable * CONFIG.taxRate);
    const total = Math.max(0, taxable + tax + delivery);

    return {
      subtotal: sub,
      delivery,
      tax,
      discount,
      total,
      mode,
      promo: state.promo,
      promoLabel: promo ? tr('promo.' + state.promo, promo.label) : null,
      freeShip: !!(promo && promo.freeShip) || (mode === 'delivery' && sub >= CONFIG.freeDeliveryOver),
      freeDeliveryRemaining: mode === 'pickup' ? 0 : Math.max(0, CONFIG.freeDeliveryOver - sub),
      freeDeliveryOver: CONFIG.freeDeliveryOver,
      doughEarned: Math.floor(sub / CONFIG.doughPer),
    };
  }

  /* ---- Public API ------------------------------------------ */
  window.KukiCart = {
    CATALOG,
    CONFIG,
    PROMOS,
    get: () => ({ items: state.items.map((it) => ({ ...it })), mode: state.mode, promo: state.promo }),
    getMode: () => state.mode,
    getPromo: () => state.promo,
    lines,
    count,
    subtotal,
    totals,
    add,
    setQty,
    remove,
    clear,
    setMode,
    applyPromo,
    clearPromo,
    formatPrice,
    addonItems: () => Object.values(CATALOG).filter((p) => p.addon).map(localize),
    subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); },
  };
})();

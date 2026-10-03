/* Lumière theme — vanilla JS, no dependencies. */
(() => {
  'use strict';

  const theme = window.theme || { routes: {}, strings: {} };
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const define = (n, c) => { if (!customElements.get(n)) customElements.define(n, c); };
  const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const parse = (html) => new DOMParser().parseFromString(html, 'text/html');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = (theme.routes.root || '/').replace(/\/$/, '');

  const toast = (msg) => {
    const el = $('[data-toast]');
    if (!el || !msg) return;
    el.textContent = msg;
    el.classList.add('is-visible');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('is-visible'), 2800);
  };

  /* ---------- Money (client-side price updates) ---------- */
  const formatMoney = (cents) => {
    const fmt = theme.moneyFormat || '${{amount}}';
    const v = Number(cents) / 100;
    const fx = (n, d, t = ',', dec = '.') => { const [i, f] = n.toFixed(d).split('.'); return i.replace(/\B(?=(\d{3})+(?!\d))/g, t) + (f ? dec + f : ''); };
    return fmt.replace(/\{\{\s*(\w+)\s*\}\}/, (_, k) => ({
      amount_no_decimals: fx(v, 0),
      amount_with_comma_separator: fx(v, 2, '.', ','),
      amount_no_decimals_with_comma_separator: fx(v, 0, '.'),
      amount_with_apostrophe_separator: fx(v, 2, "'")
    }[k] || fx(v, 2)));
  };

  /* ---------- Browser storage: recently viewed + wishlist ---------- */
  const Recent = {
    key: 'lumiere:recent',
    get() { try { return JSON.parse(localStorage.getItem(this.key)) || []; } catch (e) { return []; } },
    add(h) {
      if (!h) return;
      const list = this.get().filter((x) => x !== h);
      list.unshift(h);
      try { localStorage.setItem(this.key, JSON.stringify(list.slice(0, 12))); } catch (e) { /* private mode */ }
    }
  };
  const Wishlist = {
    key: 'lumiere:wishlist',
    get() { try { return JSON.parse(localStorage.getItem(this.key)) || []; } catch (e) { return []; } },
    set(l) { try { localStorage.setItem(this.key, JSON.stringify(l)); } catch (e) { /* private mode */ } this.sync(); },
    toggle(h) { const l = this.get(); const i = l.indexOf(h); if (i > -1) l.splice(i, 1); else l.unshift(h); this.set(l); },
    sync() {
      const l = this.get();
      $$('[data-wishlist-toggle]').forEach((b) => b.setAttribute('aria-pressed', String(l.includes(b.dataset.wishlistToggle))));
      $$('[data-wishlist-count]').forEach((c) => { c.textContent = l.length; c.hidden = !l.length; });
    }
  };

  /* ---------- Dialog helpers ---------- */
  const openDialog = (d) => { if (d && !d.open) { d.showModal(); document.documentElement.style.overflow = 'hidden'; } };
  const closeDialog = (d) => { if (d && d.open) d.close(); };
  document.addEventListener('close', (e) => {
    if (e.target.tagName === 'DIALOG' && !$('dialog[open]')) document.documentElement.style.overflow = '';
  }, true);
  document.addEventListener('click', (e) => {
    const d = e.target;
    if (d.tagName === 'DIALOG' && d.open) {
      const r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeDialog(d);
    }
  });

  /* ---------- Header ---------- */
  class SiteHeader extends HTMLElement {
    connectedCallback() {
      const setH = () => document.documentElement.style.setProperty('--header-h', `${this.offsetHeight}px`);
      setH();
      window.addEventListener('resize', debounce(setH, 150));
      const onScroll = () => this.classList.toggle('is-scrolled', window.scrollY > 8);
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();

      // dropdowns: hover for mouse, click/keyboard for everyone, one open at a time
      const dds = $$('[data-dropdown]', this);
      const hover = matchMedia('(hover: hover)');
      dds.forEach((d) => {
        let t;
        d.addEventListener('mouseenter', () => { if (hover.matches) { clearTimeout(t); d.open = true; } });
        d.addEventListener('mouseleave', () => { if (hover.matches) t = setTimeout(() => (d.open = false), 120); });
        d.addEventListener('toggle', () => { if (d.open) dds.forEach((o) => o !== d && (o.open = false)); });
      });
      document.addEventListener('click', (e) => { if (!this.contains(e.target)) dds.forEach((d) => (d.open = false)); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') dds.forEach((d) => { if (d.open) { d.open = false; $('summary', d).focus(); } }); });

      // mobile sheet
      const sheet = $('[data-menu-sheet]', this);
      const opener = $('[data-menu-open]', this);
      opener?.addEventListener('click', () => { openDialog(sheet); opener.setAttribute('aria-expanded', 'true'); });
      $('[data-menu-close]', this)?.addEventListener('click', () => closeDialog(sheet));
      sheet?.addEventListener('close', () => opener?.setAttribute('aria-expanded', 'false'));
      $$('[data-search-open]', sheet || this).forEach((a) => a.addEventListener('click', () => closeDialog(sheet)));
    }
  }
  define('site-header', SiteHeader);

  /* ---------- Announcement ---------- */
  class AnnouncementBar extends HTMLElement {
    connectedCallback() {
      this.items = $$('.announce__item', this);
      this.i = 0;
      if (this.items.length < 2) return;
      $$('[data-announce]', this).forEach((b) => b.addEventListener('click', () => this.go(this.i + (b.dataset.announce === 'next' ? 1 : -1))));
      this.addEventListener('mouseenter', () => (this.paused = true));
      this.addEventListener('mouseleave', () => (this.paused = false));
      this.addEventListener('focusin', () => (this.paused = true));
      this.addEventListener('focusout', () => (this.paused = false));
      if (!reduceMotion) setInterval(() => { if (!this.paused) this.go(this.i + 1); }, Number(this.dataset.interval) || 5000);
    }
    go(n) {
      this.items[this.i].hidden = true;
      this.items[this.i].classList.remove('is-active');
      this.i = (n + this.items.length) % this.items.length;
      this.items[this.i].hidden = false;
      this.items[this.i].classList.add('is-active');
    }
  }
  define('announcement-bar', AnnouncementBar);

  /* ---------- Search modal + predictive ---------- */
  const searchModal = $('[data-search-modal]');
  if (searchModal) {
    const input = $('[data-predictive-input]', searchModal);
    const results = $('[data-predictive-results]', searchModal);
    let ctrl;
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-search-open]')) {
        e.preventDefault();
        openDialog(searchModal);
        setTimeout(() => input?.focus(), 40);
      }
      if (e.target.closest('[data-search-close]')) closeDialog(searchModal);
    });
    input?.addEventListener('input', debounce(async () => {
      const q = input.value.trim();
      if (!q) { results.innerHTML = ''; input.setAttribute('aria-expanded', 'false'); return; }
      ctrl?.abort();
      ctrl = new AbortController();
      try {
        const res = await fetch(`${theme.routes.predictiveSearch}?q=${encodeURIComponent(q)}&section_id=predictive-search&resources[type]=product,collection,page,article,query&resources[limit]=6&resources[options][fields]=title,product_type,variants.title,vendor,tag`, { signal: ctrl.signal });
        const el = $('#predictive-search-results', parse(await res.text()));
        results.innerHTML = el ? el.outerHTML : '';
        input.setAttribute('aria-expanded', el ? 'true' : 'false');
      } catch (err) { if (err.name !== 'AbortError') results.innerHTML = ''; }
    }, 260));
  }

  /* ---------- Cart ---------- */
  const Cart = {
    drawer: () => $('[data-cart-drawer]'),
    sections() {
      const ids = ['cart-icon-bubble'];
      if (this.drawer()) ids.push('cart-drawer');
      const page = $('[data-cart-page]')?.closest('.shopify-section');
      if (page) ids.push(page.id.replace('shopify-section-', ''));
      return ids;
    },
    render(sections) {
      if (!sections) return;
      Object.entries(sections).forEach(([id, html]) => {
        if (!html) return;
        const doc = parse(html);
        if (id === 'cart-icon-bubble') {
          const src = $('.shopify-section', doc) || doc.body;
          $$('[data-cart-bubble]').forEach((b) => { b.innerHTML = src.innerHTML; });
        } else if (id === 'cart-drawer') {
          const dst = $('[data-cart-drawer-content]');
          const src = $('[data-cart-drawer-content]', doc);
          if (dst && src) dst.innerHTML = src.innerHTML;
        } else {
          const dst = document.getElementById(`shopify-section-${id}`);
          const src = doc.getElementById(`shopify-section-${id}`) || $('.shopify-section', doc);
          if (dst && src) dst.innerHTML = src.innerHTML;
        }
      });
    },
    open() {
      const d = this.drawer();
      if (d && theme.cartType === 'drawer') { openDialog(d); setTimeout(() => $('[data-cart-close]', d)?.focus(), 60); return true; }
      return false;
    },
    async post(url, body, json) {
      const res = await fetch(url, {
        method: 'POST',
        headers: json ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body
      });
      const data = await res.json();
      if (!res.ok || data.status) throw new Error(data.description || data.message || theme.strings.error);
      this.render(data.sections);
      return data;
    },
    add(form) {
      const fd = new FormData(form);
      fd.append('sections', this.sections().join(','));
      fd.append('sections_url', location.pathname);
      return this.post(`${theme.routes.cartAdd}.js`, fd);
    },
    addItems(items) {
      return this.post(`${theme.routes.cartAdd}.js`, JSON.stringify({ items, sections: this.sections(), sections_url: location.pathname }), true);
    },
    change(line, quantity) {
      return this.post(`${theme.routes.cartChange}.js`, JSON.stringify({ line, quantity, sections: this.sections(), sections_url: location.pathname }), true);
    },
    note: debounce((note) => fetch(`${theme.routes.cart}/update.js`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }) }), 500),
    afterAdd() {
      closeDialog($('[data-quick-add-dialog]'));
      if (!this.open()) {
        if (theme.cartType === 'page') location.href = theme.routes.cart;
        else toast(theme.strings.added);
      }
    }
  };
  window.LumiereCart = Cart;

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-cart-open]') && Cart.open()) e.preventDefault();
    if (e.target.closest('[data-cart-close]')) closeDialog(Cart.drawer());
    const rm = e.target.closest('[data-cart-remove]');
    if (rm) updateLine(rm.dataset.cartRemove, 0, rm.closest('.cart-line'));
  });

  document.addEventListener('submit', async (e) => {
    // Add to bag (product page, cards, quick add, recommendations)
    const form = e.target.closest('[data-product-form]');
    if (form) {
      e.preventDefault();
      const btn = e.submitter && e.submitter.form === form ? e.submitter : $('[name="add"]', form);
      const err = $('[data-form-error]', form);
      if (btn?.disabled) return;
      btn?.classList.add('is-loading');
      btn?.setAttribute('aria-busy', 'true');
      if (err) err.hidden = true;
      try { await Cart.add(form); Cart.afterAdd(); }
      catch (ex) { if (err) { err.textContent = ex.message; err.hidden = false; } else toast(ex.message); }
      finally { btn?.classList.remove('is-loading'); btn?.removeAttribute('aria-busy'); }
      return;
    }
    // Promo code → Shopify discount URL, then back to this page
    const promo = e.target.closest('[data-promo-form]');
    if (promo) {
      e.preventDefault();
      const code = new FormData(promo).get('code')?.toString().trim();
      if (code) location.href = `${root}/discount/${encodeURIComponent(code)}?redirect=${encodeURIComponent(location.pathname + location.search)}`;
      return;
    }
    // Confirm destructive forms
    const msg = e.target.dataset?.confirm;
    if (msg && !confirm(msg)) e.preventDefault();
  });

  const updateLine = async (line, qty, row) => {
    row?.classList.add('is-updating');
    try { await Cart.change(Number(line), qty); } catch (ex) { toast(ex.message); row?.classList.remove('is-updating'); }
  };
  document.addEventListener('change', (e) => {
    const q = e.target.closest('.qty__input[data-line]');
    if (q) updateLine(q.dataset.line, Math.max(0, parseInt(q.value, 10) || 0), q.closest('.cart-line'));
    const n = e.target.closest('[data-cart-note]');
    if (n) Cart.note(n.value);
  });

  /* ---------- Quantity ---------- */
  class QuantityInput extends HTMLElement {
    connectedCallback() {
      const input = $('input', this);
      $$('button', this).forEach((b) => b.addEventListener('click', () => {
        const min = Number(input.min || 0);
        const cur = parseInt(input.value, 10) || 0;
        const next = b.name === 'plus' ? cur + 1 : Math.max(cur - 1, min);
        if (next === cur) return;
        input.value = next;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }));
    }
  }
  define('quantity-input', QuantityInput);

  /* ---------- Quick add ---------- */
  const qaDialog = $('[data-quick-add-dialog]');
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-quick-add]');
    if (!b || !qaDialog) return;
    e.preventDefault();
    const body = $('[data-quick-add-body]', qaDialog);
    body.innerHTML = '<div class="qa-dialog__loading"><span class="btn is-loading btn--outline" aria-hidden="true">.</span></div>';
    openDialog(qaDialog);
    try {
      const res = await fetch(`${b.dataset.quickAdd}${b.dataset.quickAdd.includes('?') ? '&' : '?'}section_id=quick-add`);
      const el = $('.qa', parse(await res.text()));
      body.innerHTML = el ? el.outerHTML : '';
      $('.variants__input:checked, button, a', body)?.focus();
      Wishlist.sync();
    } catch (ex) { body.innerHTML = ''; closeDialog(qaDialog); location.href = b.dataset.quickAdd; }
  });
  $('[data-quick-add-close]')?.addEventListener('click', () => closeDialog(qaDialog));

  /* ---------- Gallery (scroll-snap) ---------- */
  class MediaGallery extends HTMLElement {
    connectedCallback() {
      this.track = $('[data-gallery-track]', this);
      this.slides = $$('.gallery__slide', this);
      this.thumbs = $$('[data-thumb]', this);
      this.counter = $('[data-gallery-index]', this);
      this.zoom = $('[data-zoom-dialog]', this);
      $('[data-gallery-prev]', this)?.addEventListener('click', () => this.go(this.index() - 1));
      $('[data-gallery-next]', this)?.addEventListener('click', () => this.go(this.index() + 1));
      this.thumbs.forEach((t) => t.addEventListener('click', () => this.goToMedia(t.dataset.thumb)));
      this.track?.addEventListener('scroll', debounce(() => this.sync(), 60), { passive: true });
      this.addEventListener('click', (e) => {
        const z = e.target.closest('[data-zoom]');
        if (z) this.openZoom(z.dataset.zoom || this.slides[this.index()]?.dataset.mediaId);
        if (e.target.closest('[data-zoom-close]')) closeDialog(this.zoom);
      });
      this.track?.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); this.go(this.index() + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); this.go(this.index() - 1); }
      });
      const first = $('.gallery__thumb.is-active', this)?.dataset.thumb;
      if (first) requestAnimationFrame(() => this.goToMedia(first, true));
    }
    index() { return this.track ? Math.round(this.track.scrollLeft / Math.max(1, this.track.clientWidth)) : 0; }
    go(i, instant) {
      if (!this.slides.length) return;
      const n = this.slides.length;
      const k = (i + n) % n;
      this.track.scrollTo({ left: k * this.track.clientWidth, behavior: instant || reduceMotion ? 'auto' : 'smooth' });
      this.sync(k);
    }
    goToMedia(id, instant) {
      const i = this.slides.findIndex((s) => s.dataset.mediaId === String(id));
      if (i > -1) this.go(i, instant);
    }
    sync(k = this.index()) {
      const id = this.slides[k]?.dataset.mediaId;
      if (this.counter) this.counter.textContent = k + 1;
      this.thumbs.forEach((t) => {
        const on = t.dataset.thumb === id;
        t.classList.toggle('is-active', on);
        if (on) { t.setAttribute('aria-current', 'true'); t.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } else t.removeAttribute('aria-current');
      });
      this.slides.forEach((s, i) => { if (i !== k) $$('video', s).forEach((v) => v.pause()); });
    }
    openZoom(id) {
      if (!this.zoom) return;
      openDialog(this.zoom);
      const item = $(`[data-zoom-item="${id}"]`, this.zoom);
      if (item) setTimeout(() => item.scrollIntoView({ block: 'start' }), 40);
    }
  }
  define('media-gallery', MediaGallery);

  /* ---------- Product info: variants, sticky bar, recently viewed ---------- */
  class ProductInfo extends HTMLElement {
    connectedCallback() {
      this.picker = $('[data-variant-picker]', this);
      this.form = this.picker ? document.getElementById(this.picker.dataset.form) : $('[data-product-form]', this);
      this.variants = JSON.parse($('[data-variants]', this)?.textContent || '[]');
      this.picker?.addEventListener('change', () => this.onChange());
      if (this.hasAttribute('data-sticky')) this.sticky();
      if (this.hasAttribute('data-recent')) Recent.add(this.dataset.productHandle);
    }
    onChange() {
      const groups = $$('fieldset', this.picker);
      const opts = groups.map((g) => $('input:checked', g)?.value);
      groups.forEach((g, i) => { const l = $('[data-selected-value]', g); if (l) l.textContent = opts[i] || ''; });
      const v = this.variants.find((x) => x.options.every((o, i) => o === opts[i]));
      const btn = $('[data-add-button]', this);
      const label = $('[data-add-label]', this);
      if (!v) { if (btn) btn.disabled = true; if (label) label.textContent = theme.strings.unavailable; return; }
      const idInput = this.form && $('[data-variant-id]', this.form);
      if (idInput) idInput.value = v.id;
      if (btn) btn.disabled = !v.available;
      if (label) label.textContent = v.available ? theme.strings.addToCart : theme.strings.soldOut;
      if (v.featured_media) $('media-gallery', this)?.goToMedia(v.featured_media.id);
      if (this.hasAttribute('data-local-price')) { this.localPrice(v); return; }
      history.replaceState({}, '', `${this.dataset.url}?variant=${v.id}`);
      this.refresh(v.id);
    }
    localPrice(v) {
      const box = $('[data-product-price] .price', this);
      if (!box) return;
      const sale = v.compare_at_price > v.price;
      let html = `<span class="price__now">${formatMoney(v.price)}</span>`;
      if (sale) {
        const pct = Math.round(((v.compare_at_price - v.price) * 100) / v.compare_at_price);
        html += `<s class="price__was">${formatMoney(v.compare_at_price)}</s><span class="badge badge--sale">${(theme.strings.saveAmount || '').replace('[percent]', pct)}</span>`;
      }
      box.classList.toggle('price--sale', sale);
      box.innerHTML = html;
    }
    async refresh(id) {
      try {
        const doc = parse(await (await fetch(`${this.dataset.url}?variant=${id}&section_id=${this.dataset.section}`)).text());
        // Quantity-tier and bundle prices depend on the variant too; keep the shopper's chosen tier.
        const tier = $('[data-pp-qb-tier]:checked', this)?.value;
        ['[data-product-price]', '[data-inventory]', '[data-sticky-price]', '[data-pp-qb]', '[data-pp-bundle]'].forEach((s) => {
          const a = $(s, doc); const b = $(s, this);
          if (a && b) b.innerHTML = a.innerHTML;
        });
        if (tier) { const t = $(`[data-pp-qb-tier][value="${tier}"]`, this); if (t) t.checked = true; }
        const src = $$('.variants__pill', doc);
        $$('.variants__pill', this).forEach((l, i) => { if (src[i]) l.className = src[i].className; });
      } catch (e) { /* keep UI */ }
    }
    sticky() {
      const bar = $('[data-sticky-bar]', this);
      const target = $('[data-add-button]', this);
      if (!bar || !target || !('IntersectionObserver' in window)) return;
      new IntersectionObserver(([en]) => {
        const show = !en.isIntersecting && en.boundingClientRect.top < 0;
        bar.classList.toggle('is-visible', show);
        bar.setAttribute('aria-hidden', String(!show));
        $('[data-sticky-add]', bar).tabIndex = show ? 0 : -1;
      }).observe(target);
    }
  }
  define('product-info', ProductInfo);

  /* ---------- Rails (carousel arrows live in the section heading) ---------- */
  class RailSlider extends HTMLElement {}
  define('rail-slider', RailSlider);
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-rail]');
    if (!b) return;
    const track = $('[data-rail-track]', b.closest('.section, section, product-recommendations') || document);
    track?.scrollBy({ left: (b.dataset.rail === 'next' ? 1 : -1) * track.clientWidth * 0.85, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ---------- Facets (collection) + load more ---------- */
  class FacetForm extends HTMLElement {
    connectedCallback() {
      this.form = $('[data-facets-form]', this);
      this.panel = $('[data-filter-panel]', this);
      this.toggle = $('[data-filter-open]', this);
      const submit = debounce(() => this.submit(), 450);
      this.addEventListener('change', (e) => {
        if (!e.target.matches('[data-facet-input]')) return;
        if (this.panel?.classList.contains('is-open') && e.target.closest('[data-filter-panel]')) return;
        submit();
      });
      this.form?.addEventListener('submit', (e) => { e.preventDefault(); this.submit(); });
      this.toggle?.addEventListener('click', () => this.set(true));
      $('[data-filter-close]', this)?.addEventListener('click', () => this.set(false));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.set(false); });
      this.addEventListener('click', (e) => { const m = e.target.closest('[data-load-more]'); if (m) { e.preventDefault(); this.more(m); } });
    }
    set(open) {
      if (!this.panel) return;
      this.panel.classList.toggle('is-open', open);
      this.toggle?.setAttribute('aria-expanded', String(open));
      document.documentElement.style.overflow = open ? 'hidden' : '';
      if (open) setTimeout(() => $('[data-filter-close]', this.panel)?.focus(), 60);
    }
    submit() {
      const p = new URLSearchParams();
      new FormData(this.form).forEach((v, k) => { if (String(v).trim() !== '') p.append(k, v); });
      location.href = `${this.form.action}?${p.toString()}#ProductGrid`;
    }
    async more(btn) {
      btn.classList.add('is-loading');
      try {
        const doc = parse(await (await fetch(btn.href)).text());
        const grid = $('[data-grid]', this);
        $$('[data-grid] > li', doc).forEach((li) => grid.appendChild(li));
        const nav = $('.pagination', this);
        const next = $('.pagination', doc);
        if (nav) { if (next) nav.replaceWith(next); else nav.remove(); }
        history.replaceState({}, '', btn.href.split('#')[0]);
        revealAll();
        Wishlist.sync();
      } catch (e) { location.href = btn.href; }
    }
  }
  define('facet-form', FacetForm);

  /* ---------- Recommendations ---------- */
  const lazyFetch = (el, cb) => {
    if (!('IntersectionObserver' in window)) { cb(); return; }
    new IntersectionObserver(([en], o) => { if (en.isIntersecting) { o.disconnect(); cb(); } }, { rootMargin: '0px 0px 400px 0px' }).observe(el);
  };
  class ProductRecommendations extends HTMLElement {
    connectedCallback() {
      if (this.children.length) return;
      lazyFetch(this, async () => {
        try {
          const src = $('product-recommendations', parse(await (await fetch(this.dataset.url)).text()));
          if (src && src.innerHTML.trim()) { this.innerHTML = src.innerHTML; revealAll(); Wishlist.sync(); } else this.closest('.shopify-section')?.remove();
        } catch (e) { /* silent */ }
      });
    }
  }
  define('product-recommendations', ProductRecommendations);

  class CartRecommendations extends HTMLElement {
    async connectedCallback() {
      if (!this.dataset.productId || this.children.length) return;
      try {
        const doc = parse(await (await fetch(`${this.dataset.url}&product_id=${this.dataset.productId}`)).text());
        const src = $('.cart-recs__inner', doc);
        if (src) this.innerHTML = src.outerHTML;
      } catch (e) { /* silent */ }
    }
  }
  define('cart-recommendations', CartRecommendations);

  /* ---------- Routine: add every step ---------- */
  class RoutineBundle extends HTMLElement {
    connectedCallback() {
      const btn = $('[data-routine-add]', this);
      const err = $('[data-routine-error]', this);
      btn?.addEventListener('click', async () => {
        const ids = (btn.dataset.routineAdd || '').split(',').filter(Boolean);
        if (!ids.length) return;
        btn.classList.add('is-loading');
        if (err) err.hidden = true;
        try { await Cart.addItems(ids.map((id) => ({ id: Number(id), quantity: 1 }))); Cart.afterAdd(); }
        catch (ex) { if (err) { err.textContent = ex.message; err.hidden = false; } }
        finally { btn.classList.remove('is-loading'); }
      });
    }
  }
  define('routine-bundle', RoutineBundle);

  /* ---------- Card rendering helper (recently viewed, wishlist) ---------- */
  const renderCards = async (handles) => {
    const html = await Promise.all(handles.map(async (h) => {
      try {
        const res = await fetch(`${root}/products/${encodeURIComponent(h)}?section_id=card-render`);
        if (!res.ok) return '';
        const li = $('li', parse(await res.text()));
        return li ? li.outerHTML : '';
      } catch (e) { return ''; }
    }));
    return html.join('');
  };

  /* ---------- Recently viewed ---------- */
  class RecentlyViewed extends HTMLElement {
    connectedCallback() {
      const handles = Recent.get().filter((h) => h !== this.dataset.exclude).slice(0, Number(this.dataset.limit) || 4);
      if (!handles.length) return;
      lazyFetch(this, async () => {
        const grid = $('[data-recent-grid]', this);
        grid.innerHTML = await renderCards(handles);
        if (grid.children.length) { this.hidden = false; Wishlist.sync(); }
      });
    }
  }
  define('recently-viewed', RecentlyViewed);

  /* ---------- Wishlist (browser storage; replaceable by an app) ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-wishlist-toggle]');
    if (!b) return;
    e.preventDefault();
    Wishlist.toggle(b.dataset.wishlistToggle);
    if (b.closest('wishlist-page') && b.getAttribute('aria-pressed') === 'false') b.closest('.product-grid__item')?.remove();
  });
  class WishlistPage extends HTMLElement {
    async connectedCallback() {
      const grid = $('[data-wishlist-grid]', this);
      const empty = $('[data-wishlist-empty]', this);
      const l = Wishlist.get();
      if (!l.length) { empty.hidden = false; return; }
      grid.innerHTML = await renderCards(l);
      empty.hidden = grid.children.length > 0;
      Wishlist.sync();
    }
  }
  define('wishlist-page', WishlistPage);

  /* ---------- Reveal on scroll + gentle parallax ---------- */
  let revealObserver;
  const revealAll = () => {
    const els = $$('[data-reveal]:not(.is-in)');
    if (!document.body.classList.contains('has-reveal') || reduceMotion || !('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
    revealObserver = revealObserver || new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); revealObserver.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 70}ms`; revealObserver.observe(el); });
  };
  revealAll();

  if (!reduceMotion && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('[data-parallax]').forEach((el) => {
      const host = el.closest('section') || el;
      host.addEventListener('pointermove', (e) => {
        const r = host.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `translate3d(${x * -14}px, ${y * -10}px, 0)`;
      });
      host.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Slideshow ---------- */
  class SlideShow extends HTMLElement {
    connectedCallback() {
      this.slides = $$('[data-slide]', this);
      this.dots = $$('[data-dot]', this);
      this.index = 0;
      if (this.slides.length < 2) return;
      this.go(0);
      $('[data-prev]', this)?.addEventListener('click', () => this.go(this.index - 1, true));
      $('[data-next]', this)?.addEventListener('click', () => this.go(this.index + 1, true));
      this.dots.forEach((d) => d.addEventListener('click', () => this.go(Number(d.dataset.dot), true)));
      this.pauseBtn = $('[data-pause]', this);
      this.pauseBtn?.addEventListener('click', () => this.setPaused(!this.classList.contains('is-paused'), true));
      this.addEventListener('keydown', (e) => {
        if (e.target.closest('input, textarea, select')) return;
        if (e.key === 'ArrowRight') this.go(this.index + 1, true);
        if (e.key === 'ArrowLeft') this.go(this.index - 1, true);
      });
      let x0 = null;
      this.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
      this.addEventListener('touchend', (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 50) this.go(this.index + (dx < 0 ? 1 : -1), true);
        x0 = null;
      });
      // Pause while hovered / focused inside (WCAG 2.2.2)
      this.addEventListener('mouseenter', () => (this.hovering = true));
      this.addEventListener('mouseleave', () => (this.hovering = false));
      this.addEventListener('focusin', () => (this.hovering = true));
      this.addEventListener('focusout', () => (this.hovering = false));
      if (this.dataset.autoplay === 'true' && !reduceMotion) this.start();
      else this.setPaused(true);
    }
    disconnectedCallback() { clearInterval(this.timer); }
    start() {
      clearInterval(this.timer);
      this.timer = setInterval(() => { if (!this.hovering && !this.classList.contains('is-paused')) this.go(this.index + 1); }, Number(this.dataset.interval) || 6000);
    }
    setPaused(paused, user) {
      this.classList.toggle('is-paused', paused);
      if (this.pauseBtn) this.pauseBtn.setAttribute('aria-label', paused ? this.pauseBtn.dataset.labelPlay : this.pauseBtn.dataset.labelPause);
      if (!paused && user) this.start();
    }
    go(i, user) {
      const n = this.slides.length;
      this.index = (i + n) % n;
      this.slides.forEach((s, k) => {
        const on = k === this.index;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', String(!on));
        $$('a, button', s).forEach((el) => (on ? el.removeAttribute('tabindex') : el.setAttribute('tabindex', '-1')));
      });
      this.dots.forEach((d, k) => {
        d.classList.toggle('is-active', k === this.index);
        if (k === this.index) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
      if (user && this.dataset.autoplay === 'true') this.start();
    }
    goToBlock(el) { const i = this.slides.indexOf(el); if (i > -1) { this.setPaused(true); this.go(i); } }
  }
  define('slide-show', SlideShow);

  /* ---------- Deferred media (click-to-load video) ---------- */
  class DeferredMedia extends HTMLElement {
    connectedCallback() { $('[data-play]', this)?.addEventListener('click', () => this.load()); }
    load() {
      if (this.classList.contains('is-loaded')) return;
      const tpl = $('template', this);
      const screen = $('.vframe__screen', this) || this;
      if (!tpl || !tpl.content.firstElementChild) return;
      screen.appendChild(tpl.content.cloneNode(true));
      this.classList.add('is-loaded');
      const v = $('video', screen);
      if (v) { v.play().catch(() => {}); v.focus(); }
    }
  }
  define('deferred-media', DeferredMedia);

  /* ---------- Countdown ---------- */
  class CountdownTimer extends HTMLElement {
    connectedCallback() {
      const tz = (this.dataset.tz || '+0000').replace(/^([+-]\d{2})(\d{2})$/, '$1:$2');
      this.end = new Date(`${this.dataset.end}${tz}`).getTime();
      this.nums = {};
      $$('[data-unit]', this).forEach((n) => (this.nums[n.dataset.unit] = n));
      if (Number.isNaN(this.end)) return;
      this.tick();
      this.timer = setInterval(() => this.tick(), 1000);
    }
    disconnectedCallback() { clearInterval(this.timer); }
    tick() {
      let diff = Math.max(0, this.end - Date.now());
      if (diff <= 0) {
        clearInterval(this.timer);
        if (this.dataset.expired === 'hide' && !window.Shopify?.designMode) { this.hidden = true; return; }
        const clock = $('[data-clock]', this); if (clock) clock.hidden = true;
        const msg = $('[data-expired-msg]', this); if (msg) msg.hidden = false;
        return;
      }
      const d = Math.floor(diff / 864e5); diff -= d * 864e5;
      const h = Math.floor(diff / 36e5); diff -= h * 36e5;
      const m = Math.floor(diff / 6e4); diff -= m * 6e4;
      const vals = { days: d, hours: h, minutes: m, seconds: Math.floor(diff / 1e3) };
      Object.keys(vals).forEach((k) => { if (this.nums[k]) this.nums[k].textContent = String(vals[k]).padStart(2, '0'); });
    }
  }
  define('countdown-timer', CountdownTimer);

  /* ---------- Skin quiz ("Find your ritual") ---------- */
  class GiftFinder extends HTMLElement {
    connectedCallback() {
      this.steps = $$('[data-step]', this);
      this.dots = $$('[data-progress]', this);
      this.done = $('[data-done]', this);
      this.link = $('[data-results-link]', this);
      this.answers = [];
      this.step = 0;
      this.addEventListener('click', (e) => {
        const opt = e.target.closest('.finder__option');
        if (opt) {
          $$('.finder__option', opt.closest('[data-step]')).forEach((o) => o.classList.toggle('is-selected', o === opt));
          this.answers[this.step] = opt.dataset.param || '';
          this.show(this.step + 1);
        }
        if (e.target.closest('[data-back]')) this.show(this.step - 1);
        if (e.target.closest('[data-restart]')) {
          this.answers = [];
          $$('.is-selected', this).forEach((o) => o.classList.remove('is-selected'));
          this.show(0);
        }
      });
    }
    show(i) {
      this.step = Math.max(0, i);
      const finished = this.step >= this.steps.length;
      this.steps.forEach((s, k) => (s.hidden = finished || k !== this.step));
      this.dots.forEach((d, k) => {
        d.classList.toggle('is-current', k === this.step);
        d.classList.toggle('is-done', k < this.step);
      });
      this.done.hidden = !finished;
      if (finished) {
        const params = this.answers.slice(0, this.steps.length).filter(Boolean).join('&');
        const base = this.dataset.results;
        this.link.href = params ? `${base}${base.includes('?') ? '&' : '?'}${params}` : base;
        this.link.focus();
      } else {
        $('.finder__option', this.steps[this.step])?.focus();
      }
    }
  }
  define('gift-finder', GiftFinder);

  /* ---------- Video reviews (short-form) ---------- */
  class VideoReviews extends HTMLElement {
    connectedCallback() {
      this.screens = $$('[data-vrev-screen]', this).filter((s) => $('video', s));
      this.screens.forEach((screen) => {
        const v = $('video', screen);
        const mute = $('[data-vrev-mute]', screen);
        screen.addEventListener('click', (e) => {
          if (e.target.closest('[data-vrev-mute]')) return;
          if (v.paused) this.play(screen); else v.pause();
        });
        mute?.addEventListener('click', () => {
          const muted = !v.muted;
          if (!muted) this.screens.forEach((o) => { if (o !== screen) this.setMuted(o, true); });
          this.setMuted(screen, muted);
          if (!muted) this.play(screen);
        });
        v.addEventListener('pause', () => screen.classList.remove('is-playing'));
        v.addEventListener('play', () => screen.classList.add('is-playing'));
      });
      if (this.dataset.autoplay === 'true' && !reduceMotion && 'IntersectionObserver' in window) {
        this.io = new IntersectionObserver((entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting && en.intersectionRatio > 0.6) this.play(en.target);
            else { const v = $('video', en.target); if (v && !v.paused) v.pause(); }
          });
        }, { threshold: [0, 0.6, 1] });
        this.screens.forEach((s) => this.io.observe(s));
      }
    }
    disconnectedCallback() { this.io?.disconnect(); }
    setMuted(screen, muted) {
      const v = $('video', screen);
      const b = $('[data-vrev-mute]', screen);
      if (v) v.muted = muted;
      if (b) { b.setAttribute('aria-pressed', String(!muted)); b.setAttribute('aria-label', muted ? b.dataset.labelUnmute : b.dataset.labelMute); }
    }
    play(screen) {
      const v = $('video', screen);
      if (!v) return;
      if (v.preload === 'none') v.preload = 'metadata';
      v.play().catch(() => {});
    }
  }
  define('video-reviews', VideoReviews);

  /* ---------- Before / after ---------- */
  class BeforeAfter extends HTMLElement {
    connectedCallback() {
      const range = $('[data-ba-range]', this);
      if (!range) return;
      const set = () => this.style.setProperty('--pos', `${range.value}%`);
      range.addEventListener('input', set);
      set();
    }
  }
  define('before-after', BeforeAfter);

  /* ---------- Tabs (ingredients, rituals) ---------- */
  class TabSet extends HTMLElement {
    connectedCallback() {
      this.tabs = $$('[role="tab"]', this);
      this.fill = $('[data-tab-progress]', this);
      this.tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => this.select(i));
        tab.addEventListener('keydown', (e) => {
          const n = this.tabs.length;
          let k = null;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') k = (i + 1) % n;
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') k = (i - 1 + n) % n;
          if (e.key === 'Home') k = 0;
          if (e.key === 'End') k = n - 1;
          if (k !== null) { e.preventDefault(); this.select(k, true); }
        });
      });
    }
    select(i, focus) {
      this.tabs.forEach((t, k) => {
        const on = k === i;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      $$('[data-tab-pane]', this).forEach((p) => { p.hidden = Number(p.dataset.tabPane) !== i; });
      if (this.fill) this.fill.style.width = `${((i + 1) / this.tabs.length) * 100}%`;
      if (focus) this.tabs[i].focus();
    }
  }
  define('tab-set', TabSet);

  /* ---------- Quote slider ---------- */
  class QuoteSlider extends HTMLElement {
    connectedCallback() {
      this.slides = $$('[data-slide]', this);
      this.index = 0;
      $('[data-prev]', this)?.addEventListener('click', () => this.go(this.index - 1));
      $('[data-next]', this)?.addEventListener('click', () => this.go(this.index + 1));
    }
    go(i) {
      const n = this.slides.length;
      if (!n) return;
      this.index = (i + n) % n;
      this.slides.forEach((s, k) => { s.hidden = k !== this.index; });
    }
    goToBlock(el) { const i = this.slides.indexOf(el); if (i > -1) this.go(i); }
  }
  define('quote-slider', QuoteSlider);

  /* ---------- Shop the look (hotspots) ---------- */
  class LookBook extends HTMLElement {
    connectedCallback() {
      this.dots = $$('[data-look-dot]', this);
      this.items = $$('[data-look-item]', this);
      this.dots.forEach((dot) => dot.addEventListener('click', (e) => {
        e.stopPropagation();
        const i = Number(dot.dataset.lookDot);
        this.show(dot.getAttribute('aria-expanded') === 'true' ? -1 : i);
      }));
      this.items.forEach((item) => {
        item.addEventListener('mouseenter', () => this.show(Number(item.dataset.lookItem), true));
        item.addEventListener('mouseleave', () => this.show(-1));
      });
      this.onDoc = (e) => { if (!e.target.closest('.look__spot')) this.show(-1); };
      this.onKey = (e) => { if (e.key === 'Escape') this.show(-1); };
      document.addEventListener('click', this.onDoc);
      document.addEventListener('keydown', this.onKey);
    }
    disconnectedCallback() {
      document.removeEventListener('click', this.onDoc);
      document.removeEventListener('keydown', this.onKey);
    }
    show(i, fromList) {
      this.dots.forEach((d, k) => {
        const on = k === i;
        d.setAttribute('aria-expanded', String(on));
        const pop = d.nextElementSibling;
        if (pop) pop.hidden = !on;
      });
      this.items.forEach((it, k) => it.classList.toggle('is-active', k === i));
      if (i > -1 && !fromList && matchMedia('(max-width: 989px)').matches) this.items[i]?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }
  define('look-book', LookBook);

  /* ---------- Misc ---------- */
  document.addEventListener('click', async (e) => {
    const share = e.target.closest('[data-share]');
    if (share) {
      const data = { title: share.dataset.title, url: share.dataset.url };
      if (navigator.share) { try { await navigator.share(data); } catch (err) { /* cancelled */ } }
      else if (navigator.clipboard) { await navigator.clipboard.writeText(data.url); toast(theme.strings.copied); }
    }
    if (e.target.closest('[data-recover-toggle]')) {
      const r = $('[data-recover-panel]'); const l = $('[data-login-panel]');
      if (r && l) { r.hidden = !r.hidden; l.hidden = !r.hidden; }
    }
  });
  if (location.hash === '#recover' || $('[data-recover-success]')) {
    const r = $('[data-recover-panel]'); const l = $('[data-login-panel]');
    if (r && l) { r.hidden = false; l.hidden = true; }
  }
  $$('select[data-default]').forEach((s) => { if (s.dataset.default) s.value = s.dataset.default; });
  Wishlist.sync();

  /* ---------- Profit Pages add-ons (assets/pp-addons.js) ---------- */
  // The add-ons' script changes the cart itself; Lumière re-renders its cart and opens the drawer.
  document.addEventListener('pp:cart-updated', async () => {
    try { Cart.render(await (await fetch(`${root}/?sections=${Cart.sections().join(',')}`)).json()); } catch (e) { /* keep UI */ }
  });
  document.addEventListener('pp:added', () => Cart.afterAdd());
  document.addEventListener('pp:error', (e) => toast(e.detail?.message || theme.strings.error));
  // Picking a quantity tier sets the quantity field, so the two never disagree.
  document.addEventListener('change', (e) => {
    const t = e.target.closest('[data-pp-qb-tier]');
    if (!t) return;
    const form = document.getElementById(t.closest('[data-pp-qb]')?.dataset.form || '');
    const q = form && $('.qty__input, [name="quantity"]', form);
    if (q) q.value = t.value;
  });

  /* ---------- Theme editor ---------- */
  document.addEventListener('shopify:section:load', () => { revealAll(); Wishlist.sync(); });
  document.addEventListener('shopify:block:select', (e) => {
    e.target.closest('details')?.setAttribute('open', '');
    e.target.closest('slide-show')?.goToBlock?.(e.target);
    if (e.target.matches('[role="tab"]')) e.target.click();
    e.target.closest('quote-slider')?.goToBlock?.(e.target);
    e.target.scrollIntoView?.({ block: 'nearest', inline: 'center' });
  });
})();

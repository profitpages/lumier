/* Profit Pages product-information blocks (store-builder kit: scripts/theme-addons/product-blocks).
   Urgency countdown to the dispatch cut-off and shipping checkpoint dates, both worked out in the store's time zone
   on the shopper's clock (so a cached page never shows a stale time), plus the clickable discount code. */
(() => {
  if (window.PPProductBlocks) return;
  window.PPProductBlocks = true;
  const lang = document.documentElement.lang || undefined;
  const DAY = 86400000;

  // "+0530" → the store's wall clock as a UTC-based Date (read with getUTC*).
  const storeNow = (tz) => {
    const m = /^([+-])(\d{2})(\d{2})$/.exec(tz || '');
    const off = m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : -new Date().getTimezoneOffset();
    return new Date(Date.now() + off * 60000);
  };
  const isWeekend = (d) => d.getUTCDay() === 0 || d.getUTCDay() === 6;

  const tickUrgency = () => {
    document.querySelectorAll('[data-ppb-urgency]').forEach((el) => {
      const now = storeNow(el.dataset.tz);
      const elapsed = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
      const left = Number(el.dataset.cutoff || 0) * 3600 - elapsed;
      const open = left > 0 && !(el.dataset.weekdays === 'true' && isWeekend(now));
      const clock = el.querySelector('[data-urgency-clock]');
      if (clock && open) {
        const mins = Math.ceil(left / 60);
        clock.textContent = `${Math.floor(mins / 60)}h ${mins % 60}m`;
      }
      el.querySelector('[data-urgency-open]')?.toggleAttribute('hidden', !open);
      el.querySelector('[data-urgency-closed]')?.toggleAttribute('hidden', open);
    });
  };

  const datesFor = (list) => {
    let fmt;
    try { fmt = new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric', timeZone: 'UTC' }); } catch (e) { return; }
    const today = storeNow(list.dataset.tz);
    const skip = list.dataset.skipWeekends === 'true';
    list.querySelectorAll('[data-days]').forEach((el) => {
      let n = Number(el.dataset.days || 0);
      let d = new Date(today.getTime());
      if (skip) {
        while (n > 0) { d = new Date(d.getTime() + DAY); if (!isWeekend(d)) n -= 1; }
      } else {
        d = new Date(d.getTime() + n * DAY);
      }
      el.textContent = fmt.format(d);
    });
  };

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-ppb-apply]');
    if (!btn) return;
    const box = btn.closest('[data-ppb-code]');
    const code = box?.dataset.ppbCode;
    if (!code || btn.classList.contains('is-applied')) return;
    try { await navigator.clipboard?.writeText(code); } catch (err) { /* copying is a bonus */ }
    try {
      const root = (window.Shopify?.routes?.root || '/').replace(/\/$/, '');
      await fetch(`${root}/discount/${encodeURIComponent(code)}`, { credentials: 'same-origin' });
      if (box.dataset.appliedLabel) btn.textContent = box.dataset.appliedLabel;
      btn.classList.add('is-applied');
      btn.setAttribute('aria-pressed', 'true');
    } catch (err) { /* the code is still copied; checkout accepts it too */ }
  });

  const run = () => {
    tickUrgency();
    document.querySelectorAll('[data-ppb-steps]').forEach(datesFor);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  document.addEventListener('shopify:section:load', run);
  setInterval(tickUrgency, 20000);
  // Themes that re-render the product column on a variant change bring fresh server-side markup: localise it again.
  const SEL = '[data-ppb-urgency], [data-ppb-steps]';
  let queued = false;
  new MutationObserver((records) => {
    if (queued) return;
    const fresh = records.some((r) => [...r.addedNodes].some((n) => n.nodeType === 1 && (n.matches(SEL) || n.querySelector(SEL))));
    if (fresh) { queued = true; requestAnimationFrame(() => { queued = false; run(); }); }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();

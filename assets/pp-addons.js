/*
 * pp-addons.js: behavior for Profit Pages' theme-native add-ons.
 *
 * Our themes render bundles, quantity breaks, reviews and cart upsells in
 * their own markup and CSS, from metafields the app writes
 * (product.metafields.profitpages.*, shop.metafields.profitpages.addons).
 * This script adds only the behavior, through data attributes, so every
 * theme can look completely different. The builder copies the current
 * version into each theme it installs (assets/pp-addons.js).
 *
 * Events (on document): themes listen to refresh or open their cart.
 *   pp:cart-updated   { cart }      the cart changed (refresh drawer/count)
 *   pp:added          { items }     items were added (open the drawer)
 *   pp:error          { message }
 *
 * Markup contract (all optional; a theme uses what it renders):
 *
 * Quantity breaks, inside the product form:
 *   <div data-pp-qb data-handle="{{ product.handle }}">
 *     <input type="radio" name="pp_qb" value="2" data-pp-qb-tier data-discount="10"> ...
 *   </div>
 *   A submit of that product form with a discounted tier selected adds the
 *   tier's quantity and applies its single-use discount.
 *
 * Bundle:
 *   <div data-pp-bundle data-handle="{{ product.handle }}">
 *     <input type="checkbox" data-pp-bundle-item value="{{ variant.id }}" checked>
 *     <select data-pp-bundle-variant> (optional, per item: replaces that item's variant)
 *     <button data-pp-bundle-add>Add bundle</button>
 *   </div>
 *   Live total (optional): give items and variant options data-pp-price (cents, namespaced so themes that update [data-price] leave it alone),
 *   the wrapper data-discount-type / data-discount-value / data-money-format,
 *   and mark [data-pp-bundle-total], [data-pp-bundle-compare], [data-pp-bundle-count].
 *   The discount shows once two or more items are checked, as at checkout.
 *
 * Reviews "load more":
 *   <div data-pp-reviews data-product-id="{{ product.id }}">
 *     <div data-pp-reviews-list> ... </div>
 *     <template data-pp-review-template> markup with [data-field="author|initial|body|title|date|country|rating"]
 *       and optionally [data-field="stars"] (gets data-rating) and [data-field="photos"] </template>
 *     <button data-pp-reviews-more>More reviews</button>
 *   </div>
 *
 * Cart (inside the theme's cart drawer or page):
 *   <input type="checkbox" data-pp-protection data-variant-id="123">    shipping protection
 *   <button data-pp-add-variant="123">Add</button>                       slider "add"
 *   <span data-pp-timer data-minutes="10"></span>                         countdown (per session)
 *   <div data-pp-gift data-variant-id="123" data-threshold="10000"></div> free gift (cents)
 */
(function () {
  if (window.PPAddons) return;

  var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || "/";
  var url = function (p) { return root.replace(/\/$/, "") + p; };
  var emit = function (name, detail) { document.dispatchEvent(new CustomEvent(name, { detail: detail })); };

  function json(res) {
    if (!res.ok) return res.json().catch(function () { return {}; }).then(function (b) { throw new Error(b.description || b.message || "Request failed"); });
    return res.json();
  }
  function cartAdd(items) {
    return fetch(url("/cart/add.js"), { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ items: items }) }).then(json);
  }
  function cartGet() { return fetch(url("/cart.js"), { headers: { Accept: "application/json" } }).then(json); }
  function cartChange(id, quantity) {
    return fetch(url("/cart/change.js"), { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ id: String(id), quantity: quantity }) }).then(json);
  }
  // Applying a discount code: Shopify stores it for the checkout when this URL is visited.
  function applyDiscount(code) {
    if (!code) return Promise.reject(new Error("Your items were added, but the discount could not be applied. Please contact the store before checking out."));
    return fetch(url("/discount/" + encodeURIComponent(code)), { credentials: "same-origin", redirect: "follow" }).then(function (res) {
      if (!res.ok) throw new Error("Your items were added, but the discount could not be applied. Please contact the store before checking out.");
    });
  }
  function proxy(path, body) {
    return fetch(url("/apps/pages" + path), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(json).then(function (data) {
      if (data.success === false) throw new Error(data.error || "The offer is currently unavailable.");
      return data;
    });
  }
  function refreshed() { return cartGet().then(function (cart) { emit("pp:cart-updated", { cart: cart }); return cart; }); }

  // ── Quantity breaks ────────────────────────────────────────────────────────
  document.addEventListener("submit", function (e) {
    var form = e.target;
    if (!form || !form.matches || !form.matches('form[action*="/cart/add"]')) return;
    // Shopify's hidden input named "id" shadows HTMLFormElement.id.
    // Read the attribute so external quantity selectors find their real form.
    var formId = form.getAttribute("id");
    var qb = form.querySelector("[data-pp-qb]") || (formId && Array.prototype.find.call(document.querySelectorAll("[data-pp-qb]"), function (el) { return el.getAttribute("data-form") === formId; }));
    if (!qb) return;
    var tier = qb.querySelector("[data-pp-qb-tier]:checked");
    if (!tier) return;
    var qty = parseInt(tier.value, 10) || 1;
    var discounted = parseFloat(tier.getAttribute("data-discount") || "0") > 0;
    var idInput = form.querySelector('[name="id"]');
    if (!idInput) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (form.getAttribute("aria-busy") === "true") return;
    var variantId = idInput.value;
    // Keep what else the form carries: a subscription plan, line-item properties (engraving, notes).
    var item = { id: variantId, quantity: qty };
    var fd = new FormData(form);
    if (fd.get("selling_plan")) item.selling_plan = fd.get("selling_plan");
    var props = {};
    fd.forEach(function (v, k) {
      var m = k.match(/^properties\[(.+)\]$/);
      if (m && typeof v === "string" && v !== "") props[m[1]] = v;
    });
    if (Object.keys(props).length) item.properties = props;
    form.setAttribute("aria-busy", "true");
    var offerCode = discounted
      ? proxy("/quantity-breaks/" + encodeURIComponent(qb.getAttribute("data-handle")), { variantId: variantId, quantity: qty }).then(function (r) { if (!r.code) throw new Error("The offer is currently unavailable."); return r.code; })
      : Promise.resolve(null);
    offerCode.then(function (code) {
        return cartAdd([item]).then(function (added) { return code ? applyDiscount(code).then(function () { return added; }) : added; });
      })
      .then(function (added) { emit("pp:added", { items: added.items || [added] }); return refreshed(); })
      .catch(function (err) { emit("pp:error", { message: err.message }); })
      .then(function () { form.removeAttribute("aria-busy"); });
  }, true);

  // ── Bundles ────────────────────────────────────────────────────────────────
  function formatMoney(cents, format) {
    var fmt = format || "${{amount}}";
    // Shopify's money formats: thousands separator, decimal mark, decimals or none.
    var number = function (thousands, decimal, decimals) {
      var parts = (cents / 100).toFixed(decimals ? 2 : 0).split(".");
      return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousands) + (decimals ? decimal + parts[1] : "");
    };
    return fmt.replace(/\{\{\s*(\w+)\s*\}\}/, function (_, key) {
      if (key === "amount_no_decimals") return number(",", ".", false);
      if (key === "amount_with_comma_separator") return number(".", ",", true);
      if (key === "amount_no_decimals_with_comma_separator") return number(".", ",", false);
      if (key === "amount_with_apostrophe_separator") return number("'", ".", true);
      return number(",", ".", true);
    });
  }
  function bundleTotals(wrap) {
    var boxes = wrap.querySelectorAll("[data-pp-bundle-item]:checked");
    var total = 0;
    Array.prototype.forEach.call(boxes, function (b) { total += parseInt(b.getAttribute("data-pp-price") || "0", 10); });
    var value = parseFloat(wrap.getAttribute("data-discount-value") || "0");
    var off = 0;
    if (boxes.length >= 2 && value > 0) {
      off = wrap.getAttribute("data-discount-type") === "fixed" ? Math.round(value * 100) : Math.round(total * value / 100);
    }
    off = Math.min(off, total);
    var fmt = wrap.getAttribute("data-money-format");
    var set = function (sel, text, hide) {
      Array.prototype.forEach.call(wrap.querySelectorAll(sel), function (el) { el.textContent = text; el.hidden = Boolean(hide); });
    };
    set("[data-pp-bundle-total]", formatMoney(total - off, fmt));
    set("[data-pp-bundle-compare]", formatMoney(total, fmt), off === 0);
    set("[data-pp-bundle-count]", String(boxes.length));
    var anchor = wrap.querySelector("[data-pp-bundle-anchor]");
    Array.prototype.forEach.call(wrap.querySelectorAll("[data-pp-bundle-add]"), function (b) { b.disabled = boxes.length === 0 || Boolean(anchor && anchor.getAttribute("data-unavailable") === "true"); });
  }
  // Product pickers update their own hidden variant input. Re-read it after
  // their change handlers run, keeping tier prices and the bundle anchor in
  // sync without coupling the add-ons to any theme's custom elements.
  function syncProductOffers() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-pp-product-variants]"), function (data) {
      var wrap = data.closest("[data-pp-qb], [data-pp-bundle]");
      if (!wrap) return;
      var variants;
      try { variants = JSON.parse(data.textContent); } catch (_) { return; }
      var scope = wrap.closest(".shopify-section") || wrap.closest("section") || document;
      var form = wrap.getAttribute("data-form") && document.getElementById(wrap.getAttribute("data-form"));
      var forms = form ? [form] : scope.querySelectorAll('form[action*="/cart/add"]');
      var variant = null;
      Array.prototype.some.call(forms, function (f) {
        var input = f.querySelector('[name="id"]');
        if (!input) return false;
        variant = variants.find(function (v) { return String(v.id) === String(input.value); });
        return Boolean(variant);
      });
      if (!variant) return;
      var fmt = wrap.getAttribute("data-money-format");
      var anchor = wrap.querySelector("[data-pp-bundle-anchor]");
      if (anchor) {
        anchor.value = variant.id;
        anchor.checked = Boolean(variant.available);
        anchor.setAttribute("data-unavailable", variant.available ? "false" : "true");
        anchor.setAttribute("data-pp-price", variant.price);
        var row = anchor.closest("[data-pp-bundle-row]");
        var price = row && row.querySelector("[data-pp-bundle-price]");
        if (price) price.textContent = formatMoney(variant.price, fmt);
        bundleTotals(wrap);
      }
      Array.prototype.forEach.call(wrap.querySelectorAll("[data-pp-qb-tier]"), function (tier) {
        var qty = parseInt(tier.value, 10) || 1;
        var full = variant.price * qty;
        var value = parseFloat(tier.getAttribute("data-discount") || "0");
        var off = tier.getAttribute("data-discount-type") === "fixed" ? Math.round(value * 100) : Math.round(full * value / 100);
        off = Math.min(off, full);
        var label = tier.closest("label") || (tier.labels && tier.labels[0]);
        if (!label) return;
        var pay = label.querySelector(".pp-qb__price strong") || label.querySelector(".pp-qb__price");
        var compare = label.querySelector(".pp-qb__price s, .pp-qb__was");
        var each = label.querySelector(".pp-qb__each");
        var saving = label.querySelector(".pp-qb__save");
        if (pay) pay.textContent = formatMoney(full - off, fmt);
        if (compare) { compare.textContent = formatMoney(full, fmt); compare.hidden = !off; }
        if (each && wrap.getAttribute("data-each-format")) each.textContent = wrap.getAttribute("data-each-format").replace("__PP_PRICE__", formatMoney((full - off) / qty, fmt));
        if (saving && wrap.getAttribute("data-save-format")) saving.textContent = wrap.getAttribute("data-save-format").replace("__PP_PRICE__", formatMoney(off, fmt));
      });
    });
  }
  document.addEventListener("change", function () { setTimeout(syncProductOffers, 0); });
  document.addEventListener("variant:change", function () { setTimeout(syncProductOffers, 0); });
  document.addEventListener("variant:changed", function () { setTimeout(syncProductOffers, 0); });
  document.addEventListener("change", function (e) {
    var wrap = e.target.closest && e.target.closest("[data-pp-bundle]");
    if (!wrap) return;
    var sel = e.target.closest("[data-pp-bundle-variant]");
    if (sel) {
      var item = sel.closest("[data-pp-bundle-row]") || sel.parentElement;
      var box = item && item.querySelector("[data-pp-bundle-item]");
      var opt = sel.options[sel.selectedIndex];
      if (box) {
        box.value = sel.value;
        if (opt && opt.getAttribute("data-pp-price")) box.setAttribute("data-pp-price", opt.getAttribute("data-pp-price"));
      }
      Array.prototype.forEach.call(item ? item.querySelectorAll("[data-pp-bundle-price]") : [], function (el) {
        if (opt && opt.getAttribute("data-pp-price")) el.textContent = formatMoney(parseInt(opt.getAttribute("data-pp-price"), 10), wrap.getAttribute("data-money-format"));
      });
    }
    if (sel || e.target.matches("[data-pp-bundle-item]")) bundleTotals(wrap);
  });
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-pp-bundle-add]");
    if (!btn) return;
    var wrap = btn.closest("[data-pp-bundle]");
    if (!wrap) return;
    e.preventDefault();
    if (btn.getAttribute("aria-busy") === "true") return;
    syncProductOffers();
    if (btn.disabled) return;
    var ids = Array.prototype.map.call(wrap.querySelectorAll("[data-pp-bundle-item]:checked"), function (i) { return i.value; });
    if (!ids.length) return;
    btn.setAttribute("aria-busy", "true");
    btn.disabled = true;
    var discounted = ids.length >= 2 && parseFloat(wrap.getAttribute("data-discount-value") || "0") > 0;
    var offerCode = discounted
      ? proxy("/upsells/" + encodeURIComponent(wrap.getAttribute("data-handle")), { selectedVariantIds: ids }).then(function (r) { if (!r.code) throw new Error("The offer is currently unavailable."); return r.code; })
      : Promise.resolve(null);
    offerCode.then(function (code) {
        return cartAdd(ids.map(function (id) { return { id: id, quantity: 1 }; })).then(function (added) { return code ? applyDiscount(code).then(function () { return added; }) : added; });
      })
      .then(function (added) { emit("pp:added", { items: added.items || [] }); return refreshed(); })
      .catch(function (err) { emit("pp:error", { message: err.message }); })
      .then(function () { btn.removeAttribute("aria-busy"); bundleTotals(wrap); });
  });

  // ── Reviews: load more ─────────────────────────────────────────────────────
  function fillReview(tpl, r) {
    var node = tpl.content.firstElementChild.cloneNode(true);
    var set = function (field, value) {
      Array.prototype.forEach.call(node.querySelectorAll('[data-field="' + field + '"]'), function (el) {
        if (value == null || value === "") el.remove();
        else el.textContent = value;
      });
    };
    set("author", r.author); set("title", r.title); set("body", r.body); set("date", r.date); set("country", r.country);
    set("rating", r.rating);
    set("initial", r.author ? String(r.author).trim().charAt(0).toUpperCase() : "");
    Array.prototype.forEach.call(node.querySelectorAll('[data-field="stars"]'), function (el) {
      el.setAttribute("data-rating", r.rating);
      el.style.setProperty("--pp-rating", r.rating);
      el.style.setProperty("--pct", (Number(r.rating) || 0) * 20 + "%");
      el.setAttribute("aria-label", r.rating + " out of 5");
    });
    Array.prototype.forEach.call(node.querySelectorAll('[data-field="photos"]'), function (el) {
      if (!r.photos || !r.photos.length) { el.remove(); return; }
      r.photos.slice(0, 4).forEach(function (src) {
        var img = document.createElement("img");
        img.src = src; img.alt = ""; img.loading = "lazy";
        img.onerror = function () { if (!img.dataset.retried) { img.dataset.retried = "1"; img.src = url("/apps/pages/review-image?url=" + encodeURIComponent(src)); } };
        el.appendChild(img);
      });
    });
    return node;
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-pp-reviews-more]");
    if (!btn) return;
    var wrap = btn.closest("[data-pp-reviews]");
    var list = wrap && wrap.querySelector("[data-pp-reviews-list]");
    var tpl = wrap && wrap.querySelector("template[data-pp-review-template]");
    if (!list || !tpl) return;
    e.preventDefault();
    // The first 20 reviews are rendered by the theme from the metafield; the
    // proxy pages through all of them, 24 at a time.
    var shown = list.children.length;
    var page = Math.floor(shown / 24) + 1;
    btn.setAttribute("aria-busy", "true");
    fetch(url("/apps/pages/reviews/" + encodeURIComponent(wrap.getAttribute("data-product-id")) + "?page=" + page), { headers: { Accept: "application/json" } })
      .then(json)
      .then(function (data) {
        var items = (data.reviews || []).slice(shown % 24 || 0);
        items.forEach(function (r) { list.appendChild(fillReview(tpl, r)); });
        if (!data.hasMore) btn.hidden = true;
      })
      .catch(function () { btn.hidden = true; })
      .then(function () { btn.removeAttribute("aria-busy"); });
  });

  // ── Cart: protection, slider add, timer, free gift ─────────────────────────
  document.addEventListener("change", function (e) {
    var box = e.target.closest && e.target.closest("[data-pp-protection]");
    if (!box) return;
    var id = box.getAttribute("data-variant-id");
    box.disabled = true;
    (box.checked ? cartAdd([{ id: id, quantity: 1 }]) : cartChange(id, 0))
      .then(refreshed)
      .catch(function (err) { box.checked = !box.checked; emit("pp:error", { message: err.message }); })
      .then(function () { box.disabled = false; });
  });
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-pp-add-variant]");
    if (!btn) return;
    e.preventDefault();
    btn.disabled = true;
    cartAdd([{ id: btn.getAttribute("data-pp-add-variant"), quantity: 1 }])
      .then(function (added) { emit("pp:added", { items: added.items || [] }); return refreshed(); })
      .catch(function (err) { emit("pp:error", { message: err.message }); })
      .then(function () { btn.disabled = false; });
  });

  function startTimers(scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll("[data-pp-timer]:not([data-pp-ticking])"), function (el) {
      el.setAttribute("data-pp-ticking", "");
      var key = "pp-timer-end";
      var end = 0;
      try { end = parseInt(sessionStorage.getItem(key) || "0", 10); } catch (err) { /* Storage can be blocked; the timer still runs on this page. */ }
      if (!end || end < Date.now()) {
        end = Date.now() + (parseInt(el.getAttribute("data-minutes"), 10) || 10) * 60000;
        try { sessionStorage.setItem(key, String(end)); } catch (err) { /* Keep the countdown in memory when storage is blocked. */ }
      }
      var tick = function () {
        var left = Math.max(0, end - Date.now());
        var m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
        el.textContent = m + ":" + (s < 10 ? "0" : "") + s;
        if (left > 0 && el.isConnected) setTimeout(tick, 1000);
      };
      tick();
    });
  }

  // Free gift: add it when the cart reaches the threshold, remove it below.
  var giftBusy = false;
  function syncGift(cart) {
    var el = document.querySelector("[data-pp-gift]");
    if (!el || giftBusy || !cart) return;
    var id = el.getAttribute("data-variant-id");
    var threshold = parseInt(el.getAttribute("data-threshold"), 10) || 0;
    var line = (cart.items || []).find(function (i) { return String(i.variant_id) === String(id); });
    var subtotal = cart.items_subtotal_price - (line ? line.final_line_price : 0);
    var want = subtotal >= threshold;
    if (want === Boolean(line)) return;
    giftBusy = true;
    (want ? cartAdd([{ id: id, quantity: 1, properties: { _pp_gift: "1" } }]) : cartChange(line.key, 0))
      .then(refreshed)
      .catch(function () {})
      .then(function () { giftBusy = false; });
  }
  document.addEventListener("pp:cart-updated", function (e) { syncGift(e.detail && e.detail.cart); startTimers(); });
  document.addEventListener("DOMContentLoaded", function () { startTimers(); syncProductOffers(); });
  if (document.readyState !== "loading") { startTimers(); syncProductOffers(); }

  // The theme re-renders its cart drawer after its own cart changes (add to bag,
  // quantity, remove) without telling us. When fresh add-on markup appears,
  // start its timer and check the free gift against the new cart.
  var watchTimer;
  new MutationObserver(function (mutations) {
    var fresh = mutations.some(function (m) {
      return Array.prototype.some.call(m.addedNodes, function (n) {
        return n.nodeType === 1 && (n.matches("[data-pp-timer], [data-pp-gift], [data-pp-bundle], [data-pp-qb]") || n.querySelector("[data-pp-timer], [data-pp-gift], [data-pp-bundle], [data-pp-qb]"));
      });
    });
    if (!fresh) return;
    clearTimeout(watchTimer);
    watchTimer = setTimeout(function () {
      startTimers();
      syncProductOffers();
      if (document.querySelector("[data-pp-gift]") && !giftBusy) cartGet().then(syncGift).catch(function () {});
    }, 150);
  }).observe(document.documentElement, { childList: true, subtree: true });

  window.PPAddons = { cartAdd: cartAdd, refreshed: refreshed, startTimers: startTimers, syncGift: syncGift, formatMoney: formatMoney, bundleTotals: bundleTotals, version: 2 };
})();

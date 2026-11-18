/* AIKELO — site, winkelmandje en afrekenen */
(function () {
  'use strict';

  var CFG = window.AIKELO_CONFIG;
  var COLORS = window.AIKELO_COLORS;
  var CATS = window.AIKELO_CATEGORIES;
  var PRODUCTS = window.AIKELO_PRODUCTS;
  var CART_KEY = 'aikelo-cart-v1';

  // ---------- helpers ----------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var fmt = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
  function money(n) { return fmt.format(n).replace(/\s/g, '').replace(/,00$/, ''); }
  function money2(n) { return fmt.format(n).replace(/\s/g, ''); }
  function product(id) { for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i]; return null; }
  function img(p, color, side) { return 'img/p/' + p.img + '-' + color + '-' + (side || 'voor') + '.svg'; }
  function url(p, color) { return 'product?id=' + encodeURIComponent(p.id) + (color ? '&kleur=' + encodeURIComponent(color) : ''); }
  function store(get, key, val) {
    try { if (get) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }

  var ICONS = {
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>',
    ret: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 9h11a5 5 0 0 1 0 10H8"/><path d="M8 5L4 9l4 4"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19l8-8"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 20l4-1 11-11-3-3L5 16l-1 4z"/><path d="M14 7l3 3"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };
  window.AIKELO_ICONS = ICONS;

  // ---------- cart ----------
  var Cart = {
    items: [],
    load: function () {
      var raw = store(true, CART_KEY), list = [];
      try { list = JSON.parse(raw) || []; } catch (e) { list = []; }
      // alleen geldige regels; prijs en naam komen altijd uit de catalogus
      this.items = list.filter(function (it) {
        var p = it && product(it.id);
        return p && p.colors.indexOf(it.color) > -1 && p.sizes.indexOf(it.size) > -1 && it.qty > 0;
      }).map(function (it) { return { id: it.id, color: it.color, size: it.size, qty: Math.min(10, Math.floor(it.qty)) }; });
    },
    save: function () { store(false, CART_KEY, JSON.stringify(this.items)); renderCart(); },
    add: function (id, color, size, qty) {
      var ex = this.find(id, color, size);
      if (ex) ex.qty = Math.min(10, ex.qty + qty); else this.items.push({ id: id, color: color, size: size, qty: qty });
      this.save();
    },
    find: function (id, color, size) { return this.items.filter(function (x) { return x.id === id && x.color === color && x.size === size; })[0]; },
    setQty: function (i, q) { if (q <= 0) this.items.splice(i, 1); else this.items[i].qty = Math.min(10, q); this.save(); },
    count: function () { return this.items.reduce(function (s, x) { return s + x.qty; }, 0); },
    subtotal: function () { return this.items.reduce(function (s, x) { return s + product(x.id).price * x.qty; }, 0); },
    shipping: function () { var st = this.subtotal(); return st === 0 || st >= CFG.freeShippingFrom ? 0 : CFG.shippingCost; },
    clear: function () { this.items = []; this.save(); }
  };
  window.AIKELO_CART = Cart;

  // ---------- layout ----------
  function header() {
    // laatste stuk van het pad, zodat het ook in een submap (GitHub Pages) werkt
    var path = location.pathname.replace(/\.html$/, '').split('/').pop();
    var cat = new URLSearchParams(location.search).get('cat');
    var here = path + (path === 'shop' && cat ? '?cat=' + cat : '');
    function a(href, label) { return '<a href="' + href + '"' + (here === href ? ' aria-current="page"' : '') + '>' + label + '</a>'; }
    var announce = 'Gratis verzending vanaf ' + money(CFG.freeShippingFrom) + ' · 14 dagen bedenktijd';
    return '<div class="announce">' + esc(announce) + '</div>' +
      '<header class="site-header"><div class="wrap header-row">' +
      '<button class="icon-btn menu-btn" type="button" aria-label="Menu openen" aria-controls="nav" aria-expanded="false">' + ICONS.menu + '</button>' +
      '<nav class="nav" id="nav" aria-label="Hoofdmenu">' +
      '<button class="icon-btn nav-close" type="button" aria-label="Menu sluiten">' + ICONS.close + '</button>' +
      a('shop', 'Shop') + a('shop?cat=longsleeves', 'Longsleeves') + a('shop?cat=hoodies', 'Hoodies') + a('over', 'Over aikelo') + a('contact', 'Contact') +
      '</nav>' +
      '<a class="brand" href="./" aria-label="aikelo, naar de homepagina"><img src="img/logo.svg" alt="aikelo" width="116" height="27"></a>' +
      '<div class="header-actions"><button class="icon-btn" type="button" id="cartBtn" aria-label="Winkelmandje openen" aria-controls="cart">' + ICONS.bag + '<span class="cart-count" id="cartCount" hidden>0</span></button></div>' +
      '</div></header>';
  }

  function footer() {
    var y = new Date().getFullYear();
    return '<footer class="site-footer"><div class="wrap">' +
      '<div class="footer-grid">' +
      '<div><img class="footer-logo" src="img/logo.svg" alt="aikelo"><p>made to live in. Kleding uit eigen schetsen, gemaakt om in te leven, niet om in te bewaren.</p></div>' +
      '<div><h3>Shop</h3><ul><li><a href="shop">Alles</a></li><li><a href="shop?cat=longsleeves">Longsleeves</a></li><li><a href="shop?cat=hoodies">Hoodies</a></li><li><a href="shop?cat=zip">Zip-up hoodies</a></li></ul></div>' +
      '<div><h3>Hulp</h3><ul><li><a href="info#verzending">Verzending</a></li><li><a href="info#retour">Retourneren</a></li><li><a href="info#maten">Maattabel</a></li><li><a href="info#faq">Veelgestelde vragen</a></li></ul></div>' +
      '<div><h3>aikelo</h3><ul><li><a href="over">Over ons</a></li><li><a href="contact">Contact</a></li><li><a href="https://instagram.com/' + esc(CFG.instagram) + '" rel="noopener" target="_blank">Instagram</a></li><li><a href="voorwaarden">Voorwaarden</a></li><li><a href="privacy">Privacy</a></li></ul></div>' +
      '</div>' +
      '<div class="footer-bottom"><span>© ' + y + ' AIKELO</span><span>MADE TO LIVE IN</span></div>' +
      '</div></footer>';
  }

  function drawer() {
    return '<div class="overlay" id="overlay"></div>' +
      '<aside class="drawer" id="cart" aria-label="Winkelmandje" aria-hidden="true" tabindex="-1">' +
      '<div class="drawer-head"><h2>Winkelmandje</h2><button class="icon-btn" type="button" data-close-cart aria-label="Winkelmandje sluiten">' + ICONS.close + '</button></div>' +
      '<div class="drawer-body" id="cartBody"></div>' +
      '<div class="drawer-foot" id="cartFoot"></div>' +
      '</aside>' +
      '<div class="toast" id="toast" role="status" aria-live="polite"></div>';
  }

  function lineItemHTML(it, i, editable) {
    var p = product(it.id);
    return '<div class="line-item">' +
      '<a class="line-thumb" href="' + url(p, it.color) + '"><img src="' + img(p, it.color, 'achter') + '" alt="" loading="lazy"></a>' +
      '<div><a class="line-name" href="' + url(p, it.color) + '">' + esc(p.name) + '</a>' +
      '<div class="line-meta">' + esc(COLORS[it.color].name) + ' · maat ' + esc(it.size) + (editable ? '' : ' · ' + it.qty + '×') + '</div>' +
      (editable ? '<div class="qty"><button type="button" data-dec="' + i + '" aria-label="Eén minder">−</button><span aria-label="Aantal">' + it.qty + '</span><button type="button" data-inc="' + i + '" aria-label="Eén meer">+</button></div>' +
        '<button class="remove" type="button" data-rm="' + i + '">Verwijderen</button>' : '') +
      '</div>' +
      '<div class="line-price">' + money(p.price * it.qty) + '</div>' +
      '</div>';
  }
  window.AIKELO_LINE = lineItemHTML;

  function renderCart() {
    var count = Cart.count();
    var badge = $('#cartCount');
    if (badge) { badge.textContent = count; badge.hidden = count === 0; }
    var cb = $('#cartBtn'); if (cb) cb.setAttribute('aria-label', 'Winkelmandje openen, ' + count + ' artikel' + (count === 1 ? '' : 'en'));
    var body = $('#cartBody'), foot = $('#cartFoot');
    if (!body) return;
    if (!Cart.items.length) {
      body.innerHTML = '<div class="empty"><p>Je winkelmandje is nog leeg.</p><a class="btn" href="shop">Naar de shop</a></div>';
      foot.innerHTML = '';
    } else {
      body.innerHTML = Cart.items.map(function (it, i) { return lineItemHTML(it, i, true); }).join('');
      var st = Cart.subtotal(), left = CFG.freeShippingFrom - st;
      var pct = Math.min(100, Math.round(st / CFG.freeShippingFrom * 100));
      foot.innerHTML =
        '<div class="ship-bar">' + (left > 0 ? 'Nog ' + money2(left) + ' tot gratis verzending' : 'Je bestelling wordt gratis verzonden') + '<div class="bar"><i style="width:' + pct + '%"></i></div></div>' +
        '<div class="totals"><div><span>Subtotaal</span><span>' + money2(st) + '</span></div>' +
        '<div><span>Verzending</span><span>' + (Cart.shipping() ? money2(Cart.shipping()) : 'Gratis') + '</span></div>' +
        '<div class="grand"><span>Totaal</span><span>' + money2(st + Cart.shipping()) + '</span></div></div>' +
        '<a class="btn block" href="afrekenen">Afrekenen</a>';
    }
    document.dispatchEvent(new CustomEvent('cart:change'));
  }

  var lastFocus = null;
  function openCart() {
    lastFocus = document.activeElement;
    $('#cart').classList.add('open'); $('#cart').setAttribute('aria-hidden', 'false');
    $('#overlay').classList.add('show'); document.body.style.overflow = 'hidden';
    setTimeout(function () { $('#cart [data-close-cart]').focus(); }, 50);
  }
  function closeCart() {
    $('#cart').classList.remove('open'); $('#cart').setAttribute('aria-hidden', 'true');
    $('#overlay').classList.remove('show'); document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  window.AIKELO_OPEN_CART = openCart;

  var toastTimer;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  window.AIKELO_TOAST = toast;

  // ---------- product card ----------
  function card(p, color) {
    color = color || p.colors[0];
    return '<a class="card reveal" href="' + url(p, color) + '">' +
      '<div class="card-media">' + (p.isNew ? '<span class="tag">Nieuw</span>' : '') +
      '<img class="front" src="' + img(p, color, 'voor') + '" alt="' + esc(p.name + ' in ' + COLORS[color].name + ', voorkant') + '" loading="lazy">' +
      '<img class="back" src="' + img(p, color, 'achter') + '" alt="" loading="lazy"></div>' +
      '<div class="card-body"><div class="card-title"><span>' + esc(p.name) + '</span><span>' + money(p.price) + '</span></div>' +
      '<div class="card-sub">' + esc(CATS[p.cat].name) + ' · ' + p.colors.length + ' kleuren</div>' +
      '<div class="dots" aria-hidden="true">' + p.colors.map(function (c) { return '<span class="dot" style="background:' + COLORS[c].hex + '"></span>'; }).join('') + '</div>' +
      '</div></a>';
  }
  window.AIKELO_CARD = card;

  function observeReveals() {
    var els = $$('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (e) { io.observe(e); });
  }
  window.AIKELO_REVEAL = observeReveals;

  // ---------- init ----------
  function init() {
    Cart.load();
    var h = $('#site-header'); if (h) h.outerHTML = header();
    var f = $('#site-footer'); if (f) f.outerHTML = footer();
    document.body.insertAdjacentHTML('beforeend', drawer());
    renderCart();

    $('#cartBtn').addEventListener('click', openCart);
    $('#overlay').addEventListener('click', function () { closeCart(); closeNav(); });
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-close-cart],[data-inc],[data-dec],[data-rm]');
      if (!t) return;
      if (t.hasAttribute('data-close-cart')) return closeCart();
      var i;
      if ((i = t.getAttribute('data-inc')) !== null) Cart.setQty(+i, Cart.items[+i].qty + 1);
      else if ((i = t.getAttribute('data-dec')) !== null) Cart.setQty(+i, Cart.items[+i].qty - 1);
      else if ((i = t.getAttribute('data-rm')) !== null) Cart.setQty(+i, 0);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if ($('#cart').classList.contains('open')) closeCart();
      closeNav();
      $$('.modal.show').forEach(function (m) { m.classList.remove('show'); });
    });

    var nav = $('#nav'), mb = $('.menu-btn');
    function closeNav() { if (nav.classList.contains('open')) { nav.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); if (!$('#cart').classList.contains('open')) $('#overlay').classList.remove('show'); } }
    mb.addEventListener('click', function () { nav.classList.add('open'); mb.setAttribute('aria-expanded', 'true'); $('#overlay').classList.add('show'); $('.nav-close').focus(); });
    $('.nav-close').addEventListener('click', closeNav);

    var sh = $('.site-header');
    window.addEventListener('scroll', function () { sh.classList.toggle('scrolled', window.scrollY > 4); }, { passive: true });

    // andere tabbladen
    window.addEventListener('storage', function (e) { if (e.key === CART_KEY) { Cart.load(); renderCart(); } });

    var page = document.body.getAttribute('data-page');
    if (page && window.AIKELO_PAGES && window.AIKELO_PAGES[page]) window.AIKELO_PAGES[page]();
    observeReveals();
  }

  window.AIKELO = { $: $, $$: $$, esc: esc, money: money, money2: money2, product: product, img: img, url: url, store: store };
  window.AIKELO_PAGES = window.AIKELO_PAGES || {};
  // scripts worden met defer geladen; DOMContentLoaded komt pas na pages.js
  if (document.readyState === 'complete') init(); else document.addEventListener('DOMContentLoaded', init);
})();

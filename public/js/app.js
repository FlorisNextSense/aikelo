/* AIKELO — site, winkelmandje, wishlist, zoeken en afrekenen */
(function () {
  'use strict';

  var CFG = window.AIKELO_CONFIG;
  var COLORS = window.AIKELO_COLORS;
  var CATS = window.AIKELO_CATEGORIES;
  var PRODUCTS = window.AIKELO_PRODUCTS;
  var CART_KEY = 'aikelo-cart-v1';
  var WISH_KEY = 'aikelo-wishlist-v1';

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
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
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

  // ---------- wishlist ----------
  var Wish = {
    ids: [],
    load: function () {
      var list = [];
      try { list = JSON.parse(store(true, WISH_KEY)) || []; } catch (e) { list = []; }
      this.ids = list.filter(function (id) { return typeof id === 'string' && product(id); });
    },
    has: function (id) { return this.ids.indexOf(id) > -1; },
    toggle: function (id) {
      var on = !this.has(id);
      if (on) this.ids.push(id); else this.ids.splice(this.ids.indexOf(id), 1);
      store(false, WISH_KEY, JSON.stringify(this.ids));
      renderWish();
      return on;
    },
    products: function () { return this.ids.map(product).filter(Boolean); }
  };
  window.AIKELO_WISH = Wish;

  function renderWish() {
    var n = Wish.ids.length;
    $$('[data-wish-count]').forEach(function (el) { el.textContent = n; });
    $$('[data-wish]').forEach(function (b) {
      var on = Wish.has(b.getAttribute('data-wish'));
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    document.dispatchEvent(new CustomEvent('wish:change'));
  }

  // ---------- layout ----------
  function ticker() {
    var items = ['Gratis verzending vanaf ' + money(CFG.freeShippingFrom), '14 dagen bedenktijd', 'Collectie No. 1 nu live', 'made to live in'];
    var run = items.map(function (t) { return '<span>' + esc(t) + '</span><span aria-hidden="true">·</span>'; }).join('');
    return '<div class="ticker"><p class="sr-only">' + esc(items.join(' · ')) + '</p>' +
      '<div class="ticker-track" aria-hidden="true">' + run + run + run + run + '</div></div>';
  }

  function header() {
    // laatste stuk van het pad, zodat het ook in een submap (GitHub Pages) werkt
    var path = location.pathname.replace(/\.html$/, '').split('/').pop();
    var here = (path === '' || path === 'index') ? './' : path;
    function a(href, label) { return '<a href="' + href + '"' + (here === href ? ' aria-current="page"' : '') + '>' + label + '</a>'; }
    return '<div class="topbar">' + ticker() +
      '<header class="site-header"><div class="header-row">' +
      '<button class="icon-btn menu-btn" type="button" aria-label="Menu openen" aria-controls="nav" aria-expanded="false">' + ICONS.menu + '</button>' +
      '<nav class="nav" id="nav" aria-label="Hoofdmenu">' +
      '<button class="icon-btn nav-close" type="button" aria-label="Menu sluiten">' + ICONS.close + '</button>' +
      a('./', 'Home') + a('shop', 'Kleding') + a('lookbook', 'Lookbook') + a('over', 'Over aikelo') + a('contact', 'Contact') +
      '</nav>' +
      '<a class="brand" href="./" aria-label="aikelo, naar de homepagina"><img src="img/logo.svg" alt="aikelo" width="116" height="27"></a>' +
      '<div class="header-actions">' +
      '<button class="hd-btn" type="button" id="searchBtn" aria-label="Zoeken" aria-controls="search">' + ICONS.search + '<span class="hd-label">Zoeken</span></button>' +
      '<a class="hd-btn" href="wishlist" aria-label="Wishlist">' + ICONS.heart + '<span class="hd-label">Wishlist</span><span class="hd-count" data-wish-count>0</span></a>' +
      '<button class="hd-btn" type="button" id="cartBtn" aria-label="Winkelmandje openen" aria-controls="cart">' + ICONS.bag + '<span class="hd-label">Mandje</span><span class="hd-count" id="cartCount">0</span></button>' +
      '</div>' +
      '</div></header></div>';
  }

  function footer() {
    var y = new Date().getFullYear();
    var insta = 'https://instagram.com/' + encodeURIComponent(CFG.instagram);
    function col(title, links) {
      return '<div class="footer-col"><h3>' + title + '</h3><ul>' + links.map(function (l) {
        return '<li><a href="' + l[0] + '"' + (l[2] ? ' target="_blank" rel="noopener"' : '') + '>' + l[1] + '</a></li>';
      }).join('') + '</ul></div>';
    }
    return '<footer class="site-footer"><div class="footer-inner">' +
      '<div class="footer-brand">' +
      '<a href="./" aria-label="aikelo, naar de homepagina"><img class="footer-logo" src="img/logo.svg" alt="aikelo"></a>' +
      '<div class="socials">' +
      '<a href="' + insta + '" target="_blank" rel="noopener" aria-label="aikelo op Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg></a>' +
      '<a href="mailto:' + esc(CFG.email) + '" aria-label="Mail aikelo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/></svg></a>' +
      '</div></div>' +
      '<div class="footer-cols">' +
      col('Kleding', [['shop', 'Alles'], ['shop?cat=hoodies', 'Hoodies'], ['shop?cat=longsleeves', 'Longsleeves'], ['lookbook', 'Lookbook']]) +
      col('Aikelo', [['over', 'Over ons'], ['wishlist', 'Wishlist'], [insta, 'Instagram', true]]) +
      col('Saaie dingen', [['info#retour', 'Retourneren &amp; ruilen'], ['voorwaarden', 'Voorwaarden'], ['privacy', 'Privacy']]) +
      col('Hulp', [['info#verzending', 'Verzending'], ['info#maten', 'Maattabel'], ['info#faq', 'Veelgestelde vragen'], ['contact', 'Contact']]) +
      '</div>' +
      '<p class="footer-copy">© ' + y + ' Aikelo · made to live in</p>' +
      '</div></footer>';
  }

  function overlays() {
    return '<div class="overlay" id="overlay"></div>' +
      '<aside class="drawer" id="cart" aria-label="Winkelmandje" aria-hidden="true" tabindex="-1">' +
      '<div class="drawer-head"><h2>Winkelmandje</h2><button class="icon-btn" type="button" data-close-cart aria-label="Winkelmandje sluiten">' + ICONS.close + '</button></div>' +
      '<div class="drawer-body" id="cartBody"></div>' +
      '<div class="drawer-foot" id="cartFoot"></div>' +
      '</aside>' +
      '<div class="search-panel" id="search" role="dialog" aria-modal="true" aria-label="Zoeken" aria-hidden="true">' +
      '<div class="search-inner"><div class="search-bar">' + ICONS.search +
      '<label class="sr-only" for="searchInput">Zoek in de kleding</label>' +
      '<input id="searchInput" type="search" placeholder="Zoek op hoodie, longsleeve, kleur…" autocomplete="off">' +
      '<button class="icon-btn" type="button" id="searchClose" aria-label="Zoeken sluiten">' + ICONS.close + '</button></div>' +
      '<div class="search-results" id="searchResults" aria-live="polite"></div></div></div>' +
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
    if (badge) badge.textContent = count;
    var cb = $('#cartBtn'); if (cb) cb.setAttribute('aria-label', 'Winkelmandje openen, ' + count + ' artikel' + (count === 1 ? '' : 'en'));
    var body = $('#cartBody'), foot = $('#cartFoot');
    if (!body) return;
    if (!Cart.items.length) {
      body.innerHTML = '<div class="empty"><p>Je winkelmandje is nog leeg.</p><a class="btn" href="shop">Naar de kleding</a></div>';
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
  function lockScroll(on) { document.body.style.overflow = on ? 'hidden' : ''; }
  function openCart() {
    lastFocus = document.activeElement;
    $('#cart').classList.add('open'); $('#cart').setAttribute('aria-hidden', 'false');
    $('#overlay').classList.add('show'); lockScroll(true);
    setTimeout(function () { $('#cart [data-close-cart]').focus(); }, 50);
  }
  function closeCart() {
    if (!$('#cart').classList.contains('open')) return;
    $('#cart').classList.remove('open'); $('#cart').setAttribute('aria-hidden', 'true');
    $('#overlay').classList.remove('show'); lockScroll(false);
    if (lastFocus) lastFocus.focus();
  }
  window.AIKELO_OPEN_CART = openCart;

  // ---------- zoeken ----------
  function searchResults(q) {
    var box = $('#searchResults');
    q = q.trim().toLowerCase();
    var list = PRODUCTS.filter(function (p) {
      if (!q) return true;
      var hay = [p.name, CATS[p.cat].name, COLORS[p.colors[0]].name, p.short].join(' ').toLowerCase();
      return q.split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; });
    });
    box.innerHTML = (q ? '<p class="search-count">' + list.length + ' resultat' + (list.length === 1 ? '' : 'en') + '</p>' : '<p class="search-count">Alle kleding</p>') +
      (list.length ? '<div class="search-grid">' + list.map(function (p) {
        var c = p.colors[0];
        return '<a class="search-item" href="' + url(p, c) + '"><span class="search-thumb"><img src="' + img(p, c, 'achter') + '" alt="" loading="lazy"></span>' +
          '<span><b>' + esc(p.name) + '</b><small>' + esc(CATS[p.cat].name) + ' · ' + esc(COLORS[c].name) + ' · ' + money(p.price) + '</small></span></a>';
      }).join('') + '</div>' : '<p class="note">Niets gevonden. Probeer “hoodie”, “streep” of een kleur zoals “groen”.</p>');
  }
  function openSearch() {
    lastFocus = document.activeElement;
    var s = $('#search'); s.classList.add('open'); s.setAttribute('aria-hidden', 'false');
    $('#overlay').classList.add('show'); lockScroll(true);
    searchResults($('#searchInput').value);
    setTimeout(function () { $('#searchInput').focus(); }, 50);
  }
  function closeSearch() {
    var s = $('#search'); if (!s.classList.contains('open')) return;
    s.classList.remove('open'); s.setAttribute('aria-hidden', 'true');
    $('#overlay').classList.remove('show'); lockScroll(false);
    if (lastFocus) lastFocus.focus();
  }

  var toastTimer;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  window.AIKELO_TOAST = toast;

  // ---------- product card ----------
  function wishBtn(p, extraClass) {
    var on = Wish.has(p.id);
    return '<button class="wish-btn' + (extraClass ? ' ' + extraClass : '') + (on ? ' on' : '') + '" type="button" data-wish="' + esc(p.id) + '" aria-pressed="' + on + '" aria-label="' + esc(p.name + ' in ' + COLORS[p.colors[0]].name) + ' bewaren in je wishlist">' + ICONS.heart + '</button>';
  }
  window.AIKELO_WISH_BTN = wishBtn;

  function card(p, color) {
    color = color || p.colors[0];
    return '<div class="card reveal">' +
      '<a class="card-link" href="' + url(p, color) + '">' +
      '<div class="card-media">' + (p.isNew ? '<span class="tag">Nieuw</span>' : '') +
      '<img class="front" src="' + img(p, color, 'voor') + '" alt="' + esc(p.name + ' in ' + COLORS[color].name + ', voorkant') + '" loading="lazy">' +
      '<img class="back" src="' + img(p, color, 'achter') + '" alt="" loading="lazy"></div>' +
      '<div class="card-body"><div class="card-title"><span>' + esc(p.name) + '</span><span>' + money(p.price) + '</span></div>' +
      '<div class="card-sub">' + esc(CATS[p.cat].name) + ' · ' + esc(COLORS[color].name) + '</div>' +
      '</div></a>' + wishBtn(p) + '</div>';
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
    Cart.load(); Wish.load();
    var h = $('#site-header'); if (h) h.outerHTML = header();
    var f = $('#site-footer'); if (f) f.outerHTML = footer();
    document.body.insertAdjacentHTML('beforeend', overlays());
    renderCart();

    $('#cartBtn').addEventListener('click', openCart);
    $('#searchBtn').addEventListener('click', openSearch);
    $('#searchClose').addEventListener('click', closeSearch);
    $('#searchInput').addEventListener('input', function (e) { searchResults(e.target.value); });
    $('#overlay').addEventListener('click', function () { closeCart(); closeNav(); closeSearch(); });
    document.addEventListener('click', function (e) {
      var w = e.target.closest('[data-wish]');
      if (w) {
        e.preventDefault();
        var p = product(w.getAttribute('data-wish'));
        var on = Wish.toggle(p.id);
        toast(on ? p.name + ' (' + COLORS[p.colors[0]].name + ') staat in je wishlist' : 'Uit je wishlist gehaald');
        return;
      }
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
      closeCart(); closeNav(); closeSearch();
      $$('.modal.show').forEach(function (m) { m.classList.remove('show'); });
    });

    var nav = $('#nav'), mb = $('.menu-btn');
    // menu-open tilt de header boven de donkere overlay, anders valt die over het menu heen
    function closeNav() { if (nav.classList.contains('open')) { nav.classList.remove('open'); $('.topbar').classList.remove('menu-open'); mb.setAttribute('aria-expanded', 'false'); $('#overlay').classList.remove('show'); lockScroll(false); } }
    mb.addEventListener('click', function () { nav.classList.add('open'); $('.topbar').classList.add('menu-open'); mb.setAttribute('aria-expanded', 'true'); $('#overlay').classList.add('show'); lockScroll(true); $('.nav-close').focus(); });
    $('.nav-close').addEventListener('click', closeNav);

    // header: transparant over de hero, vast zodra je scrolt
    var top = $('.topbar'), hasHero = document.body.classList.contains('has-hero');
    function onScroll() { top.classList.toggle('solid', !hasHero || window.scrollY > 40); top.classList.toggle('scrolled', window.scrollY > 4); }
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

    // andere tabbladen
    window.addEventListener('storage', function (e) {
      if (e.key === CART_KEY) { Cart.load(); renderCart(); }
      if (e.key === WISH_KEY) { Wish.load(); renderWish(); }
    });

    var page = document.body.getAttribute('data-page');
    if (page && window.AIKELO_PAGES && window.AIKELO_PAGES[page]) window.AIKELO_PAGES[page]();
    renderWish();
    observeReveals();
  }

  window.AIKELO = { $: $, $$: $$, esc: esc, money: money, money2: money2, product: product, img: img, url: url, store: store };
  window.AIKELO_PAGES = window.AIKELO_PAGES || {};
  // scripts worden met defer geladen; DOMContentLoaded komt pas na pages.js
  if (document.readyState === 'complete') init(); else document.addEventListener('DOMContentLoaded', init);
})();

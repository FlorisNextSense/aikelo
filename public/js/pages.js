/* AIKELO — logica per pagina */
(function () {
  'use strict';
  var P = window.AIKELO_PAGES = window.AIKELO_PAGES || {};
  function A() { return window.AIKELO; }
  var CFG = window.AIKELO_CONFIG, COLORS = window.AIKELO_COLORS, CATS = window.AIKELO_CATEGORIES, PRODUCTS = window.AIKELO_PRODUCTS;
  function qs(name) { return new URLSearchParams(location.search).get(name); }

  // ---------- home ----------
  P.home = function () {
    var a = A();
    var picks = ['longsleeve-echo', 'hoodie-holle-letters', 'longsleeve-stuiterend', 'zip-verticaal'];
    var colors = { 'longsleeve-echo': 'wit', 'hoodie-holle-letters': 'navy', 'longsleeve-stuiterend': 'bordeaux', 'zip-verticaal': 'grijs' };
    a.$('#featured').innerHTML = picks.map(function (id) { return window.AIKELO_CARD(a.product(id), colors[id]); }).join('');
  };

  // ---------- shop ----------
  P.shop = function () {
    var a = A(), grid = a.$('#grid'), cat = qs('cat') || 'all', color = qs('kleur') || 'all', sort = 'featured';
    if (cat !== 'all' && !CATS[cat]) cat = 'all';
    if (color !== 'all' && !COLORS[color]) color = 'all';

    var catBar = a.$('#catFilters');
    catBar.innerHTML = [['all', 'Alles']].concat(Object.keys(CATS).map(function (k) { return [k, CATS[k].name]; }))
      .map(function (c) { return '<button class="chip" type="button" data-cat="' + c[0] + '">' + a.esc(c[1]) + '</button>'; }).join('');
    var usedColors = [];
    PRODUCTS.forEach(function (p) { p.colors.forEach(function (c) { if (usedColors.indexOf(c) < 0) usedColors.push(c); }); });
    var sel = a.$('#colorFilter');
    sel.innerHTML = '<option value="all">Alle kleuren</option>' + usedColors.map(function (c) { return '<option value="' + c + '">' + COLORS[c].name + '</option>'; }).join('');

    function render() {
      var list = PRODUCTS.filter(function (p) { return (cat === 'all' || p.cat === cat) && (color === 'all' || p.colors.indexOf(color) > -1); });
      if (sort === 'low') list = list.slice().sort(function (x, y) { return x.price - y.price; });
      if (sort === 'high') list = list.slice().sort(function (x, y) { return y.price - x.price; });
      if (sort === 'new') list = list.slice().sort(function (x, y) { return (y.isNew ? 1 : 0) - (x.isNew ? 1 : 0); });
      grid.innerHTML = list.length ? list.map(function (p) { return window.AIKELO_CARD(p, color !== 'all' ? color : null); }).join('')
        : '<p class="note">Geen producten gevonden in deze combinatie.</p>';
      a.$$('[data-cat]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-cat') === cat)); });
      a.$('#shopTitle').textContent = cat === 'all' ? 'Alle kleding' : CATS[cat].name;
      a.$('#shopLead').textContent = cat === 'all' ? 'Longsleeves, hoodies en zip-ups uit onze eerste collectie. Elk ontwerp begon als schets.' : CATS[cat].blurb;
      a.$('#count').textContent = list.length + ' product' + (list.length === 1 ? '' : 'en');
      document.title = (cat === 'all' ? 'Shop' : CATS[cat].name) + ' · AIKELO';
      sel.value = color;
      var params = new URLSearchParams();
      if (cat !== 'all') params.set('cat', cat);
      if (color !== 'all') params.set('kleur', color);
      history.replaceState(null, '', 'shop' + (params.toString() ? '?' + params : ''));
      window.AIKELO_REVEAL();
    }
    catBar.addEventListener('click', function (e) { var b = e.target.closest('[data-cat]'); if (b) { cat = b.getAttribute('data-cat'); render(); } });
    sel.addEventListener('change', function () { color = sel.value; render(); });
    a.$('#sort').addEventListener('change', function (e) { sort = e.target.value; render(); });
    render();
  };

  // ---------- product ----------
  P.product = function () {
    var a = A(), p = a.product(qs('id'));
    var root = a.$('#pdp');
    if (!p) {
      root.innerHTML = '<div class="thanks"><h1 style="font-size:40px">Niet gevonden</h1><p class="lead" style="margin:16px auto 28px">Dit product bestaat niet (meer).</p><a class="btn" href="shop">Naar de shop</a></div>';
      return;
    }
    var color = p.colors.indexOf(qs('kleur')) > -1 ? qs('kleur') : p.colors[0];
    var size = null, qty = 1;
    document.title = p.name + ' · AIKELO';
    var md = document.querySelector('meta[name="description"]'); if (md) md.setAttribute('content', p.short);

    var I = window.AIKELO_ICONS;
    root.innerHTML =
      '<nav class="crumbs" aria-label="Kruimelpad"><a href="./">Home</a><span aria-hidden="true">/</span><a href="shop?cat=' + p.cat + '">' + a.esc(CATS[p.cat].name) + '</a><span aria-hidden="true">/</span><span aria-current="page">' + a.esc(p.name) + '</span></nav>' +
      '<div class="pdp">' +
      '<div class="gallery" id="gallery">' +
      '<figure data-zoom="voor"><img id="imgFront" alt=""><figcaption>Voorkant</figcaption></figure>' +
      '<figure data-zoom="achter"><img id="imgBack" alt=""><figcaption>Achterkant</figcaption></figure>' +
      '</div>' +
      '<div class="buybox">' +
      '<p class="eyebrow">' + a.esc(CATS[p.cat].name) + ' · No. ' + a.esc(p.code) + '</p>' +
      '<h1>' + a.esc(p.name) + '</h1>' +
      '<div class="price">' + a.money(p.price) + ' <small>incl. btw</small></div>' +
      '<p>' + a.esc(p.short) + '</p>' +
      '<form id="buyForm" novalidate>' +
      '<fieldset class="opt"><legend>Kleur <b id="colorName"></b></legend><div class="swatches">' +
      p.colors.map(function (c) { return '<label class="swatch" title="' + COLORS[c].name + '"><input type="radio" name="color" value="' + c + '"' + (c === color ? ' checked' : '') + '><span style="background:' + COLORS[c].hex + '"></span><span class="sr-only">' + COLORS[c].name + '</span></label>'; }).join('') +
      '</div></fieldset>' +
      '<fieldset class="opt"><legend>Maat <button type="button" class="size-guide-btn" id="sizeGuideBtn">Maattabel</button></legend><div class="sizes">' +
      p.sizes.map(function (s) { return '<label class="size"><input type="radio" name="size" value="' + s + '"><span>' + s + '</span></label>'; }).join('') +
      '</div></fieldset>' +
      '<p class="form-msg" id="buyMsg" role="alert"></p>' +
      '<div class="buy-row"><div class="qty"><button type="button" id="qMinus" aria-label="Eén minder">−</button><output id="qVal" aria-label="Aantal">1</output><button type="button" id="qPlus" aria-label="Eén meer">+</button></div>' +
      '<button class="btn" type="submit">In winkelmandje</button></div>' +
      '</form>' +
      '<ul class="perks">' +
      '<li>' + I.truck + 'Verzonden binnen ' + a.esc(CFG.deliveryText) + ', gratis vanaf ' + a.money(CFG.freeShippingFrom) + '</li>' +
      '<li>' + I.ret + '14 dagen bedenktijd, ruilen kan</li>' +
      '<li>' + I.pen + 'Ontworpen uit eigen schetsen</li>' +
      '</ul>' +
      '<div class="accs">' +
      '<details class="acc" open><summary>Beschrijving</summary><div class="acc-body">' + a.esc(p.desc) + '</div></details>' +
      '<details class="acc"><summary>Pasvorm &amp; materiaal</summary><div class="acc-body">' + (p.cat === 'longsleeves'
        ? 'Normale pasvorm, valt recht. Zwaar katoen dat zachter wordt naarmate je hem vaker draagt. Twijfel je tussen twee maten? Neem je normale maat.'
        : 'Ruime, wat oversized pasvorm met verlaagde schouders. Zacht en warm aan de binnenkant. Wil je hem minder ruim? Neem een maat kleiner.') + ' Bekijk de <a href="info#maten">maattabel</a>.</div></details>' +
      '<details class="acc"><summary>Wassen</summary><div class="acc-body">Binnenstebuiten wassen op 30 graden, niet in de droger, niet strijken op de print. Zo blijft de print het langst mooi.</div></details>' +
      '<details class="acc"><summary>Verzenden &amp; retour</summary><div class="acc-body">We versturen binnen ' + a.esc(CFG.deliveryText) + ' met track &amp; trace. Verzending kost ' + a.money2(CFG.shippingCost) + ', en is gratis vanaf ' + a.money(CFG.freeShippingFrom) + '. Past het niet? Je hebt 14 dagen om te ruilen of te retourneren. <a href="info#retour">Meer info</a>.</div></details>' +
      '</div>' +
      '</div></div>' +
      '<section class="section tight"><div class="section-head"><h2>Misschien ook iets</h2><a class="link" href="shop">Alles bekijken</a></div><div class="grid" id="related"></div></section>' +
      sizeGuideModal() +
      '<div class="modal" id="zoomModal" role="dialog" aria-modal="true" aria-label="Vergroot"><div class="zoom-card"><img id="zoomImg" alt=""><button class="icon-btn" type="button" data-close-modal aria-label="Sluiten">' + I.close + '</button></div></div>';

    function update() {
      a.$('#imgFront').src = a.img(p, color, 'voor'); a.$('#imgFront').alt = p.name + ' in ' + COLORS[color].name + ', voorkant';
      a.$('#imgBack').src = a.img(p, color, 'achter'); a.$('#imgBack').alt = p.name + ' in ' + COLORS[color].name + ', achterkant';
      a.$('#colorName').textContent = COLORS[color].name;
      history.replaceState(null, '', a.url(p, color));
    }
    update();
    // afbeeldingen van andere kleuren alvast laden
    p.colors.forEach(function (c) { new Image().src = a.img(p, c, 'voor'); });

    a.$('#buyForm').addEventListener('change', function (e) {
      if (e.target.name === 'color') { color = e.target.value; update(); }
      if (e.target.name === 'size') { size = e.target.value; a.$('#buyMsg').textContent = ''; }
    });
    a.$('#qMinus').addEventListener('click', function () { qty = Math.max(1, qty - 1); a.$('#qVal').textContent = qty; });
    a.$('#qPlus').addEventListener('click', function () { qty = Math.min(10, qty + 1); a.$('#qVal').textContent = qty; });
    a.$('#buyForm').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!size) { a.$('#buyMsg').textContent = 'Kies eerst je maat.'; a.$('.sizes input').focus(); return; }
      window.AIKELO_CART.add(p.id, color, size, qty);
      window.AIKELO_TOAST(qty + '× ' + p.name + ' (' + COLORS[color].name + ', ' + size + ') toegevoegd');
      window.AIKELO_OPEN_CART();
    });

    var guide = a.$('#sizeModal');
    a.$('#sizeGuideBtn').addEventListener('click', function () { guide.classList.add('show'); guide.querySelector('[data-close-modal]').focus(); });
    var zoom = a.$('#zoomModal');
    a.$('#gallery').addEventListener('click', function (e) {
      var f = e.target.closest('[data-zoom]'); if (!f) return;
      a.$('#zoomImg').src = a.img(p, color, f.getAttribute('data-zoom')); a.$('#zoomImg').alt = f.querySelector('img').alt;
      zoom.classList.add('show'); zoom.querySelector('[data-close-modal]').focus();
    });
    document.addEventListener('click', function (e) {
      var m = e.target.closest('.modal');
      if (m && (e.target === m || e.target.closest('[data-close-modal]'))) m.classList.remove('show');
    });

    var related = PRODUCTS.filter(function (x) { return x.id !== p.id; })
      .sort(function (x, y) { return (y.cat === p.cat) - (x.cat === p.cat); }).slice(0, 4);
    a.$('#related').innerHTML = related.map(function (x) { return window.AIKELO_CARD(x); }).join('');
  };

  function sizeGuideModal() {
    var I = window.AIKELO_ICONS;
    return '<div class="modal" id="sizeModal" role="dialog" aria-modal="true" aria-labelledby="sgTitle"><div class="modal-card">' +
      '<button class="icon-btn" type="button" data-close-modal aria-label="Sluiten">' + I.close + '</button>' +
      '<h2 id="sgTitle" style="font-size:22px;margin-bottom:16px">Maattabel</h2>' + sizeTables() + '</div></div>';
  }
  function sizeTables() {
    function t(title, rows) {
      return '<h3 style="font-size:14px;letter-spacing:.2em;text-transform:uppercase;margin:18px 0 8px">' + title + '</h3><div class="table-scroll"><table class="sizes-t"><thead><tr><th>Maat</th><th>Borst (½)</th><th>Lengte</th><th>Mouw</th></tr></thead><tbody>' +
        rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + ' cm</td><td>' + r[2] + ' cm</td><td>' + r[3] + ' cm</td></tr>'; }).join('') + '</tbody></table></div>';
    }
    return '<p class="note">Gemeten plat op tafel. Borst is de breedte van oksel tot oksel.</p>' +
      t('Longsleeves', [['S', 51, 69, 61], ['M', 54, 72, 62], ['L', 57, 74, 63], ['XL', 60, 76, 64]]) +
      t('Hoodies &amp; zip-ups', [['S', 59, 67, 57], ['M', 62, 70, 58], ['L', 65, 72, 59], ['XL', 68, 74, 60]]);
  }
  window.AIKELO_SIZE_TABLES = sizeTables;
  P.info = function () { A().$('#sizeTables').innerHTML = sizeTables(); };

  // ---------- checkout ----------
  P.checkout = function () {
    var a = A(), Cart = window.AIKELO_CART;
    var form = a.$('#checkoutForm');

    function summary() {
      var box = a.$('#summary');
      if (!Cart.items.length) {
        a.$('#checkoutWrap').innerHTML = '<div class="thanks"><h1 style="font-size:40px">Je winkelmandje is leeg</h1><p class="lead" style="margin:16px auto 28px">Kies eerst iets moois uit de shop.</p><a class="btn" href="shop">Naar de shop</a></div>';
        return;
      }
      var st = Cart.subtotal(), sh = Cart.shipping();
      box.innerHTML = '<h2>Je bestelling</h2>' + Cart.items.map(function (it, i) { return window.AIKELO_LINE(it, i, false); }).join('') +
        '<div class="totals" style="margin-top:12px"><div><span>Subtotaal</span><span>' + a.money2(st) + '</span></div>' +
        '<div><span>Verzending</span><span>' + (sh ? a.money2(sh) : 'Gratis') + '</span></div>' +
        '<div class="grand"><span>Totaal</span><span>' + a.money2(st + sh) + '</span></div></div>' +
        '<p class="note" style="margin-top:14px">Alle prijzen zijn inclusief btw.</p>';
    }
    summary();
    document.addEventListener('cart:change', summary);
    if (!form) return;

    // ingevulde gegevens onthouden tijdens het afrekenen (alleen in deze browser-sessie)
    try {
      var saved = JSON.parse(sessionStorage.getItem('aikelo-checkout') || '{}');
      Object.keys(saved).forEach(function (k) { var el = form.elements[k]; if (el && el.type !== 'checkbox' && el.type !== 'radio') el.value = saved[k]; });
    } catch (e) {}
    form.addEventListener('input', function () {
      var d = {}; ['name', 'email', 'phone', 'street', 'zip', 'city', 'country', 'note'].forEach(function (k) { d[k] = form.elements[k].value; });
      try { sessionStorage.setItem('aikelo-checkout', JSON.stringify(d)); } catch (e) {}
    });

    var rules = {
      name: function (v) { return v.trim().length >= 2 || 'Vul je naam in.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Vul een geldig e-mailadres in.'; },
      street: function (v) { return /\d/.test(v) && v.trim().length >= 4 || 'Vul je straat en huisnummer in.'; },
      zip: function (v, f) {
        var c = f.elements.country.value, s = v.trim().toUpperCase();
        if (c === 'NL') return /^\d{4}\s?[A-Z]{2}$/.test(s) || 'Vul een geldige postcode in, bijvoorbeeld 1234 AB.';
        if (c === 'BE') return /^\d{4}$/.test(s) || 'Vul een geldige Belgische postcode in, bijvoorbeeld 2000.';
        return s.length >= 3 || 'Vul je postcode in.';
      },
      city: function (v) { return v.trim().length >= 2 || 'Vul je woonplaats in.'; },
      terms: function (v, f) { return f.elements.terms.checked || 'Ga akkoord met de voorwaarden om te bestellen.'; }
    };
    function check(name) {
      var el = form.elements[name], res = rules[name](el.value, form), field = el.closest('.field') || el.closest('.check');
      if (field) {
        field.classList.toggle('invalid', res !== true);
        var err = field.querySelector('.err'); if (err) err.textContent = res === true ? '' : res;
        el.setAttribute('aria-invalid', res !== true);
      }
      return res === true;
    }
    Object.keys(rules).forEach(function (n) {
      form.elements[n].addEventListener('blur', function () { if (form.elements[n].value || n === 'terms') check(n); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(rules).forEach(function (n) { if (!check(n) && !firstBad) firstBad = form.elements[n]; });
      if (firstBad) { firstBad.focus(); return; }
      if (!Cart.items.length) return;
      var btn = a.$('#placeOrder'); btn.disabled = true; btn.textContent = 'Bezig…';

      var f = form.elements, st = Cart.subtotal(), sh = Cart.shipping();
      var order = {
        number: 'AK-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
        name: f.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(),
        address: f.street.value.trim() + ', ' + f.zip.value.trim().toUpperCase() + ' ' + f.city.value.trim() + ', ' + (f.country.value === 'NL' ? 'Nederland' : 'België'),
        payment: f.payment.value === 'tikkie' ? 'Betaalverzoek (iDEAL / Tikkie)' : 'Bankoverschrijving',
        note: f.note.value.trim(),
        lines: Cart.items.map(function (it) { var p = a.product(it.id); return it.qty + '× ' + p.name + ' — ' + COLORS[it.color].name + ', maat ' + it.size + ' — ' + a.money2(p.price * it.qty); }),
        subtotal: a.money2(st), shipping: sh ? a.money2(sh) : 'Gratis', total: a.money2(st + sh)
      };
      var text =
        'Nieuwe bestelling ' + order.number + '\n\n' +
        order.lines.join('\n') + '\n\n' +
        'Subtotaal: ' + order.subtotal + '\nVerzending: ' + order.shipping + '\nTotaal: ' + order.total + '\n\n' +
        'Naam: ' + order.name + '\nE-mail: ' + order.email + (order.phone ? '\nTelefoon: ' + order.phone : '') + '\nAdres: ' + order.address + '\n' +
        'Betaling: ' + order.payment + (order.note ? '\nOpmerking: ' + order.note : '');

      function done(mode) {
        try {
          sessionStorage.setItem('aikelo-last-order', JSON.stringify({ number: order.number, total: order.total, email: order.email, payment: order.payment, mode: mode, mail: mode === 'mail' ? mailto : '' }));
          sessionStorage.removeItem('aikelo-checkout');
        } catch (e) {}
        Cart.clear();
        location.href = 'bedankt';
      }
      var mailto = 'mailto:' + CFG.email + '?subject=' + encodeURIComponent('Bestelling ' + order.number) + '&body=' + encodeURIComponent(text);
      var ej = CFG.emailjs;
      if (ej && ej.publicKey && ej.serviceId && ej.templateOrder && window.emailjs) {
        var params = { order_number: order.number, customer_name: order.name, customer_email: order.email, customer_phone: order.phone, address: order.address, payment: order.payment, note: order.note, items: order.lines.join('\n'), subtotal: order.subtotal, shipping: order.shipping, total: order.total, message: text, reply_to: order.email };
        window.emailjs.init({ publicKey: ej.publicKey });
        window.emailjs.send(ej.serviceId, ej.templateOrder, params)
          .then(function () { return ej.templateCustomer ? window.emailjs.send(ej.serviceId, ej.templateCustomer, params) : null; })
          .then(function () { done('emailjs'); }, function () {
            btn.disabled = false; btn.textContent = 'Bestelling plaatsen';
            a.$('#orderMsg').innerHTML = 'Versturen lukte niet. Probeer het opnieuw, of <a href="' + a.esc(mailto) + '">mail je bestelling</a> naar ons.';
          });
      } else {
        location.href = mailto;
        setTimeout(function () { done('mail'); }, 700);
      }
    });
  };

  // ---------- thanks ----------
  P.thanks = function () {
    var a = A(), o = null;
    try { o = JSON.parse(sessionStorage.getItem('aikelo-last-order') || 'null'); } catch (e) {}
    if (!o) return;
    a.$('#orderNo').textContent = o.number;
    a.$('#orderNo').hidden = false;
    var msg = o.mode === 'mail'
      ? 'Je mailprogramma is geopend met je bestelling erin. <b>Verstuur die mail</b>, dan hebben wij hem binnen. Opende er niets? <a href="' + a.esc(o.mail) + '">Open de mail opnieuw</a> of mail je bestelnummer naar <a href="mailto:' + a.esc(CFG.email) + '">' + a.esc(CFG.email) + '</a>.'
      : 'We hebben je bestelling ontvangen en sturen een bevestiging naar <b>' + a.esc(o.email) + '</b>.';
    a.$('#thanksMsg').innerHTML = msg + '<br><br>Je betaalt ' + a.esc(o.total) + ' via ' + a.esc(o.payment.charAt(0).toLowerCase() + o.payment.slice(1)) + '. Binnen één werkdag krijg je van ons de betaalgegevens; zodra we je betaling hebben, gaat je pakket op de post.';
  };

  // ---------- contact ----------
  P.contact = function () {
    var a = A(), form = a.$('#contactForm');
    a.$$('[data-email]').forEach(function (el) { el.textContent = CFG.email; el.href = 'mailto:' + CFG.email; });
    a.$$('[data-insta]').forEach(function (el) { el.textContent = '@' + CFG.instagram; el.href = 'https://instagram.com/' + CFG.instagram; });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements;
      if (!f.cname.value.trim() || !f.cmsg.value.trim()) { a.$('#contactMsg').textContent = 'Vul je naam en bericht in.'; return; }
      var body = f.cmsg.value.trim() + '\n\n' + f.cname.value.trim() + (f.corder.value.trim() ? '\nBestelnummer: ' + f.corder.value.trim() : '');
      location.href = 'mailto:' + CFG.email + '?subject=' + encodeURIComponent(f.csubject.value) + '&body=' + encodeURIComponent(body);
      a.$('#contactMsg').textContent = 'Je mailprogramma is geopend. Verstuur de mail en we reageren binnen één werkdag.';
      a.$('#contactMsg').style.color = 'var(--ok)';
    });
  };
})();

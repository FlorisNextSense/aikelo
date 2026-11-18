/* =========================================================
   AIKELO — productcatalogus
   Pas hier prijzen, kleuren, maten en teksten aan.
   Afbeeldingen staan in /img/p/<bestand>-voor.svg en -achter.svg
   ========================================================= */

window.AIKELO_CONFIG = {
  // ⚠️ Vul je eigen gegevens in
  email: 'aikelo.clothing@gmail.com',         // hier komen bestellingen en vragen binnen
  instagram: 'aikelo.clothing',            // zonder @
  shippingCost: 4.95,              // verzendkosten NL
  freeShippingFrom: 100,           // gratis verzending vanaf dit bedrag
  deliveryText: '3 tot 5 werkdagen',
  // EmailJS (optioneel, zie README). Leeg = bestelling gaat via het mailprogramma van de klant.
  emailjs: { publicKey: '', serviceId: '', templateOrder: '', templateCustomer: '' }
};

window.AIKELO_COLORS = {
  wit:              { name: 'Wit',              hex: '#F7F5F0' },
  navy:             { name: 'Navy',             hex: '#0F1630' },
  bordeaux:         { name: 'Bordeaux',         hex: '#5E2B33' },
  groen:            { name: 'Groen',            hex: '#2E4A3B' },
  grijs:            { name: 'Grijs',            hex: '#9A9A9A' }
};

window.AIKELO_CATEGORIES = {
  longsleeves: { name: 'Longsleeves', blurb: 'Zware katoenen longsleeves met print voor en achter.' },
  hoodies:     { name: 'Hoodies',     blurb: 'Ruime, zachte hoodies met een grote print op de rug.' }
};

(function () {
  var LS_SIZES = ['S', 'M', 'L', 'XL'];
  var HOODIE_SIZES = ['S', 'M', 'L', 'XL'];

  window.AIKELO_PRODUCTS = [
    {
      id: 'longsleeve-stuiterend', code: 'A', cat: 'longsleeves',
      name: 'Longsleeve Stuiterend', price: 39.95, img: 'ls-stuiterend',
      colors: ['navy', 'bordeaux', 'wit', 'groen'], sizes: LS_SIZES,
      short: 'Losse letters die over de rug stuiteren, een molentje bij de zoom.',
      desc: 'De letters van aikelo vallen los over je rug, alsof ze net zijn neergegooid. Onderaan de rug een klein molentje tussen “made to” en “live in”. Voor een klein aikelo-woordje op de borst en “made to live in · 2026” bij de zoom.',
      isNew: true
    },
    {
      id: 'longsleeve-echo', code: 'B', cat: 'longsleeves',
      name: 'Longsleeve Echo', price: 39.95, img: 'ls-echo',
      colors: ['navy', 'bordeaux', 'wit', 'groen'], sizes: LS_SIZES,
      short: 'Vervagende rijen aikelo op de rug, een fietsje bij de zoom.',
      desc: 'Vier rijen aikelo die steeds lichter worden, als een echo over je rug. Bij de zoom een fietsje. Voor een klein logo op de borst en “made to live in · 2026” onderaan.',
      isNew: true
    },
    {
      id: 'longsleeve-stempel', code: 'J', cat: 'longsleeves',
      name: 'Longsleeve Stempel', price: 39.95, img: 'ls-stempel',
      colors: ['navy', 'bordeaux', 'wit', 'groen'], sizes: LS_SIZES,
      short: 'Een stempel “longsleeve no. 1” op de rug, een tulp bij de zoom.',
      desc: 'Op de rug een stempel: longsleeve no. 1, aikelo, made to live in · 2026. Bij de zoom een tulp. Voor alleen een klein aikelo bij de zoom. Rustig van voren, een verhaal op je rug.',
      isNew: true
    },
    {
      id: 'longsleeve-streep', code: 'S', cat: 'longsleeves',
      name: 'Longsleeve Streep', price: 39.95, img: 'streep',
      colors: ['navy', 'groen', 'grijs'], sizes: LS_SIZES,
      short: 'Wit met gekleurde strepen, print direct over de strepen.',
      desc: 'Een klassieke streep in wit met navy, groen of grijs. De aikelo-print staat direct over de strepen heen: zwart op navy en groen, rood op grijs.',
      isNew: false
    },
    {
      id: 'hoodie-holle-letters', code: '5', cat: 'hoodies',
      name: 'Hoodie Made to live in', price: 64.99, img: 'hoodie-holle-letters',
      colors: ['navy', 'bordeaux', 'grijs', 'groen'], sizes: HOODIE_SIZES,
      short: 'Grote letters “made to live in” van elleboog tot elleboog.',
      desc: 'MADE TO LIVE IN in grote letters in een boog over de hele rug, van elleboog tot elleboog, met 2026 eronder. Klein aikelo op de borst.',
      isNew: true
    },
    {
      id: 'hoodie-nummer', code: '6', cat: 'hoodies',
      name: 'Hoodie 01.', price: 64.99, img: 'hoodie-nummer',
      colors: ['navy', 'bordeaux', 'grijs', 'groen'], sizes: HOODIE_SIZES,
      short: 'Een groot “01.” op de rug, kleine tekst bij de zoom.',
      desc: 'Onze eerste. Een groot 01. op de rug met aikelo eronder, en voor “made to live in · 2026” bij de zoom.',
      isNew: false
    },
    {
      id: 'hoodie-verticaal', code: '11', cat: 'hoodies',
      name: 'Hoodie Verticaal', price: 64.99, img: 'hoodie-verticaal',
      colors: ['navy', 'bordeaux', 'grijs', 'groen'], sizes: HOODIE_SIZES,
      short: 'Een enorm aikelo verticaal over de rug.',
      desc: 'aikelo in enorme letters van boven naar beneden over je rug. Voor een klein woordje bij de zoom.',
      isNew: false
    },
    {
      id: 'hoodie-poster', code: '14', cat: 'hoodies',
      name: 'Hoodie Poster', price: 64.99, img: 'hoodie-poster',
      colors: ['navy', 'bordeaux', 'grijs', 'groen'], sizes: HOODIE_SIZES,
      short: 'Grote regels tekst op de rug, als een poster.',
      desc: '“made to live in” in grote regels over de rug, opgebouwd als een poster. Voor een klein logo op de borst.',
      isNew: false
    }
  ];
})();

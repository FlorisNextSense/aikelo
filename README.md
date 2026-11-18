# AIKELO — webshop

*made to live in.* De website van aikelo: longsleeves, hoodies en zip-up hoodies uit eigen schetsen.

Statische site (HTML, CSS en JavaScript), geen build-stap nodig. Alles wat online komt staat in [public/](public/).

## Lokaal bekijken

```bash
python3 scripts/serve.py
```

Open daarna http://localhost:8080.

## Wat zit erin

| Pagina | Bestand |
|---|---|
| Home | `public/index.html` |
| Shop met filters (soort, kleur, sorteren) | `public/shop.html` |
| Productpagina (kleur, maat, aantal, voor- en achterkant, zoom, maattabel) | `public/product.html?id=…` |
| Winkelmandje (schuift in vanaf rechts op elke pagina, bewaard in de browser) | `public/js/app.js` |
| Afrekenen → bedankpagina | `public/afrekenen.html`, `public/bedankt.html` |
| Over, Contact, Klantenservice (verzending, retour, maten, FAQ), Voorwaarden, Privacy, 404 | `public/*.html` |

## Aanpassen

**Producten, prijzen, kleuren en maten** staan allemaal in [public/js/products.js](public/js/products.js).
Bovenin dat bestand staat ook `AIKELO_CONFIG`: e-mailadres, Instagram, verzendkosten en de grens voor gratis verzending.

Productafbeeldingen staan in `public/img/p/` als `<product>-<kleur>-voor.svg` en `-achter.svg`.
Ze komen uit het ontwerpbestand "Logo AIKELO" op claude.ai en zijn uitgepakt met `scripts/extract.py` en `scripts/copy_images.py`.
Echte productfoto's later? Zet ze ernaast (bijvoorbeeld `.jpg`) en pas de functie `img()` in `public/js/app.js` aan.

## Bestellingen ontvangen

Zonder verdere instellingen opent "Bestelling plaatsen" het mailprogramma van de klant, met de hele bestelling al ingevuld, gericht aan `AIKELO_CONFIG.email`.

Beter: koppel **EmailJS** (gratis tot 200 mails per maand), dan komt de bestelling direct binnen en krijgt de klant automatisch een bevestiging:

1. Maak een account op emailjs.com en koppel je mailbox (Email Services → Service ID).
2. Maak twee templates (Email Templates): één naar jezelf, één naar `{{customer_email}}`.
   Beschikbare velden: `order_number`, `customer_name`, `customer_email`, `customer_phone`, `address`, `payment`, `note`, `items`, `subtotal`, `shipping`, `total`, `message` (alles als tekst).
3. Vul in `products.js` bij `emailjs` je `publicKey`, `serviceId`, `templateOrder` en `templateCustomer` in.

Betalen gaat nu via een betaalverzoek (Tikkie/iDEAL) of overschrijving dat je zelf na de bestelling stuurt.
Direct online betalen (iDEAL via Mollie of Stripe) vraagt een klein stukje server-code en een account bij die partij.

## Online zetten

`firebase.json` staat klaar voor Firebase Hosting (net als bij tappo):

```bash
npx firebase-tools deploy --only hosting --project <jouw-project-id>
```

Elke andere statische host werkt ook (Netlify, Vercel, GitHub Pages), zolang nette URL's aanstaan (`/shop` → `shop.html`).

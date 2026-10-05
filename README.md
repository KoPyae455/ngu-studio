# Bean Boutique Coffee Shop — Website Prototype

A front-end prototype website for a fictional boutique coffee shop, built for the NCC Education Level 4 Front End Web Development assignment. The site is an original design created from scratch using plain HTML5, CSS3 and vanilla JavaScript (no templates, no website builders).

## Project overview

* Six interlinked, responsive HTML5 pages sharing one navigation bar and one footer
* Product catalogue with live search and category filters
* Shopping cart persisted in `localStorage` (works across pages and after refresh)
* First-time visitor modal with 15% discount email signup
* Prototype checkout, event registration (mailto) and subscription calls-to-action
* Three required plugins plus one extra search plugin (see below)

## File structure

```
bean-boutique/
│
├── index.html          Home page (hero, slideshow, showcase, welcome modal)
├── coffee.html         Coffee selection / unique blends (search + filters)
├── equipment.html      Brewing equipment with descriptions and usage tips
├── cart.html           Shopping cart and prototype checkout
├── events.html         Events, workshops, registration form and map
├── offers.html         Special offers and subscription plans
│
├── css/
│   └── styles.css      Single external stylesheet (linked by every page)
│
├── js/
│   └── script.js       All custom JavaScript (one external file)
│
├── images/
│   ├── hero/           Hero and banner photographs
│   ├── coffee/         Coffee product photographs
│   ├── equipment/      Equipment photographs
│   ├── events/         Event / workshop photographs
│   └── offers/         Offers and subscription imagery
│
├── plugins/            Local copies of the third-party libraries
│   ├── swiper/         Swiper.js
│   ├── aos/            AOS (Animate On Scroll)
│   ├── leaflet/        Leaflet.js (+ marker images)
│   └── fuse/           Fuse.js
│
├── ATTRIBUTION.md      Image credits, authors and licences
└── README.md
```

## How to run the website

1. Open the `bean-boutique` folder in Visual Studio Code (or any file manager).
2. Double-click `index.html`, or right-click it and choose *Open with* → Google Chrome / Microsoft Edge.
3. No build step, web server or installation is required — the prototype runs from `file://`.

Optional local server (only if you prefer one):

```
npx serve bean-boutique
```

or in VS Code, install the *Live Server* extension and click *Go Live*.

**Internet connection:** the site works offline except for (a) Google Fonts, which fall back to system fonts, and (b) map tiles on `events.html`, which need an internet connection. All four plugins are stored locally in `plugins/`, so no CDN is required.

## Plugins / libraries used

| # | Plugin | Version | Where it is used | Purpose |
|---|--------|---------|------------------|---------|
| 1 | Swiper.js | 11.x | `index.html` (comment: *Plugin 1: Swiper.js*) | Featured products & events slideshow — autoplay, pagination dots, arrows, keyboard control |
| 2 | AOS (Animate On Scroll) | 2.3.4 | `coffee.html` (comment: *Plugin 2: AOS*) | Animates the product cards as they scroll into view |
| 3 | Leaflet.js | 1.9.4 | `events.html` (comment: *Plugin 3: Leaflet.js*) | Interactive OpenStreetMap with markers for the shop and event venues |
| 4 | Fuse.js | 7.0.0 | `coffee.html` (comment: *Plugin 4: Fuse.js*) | Fuzzy search engine behind the live catalogue search box |

Each plugin is clearly commented in the HTML and in `js/script.js` (sections 7–10). They are used as permitted external plugins; the core HTML/CSS structure is original.


## Configuration values you may want to change

| Value | Where to change it | Current setting |
|-------|--------------------|-----------------|
| Shop address & opening hours | Footer of every page + `events.html` (map info box) | 12 Abbey Churchyard, Bath, BA1 1LJ |
| Map coordinates | `js/script.js` → `initShopMap()` → `shopLocation` | 51.3811, -2.3590 (Bath) |
| Event registration email | `events.html` (`action="mailto:..."`) **and** `js/script.js` → `initRegistrationForm()` | events@beanboutique.example |
| Delivery fee / free-delivery threshold | `js/script.js` → `DELIVERY_FEE`, `FREE_DELIVERY_OVER` | £3.95 / free over £40 |
| Discount code in the welcome modal | `js/script.js` → `initWelcomeModal()` | WELCOME15 |
| Prices, product data, events | Directly in `coffee.html`, `equipment.html`, `events.html`, `offers.html` | See the pages |
| Google Fonts | `<link>` tags in the `<head>` of each page | Playfair Display + Inter |
| Welcome modal behaviour | `js/script.js` (`WELCOME_KEY` in localStorage) | Shows once per browser |

> Replace the `.example` email address with a real inbox before demonstrating the registration form, and change the map coordinates if you move the fictional shop.

## Image and content attribution

All photographs live locally in `images/` and come from Wikimedia Commons (public domain or Creative Commons licences). **[ATTRIBUTION.md](ATTRIBUTION.md)** lists every file with its source page, author and licence — keep that file with the project so attribution stays with the images.

No website template, website builder or third-party HTML/CSS structure has been used. The HTML, CSS and JavaScript are an original implementation. The four open-source plugins listed above are included as permitted external libraries.



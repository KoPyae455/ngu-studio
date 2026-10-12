# Bean Boutique Coffee Shop

Bean Boutique is a front-end prototype for a fictional coffee shop. It is
implemented with HTML5, CSS3 and vanilla JavaScript, without a framework or
build step.

## Pages

- `index.html` — home page, welcome modal and featured slideshow
- `coffee.html` — coffee catalogue, category filters and fuzzy search
- `equipment.html` — brewing equipment catalogue
- `cart.html` — browser-persisted cart and prototype checkout
- `events.html` — events, registration form and embedded Google Map
- `offers.html` — promotional offers and subscription plans

## Local libraries

The project uses three local JavaScript libraries:

| Library | Version | Use |
|---|---:|---|
| Swiper.js | 11.2.10 | Featured slideshow on `index.html` |
| AOS | 2.3.4 | Product-card scroll animations on `coffee.html` |
| Fuse.js | 7.0.0 | Fuzzy catalogue search on `coffee.html` |

These libraries are stored in `plugins/`; no package installation or CDN is
required.

## Running the site

Open `index.html` in a browser, or serve the folder with a local web server.
The site works offline apart from Google Fonts and the Google Maps embed on
`events.html`.

The cart uses `localStorage`, and checkout, newsletter signup and event
registration are front-end prototypes. They do not send data to a server or
process real payments.

## Project files

- `css/styles.css` — shared styles and responsive layouts
- `js/script.js` — shared navigation, cart, forms and plugin initialisation
- `images/` — local image assets
- `ATTRIBUTION.md` — image sources, authors and licence information


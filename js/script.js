/* ==========================================================================
   Bean Boutique Coffee Shop — main JavaScript
   Vanilla JavaScript, organised into small named functions.

   Contents
   1.  Storage helpers (safe localStorage)
   2.  Shared helpers (price format, cart badge, toast)
   3.  Mobile navigation menu
   4.  Cart engine (add / update / remove / clear, localStorage)
   5.  First-visit welcome modal with email signup (home page)
   6.  Footer newsletter signup
   7.  PLUGIN 1 — Swiper.js slideshow (home page)
   8.  PLUGIN 2 — AOS animate-on-scroll (coffee page)
   9.  PLUGIN 3 — Leaflet map (events page)
   10. PLUGIN 4 — Fuse.js powered catalogue search (coffee page)
   11. Cart page rendering, quantity, totals, checkout
   12. Event registration validation (mailto submission)
   13. Subscription calls-to-action (offers page)
   14. Initialisation on page load
   ========================================================================== */

"use strict";

/* ------------------------------------------------------------------------
   1. Storage helpers
   Some browsers block localStorage (for example strict privacy settings),
   so every access is wrapped in try/catch to avoid console errors.
   ------------------------------------------------------------------------ */
var CART_KEY = "beanBoutiqueCart";
var WELCOME_KEY = "beanBoutiqueWelcomeSeen";

function storageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function storageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    /* Ignore — the site still works without persistence. */
  }
}

/* ------------------------------------------------------------------------
   2. Shared helpers
   ------------------------------------------------------------------------ */

/** Format a number as pounds sterling, e.g. 12.5 -> "£12.50" */
function formatPrice(amount) {
  return "£" + Number(amount).toFixed(2);
}

/** Read the saved cart from localStorage (returns an array). */
function getCart() {
  var raw = storageGet(CART_KEY);
  if (!raw) return [];
  try {
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

/** Save the cart array back to localStorage and refresh every badge. */
function saveCart(cart) {
  storageSet(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

/** Update the "Cart" counter shown in the navigation bar. */
function updateCartCount() {
  var cart = getCart();
  var totalItems = cart.reduce(function (sum, item) {
    return sum + item.quantity;
  }, 0);
  document.querySelectorAll("[data-cart-count]").forEach(function (badge) {
    badge.textContent = String(totalItems);
    badge.classList.toggle("has-items", totalItems > 0);
  });
}

/** Show a small confirmation message that disappears after 2.5 seconds. */
function showToast(message) {
  var existing = document.querySelector(".toast");
  if (existing) existing.remove();

  var toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  document.body.appendChild(toast);

  window.setTimeout(function () {
    toast.classList.add("toast--visible");
  }, 20);
  window.setTimeout(function () {
    toast.classList.remove("toast--visible");
    window.setTimeout(function () {
      toast.remove();
    }, 350);
  }, 2500);
}

/** Scroll smoothly to an element (used by checkout / register buttons). */
function scrollToElement(element) {
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ------------------------------------------------------------------------
   3. Mobile navigation menu
   ------------------------------------------------------------------------ */
function initMobileNavigation() {
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("primary-nav");
  if (!header || !toggle || !nav) return;

  function closeMenu() {
    header.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", function () {
    var isOpen = header.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Close the menu when a navigation link is chosen (mobile).
  nav.addEventListener("click", function (event) {
    if (event.target.closest("a")) closeMenu();
  });

  // Close the menu if the user presses Escape.
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeMenu();
  });

  // Add a subtle shadow once the page is scrolled.
  window.addEventListener("scroll", function () {
    header.classList.toggle("is-scrolled", window.scrollY > 10);
  });
}

/* ------------------------------------------------------------------------
   4. Cart engine
   Products add themselves with data attributes:
   data-id, data-name, data-price, data-image
   ------------------------------------------------------------------------ */

/** Add a product to the cart (merges quantities for the same id). */
function addToCart(product) {
  var cart = getCart();
  var existing = cart.find(function (item) {
    return item.id === product.id;
  });

  if (existing) {
    existing.quantity += product.quantity || 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image || "",
      quantity: product.quantity || 1
    });
  }

  saveCart(cart);
}

/** Wire up every "Add to Cart" button on coffee / equipment / offers pages. */
function initAddToCartButtons() {
  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-add-to-cart]");
    if (!button) return;

    addToCart({
      id: button.getAttribute("data-id"),
      name: button.getAttribute("data-name"),
      price: button.getAttribute("data-price"),
      image: button.getAttribute("data-image"),
      quantity: 1
    });

    // Friendly feedback without leaving the page.
    var originalLabel = button.textContent;
    button.textContent = "Added \u2713";
    button.classList.add("is-added");
    window.setTimeout(function () {
      button.textContent = originalLabel;
      button.classList.remove("is-added");
    }, 1400);

    showToast(button.getAttribute("data-name") + " added to your cart.");
  });
}

/* ------------------------------------------------------------------------
   5. First-visit welcome modal (home page)
   Uses localStorage so the modal only appears once per browser.
   ------------------------------------------------------------------------ */
function initWelcomeModal() {
  var modal = document.getElementById("welcome-modal");
  if (!modal) return;

  var dialog = modal.querySelector(".modal");
  var closeButton = modal.querySelector(".modal-close");
  var form = document.getElementById("welcome-form");
  var emailInput = document.getElementById("welcome-email");
  var emailError = document.getElementById("welcome-email-error");
  var successMessage = document.getElementById("welcome-success");
  var lastFocusedElement = null;

  var simpleEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function openModal() {
    lastFocusedElement = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    storageSet(WELCOME_KEY, "true"); /* Mark as seen the moment it is shown */
    window.setTimeout(function () {
      emailInput.focus();
    }, 60);
    document.addEventListener("keydown", handleKeydown);
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    storageSet(WELCOME_KEY, "true"); /* Do not show again next visit */
    document.removeEventListener("keydown", handleKeydown);
    if (lastFocusedElement && lastFocusedElement.focus) {
      lastFocusedElement.focus();
    }
  }

  /* Keyboard support: Escape closes, Tab stays inside the dialog */
  function handleKeydown(event) {
    if (event.key === "Escape") {
      closeModal();
      return;
    }
    if (event.key !== "Tab") return;

    var focusable = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* Show the modal only for first-time visitors */
  if (!storageGet(WELCOME_KEY)) {
    window.setTimeout(openModal, 900);
  }

  closeButton.addEventListener("click", closeModal);

  /* Click on the dark backdrop also closes the dialog */
  modal.addEventListener("click", function (event) {
    if (event.target === modal) closeModal();
  });

  /* Validate the email address, then show the discount code */
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var value = emailInput.value.trim();

    if (!value) {
      showFieldError(emailInput, emailError, "Please enter your email address.");
      return;
    }
    if (!simpleEmailPattern.test(value)) {
      showFieldError(emailInput, emailError, "Please enter a valid email, for example name@example.com.");
      return;
    }

    clearFieldError(emailInput, emailError);
    form.hidden = true;
    successMessage.hidden = false;
    successMessage.textContent =
      "Thank you! Your 15% code is on its way to " + value +
      ". Meanwhile, use code WELCOME15 at checkout.";
    storageSet(WELCOME_KEY, "true");
    storageSet("beanBoutiqueSubscriber", value);

    window.setTimeout(closeModal, 4500);
  });
}

/* Show / clear an inline field error message (shared by all forms) */
function showFieldError(input, errorElement, message) {
  input.setAttribute("aria-invalid", "true");
  input.classList.add("is-invalid");
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.hidden = false;
  }
}

function clearFieldError(input, errorElement) {
  input.removeAttribute("aria-invalid");
  input.classList.remove("is-invalid");
  if (errorElement) {
    errorElement.textContent = "";
    errorElement.hidden = true;
  }
}

/* ------------------------------------------------------------------------
   6. Footer newsletter signup (appears in the footer of every page)
   ------------------------------------------------------------------------ */
function initNewsletterForms() {
  document.querySelectorAll(".js-newsletter").forEach(function (form) {
    var input = form.querySelector('input[type="email"]');
    var message = form.querySelector(".form-message");
    var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var value = input.value.trim();
      message.classList.remove("is-error", "is-success");

      if (!value) {
        message.textContent = "Please enter your email address.";
        message.classList.add("is-error");
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return;
      }
      if (!pattern.test(value)) {
        message.textContent = "That does not look like a valid email address.";
        message.classList.add("is-error");
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return;
      }

      input.removeAttribute("aria-invalid");
      message.textContent = "Thanks! Check your inbox for your welcome code.";
      message.classList.add("is-success");
      storageSet("beanBoutiqueSubscriber", value);
      form.reset();
    });
  });
}

/* ------------------------------------------------------------------------
   7. PLUGIN 1 — Swiper.js slideshow (home page)
   Initialises only when the Swiper library and the slider both exist.
   ------------------------------------------------------------------------ */
function initFeaturedSlideshow() {
  if (typeof Swiper === "undefined") return;
  var sliderElement = document.querySelector(".featured-swiper");
  if (!sliderElement) return;

  new Swiper(sliderElement, {
    loop: true,
    grabCursor: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
      pauseOnMouseEnter: true
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev"
    },
    slidesPerView: 1,
    spaceBetween: 24,
    speed: 700,
    keyboard: {
      enabled: true
    },
    a11y: {
      enabled: true
    }
  });
}

/* ------------------------------------------------------------------------
   8. PLUGIN 2 — AOS (Animate On Scroll) on the coffee selection page
   ------------------------------------------------------------------------ */
function initScrollAnimations() {
  if (typeof AOS === "undefined") return;
  AOS.init({
    duration: 650,
    easing: "ease-out",
    once: true,
    offset: 60,
    disable: window.matchMedia("(prefers-reduced-motion: reduce)").matches
  });
}

/** Set the current year in every footer (small finishing touch). */
function setCurrentYear() {
  document.querySelectorAll("[data-current-year]").forEach(function (element) {
    element.textContent = String(new Date().getFullYear());
  });
}

/* ------------------------------------------------------------------------
   9. PLUGIN 3 — Leaflet interactive map (events page)
   Shows the Bean Boutique shop plus event venues with markers & popups.
   Change the coordinates below if you move the fictional shop.
   ------------------------------------------------------------------------ */
function initShopMap() {
  if (typeof L === "undefined") return;
  var mapElement = document.getElementById("shop-map");
  if (!mapElement) return;

  /* Remove the static fallback text before Leaflet draws the map */
  mapElement.innerHTML = "";

  var shopLocation = { lat: 51.3811, lng: -2.359 }; /* Bath city centre */

  var map = L.map(mapElement).setView([shopLocation.lat, shopLocation.lng], 15);

  /* OpenStreetMap tiles (requires an internet connection) */
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  /* Marker 1: the coffee shop itself */
  L.marker([shopLocation.lat, shopLocation.lng])
    .addTo(map)
    .bindPopup(
      "<strong>Bean Boutique Coffee Shop</strong><br>12 Abbey Churchyard, Bath<br>Mon–Sat 7:30–18:00 · Sun 9:00–16:00"
    )
    .openPopup();

  /* Markers 2 & 3: nearby event venues referenced on this page */
  L.marker([51.3802, -2.3551])
    .addTo(map)
    .bindPopup("<strong>The Loft Studio</strong><br>Latte art &amp; brewing workshops");

  L.marker([51.3825, -2.3621])
    .addTo(map)
    .bindPopup("<strong>The Tasting Room</strong><br>Cupping nights &amp; origin tastings");

  /* A circle highlights the short walk between venues */
  L.circle([51.3811, -2.359], {
    radius: 220,
    color: "#9c6234",
    fillColor: "#c08552",
    fillOpacity: 0.12,
    weight: 2
  }).addTo(map);
}

/* ------------------------------------------------------------------------
   10. PLUGIN 4 — Fuse.js fuzzy search on the coffee catalogue
   Combined with category chips and an animated show/hide of the cards.
   ------------------------------------------------------------------------ */
function initProductSearch() {
  var grid = document.getElementById("product-grid");
  var searchInput = document.getElementById("catalogue-search");
  if (!grid || !searchInput) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-product-card]"));
  var clearButton = document.getElementById("search-clear");
  var statusElement = document.getElementById("search-status");
  var emptyState = document.getElementById("search-empty");
  var chips = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));

  var activeCategory = "all";

  /* Build the searchable index from each card's data attributes */
  var searchIndex = cards.map(function (card) {
    return {
      id: card.getAttribute("data-id"),
      name: card.getAttribute("data-name") || "",
      category: card.getAttribute("data-category") || "",
      details: card.getAttribute("data-search") || ""
    };
  });

  /* Fuse.js is used when available; otherwise fall back to simple matching */
  var fuse = null;
  if (typeof Fuse !== "undefined") {
    fuse = new Fuse(searchIndex, {
      includeScore: true,
      threshold: 0.42,
      ignoreLocation: true,
      keys: [
        { name: "name", weight: 0.7 },
        { name: "details", weight: 1 },
        { name: "category", weight: 0.4 }
      ]
    });
  }

  function matchesQuery(card, query) {
    if (!query) return true;

    if (fuse) {
      var results = fuse.search(query);
      return results.some(function (result) {
        return result.item.id === card.getAttribute("data-id");
      });
    }

    var haystack = (
      card.getAttribute("data-name") + " " +
      card.getAttribute("data-search") + " " +
      card.getAttribute("data-category")
    ).toLowerCase();
    return haystack.indexOf(query.toLowerCase()) !== -1;
  }

  /* Show/hide cards with a small animation and update the status text */
  function applyFilters() {
    var query = searchInput.value.trim();
    var visibleCount = 0;

    cards.forEach(function (card) {
      var categoryMatches =
        activeCategory === "all" ||
        card.getAttribute("data-category") === activeCategory;
      var show = categoryMatches && matchesQuery(card, query);

      card.classList.toggle("is-hidden", !show);

      if (show) {
        visibleCount += 1;
        card.classList.remove("is-filtered-in");
        /* Restart the CSS animation */
        void card.offsetWidth;
        card.classList.add("is-filtered-in");
      }
    });

    if (statusElement) {
      statusElement.textContent =
        "Showing " + visibleCount + " of " + cards.length + " coffees.";
    }
    if (emptyState) {
      emptyState.hidden = visibleCount !== 0;
    }
  }

  searchInput.addEventListener("input", applyFilters);

  searchInput.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      searchInput.value = "";
      applyFilters();
    }
  });

  function resetSearch() {
    searchInput.value = "";
    activeCategory = "all";
    chips.forEach(function (chip) {
      chip.setAttribute(
        "aria-pressed",
        chip.getAttribute("data-filter") === "all" ? "true" : "false"
      );
    });
    applyFilters();
    searchInput.focus();
  }

  if (clearButton) {
    clearButton.addEventListener("click", resetSearch);
  }

  var emptyClearButton = document.getElementById("search-empty-clear");
  if (emptyClearButton) {
    emptyClearButton.addEventListener("click", resetSearch);
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      activeCategory = chip.getAttribute("data-filter");
      chips.forEach(function (other) {
        other.setAttribute("aria-pressed", other === chip ? "true" : "false");
      });
      applyFilters();
    });
  });

  applyFilters();
}

/* ------------------------------------------------------------------------
   11. Cart page — rendering, quantity changes, totals, checkout
   ------------------------------------------------------------------------ */

/** Delivery cost rules (prototype values). */
var DELIVERY_FEE = 3.95;
var FREE_DELIVERY_OVER = 40;

/** Small helper: set textContent of the first element matching a selector. */
function setText(selector, value) {
  var element = document.querySelector(selector);
  if (element) element.textContent = value;
}

/** Show a short status message on the cart page (aria-live region). */
function showCartMessage(message, type) {
  var alertBox = document.getElementById("cart-alert");
  if (!alertBox) return;
  alertBox.textContent = message;
  alertBox.className = "alert alert--" + (type || "info");
  alertBox.hidden = false;
  window.setTimeout(function () {
    alertBox.hidden = true;
  }, 3500);
}

/** Build the HTML for a single cart row. */
function createCartItemMarkup(item) {
  var lineTotal = item.price * item.quantity;
  var quantityId = "qty-" + item.id;

  return (
    '<article class="cart-item" data-cart-item="' + item.id + '">' +
      '<div class="cart-item-product">' +
        '<img class="cart-item-image" src="' + item.image + '" alt="' + item.name + '" loading="lazy">' +
        '<div class="cart-item-details">' +
          '<h3 class="cart-item-name">' + item.name + "</h3>" +
          '<p class="cart-item-unit">' + formatPrice(item.price) + " each</p>" +
        "</div>" +
      "</div>" +
      '<div class="cart-item-quantity">' +
        '<label for="' + quantityId + '">Quantity for ' + item.name + "</label>" +
        '<input type="number" id="' + quantityId + '" min="1" max="99" value="' + item.quantity +
          '" data-quantity-input="' + item.id + '">' +
      "</div>" +
      '<p class="cart-item-total">' + formatPrice(lineTotal) + "</p>" +
      '<button type="button" class="cart-remove btn btn-small btn-outline" data-remove-item="' +
        item.id + '">Remove</button>' +
    "</article>"
  );
}

/** Rebuild the cart list, empty state, totals and badge. */
function renderCartPage() {
  var itemsContainer = document.getElementById("cart-items");
  if (!itemsContainer) return;

  var emptyState = document.getElementById("cart-empty");
  var summaryPanel = document.getElementById("cart-summary");
  var cart = getCart();

  if (cart.length === 0) {
    itemsContainer.innerHTML = "";
    if (emptyState) emptyState.hidden = false;
    if (summaryPanel) summaryPanel.hidden = true;
    updateCartCount();
    return;
  }

  if (emptyState) emptyState.hidden = true;
  if (summaryPanel) summaryPanel.hidden = false;

  itemsContainer.innerHTML = cart.map(createCartItemMarkup).join("");

  /* Calculate subtotal, delivery and total */
  var subtotal = cart.reduce(function (sum, item) {
    return sum + item.price * item.quantity;
  }, 0);
  var delivery = subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;

  setText("#cart-subtotal", formatPrice(subtotal));
  setText("#cart-delivery", delivery === 0 ? "Free" : formatPrice(delivery));
  setText("#cart-total", formatPrice(subtotal + delivery));

  updateCartCount();
}

/** Quantity change, remove and clear — all handled with event delegation. */
function initCartControls() {
  var itemsContainer = document.getElementById("cart-items");
  if (!itemsContainer) return;

  /* Change quantity with the number input */
  itemsContainer.addEventListener("change", function (event) {
    var input = event.target.closest("[data-quantity-input]");
    if (!input) return;

    var cart = getCart();
    var id = input.getAttribute("data-quantity-input");
    var quantity = parseInt(input.value, 10);

    if (isNaN(quantity) || quantity < 1) quantity = 1;
    if (quantity > 99) quantity = 99;
    input.value = String(quantity);

    cart.forEach(function (item) {
      if (item.id === id) item.quantity = quantity;
    });

    saveCart(cart);
    renderCartPage();
    showCartMessage("Quantity updated.", "info");
  });

  /* Remove a single item */
  itemsContainer.addEventListener("click", function (event) {
    var removeButton = event.target.closest("[data-remove-item]");
    if (!removeButton) return;

    var id = removeButton.getAttribute("data-remove-item");
    var cart = getCart();
    var removed = cart.find(function (item) { return item.id === id; });
    var updated = cart.filter(function (item) { return item.id !== id; });

    saveCart(updated);
    renderCartPage();
    showCartMessage(
      (removed ? removed.name : "Item") + " removed from your cart.",
      "info"
    );
  });

  /* Clear the whole cart */
  var clearButton = document.getElementById("clear-cart");
  if (clearButton) {
    clearButton.addEventListener("click", function () {
      if (getCart().length === 0) {
        showCartMessage("Your cart is already empty.", "info");
        return;
      }
      saveCart([]);
      renderCartPage();
      showCartMessage("Your cart has been cleared.", "info");
    });
  }

  /* Show / hide the prototype checkout form */
  var checkoutToggle = document.getElementById("checkout-toggle");
  var checkoutForm = document.getElementById("checkout-form");
  if (checkoutToggle && checkoutForm) {
    checkoutToggle.addEventListener("click", function () {
      checkoutForm.hidden = !checkoutForm.hidden;
      checkoutToggle.setAttribute(
        "aria-expanded",
        checkoutForm.hidden ? "false" : "true"
      );
      if (!checkoutForm.hidden) {
        scrollToElement(checkoutForm);
        var firstField = checkoutForm.querySelector("input");
        if (firstField) firstField.focus();
      }
    });
  }
}

/** Validate the prototype checkout form and show a confirmation message. */
function initCheckoutForm() {
  var form = document.getElementById("checkout-form");
  if (!form) return;

  var nameInput = document.getElementById("checkout-name");
  var emailInput = document.getElementById("checkout-email");
  var addressInput = document.getElementById("checkout-address");
  var successBox = document.getElementById("checkout-success");
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var errors = [];

    if (!nameInput.value.trim()) {
      showFieldError(nameInput, document.getElementById("checkout-name-error"),
        "Please enter your full name.");
      errors.push(true);
    } else {
      clearFieldError(nameInput, document.getElementById("checkout-name-error"));
    }

    if (!emailInput.value.trim()) {
      showFieldError(emailInput, document.getElementById("checkout-email-error"),
        "Please enter your email address.");
      errors.push(true);
    } else if (!emailPattern.test(emailInput.value.trim())) {
      showFieldError(emailInput, document.getElementById("checkout-email-error"),
        "Please enter a valid email address, for example name@example.com.");
      errors.push(true);
    } else {
      clearFieldError(emailInput, document.getElementById("checkout-email-error"));
    }

    if (addressInput.value.trim().length < 10) {
      showFieldError(addressInput, document.getElementById("checkout-address-error"),
        "Please enter your full delivery address.");
      errors.push(true);
    } else {
      clearFieldError(addressInput, document.getElementById("checkout-address-error"));
    }

    if (getCart().length === 0) {
      showCartMessage("Your cart is empty — add something before checking out.", "error");
      return;
    }

    if (errors.length > 0) {
      var firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    /* Success — no payment is processed; this is a front-end prototype. */
    var orderReference = "BB-" + String(Date.now()).slice(-6);
    successBox.textContent =
      "Thank you, " + nameInput.value.trim() + "! Your prototype order " +
      orderReference + " has been recorded. A confirmation would be sent to " +
      emailInput.value.trim() + " — no payment has been taken.";
    successBox.hidden = false;

    saveCart([]);
    renderCartPage();
    form.reset();
    form.hidden = true;
    document.getElementById("checkout-toggle").hidden = true;
    showCartMessage("Order confirmed — thank you!", "success");
    scrollToElement(successBox);
  });
}

/* ------------------------------------------------------------------------
   12. Event registration (events page)
   Prototype submission: the form builds a mailto: link so the registration
   is sent through the visitor's email application.
   ------------------------------------------------------------------------ */
function initRegistrationForm() {
  var form = document.getElementById("registration-form");
  if (!form) return;

  var firstNameInput = document.getElementById("reg-first-name");
  var lastNameInput = document.getElementById("reg-last-name");
  var emailInput = document.getElementById("reg-email");
  var eventSelect = document.getElementById("reg-event");
  var successBox = document.getElementById("registration-success");
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* "Register" buttons on the event cards pre-fill the event select */
  document.querySelectorAll("[data-register-event]").forEach(function (button) {
    button.addEventListener("click", function () {
      var eventName = button.getAttribute("data-register-event");
      if (eventSelect) {
        Array.prototype.forEach.call(eventSelect.options, function (option) {
          if (option.value === eventName) eventSelect.value = option.value;
        });
      }
      scrollToElement(form);
      window.setTimeout(function () {
        if (firstNameInput) firstNameInput.focus();
      }, 400);
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var errors = [];

    if (!firstNameInput.value.trim()) {
      showFieldError(firstNameInput, document.getElementById("reg-first-name-error"),
        "Please enter your first name.");
      errors.push(true);
    } else {
      clearFieldError(firstNameInput, document.getElementById("reg-first-name-error"));
    }

    if (!lastNameInput.value.trim()) {
      showFieldError(lastNameInput, document.getElementById("reg-last-name-error"),
        "Please enter your last name.");
      errors.push(true);
    } else {
      clearFieldError(lastNameInput, document.getElementById("reg-last-name-error"));
    }

    if (!emailInput.value.trim()) {
      showFieldError(emailInput, document.getElementById("reg-email-error"),
        "Please enter your email address.");
      errors.push(true);
    } else if (!emailPattern.test(emailInput.value.trim())) {
      showFieldError(emailInput, document.getElementById("reg-email-error"),
        "Please enter a valid email address, for example name@example.com.");
      errors.push(true);
    } else {
      clearFieldError(emailInput, document.getElementById("reg-email-error"));
    }

    if (!eventSelect.value) {
      showFieldError(eventSelect, document.getElementById("reg-event-error"),
        "Please choose which event you would like to attend.");
      errors.push(true);
    } else {
      clearFieldError(eventSelect, document.getElementById("reg-event-error"));
    }

    if (errors.length > 0) {
      var firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    /* Build the registration email (front-end prototype submission) */
    var subject = "Workshop registration - " + eventSelect.value;
    var body =
      "Hello Bean Boutique,\n\n" +
      "I would like to register for: " + eventSelect.value + "\n\n" +
      "First name: " + firstNameInput.value.trim() + "\n" +
      "Last name: " + lastNameInput.value.trim() + "\n" +
      "Email: " + emailInput.value.trim() + "\n\n" +
      "Please confirm my place. Thank you!";

    var mailtoLink =
      "mailto:events@beanboutique.example?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body);

    successBox.textContent =
      "Thank you, " + firstNameInput.value.trim() + "! Your registration for \"" +
      eventSelect.value + "\" is ready to send. Your email application should open " +
      "now — if it does not, email events@beanboutique.example directly.";
    successBox.hidden = false;

    /* Opens the visitor's default email app with the details pre-filled */
    window.location.href = mailtoLink;
    form.reset();
  });
}

/* ------------------------------------------------------------------------
   13. Subscription calls-to-action (offers page)
   Clicking a plan button adds that subscription to the cart and shows a
   confirmation message underneath the pricing card.
   ------------------------------------------------------------------------ */
function initSubscriptionButtons() {
  document.querySelectorAll("[data-subscribe]").forEach(function (button) {
    button.addEventListener("click", function () {
      var planName = button.getAttribute("data-plan-name");
      var price = button.getAttribute("data-price");
      var card = button.closest(".pricing-card");
      var status = card ? card.querySelector("[data-plan-status]") : null;

      addToCart({
        id: button.getAttribute("data-id"),
        name: planName + " (monthly subscription)",
        price: price,
        image: button.getAttribute("data-image"),
        quantity: 1
      });

      if (status) {
        status.textContent =
          planName + " added to your cart — view the cart to continue.";
      }
      showToast(planName + " subscription added to your cart.");
    });
  });
}

/* ------------------------------------------------------------------------
   14. Initialisation
   Every function checks for its own page elements first, so this single
   script file can safely be included on all six pages.
   ------------------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", function () {
  setCurrentYear();
  initMobileNavigation();
  updateCartCount();
  initAddToCartButtons();
  initNewsletterForms();

  /* Home page */
  initWelcomeModal();
  initFeaturedSlideshow();

  /* Coffee page — Plugin 2 (AOS) and Plugin 4 (Fuse.js) */
  initScrollAnimations();
  initProductSearch();

  /* Cart page */
  renderCartPage();
  initCartControls();
  initCheckoutForm();

  /* Events page — Plugin 3 (Leaflet) */
  initRegistrationForm();
  initShopMap();

  /* Offers page */
  initSubscriptionButtons();

  /* Flag set only when the whole initialisation chain has finished without
     errors — handy for testing and debugging in the browser console. */
  document.documentElement.setAttribute("data-js-ready", "true");
});








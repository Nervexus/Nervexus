(function () {
  'use strict';

  /* =======================================================
     LISTINGS DATA — single source of truth for the grid,
     the detail modal, favorites, and the command palette.
  ======================================================= */
  var LISTINGS = [
    {
      id: 'marlborough-terrace', image: 'listing-marlborough.jpg', tag: 'New Listing', price: 4250000,
      title: '14 Marlborough Terrace', location: 'Harbor Heights',
      beds: 5, baths: 6, sqft: 6200,
      description: 'A restored 1920s estate on Harbor Heights’ quietest cul-de-sac, with the original millwork intact and a kitchen rebuilt for the way people actually entertain now.',
      features: ['Restored original millwork', 'Chef’s kitchen, dual islands', 'Heated pool & pool house', 'Three-car carriage garage']
    },
    {
      id: 'lighthouse-point', image: 'listing-lighthouse.jpg', tag: 'Waterfront', price: 6980000,
      title: '2 Lighthouse Point', location: 'Cape Ellery',
      beds: 6, baths: 7, sqft: 8450,
      description: 'Unobstructed water on three sides, a private deep-water dock, and floor-to-ceiling glass throughout the main level to make sure you never forget it.',
      features: ['Private deep-water dock', '180° water views', 'Guest cottage, 2 bd', 'Whole-home generator']
    },
    {
      id: 'fenwick-row', image: 'listing-fenwick.jpg', tag: 'Exclusive', price: 3120000,
      title: '88 Fenwick Row', location: 'Old Charlton',
      beds: 4, baths: 4, sqft: 4780,
      description: 'A townhouse on one of Old Charlton’s most photographed blocks, updated top to bottom without losing a single period detail worth keeping.',
      features: ['Walk to Old Charlton square', 'Wine cellar, 400-bottle', 'Roof terrace, city views', 'Smart home system throughout']
    },
    {
      id: 'ashworth-lane', image: 'listing-ashworth.jpg', tag: 'Price Reduced', price: 2395000,
      title: '410 Ashworth Lane', location: 'Greystone',
      beds: 4, baths: 3, sqft: 3910,
      description: 'Quiet, well-built, and priced to move for a family that wants Greystone’s schools without Greystone’s usual asking price.',
      features: ['Top-rated school district', 'Finished lower level', 'Fenced half-acre lot', 'New roof & HVAC, 2025']
    },
    {
      id: 'windermere-close', image: 'listing-windermere.jpg', tag: 'Under Contract', price: 5600000,
      title: '7 Windermere Close', location: 'Harbor Heights',
      beds: 5, baths: 5, sqft: 5940,
      description: 'A gated modern build that went under contract in six days — shown here as a reference for what moves fastest in this market right now.',
      features: ['Gated, private drive', 'Home theater & gym', 'Radiant floor heating', 'EV charging, 2 bays']
    },
    {
      id: 'belgrave-crescent', image: 'listing-belgrave.jpg', tag: 'Coming Soon', price: 8750000,
      title: '1 Belgrave Crescent', location: 'Old Charlton',
      beds: 7, baths: 8, sqft: 9800,
      description: 'The largest lot on the Crescent, not yet on the open market — early access is going to Aldridge & Co. clients first.',
      features: ['Largest lot on the Crescent', 'Indoor pool & spa wing', 'Staff quarters, separate entrance', 'Motor court, 6+ cars']
    }
  ];

  var currency = function (n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  };

  var savedIds = (function () {
    try {
      return JSON.parse(localStorage.getItem('aldridge_saved_homes') || '[]');
    } catch (e) { return []; }
  })();
  var persistSaved = function () {
    try { localStorage.setItem('aldridge_saved_homes', JSON.stringify(savedIds)); } catch (e) {}
  };
  var isSaved = function (id) { return savedIds.indexOf(id) !== -1; };
  var savedListeners = [];
  var toggleSaved = function (id) {
    var i = savedIds.indexOf(id);
    if (i === -1) savedIds.push(id); else savedIds.splice(i, 1);
    persistSaved();
    savedListeners.forEach(function (fn) { fn(); });
  };

  /* =======================================================
     LISTINGS GRID — render, filter, sort
  ======================================================= */
  var grid = document.getElementById('listingsGrid');
  var countEl = document.getElementById('listingsCount');
  var emptyEl = document.getElementById('listingsEmpty');
  var filterBeds = document.getElementById('filterBeds');
  var filterPrice = document.getElementById('filterPrice');
  var sortBy = document.getElementById('sortBy');
  var carouselPrev = document.getElementById('listingsPrev');
  var carouselNext = document.getElementById('listingsNext');

  function cardHTML(l) {
    return (
      '<div class="listing-media" style="--photo:url(\'' + l.image + '\');">' +
        '<div class="listing-tag">' + l.tag + '</div>' +
        '<button class="card-fav' + (isSaved(l.id) ? ' is-saved' : '') + '" type="button" data-fav="' + l.id + '" aria-label="Save this home"><svg viewBox="0 0 20 20" width="16" height="16"><path d="M10 17.2s-6.9-4.1-6.9-9.1C3.1 5.4 5 3.7 7.2 3.7c1.3 0 2.4.6 2.8 1.6.4-1 1.5-1.6 2.8-1.6 2.2 0 4.1 1.7 4.1 4.4 0 5-6.9 9.1-6.9 9.1z" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></button>' +
        '<div class="listing-price">' + currency(l.price) + '</div>' +
      '</div>' +
      '<div class="listing-body">' +
        '<h3>' + l.title + '</h3>' +
        '<div class="listing-loc">' + l.location + '</div>' +
        '<div class="listing-specs"><span>' + l.beds + ' bd</span><span>·</span><span>' + l.baths + ' ba</span><span>·</span><span>' + l.sqft.toLocaleString('en-US') + ' sqft</span></div>' +
      '</div>'
    );
  }

  function currentList() {
    var beds = parseInt(filterBeds.value, 10) || 0;
    var maxPrice = parseInt(filterPrice.value, 10) || 0;
    var list = LISTINGS.filter(function (l) {
      return l.beds >= beds && (maxPrice === 0 || l.price <= maxPrice);
    });
    var sort = sortBy.value;
    if (sort === 'price-desc') list.sort(function (a, b) { return b.price - a.price; });
    else if (sort === 'price-asc') list.sort(function (a, b) { return a.price - b.price; });
    else if (sort === 'beds-desc') list.sort(function (a, b) { return b.beds - a.beds; });
    return list;
  }

  function renderGrid() {
    var list = currentList();
    grid.innerHTML = '';
    list.forEach(function (l) {
      var card = document.createElement('article');
      card.className = 'listing-card';
      card.setAttribute('data-id', l.id);
      card.innerHTML = cardHTML(l);
      grid.appendChild(card);
    });
    countEl.textContent = 'Showing ' + list.length + ' of ' + LISTINGS.length + ' homes';
    emptyEl.hidden = list.length !== 0;
    grid.hidden = list.length === 0;
    grid.scrollLeft = 0;
    updateCarouselArrows();
  }

  function updateCarouselArrows() {
    if (!carouselPrev || !carouselNext) return;
    var tolerance = 8; /* .listings-grid has a few px of padding for card shadows */
    var max = grid.scrollWidth - grid.clientWidth;
    carouselPrev.disabled = grid.scrollLeft <= tolerance;
    carouselNext.disabled = grid.scrollLeft >= max - tolerance;
  }
  if (carouselPrev && carouselNext) {
    var scrollByCard = function (dir) {
      var card = grid.querySelector('.listing-card');
      var step = card ? card.getBoundingClientRect().width + 28 : 340;
      grid.scrollBy({ left: dir * step, behavior: 'smooth' });
    };
    carouselPrev.addEventListener('click', function () { scrollByCard(-1); });
    carouselNext.addEventListener('click', function () { scrollByCard(1); });
    grid.addEventListener('scroll', updateCarouselArrows, { passive: true });
    window.addEventListener('resize', updateCarouselArrows);
  }

  grid.addEventListener('click', function (e) {
    var favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      e.stopPropagation();
      toggleSaved(favBtn.getAttribute('data-fav'));
      favBtn.classList.toggle('is-saved', isSaved(favBtn.getAttribute('data-fav')));
      return;
    }
    var card = e.target.closest('.listing-card');
    if (card) openModal(card.getAttribute('data-id'));
  });
  [filterBeds, filterPrice, sortBy].forEach(function (el) {
    el.addEventListener('change', renderGrid);
  });

  renderGrid();

  savedListeners.push(function () {
    grid.querySelectorAll('[data-fav]').forEach(function (btn) {
      btn.classList.toggle('is-saved', isSaved(btn.getAttribute('data-fav')));
    });
  });

  /* =======================================================
     LISTING DETAIL MODAL
  ======================================================= */
  var modal = document.getElementById('listingModal');
  var modalMedia = document.getElementById('modalMedia');
  var modalTag = document.getElementById('modalTag');
  var modalPrice = document.getElementById('modalPrice');
  var modalTitle = document.getElementById('modalTitle');
  var modalLoc = document.getElementById('modalLoc');
  var modalSpecs = document.getElementById('modalSpecs');
  var modalDesc = document.getElementById('modalDesc');
  var modalFeatures = document.getElementById('modalFeatures');
  var modalFav = document.getElementById('modalFav');
  var modalClose = document.getElementById('modalClose');
  var modalCta = document.getElementById('modalCta');
  var calcDown = document.getElementById('calcDown');
  var calcRate = document.getElementById('calcRate');
  var calcTerm = document.getElementById('calcTerm');
  var calcDownLabel = document.getElementById('calcDownLabel');
  var calcRateLabel = document.getElementById('calcRateLabel');
  var calcTermLabel = document.getElementById('calcTermLabel');
  var calcResult = document.getElementById('calcResult');
  var currentListing = null;

  function lockScroll() { document.body.classList.add('no-scroll'); }
  function unlockScroll() {
    if (!modal.classList.contains('is-open') && !drawer.classList.contains('is-open') && !palette.classList.contains('is-open')) {
      document.body.classList.remove('no-scroll');
    }
  }

  function recalcMortgage() {
    if (!currentListing) return;
    var down = parseInt(calcDown.value, 10);
    var rate = parseInt(calcRate.value, 10) / 10;
    var term = parseInt(calcTerm.value, 10);
    calcDownLabel.textContent = down + '%';
    calcRateLabel.textContent = rate.toFixed(1) + '%';
    calcTermLabel.textContent = term + ' yrs';
    var loan = currentListing.price * (1 - down / 100);
    var monthlyRate = (rate / 100) / 12;
    var n = term * 12;
    var payment = monthlyRate === 0 ? loan / n : loan * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    calcResult.textContent = currency(payment) + '/mo';
  }
  [calcDown, calcRate, calcTerm].forEach(function (el) {
    if (el) el.addEventListener('input', recalcMortgage);
  });

  function openModal(id) {
    var l = LISTINGS.filter(function (x) { return x.id === id; })[0];
    if (!l) return;
    currentListing = l;
    modalMedia.style.setProperty('--photo', "url('" + l.image + "')");
    modalTag.textContent = l.tag;
    modalPrice.textContent = currency(l.price);
    modalTitle.textContent = l.title;
    modalLoc.textContent = l.location;
    modalSpecs.innerHTML = '<span>' + l.beds + ' bd</span><span>·</span><span>' + l.baths + ' ba</span><span>·</span><span>' + l.sqft.toLocaleString('en-US') + ' sqft</span>';
    modalDesc.textContent = l.description;
    modalFeatures.innerHTML = l.features.map(function (f) { return '<li>' + f + '</li>'; }).join('');
    modalFav.classList.toggle('is-saved', isSaved(l.id));
    modalCta.setAttribute('data-address', l.title + ', ' + l.location);
    calcDown.value = 20; calcRate.value = 65; calcTerm.value = 30;
    recalcMortgage();

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    lockScroll();
    modalClose.focus();
  }
  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    unlockScroll();
  }
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  modalFav.addEventListener('click', function () {
    if (!currentListing) return;
    toggleSaved(currentListing.id);
    modalFav.classList.toggle('is-saved', isSaved(currentListing.id));
  });
  savedListeners.push(function () {
    if (currentListing) modalFav.classList.toggle('is-saved', isSaved(currentListing.id));
  });
  modalCta.addEventListener('click', function (e) {
    e.preventDefault();
    var address = modalCta.getAttribute('data-address') || '';
    var messageEl = document.getElementById('message');
    if (messageEl && address) {
      messageEl.value = 'I’d like to schedule a private showing of ' + address + '.';
    }
    closeModal();
    var contact = document.getElementById('contact');
    if (contact) contact.scrollIntoView({ behavior: 'smooth' });
    if (messageEl) setTimeout(function () { messageEl.focus(); }, 500);
  });

  /* =======================================================
     SAVED HOMES DRAWER
  ======================================================= */
  var drawer = document.getElementById('savedDrawer');
  var drawerBody = document.getElementById('drawerBody');
  var drawerClose = document.getElementById('drawerClose');
  var savedTrigger = document.getElementById('savedTrigger');
  var savedBadge = document.getElementById('savedBadge');

  function renderDrawer() {
    if (!savedIds.length) {
      drawerBody.innerHTML = '<p class="drawer-empty">No saved homes yet — tap the heart on any listing to keep it here.</p>';
      return;
    }
    drawerBody.innerHTML = savedIds.map(function (id) {
      var l = LISTINGS.filter(function (x) { return x.id === id; })[0];
      if (!l) return '';
      return (
        '<div class="drawer-item" data-id="' + l.id + '">' +
          '<div class="drawer-item-media" style="--photo:url(\'' + l.image + '\');"></div>' +
          '<div class="drawer-item-body">' +
            '<h4>' + l.title + '</h4>' +
            '<div class="price">' + currency(l.price) + '</div>' +
            '<div class="loc">' + l.location + '</div>' +
          '</div>' +
          '<button class="drawer-item-remove" type="button" data-remove="' + l.id + '" aria-label="Remove">✕</button>' +
        '</div>'
      );
    }).join('');
  }
  function updateSavedBadge() {
    savedBadge.textContent = savedIds.length;
    savedBadge.hidden = savedIds.length === 0;
  }
  savedListeners.push(renderDrawer);
  savedListeners.push(updateSavedBadge);
  updateSavedBadge();

  function openDrawer() {
    renderDrawer();
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    lockScroll();
  }
  function closeDrawer() {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    unlockScroll();
  }
  if (savedTrigger) savedTrigger.addEventListener('click', openDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  drawer.addEventListener('click', function (e) { if (e.target === drawer) closeDrawer(); });
  drawerBody.addEventListener('click', function (e) {
    var rm = e.target.closest('[data-remove]');
    if (rm) { toggleSaved(rm.getAttribute('data-remove')); return; }
    var item = e.target.closest('.drawer-item');
    if (item) { closeDrawer(); openModal(item.getAttribute('data-id')); }
  });

  /* =======================================================
     COMMAND PALETTE
  ======================================================= */
  var palette = document.getElementById('commandPalette');
  var paletteInput = document.getElementById('paletteInput');
  var paletteResults = document.getElementById('paletteResults');
  var searchTrigger = document.getElementById('searchTrigger');

  var SECTIONS = [
    { title: 'Featured Listings', sub: 'Jump to section', type: 'section', target: 'listings' },
    { title: 'How It Works', sub: 'Jump to section', type: 'section', target: 'process' },
    { title: 'Client Stories', sub: 'Jump to section', type: 'section', target: 'testimonials' },
    { title: 'About the Agent', sub: 'Jump to section', type: 'section', target: 'about' },
    { title: 'Get in Touch', sub: 'Jump to section', type: 'section', target: 'contact' }
  ];
  function paletteItems() {
    var items = SECTIONS.slice();
    LISTINGS.forEach(function (l) {
      items.push({ title: l.title, sub: l.location + ' — ' + currency(l.price), type: 'listing', target: l.id });
    });
    return items;
  }
  var activeIndex = 0;
  var filteredItems = [];

  function renderPalette(query) {
    var q = (query || '').trim().toLowerCase();
    filteredItems = paletteItems().filter(function (item) {
      return !q || (item.title + ' ' + item.sub).toLowerCase().indexOf(q) !== -1;
    });
    activeIndex = 0;
    if (!filteredItems.length) {
      paletteResults.innerHTML = '<div class="palette-empty">No matches — try a different search.</div>';
      return;
    }
    paletteResults.innerHTML = filteredItems.map(function (item, i) {
      return (
        '<div class="palette-row' + (i === 0 ? ' is-active' : '') + '" data-index="' + i + '">' +
          '<div class="palette-row-icon">' + (item.type === 'listing' ? '◆' : '→') + '</div>' +
          '<div class="palette-row-body">' +
            '<div class="palette-row-title">' + item.title + '</div>' +
            '<div class="palette-row-sub">' + item.sub + '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }
  function setActive(i) {
    var rows = paletteResults.querySelectorAll('.palette-row');
    if (!rows.length) return;
    activeIndex = (i + rows.length) % rows.length;
    rows.forEach(function (r, idx) { r.classList.toggle('is-active', idx === activeIndex); });
    rows[activeIndex].scrollIntoView({ block: 'nearest' });
  }
  function activateItem(i) {
    var item = filteredItems[i];
    if (!item) return;
    closePalette();
    if (item.type === 'section') {
      var section = document.getElementById(item.target);
      if (section) setTimeout(function () { section.scrollIntoView({ behavior: 'smooth' }); }, 250);
    } else {
      setTimeout(function () { openModal(item.target); }, 250);
    }
  }

  function openPalette() {
    palette.classList.add('is-open');
    palette.setAttribute('aria-hidden', 'false');
    lockScroll();
    paletteInput.value = '';
    renderPalette('');
    setTimeout(function () { paletteInput.focus(); }, 50);
  }
  function closePalette() {
    palette.classList.remove('is-open');
    palette.setAttribute('aria-hidden', 'true');
    unlockScroll();
  }
  if (searchTrigger) searchTrigger.addEventListener('click', openPalette);
  palette.addEventListener('click', function (e) { if (e.target === palette) closePalette(); });
  paletteInput.addEventListener('input', function () { renderPalette(paletteInput.value); });
  paletteResults.addEventListener('click', function (e) {
    var row = e.target.closest('.palette-row');
    if (row) activateItem(parseInt(row.getAttribute('data-index'), 10));
  });
  paletteInput.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIndex + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIndex - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); activateItem(activeIndex); }
  });

  document.addEventListener('keydown', function (e) {
    var meta = e.metaKey || e.ctrlKey;
    if (meta && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (palette.classList.contains('is-open')) closePalette(); else openPalette();
      return;
    }
    if (e.key === 'Escape') {
      if (palette.classList.contains('is-open')) closePalette();
      else if (modal.classList.contains('is-open')) closeModal();
      else if (drawer.classList.contains('is-open')) closeDrawer();
    }
  });

  /* =======================================================
     SCROLL PROGRESS BAR
  ======================================================= */
  var progress = document.getElementById('scrollProgress');
  if (progress) {
    var onProgress = function () {
      var h = document.documentElement;
      var scrollable = h.scrollHeight - h.clientHeight;
      var pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      progress.style.width = pct + '%';
    };
    onProgress();
    window.addEventListener('scroll', onProgress, { passive: true });
    window.addEventListener('resize', onProgress);
  }

  /* ---------- scroll reveal ----------
     html.js-reveal is set inline in <head> before first paint so sections start
     hidden with no flash. If this script fails to load or throws before it
     confirms the observer is running, the inline watchdog in <head> strips the
     class after 3s so the page falls back to fully visible instead of stuck
     blank below the fold. Runs after listings render above so those cards are
     picked up too. */
  try {
    var targets = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && targets.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      targets.forEach(function (t) { io.observe(t); });
    } else {
      targets.forEach(function (t) { t.classList.add('is-visible'); });
    }
    document.documentElement.setAttribute('data-reveal-ready', '1');
  } catch (e) {
    document.documentElement.className = document.documentElement.className.replace(' js-reveal', '');
  }

  /* ---------- header scroll state ---------- */
  var header = document.getElementById('siteHeader');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- mobile nav ---------- */
  var navToggle = document.getElementById('navToggle');
  var mobileNav = document.getElementById('mobileNav');
  if (navToggle && mobileNav) {
    var closeNav = function () {
      navToggle.setAttribute('aria-expanded', 'false');
      mobileNav.classList.remove('is-open');
    };
    navToggle.addEventListener('click', function () {
      var open = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!open));
      mobileNav.classList.toggle('is-open', !open);
    });
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeNav);
    });
  }

  /* ---------- animated stat counters ---------- */
  var stats = document.querySelectorAll('.stat-num[data-target]');
  if (stats.length) {
    var animateStat = function (el) {
      var target = parseFloat(el.getAttribute('data-target'));
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      var decimals = el.hasAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals'), 10) : 0;
      var duration = 1400;
      var start = null;
      var step = function (ts) {
        if (start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = (target * eased).toFixed(decimals);
        el.textContent = prefix + value + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
      var statIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateStat(entry.target);
            statIo.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      stats.forEach(function (s) { statIo.observe(s); });
    } else {
      stats.forEach(animateStat);
    }
  }

  /* ---------- testimonial slider ---------- */
  var slidesEl = document.getElementById('testimonialSlides');
  if (slidesEl) {
    var slides = slidesEl.children;
    var dotsWrap = document.getElementById('testimonialDots');
    var count = slides.length;
    var index = 0;

    var dots = [];
    if (dotsWrap) {
      for (var i = 0; i < count; i++) {
        var dot = document.createElement('button');
        dot.className = 't-dot' + (i === 0 ? ' is-active' : '');
        dot.setAttribute('aria-label', 'Testimonial ' + (i + 1));
        (function (idx) {
          dot.addEventListener('click', function () { goTo(idx); });
        })(i);
        dotsWrap.appendChild(dot);
        dots.push(dot);
      }
    }

    function render() {
      slidesEl.style.transform = 'translateX(-' + (index * 100) + '%)';
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === index); });
    }
    function goTo(i) {
      index = (i + count) % count;
      render();
    }

    var prevBtn = document.getElementById('testimonialPrev');
    var nextBtn = document.getElementById('testimonialNext');
    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(index - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(index + 1); });

    var timer = setInterval(function () { goTo(index + 1); }, 7000);
    [prevBtn, nextBtn].forEach(function (b) {
      if (b) b.addEventListener('click', function () { clearInterval(timer); });
    });
  }

  /* ---------- contact form (client-side only, no backend) ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      form.closest('.contact-form').classList.add('is-sent');
    });
  }

  /* ---------- footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

(function () {
  'use strict';

  /* =======================================================
     PROJECTS DATA — single source of truth for the carousel
     and the detail modal.
  ======================================================= */
  var PROJECTS = [
    {
      id: 'oakhaven-gable', images: ['shape-gable.jpg'], tag: 'Gable Roof',
      title: 'The Oakhaven Residence', location: 'Oakhaven',
      sqft: 2800, pitch: '10/12', year: 2024,
      description: 'A steep, classic gable rebuilt in hand-split cedar shake — a simple roofline with no shortcuts taken on the material.',
      features: ['Hand-split cedar shake', 'Steep 10/12 pitch', 'Ridge vent, full length', 'Ice & water shield at the eaves'],
      quote: 'The old shake was falling apart in sheets. This one will outlast the rest of the house.',
      author: 'Grace Fenwick, Oakhaven'
    },
    {
      id: 'ridgemont-hip', images: ['shape-hip.jpg'], tag: 'Hip Roof',
      title: 'The Ridgemont House', location: 'Ridgemont',
      sqft: 3400, pitch: '6/12', year: 2025,
      description: 'A four-sided hip roof re-covered in dimensional architectural shingle, chosen for clean lines on every elevation — there’s no gable end left exposed.',
      features: ['Designer dimensional shingle', 'All four hips re-flashed', 'New ridge caps, full length', '50-year manufacturer warranty'],
      quote: 'Every side of the house gets seen from the street here, so it needed to look finished from every angle. It does.',
      author: 'Marcus Webb, Ridgemont'
    },
    {
      id: 'harrow-dutch-gable', images: ['shape-dutch.jpg', 'shape-dutch-2.jpg'], tag: 'Dutch Gable Roof',
      title: 'The Harrow Farmhouse', location: 'Harrow Crossing',
      sqft: 5200, pitch: '7/12', year: 2023,
      description: 'A hip roof with a gable accent at the ridge, re-clad in standing-seam copper — the small gable gave us a place to vent the attic without breaking the roofline.',
      features: ['Standing-seam copper panels', 'Hand-formed hip and ridge caps', 'Gable vent built into the cap', 'Snow retention, full perimeter'],
      quote: 'The copper already has that patina starting. In twenty years it’s going to look even better than it does now.',
      author: 'Eleanor Voss, Harrow Crossing'
    },
    {
      id: 'beaulieu-dormer', images: ['shape-dormer.jpg'], tag: 'Dormer Roof',
      title: 'The Beaulieu Cottage', location: 'Beaulieu Row',
      sqft: 2100, pitch: '9/12', year: 2024,
      description: 'Two dormers re-flashed and re-roofed in clay tile matched to the original, without disturbing the window frames beneath them.',
      features: ['Matched clay tile profile', 'Both dormer cheeks re-flashed', 'New valley flashing, both dormers', 'Original trim preserved'],
      quote: 'They matched the tile close enough that you’d never know half the roof is new.',
      author: 'Simon Okafor, Beaulieu Row'
    },
    {
      id: 'millbrook-shed', images: ['shape-shed.jpg'], tag: 'Shed Roof',
      title: 'The Millbrook Addition', location: 'Millbrook',
      sqft: 980, pitch: '3/12', year: 2025,
      description: 'A low-slope shed roof over a new addition, finished in standing-seam metal to match the main house and shed water fast off a shallow pitch.',
      features: ['Standing-seam metal panels', 'Low-slope engineered underlayment', 'Color-matched to the main roof', 'Tied into the existing gutter line'],
      quote: 'It matches the rest of the house so well you can’t tell it was ever added on.',
      author: 'Priya Chandra, Millbrook'
    },
    {
      id: 'thornfield-mansard', images: ['shape-mansard.jpg'], tag: 'Mansard Roof',
      title: 'The Thornfield House', location: 'Thornfield',
      sqft: 4600, pitch: '17/12', year: 2022,
      description: 'A Second Empire mansard re-slated top to bottom, with the steep lower slope carrying both the weight of the design and the attic space it was built to create.',
      features: ['Natural slate, diamond pattern', 'Dormer windows re-flashed', 'Copper ridge and hip caps', 'Full structural inspection before install'],
      quote: 'It’s the roof that makes the whole house — they treated it that way.',
      author: 'Walter Byrne, Thornfield'
    }
  ];

  /* =======================================================
     MATERIAL COMPARISON DATA
  ======================================================= */
  var MATERIALS = [
    { id: 'slate', label: 'Natural Slate', lifespan: '75–150 years', cost: '$$$$ — Highest', maintenance: 'Low, but repairs need a slate specialist', bestFor: 'Historic homes & estates built to carry the weight' },
    { id: 'metal', label: 'Standing-Seam & Copper', lifespan: '50–100 years', cost: '$$$ – $$$$', maintenance: 'Very low', bestFor: 'Modern rooflines & steep-pitch accents' },
    { id: 'tile', label: 'Clay & Concrete Tile', lifespan: '50–100 years', cost: '$$$', maintenance: 'Low — avoid foot traffic', bestFor: 'Mediterranean & mission-style homes' },
    { id: 'shake', label: 'Cedar Shake & Shingle', lifespan: '25–40 years', cost: '$$ – $$$', maintenance: 'Moderate — periodic treatment', bestFor: 'Craftsman & cottage-style homes' },
    { id: 'shingle', label: 'Designer Architectural Shingle', lifespan: '25–35 years', cost: '$$', maintenance: 'Low', bestFor: 'Most homes wanting a premium look at a lower cost' }
  ];

  /* =======================================================
     PROJECTS CAROUSEL — render + boundary-aware arrows
  ======================================================= */
  var grid = document.getElementById('projectsGrid');

  function makeCarousel(gridEl, prevBtn, nextBtn, cardSelector, fallbackWidth) {
    if (!gridEl || !prevBtn || !nextBtn) return { update: function () {} };
    var tolerance = 8; /* a few px of grid padding, reserved for card shadows */
    function update() {
      var max = gridEl.scrollWidth - gridEl.clientWidth;
      prevBtn.disabled = gridEl.scrollLeft <= tolerance;
      nextBtn.disabled = gridEl.scrollLeft >= max - tolerance;
    }
    function scrollByCard(dir) {
      var card = gridEl.querySelector(cardSelector);
      var step = card ? card.getBoundingClientRect().width + 28 : fallbackWidth;
      gridEl.scrollBy({ left: dir * step, behavior: 'smooth' });
    }
    prevBtn.addEventListener('click', function () { scrollByCard(-1); });
    nextBtn.addEventListener('click', function () { scrollByCard(1); });
    gridEl.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return { update: update };
  }

  var projectsCarousel = makeCarousel(
    grid, document.getElementById('projectsPrev'), document.getElementById('projectsNext'),
    '.listing-card', 340
  );

  function specsHTML(p) {
    return '<span>' + p.sqft.toLocaleString('en-US') + ' sqft</span><span>·</span><span>' + p.pitch + ' pitch</span><span>·</span><span>completed ' + p.year + '</span>';
  }

  function cardHTML(p) {
    return (
      '<div class="listing-media" style="--photo:url(\'' + p.images[0] + '\');">' +
        '<div class="listing-tag">' + p.tag + '</div>' +
      '</div>' +
      '<div class="listing-body">' +
        '<h3>' + p.title + '</h3>' +
        '<div class="listing-loc">' + p.location + '</div>' +
        '<p class="listing-quote">“' + p.quote + '”</p>' +
        '<div class="listing-author">' + p.author + '</div>' +
      '</div>'
    );
  }

  function renderGrid() {
    grid.innerHTML = '';
    PROJECTS.forEach(function (p) {
      var card = document.createElement('article');
      card.className = 'listing-card';
      card.setAttribute('data-id', p.id);
      card.innerHTML = cardHTML(p);
      grid.appendChild(card);
    });
    projectsCarousel.update();
  }
  renderGrid();

  grid.addEventListener('click', function (e) {
    var card = e.target.closest('.listing-card');
    if (card) openModal(card.getAttribute('data-id'));
  });

  /* =======================================================
     PROJECT DETAIL MODAL
  ======================================================= */
  var modal = document.getElementById('projectModal');
  var modalMedia = document.getElementById('modalMedia');
  var modalTag = document.getElementById('modalTag');
  var modalTitle = document.getElementById('modalTitle');
  var modalLoc = document.getElementById('modalLoc');
  var modalSpecs = document.getElementById('modalSpecs');
  var modalDesc = document.getElementById('modalDesc');
  var modalQuote = document.getElementById('modalQuote');
  var modalFeatures = document.getElementById('modalFeatures');
  var modalClose = document.getElementById('modalClose');
  var modalCta = document.getElementById('modalCta');
  var galleryPrev = document.getElementById('galleryPrev');
  var galleryNext = document.getElementById('galleryNext');
  var galleryCounter = document.getElementById('galleryCounter');
  var galleryDots = document.getElementById('galleryDots');
  var currentProject = null;
  var galleryIndex = 0;

  function lockScroll() { document.body.classList.add('no-scroll'); }
  function unlockScroll() {
    if (!modal.classList.contains('is-open')) document.body.classList.remove('no-scroll');
  }

  function renderGalleryImage() {
    if (!currentProject) return;
    var images = currentProject.images;
    modalMedia.style.setProperty('--photo', "url('" + images[galleryIndex] + "')");
    galleryCounter.textContent = (galleryIndex + 1) + ' / ' + images.length;
    var multi = images.length > 1;
    galleryPrev.hidden = !multi;
    galleryNext.hidden = !multi;
    galleryCounter.hidden = !multi;
    galleryDots.hidden = !multi;
    if (multi) {
      galleryDots.innerHTML = images.map(function (_, i) {
        return '<button class="gallery-dot' + (i === galleryIndex ? ' is-active' : '') + '" type="button" data-index="' + i + '" aria-label="Photo ' + (i + 1) + '"></button>';
      }).join('');
    }
  }
  function goToGalleryImage(i) {
    if (!currentProject) return;
    var count = currentProject.images.length;
    galleryIndex = (i + count) % count;
    renderGalleryImage();
  }
  galleryPrev.addEventListener('click', function () { goToGalleryImage(galleryIndex - 1); });
  galleryNext.addEventListener('click', function () { goToGalleryImage(galleryIndex + 1); });
  galleryDots.addEventListener('click', function (e) {
    var dot = e.target.closest('[data-index]');
    if (dot) goToGalleryImage(parseInt(dot.getAttribute('data-index'), 10));
  });

  function openModal(id) {
    var p = PROJECTS.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    currentProject = p;
    galleryIndex = 0;
    renderGalleryImage();
    modalTag.textContent = p.tag;
    modalTitle.textContent = p.title;
    modalLoc.textContent = p.location;
    modalSpecs.innerHTML = specsHTML(p);
    modalDesc.textContent = p.description;
    modalQuote.innerHTML = '“' + p.quote + '”<cite>— ' + p.author + '</cite>';
    modalFeatures.innerHTML = p.features.map(function (f) { return '<li>' + f + '</li>'; }).join('');
    modalCta.setAttribute('data-title', p.title + ' (' + p.tag + ')');

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
  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeModal();
    else if (e.key === 'ArrowLeft') goToGalleryImage(galleryIndex - 1);
    else if (e.key === 'ArrowRight') goToGalleryImage(galleryIndex + 1);
  });
  modalCta.addEventListener('click', function (e) {
    e.preventDefault();
    var label = modalCta.getAttribute('data-title') || '';
    var messageEl = document.getElementById('message');
    if (messageEl && label) {
      messageEl.value = 'I’d like a quote for a roof like ' + label + '.';
    }
    closeModal();
    var contact = document.getElementById('contact');
    if (contact) contact.scrollIntoView({ behavior: 'smooth' });
    if (messageEl) setTimeout(function () { messageEl.focus(); }, 500);
  });

  /* =======================================================
     MATERIAL COMPARISON TOOL
  ======================================================= */
  var compareA = document.getElementById('compareA');
  var compareB = document.getElementById('compareB');
  var compareTable = document.getElementById('compareTable');

  function materialById(id) {
    return MATERIALS.filter(function (m) { return m.id === id; })[0];
  }

  if (compareA && compareB && compareTable) {
    var optionsHTML = MATERIALS.map(function (m) {
      return '<option value="' + m.id + '">' + m.label + '</option>';
    }).join('');
    compareA.innerHTML = optionsHTML;
    compareB.innerHTML = optionsHTML;
    compareA.value = 'slate';
    compareB.value = 'shingle';

    function renderCompare() {
      var a = materialById(compareA.value);
      var b = materialById(compareB.value);
      if (!a || !b) return;
      var rows = [
        ['Lifespan', a.lifespan, b.lifespan],
        ['Typical Cost', a.cost, b.cost],
        ['Maintenance', a.maintenance, b.maintenance],
        ['Best For', a.bestFor, b.bestFor]
      ];
      var html = '<div class="compare-row is-header"><div class="cell-label"></div><div>' + a.label + '</div><div>' + b.label + '</div></div>';
      html += rows.map(function (r) {
        return '<div class="compare-row"><div class="cell-label">' + r[0] + '</div><div>' + r[1] + '</div><div>' + r[2] + '</div></div>';
      }).join('');
      compareTable.innerHTML = html;
    }
    compareA.addEventListener('change', renderCompare);
    compareB.addEventListener('change', renderCompare);
    renderCompare();
  }

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
     blank below the fold. Runs after the grid renders above so those cards are
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

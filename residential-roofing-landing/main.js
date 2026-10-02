(function () {
  'use strict';

  /* =======================================================
     PROJECTS DATA — single source of truth for the carousel
     and the detail modal.
  ======================================================= */
  var PROJECTS = [
    {
      id: 'hollowmere-estate', image: 'project-slate.jpg', tag: 'Natural Slate',
      title: 'The Hollowmere Estate', location: 'Hollowmere',
      sqft: 6800, pitch: '8/12', year: 2024,
      description: 'A full slate re-roof on a century-old stone manor, matched to the original slate down to the color blend so the repair line disappears from the street.',
      features: ['Hand-sorted slate blend', 'Copper valleys & flashing', 'Snow guards, full perimeter', '~100-year projected lifespan'],
      quote: 'They matched our new slate to the original down to the color — you can’t even tell where the fifty-year-old roof ends and the new section begins.',
      author: 'Helena Brock, Hollowmere'
    },
    {
      id: 'edgewater-residence', image: 'project-metal.jpg', tag: 'Standing-Seam Metal',
      title: 'Edgewater Residence', location: 'Edgewater',
      sqft: 4200, pitch: '6/12', year: 2023,
      description: 'A standing-seam system replacing a failing architectural shingle roof, with every panel hand-formed on site to the exact roofline.',
      features: ['24-gauge steel panels', 'Hand-formed on-site', 'Concealed fastener system', 'Snow retention engineered for the slope'],
      quote: 'The metal work on our roofline is honestly a piece of art. Worth every penny, and it’ll outlast all of us.',
      author: 'Daniel Ferro, Edgewater'
    },
    {
      id: 'casa-del-vento', image: 'project-tile.jpg', tag: 'Clay Tile',
      title: 'Casa del Vento', location: 'Lakeside Point',
      sqft: 5100, pitch: '5/12', year: 2024,
      description: 'A full clay tile re-roof on a Mediterranean-style home, engineered with a reinforced deck to carry the extra weight properly.',
      features: ['Mission-profile clay tile', 'Reinforced roof deck', 'Foam closures, full ridge line', '60-year manufacturer warranty'],
      quote: 'They reinforced the deck before a single tile went up — something the last roofer never even mentioned. No more cracked tiles after every storm.',
      author: 'Isabel Duarte, Lakeside Point'
    },
    {
      id: 'birchcombe-house', image: 'project-shake.jpg', tag: 'Cedar Shake',
      title: 'The Birchcombe House', location: 'Birchcombe',
      sqft: 3600, pitch: '9/12', year: 2022,
      description: 'Hand-split cedar shake, pressure-treated and installed over a ventilated deck so it weathers the way cedar is supposed to.',
      features: ['Hand-split #1 grade cedar', 'Ventilated batten system', 'Class B fire treatment', 'Copper ridge cap'],
      quote: 'Our cedar still looks freshly installed years later — they clearly knew what they were doing with the ventilation.',
      author: 'Owen Castellane, Birchcombe'
    },
    {
      id: 'ashgrove-drive', image: 'project-shingle.jpg', tag: 'Designer Shingle',
      title: '28 Ashgrove Drive', location: 'Ashgrove',
      sqft: 3100, pitch: '7/12', year: 2025,
      description: 'A premium dimensional shingle re-roof, chosen to read like slate from the street without the structural upgrade a real slate roof would need.',
      features: ['Designer dimensional shingle', 'Ice & water shield underlayment', 'Ridge vent, full length', '50-year manufacturer warranty'],
      quote: 'Looks like a slate roof from the curb for a fraction of the price. Exactly what they promised, nothing oversold.',
      author: 'Naomi Patel, Ashgrove'
    },
    {
      id: 'thistle-hollow-reroof', image: 'project-reroof.jpg', tag: 'Full Re-Roof',
      title: 'Full Re-Roof, Thistle Hollow', location: 'Thistle Hollow',
      sqft: 4700, pitch: '6/12', year: 2025,
      description: 'A full tear-off after wind damage stripped half the original roof, rebuilt the same week the insurance claim was approved.',
      features: ['Full tear-off to the deck', 'Decking replaced where rotted', 'New roof within three weeks', 'Insurance documentation handled'],
      quote: 'A storm took half our roof off. Thornridge had a tarp up within four hours and a full new roof inside three weeks.',
      author: 'Renata & Paul Kessler, Thistle Hollow'
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
      '<div class="listing-media" style="--photo:url(\'' + p.image + '\');">' +
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
  var currentProject = null;

  function lockScroll() { document.body.classList.add('no-scroll'); }
  function unlockScroll() {
    if (!modal.classList.contains('is-open')) document.body.classList.remove('no-scroll');
  }

  function openModal(id) {
    var p = PROJECTS.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    currentProject = p;
    modalMedia.style.setProperty('--photo', "url('" + p.image + "')");
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
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
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

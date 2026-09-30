(function () {
  'use strict';

  /* =======================================================
     THEME TOGGLE (dark default, persisted)
  ======================================================= */
  var root = document.documentElement;
  var themeToggle = document.getElementById('themeToggle');
  var savedTheme = null;
  try { savedTheme = localStorage.getItem('marea_theme'); } catch (e) {}
  if (savedTheme === 'light' || savedTheme === 'dark') {
    root.setAttribute('data-theme', savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
  }
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      var next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      document.body.setAttribute('data-theme', next);
      try { localStorage.setItem('marea_theme', next); } catch (e) {}
    });
  }

  /* =======================================================
     CURSOR GLOW (rAF, fine pointer only)
  ======================================================= */
  (function () {
    var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var glow = document.getElementById('cursorGlow');
    if (!glow || !canHover) return;
    var x = window.innerWidth / 2, y = window.innerHeight / 2, raf = null;
    var apply = function () {
      glow.style.left = x + 'px';
      glow.style.top = y + 'px';
      raf = null;
    };
    window.addEventListener('mousemove', function (e) {
      x = e.clientX; y = e.clientY;
      glow.classList.add('is-active');
      if (!raf) raf = requestAnimationFrame(apply);
    });
    document.addEventListener('mouseleave', function () { glow.classList.remove('is-active'); });
  })();

  /* =======================================================
     NAV: blur/border after 50px scroll
  ======================================================= */
  var nav = document.getElementById('siteNav');
  if (nav) {
    var onNavScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 50); };
    onNavScroll();
    window.addEventListener('scroll', onNavScroll, { passive: true });
  }

  /* ---------- mobile nav ---------- */
  var navToggle = document.getElementById('navToggle');
  var mobileNav = document.getElementById('mobileNav');
  if (navToggle && mobileNav) {
    var closeMobileNav = function () {
      navToggle.setAttribute('aria-expanded', 'false');
      mobileNav.classList.remove('is-open');
    };
    navToggle.addEventListener('click', function () {
      var open = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!open));
      mobileNav.classList.toggle('is-open', !open);
    });
    mobileNav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMobileNav); });
  }

  /* =======================================================
     CUSTOM SMOOTH SCROLL for anchor links (offsets fixed nav)
  ======================================================= */
  var NAV_OFFSET = 84;
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
      window.scrollTo({ top: top, behavior: 'smooth' });
      if (mobileNav && mobileNav.classList.contains('is-open')) {
        navToggle.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('is-open');
      }
    });
  });

  /* =======================================================
     REVEAL SYSTEM (IntersectionObserver, threshold 0.15)
  ======================================================= */
  try {
    var selectors = '.reveal-clip-left, .reveal-slide-right, .reveal-pop, .reveal-zoom, .stagger-scale';
    var targets = document.querySelectorAll(selectors);
    if (targets.length) {
      /* Anything already inside the viewport at load (the whole hero, on
         most screens) is marked visible synchronously rather than left to
         IntersectionObserver: a target that's already intersecting when
         observe() is called can get a stale isIntersecting:false first
         callback in some engines, and since it never transitions across
         the threshold again (it doesn't leave and re-enter the viewport),
         that first wrong callback is the only one it ever gets — leaving
         reveal-clip-left's clip-path stuck at zero width forever. */
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var remaining = [];
      targets.forEach(function (t) {
        var r = t.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) t.classList.add('visible');
        else remaining.push(t);
      });
      if (remaining.length) {
        if ('IntersectionObserver' in window) {
          var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                io.unobserve(entry.target);
              }
            });
          }, { threshold: 0.15 });
          remaining.forEach(function (t) { io.observe(t); });
        } else {
          remaining.forEach(function (t) { t.classList.add('visible'); });
        }
      }
    }
    document.documentElement.setAttribute('data-reveal-ready', '1');
  } catch (e) {
    document.documentElement.className = document.documentElement.className.replace(' js-reveal', '');
  }

  /* =======================================================
     SERVICE CARDS — mouse-tracked light pass
  ======================================================= */
  document.querySelectorAll('.service-card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mouse-x', x + '%');
      card.style.setProperty('--mouse-y', y + '%');
    });
  });

  /* =======================================================
     HERO CANVAS BUTTON — oscillating wave particles
  ======================================================= */
  (function () {
    var canvas = document.getElementById('heroCanvas');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    var particles = [];
    var count = 24;
    for (var i = 0; i < count; i++) {
      particles.push({ x: (w / count) * i, phase: Math.random() * Math.PI * 2 });
    }
    var t = 0;
    function draw() {
      ctx.clearRect(0, 0, w, h);
      var gradient = ctx.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, 'rgba(193,127,89,0)');
      gradient.addColorStop(0.5, 'rgba(193,127,89,0.9)');
      gradient.addColorStop(1, 'rgba(193,127,89,0)');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      particles.forEach(function (p, i) {
        var y = h / 2 + Math.sin(t * 0.04 + p.phase) * (h * 0.28);
        if (i === 0) ctx.moveTo(p.x, y); else ctx.lineTo(p.x, y);
      });
      ctx.stroke();
      ctx.fillStyle = 'rgba(193,127,89,0.7)';
      particles.forEach(function (p) {
        var y = h / 2 + Math.sin(t * 0.04 + p.phase) * (h * 0.28);
        ctx.beginPath();
        ctx.arc(p.x, y, 1.1, 0, Math.PI * 2);
        ctx.fill();
      });
      t++;
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  })();

  /* =======================================================
     LEAD MODAL — opened by .btn / .nav-cta, except form submits
  ======================================================= */
  var modal = document.getElementById('leadModal');
  var modalClose = document.getElementById('modalClose');
  function lockScroll() { document.body.classList.add('no-scroll'); }
  function unlockScroll() { document.body.classList.remove('no-scroll'); }
  function openModal() {
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    lockScroll();
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    unlockScroll();
  }
  document.querySelectorAll('[data-modal-trigger]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      if (btn.type === 'submit') return;
      e.preventDefault();
      openModal();
    });
  });
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) closeModal();
  });

  /* =======================================================
     FORMS — client-side only, no backend
  ======================================================= */
  function wireForm(formId, successSelector, hideFormOnSuccess) {
    var form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var success = form.parentElement.querySelector(successSelector);
      if (hideFormOnSuccess) form.classList.add('is-hidden');
      if (success) success.classList.add('is-visible');
      form.reset();
    });
  }
  wireForm('ctaForm', '.cta-success', true);
  wireForm('modalForm', '.modal-success', true);

  var footerForm = document.getElementById('footerForm');
  var footerNote = document.getElementById('footerFormNote');
  if (footerForm) {
    footerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!footerForm.checkValidity()) { footerForm.reportValidity(); return; }
      if (footerNote) footerNote.textContent = 'Merci — nous vous recontactons sous peu.';
      footerForm.reset();
    });
  }

  /* Reset modal to its form state whenever it's reopened after a submit */
  document.querySelectorAll('[data-modal-trigger]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var modalForm = document.getElementById('modalForm');
      var modalSuccess = modal ? modal.querySelector('.modal-success') : null;
      if (modalForm) modalForm.classList.remove('is-hidden');
      if (modalSuccess) modalSuccess.classList.remove('is-visible');
    });
  });

  /* ---------- footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

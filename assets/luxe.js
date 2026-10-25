(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  const hasST = hasGsap && typeof window.ScrollTrigger !== 'undefined';
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  /* Smooth scroll */
  let lenis = null;
  if (!reduceMotion && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    if (hasGsap) {
      if (hasST) lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    else target.scrollIntoView({ behavior: 'smooth' });
  }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute('href');
    if (hash === '#') {
      e.preventDefault();
      scrollToTarget(0);
      return;
    }
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    e.preventDefault();
    scrollToTarget(target);
  });

  /* Splits an element's text into masked words, keeping inline tags like <em> and <br> */
  function splitWords(el) {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(' '));
              return;
            }
            const outer = document.createElement('span');
            outer.className = 'rw';
            const inner = document.createElement('span');
            inner.className = 'rw-i';
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(el);
    return el.querySelectorAll('.rw-i');
  }

  /* Intro curtain, once per browser session */
  let seen = false;
  try { seen = sessionStorage.getItem('slate-intro') === '1'; } catch (e) {}
  window.__introDelay = 0.2;

  if (!seen && hasGsap && !reduceMotion) {
    try { sessionStorage.setItem('slate-intro', '1'); } catch (e) {}
    window.__introDelay = 1.9;

    const pl = document.createElement('div');
    pl.id = 'luxe-preloader';
    pl.innerHTML =
      '<div class="pl-word">' +
      'SLATE'.split('').map((c) => '<span>' + c + '</span>').join('') +
      '</div><div class="pl-line"><i></i></div><p class="pl-tag">Bespoke Roofing</p>';
    document.body.appendChild(pl);
    const letters = pl.querySelectorAll('.pl-word span');
    gsap.set(letters, { yPercent: 110 });
    root.classList.remove('luxe-loading');
    if (lenis) lenis.stop();

    gsap.timeline({
      onComplete: () => {
        pl.remove();
        if (lenis) lenis.start();
      },
    })
      .to(letters, { yPercent: 0, duration: 0.9, ease: 'power4.out', stagger: 0.06 })
      .to(pl.querySelector('.pl-line i'), { scaleX: 1, duration: 1, ease: 'power2.inOut' }, 0.2)
      .to(pl.querySelector('.pl-tag'), { opacity: 1, duration: 0.6 }, 0.5)
      .to(letters, { yPercent: -110, duration: 0.6, ease: 'power3.in', stagger: 0.04 }, 1.25)
      .to(pl, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, 1.45);
  } else {
    root.classList.remove('luxe-loading');
  }

  /* Scroll progress bar */
  const bar = document.createElement('div');
  bar.id = 'luxe-progress';
  document.body.appendChild(bar);
  const updateBar = () => {
    const max = root.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
  };
  window.addEventListener('scroll', updateBar, { passive: true });
  window.addEventListener('resize', updateBar);
  updateBar();

  /* Film grain */
  const grain = document.createElement('div');
  grain.id = 'luxe-grain';
  grain.setAttribute('aria-hidden', 'true');
  document.body.appendChild(grain);

  /* Heading word reveals */
  if (hasST && !reduceMotion) {
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      const words = splitWords(el);
      const onScreenAtLoad = el.getBoundingClientRect().top < window.innerHeight;
      gsap.set(words, { yPercent: 110, filter: 'blur(10px)' });
      gsap.to(words, {
        yPercent: 0,
        filter: 'blur(0px)',
        duration: 1.3,
        ease: 'power4.out',
        stagger: 0.06,
        delay: onScreenAtLoad ? window.__introDelay : 0,
        scrollTrigger: { trigger: el, start: 'top 88%' },
      });
    });
  }

  /* Count-up numbers */
  if (hasST && !reduceMotion) {
    document.querySelectorAll('[data-count]').forEach((el) => {
      const end = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const counter = { v: 0 };
      el.textContent = '0' + suffix;
      gsap.to(counter, {
        v: end,
        duration: 2.2,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%' },
        onUpdate: () => { el.textContent = Math.round(counter.v) + suffix; },
      });
    });
  }

  /* Mobile only: menu overlay and hide-on-scroll nav */
  const mobileQuery = window.matchMedia('(max-width: 767px)');
  const nav = document.getElementById('main-nav');
  const navInner = nav && nav.querySelector('.max-w-7xl');

  if (nav && navInner) {
    const onHome = !!document.getElementById('heritage');
    const base = onHome ? '' : 'slate.html';
    const items = [
      ['#heritage', 'Our Process'],
      ['#work', 'Why SLATE'],
      ['#services', 'Services'],
      ['#faq', 'Questions'],
    ];

    const btn = document.createElement('button');
    btn.id = 'luxe-menu-btn';
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'luxe-menu');
    btn.innerHTML = '<span class="mm-text">Menu</span><span class="bars" aria-hidden="true"><i></i><i></i></span>';
    navInner.appendChild(btn);

    const menu = document.createElement('div');
    menu.id = 'luxe-menu';
    menu.setAttribute('aria-hidden', 'true');
    const linkHtml = items
      .map(([hash, label], i) => '<a href="' + base + hash + '"><span class="mm-i"><em>0' + (i + 1) + '</em><strong>' + label + '</strong></span></a>')
      .join('') +
      '<a href="testimonials.html"><span class="mm-i"><em>05</em><strong>Testimonials</strong></span></a>';
    menu.innerHTML =
      '<div><p class="mm-label">Navigate</p><nav class="mm-links">' + linkHtml + '</nav></div>' +
      '<div class="mm-foot"><p>12 Artisan Row<br>Mayfair, London<br><a href="tel:+442079460192" style="color:#f5f3ee">+44 20 7946 0192</a></p>' +
      '<a class="mm-cta" href="' + base + '#book">Book a consultation</a></div>';
    document.body.appendChild(menu);

    let open = false;
    const inner = () => menu.querySelectorAll('.mm-i');
    const setOpen = (next) => {
      open = next;
      btn.setAttribute('aria-expanded', String(open));
      btn.querySelector('.mm-text').textContent = open ? 'Close' : 'Menu';
      menu.setAttribute('aria-hidden', String(!open));
      root.classList.toggle('menu-open', open);
      nav.classList.remove('nav-hidden');
      if (lenis) open ? lenis.stop() : lenis.start();
      if (!hasGsap) {
        menu.style.visibility = open ? 'visible' : 'hidden';
        menu.style.opacity = open ? '1' : '0';
        return;
      }
      if (open) {
        gsap.to(menu, { autoAlpha: 1, duration: 0.45, ease: 'power2.out' });
        gsap.fromTo(inner(), { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'power4.out', stagger: 0.06, delay: 0.1 });
        gsap.fromTo(menu.querySelector('.mm-foot'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.35 });
      } else {
        gsap.to(menu, { autoAlpha: 0, duration: 0.35, ease: 'power2.in' });
      }
    };

    btn.addEventListener('click', () => setOpen(!open));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) setOpen(false); });
    mobileQuery.addEventListener('change', (e) => { if (!e.matches && open) setOpen(false); });

    let lastY = window.scrollY;
    window.addEventListener('scroll', () => {
      if (!mobileQuery.matches || open) return;
      const y = window.scrollY;
      if (y > 120 && y > lastY + 4) nav.classList.add('nav-hidden');
      else if (y < lastY - 4 || y <= 120) nav.classList.remove('nav-hidden');
      lastY = y;
    }, { passive: true });
  }

  /* Booking shortcut: Call / Book bar on phones, floating Book button on desktop */
  if (nav) {
    const onHome = !!document.getElementById('heritage');
    const bookHref = (onHome ? '' : 'slate.html') + '#book';
    const cta = document.createElement('div');
    cta.id = 'luxe-cta';
    cta.innerHTML =
      '<a class="cta-call" href="tel:+442079460192">Call us</a>' +
      '<a class="cta-book" href="' + bookHref + '">Book a consultation</a>';
    document.body.appendChild(cta);

    const book = document.getElementById('book');
    let bookInView = false;
    if (book && 'IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        bookInView = entries[0].isIntersecting;
        updateCta();
      }, { threshold: 0.15 }).observe(book);
    }
    function updateCta() {
      const pastHero = window.scrollY > window.innerHeight * 0.75;
      cta.classList.toggle('is-visible', pastHero && !bookInView);
    }
    window.addEventListener('scroll', updateCta, { passive: true });
    updateCta();
  }

  if (hasST) window.addEventListener('load', () => ScrollTrigger.refresh());

  window.luxe = { lenis, splitWords, reduceMotion, finePointer };
})();

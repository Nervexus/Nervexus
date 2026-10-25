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

  /* Vignette */
  const vignette = document.createElement('div');
  vignette.id = 'luxe-vignette';
  vignette.setAttribute('aria-hidden', 'true');
  document.body.appendChild(vignette);

  /* Custom cursor */
  if (hasGsap && finePointer) {
    root.classList.add('has-luxe-cursor');
    const dot = document.createElement('div');
    dot.id = 'luxe-cursor-dot';
    const ring = document.createElement('div');
    ring.id = 'luxe-cursor-ring';
    document.body.append(dot, ring);
    gsap.set([dot, ring], { x: -100, y: -100 });

    const dotX = gsap.quickTo(dot, 'x', { duration: 0.08 });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.08 });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });

    window.addEventListener('mousemove', (e) => {
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
    });
    document.addEventListener('mouseover', (e) => {
      ring.classList.toggle('is-hover', !!e.target.closest('a, button, [data-cursor]'));
    });
    document.addEventListener('mouseleave', () => gsap.to([dot, ring], { opacity: 0, duration: 0.3 }));
    document.addEventListener('mouseenter', () => gsap.to([dot, ring], { opacity: 1, duration: 0.3 }));
  }

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

  if (hasST) window.addEventListener('load', () => ScrollTrigger.refresh());

  window.luxe = { lenis, splitWords, reduceMotion, finePointer };
})();

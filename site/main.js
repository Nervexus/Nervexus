/* Reveal, deliberately first and self-contained. It used to sit inside the same IIFE as the
   intro-mask animation, so any error in that code stopped the observer ever registering and
   the entire page below the hero stayed invisible. */
(function(){
  var els = document.querySelectorAll('.reveal');
  els.forEach(function(el, i){
    if (el.classList.contains('feature')) el.style.transitionDelay = (i % 6) * 70 + 'ms';
  });
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    els.forEach(function(el){ io.observe(el); });
  } else {
    els.forEach(function(el){ el.classList.add('in'); });
  }

  document.documentElement.setAttribute('data-reveal-ready','1');
})();

(function(){
  var introMask = document.getElementById('introMask');
  if (introMask){
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    var introHeader = document.querySelector('header');
    if (introHeader){ introHeader.style.opacity = '0'; introHeader.style.pointerEvents = 'none'; introHeader.style.transition = 'opacity .25s ease'; }
    var maskReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var maskDist = Math.max(320, window.innerHeight * 0.75);
    var introScroll = introMask.querySelector('.intro-scroll');
    var maskCurrent = 0, maskTarget = 0, maskRafId = null;
    var maskTick = function(){
      maskCurrent += (maskTarget - maskCurrent) * (maskReduced ? 1 : 0.09);
      if (Math.abs(maskTarget - maskCurrent) < 0.001) maskCurrent = maskTarget;
      introMask.style.opacity = String(1 - maskCurrent);
      if (introScroll) introScroll.style.opacity = String(Math.max(0, 1 - maskCurrent * 2.2));
      if (introHeader){
        introHeader.style.opacity = String(maskCurrent);
        introHeader.style.pointerEvents = maskCurrent > 0.5 ? 'auto' : 'none';
      }
      if (maskCurrent !== maskTarget){
        maskRafId = requestAnimationFrame(maskTick);
      } else {
        maskRafId = null;
      }
    };
    var updateMask = function(){
      var y = window.scrollY || 0;
      maskTarget = Math.min(1, y / maskDist);
      if (maskRafId === null) maskRafId = requestAnimationFrame(maskTick);
    };
    updateMask();
    window.addEventListener('scroll', updateMask, { passive: true });
  }

  var glow = document.querySelector('.hero-glow');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced && glow){
    var ticking = false;
    window.addEventListener('scroll', function(){
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function(){
        var y = window.scrollY || 0;
        glow.style.transform = 'translateY(' + (y * 0.18) + 'px)';
        ticking = false;
      });
    }, { passive: true });
  }

  var h1 = document.querySelector('.hero h1');
  if (h1 && !reduced){
    var nodes = Array.prototype.slice.call(h1.childNodes);
    var frag = document.createDocumentFragment();
    var wordIndex = 0;
    function animatedWrap(el){
      el.style.display = 'inline-block';
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.animation = 'wordIn .7s cubic-bezier(.16,1,.3,1) forwards';
      el.style.animationDelay = (wordIndex * 60) + 'ms';
      wordIndex++;
    }
    nodes.forEach(function(node){
      if (node.nodeType === 3){
        var parts = node.textContent.split(' ');
        parts.forEach(function(w, i){
          if (w === ''){ if (i < parts.length - 1) frag.appendChild(document.createTextNode(' ')); return; }
          var span = document.createElement('span');
          span.textContent = w;
          animatedWrap(span);
          frag.appendChild(span);
          if (i < parts.length - 1) frag.appendChild(document.createTextNode(' '));
        });
      } else if (node.tagName === 'BR'){
        frag.appendChild(node.cloneNode(true));
      } else {
        var wrapper = node.cloneNode(true);
        animatedWrap(wrapper);
        frag.appendChild(wrapper);
      }
    });
    h1.innerHTML = '';
    h1.appendChild(frag);
  }
})();

/* Mobile nav toggle. Kept to the header element rather than the button so the panel and the
   burger animation can both key off one class. */
(function(){
  var toggle = document.querySelector('.nav-toggle');
  var head = document.querySelector('header');
  if (!toggle || !head) return;
  toggle.addEventListener('click', function(){
    var open = head.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  // Tapping anywhere outside closes it, so the panel can't be left covering the page.
  document.addEventListener('click', function(e){
    if (!head.classList.contains('nav-open')) return;
    if (head.contains(e.target)) return;
    head.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
  });
})();

/* Feature cards fold on a phone only. Bound once and gated on a media query at click time
   rather than at load, so a rotate or a resize does not leave a desktop card stuck shut. */
(function(){
  var cards = document.querySelectorAll('.feature');
  if (!cards.length) return;
  var phone = function(){ return window.matchMedia('(max-width:760px)').matches; };
  Array.prototype.forEach.call(cards, function(card){
    var head = card.querySelector('h3');
    if (head){ card.setAttribute('role','button'); card.setAttribute('tabindex','0'); card.setAttribute('aria-expanded','false'); }
    var toggle = function(){
      if (!phone()) return;
      var open = card.classList.toggle('open');
      card.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(); }
    });
  });
})();

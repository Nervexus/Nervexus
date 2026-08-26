(function(){
  var section = document.getElementById('morphHero');
  var scrollWrap = document.getElementById('morphHeroScroll');
  if (!section || !scrollWrap) return;
  var cardsWrap = document.getElementById('morphCards');
  var introText = document.getElementById('morphIntroText');
  var arcText = document.getElementById('morphArcText');
  if (!cardsWrap || window.innerWidth <= 760) return;

  var ICON_BASE = 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/';
  // Anthropic, Gemini, ElevenLabs, Supabase are real Nervexus integrations.
  // The rest fill out the grid with other real, recognizable brands — every
  // logo below is verified to resolve against the icon CDN.
  var PROVIDERS = [
    {logo:'anthropic',color:'#d97757',name:'Anthropic'},
    {logo:'googlegemini',color:'#4285f4',name:'Google Gemini'},
    {logo:'elevenlabs',color:'#111114',name:'ElevenLabs'},
    {logo:'supabase',color:'#3ecf8e',name:'Supabase'},
    {logo:'newyorktimes',color:'#000000',name:'New York Times'},
    {logo:'theguardian',color:'#052962',name:'The Guardian'},
    {logo:'bbc',color:'#000000',name:'BBC News'},
    {logo:'cnn',color:'#a6192e',name:'CNN'},
    {logo:'techcrunch',color:'#0a9e01',name:'TechCrunch'},
    {logo:'arstechnica',color:'#ff4e00',name:'Ars Technica'},
    {logo:'googlenews',color:'#34a853',name:'Google News'},
    {logo:'wikipedia',color:'#636466',name:'Wikipedia'},
    {logo:'arxiv',color:'#b31b1b',name:'arXiv'},
    {logo:'googlescholar',color:'#669df6',name:'Google Scholar'},
    {logo:'coinmarketcap',color:'#f2a900',name:'CoinMarketCap'},
    {logo:'coinbase',color:'#0052ff',name:'Coinbase'},
    {logo:'tradingview',color:'#131722',name:'TradingView'},
    {logo:'ycombinator',color:'#ff6600',name:'Hacker News'}
  ];
  var TOTAL = PROVIDERS.length;

  var cards = PROVIDERS.map(function(p){
    var el = document.createElement('div');
    el.className = 'mh-card';
    var markInner = p.logo
      ? '<div class="mh-mark" style="background:' + p.color + '; -webkit-mask-image:url(' + ICON_BASE + p.logo + '.svg); mask-image:url(' + ICON_BASE + p.logo + '.svg);" title="' + p.name + '"></div>'
      : '<div class="mh-mark mh-mark-text' + (p.dark ? ' mh-mark-dark' : '') + '" style="background:' + p.color + ';" title="' + p.name + '">' + p.mark + '</div>';
    el.innerHTML =
      '<div class="mh-card-inner">' +
        '<div class="mh-front">' + markInner + '</div>' +
        '<div class="mh-back"></div>' +
      '</div>';
    cardsWrap.appendChild(el);
    return el;
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setTarget(el, x, y, rot, scale, opacity){
    el.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + rot + 'deg) scale(' + scale + ')';
    el.style.opacity = String(opacity);
  }

  var W = 0, H = 0;
  function measure(){ var r = section.getBoundingClientRect(); W = r.width; H = r.height; }
  measure();
  window.addEventListener('resize', measure);

  function circleRadius(){
    measure();
    var minDim = Math.min(W, H);
    return Math.min(minDim * 0.34, 260);
  }
  function layoutCircle(){
    var radius = circleRadius();
    cards.forEach(function(el, i){
      var angle = (i / TOTAL) * 360;
      var rad = angle * Math.PI / 180;
      setTarget(el, Math.cos(rad) * radius, Math.sin(rad) * radius, angle + 90, 1, 1);
    });
  }

  layoutCircle();
  introText.classList.add('mh-show');

  var MAX_SCROLL = 1800;
  var MORPH_END = 460;
  var scrollTarget = 0;
  var scrollCurrent = 0;
  var rafId = null;

  function renderArc(v){
    measure();
    var isMobile = W < 900;
    var radius = circleRadius();

    var morphT = Math.min(1, v / MORPH_END);
    var baseRadius = Math.min(W, H * 1.5);
    var arcRadius = baseRadius * (isMobile ? 1.3 : 1.0);
    var arcApexY = H * (isMobile ? 0.32 : 0.22);
    var arcCenterY = arcApexY + arcRadius;
    var spread = isMobile ? 100 : 130;
    var startAngle = -90 - spread / 2;
    var step = spread / (TOTAL - 1);
    var shuffleT = Math.max(0, Math.min(1, (v - MORPH_END) / (MAX_SCROLL - MORPH_END)));
    var maxRot = spread * 0.8;
    var boundedRot = -shuffleT * maxRot;

    cards.forEach(function(el, i){
      var circleAngle = (i / TOTAL) * 360;
      var circleRad = circleAngle * Math.PI / 180;
      var cx = Math.cos(circleRad) * radius;
      var cy = Math.sin(circleRad) * radius;
      var crot = circleAngle + 90;

      var arcAngle = startAngle + i * step + boundedRot;
      var arcRad = arcAngle * Math.PI / 180;
      var ax = Math.cos(arcRad) * arcRadius;
      var ay = Math.sin(arcRad) * arcRadius + arcCenterY;
      var arot = arcAngle + 90;
      var ascale = isMobile ? 1.15 : 1.3;

      var x = cx + (ax - cx) * morphT;
      var y = cy + (ay - cy) * morphT;
      var rot = crot + (arot - crot) * morphT;
      var scale = 1 + (ascale - 1) * morphT;
      setTarget(el, x, y, rot, scale, 1);
    });

    if (morphT > 0.75){
      arcText.classList.add('mh-show');
      introText.classList.remove('mh-show');
    } else {
      arcText.classList.remove('mh-show');
      introText.classList.add('mh-show');
    }
  }

  function tick(){
    scrollCurrent += (scrollTarget - scrollCurrent) * (reduced ? 1 : 0.15);
    if (Math.abs(scrollTarget - scrollCurrent) < 0.5) scrollCurrent = scrollTarget;
    renderArc(scrollCurrent);
    if (scrollCurrent !== scrollTarget){
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }
  function kick(){ if (rafId === null) rafId = requestAnimationFrame(tick); }

  // The wrapper is a tall block with the hero pinned via position:sticky inside it —
  // real page scroll, no wheel/touch hijacking. Progress is just how far scrolled
  // through that block, so it's always correct on refresh, resize, or scrolling
  // back and forth, with nothing to get stuck in a bad state.
  function updateFromScroll(){
    var rect = scrollWrap.getBoundingClientRect();
    var scrollableDist = rect.height - window.innerHeight;
    var t = scrollableDist > 0 ? Math.max(0, Math.min(1, -rect.top / scrollableDist)) : 0;
    scrollTarget = t * MAX_SCROLL;
    kick();
  }

  window.addEventListener('scroll', updateFromScroll, { passive: true });
  window.addEventListener('resize', updateFromScroll);
  updateFromScroll();

  // Scrolling far away and back can leave the browser's compositor layer for
  // these cards stale (they render blank until something forces a repaint).
  // Re-apply the current frozen state whenever the section re-enters view.
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) renderArc(scrollCurrent);
      });
    }, { threshold: 0.05 });
    io.observe(section);
  }
})();

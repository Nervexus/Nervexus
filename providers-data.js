/* ============================================================================
   providers-data.js — AI & Intelligence Provider Registry for Command X.

   The single source of truth for every connectable service. Adding a new
   provider or source = adding one entry here; no application logic changes.

   window.PROVIDERS_DATA = {
     AI_PROVIDERS[]      — 10 LLM providers (official API shape + model catalog)
     INTEL_SOURCES[]     — curated intelligence sources across 7 categories (labels only)
     AI_FEATURES[]       — features that can be routed to a provider
     INTEL_CATEGORIES[]  — ordered category list for the source browser
     BRIEFING_CATEGORIES[] — the executive-briefing taxonomy
   }

   Field notes:
     mark      : 1–2 char monogram used as the logo tile
     color     : brand-ish accent for the tile
     auth      : 'apikey' | 'oauth' | 'rss' | 'userpass' | 'licensed' | 'open'
     keyRe     : validation pattern (string) for the API key format
     models[]  : catalog returned by "fetch available models" (simulated)
     live      : true only for adapters that genuinely run in this environment
   ============================================================================ */
(function (root) {
  'use strict';

  var AI_PROVIDERS = [
    { id:'openai', name:'OpenAI', mark:'OA', color:'#10a37f', endpoint:'https://api.openai.com/v1',
      auth:'apikey', keyRe:'^sk-[A-Za-z0-9_\\-]{20,}$', keyHint:'sk-…', docs:'platform.openai.com',
      usage:true, models:['gpt-5.5','gpt-5','gpt-4.1','gpt-4o','o4-mini'], defaultModel:'gpt-5.5' },
    { id:'anthropic', name:'Anthropic (Claude)', mark:'AN', color:'#d97757', endpoint:'https://api.anthropic.com/v1',
      auth:'apikey', keyRe:'^sk-ant-[A-Za-z0-9_\\-]{20,}$', keyHint:'sk-ant-…', docs:'docs.anthropic.com',
      usage:true, models:['claude-opus-4.5','claude-sonnet-4.5','claude-haiku-4.5'], defaultModel:'claude-sonnet-4.5' },
    { id:'google', name:'Google Gemini', mark:'GE', color:'#4285f4', endpoint:'https://generativelanguage.googleapis.com/v1',
      auth:'apikey', keyRe:'^AIza[A-Za-z0-9_\\-]{30,}$', keyHint:'AIza…', docs:'ai.google.dev',
      usage:true, live:true, freeTier:true, models:['gemini-2.5-pro','gemini-2.5-flash','gemini-2.0-flash'], defaultModel:'gemini-2.5-flash' },
    { id:'xai', name:'xAI (Grok)', mark:'XA', color:'#111114', endpoint:'https://api.x.ai/v1',
      auth:'apikey', keyRe:'^xai-[A-Za-z0-9_\\-]{20,}$', keyHint:'xai-…', docs:'docs.x.ai',
      usage:true, models:['grok-4','grok-4-mini','grok-3'], defaultModel:'grok-4' },
    { id:'mistral', name:'Mistral AI', mark:'MI', color:'#fa5010', endpoint:'https://api.mistral.ai/v1',
      auth:'apikey', keyRe:'^[A-Za-z0-9]{32,}$', keyHint:'32+ chars', docs:'docs.mistral.ai',
      usage:true, models:['mistral-large-2','mistral-medium-3','codestral-2','ministral-8b'], defaultModel:'mistral-large-2' },
    { id:'deepseek', name:'DeepSeek', mark:'DS', color:'#4d6bfe', endpoint:'https://api.deepseek.com/v1',
      auth:'apikey', keyRe:'^sk-[A-Za-z0-9]{20,}$', keyHint:'sk-…', docs:'platform.deepseek.com',
      usage:true, models:['deepseek-v3.2','deepseek-r1','deepseek-coder-v2'], defaultModel:'deepseek-v3.2' },
    { id:'openrouter', name:'OpenRouter', mark:'OR', color:'#6467f2', endpoint:'https://openrouter.ai/api/v1',
      auth:'apikey', keyRe:'^sk-or-[A-Za-z0-9_\\-]{20,}$', keyHint:'sk-or-…', docs:'openrouter.ai/docs',
      usage:true, models:['auto','anthropic/claude-sonnet-4.5','openai/gpt-5.5','google/gemini-2.5-pro','meta/llama-4'], defaultModel:'auto' },
    { id:'together', name:'Together AI', mark:'TO', color:'#0f6fff', endpoint:'https://api.together.xyz/v1',
      auth:'apikey', keyRe:'^[A-Za-z0-9]{40,}$', keyHint:'40+ chars', docs:'docs.together.ai',
      usage:true, models:['llama-4-maverick','qwen-3-72b','deepseek-v3','mixtral-8x22b'], defaultModel:'llama-4-maverick' },
    { id:'perplexity', name:'Perplexity AI', mark:'PP', color:'#20b8cd', endpoint:'https://api.perplexity.ai',
      auth:'apikey', keyRe:'^pplx-[A-Za-z0-9]{20,}$', keyHint:'pplx-…', docs:'docs.perplexity.ai',
      usage:true, models:['sonar-pro','sonar-reasoning-pro','sonar'], defaultModel:'sonar-pro' },
    { id:'cohere', name:'Cohere', mark:'CO', color:'#39594d', endpoint:'https://api.cohere.ai/v1',
      auth:'apikey', keyRe:'^[A-Za-z0-9]{40,}$', keyHint:'40+ chars', docs:'docs.cohere.com',
      usage:true, models:['command-a','command-r-plus','command-r'], defaultModel:'command-a' }
  ];

  // category: News | Markets | Economic | Crypto | Government | Business | Tech
  // Trimmed to one recognizable source per real need — these are display/labeling only
  // (no source here makes a real API call; the live-search AI providers above do the
  // actual data fetching), so the list favors well-known, mostly-free/open services.
  var S = function (id,name,mark,color,category,auth,extra){ return Object.assign({id:id,name:name,mark:mark,color:color,category:category,auth:auth},extra||{}); };
  var INTEL_SOURCES = [
    S('reuters','Reuters','RE','#ff8000','News','licensed',{tier:1,region:'Global'}),
    S('bbc','BBC','BC','#bb1919','News','rss',{tier:1,region:'UK'}),
    S('ap','Associated Press','AP','#ff322e','News','licensed',{tier:1,region:'Global'}),
    S('yahoofin','Yahoo Finance','YF','#6001d2','Markets','apikey',{tier:2,region:'Global'}),
    S('alphavantage','Alpha Vantage','AV','#1f6feb','Markets','apikey',{tier:2}),
    S('fred','FRED','FR','#0a3161','Economic','apikey',{tier:1,region:'US'}),
    S('worldbank','World Bank','WB','#009fda','Economic','open',{tier:1,region:'Global'}),
    S('coingecko','CoinGecko','CG','#8dc63f','Crypto','apikey',{tier:1}),
    S('secedgar','SEC EDGAR','SE','#1a4480','Government','open',{tier:1,region:'US'}),
    S('govuk','GOV.UK','GU','#1d70b8','Government','open',{tier:1,region:'UK'}),
    S('opencorporates','OpenCorporates','OC','#5b2a86','Business','apikey',{tier:2,region:'Global'}),
    S('arxiv','arXiv','AX','#b31b1b','Tech','open',{tier:2})
  ];

  // Dedicated news/data-headline APIs (distinct from the AI_PROVIDERS LLMs above) — connectable
  // the same way: save a key, test, toggle on. tier: 'free' | 'freemium' | 'paid'.
  // category: 'premium' | 'free' | 'financial' | 'tech' | 'crypto'. A source can be tagged into
  // more than the obvious bucket by category — kept singular here for simple filtering.
  var NEWS_SOURCES = [
    // Premium publishers (enterprise/licensed)
    { id:'ft', name:'Financial Times', mark:'FT', color:'#fff1e5', dark:true, endpoint:'https://api.ft.com', category:'premium',
      auth:'apikey', keyHint:'licensed key', docs:'developer.ft.com', tier:'paid', tierNote:'Enterprise licensing required' },
    { id:'nyt', name:'New York Times', mark:'NY', color:'#000000', endpoint:'https://api.nytimes.com/svc', category:'premium',
      auth:'apikey', keyHint:'32+ chars', docs:'developer.nytimes.com', tier:'freemium', tierNote:'Free dev tier, then enterprise plans' },
    { id:'bloomberg', name:'Bloomberg', mark:'BB', color:'#000000', endpoint:'https://api.bloomberg.com', category:'premium',
      auth:'apikey', keyHint:'enterprise key', docs:'bloomberg.com/professional', tier:'paid', tierNote:'Enterprise pricing' },
    { id:'reuters', name:'Reuters', mark:'RE', color:'#ff8000', endpoint:'https://api.reuters.com', category:'premium',
      auth:'apikey', keyHint:'enterprise key', docs:'reutersconnect.com', tier:'paid', tierNote:'Enterprise API' },
    { id:'dowjones', name:'Dow Jones', mark:'DJ', color:'#000000', endpoint:'https://api.dowjones.com', category:'premium',
      auth:'apikey', keyHint:'enterprise key', docs:'dowjones.com/dna', tier:'paid', tierNote:'Includes WSJ content' },
    { id:'wsj', name:'The Wall Street Journal', mark:'WSJ', color:'#000000', endpoint:'https://api.dowjones.com/wsj', category:'premium',
      auth:'apikey', keyHint:'via Dow Jones', docs:'dowjones.com/dna', tier:'paid', tierNote:'Premium business news, via Dow Jones' },
    { id:'economist', name:'The Economist', mark:'EC', color:'#e3120b', endpoint:'https://api.economist.com', category:'premium',
      auth:'apikey', keyHint:'licensed key', docs:'economist.com/api', tier:'paid', tierNote:'Global economics & politics' },
    { id:'factset', name:'FactSet', mark:'FS', color:'#0072a3', endpoint:'https://api.factset.com', category:'financial',
      auth:'apikey', keyHint:'enterprise key', docs:'developer.factset.com', tier:'paid', tierNote:'Equities, markets, earnings' },
    { id:'morningstar', name:'Morningstar', mark:'MS', color:'#DB2718', endpoint:'https://api.morningstar.com', category:'financial',
      auth:'apikey', keyHint:'enterprise key', docs:'developer.morningstar.com', tier:'paid', tierNote:'Investment & fund research' },
    { id:'ap', name:'Associated Press', mark:'AP', color:'#e01f27', endpoint:'https://api.ap.org', category:'premium',
      auth:'apikey', keyHint:'32+ chars', docs:'developer.ap.org', tier:'paid', tierNote:'Global breaking news' },
    // Free / generous free tier
    { id:'guardianapi', name:'The Guardian', mark:'GU', color:'#052962', endpoint:'https://content.guardianapis.com', category:'free',
      auth:'apikey', keyHint:'32+ chars', docs:'open-platform.theguardian.com', tier:'free', tierNote:'Full article text, commercial use OK' },
    { id:'newsdataio', name:'NewsData.io', mark:'ND', color:'#2fce86', endpoint:'https://newsdata.io/api/1', category:'free',
      auth:'apikey', keyHint:'pub_…', docs:'newsdata.io/documentation', tier:'free', tierNote:'200 credits/day, 89 languages' },
    { id:'currentsapi', name:'Currents API', mark:'CU', color:'#2fce86', endpoint:'https://api.currentsapi.services/v1', category:'free',
      auth:'apikey', keyHint:'32+ chars', docs:'currentsapi.services/en/docs', tier:'free', tierNote:'~600 req/day, commercial use OK' },
    { id:'gnews', name:'GNews', mark:'GN', color:'#e8b45a', endpoint:'https://gnews.io/api/v4', category:'free',
      auth:'apikey', keyHint:'32+ chars', docs:'gnews.io/docs', tier:'freemium', tierNote:'Free: 100 req/day. Paid from ~$84/mo' },
    { id:'newsapiorg', name:'NewsAPI.org', mark:'NW', color:'#ff5563', endpoint:'https://newsapi.org/v2', category:'free',
      auth:'apikey', keyHint:'32+ chars', docs:'newsapi.org/docs', tier:'paid', tierNote:'Free tier is dev-only. Paid from $449/mo' },
    { id:'mediastack', name:'Mediastack', mark:'MS', color:'#ff5563', endpoint:'http://api.mediastack.com/v1', category:'free',
      auth:'apikey', keyHint:'32+ chars', docs:'mediastack.com/documentation', tier:'freemium', tierNote:'Limited free tier; paid from ~$25/mo' },
    { id:'hackernews', name:'Hacker News API', mark:'HN', color:'#ff6600', endpoint:'https://hacker-news.firebaseio.com/v0', category:'tech',
      auth:'open', keyHint:'no key needed', docs:'github.com/HackerNews/API', tier:'free', tierNote:'Completely free, no key' },
    { id:'gdelt', name:'GDELT', mark:'GD', color:'#2fce86', endpoint:'https://api.gdeltproject.org/api/v2', category:'free',
      auth:'open', keyHint:'no key needed', docs:'gdeltproject.org', tier:'free', tierNote:'Massive global events database, free' },
    // Technology
    { id:'theverge', name:'The Verge', mark:'TV', color:'#e8b45a', endpoint:'https://www.theverge.com/rss', category:'tech',
      auth:'rss', keyHint:'no key needed', docs:'theverge.com/rss', tier:'free', tierNote:'RSS feed' },
    { id:'techcrunch', name:'TechCrunch', mark:'TC', color:'#0a9e01', endpoint:'https://techcrunch.com/feed', category:'tech',
      auth:'rss', keyHint:'no key needed', docs:'techcrunch.com/rss', tier:'free', tierNote:'RSS / API partners' },
    { id:'arstechnica', name:'Ars Technica', mark:'AR', color:'#ff4e00', endpoint:'https://arstechnica.com/feed', category:'tech',
      auth:'rss', keyHint:'no key needed', docs:'arstechnica.com/rss', tier:'free', tierNote:'RSS feed' },
    { id:'wired', name:'Wired', mark:'WI', color:'#000000', endpoint:'https://www.wired.com/feed', category:'tech',
      auth:'rss', keyHint:'no key needed', docs:'wired.com/about/rss', tier:'free', tierNote:'RSS feed' },
    // Financial market data
    { id:'alphavantage', name:'Alpha Vantage', mark:'AV', color:'#ffc300', endpoint:'https://www.alphavantage.co/query', category:'financial',
      auth:'apikey', keyHint:'32+ chars', docs:'alphavantage.co/documentation', tier:'freemium', tierNote:'Free tier: 25 req/day' },
    { id:'finnhub', name:'Finnhub', mark:'FH', color:'#00a37f', endpoint:'https://finnhub.io/api/v1', category:'financial',
      auth:'apikey', keyHint:'32+ chars', docs:'finnhub.io/docs/api', tier:'freemium', tierNote:'Free tier: 60 req/min' },
    { id:'fmp', name:'Financial Modeling Prep', mark:'FM', color:'#0072a3', endpoint:'https://financialmodelingprep.com/api/v3', category:'financial',
      auth:'apikey', keyHint:'32+ chars', docs:'site.financialmodelingprep.com/developer', tier:'freemium', tierNote:'Free tier: 250 req/day' },
    { id:'twelvedata', name:'Twelve Data', mark:'TD', color:'#5b2be8', endpoint:'https://api.twelvedata.com', category:'financial',
      auth:'apikey', keyHint:'32+ chars', docs:'twelvedata.com/docs', tier:'freemium', tierNote:'Free tier: 800 req/day' },
    { id:'polygon', name:'Polygon.io', mark:'PY', color:'#111114', endpoint:'https://api.polygon.io', category:'financial',
      auth:'apikey', keyHint:'32+ chars', docs:'polygon.io/docs', tier:'freemium', tierNote:'Free tier: 5 req/min' },
    { id:'nasdaqdl', name:'Nasdaq Data Link', mark:'ND', color:'#00a4e4', endpoint:'https://data.nasdaq.com/api/3', category:'financial',
      auth:'apikey', keyHint:'32+ chars', docs:'docs.data.nasdaq.com', tier:'freemium', tierNote:'Free tier available' },
    { id:'iexcloud', name:'IEX Cloud', mark:'IX', color:'#1a73e8', endpoint:'https://cloud.iexapis.com/stable', category:'financial',
      auth:'apikey', keyHint:'pk_…', docs:'iexcloud.io/docs', tier:'freemium', tierNote:'Free tier: 50k msgs/mo' },
    // Crypto
    { id:'coingecko', name:'CoinGecko', mark:'CG', color:'#8dc63f', endpoint:'https://api.coingecko.com/api/v3', category:'crypto',
      auth:'open', keyHint:'no key needed', docs:'coingecko.com/en/api', tier:'free', tierNote:'Free, no key required' },
    { id:'coinmarketcap', name:'CoinMarketCap', mark:'CM', color:'#f2a900', endpoint:'https://pro-api.coinmarketcap.com/v1', category:'crypto',
      auth:'apikey', keyHint:'32+ chars', docs:'coinmarketcap.com/api/documentation', tier:'freemium', tierNote:'Free tier: 10k credits/mo' },
    { id:'cryptocompare', name:'CryptoCompare', mark:'CC', color:'#0e3f5d', endpoint:'https://min-api.cryptocompare.com/data', category:'crypto',
      auth:'apikey', keyHint:'32+ chars', docs:'min-api.cryptocompare.com/documentation', tier:'freemium', tierNote:'Free tier available' },
    { id:'coinapi', name:'CoinAPI', mark:'CA', color:'#111114', endpoint:'https://rest.coinapi.io/v1', category:'crypto',
      auth:'apikey', keyHint:'32+ chars', docs:'coinapi.io/docs', tier:'freemium', tierNote:'Free tier: 100 req/day' }
  ];

  // Text-to-speech providers (distinct from the LLM AI_PROVIDERS above) — connect a key the
  // same way, then pick a voice. Falls back to the browser's built-in speech synthesis if unset.
  var TTS_PROVIDERS = [
    { id:'elevenlabs', name:'ElevenLabs', mark:'EL', color:'#111114', endpoint:'https://api.elevenlabs.io/v1',
      auth:'apikey', keyHint:'32+ chars', docs:'elevenlabs.io/docs', tier:'freemium', tierNote:'Free tier: 10k chars/mo',
      voices:[
        { id:'21m00Tcm4TlvDq8ikWAM', name:'Rachel — calm, professional (f)' },
        { id:'AZnzlk1XvdvUeBnXmlld', name:'Domi — confident, strong (f)' },
        { id:'EXAVITQu4vr4xnSDxMaL', name:'Bella — warm, friendly (f)' },
        { id:'ErXwobaYiN019PkySvjV', name:'Antoni — well-rounded (m)' },
        { id:'TxGEqnHWrfWFTfGW9XjX', name:'Josh — deep, casual (m)' },
        { id:'VR6AewLTigWG4xSOukaG', name:'Arnold — crisp, authoritative (m)' },
        { id:'pNInz6obpgDQGcFmaJgB', name:'Adam — deep, narration (m)' },
        { id:'yoZ06aMxZJJ28mfd3POQ', name:'Sam — raspy, energetic (m)' }
      ] }
  ];

  var NEWS_CATEGORIES = [
    { id:'all', label:'ALL' }, { id:'premium', label:'PREMIUM' }, { id:'free', label:'FREE' },
    { id:'financial', label:'FINANCIAL' }, { id:'tech', label:'TECHNOLOGY' }, { id:'crypto', label:'CRYPTO' }
  ];

  var INTEL_CATEGORIES = [    { id:'All', label:'All' },
    { id:'News', label:'News' },
    { id:'Markets', label:'Market Data' },
    { id:'Economic', label:'Economic' },
    { id:'Crypto', label:'Crypto' },
    { id:'Government', label:'Government' },
    { id:'Business', label:'Business' },
    { id:'Tech', label:'Tech & AI' }
  ];

  var AI_FEATURES = [
    { id:'voice', label:'Voice Assistant', glyph:'◉' },
    { id:'briefings', label:'Daily Briefings', glyph:'◆' },
    { id:'business', label:'Business Strategy', glyph:'⬡' },
    { id:'writing', label:'Writing Assistant', glyph:'✎' },
    { id:'workout', label:'Workout Planning', glyph:'✚' },
    { id:'image', label:'Image Analysis', glyph:'◫' },
    { id:'coding', label:'Coding', glyph:'⌗' },
    { id:'market', label:'Market Analysis', glyph:'↗' }
  ];

  // Recommended default routing (by provider id) — used to seed config.
  var DEFAULT_ROUTING = {
    voice:'anthropic', briefings:'openai', business:'openai', writing:'anthropic',
    workout:'google', image:'google', coding:'anthropic', market:'openai'
  };

  var BRIEFING_CATEGORIES = ['Global Money','Billionaire News','Major Company Movements','Global Economy',
    'Government & Laws','Banking','AI','Technology','Wars & Geopolitics','Commodities','Cryptocurrency','Investment Opportunities'];

  var AUTH_LABEL = { apikey:'API KEY', oauth:'OAUTH', rss:'RSS', userpass:'LOGIN', licensed:'LICENSED', open:'OPEN' };

  root.PROVIDERS_DATA = {
    AI_PROVIDERS: AI_PROVIDERS,
    INTEL_SOURCES: INTEL_SOURCES,
    NEWS_SOURCES: NEWS_SOURCES,
    TTS_PROVIDERS: TTS_PROVIDERS,
    NEWS_CATEGORIES: NEWS_CATEGORIES,
    INTEL_CATEGORIES: INTEL_CATEGORIES,
    AI_FEATURES: AI_FEATURES,
    DEFAULT_ROUTING: DEFAULT_ROUTING,
    BRIEFING_CATEGORIES: BRIEFING_CATEGORIES,
    AUTH_LABEL: AUTH_LABEL,
    byId: function (id) { for (var i=0;i<AI_PROVIDERS.length;i++) if (AI_PROVIDERS[i].id===id) return AI_PROVIDERS[i]; return null; },
    sourceById: function (id) { for (var i=0;i<INTEL_SOURCES.length;i++) if (INTEL_SOURCES[i].id===id) return INTEL_SOURCES[i]; return null; }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.PROVIDERS_DATA;
})(typeof window !== 'undefined' ? window : this);

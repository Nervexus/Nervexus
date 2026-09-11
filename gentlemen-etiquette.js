/* gentlemen-etiquette.js — the Gentlemen's Centre, as data.

   Eight subpages: the daily test, five subject areas, and the two the owner specified in
   full — dress code and dining. Content only: no DOM, no state, no network, which is what
   lets it be checked outside a browser (gentlemen-etiquette.test.mjs).

   The five subject areas are the owner's own words, kept as given. Dress and dining are his
   specification set out in full. The question bank is written against that material, so the
   daily test can never ask about something the pages do not teach — a test that asks what
   the app never said is a quiz, not a standard.

   Distinct from learning-gentleman.js, which is the Learning Centre's 120-level etiquette
   ladder with placement tests and a glossary. That one teaches the subject over months; this
   is the standard you hold yourself to daily. */
(function (root) {
  // Runs once: the <helmet> relocation re-executes every engine script.
  if (root.GentlemenEtiquette) return;

  'use strict';

  /* ---- the five subject areas ---------------------------------------------------------- */
  var SUBJECTS = [
    { key: 'money', name: 'Money & Power', eyebrow: 'WHAT MOVES, AND WHO MOVES IT',
      lines: [
        'Macroeconomics and how markets actually move — not just headlines.',
        'Basic finance: how deals, equity and leverage work.',
        'Geopolitics — who controls what, and why it matters to money.',
      ] },
    { key: 'history', name: 'History & Culture', eyebrow: 'ENOUGH TO DISCUSS, NOT JUST RECOGNISE',
      lines: [
        'Deep knowledge of history, especially the rise and fall of empires and institutions.',
        'Art, architecture and literature — enough to discuss, not just recognise.',
        'Classical rhetoric and philosophy — Cicero, Machiavelli, Sun Tzu: the operating manuals of power.',
      ] },
    { key: 'taste', name: 'Taste & Discernment', eyebrow: 'PALATE, NOT TRIVIA',
      lines: [
        'Wine, spirits and cigars — not trivia, but genuine palate and etiquette.',
        'Tailoring and dress — understanding fit and fabric, not just brands.',
        'Fine dining etiquette that is second nature, not performed.',
      ] },
    { key: 'conversation', name: 'Conversation', eyebrow: 'THE ROOM BEFORE THE WORDS',
      lines: [
        'The ability to ask sharp questions and actually listen.',
        'Knowing when to say nothing.',
        'Reading a room before you speak in it.',
      ] },
    { key: 'foundation', name: 'Foundation', eyebrow: 'WHAT THE REST STANDS ON',
      lines: [
        'Command of language — writing and speaking with precision.',
        'Negotiation and persuasion.',
        'Restraint. The men who dominate a room rarely try to.',
      ] },
  ];

  /* ---- dress code, by occasion --------------------------------------------------------- */
  var DRESS = [
    { key: 'black-tie', name: 'Black Tie / Formal Evening', note: 'Evening, invitation-led',
      lines: [
        'Tuxedo (dinner jacket), black or midnight blue.',
        'Peak lapel or shawl collar, satin facing.',
        'Black bow tie, white dress shirt — marcella or pleated front.',
        'Black patent or highly polished oxford shoes.',
      ] },
    { key: 'business-formal', name: 'Business Formal', note: 'Boardroom, high-stakes meetings, banking',
      lines: [
        'Two or three-piece suit, solid navy or charcoal.',
        'Notch or peak lapel, minimal pattern.',
        'White or light blue shirt, conservative tie.',
        'Oxford or derby, black or dark brown.',
      ] },
    { key: 'business-smart', name: 'Business Smart', note: 'Client meetings, dinners, senior everyday office',
      lines: [
        'Suit in navy, charcoal, or a subtle pattern — pinstripe, birdseye.',
        'Tie optional depending on the setting.',
        'Loafers acceptable if the room allows it.',
      ] },
    { key: 'smart-casual', name: 'Smart Casual', note: 'Networking, upscale casual dinners',
      lines: [
        'Odd jacket and trouser combination — blazer with chinos or wool trousers.',
        'Open collar shirt or knit polo, no tie.',
        'Suede loafers or clean leather sneakers.',
      ] },
    { key: 'day-to-day', name: 'Day-to-Day', note: 'Everyday wear',
      lines: [
        'Well-fitted chinos or tailored trousers.',
        'Oxford shirt, knit polo, or quality crewneck.',
        'Structured but unlined jacket or overshirt for layering.',
        'Clean leather shoes or minimalist sneakers — nothing sloppy.',
      ] },
    { key: 'home', name: 'Home Wear', note: 'The standard does not fully drop at home',
      lines: [
        'Still put-together, never "just rolled out of bed".',
        'Quality loungewear: merino or cotton knitwear, tailored joggers or drawstring trousers.',
        'A robe or overshirt for receiving guests informally.',
        'No graphic tees, no worn-out gym clothes.',
      ] },
  ];

  /* ---- dining and table manners -------------------------------------------------------- */
  var DINING = [
    { key: 'before', name: 'Before the Meal',
      lines: [
        'Wait for the host to sit, or to signal, before taking your seat.',
        'Napkin on your lap immediately once seated — unfolded, not tucked in.',
        'Never start eating until the host begins, or until everyone at a small table is served.',
      ] },
    { key: 'cutlery', name: 'Cutlery',
      lines: [
        'Work from the outside in, one course at a time.',
        'Continental: fork stays in the left hand, knife in the right, tines down.',
        'American: cut, then switch the fork to the right hand to eat.',
        'Paused: knife and fork crossed on the plate. Finished: parallel, angled at four o’clock.',
      ] },
    { key: 'table', name: 'At the Table',
      lines: [
        'Elbows off the table while eating; forearms may rest between courses.',
        'Bread is broken by hand, never cut, and buttered piece by piece.',
        'Pass dishes to the right. Salt and pepper always travel together, even if only one is asked for.',
        'Wait to drink until a toast has been acknowledged, not mid-toast.',
      ] },
    { key: 'conduct', name: 'Conversation & Conduct',
      lines: [
        'No phones at the table. Ever.',
        'Chew with your mouth closed; no talking with food in it.',
        'Napkin on the chair if leaving temporarily; on the table, left of the plate, when finished.',
        'Thank the host and, where appropriate, the staff — by name if you know it.',
      ] },
    { key: 'wine', name: 'Wine & Glasses',
      lines: [
        'Hold stemmed glasses by the stem, never the bowl.',
        'Let the host or sommelier pour; do not refill your own glass first at a hosted table.',
        'A light touch of the glass, or "just a taste", declines more without making a scene.',
      ] },
  ];

  /* ---- the daily test ------------------------------------------------------------------
     One question a day, drawn at random from all four categories — not a rotation, so there
     is no guessing which category is due. The draw is seeded by the date so it is the same
     question all day and on every device: a test you can reroll by reloading is not a test.

     Every answer has a because. A question that only says "wrong" teaches nothing. */
  var QUESTIONS = [
    // ---- DRESS CODE
    { cat: 'Dress Code', q: 'Black tie. Which lapel is correct on the dinner jacket?',
      a: ['Peak lapel or shawl collar', 'Notch lapel', 'Either, it makes no difference', 'No lapel at all'], c: 0,
      why: 'Peak or shawl, both with satin facing. A notch lapel is a business jacket’s lapel and is the commonest tell that a tuxedo was bought as a suit.' },
    { cat: 'Dress Code', q: 'What colour, besides black, is correct for a dinner jacket?',
      a: ['Midnight blue', 'Charcoal', 'Dark brown', 'Bottle green'], c: 0,
      why: 'Midnight blue reads blacker than black under artificial light, which is why it has been correct for evening since the 1930s.' },
    { cat: 'Dress Code', q: 'Business formal — the boardroom. Which suit?',
      a: ['Solid navy or charcoal', 'Light grey check', 'Navy with a bold windowpane', 'Any colour, if it fits'], c: 0,
      why: 'Solid navy or charcoal, minimal pattern. In a high-stakes room the suit should not be the thing anyone remembers.' },
    { cat: 'Dress Code', q: 'Smart casual. What goes on your top half?',
      a: ['An odd jacket — a blazer, not a suit jacket', 'The jacket from your navy suit', 'No jacket at all', 'A dinner jacket, dressed down'], c: 0,
      why: 'An odd jacket is cut to be worn apart from trousers. A suit jacket worn alone shows it immediately: the cloth and the finish do not match anything.' },
    { cat: 'Dress Code', q: 'Which shoes finish black tie?',
      a: ['Black patent or highly polished oxfords', 'Dark brown brogues', 'Suede loafers', 'Clean leather sneakers'], c: 0,
      why: 'Patent or a mirror polish. Brown shoes are never correct with evening dress.' },
    { cat: 'Dress Code', q: 'Business smart. Are loafers acceptable?',
      a: ['Yes, if the room allows it', 'Never with a suit', 'Only in brown', 'Only without socks'], c: 0,
      why: 'Business smart is the register that reads the room. Loafers are fine where the room is; the judgement is the point, not the shoe.' },
    { cat: 'Dress Code', q: 'Home wear. What is the standard?',
      a: ['Still put-together — quality knitwear, tailored joggers', 'Whatever is comfortable', 'Old gym clothes are fine at home', 'A suit, always'], c: 0,
      why: 'The standard does not fully drop at home. No graphic tees, no worn-out gym kit — a robe or overshirt for receiving anyone informally.' },
    { cat: 'Dress Code', q: 'Which shirt belongs with black tie?',
      a: ['White, marcella or pleated front', 'Light blue poplin', 'White with a button-down collar', 'Any white shirt'], c: 0,
      why: 'Marcella (piqué) or a pleated front, in white. A button-down collar is sportswear and never belongs with evening dress.' },
    { cat: 'Dress Code', q: 'Tailoring: what matters most?',
      a: ['Fit and fabric', 'The brand on the label', 'The price paid', 'How new it is'], c: 0,
      why: 'Understanding fit and fabric, not brands. A well-cut inexpensive suit outranks a badly-fitted expensive one in any room that can tell.' },
    { cat: 'Dress Code', q: 'Day-to-day. Which is wrong?',
      a: ['Scuffed, sloppy shoes', 'Well-fitted chinos', 'A knit polo', 'An unlined overshirt'], c: 0,
      why: 'Everything else on the list is day-to-day correct. Shoes are where an otherwise good outfit is given away — nothing sloppy.' },

    // ---- DINING MANNERS
    { cat: 'Dining Manners', q: 'You sit down. What happens to the napkin?',
      a: ['On your lap immediately, unfolded', 'Tucked into your collar', 'Left folded until the food arrives', 'Placed to the right of the plate'], c: 0,
      why: 'On the lap the moment you are seated, unfolded rather than shaken out, and never tucked in.' },
    { cat: 'Dining Manners', q: 'Which cutlery do you take first?',
      a: ['The outermost, working in', 'The innermost, working out', 'Whichever suits the dish', 'Wait and copy the host'], c: 0,
      why: 'Outside in, one course at a time. The table is laid in the order the courses arrive.' },
    { cat: 'Dining Manners', q: 'You are pausing mid-course. How do the knife and fork rest?',
      a: ['Crossed on the plate', 'Parallel, angled at four o’clock', 'Laid on the tablecloth', 'Handles on the table, tips on the plate'], c: 0,
      why: 'Crossed means paused; parallel at four o’clock means finished. The staff read these, so getting them the wrong way round has your plate taken early.' },
    { cat: 'Dining Manners', q: 'How is bread handled?',
      a: ['Broken by hand, buttered piece by piece', 'Cut with the knife, then buttered whole', 'Buttered whole, then torn', 'Eaten without butter'], c: 0,
      why: 'Broken, never cut, and buttered one piece at a time as you eat it.' },
    { cat: 'Dining Manners', q: 'Somebody asks for the salt. What do you pass?',
      a: ['Salt and pepper together', 'Only the salt', 'Salt, then pepper separately', 'You hand it directly into their hand'], c: 0,
      why: 'They travel as a pair, always, even when only one was asked for. Set them down rather than handing them over.' },
    { cat: 'Dining Manners', q: 'A toast is being made. When do you drink?',
      a: ['After it has been acknowledged', 'As soon as glasses are raised', 'Mid-toast, quietly', 'Before, to be ready'], c: 0,
      why: 'Wait until the toast has been acknowledged. Drinking during it is the one most people get wrong.' },
    { cat: 'Dining Manners', q: 'You leave the table briefly. Where does the napkin go?',
      a: ['On your chair', 'On the table, left of the plate', 'Folded on the plate', 'Over the back of the chair'], c: 0,
      why: 'Chair for a pause, table — left of the plate — when you are finished. The two say different things.' },
    { cat: 'Dining Manners', q: 'How do you hold a stemmed glass?',
      a: ['By the stem', 'By the bowl', 'By the base, flat on the palm', 'However is comfortable'], c: 0,
      why: 'By the stem. A hand on the bowl warms the wine and marks the glass, and both are noticed.' },
    { cat: 'Dining Manners', q: 'At a hosted table, your glass is empty. What do you do?',
      a: ['Let the host or sommelier pour', 'Refill your own first', 'Refill everyone else, then yourself', 'Ask for the bottle'], c: 0,
      why: 'Pouring is the host’s to do or to delegate. Taking it on yourself at their table quietly takes something from them.' },
    { cat: 'Dining Manners', q: 'Elbows on the table — when?',
      a: ['Forearms may rest between courses, never while eating', 'Never, at any point', 'Always fine among friends', 'Only at breakfast'], c: 0,
      why: 'Off the table while eating; forearms resting between courses is correct and always has been.' },
    { cat: 'Dining Manners', q: 'Your phone is in your pocket at dinner. What is the rule?',
      a: ['It stays there — no phones at the table, ever', 'Face down on the table is fine', 'Only if you are expecting something', 'Fine to check between courses'], c: 0,
      why: 'Ever. A phone on the table says the table is the second most interesting thing in the room.' },

    // ---- HISTORY
    { cat: 'History', q: 'Machiavelli’s The Prince is best read as what?',
      a: ['A manual of how power is actually held', 'A defence of tyranny', 'A work of fiction', 'A religious text'], c: 0,
      why: 'It describes how power behaves rather than how it ought to, which is why it has outlasted every book written to condemn it.' },
    { cat: 'History', q: 'Sun Tzu’s central argument is that the best victory is which?',
      a: ['The one won without fighting', 'The one won fastest', 'The one won with the largest army', 'The one won most decisively'], c: 0,
      why: 'To subdue the enemy without fighting is the supreme excellence. Position and information beat force.' },
    { cat: 'History', q: 'Cicero is the model for which of these?',
      a: ['Rhetoric — the structure of persuasion', 'Military strategy', 'Banking and credit', 'Architecture'], c: 0,
      why: 'Roman rhetoric is still the skeleton of every argument that persuades: the case, the evidence, the anticipation of the answer.' },
    { cat: 'History', q: 'Empires most often fall for which reason?',
      a: ['Overreach — commitments outrunning what pays for them', 'A single lost battle', 'A change of ruler', 'Bad weather'], c: 0,
      why: 'The pattern repeats: the frontier costs more than the centre earns. Rome, Spain, Britain. The battle is usually the symptom.' },
    { cat: 'History', q: 'Why is knowing the rise and fall of institutions useful in a room?',
      a: ['It shows you what is structural and what is noise', 'It makes for good small talk', 'It impresses people', 'It predicts markets exactly'], c: 0,
      why: 'History does not repeat, but the shapes do. Knowing them tells you which of today’s crises is weather and which is climate.' },
    { cat: 'History', q: 'On art and architecture, the standard here is what?',
      a: ['Enough to discuss it, not just recognise it', 'Being able to name the artist', 'Owning some', 'Having an opinion on everything'], c: 0,
      why: 'Recognition is a party trick. Being able to say why a thing is good, and to be argued with, is the actual standard.' },
    { cat: 'History', q: 'Which best describes reading history for power rather than for interest?',
      a: ['Looking for the mechanism, not the story', 'Memorising dates', 'Choosing a favourite period', 'Reading only biographies'], c: 0,
      why: 'The mechanism — how the money moved, who owed whom, what the institution actually controlled — is the part that transfers.' },

    // ---- EVENTS
    { cat: 'Events', q: 'You arrive at a dinner and do not know the room. First move?',
      a: ['Read it before you speak in it', 'Introduce yourself to everyone quickly', 'Find the most senior person', 'Start a conversation about yourself'], c: 0,
      why: 'Reading a room before you speak in it is the whole discipline. Thirty seconds of watching tells you more than ten minutes of asking.' },
    { cat: 'Events', q: 'Someone says something you know to be wrong, in company. What do you do?',
      a: ['Judge whether correcting it is worth what it costs', 'Correct it immediately', 'Correct it publicly, with evidence', 'Agree, to keep the peace'], c: 0,
      why: 'Knowing when to say nothing is listed as a skill for a reason. Being right in public is often the most expensive thing you can be.' },
    { cat: 'Events', q: 'What marks the strongest conversationalist in a room?',
      a: ['Sharp questions, and actually listening to the answers', 'Having the best stories', 'Talking to the most people', 'Knowing the most facts'], c: 0,
      why: 'The person who asks well and listens is the one everybody remembers speaking to, and the one who leaves knowing the most.' },
    { cat: 'Events', q: 'Men who dominate a room usually do what?',
      a: ['Rarely try to', 'Speak first', 'Speak loudest', 'Speak most'], c: 0,
      why: 'Restraint. Effort to dominate is visible, and visible effort is the thing that costs you the room.' },
    { cat: 'Events', q: 'You are the guest. When do you sit?',
      a: ['After the host sits or signals', 'As soon as you reach the table', 'When the first course arrives', 'When the most senior guest sits'], c: 0,
      why: 'The host sets the table’s rhythm — sitting, starting, pouring, ending. Following it is most of being a good guest.' },
    { cat: 'Events', q: 'Thanking the staff at a hosted dinner is:',
      a: ['Correct, and by name if you know it', 'Unnecessary — thank the host only', 'Only for exceptional service', 'Best done by tipping instead'], c: 0,
      why: 'Thank the host and, where appropriate, the staff. How somebody treats people who cannot help them is read by everyone at that table.' },
    { cat: 'Events', q: 'What is the point of negotiation, held well?',
      a: ['A deal the other side will actually keep', 'Winning every point', 'Speaking most', 'Conceding nothing'], c: 0,
      why: 'A deal extracted from somebody who resents it is a deal you will renegotiate. Persuasion outlasts pressure.' },
  ];

  var CATEGORIES = ['Events', 'History', 'Dress Code', 'Dining Manners'];

  /* A stable hash of the date. The same day gives the same question on every device and
     through any number of reloads, and consecutive days give unrelated ones — a plain
     day-number modulo would walk the list in order, which is the rotation the owner
     explicitly did not want. */
  function seed(dateKey) {
    var h = 2166136261, s = String(dateKey || '');
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    h ^= h >>> 13; h = Math.imul(h, 1274126177); h ^= h >>> 16;
    return h >>> 0;
  }
  /* ---- what the occasion looks like ----------------------------------------------------
     Dress code is the one subject where a rule is hard to picture from the words: "peak lapel
     or shawl collar" is a shape, and a shape should be shown. These are drawn — flat, front-on
     garment sketches in the raiment's own ink — rather than photographed. A photograph would
     be somebody else's property, it would carry its own lighting and its own colours into
     every theme, and it would not change when the raiment does. Line work does.

     One drawing per occasion, carried on all of that occasion's cards, so the rule in front of
     you is always next to the thing it is a rule about. Each drawing shows the tells the rules
     actually name: peak lapels and a bow tie for black tie, a notch and a tie for business
     formal, patch pockets and an open placket for smart casual, no jacket at all for
     day-to-day, a shawl collar and a belt for home. */
  var A_OPEN = '<svg viewBox="0 0 120 160" width="100%" height="100%" fill="none" ' +
               'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">';
  /* Sleeves first, then the body over them: the shoulder seam then reads as a seam rather
     than as an outline, and the silhouette is a garment instead of a slab. */
  var A_SLEEVES = '<path d="M32 31 L14 52 L12 108 L28 112 L30 64 Z" fill="var(--art-cloth)"/>' +
                  '<path d="M88 31 L106 52 L108 108 L92 112 L90 64 Z" fill="var(--art-cloth)"/>';
  var A_BODY = '<path d="M50 26 L32 31 L30 64 L26 150 L94 150 L90 64 L88 31 L70 26 Q60 35 50 26 Z" fill="var(--art-cloth)"/>';
  var A_SHIRTV = '<path d="M50 26 Q60 35 70 26 L63 104 L57 104 Z" fill="var(--art-shirt)"/>';
  var A_CLOSE = '<path d="M60 102 V150"/><circle cx="60" cy="102" r="2.6" fill="currentColor" stroke="none"/>';
  /* The one shape that separates the two codes the rules name. A peak lapel turns a single
     point up and out toward the shoulder; a notch cuts a small wedge out of the same edge.
     Both are one path per side, so the difference is the silhouette and survives 170px. */
  var A_PEAK = '<path d="M52 28 L40 50 L28 42 L38 62 L47 102 L57 102 L54 40 Z" fill="var(--forge-accent)" fill-opacity="0.25"/>' +
               '<path d="M68 28 L80 50 L92 42 L82 62 L73 102 L63 102 L66 40 Z" fill="var(--forge-accent)" fill-opacity="0.25"/>';
  var A_NOTCH = '<path d="M52 28 L42 46 L36 44 L38 52 L34 60 L47 102 L57 102 L54 40 Z" fill="var(--art-cloth)"/>' +
                '<path d="M68 28 L78 46 L84 44 L82 52 L86 60 L73 102 L63 102 L66 40 Z" fill="var(--art-cloth)"/>';
  var A_OPENCOLLAR = '<path d="M50 26 L46 35 L57 48 L60 33 Z" fill="var(--art-shirt)"/>' +
                     '<path d="M70 26 L74 35 L63 48 L60 33 Z" fill="var(--art-shirt)"/>';

  var ART = {
    'black-tie': A_OPEN + A_SLEEVES + A_BODY + A_SHIRTV + A_PEAK +
      '<circle cx="60" cy="58" r="2.1" fill="currentColor" stroke="none"/>' +
      '<circle cx="60" cy="76" r="2.1" fill="currentColor" stroke="none"/>' +
      '<circle cx="60" cy="88" r="2.1" fill="currentColor" stroke="none"/>' +
      '<path d="M57 38 L44 30 L44 46 Z" fill="var(--forge-accent)"/>' +
      '<path d="M63 38 L76 30 L76 46 Z" fill="var(--forge-accent)"/>' +
      '<rect x="55.5" y="32.5" width="9" height="11" rx="3" fill="var(--forge-accent)"/>' +
      A_CLOSE + '</svg>',

    'business-formal': A_OPEN + A_SLEEVES + A_BODY + A_SHIRTV + A_NOTCH +
      '<path d="M55 31 L65 31 L66 44 L54 44 Z" fill="var(--forge-accent)"/>' +
      '<path d="M56 45 L64 45 L63 88 L60 96 L57 88 Z" fill="var(--forge-accent)"/>' +
      A_CLOSE + '</svg>',

    /* The pattern is the tell the rules name for this one — pinstripe or birdseye — so it is
       drawn under the lapels where a stripe actually runs. */
    'business-smart': A_OPEN + A_SLEEVES + A_BODY +
      '<path d="M38 34 V148" stroke-opacity="0.28"/><path d="M48 32 V148" stroke-opacity="0.28"/>' +
      '<path d="M82 34 V148" stroke-opacity="0.28"/><path d="M72 32 V148" stroke-opacity="0.28"/>' +
      '<path d="M20 56 V106" stroke-opacity="0.28"/><path d="M100 56 V106" stroke-opacity="0.28"/>' +
      A_SHIRTV + A_NOTCH + A_OPENCOLLAR +
      '<circle cx="60" cy="60" r="2" fill="currentColor" stroke="none"/>' +
      A_CLOSE + '</svg>',

    'smart-casual': A_OPEN + A_SLEEVES + A_BODY + A_SHIRTV + A_NOTCH + A_OPENCOLLAR +
      '<path d="M56 50 V78"/><path d="M64 50 V78"/>' +
      '<circle cx="60" cy="57" r="2" fill="currentColor" stroke="none"/>' +
      '<circle cx="60" cy="71" r="2" fill="currentColor" stroke="none"/>' +
      '<rect x="32" y="112" width="23" height="22" rx="3"/>' +
      '<rect x="65" y="112" width="23" height="22" rx="3"/>' +
      A_CLOSE + '</svg>',

    /* No jacket at all: a slimmer body, the collar leaves open, the placket and its buttons
       down the front. The absence of a lapel is the point of the drawing. */
    'day-to-day': A_OPEN +
      '<path d="M36 30 L20 50 L18 104 L32 108 L34 62 Z" fill="var(--art-shirt)"/>' +
      '<path d="M84 30 L100 50 L102 104 L88 108 L86 62 Z" fill="var(--art-shirt)"/>' +
      '<path d="M50 26 L36 30 L34 62 L30 150 L90 150 L86 62 L84 30 L70 26 Q60 35 50 26 Z" fill="var(--art-shirt)"/>' +
      '<path d="M50 26 L45 36 L57 50 L60 34 Z" fill="var(--art-cloth)"/>' +
      '<path d="M70 26 L75 36 L63 50 L60 34 Z" fill="var(--art-cloth)"/>' +
      '<path d="M56 40 V150" stroke-opacity="0.5"/><path d="M64 40 V150" stroke-opacity="0.5"/>' +
      '<circle cx="60" cy="62" r="2" fill="currentColor" stroke="none"/>' +
      '<circle cx="60" cy="82" r="2" fill="currentColor" stroke="none"/>' +
      '<circle cx="60" cy="102" r="2" fill="currentColor" stroke="none"/>' +
      '<circle cx="60" cy="122" r="2" fill="currentColor" stroke="none"/>' +
      '<rect x="36" y="64" width="20" height="17" rx="2"/>' +
      '</svg>',

    /* A shawl collar is one unbroken curve with no notch and no peak — the third of the three
       collar shapes in the subject, and the reason home wear gets a drawing at all. */
    home: A_OPEN + A_SLEEVES + A_BODY +
      '<path d="M56 38 L60 45 L64 38 L66 142 L54 142 Z" fill="var(--art-shirt)"/>' +
      '<path d="M52 27 C42 52 38 92 38 134 L54 134 C54 98 56 60 60 42 Z" fill="var(--forge-accent)" fill-opacity="0.22"/>' +
      '<path d="M68 27 C78 52 82 92 82 134 L66 134 C66 98 64 60 60 42 Z" fill="var(--forge-accent)" fill-opacity="0.22"/>' +
      '<rect x="26" y="108" width="68" height="11" rx="5.5" fill="var(--forge-accent)" fill-opacity="0.34"/>' +
      '<circle cx="60" cy="113.5" r="6" fill="var(--forge-accent)" fill-opacity="0.55"/>' +
      '</svg>',
  };

  function art(key) { return ART[key] || ''; }

  /* ---- one concept per card ------------------------------------------------------------
     Every line is its own card. A section's heading rides along on each of its cards rather
     than being a card of its own, so "peak lapel or shawl collar" is never read without
     "Black Tie" above it — that was the reason the first cut kept whole sections together,
     and carrying the heading solves it without putting four rules on one screen.

     Pacing over density, deliberately: Dress Code is twenty-two cards rather than six. */
  function cards(key) {
    var src = null, eyebrow = '';
    for (var i = 0; i < SUBJECTS.length; i++) if (SUBJECTS[i].key === key) {
      src = [{ key: '', name: SUBJECTS[i].name, note: '', lines: SUBJECTS[i].lines }];
      eyebrow = SUBJECTS[i].eyebrow;
    }
    if (!src && key === 'dress') { src = DRESS; eyebrow = 'BY OCCASION'; }
    if (!src && key === 'dining') { src = DINING; eyebrow = 'SECOND NATURE, NOT PERFORMED'; }
    if (!src) return [];

    var out = [];
    src.forEach(function (sec) {
      sec.lines.forEach(function (line, li) {
        out.push({
          eyebrow: eyebrow, title: sec.name, note: sec.note || '', text: line,
          /* The drawing belongs to the occasion, not to the rule, so every card in a
             section carries it. */
          art: ART[sec.key] ? sec.key : '',
          /* Where you are inside the section as well as inside the deck: four rules under one
             heading should read as four, not as an undifferentiated run of cards. */
          step: li + 1, steps: sec.lines.length,
        });
      });
    });
    out.forEach(function (c, i) { c.n = i + 1; c.of = out.length; });
    return out;
  }

  /* ---- the daily test ------------------------------------------------------------------
     Four questions, one from each category, one per card. The set is drawn for the day and
     is the same all day on every device, and the order of the categories moves too — a test
     that always opens on Events is a rotation wearing a different hat. */
  function dailySet(dateKey) {
    var cats = CATEGORIES.slice();
    var r = seed(String(dateKey) + '#order');
    for (var k = cats.length - 1; k > 0; k--) {
      r = (Math.imul(r, 48271) + 11) >>> 0;
      var j = r % (k + 1), t = cats[k]; cats[k] = cats[j]; cats[j] = t;
    }
    return cats.map(function (cat) {
      var pool = QUESTIONS.filter(function (q) { return q.cat === cat; });
      if (!pool.length) return null;
      var q = pool[seed(String(dateKey) + '#' + cat) % pool.length];
      var order = q.a.map(function (_, i) { return i; });
      var rr = seed(String(dateKey) + '#' + cat + '#opt');
      for (var m = order.length - 1; m > 0; m--) {
        rr = (Math.imul(rr, 48271) + 11) >>> 0;
        var jj = rr % (m + 1), tt = order[m]; order[m] = order[jj]; order[jj] = tt;
      }
      return {
        cat: cat, q: q.q, why: q.why,
        options: order.map(function (o) { return q.a[o]; }),
        correct: order.indexOf(q.c),
      };
    }).filter(Boolean);
  }

  /* Kept because the single-question draw is still the honest answer to "one question from
     across all four categories", and the set is built on the same seeding. */
  function dailyQuestion(dateKey) {
    var set = dailySet(dateKey);
    return set.length ? set[0] : null;
  }

  root.GentlemenEtiquette = {
    SUBJECTS: SUBJECTS, DRESS: DRESS, DINING: DINING,
    QUESTIONS: QUESTIONS, CATEGORIES: CATEGORIES,
    dailyQuestion: dailyQuestion, dailySet: dailySet, cards: cards, art: art, ART: ART,
    _seed: seed,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.GentlemenEtiquette;
})(typeof window !== 'undefined' ? window : this);

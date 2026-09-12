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
  /* ---- supplied photographs -------------------------------------------------------------
     Dress Code carried drawn garment sketches for a while. They were removed: six line
     drawings of outfits told the occasions apart only barely, and the page is being
     restructured. A card with no picture simply has no picture.

     When a real image exists for an occasion its path goes in here and the page shows it.
     A path is only ever added at the same time as the file actually landing in
     assets/dress/ — one added ahead of its file is a broken image on a card. */
  var PHOTO = {
    // 'black-tie':       'assets/dress/black-tie.webp',
    // 'business-formal': 'assets/dress/business-formal.webp',
    // 'business-smart':  'assets/dress/business-smart.webp',
    // 'smart-casual':    'assets/dress/smart-casual.webp',
    // 'day-to-day':      'assets/dress/day-to-day.webp',
    // 'home':            'assets/dress/home.webp',
  };
  function photo(key) { return PHOTO[key] || ''; }

  /* ---- one concept per card ------------------------------------------------------------
     Every line is its own card. A section's heading rides along on each of its cards rather
     than being a card of its own, so "peak lapel or shawl collar" is never read without
     "Black Tie" above it — that was the reason the first cut kept whole sections together,
     and carrying the heading solves it without putting four rules on one screen.

     Pacing over density, deliberately: Dress Code is twenty-two cards rather than six. */
  function cards(key) {
    var src = null, eyebrow = '', isDress = false;
    for (var i = 0; i < SUBJECTS.length; i++) if (SUBJECTS[i].key === key) {
      src = [{ key: '', name: SUBJECTS[i].name, note: '', lines: SUBJECTS[i].lines }];
      eyebrow = SUBJECTS[i].eyebrow;
    }
    if (!src && key === 'dress') { src = DRESS; eyebrow = 'BY OCCASION'; isDress = true; }
    if (!src && key === 'dining') { src = DINING; eyebrow = 'SECOND NATURE, NOT PERFORMED'; }
    if (!src) return [];

    var out = [];
    src.forEach(function (sec) {
      sec.lines.forEach(function (line, li) {
        out.push({
          eyebrow: eyebrow, title: sec.name, note: sec.note || '', text: line,
          /* An occasion is a dress-code notion: Black Tie is one, "Before the Meal" is not.
             Only dress cards carry it, so a picture keyed to an occasion can never surface
             against a dining section that happens to share a key. The picture belongs to the
             occasion rather than to the rule, so every card in a section names the same one. */
          occasion: isDress ? (sec.key || '') : '',
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
    dailyQuestion: dailyQuestion, dailySet: dailySet, cards: cards,
    photo: photo, PHOTO: PHOTO,
    _seed: seed,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.GentlemenEtiquette;
})(typeof window !== 'undefined' ? window : this);

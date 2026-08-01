/* ============================================================================
   learning-history.js — History engine for the Learning Centre. Curated
   question banks across Ancient Civilisations, Medieval History, Early
   Modern History, Modern History, 20th Century World and Historical Skills
   (sources/causation/interpretation), a 60-level system, placement test,
   Quick Test support and a Timeline & Key Events reference library.
   Consumed by the DC logic class via window.LearningHistory.
   ============================================================================ */
(function (root) {
  'use strict';
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[ri(0, arr.length - 1)]; }
  function shuffle(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = ri(0, i); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  var ANCIENT = [
    { level: 3, q: 'Which river valley civilisation built the pyramids?', a: 'Ancient Egypt', d: ['Ancient Egypt', 'Ancient Rome', 'Ancient Greece', 'Mesopotamia'], why: 'Ancient Egyptian pharaohs built the pyramids as monumental tombs along the Nile.' },
    { level: 6, q: 'What system of government did Ancient Athens pioneer?', a: 'Democracy', d: ['Democracy', 'Monarchy', 'Feudalism', 'Theocracy'], why: 'Athens developed one of the earliest forms of democracy, with citizens voting directly on laws.' },
    { level: 9, q: 'What was the Roman system of roads and law primarily used for?', a: 'Governing and connecting a vast empire', d: ['Governing and connecting a vast empire', 'Religious pilgrimage only', 'Trade with China exclusively', 'Military training only'], why: 'Roman roads and law codes allowed efficient control, trade and communication across their huge empire.' },
    { level: 12, q: 'What writing system did the Ancient Sumerians develop?', a: 'Cuneiform', d: ['Cuneiform', 'Hieroglyphics', 'Latin alphabet', 'Cyrillic'], why: 'Cuneiform, wedge-shaped marks pressed into clay, is one of the earliest known writing systems.' },
    { level: 15, q: 'What was the Silk Road primarily used for?', a: 'Trade between East and West', d: ['Trade between East and West', 'Military invasion routes only', 'Religious pilgrimage only', 'Transporting only spices'], why: 'The Silk Road was a network of trade routes connecting China, Central Asia, the Middle East and Europe.' }
  ];
  var MEDIEVAL = [
    { level: 17, q: 'In what year did the Norman Conquest of England take place?', a: '1066', d: ['1066', '1215', '1348', '955'], why: 'William the Conqueror defeated King Harold at the Battle of Hastings in 1066.' },
    { level: 19, q: 'What document did English barons force King John to sign in 1215?', a: 'Magna Carta', d: ['Magna Carta', 'Domesday Book', 'Bill of Rights', 'Treaty of Verdun'], why: 'Magna Carta limited royal power and established that even the king was subject to the law.' },
    { level: 21, q: 'What disease devastated Europe\u2019s population in the mid-1300s?', a: 'The Black Death (bubonic plague)', d: ['The Black Death (bubonic plague)', 'Smallpox', 'Cholera', 'Influenza'], why: 'The Black Death killed an estimated one-third of Europe\u2019s population between 1347-1351.' },
    { level: 24, q: 'What was the feudal system primarily based on?', a: 'Land granted in exchange for loyalty and service', d: ['Land granted in exchange for loyalty and service', 'Democratic elections', 'Free trade between cities', 'Religious conversion'], why: 'Feudalism organised medieval society in a hierarchy: kings granted land to lords in exchange for military service and loyalty.' },
    { level: 27, q: 'What were the Crusades?', a: 'Religious wars between Christians and Muslims for control of the Holy Land', d: ['Religious wars between Christians and Muslims for control of the Holy Land', 'Trade agreements between Europe and Asia', 'Peasant uprisings against taxation', 'Naval expeditions to the Americas'], why: 'The Crusades (11th-13th centuries) were a series of religious wars over control of Jerusalem and the Holy Land.' }
  ];
  var EARLY_MODERN = [
    { level: 29, q: 'What period of renewed interest in art, science and classical learning began in Italy?', a: 'The Renaissance', d: ['The Renaissance', 'The Enlightenment', 'The Reformation', 'The Industrial Revolution'], why: 'The Renaissance (14th-17th century) was a cultural rebirth of art, science and classical learning, starting in Italy.' },
    { level: 31, q: 'What movement did Martin Luther start in 1517?', a: 'The Protestant Reformation', d: ['The Protestant Reformation', 'The Renaissance', 'The Counter-Enlightenment', 'The Crusades'], why: 'Luther\u2019s 95 Theses challenged Catholic Church practices, splitting Western Christianity into Catholic and Protestant branches.' },
    { level: 34, q: 'Who is credited with reaching the Americas in 1492 (from a European perspective)?', a: 'Christopher Columbus', d: ['Christopher Columbus', 'Vasco da Gama', 'Ferdinand Magellan', 'Marco Polo'], why: 'Columbus\u2019s 1492 voyage, funded by Spain, began sustained European contact with the Americas.' },
    { level: 37, q: 'What was the main cause of the English Civil War (1642-1651)?', a: 'Conflict between King Charles I and Parliament over power', d: ['Conflict between King Charles I and Parliament over power', 'A dispute with France over trade', 'A religious war with Scotland alone', 'A rebellion by the nobility against taxation only'], why: 'Tensions over royal authority, taxation and religion led to war between Royalists and Parliamentarians.' },
    { level: 40, q: 'What ideas did Enlightenment thinkers like Locke and Voltaire promote?', a: 'Reason, individual rights and questioning authority', d: ['Reason, individual rights and questioning authority', 'Return to strict religious rule', 'Expansion of absolute monarchy', 'Rejection of scientific method'], why: 'The Enlightenment (17th-18th century) emphasised reason, science, and individual liberty, influencing revolutions in America and France.' }
  ];
  var MODERN = [
    { level: 42, q: 'What technological shift defined the Industrial Revolution?', a: 'Machine-powered manufacturing (e.g. steam power)', d: ['Machine-powered manufacturing (e.g. steam power)', 'Return to hand-crafted goods', 'Abolition of factories', 'Decline of urban populations'], why: 'The Industrial Revolution (from ~1760) shifted production from hand tools to powered machinery, transforming economies and societies.' },
    { level: 44, q: 'What event triggered the start of World War One in 1914?', a: 'The assassination of Archduke Franz Ferdinand', d: ['The assassination of Archduke Franz Ferdinand', 'The bombing of Pearl Harbor', 'The invasion of Poland', 'The sinking of the Lusitania'], why: 'The assassination of Austria-Hungary\u2019s heir in Sarajevo triggered a chain of alliances that led to WWI.' },
    { level: 46, q: 'What treaty officially ended World War One?', a: 'The Treaty of Versailles', d: ['The Treaty of Versailles', 'The Treaty of Paris', 'The Congress of Vienna', 'The Treaty of Tordesillas'], why: 'Signed in 1919, the Treaty of Versailles imposed harsh terms on Germany, contributing to later WWII tensions.' },
    { level: 48, q: 'What economic disaster began in 1929 and spread worldwide?', a: 'The Great Depression', d: ['The Great Depression', 'The Oil Crisis', 'Hyperinflation in Germany', 'The Dust Bowl only'], why: 'The Wall Street Crash of 1929 triggered the Great Depression, a decade of severe global economic hardship.' },
    { level: 50, q: 'What event began World War Two in Europe in 1939?', a: 'Germany\u2019s invasion of Poland', d: ['Germany\u2019s invasion of Poland', 'The bombing of Pearl Harbor', 'The fall of France', 'The Battle of Britain'], why: 'Germany\u2019s invasion of Poland in September 1939 led Britain and France to declare war on Germany.' }
  ];
  var TWENTIETH_CENTURY = [
    { level: 51, q: 'What was the Cold War primarily a conflict between?', a: 'The USA and the Soviet Union', d: ['The USA and the Soviet Union', 'Britain and France', 'China and Japan', 'Germany and Italy'], why: 'The Cold War (1947-1991) was a period of political and military tension between the US-led West and the Soviet bloc, without direct war between them.' },
    { level: 53, q: 'What wall, built in 1961, symbolised the division of Europe during the Cold War?', a: 'The Berlin Wall', d: ['The Berlin Wall', 'The Great Wall of China', 'Hadrian\u2019s Wall', 'The Atlantic Wall'], why: 'The Berlin Wall physically divided East and West Berlin until it fell in 1989.' },
    { level: 55, q: 'What movement, led by figures like Martin Luther King Jr., fought racial segregation in the USA?', a: 'The Civil Rights Movement', d: ['The Civil Rights Movement', 'The Suffragette Movement', 'The Labour Movement', 'The Prohibition Movement'], why: 'The Civil Rights Movement (1950s-60s) campaigned against racial segregation and for equal rights in the USA.' },
    { level: 57, q: 'What crisis in 1962 brought the USA and USSR close to nuclear war?', a: 'The Cuban Missile Crisis', d: ['The Cuban Missile Crisis', 'The Suez Crisis', 'The Berlin Airlift', 'The Korean War'], why: 'The discovery of Soviet nuclear missiles in Cuba led to a tense 13-day standoff in October 1962.' },
    { level: 59, q: 'In what year did the Berlin Wall fall, symbolising the end of the Cold War?', a: '1989', d: ['1989', '1991', '1975', '1963'], why: 'The Berlin Wall fell in November 1989; the Soviet Union itself dissolved in 1991.' }
  ];
  var SKILLS = [
    { level: 2, q: 'What is a "primary source" in History?', a: 'Evidence created at the time of the event', d: ['Evidence created at the time of the event', 'A textbook written later', 'A documentary made decades later', 'An encyclopedia entry'], why: 'Primary sources (letters, photos, artefacts) were created during or close to the event being studied.' },
    { level: 5, q: 'What is a "secondary source" in History?', a: 'An account created after the event, often analysing primary sources', d: ['An account created after the event, often analysing primary sources', 'An eyewitness diary', 'An original photograph from the event', 'A government record from that year'], why: 'Secondary sources (history books, documentaries) are created afterward, interpreting or analysing primary evidence.' },
    { level: 8, q: 'What does "causation" mean in historical study?', a: 'Understanding why events happened and their causes', d: ['Understanding why events happened and their causes', 'Memorising exact dates only', 'Listing events in random order', 'Describing what people wore'], why: 'Causation examines the reasons and factors that led to a historical event, often distinguishing long-term and short-term causes.' },
    { level: 11, q: 'Why might two historians interpret the same event differently?', a: 'They may use different sources, evidence, or perspectives', d: ['They may use different sources, evidence, or perspectives', 'One of them must be lying', 'History always has only one correct interpretation', 'Only eyewitnesses can be correct'], why: 'Historical interpretation varies because historians weigh evidence differently and may have different viewpoints or available sources.' },
    { level: 14, q: 'What is meant by a source\u2019s "reliability"?', a: 'How trustworthy or accurate the source is likely to be', d: ['How trustworthy or accurate the source is likely to be', 'How old the source is', 'How long the source is', 'How famous the author is'], why: 'Reliability considers factors like the author\u2019s bias, purpose, and closeness to the event when judging how much to trust a source.' },
    { level: 20, q: 'What is a "long-term cause" of a historical event?', a: 'An underlying factor building up over years or decades', d: ['An underlying factor building up over years or decades', 'The event that happened immediately before', 'A cause that only lasted one day', 'An effect, not a cause'], why: 'Long-term causes are conditions or tensions that build gradually, unlike a short-term "trigger" that sets an event off immediately.' }
  ];

  var BANKS = { ancient: ANCIENT, medieval: MEDIEVAL, earlymodern: EARLY_MODERN, modern: MODERN, twentiethcentury: TWENTIETH_CENTURY, skills: SKILLS };
  var TOPIC_LABELS = { ancient: 'Ancient Civilisations', medieval: 'Medieval History', earlymodern: 'Early Modern History', modern: 'Modern History', twentiethcentury: '20th Century World', skills: 'Historical Skills' };
  function mcFromEntry(topicLabel, e) { return { type: 'mc', topic: topicLabel, level: e.level, prompt: e.q, options: shuffle(e.d), answer: e.a, method: e.why }; }
  function nearestByLevel(bank, level) { return bank.slice().sort(function (a, b) { return Math.abs(a.level - level) - Math.abs(b.level - level); }); }
  var _rot = {};
  function rr(key, arr) {
    var st = _rot[key];
    if (!st || st.i >= st.order.length || st.order.length !== arr.length) { st = { order: shuffle(arr.map(function (_, i) { return i; })), i: 0 }; _rot[key] = st; }
    return arr[st.order[st.i++]];
  }
  function generateFromBank(poolKey, level, topicLabel) { var near = nearestByLevel(BANKS[poolKey], level || 1); return mcFromEntry(topicLabel, rr(poolKey, near)); }
  function generate(topicKey, level) { return generateFromBank(topicKey, level, TOPIC_LABELS[topicKey]); }

  var POOL_KEYS = ['ancient', 'medieval', 'earlymodern', 'modern', 'twentiethcentury', 'skills'];
  var LEVEL_BANDS = [
    { min: 1, max: 15, pools: ['skills', 'ancient'] },
    { min: 16, max: 30, pools: ['medieval', 'skills'] },
    { min: 31, max: 45, pools: ['earlymodern', 'modern'] },
    { min: 46, max: 60, pools: ['modern', 'twentiethcentury'] }
  ];
  function bandFor(level) { for (var i = 0; i < LEVEL_BANDS.length; i++) { var b = LEVEL_BANDS[i]; if (level >= b.min && level <= b.max) return b; } return LEVEL_BANDS[LEVEL_BANDS.length - 1]; }
  function generateForLevel(level) { level = Math.max(1, Math.min(60, level || 1)); return generate(pick(bandFor(level).pools), level); }
  function generateLevelSet(n, level) { var out = []; for (var i = 0; i < n; i++) out.push(generateForLevel(level)); return out; }
  function levelLabel(level) { if (level >= 50) return 'GCSE Ready'; if (level >= 40) return 'Advanced'; if (level >= 30) return 'Upper Intermediate'; if (level >= 20) return 'Intermediate'; if (level >= 10) return 'Elementary'; return 'Beginner'; }
  function gradeFromLevel(level) { if (level >= 56) return 9; if (level >= 51) return 8; if (level >= 46) return 7; if (level >= 40) return 6; if (level >= 33) return 5; if (level >= 26) return 4; if (level >= 18) return 3; if (level >= 10) return 2; return 1; }
  function generatePlacementSet(n) { n = n || 16; var out = []; for (var i = 0; i < n; i++) { var level = Math.round(1 + (i / (n - 1)) * 59); out.push(generateForLevel(level)); } return out; }
  function levelFromScore(pct) { return Math.max(1, Math.min(60, Math.round((pct / 100) * 59) + 1)); }
  function strongestWeakest(breakdown) {
    var scored = (breakdown || []).filter(function (b) { return b.total > 0; }).map(function (b) { return { topic: b.topic, acc: b.ok / b.total }; });
    if (!scored.length) return { strongest: '', weakest: '', focusAreas: [] };
    scored.sort(function (a, b) { return b.acc - a.acc; });
    var strongest = scored[0].topic, weakest = scored[scored.length - 1].topic;
    var focusAreas = scored.slice().sort(function (a, b) { return a.acc - b.acc; }).slice(0, 3).map(function (s) { return s.topic; });
    return { strongest: strongest, weakest: weakest, focusAreas: focusAreas };
  }

  var QT_TYPES = [
    { key: 'ancient', label: 'Ancient Civilisations' }, { key: 'medieval', label: 'Medieval History' }, { key: 'earlymodern', label: 'Early Modern History' },
    { key: 'modern', label: 'Modern History' }, { key: 'twentiethcentury', label: '20th Century World' }, { key: 'skills', label: 'Historical Skills' },
    { key: 'mixed', label: 'Mixed History Test' }
  ];
  var QT_DIFFICULTIES = ['Beginner', 'Intermediate', 'GCSE Foundation', 'GCSE Higher', 'Auto'];
  var QT_LENGTHS = [5, 10, 20, 50];
  function qtDifficultyToTier(diff) { return { Beginner: 1, Intermediate: 2, 'GCSE Foundation': 3, 'GCSE Higher': 4 }[diff] || 2; }
  function qtLevelToTier(level) { level = level || 1; if (level <= 15) return 1; if (level <= 30) return 2; if (level <= 45) return 3; return 4; }
  function qtTierToLevel(tier) { return { 1: 8, 2: 23, 3: 38, 4: 52 }[tier] || 23; }
  function qtQuestionForType(typeKey, tier) { var level = qtTierToLevel(tier); var key = typeKey === 'mixed' ? pick(POOL_KEYS) : typeKey; return generate(key, level); }
  function buildQuickTest(typeKey, difficulty, length, userLevel) {
    var tier = difficulty === 'Auto' ? qtLevelToTier(userLevel || 1) : qtDifficultyToTier(difficulty);
    var out = []; for (var i = 0; i < (length || 10); i++) out.push(qtQuestionForType(typeKey, tier));
    return out;
  }
  function generateDailyChallenge(userLevel) {
    var tier = qtLevelToTier(userLevel || 1);
    var mix = POOL_KEYS.concat(['skills', 'modern']);
    var out = []; for (var i = 0; i < 8; i++) out.push(qtQuestionForType(mix[i % mix.length], tier));
    return out;
  }
  function checkAnswer(q, input) {
    var norm = function (s) { return (s || '').toLowerCase().trim().replace(/[^a-z0-9 ]/g, ''); };
    return norm(input) === norm(q.answer);
  }

  var LESSONS = {
    ancient: {
      title: 'Ancient Civilisations',
      intro: 'The earliest civilisations established the foundations of government, writing, law and architecture that shaped everything that followed.',
      origin: 'The study of ancient civilisations as a rigorous discipline (rather than legend or myth) really began with 19th-century archaeology — the decipherment of Egyptian hieroglyphics via the Rosetta Stone (Jean-François Champollion, 1822) and of Mesopotamian cuneiform shortly after opened up direct primary-source access to these societies\u2019 own writing, rather than relying only on later Greek and Roman accounts of them, which were often incomplete or biased.',
      sections: [
        { heading: 'Why Civilisations Cluster Around Rivers', body: 'Ancient Egypt (the Nile), Mesopotamia (the Tigris and Euphrates), the Indus Valley and ancient China (the Yellow River) all developed as major civilisations along major rivers — this isn\u2019t coincidence: rivers provided reliable water for agriculture, naturally fertile flooded soil, and a transport route for trade, all of which allowed large, settled populations (and eventually cities, writing and government) to develop faster than in less hospitable environments.' },
        { heading: 'Athenian Democracy Was Radical — and Limited', body: 'Athenian democracy (from around 508 BCE) was genuinely radical for its time: citizens voted directly on laws rather than through elected representatives, a form called "direct democracy." But it excluded the vast majority of the population living in Athens — women, enslaved people, and foreign residents had no political voice at all — a crucial context that\u2019s essential to understanding both its historical significance and its real limitations compared to how "democracy" is used today.' },
        { heading: 'Rome\u2019s Infrastructure Was a Tool of Control, Not Just Convenience', body: 'Roman roads, aqueducts and legal codes weren\u2019t built primarily for citizens\u2019 comfort — they were deliberate tools for governing and defending an enormous, ethnically diverse empire spanning three continents. Roads let legions move quickly to suppress rebellion or defend borders; a standardised legal code let the same laws apply predictably across vastly different conquered territories — infrastructure AS statecraft, not just engineering achievement.' },
        { heading: 'Writing Systems Enabled Complex Society Itself', body: 'Cuneiform and hieroglyphics didn\u2019t just record history — they made large-scale administration possible in the first place: tracking tax records, trade agreements, legal codes and royal decrees at a scale that oral tradition alone couldn\u2019t reliably manage. This is why the emergence of writing is treated as a defining marker separating "history" (documented) from "prehistory" (undocumented) in archaeological convention.' }
      ],
      misconceptions: [
        { myth: 'Athenian democracy worked essentially like a modern democracy.', reality: 'It excluded women, enslaved people and foreigners entirely — only a minority of Athens\u2019 total population could actually vote.' },
        { myth: 'Ancient civilisations arose randomly, unrelated to their geography.', reality: 'Major early civilisations consistently cluster around major rivers, which provided water, fertile soil and trade routes essential to large settled populations.' },
        { myth: 'Roman roads and law were mainly built for citizens\u2019 convenience.', reality: 'They were primarily tools of imperial control — enabling fast military movement and consistent governance across a vast empire.' }
      ],
      expertNotes: [
        'Archaeologists treat the emergence of writing as the conventional boundary between "prehistory" and "history," since it\u2019s the point documented evidence becomes available.',
        'Historians of democracy specifically caveat Athenian democracy\u2019s exclusions when using it as a founding example, to avoid an inaccurate rosy comparison to modern systems.',
        'Historians studying imperial infrastructure (Roman roads, canals, postal systems) generally analyse it through the lens of administrative control, not just technological achievement.'
      ],
      examples: [{ q: 'What system of government did Athens pioneer?', working: 'Citizens voted directly on laws', answer: 'Democracy' }, { q: 'What writing system did the Sumerians use?', working: 'Wedge-shaped marks pressed into clay', answer: 'Cuneiform' }]
    },
    medieval: {
      title: 'Medieval History',
      intro: 'The medieval period (roughly 500-1500 CE) was shaped by feudalism, religious power, and events like the Black Death that reshaped society.',
      origin: 'The term "Middle Ages" (and the negative "Dark Ages" label sometimes attached to its early centuries) was actually coined by Renaissance scholars centuries later, who saw themselves as reviving classical learning after what they framed as a long, unenlightened gap — modern historians generally reject the "Dark Ages" framing as an oversimplification, since the period saw major legal, architectural (Gothic cathedrals), and institutional developments (early universities), even if classical-style scholarship dipped compared to Rome\u2019s peak.',
      sections: [
        { heading: 'Feudalism Was an Economic and Military Contract', body: 'Feudalism operated as a chain of obligation, not a simple dictatorship: a king granted land (a "fief") to a lord in exchange for military support and loyalty, and that lord in turn granted portions of the land to knights on the same terms, down to peasants who worked the land in exchange for protection. Understanding it as a network of mutual (if deeply unequal) obligations, rather than pure top-down control, explains why the system could destabilise so quickly once one link in the chain (like a massive labour shortage) broke down.' },
        { heading: 'The Black Death Broke Feudalism\u2019s Economic Logic', body: 'The Black Death (1347-1351) killed an estimated third of Europe\u2019s population, and this catastrophic labour shortage inadvertently gave surviving peasants massive new bargaining power — with far fewer workers available, peasants could demand wages or better terms for the first time, directly undermining the feudal assumption of a large, dependent, cheap labour force. This is a striking example of how a purely biological event (plague) triggered a fundamental economic and social shift that no ruler had planned or wanted.' },
        { heading: 'Magna Carta\u2019s Real Historical Significance', body: 'Magna Carta (1215) is often popularly framed as an early "human rights" document, but its immediate purpose was much narrower — English barons forced King John to sign it specifically to protect THEIR OWN feudal privileges and limit arbitrary royal taxation and punishment, not to establish general rights for ordinary people. Its long-term significance came later, as the principle it established (that even a king is bound by law) was reinterpreted and expanded by later generations into a much broader constitutional concept.' },
        { heading: 'The Crusades Had Mixed, Often Contradictory Motives', body: 'The Crusades combined genuine religious conviction (recovering Christian holy sites) with more worldly motives — younger sons seeking land and status they wouldn\u2019t inherit at home, Italian city-states seeking lucrative trade access, and the Papacy consolidating religious authority across a fractured Western Christendom. Treating the Crusades as driven by a single, simple cause (either "pure faith" or "pure greed") misses this genuinely tangled mix of religious, economic and political motivation historians still actively debate.' }
      ],
      misconceptions: [
        { myth: 'The "Dark Ages" were a period of total cultural and intellectual stagnation.', reality: 'Modern historians largely reject this framing — the period saw major legal, architectural and institutional developments, even if classical scholarship declined from Rome\u2019s peak.' },
        { myth: 'Magna Carta was written to establish general rights for ordinary medieval people.', reality: 'It was written to protect the specific feudal privileges of rebellious barons — its broader "rule of law" significance was a later reinterpretation.' },
        { myth: 'The Crusades were motivated purely by religious belief, or purely by greed for land.', reality: 'Historians generally see a genuinely mixed set of religious, economic and political motives, varying by participant and crusade.' }
      ],
      expertNotes: [
        'Medieval historians increasingly avoid the term "Dark Ages" in academic work, viewing it as an outdated, overly simplistic Renaissance-era framing.',
        'Legal historians trace a direct line from Magna Carta\u2019s "rule of law" principle to much later constitutional documents, while being careful to note its original narrow intent.',
        'Economic historians point to the Black Death as a rare, clear case of a single event measurably accelerating the end of an entire economic system (feudalism).'
      ],
      examples: [{ q: 'What year was the Norman Conquest?', working: 'Battle of Hastings', answer: '1066' }, { q: 'What document limited King John\u2019s power in 1215?', working: 'Forced on him by rebellious barons', answer: 'Magna Carta' }]
    },
    earlymodern: {
      title: 'Early Modern History',
      intro: 'The Early Modern period (roughly 1500-1800) saw a rebirth of learning, religious upheaval, global exploration, and new political ideas.',
      origin: 'This period is often treated as the hinge between the medieval and modern worlds precisely because several independent developments converged within a couple of centuries of each other — the printing press (c.1440) enabled the rapid spread of both Renaissance humanist ideas and Reformation religious tracts, while advances in shipbuilding and navigation enabled the transoceanic voyages that connected the Americas to the rest of the world for the first time in human history.',
      sections: [
        { heading: 'The Printing Press as the Engine of Rapid Change', body: 'Gutenberg\u2019s printing press (c.1440) is arguably the single most consequential technology of this era — it made both the Renaissance\u2019s revival of classical texts and the Reformation\u2019s religious pamphlets vastly cheaper and faster to spread than hand-copied manuscripts ever allowed. Martin Luther\u2019s 95 Theses spread across Europe within weeks specifically BECAUSE printing existed — a Reformation-scale religious split would likely have unfolded far more slowly, if at all, in a manuscript-only world.' },
        { heading: 'The Reformation Was Political As Much As Theological', body: 'Luther\u2019s theological objections (particularly to the selling of indulgences) provided the spark, but the Reformation\u2019s rapid spread and staying power depended heavily on political rulers who found genuine political and financial advantage in breaking from Rome\u2019s authority and, in some cases, seizing Catholic Church lands and wealth within their territories. Religious conviction and political self-interest were deeply intertwined, not separate forces.' },
        { heading: 'European "Exploration" Had a Devastating Flip Side', body: 'From a European perspective this era is framed as "the Age of Exploration," but from the perspective of the Americas it was an era of conquest and catastrophic demographic collapse — diseases like smallpox, to which indigenous American populations had no prior immunity, killed an estimated 80-90% of the pre-contact population in the century following contact, making disease (not warfare) the single largest factor in the scale of the demographic catastrophe.' },
        { heading: 'The Enlightenment Directly Fuelled Revolution', body: 'Enlightenment thinkers (Locke\u2019s natural rights, Rousseau\u2019s social contract, Voltaire\u2019s challenge to religious authority) weren\u2019t just abstract philosophers — their ideas were directly cited and drawn on by the authors of the American Declaration of Independence and French revolutionary documents, making this intellectual movement a direct, traceable cause of the political revolutions that reshaped the following century.' }
      ],
      misconceptions: [
        { myth: 'The Reformation was a purely religious/theological dispute.', reality: 'Political rulers\u2019 own interests (seizing Church wealth and land, gaining independence from Rome\u2019s authority) were deeply intertwined with the religious motivations.' },
        { myth: 'European "exploration" of the Americas was mainly a story of discovery and adventure.', reality: 'From the indigenous perspective it caused catastrophic population collapse, overwhelmingly driven by introduced disease rather than direct conflict.' },
        { myth: 'The Enlightenment was abstract philosophy with little real-world political impact.', reality: 'Its ideas were directly cited in the founding documents of both the American and French Revolutions.' }
      ],
      expertNotes: [
        'Historians of the Reformation weigh political and economic motives alongside theological ones, rather than treating it as purely a religious dispute.',
        'Historical demographers now treat introduced disease, not military conquest, as the primary driver of indigenous American population collapse after 1492.',
        'Political historians trace direct textual lines from Locke and Rousseau\u2019s writing to specific passages in Enlightenment-era revolutionary documents.'
      ],
      examples: [{ q: 'Who started the Protestant Reformation in 1517?', working: 'Wrote the 95 Theses', answer: 'Martin Luther' }, { q: 'What period revived classical art and learning?', working: 'Began in Italy, 14th-17th century', answer: 'The Renaissance' }]
    },
    modern: {
      title: 'Modern History',
      intro: 'The Modern era (roughly 1800-1945) was defined by industrialisation, global war, and economic upheaval on a scale never seen before.',
      origin: 'This period is often studied as a story of ACCELERATION — technological, economic and military change that had unfolded over centuries in earlier eras now happened within single decades, driven initially by the Industrial Revolution\u2019s harnessing of steam power (from the 1760s onward), and culminating in two wars fought at an industrial scale and lethality no previous conflict had approached.',
      sections: [
        { heading: 'The Industrial Revolution Changed More Than Machinery', body: 'The shift to powered machinery didn\u2019t just make production faster — it fundamentally restructured society: populations moved from rural farms to urban factory cities at unprecedented speed, creating both immense new wealth and severe new problems (overcrowding, pollution, child labour) that existing social and legal systems weren\u2019t built to handle, directly driving the labour and social reform movements of the following century.' },
        { heading: 'WWI: Long-Term Tensions Meeting a Short-Term Trigger', body: 'The assassination of Archduke Franz Ferdinand is the EVENT that triggered WWI, but historians emphasise this was a spark, not the underlying cause — decades of competitive imperial expansion, an arms race between major powers, rigid military alliance systems (where one country\u2019s conflict automatically drew in its allies), and rising nationalism had built up tension that made SOME triggering event likely to cause a wide war; the specific assassination determined the timing and immediate cause, not the war\u2019s ultimate origin.' },
        { heading: 'Versailles\u2019 Harsh Terms and Their Long Shadow', body: 'The Treaty of Versailles (1919) imposed heavy reparations and territorial losses on Germany — while intended to prevent future German aggression, many historians argue its severity instead created the economic hardship and national resentment that Hitler and the Nazi party later exploited politically, making the treaty a genuine (if unintended and contested) contributing factor in WWII\u2019s origins roughly two decades later.' },
        { heading: 'The Great Depression Showed How Interconnected Economies Had Become', body: 'The 1929 Wall Street Crash triggering a WORLDWIDE depression (not just an American one) revealed just how interconnected the global economy had become through the preceding century of industrialisation and international trade and lending — economic shockwaves from one country\u2019s stock market could now rapidly transmit hardship across the entire globe, a genuinely new phenomenon at that scale.' }
      ],
      misconceptions: [
        { myth: 'The assassination of Franz Ferdinand was the sole cause of WWI.', reality: 'It was the immediate trigger — decades of alliance systems, militarism, imperial competition and nationalism were the deeper long-term causes that made a wide war likely.' },
        { myth: 'The Treaty of Versailles was universally seen as fair and reasonable at the time.', reality: 'Many contemporaries and later historians criticised its severity as counterproductive, arguing it fuelled the resentment that contributed to WWII.' },
        { myth: 'The Industrial Revolution was purely a story of technological progress.', reality: 'It also caused severe urban overcrowding, pollution and labour exploitation that took decades of reform movements to address.' }
      ],
      expertNotes: [
        'Historians consistently distinguish "trigger" events from underlying long-term causes when explaining major conflicts like WWI.',
        'Economic historians treat the Great Depression as a landmark case study in global economic interconnection and contagion.',
        'Historians studying WWII\u2019s origins routinely weigh the Treaty of Versailles as a contributing (not sole) factor alongside the Depression and specific political developments in 1930s Germany.'
      ],
      examples: [{ q: 'What triggered WWI in 1914?', working: 'Assassination in Sarajevo set off alliance obligations', answer: 'Assassination of Archduke Franz Ferdinand' }, { q: 'What treaty ended WWI?', working: 'Signed in 1919, harsh on Germany', answer: 'Treaty of Versailles' }]
    },
    twentiethcentury: {
      title: '20th Century World',
      intro: 'The second half of the 20th century was shaped by the ideological standoff of the Cold War and major movements for civil and political rights.',
      origin: 'The Cold War emerged directly from the aftermath of WWII — wartime allies the USA and Soviet Union had cooperated against a common enemy (Nazi Germany) but held fundamentally incompatible visions for the post-war world (capitalist democracy versus communist state control), and with both emerging as the two dominant global military powers (each soon possessing nuclear weapons), that ideological conflict played out globally for over four decades without the two superpowers ever directly fighting each other militarily.',
      sections: [
        { heading: 'Why It\u2019s Called a "Cold" War', body: 'The term "Cold War" specifically captures that the USA and USSR never directly fought each other militarily, despite intense hostility — instead, the conflict played out through "proxy wars" (conflicts in other countries, like Korea and Vietnam, where each superpower backed opposing sides), an arms race, espionage, and ideological competition for influence over other nations, precisely BECAUSE direct war between two nuclear powers risked mutual destruction on a scale neither side was willing to risk.' },
        { heading: 'The Cuban Missile Crisis: Closest to Direct Conflict', body: 'The 1962 Cuban Missile Crisis is treated by historians as the closest the Cold War ever came to becoming a direct, potentially nuclear war between the superpowers — the discovery of Soviet nuclear missiles stationed in Cuba, within easy striking range of the US mainland, led to a tense 13-day standoff resolved through secret diplomatic back-channels, not military action, precisely because both leaders (Kennedy and Khrushchev) recognised how catastrophically high the stakes had become.' },
        { heading: 'The Civil Rights Movement\u2019s Strategic Use of Media', body: 'The American Civil Rights Movement deliberately used peaceful, disciplined protest specifically because footage and photographs of nonviolent protesters facing violent resistance (police dogs, fire hoses) generated powerful public sympathy when broadcast nationally — this was a conscious strategic choice, not just a moral one, using the relatively new power of television media to build political pressure for legal change.' },
        { heading: 'Why the Berlin Wall\u2019s Fall Mattered So Much', body: 'The Berlin Wall\u2019s fall in 1989 mattered far beyond Germany because it was the most visible, concrete symbol of Europe\u2019s Cold War division — its collapse both reflected and accelerated the broader unravelling of Soviet control across Eastern Europe that culminated in the Soviet Union\u2019s own dissolution in 1991, marking the definitive end of the Cold War era.' }
      ],
      misconceptions: [
        { myth: 'The Cold War means the USA and USSR fought each other directly in wars.', reality: 'They never fought each other directly — the conflict played out through proxy wars, an arms race, and ideological competition specifically to avoid direct nuclear confrontation.' },
        { myth: 'The Civil Rights Movement\u2019s use of peaceful protest was purely about moral principle.', reality: 'It was also a deliberate strategic choice, since footage of peaceful protesters facing violence generated powerful public and political sympathy via television.' },
        { myth: 'The Berlin Wall\u2019s fall was an isolated event specific only to Germany.', reality: 'It both symbolised and accelerated the wider collapse of Soviet control across Eastern Europe, leading to the USSR\u2019s dissolution.' }
      ],
      expertNotes: [
        'Cold War historians specifically study proxy conflicts (Korea, Vietnam, Afghanistan) as the primary arena where superpower rivalry actually played out militarily.',
        'Media historians treat the Civil Rights Movement as an early, influential case study in using television coverage to build a political and moral case for change.',
        'Historians treat 1989-1991 as a single continuous unravelling, not isolated events, when explaining the Cold War\u2019s end.'
      ],
      examples: [{ q: 'What crisis in 1962 nearly caused nuclear war?', working: 'Soviet missiles discovered in Cuba', answer: 'The Cuban Missile Crisis' }, { q: 'What wall symbolised Cold War division, falling in 1989?', working: 'Divided East and West Berlin', answer: 'The Berlin Wall' }]
    },
    skills: {
      title: 'Historical Skills',
      intro: 'GCSE History marks aren\u2019t just about facts — you need to evaluate sources, explain causation, and understand why interpretations of the past can differ.',
      origin: 'The formal study of HOW we know about the past (rather than just what happened) is called historiography, and it developed substantially in the 19th-20th centuries as historians increasingly recognised that all historical accounts — even ones based on real evidence — are shaped by the perspective, available sources, and questions of whoever is writing them, which is precisely why GCSE History assesses source evaluation and interpretation as core skills, not just factual recall.',
      sections: [
        { heading: 'Primary vs Secondary: Proximity to the Event, Not Just Age', body: 'The primary/secondary distinction is about PROXIMITY to the event (was this created at the time, by someone with direct knowledge?), not simply how old a source is — a documentary made in 2020 about events from 2020 could still count as closer to primary if made by direct participants, while a history book about ancient Rome written in the 1800s is still a secondary source, despite being "old," because its author wasn\u2019t there.' },
        { heading: 'Reliability Is Not the Same as Usefulness', body: 'A heavily biased source (a wartime propaganda poster, a politician\u2019s self-serving memoir) can be UNRELIABLE for establishing objective facts, yet still extremely USEFUL as evidence of the attitudes, fears or propaganda techniques of that time and place — historians are trained to extract this second kind of value even from sources they don\u2019t trust at face value, rather than simply discarding biased sources as worthless.' },
        { heading: 'Causation Requires Explaining HOW Causes Connect', body: 'A strong causation answer doesn\u2019t just list several causes of an event — it explains HOW those causes connected and built on each other to make the event more likely, distinguishing long-term underlying tensions (that built for years) from short-term triggers (the immediate spark). This "how do these link together" explanatory step is specifically what separates a top-band answer from a merely descriptive list of causes.' },
        { heading: 'Why Legitimate Historical Interpretations Can Differ', body: 'Two well-informed historians can honestly disagree about the same event because they may draw on different available sources, ask different questions (economic causes vs social causes vs individual leaders\u2019 choices), or bring different theoretical frameworks to the same evidence — this doesn\u2019t mean "history is just opinion," but it does mean interpretation involves genuine, defensible scholarly judgement, not just assembling agreed-upon facts.' }
      ],
      misconceptions: [
        { myth: 'An old source is automatically a primary source, and a recent one is automatically secondary.', reality: 'The distinction is about proximity to the event (were they there, at the time?), not the source\u2019s age.' },
        { myth: 'A biased or unreliable source has no historical value and should be dismissed.', reality: 'A biased source can still be genuinely useful as evidence of the attitudes or propaganda techniques of its time, even if unreliable for objective facts.' },
        { myth: 'Historians disagreeing about an event means the facts are unknowable or "just opinion."', reality: 'Legitimate disagreement usually reflects different evidence, questions or frameworks being applied to broadly agreed underlying facts.' }
      ],
      expertNotes: [
        'Professional historians are trained to extract value from biased sources as evidence of attitudes, even while explicitly flagging their unreliability for objective fact.',
        'Exam mark schemes specifically reward explaining HOW causes connect and build on each other, not just identifying and listing separate causes.',
        'Historiography (the study of how historical interpretation itself changes over time) is a recognised academic field distinct from history itself.'
      ],
      examples: [{ q: 'What is a primary source?', working: 'Created at the time of the event', answer: 'Evidence created at the time of the event' }, { q: 'What is a long-term cause?', working: 'Builds up gradually, unlike a sudden trigger', answer: 'An underlying factor building up over years or decades' }]
    }
  };

  var FORMULAS = [
    { topic: 'Skills', name: 'Source reliability check', formula: 'Consider: Who? Why? When? How close to the event?', when: 'Evaluating any historical source.', example: 'A soldier\u2019s diary is reliable for his own experience, but may be biased about the wider war.', tip: 'A source can be useful even if biased — bias itself can reveal attitudes of the time.' },
    { topic: 'Skills', name: 'Causation: long vs short-term', formula: 'Long-term = builds over years | Short-term = immediate trigger', when: 'Explaining why an event happened.', example: 'WWI: long-term = alliances & militarism; short-term = assassination of Franz Ferdinand.', tip: 'Strong answers explain HOW causes link together, not just list them.' },
    { topic: 'Skills', name: 'PEEL paragraph structure', formula: 'Point \u2192 Evidence \u2192 Explain \u2192 Link', when: 'Writing extended History exam answers.', example: 'Point: Feudalism weakened after the Black Death. Evidence: labour shortages... Explain: peasants could demand pay... Link: this contributed to the end of serfdom.', tip: 'Always link back to the question at the end of each paragraph.' },
    { topic: 'Timeline', name: 'Ancient era', formula: '~3000 BCE \u2013 500 CE', when: 'Egypt, Mesopotamia, Greece, Rome.', example: 'Roman Empire fell in the West in 476 CE.', tip: 'Use BCE/CE, not BC/AD, in modern academic writing.' },
    { topic: 'Timeline', name: 'Medieval era', formula: '~500 \u2013 1500 CE', when: 'Feudalism, Crusades, Black Death, Magna Carta.', example: 'Norman Conquest: 1066. Black Death: 1347-1351.', tip: 'The medieval period is also called "The Middle Ages".' },
    { topic: 'Timeline', name: 'Early Modern era', formula: '~1500 \u2013 1800 CE', when: 'Renaissance, Reformation, exploration, Enlightenment.', example: 'Martin Luther\u2019s 95 Theses: 1517. Columbus reaches Americas: 1492.', tip: 'This era bridges the medieval world and the modern industrial age.' },
    { topic: 'Timeline', name: 'Modern era', formula: '~1800 \u2013 1945', when: 'Industrial Revolution, WWI, WWII, Great Depression.', example: 'WWI: 1914-1918. WWII: 1939-1945.', tip: 'The two World Wars are the defining events of this period.' },
    { topic: 'Timeline', name: '20th Century World', formula: '~1945 \u2013 1991 (Cold War era)', when: 'Cold War, Civil Rights, decolonisation.', example: 'Cuban Missile Crisis: 1962. Berlin Wall falls: 1989.', tip: 'The Cold War ended with the Soviet Union\u2019s collapse in 1991.' }
  ];

  root.LearningHistory = {
    generate: generate, generateForLevel: generateForLevel, generateLevelSet: generateLevelSet, generatePlacementSet: generatePlacementSet,
    levelLabel: levelLabel, gradeFromLevel: gradeFromLevel, levelFromScore: levelFromScore, strongestWeakest: strongestWeakest,
    QT_TYPES: QT_TYPES, QT_DIFFICULTIES: QT_DIFFICULTIES, QT_LENGTHS: QT_LENGTHS,
    buildQuickTest: buildQuickTest, generateDailyChallenge: generateDailyChallenge, levelToTier: qtLevelToTier,
    checkAnswer: checkAnswer, LESSONS: LESSONS, FORMULAS: FORMULAS,
    TOPICS: [
      { key: 'ancient', label: 'Ancient Civilisations', desc: 'Egypt, Greece, Rome & early trade' },
      { key: 'medieval', label: 'Medieval History', desc: 'Feudalism, Black Death & Magna Carta' },
      { key: 'earlymodern', label: 'Early Modern History', desc: 'Renaissance, Reformation & exploration' },
      { key: 'modern', label: 'Modern History', desc: 'Industrial Revolution & the World Wars' },
      { key: 'twentiethcentury', label: '20th Century World', desc: 'Cold War, Civil Rights & decolonisation' },
      { key: 'skills', label: 'Historical Skills', desc: 'Sources, causation & interpretation' }
    ]
  };
})(window);

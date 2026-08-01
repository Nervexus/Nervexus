/* ============================================================================
   learning-grammar.js — dedicated English Grammar engine for the Learning
   Centre (distinct from the broader English tab). Curated MC/text question
   banks across Parts of Speech, Tenses, Punctuation, Sentence Structure,
   Common Errors and Active/Passive Voice, a 60-level system, placement test,
   Quick Test support and a grammar rules reference library. Consumed by the
   DC logic class via window.LearningGrammar.
   ============================================================================ */
(function (root) {
  'use strict';
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[ri(0, arr.length - 1)]; }
  function shuffle(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = ri(0, i); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ---- CURATED BANKS (level 1-60) ----------------------------------------- */
  var PARTS_OF_SPEECH = [
    { level: 2, q: 'Which word is a noun? "The dog ran quickly."', a: 'dog', d: ['dog', 'ran', 'quickly', 'the'], why: 'A noun names a person, place, thing or idea — "dog" is the thing.' },
    { level: 4, q: 'Which word is a verb? "She sings beautifully."', a: 'sings', d: ['sings', 'she', 'beautifully', 'the'], why: 'A verb is a doing/being word — "sings" is the action.' },
    { level: 6, q: 'Which word is an adjective? "The tall man smiled."', a: 'tall', d: ['tall', 'man', 'smiled', 'the'], why: 'An adjective describes a noun — "tall" describes the man.' },
    { level: 8, q: 'Which word is an adverb? "He ran quickly to the shop."', a: 'quickly', d: ['quickly', 'ran', 'shop', 'the'], why: 'An adverb usually describes a verb, often ending in -ly — "quickly" describes how he ran.' },
    { level: 10, q: 'Which word is a pronoun? "Sarah said she was tired."', a: 'she', d: ['she', 'Sarah', 'said', 'tired'], why: 'A pronoun replaces a noun to avoid repetition — "she" replaces "Sarah".' },
    { level: 12, q: 'Which word is a preposition? "The cat sat under the table."', a: 'under', d: ['under', 'cat', 'sat', 'table'], why: 'A preposition shows the relationship (often position) between words — "under" shows where.' },
    { level: 14, q: 'Which word is a conjunction? "I wanted to go, but it was raining."', a: 'but', d: ['but', 'wanted', 'raining', 'it'], why: 'A conjunction joins clauses or words — "but" joins two contrasting ideas.' },
    { level: 16, q: 'Which word is a determiner? "She bought three apples."', a: 'three', d: ['three', 'bought', 'apples', 'she'], why: 'A determiner comes before a noun to clarify it (articles, numbers, possessives) — "three" specifies how many.' },
    { level: 18, q: 'What part of speech is "however" in: "However, he still tried."', a: 'Adverb (connective)', d: ['Adverb (connective)', 'Noun', 'Verb', 'Preposition'], why: '"However" is a connecting adverb, linking ideas across sentences.' },
    { level: 20, q: 'In "the running water", what part of speech is "running"?', a: 'Adjective (participle)', d: ['Adjective (participle)', 'Verb', 'Noun', 'Adverb'], why: 'Here "running" describes the water (a noun) — it acts as an adjective, even though it looks like a verb form.' },
    { level: 24, q: 'Which is a collective noun?', a: 'Team', d: ['Team', 'Run', 'Quickly', 'Under'], why: 'A collective noun names a group treated as one unit, e.g. team, flock, herd.' },
    { level: 28, q: 'What type of pronoun is "myself" in "I did it myself"?', a: 'Reflexive pronoun', d: ['Reflexive pronoun', 'Possessive pronoun', 'Relative pronoun', 'Demonstrative pronoun'], why: 'Reflexive pronouns (myself, yourself, himself) refer back to the subject of the sentence.' },
    { level: 32, q: 'What type of word is "that" in "the book that I read"?', a: 'Relative pronoun', d: ['Relative pronoun', 'Demonstrative pronoun', 'Conjunction', 'Adverb'], why: 'Relative pronouns (who, which, that) introduce a relative clause giving more information about a noun.' }
  ];
  var TENSES = [
    { level: 3, q: 'Which sentence is in the present tense?', a: 'She walks to school.', d: ['She walks to school.', 'She walked to school.', 'She will walk to school.', 'She has walked to school.'], why: 'Present simple describes habits or current facts, using the base verb (+s for he/she/it).' },
    { level: 5, q: 'Which sentence is in the past tense?', a: 'They played football yesterday.', d: ['They played football yesterday.', 'They play football.', 'They will play football.', 'They are playing football.'], why: 'Past simple describes a finished action, usually formed with -ed (played) or an irregular past form.' },
    { level: 7, q: 'Which sentence is in the future tense?', a: 'We will visit Paris next year.', d: ['We will visit Paris next year.', 'We visited Paris.', 'We visit Paris often.', 'We are visiting Paris now.'], why: 'Future simple uses "will" + base verb to describe something not yet happened.' },
    { level: 11, q: 'Complete: "She ___ (study) for three hours now." (present perfect continuous)', a: 'has been studying', d: ['has been studying', 'studies', 'studied', 'will study'], why: 'Present perfect continuous (has/have been + -ing) shows an action that started in the past and continues now.' },
    { level: 15, q: 'What tense is used in "Had I known, I would have left"?', a: 'Past perfect', d: ['Past perfect', 'Present perfect', 'Future perfect', 'Past continuous'], why: 'Past perfect (had + past participle) describes an action completed before another past action.' },
    { level: 19, q: 'Which sentence correctly uses future perfect?', a: 'By next year, she will have graduated.', d: ['By next year, she will have graduated.', 'By next year, she graduates.', 'By next year, she is graduating.', 'By next year, she graduated.'], why: 'Future perfect (will have + past participle) describes something that will be completed before a future point in time.' },
    { level: 22, q: 'Identify the tense: "I was reading when you called."', a: 'Past continuous', d: ['Past continuous', 'Past simple', 'Present continuous', 'Past perfect'], why: 'Past continuous (was/were + -ing) describes an ongoing action interrupted by another past event.' },
    { level: 26, q: 'What is wrong with: "Yesterday, I go to the shop"?', a: '"go" should be "went" (past tense needed)', d: ['"go" should be "went" (past tense needed)', 'Nothing is wrong', '"Yesterday" is unnecessary', '"shop" should be capitalised'], why: '"Yesterday" signals a completed past action, so the verb must be in the past tense: "went".' }
  ];
  var PUNCTUATION = [
    { level: 2, q: 'What punctuation mark ends a question?', a: 'Question mark (?)', d: ['Question mark (?)', 'Full stop (.)', 'Exclamation mark (!)', 'Comma (,)'], why: 'Questions always end with a question mark, even indirect-sounding ones like "I wonder what time it is?" (if phrased as a direct question).' },
    { level: 4, q: 'Which sentence uses an apostrophe correctly for possession?', a: "The dog's bone", d: ["The dog's bone", "The dogs' bone (one dog)", "The dog's' bone", 'The dogs bone'], why: 'For one dog possessing something, add \u2019s: "the dog\u2019s bone".' },
    { level: 6, q: 'Which is the correct plural possessive for multiple students\u2019 results?', a: "students' results", d: ["students' results", "student's results", "students's results", 'students results'], why: 'For a plural noun already ending in s, add just an apostrophe after the s: students\u2019.' },
    { level: 9, q: 'Where should the comma go? "After the long journey we arrived home."', a: 'After the long journey, we arrived home.', d: ['After the long journey, we arrived home.', 'After, the long journey we arrived home.', 'After the long, journey we arrived home.', 'No comma needed'], why: 'A comma follows an introductory phrase before the main clause begins.' },
    { level: 13, q: 'Which sentence correctly uses a semicolon?', a: 'The exam was hard; everyone was relieved when it ended.', d: ['The exam was hard; everyone was relieved when it ended.', 'The exam was hard; because it was long.', 'The exam; was hard.', 'The exam was; hard.'], why: 'A semicolon joins two closely related complete sentences (independent clauses) without a conjunction.' },
    { level: 17, q: 'What is wrong with: "I was hungry, I ate an apple"?', a: 'It\u2019s a comma splice — needs "so", a full stop, or a semicolon', d: ['It\u2019s a comma splice — needs "so", a full stop, or a semicolon', 'Nothing is wrong', 'It needs a question mark', 'The comma should be a colon'], why: 'Two complete sentences joined only by a comma is a comma splice — fix with a conjunction, semicolon, or full stop.' },
    { level: 21, q: 'When should you use a colon?', a: 'To introduce a list or explanation', d: ['To introduce a list or explanation', 'To join two unrelated sentences', 'To replace a comma anywhere', 'At the end of a question'], why: 'A colon introduces a list, quotation, or explanation that expands on the first part of the sentence.' },
    { level: 25, q: 'Which sentence uses parenthetical commas correctly?', a: 'My brother, who lives in Leeds, is visiting today.', d: ['My brother, who lives in Leeds, is visiting today.', 'My brother who, lives in Leeds is visiting today.', 'My brother who lives in Leeds, is visiting, today.', 'My, brother who lives in Leeds is visiting today.'], why: 'Non-essential extra information is enclosed by a pair of commas on both sides.' }
  ];
  var SENTENCE_STRUCTURE = [
    { level: 3, q: 'What type of sentence is: "The rain fell."?', a: 'Simple sentence', d: ['Simple sentence', 'Compound sentence', 'Complex sentence', 'Fragment'], why: 'A simple sentence has just one main (independent) clause.' },
    { level: 6, q: 'What type of sentence is: "The rain fell, and the streets flooded."?', a: 'Compound sentence', d: ['Compound sentence', 'Simple sentence', 'Complex sentence', 'Fragment'], why: 'A compound sentence joins two independent clauses with a coordinating conjunction (and, but, or).' },
    { level: 10, q: 'What type of sentence is: "Although it was raining, we went outside."?', a: 'Complex sentence', d: ['Complex sentence', 'Simple sentence', 'Compound sentence', 'Fragment'], why: 'A complex sentence has one main clause and at least one subordinate clause (introduced by although, because, since...).' },
    { level: 14, q: 'What is a subordinate clause?', a: 'A clause that cannot stand alone as a full sentence', d: ['A clause that cannot stand alone as a full sentence', 'Any clause with a verb', 'The first clause in a sentence', 'A clause joined by "and"'], why: 'Subordinate (dependent) clauses need a main clause to complete their meaning — they can\u2019t stand alone.' },
    { level: 18, q: 'Identify the main clause: "Because she was tired, she went to bed early."', a: 'she went to bed early', d: ['she went to bed early', 'Because she was tired', 'The whole sentence', 'she was tired'], why: 'The main clause makes complete sense on its own; "Because she was tired" cannot stand alone.' },
    { level: 23, q: 'What is a sentence fragment?', a: 'An incomplete sentence missing a subject or verb', d: ['An incomplete sentence missing a subject or verb', 'A sentence with too many clauses', 'A very short simple sentence', 'A sentence starting with "and"'], why: 'A fragment is missing an essential part (a subject, a verb, or a complete thought) and can\u2019t stand alone.' },
    { level: 27, q: 'Which is an example of a minor sentence used for effect?', a: 'Silence. Nothing moved.', d: ['Silence. Nothing moved.', 'The room was completely silent and nothing moved at all.', 'Although it was silent, nothing moved.', 'It was silent, and nothing moved.'], why: 'Minor (fragment) sentences like "Silence." are used deliberately in writing for dramatic short impact.' }
  ];
  var COMMON_ERRORS = [
    { level: 4, q: 'Choose the correct word: "___ going to the park."', a: "They're", d: ["They're", 'Their', 'There', 'Thier'], why: '"They\u2019re" is a contraction of "they are". "Their" shows possession; "there" shows place.' },
    { level: 6, q: 'Choose the correct word: "Put the keys over ___."', a: 'there', d: ['there', "they're", 'their', 'thier'], why: '"There" refers to a place or position.' },
    { level: 8, q: 'Choose the correct word: "___ car is parked outside."', a: 'Their', d: ['Their', "They're", 'There', 'Thier'], why: '"Their" shows something belongs to them (possession).' },
    { level: 10, q: 'Choose the correct word: "___ going to be late!"', a: "You're", d: ["You're", 'Your', 'Yore', 'Yor'], why: '"You\u2019re" is short for "you are". "Your" shows possession (your car).' },
    { level: 13, q: 'Choose the correct word: "The weather will ___ our plans."', a: 'affect', d: ['affect', 'effect', 'effected', 'affected'], why: '"Affect" is usually a verb (to influence). "Effect" is usually a noun (a result).' },
    { level: 16, q: 'Choose the correct word: "The medicine had no ___."', a: 'effect', d: ['effect', 'affect', 'effecting', 'affecting'], why: '"Effect" as a noun means the result of something.' },
    { level: 20, q: 'Choose the correct word: "___ raining outside."', a: "It's", d: ["It's", 'Its', 'Its\'', 'It'], why: '"It\u2019s" is a contraction of "it is". "Its" shows possession (the dog wagged its tail).' },
    { level: 24, q: 'Which is correct: "less" or "fewer" people?', a: 'Fewer people', d: ['Fewer people', 'Less people', 'Lesser people', 'Least people'], why: 'Use "fewer" for countable nouns (people, items); use "less" for uncountable nouns (water, time).' },
    { level: 29, q: 'Which sentence is grammatically correct?', a: 'She and I went to the shop.', d: ['She and I went to the shop.', 'Her and me went to the shop.', 'Me and her went to the shop.', 'Her and I went to the shop.'], why: 'Use subject pronouns (I, she) when they are the subject performing the action, not object pronouns (me, her).' },
    { level: 34, q: 'Which is correct: "who" or "whom" — "___ did you give it to?"', a: 'Whom', d: ['Whom', 'Who', 'Whose', 'Which'], why: '"Whom" is used as the object of a verb or preposition; "who" is used as the subject.' }
  ];
  var VOICE = [
    { level: 5, q: 'Which sentence is in the active voice?', a: 'The dog chased the ball.', d: ['The dog chased the ball.', 'The ball was chased by the dog.', 'The ball had been chased.', 'The ball is being chased.'], why: 'In active voice, the subject (the dog) performs the action directly.' },
    { level: 8, q: 'Which sentence is in the passive voice?', a: 'The cake was eaten by Tom.', d: ['The cake was eaten by Tom.', 'Tom ate the cake.', 'Tom is eating the cake.', 'Tom will eat the cake.'], why: 'In passive voice, the subject (the cake) receives the action rather than performing it.' },
    { level: 12, q: 'Rewrite in passive voice: "The company launched the product."', a: 'The product was launched by the company.', d: ['The product was launched by the company.', 'The company was launched by the product.', 'The product launched the company.', 'The company launches the product.'], why: 'Make the object (product) the new subject, and use "was/were + past participle".' },
    { level: 17, q: 'Why might a writer choose passive voice?', a: 'When the doer of the action is unknown or unimportant', d: ['When the doer of the action is unknown or unimportant', 'To make the sentence longer', 'It is always the best choice', 'To avoid using verbs'], why: 'Passive voice is useful when who did something matters less than what happened, e.g. "The window was broken."' },
    { level: 22, q: 'Which sentence uses passive voice correctly to hide the doer?', a: 'Mistakes were made.', d: ['Mistakes were made.', 'I made mistakes.', 'We made mistakes.', 'Mistakes are being made by me.'], why: '"Mistakes were made" is a classic passive construction that omits who is responsible.' }
  ];

  var BANKS = { partsofspeech: PARTS_OF_SPEECH, tenses: TENSES, punctuation: PUNCTUATION, sentencestructure: SENTENCE_STRUCTURE, commonerrors: COMMON_ERRORS, voice: VOICE };
  var TOPIC_LABELS = { partsofspeech: 'Parts of Speech', tenses: 'Tenses', punctuation: 'Punctuation', sentencestructure: 'Sentence Structure', commonerrors: 'Common Errors', voice: 'Active & Passive Voice' };
  function mcFromEntry(topicLabel, e) { return { type: 'mc', topic: topicLabel, level: e.level, prompt: e.q, options: shuffle(e.d), answer: e.a, method: e.why }; }
  function nearestByLevel(bank, level) { return bank.slice().sort(function (a, b) { return Math.abs(a.level - level) - Math.abs(b.level - level); }); }
  var _rot = {};
  function rr(key, arr) {
    var st = _rot[key];
    if (!st || st.i >= st.order.length || st.order.length !== arr.length) { st = { order: shuffle(arr.map(function (_, i) { return i; })), i: 0 }; _rot[key] = st; }
    return arr[st.order[st.i++]];
  }
  function generateFromBank(poolKey, level, topicLabel) {
    var bank = BANKS[poolKey]; var near = nearestByLevel(bank, level || 1);
    return mcFromEntry(topicLabel, rr(poolKey, near));
  }
  function generate(topicKey, level) { return generateFromBank(topicKey, level, TOPIC_LABELS[topicKey]); }

  /* ---- LEVEL SYSTEM (1-60, banded across the 6 topics) --------------------- */
  var POOL_KEYS = ['partsofspeech', 'tenses', 'punctuation', 'sentencestructure', 'commonerrors', 'voice'];
  var LEVEL_BANDS = [
    { min: 1, max: 15, pools: ['partsofspeech', 'punctuation'] },
    { min: 16, max: 30, pools: ['tenses', 'commonerrors'] },
    { min: 31, max: 45, pools: ['sentencestructure', 'voice'] },
    { min: 46, max: 60, pools: POOL_KEYS }
  ];
  function bandFor(level) { for (var i = 0; i < LEVEL_BANDS.length; i++) { var b = LEVEL_BANDS[i]; if (level >= b.min && level <= b.max) return b; } return LEVEL_BANDS[LEVEL_BANDS.length - 1]; }
  function generateForLevel(level) { level = Math.max(1, Math.min(60, level || 1)); var pool = pick(bandFor(level).pools); return generate(pool, level); }
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

  /* ---- QUICK TEST ----------------------------------------------------------- */
  var QT_TYPES = [
    { key: 'partsofspeech', label: 'Parts of Speech' }, { key: 'tenses', label: 'Tenses' }, { key: 'punctuation', label: 'Punctuation' },
    { key: 'sentencestructure', label: 'Sentence Structure' }, { key: 'commonerrors', label: 'Common Errors' }, { key: 'voice', label: 'Active & Passive Voice' },
    { key: 'mixed', label: 'Mixed Grammar Test' }
  ];
  var QT_DIFFICULTIES = ['Beginner', 'Intermediate', 'GCSE Foundation', 'GCSE Higher', 'Auto'];
  var QT_LENGTHS = [5, 10, 20, 50];
  function qtDifficultyToTier(diff) { return { Beginner: 1, Intermediate: 2, 'GCSE Foundation': 3, 'GCSE Higher': 4 }[diff] || 2; }
  function qtLevelToTier(level) { level = level || 1; if (level <= 15) return 1; if (level <= 30) return 2; if (level <= 45) return 3; return 4; }
  function qtTierToLevel(tier) { return { 1: 8, 2: 23, 3: 38, 4: 52 }[tier] || 23; }
  function qtQuestionForType(typeKey, tier) {
    var level = qtTierToLevel(tier);
    var key = typeKey === 'mixed' ? pick(POOL_KEYS) : typeKey;
    return generate(key, level);
  }
  function buildQuickTest(typeKey, difficulty, length, userLevel) {
    var tier = difficulty === 'Auto' ? qtLevelToTier(userLevel || 1) : qtDifficultyToTier(difficulty);
    var out = []; for (var i = 0; i < (length || 10); i++) out.push(qtQuestionForType(typeKey, tier));
    return out;
  }
  function generateDailyChallenge(userLevel) {
    var tier = qtLevelToTier(userLevel || 1);
    var mix = POOL_KEYS.concat(['partsofspeech', 'commonerrors']);
    var out = []; for (var i = 0; i < 8; i++) out.push(qtQuestionForType(mix[i % mix.length], tier));
    return out;
  }
  function checkAnswer(q, input) {
    var norm = function (s) { return (s || '').toLowerCase().trim().replace(/[^a-z0-9 ']/g, ''); };
    return norm(input) === norm(q.answer);
  }

  /* ---- LESSONS (Learn screens, deep long-form chapters) --------------------- */
  var LESSONS = {
    partsofspeech: {
      title: 'Parts of Speech',
      intro: 'Every word in a sentence plays a grammatical role. Knowing these roles helps you build (and fix) sentences correctly, and is the foundation for every other grammar topic.',
      origin: 'The eight traditional parts of speech (noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection) trace back to Greek and Latin grammarians over 2,000 years ago — Dionysius Thrax\u2019s Greek grammar (c. 100 BCE) is the earliest surviving systematic classification, and it was adapted almost unchanged into Latin, then into English grammar teaching centuries later. This is why English grammar terminology still uses Latin-derived logic even though English itself is a Germanic language with quite different structure — the classification system was borrowed wholesale rather than built from scratch for English.',
      sections: [
        { heading: 'Why Word Class Matters More Than Word Meaning', body: 'The same word can belong to different parts of speech depending on its role in a sentence — "running" is a verb in "she is running" but an adjective in "the running water" and a noun in "running is good exercise." This is why identifying part of speech requires looking at the word\u2019s FUNCTION in that specific sentence, not just recognising the word itself — a word\u2019s grammatical identity is contextual, not fixed.' },
        { heading: 'Open Classes vs Closed Classes', body: 'Nouns, verbs, adjectives and adverbs are "open classes" — new words are constantly invented (email, google, selfie all became new nouns/verbs within living memory). Pronouns, prepositions, conjunctions and determiners are "closed classes" — this set of words has stayed almost completely fixed for centuries, because they perform structural, grammatical roles rather than naming new things in the world. This is why an English teacher can teach the full list of prepositions but never the full list of nouns.' },
        { heading: 'Pronouns Exist to Prevent Repetition', body: 'Pronouns (he, they, this, myself, who) exist specifically to avoid the unnatural repetition that would result from constantly reusing a full noun — compare the fluency of "Sarah said she was tired" against the clunkiness of "Sarah said Sarah was tired." Different pronoun types serve distinct functions: personal pronouns (she, they) replace people/things, reflexive pronouns (myself) refer back to the subject, and relative pronouns (who, which, that) introduce extra information about a noun.' },
        { heading: 'Why Determiners Are Their Own Category', body: 'Determiners (the, three, my, some) were traditionally grouped as adjectives, but modern grammar treats them separately because they perform a distinct grammatical job — specifying WHICH or HOW MANY of a noun, rather than describing a quality of it. This is a genuinely useful, if subtle, distinction: "the tall man" has both a determiner (the) and an adjective (tall) doing different jobs on the same noun.' }
      ],
      misconceptions: [
        { myth: 'A word always belongs to the same part of speech no matter the sentence.', reality: 'The same word can function as a noun, verb or adjective depending entirely on its role in that specific sentence.' },
        { myth: 'Adverbs are just any word ending in -ly.', reality: 'Many adverbs don\u2019t end in -ly (never, often, fast, well), and some -ly words are adjectives (friendly, lovely) — the -ly ending is a common pattern, not a reliable rule.' },
        { myth: 'Determiners are just a type of adjective.', reality: 'Modern grammar treats them as a separate category, since they specify WHICH/HOW MANY rather than describing a quality.' }
      ],
      expertNotes: [
        'Linguists identify part of speech by testing a word\u2019s FUNCTION and its ability to be replaced by known members of a class, not by its appearance alone.',
        'Editors flag "zombie nouns" (verbs unnecessarily turned into nouns, e.g. "make a decision" instead of "decide") as a common cause of weak, wordy writing.',
        'Grammarians still debate edge cases (e.g. whether certain words are prepositions or subordinating conjunctions) — the traditional eight-part system is a teaching simplification, not a perfectly precise scientific model.'
      ],
      examples: [{ q: 'What part of speech is "quickly"?', working: 'Describes the verb, ends in -ly', answer: 'Adverb' }, { q: 'What part of speech is "under" in "under the bridge"?', working: 'Shows the relationship/position', answer: 'Preposition' }, { q: 'What part of speech replaces a noun?', working: 'Avoids repeating the noun', answer: 'Pronoun' }]
    },
    tenses: {
      title: 'Tenses',
      intro: 'Tenses show WHEN an action happens. GCSE writing is marked partly on consistent, accurate tense use — mixing tenses without reason is a common error.',
      origin: 'English\u2019s tense system is unusually complex compared to many languages because it combines TIME (past/present/future) with ASPECT (simple/continuous/perfect) as two separate, combinable dimensions — a structure inherited from Old English\u2019s Germanic roots, then layered with additional forms borrowed and adapted from Latin-influenced grammar teaching. This is why English has 12 commonly-taught tense forms (3 times × 4 aspects) rather than a simpler 3-tense system like some other languages use.',
      sections: [
        { heading: 'Time vs Aspect: The Two Dimensions of Every Tense', body: 'Every English tense combines a TIME (past, present, future) with an ASPECT that describes the nature of the action: simple (a fact or single action), continuous (an ongoing action, using -ing), or perfect (an action viewed in relation to another point in time, using have/has/had). Understanding tenses as this 3×4 grid, rather than 12 separate unrelated forms to memorise, is why the perfect and continuous aspects behave so consistently across past/present/future once you learn the pattern once.' },
        { heading: 'Why the Perfect Aspect Exists At All', body: 'The perfect aspect (has/have/had + past participle) exists specifically to link one point in time to ANOTHER point, which simple and continuous aspects can\u2019t express alone — present perfect links a past action to NOW ("she has lived here for years" — still true now), while past perfect links one past action to an EARLIER past action ("she had left before I arrived" — leaving happened first). This relational function is the perfect aspect\u2019s whole purpose, which is why it\u2019s often taught alongside specific signal words (already, yet, since, for, by the time).' },
        { heading: 'Tense Consistency and Narrative Voice', body: 'Prose fiction is conventionally written entirely in either past tense (the traditional default, "she walked into the room") or present tense (a more immediate, unusual choice, "she walks into the room") — and switching between them without a clear reason (like a flashback) is one of the most common markers of inexperienced writing that examiners specifically look for and penalise.' },
        { heading: 'Signal Words Are the Fastest Way to Choose a Tense', body: 'Certain words reliably signal which tense is needed: "yesterday," "last year" and "ago" demand past tense; "now," "currently" and "at the moment" demand present continuous; "by [future time]" demands future perfect; "since" and "for" often signal present perfect. Training yourself to spot these signal words is a far faster and more reliable method for choosing the correct tense under exam pressure than trying to reason through the grammar from first principles each time.' }
      ],
      misconceptions: [
        { myth: 'English has only three tenses: past, present and future.', reality: 'English combines 3 time periods with 4 aspects (simple, continuous, perfect, perfect continuous), producing up to 12 commonly-taught tense forms.' },
        { myth: 'Present perfect and past simple are basically interchangeable.', reality: 'Present perfect specifically links a past action to NOW ("she has lived here" = still true); past simple describes a fully finished, disconnected past action ("she lived here" = no longer true).' },
        { myth: 'It doesn\u2019t matter which tense you write a story in, as long as it\u2019s clear.', reality: 'Consistent tense use (staying in past OR present throughout, barring deliberate flashbacks) is a specific mark of writing control that examiners look for.' }
      ],
      expertNotes: [
        'ESL teachers explicitly teach the time × aspect grid rather than 12 isolated forms, since understanding the pattern transfers far better than memorising each tense separately.',
        'Copyeditors flag unmotivated tense shifts in narrative prose as a top-tier line-edit issue, since it disrupts a reader\u2019s sense of when events are happening relative to each other.',
        'Signal words (since, for, by, yesterday) are taught as the fastest practical diagnostic for tense choice, especially under timed exam conditions.'
      ],
      examples: [{ q: '"Yesterday, she ___ (walk) to school."', working: 'Signal word "yesterday" = past simple', answer: 'walked' }, { q: '"By next year, she ___ (graduate)."', working: 'Completed before a future point = future perfect', answer: 'will have graduated' }, { q: '"I ___ (read) when you called."', working: 'Ongoing action interrupted = past continuous', answer: 'was reading' }]
    },
    punctuation: {
      title: 'Punctuation',
      intro: 'Punctuation controls how a sentence is read and understood. GCSE examiners specifically mark accurate use of commas, apostrophes and more advanced punctuation like semicolons and colons.',
      origin: 'Punctuation as a formal, standardised system is surprisingly recent — ancient texts (Greek, Latin, early English) were often written with NO spaces or punctuation at all (scriptio continua), relying entirely on the reader\u2019s knowledge to parse meaning. Punctuation marks developed gradually through medieval scribes marking pause points for reading aloud, and were only truly standardised after the invention of the printing press (1440s) made consistent, reproducible punctuation commercially practical and necessary across many printed copies of the same text.',
      sections: [
        { heading: 'Punctuation\u2019s Original Job Was Guiding the Voice', body: 'Early punctuation marks were primarily about breath and pause for reading ALOUD (a comma for a short pause, a colon for a longer one) rather than the grammatical logic-marking system taught today. Understanding this origin explains why reading a sentence aloud and noticing where you naturally pause is still one of the most reliable intuitive checks for where a comma likely belongs, even though modern punctuation rules are framed grammatically rather than vocally.' },
        { heading: 'The Comma Splice: Why It\u2019s Specifically Wrong', body: 'A comma splice ("I was hungry, I ate an apple") is grammatically incorrect specifically because a comma is too weak a mark to join two independent clauses (complete sentences) on its own — English requires a stronger connector for that job: a full stop, a semicolon, or a comma PLUS a coordinating conjunction (and, but, so). This is a precise, testable rule, not a stylistic preference, which is why it\u2019s consistently and heavily penalised in formal writing assessment.' },
        { heading: 'Apostrophes: One Symbol, Two Unrelated Jobs', body: 'The apostrophe does two historically unrelated jobs that happen to share the same symbol: marking possession (the dog\u2019s bone — historically a contraction of an older possessive "his" construction) and marking omitted letters in a contraction (don\u2019t = do not). Confusing these two functions, or worse, using an apostrophe simply to form a plural ("banana\u2019s for sale"), is one of the most heavily-criticised punctuation errors in English precisely because the symbol carries no plural function at all.' },
        { heading: 'Semicolons and Colons: Precision Tools, Not Interchangeable Extras', body: 'A semicolon specifically joins two independent clauses that are closely related in meaning, without needing a conjunction — both sides must be able to stand alone as complete sentences. A colon does a different job: it introduces something that explains, lists, or expands on what came immediately before, and what follows a colon does NOT need to be a complete sentence. Mixing these two up is one of the more advanced but frequently tested punctuation distinctions at higher GCSE grades.' }
      ],
      misconceptions: [
        { myth: 'An apostrophe is used to make a word plural.', reality: 'Apostrophes mark possession or omitted letters — never plurals ("bananas for sale," not "banana\u2019s for sale").' },
        { myth: 'Commas and semicolons are basically interchangeable for joining sentences.', reality: 'A comma alone cannot join two complete sentences (that\u2019s a comma splice) — only a semicolon, full stop, or comma+conjunction can.' },
        { myth: 'A colon must always be followed by a complete list or a full sentence.', reality: 'What follows a colon just needs to explain or expand on what came before — it doesn\u2019t need to be a grammatically complete sentence itself.' }
      ],
      expertNotes: [
        'Professional editors read a sentence aloud specifically to check natural pause points against the punctuation actually used on the page.',
        'Style guides (like those used by major newspapers) still disagree on some punctuation conventions (e.g. the Oxford comma), showing some rules are convention rather than fixed grammar.',
        'The comma splice is one of the most consistently penalised errors across GCSE, A-Level and university-level writing assessment in English.'
      ],
      examples: [{ q: 'Fix: "I was hungry I ate an apple."', working: 'Comma splice needs a conjunction or full stop', answer: 'I was hungry, so I ate an apple.' }, { q: 'Add the missing apostrophe: "The teachers book."', working: 'Singular possession needs \u2019s', answer: "The teacher's book." }]
    },
    sentencestructure: {
      title: 'Sentence Structure',
      intro: 'Varying sentence types — simple, compound, complex — creates rhythm and shows control of language, a key mark of strong GCSE writing.',
      origin: 'The classification of sentences into simple, compound and complex reflects an idea from formal syntax study (dating substantially to 19th and 20th century grammar scholarship) that sentence structure isn\u2019t just about length or vocabulary, but about how CLAUSES relate to each other — this framework let teachers and examiners assess sentence variety and control as a specific, teachable skill, separate from spelling or word choice.',
      sections: [
        { heading: 'Clauses Are the Real Unit of Sentence Structure', body: 'A clause is simply a group of words containing a subject and a verb — sentence type (simple, compound, complex) is entirely about how many clauses a sentence has and how they relate, not about sentence LENGTH. A long simple sentence with lots of description ("The tall, weathered old man with the kind eyes walked slowly down the quiet street") is still grammatically simple (one clause, one subject-verb pair), while a short complex sentence ("Although tired, she smiled") has two clauses despite being brief.' },
        { heading: 'Why Subordinate Clauses Can\u2019t Stand Alone', body: 'A subordinate (dependent) clause has a subject and verb but expresses an INCOMPLETE thought that depends on a main clause to make full sense — "Although it was raining" sounds like it\u2019s waiting for something, because grammatically it is. This incompleteness is precisely why a subordinate clause punctuated as if it were a full sentence ("Although it was raining.") reads as a sentence fragment, a common and heavily-marked GCSE error.' },
        { heading: 'Deliberate Fragments Are a Genuine Stylistic Tool', body: 'While unintentional fragments are marked as errors, DELIBERATE minor sentences ("Silence. Nothing moved.") are a recognised, examiner-approved stylistic device precisely because breaking the normal rule draws attention and creates dramatic emphasis — the key distinction examiners look for is whether the fragment appears to be a deliberate, controlled choice for effect, or an accidental incomplete sentence.' },
        { heading: 'Sentence Variety Signals Writing Control', body: 'Examiners specifically reward writers who vary sentence length and structure deliberately (a string of short simple sentences to build tension, followed by one long complex sentence to release it) rather than defaulting to one structure throughout — this variety is treated as direct evidence of a writer consciously controlling the reader\u2019s pace and experience, not just an aesthetic preference.' }
      ],
      misconceptions: [
        { myth: 'A "simple sentence" means a short sentence.', reality: 'Simple sentence refers to having ONE clause, regardless of length — a simple sentence can still be long if it has lots of description attached to a single subject-verb pair.' },
        { myth: 'Sentence fragments are always a grammar mistake.', reality: 'Deliberate minor sentences are a recognised stylistic device for emphasis — the key is whether the fragment is a controlled choice or an accident.' },
        { myth: 'More complex sentences (with lots of clauses) automatically means better writing.', reality: 'Examiners specifically reward VARIETY (mixing simple, compound and complex) over defaulting to complexity throughout.' }
      ],
      expertNotes: [
        'GCSE examiners are trained to distinguish deliberate stylistic fragments from accidental ones based on context and apparent control.',
        'English teachers often ask students to read their own writing aloud to "hear" whether sentence variety creates the intended pace and rhythm.',
        'Professional editors flag both extremes — relentless short sentences and relentless long ones — as reducing a piece\u2019s overall readability and impact.'
      ],
      examples: [{ q: 'Combine as a compound sentence: "She studied hard." + "She passed."', working: 'Join with a coordinating conjunction', answer: 'She studied hard, and she passed.' }, { q: 'Turn into a complex sentence: "It was raining. We went for a walk."', working: 'Add a subordinating conjunction', answer: 'Although it was raining, we went for a walk.' }]
    },
    commonerrors: {
      title: 'Common Errors',
      intro: 'A handful of easily-confused word pairs account for a large share of GCSE writing mistakes. Learning these patterns is one of the fastest ways to raise your mark.',
      origin: 'Most of these confusions (their/there/they\u2019re, its/it\u2019s, affect/effect) exist because English spelling doesn\u2019t always track pronunciation — these words became "homophones" (sound-alike words) through centuries of pronunciation shift and spelling standardisation happening somewhat independently, particularly after English spelling was largely fixed by early dictionaries and printing conventions, well before pronunciation had fully settled into its modern form.',
      sections: [
        { heading: 'Why Homophones Cause So Many Errors', body: 'Homophone confusion (their/there/they\u2019re, its/it\u2019s) happens because these words are IDENTICAL when spoken, so the error is invisible in speech and only surfaces in writing — this is why these mistakes are so persistent even among fluent, articulate speakers: the error isn\u2019t about understanding the language, it\u2019s specifically about the arbitrary mapping from sound to written spelling.' },
        { heading: 'The Apostrophe Test for its/it\u2019s and your/you\u2019re', body: 'A reliable, mechanical test exists for the most common of these confusions: if you can expand the word to its two-word form ("it is," "you are," "they are") and the sentence still makes sense, use the apostrophe version (it\u2019s, you\u2019re, they\u2019re); if not, use the possessive form with no apostrophe (its, your, their). This test works because it directly targets what the apostrophe actually represents (a contraction), rather than relying on memorising each word pair separately.' },
        { heading: 'Affect vs Effect: A Grammatical Pattern, Not Arbitrary', body: 'The affect/effect distinction follows a real (if imperfect) grammatical pattern: "affect" is nearly always a VERB (to influence something), while "effect" is nearly always a NOUN (the result of something) — remembering this verb/noun pattern (rather than the words\u2019 meanings alone) resolves the vast majority of real-world cases, including the trickier exception where "effect" can rarely be used as a verb meaning "to bring about" (to effect change).' },
        { heading: 'Countable vs Uncountable Nouns: Fewer vs Less', body: 'The fewer/less distinction is genuinely grammatical, not just stylistic pedantry: "fewer" applies to countable nouns (individually countable items — fewer people, fewer books), while "less" applies to uncountable nouns (measured as an amount, not counted individually — less water, less time). This is precisely why supermarket "10 items or less" signs are grammatically criticised by purists — "items" is countable, so "fewer" is technically correct.' }
      ],
      misconceptions: [
        { myth: 'These are just random spelling rules with no underlying logic.', reality: 'Most follow a real grammatical pattern (verb vs noun, countable vs uncountable, contraction vs possession) that, once learned, resolves the vast majority of cases.' },
        { myth: 'Confusing these words shows someone doesn\u2019t understand English well.', reality: 'Homophone confusion happens because the words sound identical in speech — it\u2019s a spelling-specific issue, not a sign of poor overall language ability.' },
        { myth: '"Less" can correctly describe any small amount, countable or not.', reality: '"Fewer" is grammatically required for countable nouns (fewer people); "less" is for uncountable amounts (less time).' }
      ],
      expertNotes: [
        'Editors use the "expand the contraction" mental test (it\u2019s → it is) as a fast, reliable check rather than relying on memorisation alone.',
        'Style guides explicitly teach affect/effect via the verb/noun pattern rather than definitions, since the pattern transfers to unfamiliar sentences more reliably.',
        'Even professional, highly literate writers make homophone slips under time pressure — proofreading specifically for this error category is standard editing practice.'
      ],
      examples: [{ q: '"___ going to be late" (they are)', working: 'Contraction of "they are"', answer: "They're" }, { q: '"The weather will ___ our plans" (influence)', working: 'Verb meaning "to influence"', answer: 'affect' }, { q: '"She and ___ went to the shop" (I/me)', working: 'Subject of the sentence needs subject pronoun', answer: 'I' }]
    },
    voice: {
      title: 'Active & Passive Voice',
      intro: 'In active voice, the subject performs the action. In passive voice, the subject receives the action. Both are grammatically correct, but each creates a different effect and emphasis.',
      origin: 'The active/passive distinction exists in some form across most of the world\u2019s languages, but English relies on it especially heavily as a deliberate STYLISTIC choice (not just a grammatical necessity) — this is partly because English lost much of the complex verb-ending system ("inflection") that some other languages use to mark who did what to whom, making word order and voice construction carry more of that meaning-making weight instead.', 
      sections: [
        { heading: 'Why Passive Voice Exists At All', body: 'Passive voice exists specifically to let a writer make the RECEIVER of an action the grammatical subject of a sentence, which is useful when the doer is unknown ("the window was broken"), unimportant to the point being made ("the bridge was built in 1889"), or deliberately being de-emphasised ("mistakes were made"). This isn\u2019t a grammatical flaw — it\u2019s a genuine tool for shifting emphasis, which is exactly why scientific writing relies on it heavily (the process matters more than who performed it).' },
        { heading: 'Passive Voice as a Tool for Evasion', body: 'The same feature that makes passive voice useful (hiding the doer) also makes it a well-documented tool for evasion in political and corporate communication — "mistakes were made" deliberately avoids naming who is responsible, compared to the direct accountability of "I made mistakes." Recognising this pattern is a genuine media-literacy and critical-reading skill, not just a grammar point — spotting passive voice in a statement is often the first step in asking "who is this sentence avoiding naming?"' },
        { heading: 'Why Active Voice Is Usually (Not Always) Preferred', body: 'Style guides generally recommend active voice as the default because it\u2019s typically more direct, concise and easier to process — "the dog chased the ball" (4 words to the verb) is more immediate than "the ball was chased by the dog" (5 words, extra auxiliary). But this is a DEFAULT preference, not an absolute rule — passive voice remains the correct, natural choice whenever the action or receiver genuinely matters more than the doer.' },
        { heading: 'Spotting Passive Voice Reliably', body: 'The most reliable test for passive voice is mechanical, not intuitive: look for a form of "to be" (is/was/were/been/being) immediately followed by a past participle (usually an -ed form or an irregular past participle) — "the ball was chased," "mistakes have been made." This test works regardless of whether the sentence names the doer with "by," which is a common exam trap, since passive sentences can and often do omit the doer entirely.' }
      ],
      misconceptions: [
        { myth: 'Passive voice is always grammatically weaker or wrong.', reality: 'Passive voice is a legitimate tool for de-emphasising the doer — it\u2019s a stylistic choice, not an error, though active voice is often clearer by default.' },
        { myth: 'You can only identify passive voice if "by [someone]" is included.', reality: 'Passive sentences frequently omit the doer entirely ("mistakes were made") — the "to be + past participle" structure is the real test, not the presence of "by."' },
        { myth: 'Active and passive voice always mean exactly the same thing, just reordered.', reality: 'They carry different emphasis and can even carry different implications about responsibility — the choice between them is a meaningful writing decision.' }
      ],
      expertNotes: [
        'Media literacy educators specifically teach spotting passive voice in official statements as a tool for identifying deflected accountability.',
        'Style guides for scientific writing often prefer passive voice specifically to keep focus on the method/process rather than the researcher.',
        'Editors flag OVERUSE of passive voice (not passive voice itself) as a common cause of vague, evasive-sounding writing.'
      ],
      examples: [{ q: 'Rewrite in active voice: "The cake was eaten by Tom."', working: 'Make Tom the subject performing the action', answer: 'Tom ate the cake.' }, { q: 'Rewrite in passive voice: "The company launched the product."', working: 'Make "the product" the new subject', answer: 'The product was launched by the company.' }]
    }
  };

  /* ---- REFERENCE LIBRARY ------------------------------------------------------ */
  var FORMULAS = [
    { topic: 'Punctuation', name: 'Possessive apostrophes', formula: "singular: noun + 's  |  plural (ending s): noun + '", when: 'Showing something belongs to a person or thing.', example: "the dog's bone (one dog) / the dogs' bones (many dogs)", tip: 'Never use an apostrophe just to make a plain word plural.' },
    { topic: 'Punctuation', name: 'Comma splice fix', formula: 'full stop | semicolon | comma + conjunction', when: 'Two complete sentences are wrongly joined by just a comma.', example: '"I was tired, so I went home." (comma + conjunction)', tip: 'If you can split into two full sentences, a lone comma between them is a splice.' },
    { topic: 'Punctuation', name: 'Semicolon use', formula: 'independent clause ; independent clause', when: 'Joining two closely related complete sentences without a conjunction.', example: 'The exam was hard; everyone was relieved.', tip: 'Both sides of a semicolon must be able to stand alone as full sentences.' },
    { topic: 'Tenses', name: 'Present perfect', formula: 'has/have + past participle', when: 'An action started in the past that is still relevant now.', example: 'She has studied English for five years.', tip: 'Links the past to the present — often used with "for", "since", "already", "yet".' },
    { topic: 'Tenses', name: 'Past perfect', formula: 'had + past participle', when: 'An action completed before another past action.', example: 'She had left before I arrived.', tip: 'Shows which of two past events happened FIRST.' },
    { topic: 'Tenses', name: 'Future perfect', formula: 'will have + past participle', when: 'An action that will be completed before a specific future time.', example: 'By 2027, she will have graduated.', tip: 'Look for "by [future time]" as a signal phrase.' },
    { topic: 'Voice', name: 'Active \u2192 Passive conversion', formula: 'object + to be (matching tense) + past participle (+ by + subject)', when: 'Converting a sentence to emphasise the action over the doer.', example: '"Tom ate the cake" \u2192 "The cake was eaten by Tom."', tip: 'The tense of "to be" must match the original sentence\u2019s tense.' },
    { topic: 'Sentence Structure', name: 'Simple sentence', formula: 'one independent clause', when: 'A complete thought with just one subject + verb.', example: 'The rain fell.', tip: 'Can stand alone; needs no conjunction.' },
    { topic: 'Sentence Structure', name: 'Compound sentence', formula: 'independent clause + conjunction (and/but/or) + independent clause', when: 'Joining two equally important complete ideas.', example: 'The rain fell, and the streets flooded.', tip: 'Both halves must be able to stand alone as full sentences.' },
    { topic: 'Sentence Structure', name: 'Complex sentence', formula: 'subordinating conjunction + subordinate clause, + main clause', when: 'Showing one idea depends on or is caused by another.', example: 'Although it was raining, we went outside.', tip: 'Common subordinating conjunctions: although, because, since, while, if, when.' },
    { topic: 'Common Errors', name: "their / there / they're", formula: 'their = possession | there = place | they\u2019re = they are', when: 'Choosing the correct homophone.', example: "Their house is over there — they're happy with it.", tip: 'Test "they\u2019re" by expanding it to "they are" — if that sounds right, use they\u2019re.' },
    { topic: 'Common Errors', name: 'affect / effect', formula: 'affect = verb (to influence) | effect = noun (a result)', when: 'Choosing the correct word for cause/result sentences.', example: 'The rain will affect the match; the effect was a delay.', tip: 'Remember: "A" for Action (verb), "E" for End result (noun).' }
  ];

  root.LearningGrammar = {
    generate: generate, generateForLevel: generateForLevel, generateLevelSet: generateLevelSet, generatePlacementSet: generatePlacementSet,
    levelLabel: levelLabel, gradeFromLevel: gradeFromLevel, levelFromScore: levelFromScore, strongestWeakest: strongestWeakest,
    QT_TYPES: QT_TYPES, QT_DIFFICULTIES: QT_DIFFICULTIES, QT_LENGTHS: QT_LENGTHS,
    buildQuickTest: buildQuickTest, generateDailyChallenge: generateDailyChallenge, levelToTier: qtLevelToTier,
    checkAnswer: checkAnswer, LESSONS: LESSONS, FORMULAS: FORMULAS,
    TOPICS: [
      { key: 'partsofspeech', label: 'Parts of Speech', desc: 'Nouns, verbs, adjectives, adverbs & more' },
      { key: 'tenses', label: 'Tenses', desc: 'Past, present, future & perfect forms' },
      { key: 'punctuation', label: 'Punctuation', desc: 'Commas, apostrophes, semicolons & colons' },
      { key: 'sentencestructure', label: 'Sentence Structure', desc: 'Simple, compound & complex sentences' },
      { key: 'commonerrors', label: 'Common Errors', desc: "their/there/they're, affect/effect & more" },
      { key: 'voice', label: 'Active & Passive Voice', desc: 'Spot and convert between voices' }
    ]
  };
})(window);

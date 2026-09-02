/* ============================================================================
   learning-english.js — English Language learning engine for the Learning
   Centre. Pure business logic (no UI): curated vocabulary bank, grammar
   lessons + question generators, reading passages with comprehension
   questions, a placement test, and a 50-level mixed-question ladder.
   Consumed by the DC logic class via window.LearningEnglish.
   ============================================================================ */
(function (root) {
  // Runs once: the <helmet> relocation re-executes every script. See engine-guards.test.mjs.
  if (root.LearningEnglish) return;

  'use strict';

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[ri(0, arr.length - 1)]; }
  function shuffle(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = ri(0, i); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // Rotation-random: cycles every entry of a pool once (fresh shuffled order) before any
  // repeat, instead of sampling a narrow "nearest" slice with replacement every call.
  var _rot = {};
  function rr(key, arr) {
    var st = _rot[key];
    if (!st || st.i >= st.order.length || st.order.length !== arr.length) { st = { order: shuffle(arr.map(function (_, i) { return i; })), i: 0 }; _rot[key] = st; }
    return arr[st.order[st.i++]];
  }

  /* ---- VOCABULARY BANK -------------------------------------------------- */
  var WORDS = [
    { w: 'happy', level: 2, syll: 'HAP-ee', def: 'Feeling or showing pleasure and contentment.', ex: 'She felt happy when she saw her friends.', syn: ['glad', 'pleased', 'joyful'], ant: ['sad', 'unhappy'] },
    { w: 'quick', level: 2, syll: 'KWIK', def: 'Moving or happening fast.', ex: 'He gave a quick answer to the question.', syn: ['fast', 'swift', 'rapid'], ant: ['slow'] },
    { w: 'begin', level: 3, syll: 'bih-GIN', def: 'To start doing something.', ex: 'We will begin the lesson at nine.', syn: ['start', 'commence'], ant: ['end', 'finish'] },
    { w: 'difficult', level: 6, syll: 'DIF-ih-kult', def: 'Needing effort or skill to do or understand.', ex: 'The exam was more difficult than she expected.', syn: ['hard', 'tough', 'challenging'], ant: ['easy', 'simple'] },
    { w: 'enormous', level: 8, syll: 'ih-NOR-mus', def: 'Very large in size or amount.', ex: 'They live in an enormous house by the coast.', syn: ['huge', 'massive', 'gigantic'], ant: ['tiny', 'small'] },
    { w: 'generous', level: 9, syll: 'JEN-er-us', def: 'Willing to give more of something than is necessary.', ex: 'It was generous of him to share his lunch.', syn: ['giving', 'charitable'], ant: ['selfish', 'stingy'] },
    { w: 'reluctant', level: 12, syll: 'rih-LUK-tant', def: 'Unwilling and hesitant to do something.', ex: 'She was reluctant to speak in front of the class.', syn: ['unwilling', 'hesitant'], ant: ['willing', 'eager'] },
    { w: 'ambiguous', level: 14, syll: 'am-BIG-yoo-us', def: 'Open to more than one interpretation; unclear.', ex: 'The instructions were ambiguous, so nobody knew what to do.', syn: ['unclear', 'vague'], ant: ['clear', 'precise'] },
    { w: 'persuade', level: 15, syll: 'per-SWAYD', def: 'To convince someone to do or believe something.', ex: 'The advert tried to persuade people to buy the product.', syn: ['convince', 'induce'], ant: ['dissuade'] },
    { w: 'inevitable', level: 17, syll: 'in-EV-it-uh-bul', def: 'Certain to happen; unavoidable.', ex: 'Change is an inevitable part of growing up.', syn: ['unavoidable', 'certain'], ant: ['avoidable', 'uncertain'] },
    { w: 'diligent', level: 18, syll: 'DIL-ih-jent', def: 'Showing care and effort in your work or duties.', ex: 'She is a diligent student who never misses homework.', syn: ['hard-working', 'conscientious'], ant: ['lazy', 'careless'] },
    { w: 'benevolent', level: 20, syll: 'buh-NEV-uh-lent', def: 'Kind and generous, wishing to do good to others.', ex: 'The benevolent old man donated his savings to the school.', syn: ['kind', 'charitable'], ant: ['cruel', 'malicious'] },
    { w: 'articulate', level: 22, syll: 'ar-TIK-yuh-lut', def: 'Able to express thoughts and ideas clearly and effectively.', ex: 'The candidate gave an articulate answer to a difficult question.', syn: ['eloquent', 'fluent'], ant: ['inarticulate', 'unclear'] },
    { w: 'meticulous', level: 24, syll: 'muh-TIK-yuh-lus', def: 'Showing great attention to detail; very careful and precise.', ex: 'The scientist kept meticulous records of every experiment.', syn: ['precise', 'thorough'], ant: ['careless', 'sloppy'] },
    { w: 'candid', level: 25, syll: 'KAN-did', def: 'Truthful and straightforward; frank.', ex: 'He gave a candid account of what really happened.', syn: ['honest', 'frank'], ant: ['dishonest', 'evasive'] },
    { w: 'resilient', level: 27, syll: 'rih-ZIL-yent', def: 'Able to recover quickly from difficulties; tough.', ex: 'Despite the setback, the team remained resilient.', syn: ['tough', 'adaptable'], ant: ['fragile', 'weak'] },
    { w: 'ambivalent', level: 29, syll: 'am-BIV-uh-lent', def: 'Having mixed feelings or contradictory ideas about something.', ex: 'She felt ambivalent about moving to a new city.', syn: ['uncertain', 'conflicted'], ant: ['certain', 'decisive'] },
    { w: 'pragmatic', level: 31, syll: 'prag-MAT-ik', def: 'Dealing with things sensibly and realistically.', ex: 'The manager took a pragmatic approach to the budget cuts.', syn: ['practical', 'realistic'], ant: ['idealistic', 'impractical'] },
    { w: 'eloquent', level: 33, syll: 'EL-uh-kwent', def: 'Fluent and persuasive in speaking or writing.', ex: 'Her eloquent speech moved the entire audience.', syn: ['articulate', 'persuasive'], ant: ['inarticulate'] },
    { w: 'ubiquitous', level: 35, syll: 'yoo-BIK-wih-tus', def: 'Found or seeming to be everywhere at once.', ex: 'Smartphones have become ubiquitous in modern life.', syn: ['omnipresent', 'widespread'], ant: ['rare', 'scarce'] },
    { w: 'conscientious', level: 37, syll: 'kon-shee-EN-shus', def: 'Wishing to do what is right, especially in one\u2019s work.', ex: 'A conscientious worker double-checks every report.', syn: ['diligent', 'careful'], ant: ['careless', 'negligent'] },
    { w: 'skeptical', level: 38, syll: 'SKEP-tih-kul', def: 'Not easily convinced; having doubts.', ex: 'He remained skeptical of the salesman\u2019s claims.', syn: ['doubtful', 'unconvinced'], ant: ['convinced', 'credulous'] },
    { w: 'succinct', level: 40, syll: 'suk-SINKT', def: 'Expressed clearly and in few words; concise.', ex: 'Her succinct summary covered every key point in one paragraph.', syn: ['concise', 'brief'], ant: ['wordy', 'verbose'] },
    { w: 'vindicate', level: 42, syll: 'VIN-dih-kayt', def: 'To clear someone of blame or suspicion; to justify.', ex: 'New evidence finally vindicated the accused man.', syn: ['justify', 'exonerate'], ant: ['condemn', 'incriminate'] },
    { w: 'ostentatious', level: 44, syll: 'os-ten-TAY-shus', def: 'Showy; designed to impress or attract attention.', ex: 'The mansion\u2019s ostentatious gold gates drew stares from tourists.', syn: ['flashy', 'showy'], ant: ['modest', 'understated'] },
    { w: 'pragmatism', level: 46, syll: 'PRAG-muh-tiz-um', def: 'An approach that deals with problems in a practical way.', ex: 'The government\u2019s pragmatism helped resolve the crisis quickly.', syn: ['practicality'], ant: ['idealism'] },
    { w: 'incontrovertible', level: 48, syll: 'in-kon-truh-VER-tih-bul', def: 'Not able to be denied or disputed; certain.', ex: 'The DNA evidence was incontrovertible proof of his identity.', syn: ['indisputable', 'certain'], ant: ['disputable', 'questionable'] },
    { w: 'perfunctory', level: 50, syll: 'per-FUNK-tuh-ree', def: 'Carried out with minimal effort or reflection.', ex: 'He gave a perfunctory nod and walked away without listening.', syn: ['half-hearted', 'cursory'], ant: ['thorough', 'careful'] },
    { w: 'brave', level: 1, syll: 'BRAYV', def: 'Showing courage; not afraid of danger or pain.', ex: 'It was brave of her to speak up first.', syn: ['courageous', 'bold'], ant: ['cowardly', 'timid'] },
    { w: 'gentle', level: 1, syll: 'JEN-tul', def: 'Mild and kind in manner.', ex: 'He spoke in a gentle voice to calm the child.', syn: ['tender', 'mild'], ant: ['rough', 'harsh'] },
    { w: 'curious', level: 3, syll: 'KYOOR-ee-us', def: 'Eager to know or learn something.', ex: 'The curious child asked question after question.', syn: ['inquisitive', 'interested'], ant: ['indifferent', 'uninterested'] },
    { w: 'honest', level: 3, syll: 'ON-ist', def: 'Truthful and sincere.', ex: 'Please give me an honest opinion of my work.', syn: ['truthful', 'sincere'], ant: ['dishonest', 'deceitful'] },
    { w: 'patient', level: 4, syll: 'PAY-shunt', def: 'Able to wait or accept delay without becoming annoyed.', ex: 'She stayed patient even though the bus was very late.', syn: ['tolerant', 'calm'], ant: ['impatient', 'restless'] },
    { w: 'clumsy', level: 4, syll: 'KLUM-zee', def: 'Awkward in movement; likely to drop or knock things.', ex: 'His clumsy attempt to carry all the plates ended badly.', syn: ['awkward', 'ungainly'], ant: ['graceful', 'agile'] },
    { w: 'cautious', level: 5, syll: 'KAW-shus', def: 'Careful to avoid danger or mistakes.', ex: 'Drivers should be extra cautious in icy weather.', syn: ['careful', 'wary'], ant: ['reckless', 'careless'] },
    { w: 'cheerful', level: 5, syll: 'CHEER-ful', def: 'Noticeably happy and positive.', ex: 'Her cheerful greeting brightened everyone’s morning.', syn: ['happy', 'upbeat'], ant: ['gloomy', 'miserable'] },
    { w: 'stubborn', level: 6, syll: 'STUB-urn', def: 'Refusing to change your mind or your ways.', ex: 'The stubborn goat wouldn’t move from the path.', syn: ['obstinate', 'headstrong'], ant: ['flexible', 'compliant'] },
    { w: 'anxious', level: 7, syll: 'ANK-shus', def: 'Feeling or showing worry or nervousness.', ex: 'She felt anxious before the interview.', syn: ['worried', 'uneasy'], ant: ['calm', 'relaxed'] },
    { w: 'eager', level: 7, syll: 'EE-ger', def: 'Strongly wanting to do or have something.', ex: 'He was eager to start his first day at work.', syn: ['keen', 'enthusiastic'], ant: ['reluctant', 'indifferent'] },
    { w: 'fragile', level: 8, syll: 'FRAJ-ile', def: 'Easily broken or damaged.', ex: 'Handle the fragile glass ornaments with care.', syn: ['delicate', 'brittle'], ant: ['sturdy', 'durable'] },
    { w: 'humble', level: 9, syll: 'HUM-bul', def: 'Not proud or arrogant; modest.', ex: 'Despite his success, he remained humble.', syn: ['modest', 'unassuming'], ant: ['arrogant', 'proud'] },
    { w: 'genuine', level: 10, syll: 'JEN-yoo-in', def: 'Real and authentic, not fake or pretended.', ex: 'She gave a genuine smile of thanks.', syn: ['authentic', 'sincere'], ant: ['fake', 'insincere'] },
    { w: 'reckless', level: 10, syll: 'REK-lis', def: 'Acting without thinking about the consequences or danger.', ex: 'The reckless driver sped through the red light.', syn: ['careless', 'rash'], ant: ['cautious', 'careful'] },
    { w: 'hostile', level: 11, syll: 'HOS-tile', def: 'Unfriendly and antagonistic; opposed.', ex: 'The crowd grew hostile after the referee’s decision.', syn: ['antagonistic', 'unfriendly'], ant: ['friendly', 'welcoming'] },
    { w: 'tedious', level: 11, syll: 'TEE-dee-us', def: 'Too long, slow or dull; tiresome.', ex: 'Filling in the same form twice was tedious.', syn: ['dull', 'monotonous'], ant: ['exciting', 'engaging'] },
    { w: 'optimistic', level: 12, syll: 'op-tim-IS-tik', def: 'Hopeful and confident about the future.', ex: 'She stayed optimistic even after the setback.', syn: ['hopeful', 'positive'], ant: ['pessimistic', 'hopeless'] },
    { w: 'arrogant', level: 13, syll: 'AR-uh-gant', def: 'Having an exaggerated sense of your own importance.', ex: 'His arrogant tone annoyed the whole team.', syn: ['conceited', 'haughty'], ant: ['humble', 'modest'] },
    { w: 'pessimistic', level: 13, syll: 'pes-im-IS-tik', def: 'Tending to expect the worst outcome.', ex: 'He took a pessimistic view of the negotiations.', syn: ['gloomy', 'negative'], ant: ['optimistic', 'hopeful'] },
    { w: 'tentative', level: 14, syll: 'TEN-tuh-tiv', def: 'Not certain or fixed; done cautiously as a trial.', ex: 'They made a tentative plan to meet next week.', syn: ['provisional', 'uncertain'], ant: ['definite', 'certain'] },
    { w: 'versatile', level: 15, syll: 'VUR-suh-tile', def: 'Able to adapt to many different functions or activities.', ex: 'A versatile player who can fill several positions.', syn: ['adaptable', 'flexible'], ant: ['limited', 'inflexible'] },
    { w: 'adamant', level: 16, syll: 'AD-uh-mant', def: 'Refusing to be persuaded or change your mind.', ex: 'She was adamant that she would finish the race.', syn: ['firm', 'unyielding'], ant: ['flexible', 'open-minded'] },
    { w: 'coherent', level: 16, syll: 'koh-HEER-ent', def: 'Logical and clearly connected; easy to follow.', ex: 'He gave a coherent explanation of the accident.', syn: ['logical', 'consistent'], ant: ['confused', 'incoherent'] },
    { w: 'tranquil', level: 17, syll: 'TRANK-wil', def: 'Free from disturbance; calm and peaceful.', ex: 'The lake was tranquil at dawn.', syn: ['calm', 'peaceful'], ant: ['turbulent', 'chaotic'] },
    { w: 'volatile', level: 18, syll: 'VOL-uh-tile', def: 'Liable to change rapidly and unpredictably.', ex: 'The stock market has been volatile this year.', syn: ['unpredictable', 'unstable'], ant: ['stable', 'steady'] },
    { w: 'futile', level: 19, syll: 'FYOO-tile', def: 'Pointless; incapable of producing any useful result.', ex: 'Arguing with him was futile once he’d decided.', syn: ['pointless', 'useless'], ant: ['effective', 'worthwhile'] },
    { w: 'lucrative', level: 19, syll: 'LOO-kruh-tiv', def: 'Producing a great deal of profit.', ex: 'She turned her hobby into a lucrative business.', syn: ['profitable', 'rewarding'], ant: ['unprofitable', 'worthless'] },
    { w: 'impartial', level: 21, syll: 'im-PAR-shul', def: 'Treating all sides equally; not biased.', ex: 'The judge must remain impartial at all times.', syn: ['unbiased', 'fair'], ant: ['biased', 'partial'] },
    { w: 'plausible', level: 21, syll: 'PLAW-zih-bul', def: 'Seeming reasonable or probable.', ex: 'His excuse sounded plausible, so nobody questioned it.', syn: ['credible', 'believable'], ant: ['implausible', 'unlikely'] },
    { w: 'redundant', level: 22, syll: 'rih-DUN-dant', def: 'No longer needed; superfluous.', ex: 'The second warning sign was redundant.', syn: ['superfluous', 'unnecessary'], ant: ['essential', 'necessary'] },
    { w: 'austere', level: 23, syll: 'aw-STEER', def: 'Severe or plain in appearance; without luxury.', ex: 'The monastery had an austere, unfurnished room.', syn: ['stark', 'plain'], ant: ['luxurious', 'ornate'] },
    { w: 'tenacious', level: 23, syll: 'tuh-NAY-shus', def: 'Holding firmly to something; persistent.', ex: 'Her tenacious research eventually uncovered the truth.', syn: ['persistent', 'determined'], ant: ['irresolute', 'weak'] },
    { w: 'pertinent', level: 24, syll: 'PUR-tih-nent', def: 'Relevant or applicable to a particular matter.', ex: 'She asked several pertinent questions after the talk.', syn: ['relevant', 'applicable'], ant: ['irrelevant', 'unrelated'] },
    { w: 'innate', level: 25, syll: 'in-AYT', def: 'Inborn; a natural part of someone’s character.', ex: 'He has an innate talent for music.', syn: ['inborn', 'natural'], ant: ['acquired', 'learned'] },
    { w: 'dubious', level: 26, syll: 'DOO-bee-us', def: 'Doubtful; not certain to be true or of good quality.', ex: 'The company made some dubious claims about its product.', syn: ['doubtful', 'questionable'], ant: ['certain', 'reliable'] },
    { w: 'obscure', level: 27, syll: 'ub-SKYOOR', def: 'Not well known, or not clearly expressed.', ex: 'He referenced an obscure film nobody had seen.', syn: ['unknown', 'unclear'], ant: ['famous', 'clear'] },
    { w: 'proficient', level: 28, syll: 'pruh-FISH-ent', def: 'Competent and skilled at something.', ex: 'She is proficient in three languages.', syn: ['skilled', 'competent'], ant: ['incompetent', 'unskilled'] },
    { w: 'resolute', level: 28, syll: 'REZ-uh-loot', def: 'Determined and unwavering in purpose.', ex: 'He remained resolute despite the criticism.', syn: ['determined', 'steadfast'], ant: ['wavering', 'irresolute'] },
    { w: 'cynical', level: 29, syll: 'SIN-ih-kul', def: 'Believing that people are motivated mainly by self-interest.', ex: 'Years in the industry had made her cynical.', syn: ['distrustful', 'skeptical'], ant: ['trusting', 'idealistic'] },
    { w: 'arbitrary', level: 30, syll: 'AR-bih-trer-ee', def: 'Based on random choice rather than reason or system.', ex: 'The fine seemed completely arbitrary.', syn: ['random', 'unreasoned'], ant: ['reasoned', 'systematic'] },
    { w: 'verbose', level: 30, syll: 'vur-BOHS', def: 'Using more words than needed; wordy.', ex: 'His verbose report could have been half the length.', syn: ['wordy', 'long-winded'], ant: ['succinct', 'concise'] },
    { w: 'capricious', level: 32, syll: 'kuh-PRISH-us', def: 'Given to sudden, unpredictable changes of mood or behaviour.', ex: 'The weather here is famously capricious.', syn: ['unpredictable', 'fickle'], ant: ['consistent', 'steady'] },
    { w: 'superfluous', level: 32, syll: 'soo-PUR-floo-us', def: 'More than is needed or wanted.', ex: 'He cut every superfluous detail from the essay.', syn: ['excessive', 'unnecessary'], ant: ['essential', 'necessary'] },
    { w: 'clandestine', level: 34, syll: 'klan-DES-tin', def: 'Kept secret, especially because it is illicit.', ex: 'They held a clandestine meeting after midnight.', syn: ['secret', 'covert'], ant: ['open', 'public'] },
    { w: 'discern', level: 34, syll: 'dih-SURN', def: 'To perceive or recognise something clearly, often with effort.', ex: 'It was hard to discern the path in the fog.', syn: ['perceive', 'recognise'], ant: ['overlook', 'miss'] },
    { w: 'equivocal', level: 35, syll: 'ih-KWIV-uh-kul', def: 'Open to more than one interpretation; deliberately vague.', ex: 'His equivocal reply left both sides guessing.', syn: ['ambiguous', 'vague'], ant: ['unambiguous', 'clear'] },
    { w: 'inherent', level: 36, syll: 'in-HEER-ent', def: 'Existing as a natural or permanent part of something.', ex: 'There is an inherent risk in any investment.', syn: ['intrinsic', 'built-in'], ant: ['extrinsic', 'acquired'] },
    { w: 'quell', level: 36, syll: 'KWEL', def: 'To put an end to something, usually by force or persuasion.', ex: 'The manager stepped in to quell the argument.', syn: ['suppress', 'subdue'], ant: ['incite', 'provoke'] },
    { w: 'juxtapose', level: 39, syll: 'JUK-stuh-pohz', def: 'To place two things side by side for contrast or comparison.', ex: 'The exhibit juxtaposes old photographs with modern ones.', syn: ['contrast', 'compare'], ant: ['separate', 'isolate'] },
    { w: 'obfuscate', level: 39, syll: 'OB-fuh-skayt', def: 'To deliberately make something unclear or confusing.', ex: 'The report seemed designed to obfuscate the real figures.', syn: ['confuse', 'obscure'], ant: ['clarify', 'illuminate'] },
    { w: 'paradox', level: 41, syll: 'PAR-uh-doks', def: 'A statement that seems contradictory but may express a truth.', ex: 'It’s a paradox that saving money can sometimes cost you more.', syn: ['contradiction', 'anomaly'], ant: ['certainty', 'consistency'] },
    { w: 'sycophant', level: 41, syll: 'SIK-uh-fant', def: 'A person who flatters others to gain advantage.', ex: 'The king surrounded himself with sycophants.', syn: ['flatterer', 'toady'], ant: ['critic', 'straight-talker'] },
    { w: 'cogent', level: 43, syll: 'KOH-jent', def: 'Clear, logical and convincing.', ex: 'She made a cogent argument for the new policy.', syn: ['convincing', 'compelling'], ant: ['unconvincing', 'weak'] },
    { w: 'vicarious', level: 43, syll: 'vy-KAIR-ee-us', def: 'Experienced through the actions or feelings of another person.', ex: 'He got a vicarious thrill watching his daughter perform.', syn: ['indirect', 'secondhand'], ant: ['direct', 'firsthand'] },
    { w: 'abstruse', level: 45, syll: 'ab-STROOS', def: 'Difficult to understand; obscure.', ex: 'The lecture was too abstruse for most first-years.', syn: ['obscure', 'complex'], ant: ['simple', 'clear'] },
    { w: 'ephemeral', level: 45, syll: 'ih-FEM-er-ul', def: 'Lasting for a very short time.', ex: 'Fame on social media can be ephemeral.', syn: ['fleeting', 'transient'], ant: ['permanent', 'lasting'] },
    { w: 'iconoclast', level: 47, syll: 'eye-KON-uh-klast', def: 'A person who attacks or criticises established beliefs.', ex: 'The artist was seen as an iconoclast for rejecting tradition.', syn: ['rebel', 'dissenter'], ant: ['traditionalist', 'conformist'] },
    { w: 'sanguine', level: 47, syll: 'SANG-gwin', def: 'Optimistic or positive, especially in a difficult situation.', ex: 'Despite the delays, she remained sanguine about the project.', syn: ['optimistic', 'hopeful'], ant: ['pessimistic', 'gloomy'] },
    { w: 'quintessential', level: 49, syll: 'kwin-tuh-SEN-shul', def: 'Representing the most perfect or typical example of something.', ex: 'The cottage was the quintessential English countryside home.', syn: ['archetypal', 'classic'], ant: ['atypical', 'unrepresentative'] },
    { w: 'inexorable', level: 49, syll: 'in-EK-sor-uh-bul', def: 'Impossible to stop or prevent.', ex: 'The inexorable rise in prices worried every household.', syn: ['unstoppable', 'relentless'], ant: ['avoidable', 'stoppable'] }
  ];

  function wordsNear(level) {
    return WORDS.slice().sort(function (a, b) { return Math.abs(a.level - level) - Math.abs(b.level - level); });
  }
  function wordForLevel(level) { var near = wordsNear(level); return rr('vocab', near); }

  function generateVocabQuestion(level) {
    var word = wordForLevel(level || 1);
    var kind = pick(['def', 'syn', 'ant']);
    var others = shuffle(WORDS.filter(function (x) { return x.w !== word.w; })).slice(0, 3);
    if (kind === 'syn' && word.syn && word.syn.length) {
      var correct = pick(word.syn);
      var opts = shuffle([correct].concat(others.map(function (o) { return o.w; })));
      return { type: 'mc', topic: 'Vocabulary', prompt: 'Which word is a synonym (means the same) as "' + word.w + '"?', options: opts, answer: correct, method: '"' + word.w + '" means: ' + word.def };
    }
    if (kind === 'ant' && word.ant && word.ant.length) {
      var correctA = pick(word.ant);
      var optsA = shuffle([correctA].concat(others.map(function (o) { return o.w; })));
      return { type: 'mc', topic: 'Vocabulary', prompt: 'Which word is an antonym (means the opposite) of "' + word.w + '"?', options: optsA, answer: correctA, method: '"' + word.w + '" means: ' + word.def };
    }
    var opts2 = shuffle([word.w].concat(others.map(function (o) { return o.w; })));
    return { type: 'mc', topic: 'Vocabulary', prompt: 'Which word means: "' + word.def + '"?', options: opts2, answer: word.w, method: 'Example: ' + word.ex };
  }

  /* ---- GRAMMAR ----------------------------------------------------------- */
  var GRAMMAR_LESSONS = {
    apostrophes: {
      title: 'Apostrophes',
      intro: 'Apostrophes show possession (belonging) or mark missing letters in a contraction. Getting them right is one of the most common GCSE marking points.',
      origin: 'The apostrophe entered English from French printers in the 16th century, originally just to mark omitted letters (much like today\u2019s contractions). Its use for possession developed later and more haphazardly — it\u2019s widely believed to have evolved as a shorthand for an older possessive construction using "his" (e.g. "the king his crown" contracting toward "the king\u2019s crown"), which is part of why English possessive apostrophe rules can feel like a historical accident rather than a clean, designed system.',
      sections: [
        { heading: 'One Symbol, Two Unrelated Jobs', body: 'The apostrophe does two historically separate jobs that happen to share a symbol: marking a contraction (don\u2019t = do not) and marking possession (the dog\u2019s bone). Keeping these mentally separate helps avoid the single most common apostrophe error — using one to make a plain word plural, which isn\u2019t either of the apostrophe\u2019s two legitimate functions at all.' },
        { heading: 'Why Plural Possessives Look Different', body: 'For a plural noun that already ends in s (dogs, students), adding a full \u2019s would create an awkward double-s sound, so English convention instead adds just the apostrophe after the existing s (dogs\u2019, students\u2019) — this is why "the students\u2019 results" (many students) looks different from "the student\u2019s results" (one student), despite both being grammatically valid possessives.' },
        { heading: 'The Reliable Contraction Test', body: 'For its/it\u2019s, your/you\u2019re and similar pairs, a fast, mechanical test resolves almost every case: mentally expand the apostrophe version to its two full words (it is, you are) — if the sentence still makes sense, the apostrophe version is correct; if not, use the possessive, no-apostrophe form.' }
      ],
      misconceptions: [
        { myth: 'Adding an apostrophe is how you make a word plural.', reality: 'Apostrophes never form plurals — "bananas for sale," never "banana\u2019s for sale."' },
        { myth: 'Its and it\u2019s can be used interchangeably.', reality: '"It\u2019s" only ever means "it is" or "it has"; "its" is the possessive — they are never interchangeable.' }
      ],
      expertNotes: [
        'Editors specifically flag apostrophe-for-plural errors as one of the most visible, credibility-damaging mistakes in professional writing.',
        'The it\u2019s/its distinction is tested more than almost any other single punctuation point at GCSE, precisely because the exception (its has NO apostrophe despite being possessive) breaks the usual pattern.'
      ],
      examples: [
        { q: 'The teacher___ book (belongs to one teacher)', working: 'Singular possession — add \u2019s', answer: "teacher's" },
        { q: 'The students___ results (belongs to many students)', working: 'Plural already ending in s — add just an apostrophe', answer: "students'" },
        { q: 'Its / It\u2019s raining today', working: '"It is" raining — needs the apostrophe', answer: "It's" }
      ]
    },
    tenses: {
      title: 'Verb Tenses',
      intro: 'Tenses show when an action happens: past, present, or future. Mixing tenses within a paragraph is a common mistake that costs marks.',
      origin: 'English tenses combine TIME with ASPECT (simple/continuous/perfect) as two separate, combinable dimensions — an inheritance from English\u2019s Germanic roots layered with grammar-teaching conventions borrowed from Latin centuries later, which is why English ends up with far more tense forms than languages with a simpler time-only system.',
      sections: [
        { heading: 'Time × Aspect, Not 12 Separate Forms', body: 'Rather than memorising 12 unconnected tenses, it helps to see each as TIME (past/present/future) combined with ASPECT (simple = a fact; continuous = ongoing, using -ing; perfect = linking to another point in time, using have/has/had). Once this grid clicks, perfect and continuous forms behave predictably across all three time periods.' },
        { heading: 'Why the Perfect Aspect Exists', body: 'Present perfect ("she has lived here for years") specifically links a past action to NOW — still true today — while past simple ("she lived here") describes a fully finished, disconnected past. This distinction, not just "which sounds more natural," is what determines the correct choice in most exam questions.' },
        { heading: 'Consistency Signals Control', body: 'Prose is conventionally written entirely in past OR present tense; switching without a clear reason (a flashback, a direct quotation) is a frequently penalised sign of inexperienced writing — examiners specifically look for unmotivated tense shifts as a control issue, not just a technical slip.' }
      ],
      misconceptions: [
        { myth: 'English only really has three tenses: past, present, future.', reality: 'English combines 3 times with up to 4 aspects, producing the 12 commonly-taught tense forms.' },
        { myth: 'Present perfect and past simple mean basically the same thing.', reality: 'Present perfect links a past action to now (still relevant); past simple describes a fully finished, disconnected action.' }
      ],
      expertNotes: [
        'ESL teachers explicitly teach the time × aspect grid, since understanding the underlying pattern transfers far better than memorising 12 isolated forms.',
        'Copyeditors treat unmotivated tense-shifting in narrative prose as a top-tier line-edit issue.'
      ],
      examples: [
        { q: 'Yesterday, she (walk) to the shop.', working: 'Finished action in the past — past simple', answer: 'walked' },
        { q: 'Tomorrow, we (visit) the museum.', working: 'Action not yet happened — future simple', answer: 'will visit' },
        { q: 'He (study) English for three years now.', working: 'Started in the past, continues now — present perfect', answer: 'has studied' }
      ]
    },
    activepassive: {
      title: 'Active vs Passive Voice',
      intro: 'In the active voice, the subject does the action. In the passive voice, the subject receives the action. Both are correct, but each creates a different effect.',
      origin: 'English relies on the active/passive distinction unusually heavily as a deliberate stylistic choice, partly because English lost much of the verb-ending system some other languages use to mark "who did what to whom," leaving word order and voice construction to carry more of that meaning-making work instead.',
      sections: [
        { heading: 'Why Passive Voice Exists', body: 'Passive voice lets a writer make the RECEIVER of an action the grammatical subject — useful when the doer is unknown ("the window was broken"), unimportant ("the bridge was built in 1889"), or deliberately de-emphasised. This is a genuine tool, not a flaw, which is why scientific writing relies on it heavily (the process matters more than who performed it).' },
        { heading: 'Passive Voice as Evasion', body: 'The same feature that makes passive voice useful also makes it a documented tool for evasion — "mistakes were made" deliberately avoids naming who is responsible, unlike the direct accountability of "I made mistakes." Spotting passive voice in a statement is a genuine critical-reading skill, often the first step in asking who a sentence is avoiding naming.' },
        { heading: 'The Reliable Spotting Test', body: 'Look for a form of "to be" (is/was/were/been/being) followed by a past participle — this test works even when the doer is omitted entirely (as in "mistakes were made"), which is a common exam trap since passive sentences don\u2019t require a "by [someone]" to be genuinely passive.' }
      ],
      misconceptions: [
        { myth: 'Passive voice is always grammatically weaker or wrong.', reality: 'It\u2019s a legitimate stylistic choice for de-emphasising the doer, not an error — active voice is just the usual default.' },
        { myth: 'You can only spot passive voice if "by [someone]" is included.', reality: 'Passive sentences often omit the doer entirely — the "to be + past participle" structure is the real test.' }
      ],
      expertNotes: [
        'Media literacy educators teach spotting passive voice in official statements as a tool for identifying deflected accountability.',
        'Style guides for scientific writing often prefer passive voice specifically to keep focus on the process, not the researcher.'
      ],
      examples: [
        { q: '"The cake was eaten by Tom." — rewrite in active voice', working: 'Make Tom the subject doing the action', answer: 'Tom ate the cake.' },
        { q: '"The company launched the product." — rewrite in passive voice', working: 'Make "the product" the subject', answer: 'The product was launched by the company.' }
      ]
    },
    punctuation: {
      title: 'Commas & Punctuation',
      intro: 'Commas separate ideas and make sentences easier to read. Misusing them is one of the most frequent GCSE writing errors.',
      origin: 'Punctuation originally guided the VOICE (pause length for reading aloud) rather than encoding grammatical logic — punctuation was only standardised after the printing press (1440s) made consistent, reproducible marks commercially necessary across many printed copies of the same text.',
      sections: [
        { heading: 'Why the Comma Splice Is Specifically Wrong', body: 'A comma splice ("I was hungry, I ate an apple") fails because a comma alone is too weak a connector for two independent clauses (complete sentences) — English requires a full stop, semicolon, or comma+conjunction instead. This is a precise, testable rule, not a style preference, which is why it\u2019s consistently and heavily penalised.' },
        { heading: 'Reading Aloud Still Works as an Intuitive Check', body: 'Because punctuation\u2019s original job was marking pause length for spoken delivery, reading a sentence aloud and noticing natural pause points remains a genuinely useful intuitive check for comma placement, even though modern rules are framed grammatically.' },
        { heading: 'Semicolons and Colons Do Different Jobs', body: 'A semicolon joins two independent, closely-related clauses without a conjunction — both sides must stand alone as full sentences. A colon introduces something that explains, lists, or expands on what came before, and what follows doesn\u2019t need to be a complete sentence — mixing these two up is a frequently tested higher-grade distinction.' }
      ],
      misconceptions: [
        { myth: 'Commas and semicolons are basically interchangeable for joining sentences.', reality: 'A comma alone cannot join two complete sentences (a comma splice) — only a semicolon, full stop, or comma+conjunction can.' },
        { myth: 'A colon must be followed by a complete list or full sentence.', reality: 'What follows a colon just needs to explain or expand on what came before.' }
      ],
      expertNotes: [
        'Professional editors read sentences aloud specifically to check natural pause points against the punctuation used on the page.',
        'The comma splice is one of the most consistently penalised errors across GCSE, A-Level and university writing assessment.'
      ],
      examples: [
        { q: '"I was hungry I ate an apple." — fix the comma splice', working: 'Join with a conjunction or split into two sentences', answer: 'I was hungry, so I ate an apple.' },
        { q: 'Add the missing comma: "After the long journey we finally arrived."', working: 'Comma after the introductory phrase', answer: 'After the long journey, we finally arrived.' }
      ]
    },
    sentencetypes: {
      title: 'Sentence Structure',
      intro: 'Varying your sentence types (simple, compound, complex) creates rhythm and shows control of language — a key GCSE writing skill.',
      origin: 'Classifying sentences by CLAUSE relationships (rather than length or vocabulary) reflects 19th-20th century formal syntax scholarship, which let examiners assess sentence variety and control as a specific, teachable skill separate from spelling or word choice.',
      sections: [
        { heading: 'Clauses, Not Length, Define Sentence Type', body: 'Sentence type is about how many clauses a sentence has and how they relate, not about LENGTH — a long, richly-described simple sentence is still grammatically simple (one clause), while a short complex sentence ("Although tired, she smiled") has two clauses despite its brevity.' },
        { heading: 'Why Subordinate Clauses Feel Incomplete', body: 'A subordinate clause has a subject and verb but expresses an incomplete thought dependent on a main clause — "Although it was raining" sounds like it\u2019s waiting for something, because grammatically it is, which is exactly why punctuating it alone as a full sentence reads as a fragment.' },
        { heading: 'Sentence Variety Is Rewarded Deliberately', body: 'Examiners specifically reward mixing sentence lengths and structures on purpose (short sentences to build tension, then one long complex sentence to release it) over defaulting to one structure throughout — this variety is treated as direct evidence of a writer controlling the reader\u2019s pace.' }
      ],
      misconceptions: [
        { myth: 'A "simple sentence" means a short sentence.', reality: 'Simple sentence means ONE clause, regardless of length — it can still be long with plenty of description.' },
        { myth: 'More complex sentences always means better writing.', reality: 'Examiners reward VARIETY (mixing simple, compound and complex), not defaulting to complexity throughout.' }
      ],
      expertNotes: [
        'GCSE examiners are trained to distinguish deliberate stylistic fragments from accidental ones based on apparent control.',
        'English teachers often have students read their own writing aloud to "hear" whether sentence variety creates the intended pace.'
      ],
      examples: [
        { q: 'Combine as a compound sentence: "She studied hard." + "She passed the exam."', working: 'Join with "and" or "so"', answer: 'She studied hard, and she passed the exam.' },
        { q: 'Turn into a complex sentence: "It was raining. We went for a walk."', working: 'Add a subordinate conjunction', answer: 'Although it was raining, we went for a walk.' }
      ]
    },
    subjectverb: {
      title: 'Subject-Verb Agreement',
      intro: 'The verb must match the subject in number — singular subjects take singular verbs, plural subjects take plural verbs.',
      origin: 'Subject-verb agreement is a residue of a much richer verb-conjugation system in Old English (and still visible in many other languages) that marked person and number far more extensively — Modern English kept only a small trace of this (mainly the -s ending on third-person singular verbs), which is exactly why the rule can feel like an arbitrary, easily-forgotten add-on rather than a deeply integrated feature.',
      sections: [
        { heading: 'The Real Subject Can Hide Behind a Phrase', body: 'A prepositional phrase between subject and verb ("The list OF ITEMS is long") often tricks writers into matching the verb to the nearest noun (items) rather than the true subject (list) — the fix is mentally deleting the phrase between commas or prepositions to expose the real subject before choosing the verb.' },
        { heading: 'Collective Nouns Follow a British/American Split', body: 'Collective nouns like "team" or "family" take a singular verb in standard British English ("the team IS winning"), treating the group as one unit, while American English more often uses a singular verb too but sometimes allows plural when emphasising the individuals within the group — worth knowing which convention a specific exam board or style guide expects.' },
        { heading: '"Neither," "Either" and Similar Words Are Singular by Convention', body: '"Neither of the answers WAS correct" uses a singular verb because "neither" (and "either," "each," "everyone") is grammatically treated as singular, even though it refers to multiple items — a specific, testable exception that trips up many otherwise-careful writers.' }
      ],
      misconceptions: [
        { myth: 'The verb should always match the noun closest to it.', reality: 'The verb must match the TRUE subject, even if another noun (inside a phrase) sits closer to the verb.' },
        { myth: '"Neither," "either," and "each" are treated as plural since they refer to more than one thing.', reality: 'They are grammatically singular by convention, taking a singular verb ("neither was," not "neither were").' }
      ],
      expertNotes: [
        'Copyeditors specifically check the true subject of long sentences with intervening phrases, since this is one of the most common silent agreement errors.',
        'Style guides explicitly list "neither/either/each" as singular exceptions precisely because writers so often default to a plural verb by intuition.'
      ],
      examples: [
        { q: 'The box of chocolates (is/are) on the table.', working: 'Subject is "box" (singular), not "chocolates"', answer: 'is' },
        { q: 'Neither of the answers (was/were) correct.', working: '"Neither" is treated as singular', answer: 'was' }
      ]
    }
  };
  var GRAMMAR_KEYS = Object.keys(GRAMMAR_LESSONS);

  function generateGrammarQuestion(topicKey) {
    var key = topicKey || pick(GRAMMAR_KEYS);
    var lesson = GRAMMAR_LESSONS[key];
    var ex = rr('gram_' + key, lesson.examples);
    return { type: 'text', topic: lesson.title, topicKey: key, prompt: ex.q, answer: ex.answer, method: ex.working };
  }

  /* ---- READING --------------------------------------------------------------
     Expanded to genuine GCSE English Language shape: a spread of fiction and
     non-fiction extracts (narrative, descriptive, persuasive speech, letter,
     dialogue, article) tagged by level, each carrying a mix of question types
     across the real GCSE reading skills \u2014 not just literal retrieval:
       retrieval   \u2014 AO1, find/name something stated directly
       inference   \u2014 AO1, work out something implied but not stated
       language    \u2014 AO2, identify a technique (metaphor, rhetorical question,
                     tricolon, emotive language, pathetic fallacy...) and its
                     effect on the reader \u2014 the single most-tested GCSE skill
       structure   \u2014 AO2, how the writer organises the whole text for effect
       viewpoint   \u2014 AO4, evaluate the writer's perspective/tone
       compare     \u2014 AO3, only on the two paired top-level texts (45/47),
                     genuinely testing across two extracts like Paper 2 Q4
     ---------------------------------------------------------------------- */
  var PASSAGES = [
    {
      level: 3,
      title: 'The Lost Kitten',
      text: 'Maya heard a small cry coming from behind the old shed. She walked slowly and found a tiny grey kitten shivering in the rain. Maya picked it up gently and carried it home, wrapping it in a warm towel. Her mother smiled and said they could keep it if nobody claimed it.',
      questions: [
        { q: 'Where did Maya find the kitten?', a: 'behind the shed', keywords: ['shed', 'behind'] },
        { q: 'What was the weather like?', a: 'it was raining', keywords: ['rain'] },
        { q: 'What did Maya wrap the kitten in?', a: 'a warm towel', keywords: ['towel'] }
      ]
    },
    {
      level: 8,
      title: 'The Old Oak Tree',
      text: 'Every autumn, Sam climbed the old oak tree at the bottom of the garden, even though his mother told him it was too tall and too old to be safe. The branches creaked under his weight, but he always found the same wide branch near the top, where he could see over the neighbours\u2019 roofs all the way to the hills. This year, when he reached for the branch, it snapped clean away in his hand.',
      questions: [
        { q: 'What did Sam\u2019s mother think about the tree?', a: 'that it was too tall and too old to be safe', keywords: ['too tall', 'too old', 'unsafe', 'not safe'] },
        { q: 'What could Sam see from the top branch?', a: 'over the neighbours\u2019 roofs to the hills', keywords: ['roofs', 'hills'] },
        { q: 'Using this line \u2014 "it snapped clean away in his hand" \u2014 what do you think happens next? Explain your inference.', a: 'the branch breaking suggests Sam is about to fall', keywords: ['fall', 'falling', 'break', 'broke', 'danger'] }
      ]
    },
    {
      level: 12,
      title: 'The Journey of a Paper Cup',
      text: 'Every year, billions of disposable coffee cups are used once and thrown away. Most people assume paper cups are simple to recycle, but the inside of almost every disposable cup is lined with a thin layer of plastic to stop the liquid soaking through. This lining means the cup cannot go through a standard paper recycling process at all, and most end up in landfill instead \u2014 a detail that surprises most people who use one every morning.',
      questions: [
        { q: 'Why can most disposable coffee cups not be recycled normally, according to the passage?', a: 'they have a thin plastic lining inside', keywords: ['plastic', 'lining', 'lined'] },
        { q: 'What is the effect of the writer ending the passage with "a detail that surprises most people who use one every morning"?', a: 'it highlights how widespread and unnoticed the problem is, making the reader reflect on their own habits', keywords: ['surprise', 'unaware', 'reflect', 'everyday', 'habit'] },
        { q: 'What is the purpose of this passage?', a: 'to inform the reader and raise awareness of a hidden problem', keywords: ['inform', 'aware', 'educate'] }
      ]
    },
    {
      level: 15,
      title: 'The Power of Renewable Energy',
      text: 'Renewable energy sources, such as wind and solar power, are becoming increasingly important as countries try to reduce their reliance on fossil fuels. Unlike coal or oil, these sources do not run out and produce far fewer harmful emissions. However, critics argue that renewable infrastructure can be expensive to build and that energy storage remains a significant challenge.',
      questions: [
        { q: 'Name two examples of renewable energy given in the passage.', a: 'wind and solar', keywords: ['wind', 'solar'] },
        { q: 'According to critics, what is one drawback of renewable energy?', a: 'expensive to build / storage is a challenge', keywords: ['expensive', 'storage', 'challenge'] },
        { q: 'How does the writer show balance in this passage? Refer to specific words.', a: 'the writer presents both sides using "however" to introduce the opposing, critical view after the positive case', keywords: ['however', 'both', 'balance', 'critic'] }
      ]
    },
    {
      level: 18,
      title: 'The Abandoned Fairground',
      text: 'The Ferris wheel stood motionless against the bruised evening sky, its metal frame groaning softly whenever the wind passed through. Weeds had claimed the ticket booth, curling through the broken glass like fingers reaching for something they had lost. Somewhere in the distance, a loose sign clattered against its post, over and over, as though the fairground itself was trying to speak.',
      questions: [
        { q: 'Identify one example of personification in this passage and explain its effect.', a: 'the weeds are described "like fingers reaching" and the fairground is described as "trying to speak" \u2014 this makes the abandoned place feel alive and unsettling', keywords: ['personif', 'alive', 'fingers', 'speak', 'human'] },
        { q: 'What effect does the phrase "bruised evening sky" create?', a: 'it uses colour imagery to create a dark, damaged, unsettling mood before anything else in the scene is described', keywords: ['mood', 'dark', 'colour', 'unsettl', 'atmosphere'] },
        { q: 'How does the writer use sound in this passage to build atmosphere?', a: 'the groaning wheel and the clattering sign create an eerie, repetitive soundscape that makes the setting feel haunted', keywords: ['sound', 'groan', 'clatter', 'eerie', 'repet'] }
      ]
    },
    {
      level: 22,
      title: 'A Speech on Climate Action',
      text: 'We have been told, again and again, that it is someone else\u2019s problem \u2014 a problem for governments, for corporations, for the next generation. But ask yourselves: if not us, then who? If not now, then when? Every ton of carbon we fail to prevent today becomes a ton our children must somehow undo tomorrow. We do not need more warnings. We need action, and we need it now.',
      questions: [
        { q: 'Identify the rhetorical question used in this speech and explain its effect on the audience.', a: '"if not us, then who?" (or "if not now, then when?") \u2014 it challenges the audience directly and makes them feel personally responsible', keywords: ['rhetorical', 'question', 'challenge', 'responsib', 'direct'] },
        { q: 'The final two sentences are short and direct. What effect does this create?', a: 'the short, blunt sentences create urgency and a forceful, memorable call to action', keywords: ['urgen', 'short', 'forceful', 'impact', 'punchy'] },
        { q: 'How does the speaker use repetition in this passage? Give an example.', a: 'repeating structures like "if not us, then who? If not now, then when?" builds rhythm and drives the argument home', keywords: ['repeat', 'rhythm', 'structure', 'pattern'] }
      ]
    },
    {
      level: 25,
      title: 'The Argument',
      text: '"You said you\u2019d be here at six." Her voice was flat, controlled \u2014 the kind of calm that came only after real anger had already burned through. Daniel opened his mouth to explain, then closed it again. There was nothing he could say that would make the last two hours disappear. He set his bag down slowly, as if the silence in the room might shatter if he moved too fast.',
      questions: [
        { q: 'What can the reader infer about the relationship between the two characters from this extract?', a: 'there is tension and unresolved conflict \u2014 she is controlling her anger and he feels guilty and unable to defend himself', keywords: ['tension', 'anger', 'guilt', 'conflict'] },
        { q: 'Explain the effect of the simile "as if the silence in the room might shatter if he moved too fast."', a: 'comparing the silence to something fragile like glass shows how tense and delicate the atmosphere is', keywords: ['simile', 'fragile', 'glass', 'tense', 'delicate'] },
        { q: 'How does the writer use structure in this short extract to build tension?', a: 'starting mid-argument with dialogue, then slowing down into Daniel\u2019s internal hesitation, mirrors his reluctance and stretches out the tense moment', keywords: ['structure', 'dialogue', 'slow', 'pace', 'hesitat'] }
      ]
    },
    {
      level: 28,
      title: 'On the Nature of Ambition',
      text: 'Ambition is often portrayed as an unambiguous virtue, yet history is littered with examples of its corrosive potential. The same drive that propels an individual toward remarkable achievement can, left unchecked, erode their relationships and integrity. It is not ambition itself that determines its moral value, but rather the means by which it is pursued and the ends to which it is directed.',
      questions: [
        { q: 'What does the writer suggest determines whether ambition is good or bad?', a: 'the means and ends of how it is pursued', keywords: ['means', 'ends', 'pursued'] },
        { q: 'Explain the effect of the word choice in "history is littered with examples" and "corrosive potential."', a: '"littered" suggests something messy and widespread, while "corrosive" compares ambition to a substance that eats away at something \u2014 together they present ambition\u2019s dangers as extensive and destructive', keywords: ['littered', 'corrosive', 'destruct', 'widespread', 'metaphor'] },
        { q: 'What is the effect of the sentence structure in the final sentence, "It is not ambition itself that determines its moral value, but rather the means by which it is pursued and the ends to which it is directed"?', a: 'the "not X, but Y" construction directly corrects a common assumption, giving the writer\u2019s own conclusion extra weight and clarity as the passage\u2019s final word', keywords: ['not', 'but', 'correct', 'contrast', 'conclusion', 'emphas'] }
      ]
    },
    {
      level: 30,
      title: 'An Open Letter to Young People',
      text: 'I will not pretend the world I am leaving you is perfect \u2014 it is not, and pretending otherwise would insult your intelligence. But I have also watched your generation organise, question, and demand better with a clarity mine rarely managed at your age. My hope is not that you inherit a finished world. My hope is that you inherit the will to keep building one.',
      questions: [
        { q: 'What tone does the writer adopt towards the young people they are addressing?', a: 'honest, respectful and hopeful \u2014 they admit the world\u2019s flaws rather than being patronising', keywords: ['honest', 'respect', 'hope', 'sincere'] },
        { q: 'Explain the effect of the repeated structure "My hope is not... My hope is..."', a: 'the repetition and contrast emphasises exactly what the writer values \u2014 not perfection, but the ability to keep improving things', keywords: ['repeat', 'contrast', 'emphas', 'structure'] },
        { q: 'Why might the writer choose the letter form to communicate this message?', a: 'a letter feels personal and direct, as though speaking one-to-one to the reader, which suits sincere, hopeful advice', keywords: ['personal', 'direct', 'intimate', 'sincer'] }
      ]
    },
    {
      level: 35,
      title: 'The Lighthouse Keeper\u2019s Diary',
      text: 'The light has not failed in thirty years, and I do not intend for it to fail on my watch. Tonight the sea is a black, restless thing, throwing itself against the rocks as though it resents the beam that keeps ships from its jaws. I climb the spiral stairs by memory now, my hand finding the same worn groove in the rail that a hundred keepers before me must have found. I wonder, sometimes, if the light needs me at all \u2014 or if I have simply become another part of its machinery.',
      questions: [
        { q: 'What does the extended metaphor of the sea "throwing itself against the rocks" and having "jaws" suggest?', a: 'it presents the sea as a dangerous, almost predatory living creature, emphasising the constant threat it poses to ships', keywords: ['metaphor', 'predator', 'danger', 'threat', 'personif'] },
        { q: 'What does the final line suggest about the narrator\u2019s sense of identity?', a: 'he questions whether he has any individual purpose left, or has become merged with the mechanical routine of the lighthouse \u2014 suggesting isolation and a loss of self', keywords: ['identity', 'isolat', 'lose', 'purpose', 'machine'] },
        { q: 'Explain how the writer uses the image of "the same worn groove in the rail" to develop a wider idea in the extract.', a: 'it symbolises tradition and repetition, connecting the narrator to generations of keepers before him and reinforcing the idea of duty passed down through time', keywords: ['symbol', 'tradition', 'repetition', 'duty', 'generation'] }
      ]
    },
    {
      level: 38,
      title: 'Are We Losing the Art of Conversation?',
      text: 'The article opens with a familiar scene: a family seated at dinner, four faces lit not by candlelight but by phone screens. It is tempting to declare this the death of conversation. Yet halfway through researching this piece, I found evidence that complicates that neat narrative \u2014 young people report deeper, more honest conversations happening over text than many ever managed face-to-face. Perhaps we are not losing the art of conversation at all. Perhaps we are simply relearning its shape.',
      questions: [
        { q: 'How does the writer structure the opening of this passage to engage the reader?', a: 'opening with a relatable, visual scene (the family at dinner) draws the reader in before the writer introduces a more complex argument', keywords: ['structure', 'open', 'scene', 'relat', 'engage'] },
        { q: 'Identify the shift in the writer\u2019s argument partway through the passage, and explain how the writer signals it.', a: 'the writer signals a change of direction with "Yet" and "complicates that neat narrative", moving from the expected, pessimistic view to a more balanced, surprising one', keywords: ['shift', 'yet', 'balance', 'surpris', 'complicat'] },
        { q: 'What is the effect of ending the passage with the short sentence "Perhaps we are simply relearning its shape"?', a: 'it leaves the reader with a hopeful, thought-provoking final idea rather than a firm conclusion, encouraging reflection', keywords: ['hopeful', 'thought-provok', 'reflect', 'end', 'concluding'] }
      ]
    },
    {
      level: 45,
      title: 'The Ethics of Artificial Intelligence',
      text: 'As artificial intelligence systems become further embedded in decision-making processes \u2014 from loan approvals to medical diagnoses \u2014 questions of accountability grow increasingly urgent. Proponents contend that algorithmic decisions, stripped of human bias, offer a fairer alternative to subjective human judgement. Detractors counter that these systems merely launder existing societal biases through a veneer of mathematical objectivity, rendering discrimination harder to detect and challenge.',
      questions: [
        { q: 'What do proponents of AI decision-making argue?', a: 'it removes human bias and is fairer', keywords: ['bias', 'fair'] },
        { q: 'What is the detractors\u2019 main criticism?', a: 'AI can hide existing bias behind mathematical objectivity', keywords: ['bias', 'objectivity', 'hide', 'launder'] },
        { q: 'Explain the effect of the metaphor "launder existing societal biases through a veneer of mathematical objectivity."', a: 'comparing bias to something being "laundered" suggests it is being deliberately disguised as legitimate, while "veneer" suggests the fairness is only a thin, false surface \u2014 together this makes AI objectivity sound deceptive', keywords: ['metaphor', 'launder', 'veneer', 'disguis', 'deceptive', 'surface'] }
      ]
    },
    {
      level: 47,
      title: 'In Defence of Distraction',
      text: 'Critics of modern technology speak of "distraction" as though focus were our natural state, corrupted only by the smartphone. History disagrees. Every generation has feared its own tools \u2014 the novel was once blamed for rotting young minds, the television for the death of the family. What we call distraction today may simply be attention finding new shapes to move in. The question is not whether we are distracted, but whether we are asking the right question at all.',
      questions: [
        { q: 'What is the writer\u2019s main argument in this passage?', a: 'that fears about technology and distraction are not new, and may be based on a flawed assumption rather than a real decline in focus', keywords: ['not new', 'flawed', 'assumption', 'history', 'repeat'] },
        { q: 'Explain the effect of the examples "the novel" and "the television" in this passage.', a: 'they show that every new technology has previously been blamed in the same way, undermining the idea that smartphones are uniquely damaging', keywords: ['example', 'history', 'previous', 'undermine', 'pattern'] },
        { q: 'Compare how this writer and the writer of "The Ethics of Artificial Intelligence" present technology. Refer to both texts in your answer.', a: 'the AI Ethics writer presents technology\u2019s effects as genuinely uncertain and open to serious criticism on both sides, while this writer is more skeptical of the criticism itself, framing anti-technology fears as a repeating historical pattern rather than a real problem \u2014 both use a balanced, questioning tone but reach different emphases', keywords: ['compare', 'both', 'similar', 'differ', 'balance', 'tone'] }
      ]
    }
  ];
  // Previously ignored `level` entirely (pure rotation across every passage), so a
  // beginner could be served the GCSE Higher comparison text and vice versa. Now picks
  // from the 5 passages closest in level to what was asked for, same "near" approach
  // already used for vocabulary (wordsNear), so difficulty actually tracks the request.
  function passageForLevel(level) {
    var lvl = level || 1;
    var near = PASSAGES.slice().sort(function (a, b) { return Math.abs(a.level - lvl) - Math.abs(b.level - lvl); }).slice(0, 5);
    return rr('passages_' + Math.round(lvl / 5), near);
  }
  function checkReadingAnswer(input, q) {
    var text = (input || '').toLowerCase();
    return q.keywords.some(function (k) { return text.indexOf(k.toLowerCase()) >= 0; });
  }
  function generateReadingQuestion(level) {
    var passage = passageForLevel(level || 1);
    var q = rr('passageq_' + passage.title, passage.questions);
    return { type: 'reading', topic: 'Reading', passageTitle: passage.title, passageText: passage.text, prompt: q.q, answer: q.a, keywords: q.keywords, method: 'Model answer: ' + q.a };
  }

  /* ---- LEVEL-SCALED MIXED QUESTIONS -------------------------------------- */
  function generateLevelQuestion(level) {
    var kind = pick(['vocab', 'vocab', 'grammar', 'grammar', 'reading']);
    if (kind === 'vocab') return generateVocabQuestion(level);
    if (kind === 'grammar') return generateGrammarQuestion();
    return generateReadingQuestion(level);
  }
  function generateLevelSet(n, level) { var out = []; for (var i = 0; i < n; i++) out.push(generateLevelQuestion(level)); return out; }

  /* ---- PLACEMENT TEST ----------------------------------------------------- */
  function generatePlacementSet(n) {
    n = n || 12;
    var out = [];
    for (var i = 0; i < n; i++) {
      var lvl = Math.round((i / (n - 1)) * 45) + 1; // spread difficulty 1..46 across the test
      out.push(generateLevelQuestion(lvl));
    }
    return out;
  }
  function levelLabel(level) {
    if (level >= 45) return 'GCSE Ready';
    if (level >= 40) return 'Advanced';
    if (level >= 30) return 'Upper Intermediate';
    if (level >= 20) return 'Intermediate';
    if (level >= 10) return 'Elementary';
    return 'Beginner';
  }
  function placementLevelFromScore(pct) { return Math.max(1, Math.min(50, Math.round((pct / 100) * 49) + 1)); }
  // Scaled down from the other subjects' 1-60 grade bands to English's 1-50 level range
  // (same proportions: grade 9 at the top ~15%, grade 1 below the bottom ~15%).
  function gradeFromLevel(level) {
    if (level >= 47) return 9; if (level >= 42) return 8; if (level >= 38) return 7; if (level >= 33) return 6;
    if (level >= 27) return 5; if (level >= 22) return 4; if (level >= 15) return 3; if (level >= 8) return 2; return 1;
  }
  function strongestWeakest(breakdown) {
    var scored = (breakdown || []).filter(function (b) { return b.total > 0; }).map(function (b) { return { topic: b.topic, acc: b.ok / b.total }; });
    if (!scored.length) return { strongest: '', weakest: '', focusAreas: [] };
    scored.sort(function (a, b) { return b.acc - a.acc; });
    var strongest = scored[0].topic, weakest = scored[scored.length - 1].topic;
    var focusAreas = scored.slice().sort(function (a, b) { return a.acc - b.acc; }).slice(0, 3).map(function (s) { return s.topic; });
    return { strongest: strongest, weakest: weakest, focusAreas: focusAreas };
  }

  function checkAnswer(q, input) {
    if (q.type === 'reading') return checkReadingAnswer(input, q);
    var norm = function (s) { return (s || '').toLowerCase().trim().replace(/[^a-z0-9 ]/g, ''); };
    return norm(input) === norm(q.answer);
  }

  /* ---- QUICK TEST MODE ---------------------------------------------------
     Parts-of-speech / mechanics MC generators, each tagged with a difficulty
     tier d: 1=Beginner 2=Intermediate 3=GCSE Foundation 4=GCSE Higher. ------ */
  function pickByTier(bank, tier) {
    var pool = bank.filter(function (b) { return b.d === tier; });
    if (!pool.length) pool = bank.filter(function (b) { return Math.abs(b.d - tier) <= 1; });
    if (!pool.length) pool = bank;
    return pick(pool);
  }
  function mkOptions(correct, distractors) { return shuffle([correct].concat(distractors)); }

  var NOUN_BANK = ['teacher', 'bicycle', 'freedom', 'kitchen', 'ocean', 'decision', 'courage', 'hospital', 'friendship', 'mountain'];
  var VERB_DISTRACT = ['running', 'decide', 'whispered', 'imagine', 'arrived', 'construct'];
  var ADJ_DISTRACT = ['happy', 'enormous', 'ancient', 'curious', 'silent', 'golden'];
  var ADV_DISTRACT = ['quickly', 'silently', 'bravely', 'rarely', 'gently', 'loudly'];
  function qNoun(tier) {
    var noun = pick(NOUN_BANK);
    var opts = mkOptions(noun, shuffle(VERB_DISTRACT.concat(ADJ_DISTRACT, ADV_DISTRACT)).slice(0, 3));
    return { type: 'mc', topic: 'Nouns', prompt: 'Which of these words is a noun?', options: opts, answer: noun, method: '"' + noun + '" is a noun — it names a person, place, thing or idea.' };
  }

  var PRONOUN_BANK = [
    { d: 1, s: '___ went to the shop because ___ needed milk.', answer: 'She / she', options: ['She / she', 'Her / her', 'He / him', 'They / it'], note: 'Use the subject pronoun "she" before a verb, both times.' },
    { d: 1, s: 'Give the book to ___.', answer: 'him', options: ['him', 'he', 'his', 'himself'], note: 'After a preposition ("to"), use the object pronoun "him".' },
    { d: 2, s: '___ is the person who called earlier.', answer: 'She', options: ['She', 'Her', 'Herself', 'Hers'], note: 'The subject of the sentence needs the subject pronoun "She".' },
    { d: 2, s: 'This is ___ house, not theirs.', answer: 'our', options: ['our', 'ours', 'us', 'we'], note: '"Our" is the possessive determiner used directly before a noun.' },
    { d: 3, s: '___ book is this — yours or mine?', answer: 'Whose', options: ['Whose', "Who's", 'Who', 'Which'], note: '"Whose" asks about possession; "who\'s" means "who is".' },
    { d: 3, s: 'The award went to the student ___ worked hardest.', answer: 'who', options: ['who', 'whom', 'which', 'whose'], note: '"Who" is correct because it is the subject of "worked".' },
    { d: 4, s: 'To ___ should I address this letter?', answer: 'whom', options: ['whom', 'who', 'whose', 'which'], note: '"Whom" is correct after a preposition ("To").' },
    { d: 4, s: 'Each of the players brought ___ own kit.', answer: 'their', options: ['their', 'his', 'they', 'them'], note: 'Modern usage accepts singular "their" after "each of".' }
  ];
  function qPronoun(tier) { var b = pickByTier(PRONOUN_BANK, tier); return { type: 'mc', topic: 'Pronouns', prompt: b.s, options: b.options, answer: b.answer, method: b.note }; }

  var VERB_BANK = [
    { d: 1, s: 'Yesterday, she ___ to school.', answer: 'walked', options: ['walked', 'walk', 'walking', 'walks'], note: 'Finished action in the past needs the past simple "walked".' },
    { d: 1, s: 'They ___ football every Saturday.', answer: 'play', options: ['play', 'plays', 'played', 'playing'], note: '"They" (plural) takes the base form "play" in the present simple.' },
    { d: 2, s: 'She ___ her homework right now.', answer: 'is doing', options: ['is doing', 'do', 'does', 'did'], note: '"Right now" signals the present continuous: is + verb-ing.' },
    { d: 2, s: 'By the time we arrived, the film ___.', answer: 'had started', options: ['had started', 'started', 'starts', 'has started'], note: 'An earlier past action needs the past perfect "had started".' },
    { d: 3, s: 'If it rains tomorrow, we ___ the picnic.', answer: 'will cancel', options: ['will cancel', 'cancel', 'cancelled', 'cancelling'], note: 'First conditional: if + present simple, will + base verb.' },
    { d: 3, s: 'She ___ in London since 2019.', answer: 'has lived', options: ['has lived', 'lived', 'lives', 'is living'], note: 'An action starting in the past and continuing now needs the present perfect.' },
    { d: 4, s: 'By next June, she ___ her degree.', answer: 'will have finished', options: ['will have finished', 'will finish', 'finishes', 'has finished'], note: 'An action completed before a future point needs the future perfect.' },
    { d: 4, s: 'The report ___ by the committee before it is published.', answer: 'must be reviewed', options: ['must be reviewed', 'must review', 'reviews', 'reviewing'], note: 'Passive modal construction: modal + be + past participle.' }
  ];
  function qVerb(tier) { var b = pickByTier(VERB_BANK, tier); return { type: 'mc', topic: 'Verbs', prompt: b.s, options: b.options, answer: b.answer, method: b.note }; }

  var ADJ_BANK = [
    { d: 1, w: 'happy', comp: 'happier', sup: 'happiest' }, { d: 1, w: 'small', comp: 'smaller', sup: 'smallest' },
    { d: 2, w: 'big', comp: 'bigger', sup: 'biggest' }, { d: 2, w: 'easy', comp: 'easier', sup: 'easiest' },
    { d: 3, w: 'beautiful', comp: 'more beautiful', sup: 'most beautiful' }, { d: 3, w: 'good', comp: 'better', sup: 'best' },
    { d: 4, w: 'bad', comp: 'worse', sup: 'worst' }, { d: 4, w: 'far', comp: 'further', sup: 'furthest' }
  ];
  function qAdjective(tier) {
    var b = pickByTier(ADJ_BANK, tier); var wantSup = Math.random() < 0.5;
    var correct = wantSup ? b.sup : b.comp;
    var distract = [b.w + 'er', b.w + 'est', 'more ' + b.w, 'most ' + b.w].filter(function (x) { return x !== correct; }).slice(0, 3);
    return { type: 'mc', topic: 'Adjectives', prompt: 'What is the ' + (wantSup ? 'superlative' : 'comparative') + ' form of "' + b.w + '"?', options: mkOptions(correct, distract), answer: correct, method: '"' + b.w + '" \u2192 ' + (wantSup ? b.sup : b.comp) + ' (' + (wantSup ? 'superlative' : 'comparative') + ').' };
  }

  var ADV_BANK = [
    { d: 1, adj: 'quick', adv: 'quickly' }, { d: 1, adj: 'slow', adv: 'slowly' },
    { d: 2, adj: 'careful', adv: 'carefully' }, { d: 2, adj: 'happy', adv: 'happily' },
    { d: 3, adj: 'gentle', adv: 'gently' }, { d: 3, adj: 'true', adv: 'truly' },
    { d: 4, adj: 'good', adv: 'well' }, { d: 4, adj: 'fast', adv: 'fast' }
  ];
  function qAdverb(tier) {
    var b = pickByTier(ADV_BANK, tier);
    var distract = shuffle([b.adj + 'ly', b.adj.replace(/y$/, 'ily'), b.adj + 'ley', b.adj]).filter(function (x) { return x !== b.adv; }).slice(0, 3);
    return { type: 'mc', topic: 'Adverbs', prompt: 'What is the adverb form of "' + b.adj + '"?', options: mkOptions(b.adv, distract), answer: b.adv, method: '"' + b.adj + '" \u2192 "' + b.adv + '" as an adverb.' };
  }

  var PREP_BANK = [
    { d: 1, s: 'She is afraid ___ spiders.', a: 'of', o: ['of', 'from', 'for', 'with'] },
    { d: 1, s: 'The cat is ___ the table.', a: 'under', o: ['under', 'in', 'of', 'at'] },
    { d: 2, s: 'We arrived ___ the airport at noon.', a: 'at', o: ['at', 'in', 'on', 'to'] },
    { d: 2, s: 'She apologised ___ being late.', a: 'for', o: ['for', 'of', 'about', 'to'] },
    { d: 3, s: 'The results depend ___ how hard you revise.', a: 'on', o: ['on', 'of', 'for', 'at'] },
    { d: 3, s: 'He is married ___ a doctor.', a: 'to', o: ['to', 'with', 'of', 'for'] },
    { d: 4, s: 'The company complied ___ every regulation.', a: 'with', o: ['with', 'to', 'of', 'in'] },
    { d: 4, s: 'She is renowned ___ her attention to detail.', a: 'for', o: ['for', 'of', 'with', 'about'] }
  ];
  function qPreposition(tier) { var b = pickByTier(PREP_BANK, tier); return { type: 'mc', topic: 'Prepositions', prompt: b.s, options: b.o, answer: b.a, method: '"' + b.a + '" is the preposition that correctly follows this phrase by convention.' }; }

  var CONJ_BANK = [
    { d: 1, s: 'I wanted to go for a run, ___ it started raining.', a: 'but', o: ['but', 'and', 'so', 'or'] },
    { d: 1, s: 'You can have tea ___ coffee.', a: 'or', o: ['or', 'but', 'so', 'nor'] },
    { d: 2, s: 'She studied hard, ___ she passed the exam.', a: 'so', o: ['so', 'but', 'or', 'yet'] },
    { d: 2, s: '___ it was raining, we still went outside.', a: 'Although', o: ['Although', 'Because', 'So', 'And'] },
    { d: 3, s: 'He stayed home ___ he was feeling unwell.', a: 'because', o: ['because', 'although', 'unless', 'while'] },
    { d: 3, s: 'You will fail the test ___ you revise.', a: 'unless', o: ['unless', 'although', 'since', 'so'] },
    { d: 4, s: '___ the delay, the project was completed on time.', a: 'Despite', o: ['Despite', 'Although', 'Because', 'Unless'] },
    { d: 4, s: 'She left early, ___ she wanted to avoid the traffic.', a: 'as', o: ['as', 'but', 'or', 'nor'] }
  ];
  function qConjunction(tier) { var b = pickByTier(CONJ_BANK, tier); return { type: 'mc', topic: 'Conjunctions', prompt: b.s, options: b.o, answer: b.a, method: '"' + b.a + '" correctly links these two ideas.' }; }

  var DET_BANK = [
    { d: 1, s: '___ apple a day keeps the doctor away.', a: 'An', o: ['An', 'A', 'The', 'Some'] },
    { d: 1, s: 'I need ___ water, please.', a: 'some', o: ['some', 'a', 'an', 'many'] },
    { d: 2, s: 'There isn\u2019t ___ milk left in the fridge.', a: 'any', o: ['any', 'some', 'much', 'a'] },
    { d: 2, s: '___ students in this class work hard.', a: 'Most', o: ['Most', 'Much', 'Little', 'Every'] },
    { d: 3, s: '___ information you gave me was very useful.', a: 'The', o: ['The', 'A', 'An', 'Some'] },
    { d: 3, s: 'She has ___ experience in this field than I do.', a: 'less', o: ['less', 'fewer', 'little', 'few'] },
    { d: 4, s: 'There were ___ people at the concert than expected.', a: 'fewer', o: ['fewer', 'less', 'much', 'little'] },
    { d: 4, s: '___ evidence supports this theory.', a: 'Little', o: ['Little', 'Few', 'Many', 'Several'] }
  ];
  function qDeterminer(tier) { var b = pickByTier(DET_BANK, tier); return { type: 'mc', topic: 'Determiners', prompt: b.s, options: b.o, answer: b.a, method: '"' + b.a + '" is the correct determiner here.' }; }

  var SPELL_BANK = [
    { d: 1, a: 'because', o: ['becuase', 'becouse', 'becaus'] }, { d: 1, a: 'friend', o: ['freind', 'frend', 'friand'] },
    { d: 2, a: 'definitely', o: ['definately', 'definatly', 'defintely'] }, { d: 2, a: 'separate', o: ['seperate', 'seperete', 'separrate'] },
    { d: 3, a: 'necessary', o: ['neccessary', 'necesary', 'neccesary'] }, { d: 3, a: 'occurred', o: ['occured', 'ocurred', 'occurrred'] },
    { d: 4, a: 'embarrass', o: ['embarass', 'embarras', 'embarrass '] }, { d: 4, a: 'accommodate', o: ['acommodate', 'accomodate', 'acomodate'] }
  ];
  function qSpelling(tier) { var b = pickByTier(SPELL_BANK, tier); return { type: 'mc', topic: 'Spelling', prompt: 'Which of these is spelled correctly?', options: mkOptions(b.a, b.o), answer: b.a, method: '"' + b.a + '" is the correct spelling.' }; }

  var SENT_BANK = [
    { d: 1, s: 'The dog barked.', a: 'Simple' }, { d: 1, s: 'She reads books and watches films.', a: 'Simple' },
    { d: 2, s: 'The rain fell, and the streets flooded.', a: 'Compound' }, { d: 2, s: 'I like tea, but he prefers coffee.', a: 'Compound' },
    { d: 3, s: 'Although it was raining, we went outside.', a: 'Complex' }, { d: 3, s: 'Because she studied hard, she passed the exam.', a: 'Complex' },
    { d: 4, s: 'The team, who had trained for months, won the final, and the crowd cheered.', a: 'Compound-complex' },
    { d: 4, s: 'While the storm raged outside, she read quietly, and the cat slept by the fire.', a: 'Compound-complex' }
  ];
  function qSentenceStructure(tier) { var b = pickByTier(SENT_BANK, tier); return { type: 'mc', topic: 'Sentence Structure', prompt: 'What type of sentence is this? "' + b.s + '"', options: ['Simple', 'Compound', 'Complex', 'Compound-complex'], answer: b.a, method: 'This is a ' + b.a.toLowerCase() + ' sentence.' }; }

  var WRITING_BANK = [
    { d: 1, a: 'She doesn\u2019t like apples.', o: ["She don't like apples.", 'She not like apples.', 'She isn\u2019t like apples.'] },
    { d: 1, a: 'There are five books on the shelf.', o: ['There is five books on the shelf.', 'There are five book on the shelf.', 'Their are five books on the shelf.'] },
    { d: 2, a: 'I saw three deer in the field.', o: ['I seen three deer in the field.', 'I saw three deers in the field.', 'I seen three deers in the field.'] },
    { d: 2, a: 'Its raining, so bring an umbrella.'.replace("Its", "It's"), o: ['Its raining, so bring an umbrella.', 'It is raining, so bring an umbrella there.', 'Its raining, so bringing an umbrella.'] },
    { d: 3, a: 'Neither of the answers was correct.', o: ['Neither of the answers were correct.', 'Neither of the answer was correct.', 'Either of the answers were correct.'] },
    { d: 3, a: 'The company whose profits rose is expanding.', o: ["The company who's profits rose is expanding.", 'The company which profits rose is expanding.', 'The company whom profits rose is expanding.'] },
    { d: 4, a: 'Had she known the risks, she would not have invested.', o: ['If she would have known the risks, she would not have invested.', 'Had she known the risks, she would not of invested.', 'She would not have invested, had she know the risks.'] },
    { d: 4, a: 'The data suggest that the theory is correct.', o: ['The data suggests that the theory is correct.', 'The datas suggest that the theory is correct.', 'The data suggest that the theory are correct.'] }
  ];
  function qWritingCorrection(tier) { var b = pickByTier(WRITING_BANK, tier); return { type: 'mc', topic: 'Writing', prompt: 'Which sentence is written correctly?', options: mkOptions(b.a, b.o), answer: b.a, method: 'The other options contain grammar, spelling or agreement errors — this is the fully correct version.' }; }

  var QT_GENERATORS = {
    grammar: function (tier) { return generateGrammarQuestion(); },
    nouns: qNoun, pronouns: qPronoun, verbs: qVerb, adjectives: qAdjective, adverbs: qAdverb,
    prepositions: qPreposition, conjunctions: qConjunction, determiners: qDeterminer,
    punctuation: function (tier) { return generateGrammarQuestion('punctuation'); },
    spelling: qSpelling,
    vocabulary: function (tier) { return generateVocabQuestion(tierToLevel(tier)); },
    reading: function (tier) { return generateReadingQuestion(tierToLevel(tier)); },
    sentencestructure: qSentenceStructure,
    writing: qWritingCorrection
  };
  var QT_TYPES = [
    { key: 'grammar', label: 'Grammar' }, { key: 'nouns', label: 'Nouns' }, { key: 'pronouns', label: 'Pronouns' },
    { key: 'verbs', label: 'Verbs' }, { key: 'adjectives', label: 'Adjectives' }, { key: 'adverbs', label: 'Adverbs' },
    { key: 'prepositions', label: 'Prepositions' }, { key: 'conjunctions', label: 'Conjunctions' }, { key: 'determiners', label: 'Determiners' },
    { key: 'punctuation', label: 'Punctuation' }, { key: 'spelling', label: 'Spelling' }, { key: 'vocabulary', label: 'Vocabulary' },
    { key: 'reading', label: 'Reading Comprehension' }, { key: 'sentencestructure', label: 'Sentence Structure' },
    { key: 'writing', label: 'Writing' }, { key: 'mixed', label: 'Mixed English Test' }
  ];
  var QT_DIFFICULTIES = ['Beginner', 'Intermediate', 'GCSE Foundation', 'GCSE Higher', 'Auto'];
  var QT_LENGTHS = [5, 10, 20, 50];
  function difficultyToTier(diff) { return { Beginner: 1, Intermediate: 2, 'GCSE Foundation': 3, 'GCSE Higher': 4 }[diff] || 2; }
  function tierToLevel(tier) { return { 1: 5, 2: 20, 3: 35, 4: 48 }[tier] || 20; }
  function levelToTier(level) { if (level >= 40) return 4; if (level >= 25) return 3; if (level >= 12) return 2; return 1; }

  function generateQuickTestQuestion(typeKey, tier) {
    if (typeKey === 'mixed') { var keys = Object.keys(QT_GENERATORS); var k = pick(keys); return QT_GENERATORS[k](tier); }
    var fn = QT_GENERATORS[typeKey] || QT_GENERATORS.grammar;
    return fn(tier);
  }
  function buildQuickTest(typeKey, difficulty, length, userLevel) {
    var tier = difficulty === 'Auto' ? levelToTier(userLevel || 1) : difficultyToTier(difficulty);
    var out = [];
    for (var i = 0; i < length; i++) out.push(generateQuickTestQuestion(typeKey, tier));
    return out;
  }
  function generateDailyChallenge(userLevel) {
    var tier = levelToTier(userLevel || 1);
    var mix = ['grammar', 'vocabulary', 'spelling', 'reading', 'punctuation'];
    return mix.map(function (k) { return QT_GENERATORS[k](tier); }).concat([QT_GENERATORS.sentencestructure(tier), QT_GENERATORS.pronouns(tier), QT_GENERATORS.writing(tier)]);
  }

  /* ---- GCSE WRITING PROMPTS -----------------------------------------------
     The AI Writing Coach previously had no real task to respond to — just a
     placeholder suggesting "100 words about your favourite holiday" (well
     below GCSE level). These mirror the two GCSE English Language writing
     papers: creative/descriptive (Paper 1 Q5 style) and transactional —
     letters, articles, speeches written for a stated purpose/audience/form
     (Paper 2 Q5 style), which is specifically what AO5/AO6 mark against. ---- */
  var WRITING_PROMPTS = {
    creative: [
      { title: 'A Busy Market', prompt: 'Describe a busy market. Use what you can see, hear and smell to bring the scene to life for the reader.' },
      { title: 'The Storm', prompt: 'Write a description of a violent storm, focusing on how it affects a small coastal town.' },
      { title: 'An Old Photograph', prompt: 'Write a story that begins: "The photograph had been in the drawer for years before she finally opened it."' },
      { title: 'Somewhere You’ll Never Forget', prompt: 'Describe a place you will never forget. It can be real or imagined.' },
      { title: 'The Empty House', prompt: 'Write a description of an abandoned house, suggested by this idea, as the opening to a story.' },
      { title: 'A Difficult Decision', prompt: 'Write a story about a character who has to make a decision that will change their life, in which not everything is as it first seems.' },
      { title: 'Arrival', prompt: 'Write the opening part of a story about someone arriving somewhere completely new.' },
      { title: 'The Crowd', prompt: 'Describe the atmosphere at a huge sporting event or concert, focusing on the crowd around you.' }
    ],
    transactional: [
      { title: 'Letter to the Council', prompt: 'Write a letter to your local council persuading them to build a new skate park in your area.', form: 'letter', audience: 'local council', purpose: 'persuade' },
      { title: 'Speech: Should Homework Be Banned?', prompt: 'Write a speech for your school debate club arguing for or against banning homework.', form: 'speech', audience: 'fellow students', purpose: 'argue/persuade' },
      { title: 'Article: The Rise of Social Media', prompt: 'Write an article for a school magazine giving your views on the impact social media has on young people.', form: 'article', audience: 'general/school readership', purpose: 'inform and give opinion' },
      { title: 'Letter of Complaint', prompt: 'Write a letter to a company complaining about a product or service you received, and explaining what you want them to do about it.', form: 'letter', audience: 'a company', purpose: 'complain/persuade' },
      { title: 'Speech: A Cause You Care About', prompt: 'Write a speech to be given at a school assembly persuading students to support a cause you care about.', form: 'speech', audience: 'school assembly', purpose: 'persuade' },
      { title: 'Article: Is Ambition Overrated?', prompt: 'Write an article for a newspaper giving your point of view on whether ambition is always a good thing.', form: 'article', audience: 'newspaper readers', purpose: 'argue/give opinion' },
      { title: 'Letter to a Future Student', prompt: 'Write a letter to a student about to join your school, advising and reassuring them about what to expect.', form: 'letter', audience: 'a new student', purpose: 'advise/inform' },
      { title: 'Article: Are Exams Fair?', prompt: 'Write an article for your school website arguing whether exams are the fairest way to measure a student’s ability.', form: 'article', audience: 'school website readers', purpose: 'argue/give opinion' }
    ]
  };
  function randomWritingPrompt(kind) { var bank = WRITING_PROMPTS[kind] || WRITING_PROMPTS.creative; return pick(bank); }

  root.LearningEnglish = {
    WORDS: WORDS, wordForLevel: wordForLevel,
    generateVocabQuestion: generateVocabQuestion,
    GRAMMAR_LESSONS: GRAMMAR_LESSONS, GRAMMAR_KEYS: GRAMMAR_KEYS, generateGrammarQuestion: generateGrammarQuestion,
    PASSAGES: PASSAGES, generateReadingQuestion: generateReadingQuestion,
    QT_TYPES: QT_TYPES, QT_DIFFICULTIES: QT_DIFFICULTIES, QT_LENGTHS: QT_LENGTHS,
    buildQuickTest: buildQuickTest, generateDailyChallenge: generateDailyChallenge, levelToTier: levelToTier,
    generateLevelQuestion: generateLevelQuestion, generateLevelSet: generateLevelSet,
    generatePlacementSet: generatePlacementSet, levelLabel: levelLabel, placementLevelFromScore: placementLevelFromScore,
    gradeFromLevel: gradeFromLevel, strongestWeakest: strongestWeakest,
    checkAnswer: checkAnswer,
    WRITING_PROMPTS: WRITING_PROMPTS, randomWritingPrompt: randomWritingPrompt
  };
})(window);

/* ============================================================================
   learning-science.js — GCSE Combined Science (Biology/Chemistry/Physics)
   engine for the Learning Centre. Curated question banks (facts can't be
   procedurally generated like arithmetic) + procedural calculation
   generators, a 60-level system, placement test, Quick Test support and a
   formula/reference library. Consumed by the DC logic class via
   window.LearningScience.
   ============================================================================ */
(function (root) {
  'use strict';
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[ri(0, arr.length - 1)]; }
  function shuffle(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = ri(0, i); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function round(v, d) { var p = Math.pow(10, d == null ? 0 : d); return Math.round(v * p) / p; }

  /* ---- CURATED MC BANKS (level 1-60, weighted per GCSE band) ------------- */
  var BIOLOGY = [
    { level: 16, q: 'What is the basic unit of life?', a: 'The cell', d: ['The cell', 'The atom', 'The organ', 'The tissue'], why: 'All living things are made of one or more cells — the basic structural and functional unit of life.' },
    { level: 17, q: 'Which structure controls what enters and leaves a cell?', a: 'Cell membrane', d: ['Cell membrane', 'Nucleus', 'Cytoplasm', 'Mitochondria'], why: 'The cell membrane is partially permeable, controlling the movement of substances in and out.' },
    { level: 18, q: 'Which organelle is the site of aerobic respiration?', a: 'Mitochondria', d: ['Mitochondria', 'Ribosome', 'Nucleus', 'Vacuole'], why: 'Mitochondria release energy from glucose using oxygen — the site of aerobic respiration.' },
    { level: 19, q: 'What does a plant cell have that an animal cell does not?', a: 'Cell wall', d: ['Cell wall', 'Nucleus', 'Cytoplasm', 'Cell membrane'], why: 'Plant cells have a rigid cellulose cell wall for structural support; animal cells do not.' },
    { level: 20, q: 'What is the function of red blood cells?', a: 'Carry oxygen', d: ['Carry oxygen', 'Fight infection', 'Clot blood', 'Digest food'], why: 'Red blood cells contain haemoglobin, which binds oxygen and transports it around the body.' },
    { level: 21, q: 'Which enzyme breaks down starch?', a: 'Amylase', d: ['Amylase', 'Protease', 'Lipase', 'Catalase'], why: 'Amylase (found in saliva and the pancreas) breaks starch down into sugars.' },
    { level: 22, q: 'What is the main gas plants absorb for photosynthesis?', a: 'Carbon dioxide', d: ['Carbon dioxide', 'Oxygen', 'Nitrogen', 'Hydrogen'], why: 'Plants take in CO2 through stomata and combine it with water to make glucose, releasing oxygen.' },
    { level: 23, q: 'Which hormone regulates blood glucose by lowering it?', a: 'Insulin', d: ['Insulin', 'Glucagon', 'Adrenaline', 'Testosterone'], why: 'Insulin (from the pancreas) causes cells to take up glucose, lowering blood sugar levels.' },
    { level: 24, q: 'What is homeostasis?', a: 'Keeping internal conditions stable', d: ['Keeping internal conditions stable', 'Cell division', 'Energy release', 'Growth of tissue'], why: 'Homeostasis is the regulation of the internal environment (temperature, water, glucose) to maintain optimal conditions.' },
    { level: 25, q: 'What is the molecule that carries genetic information?', a: 'DNA', d: ['DNA', 'RNA', 'ATP', 'Glucose'], why: 'DNA (deoxyribonucleic acid) is a double helix that stores the genetic code in genes.' },
    { level: 26, q: 'What is a gene?', a: 'A section of DNA that codes for a protein', d: ['A section of DNA that codes for a protein', 'A whole chromosome', 'A type of cell', 'An organelle'], why: 'Genes are sections of DNA, each coding for a specific protein that produces a characteristic.' },
    { level: 27, q: 'What did Darwin propose to explain how species change over time?', a: 'Natural selection', d: ['Natural selection', 'Genetic engineering', 'Cloning', 'Selective breeding'], why: 'Darwin\u2019s theory: organisms best suited to their environment are more likely to survive and reproduce, passing on advantageous traits.' },
    { level: 28, q: 'What is biodiversity?', a: 'The variety of living organisms in an area', d: ['The variety of living organisms in an area', 'The number of cells in an organism', 'The rate of photosynthesis', 'The size of an ecosystem'], why: 'Biodiversity measures the range of species and genetic variation within an ecosystem.' },
    { level: 29, q: 'What process do decomposers carry out in the carbon cycle?', a: 'Breaking down dead matter, releasing CO2', d: ['Breaking down dead matter, releasing CO2', 'Absorbing CO2 for photosynthesis', 'Storing carbon as fossil fuels', 'Converting CO2 to oxygen'], why: 'Decomposers respire, releasing carbon dioxide back into the atmosphere as they break down dead organisms.' },
    { level: 30, q: 'Which type of pathogen causes the common cold?', a: 'Virus', d: ['Virus', 'Bacterium', 'Fungus', 'Protist'], why: 'Viruses like rhinovirus infect cells and cause illnesses such as the common cold and flu.' }
  ];
  var CHEMISTRY = [
    { level: 31, q: 'What subatomic particle has a negative charge?', a: 'Electron', d: ['Electron', 'Proton', 'Neutron', 'Nucleon'], why: 'Electrons orbit the nucleus and carry a negative charge; protons are positive, neutrons are neutral.' },
    { level: 32, q: 'What do we call atoms of the same element with different numbers of neutrons?', a: 'Isotopes', d: ['Isotopes', 'Ions', 'Isomers', 'Molecules'], why: 'Isotopes have the same number of protons (same element) but a different number of neutrons.' },
    { level: 33, q: 'Elements in the same group of the periodic table have the same number of...', a: 'Electrons in their outer shell', d: ['Electrons in their outer shell', 'Neutrons', 'Protons', 'Energy levels'], why: 'Group number = number of outer-shell (valence) electrons, which determines chemical behaviour.' },
    { level: 34, q: 'What type of bonding involves the transfer of electrons?', a: 'Ionic bonding', d: ['Ionic bonding', 'Covalent bonding', 'Metallic bonding', 'Hydrogen bonding'], why: 'Ionic bonding occurs between metals and non-metals — electrons transfer, forming charged ions.' },
    { level: 35, q: 'What type of bonding involves sharing electron pairs?', a: 'Covalent bonding', d: ['Covalent bonding', 'Ionic bonding', 'Metallic bonding', 'Van der Waals bonding'], why: 'Covalent bonds form between non-metal atoms sharing pairs of electrons.' },
    { level: 36, q: 'What is the pH of a neutral solution?', a: '7', d: ['7', '0', '14', '1'], why: 'A pH of 7 is neutral; below 7 is acidic, above 7 is alkaline.' },
    { level: 37, q: 'What salt is formed when hydrochloric acid reacts with sodium hydroxide?', a: 'Sodium chloride', d: ['Sodium chloride', 'Sodium sulfate', 'Sodium nitrate', 'Sodium carbonate'], why: 'HCl + NaOH \u2192 NaCl + H\u2082O — a neutralisation reaction producing sodium chloride and water.' },
    { level: 38, q: 'What is produced at the cathode during electrolysis of molten lead bromide?', a: 'Lead', d: ['Lead', 'Bromine', 'Oxygen', 'Hydrogen'], why: 'Positive metal ions (Pb\u00b2\u207a) are attracted to and reduced at the negative cathode.' },
    { level: 39, q: 'A reaction that releases heat to the surroundings is called...', a: 'Exothermic', d: ['Exothermic', 'Endothermic', 'Isothermic', 'Catalytic'], why: 'Exothermic reactions transfer energy to the surroundings, raising the temperature (e.g. combustion).' },
    { level: 40, q: 'What is the general formula for an alkane?', a: 'CnH2n+2', d: ['CnH2n+2', 'CnH2n', 'CnH2n-2', 'CnHn'], why: 'Alkanes are saturated hydrocarbons following the formula CnH2n+2 (e.g. methane CH\u2084, ethane C\u2082H\u2086).' },
    { level: 41, q: 'What technique separates substances based on solubility, used to identify inks/dyes?', a: 'Chromatography', d: ['Chromatography', 'Distillation', 'Filtration', 'Electrolysis'], why: 'Chromatography separates mixtures as components move at different rates through a stationary phase.' },
    { level: 42, q: 'What colour does a flame test show for sodium ions?', a: 'Yellow/orange', d: ['Yellow/orange', 'Lilac', 'Green', 'Red'], why: 'Sodium compounds produce a characteristic yellow-orange flame colour in a flame test.' },
    { level: 43, q: 'What is the relative formula mass of water, H\u2082O? (H=1, O=16)', a: '18', d: ['18', '16', '17', '20'], why: '(1\u00d72) + 16 = 18 — sum the relative atomic masses of every atom in the formula.' },
    { level: 44, q: 'What monomer forms the polymer poly(ethene)?', a: 'Ethene', d: ['Ethene', 'Ethane', 'Methane', 'Propene'], why: 'Many ethene monomers join together (addition polymerisation) to form poly(ethene) — plastic.' },
    { level: 45, q: 'What does the term "mole" measure in chemistry?', a: 'Amount of substance', d: ['Amount of substance', 'Mass', 'Volume', 'Concentration'], why: 'A mole is 6.02\u00d710\u00b2\u00b3 particles (Avogadro\u2019s number) — the standard unit for amount of substance.' }
  ];
  var PHYSICS = [
    { level: 46, q: 'What is the unit of electrical resistance?', a: 'Ohm (\u03a9)', d: ['Ohm (\u03a9)', 'Volt (V)', 'Amp (A)', 'Watt (W)'], why: 'Resistance is measured in ohms, defined by V=IR (voltage = current \u00d7 resistance).' },
    { level: 47, q: 'What happens to particles when a solid is heated to become a liquid?', a: 'They gain energy and move more freely', d: ['They gain energy and move more freely', 'They lose energy and slow down', 'They disappear', 'They become charged'], why: 'Heating transfers energy to particles, weakening the forces holding them in a fixed structure, so they move more freely.' },
    { level: 48, q: 'What is released during radioactive alpha decay?', a: '2 protons + 2 neutrons (helium nucleus)', d: ['2 protons + 2 neutrons (helium nucleus)', 'A single electron', 'A high-energy photon', 'A neutron only'], why: 'An alpha particle is identical to a helium nucleus: 2 protons and 2 neutrons, emitted from unstable large nuclei.' },
    { level: 49, q: 'What quantity is the rate of change of velocity?', a: 'Acceleration', d: ['Acceleration', 'Speed', 'Momentum', 'Force'], why: 'Acceleration = change in velocity \u00f7 time taken — how quickly velocity changes.' },
    { level: 50, q: 'According to Newton\u2019s First Law, an object stays at rest or constant velocity unless...', a: 'Acted on by a resultant force', d: ['Acted on by a resultant force', 'It runs out of energy', 'Gravity increases', 'Time passes'], why: 'Newton\u2019s First Law: velocity only changes if a net (resultant) force acts on the object.' },
    { level: 51, q: 'What type of wave is sound?', a: 'Longitudinal', d: ['Longitudinal', 'Transverse', 'Electromagnetic', 'Standing'], why: 'Sound waves are longitudinal — particles vibrate parallel to the direction of energy transfer.' },
    { level: 52, q: 'Which part of the electromagnetic spectrum has the longest wavelength?', a: 'Radio waves', d: ['Radio waves', 'Gamma rays', 'Visible light', 'X-rays'], why: 'The EM spectrum from longest to shortest wavelength: radio, microwave, infrared, visible, UV, X-ray, gamma.' },
    { level: 53, q: 'What happens to the strength of a magnetic field further from a magnet?', a: 'It gets weaker', d: ['It gets weaker', 'It gets stronger', 'It stays the same', 'It reverses'], why: 'Magnetic field strength decreases with distance from the source — field lines spread further apart.' },
    { level: 54, q: 'What component of a generator induces a current by rotating in a magnetic field?', a: 'Coil of wire', d: ['Coil of wire', 'Permanent magnet only', 'Resistor', 'Capacitor'], why: 'A rotating coil in a magnetic field induces an EMF via electromagnetic induction (the dynamo effect).' },
    { level: 55, q: 'What force keeps planets in orbit around the Sun?', a: 'Gravity', d: ['Gravity', 'Magnetism', 'Friction', 'Nuclear force'], why: 'Gravitational attraction between the Sun and planets provides the centripetal force for orbit.' },
    { level: 56, q: 'What is the equation linking wave speed, frequency and wavelength?', a: 'v = f\u03bb', d: ['v = f\u03bb', 'v = f/\u03bb', 'v = f + \u03bb', 'v = f\u2212\u03bb'], why: 'Wave speed = frequency \u00d7 wavelength — a core wave equation for all wave types.' },
    { level: 57, q: 'What is half-life?', a: 'Time for half the radioactive nuclei to decay', d: ['Time for half the radioactive nuclei to decay', 'Time for all nuclei to decay', 'Time for an atom to form', 'Time for a reaction to complete'], why: 'Half-life is the time taken for the number of undecayed nuclei in a sample to halve.' },
    { level: 58, q: 'What is the equation for kinetic energy?', a: 'KE = \u00bdmv\u00b2', d: ['KE = \u00bdmv\u00b2', 'KE = mgh', 'KE = mv', 'KE = m/v'], why: 'Kinetic energy = \u00bd \u00d7 mass \u00d7 velocity\u00b2 — the energy an object has due to its motion.' },
    { level: 59, q: 'What does a high resistance do to current in a circuit at constant voltage?', a: 'Decreases it', d: ['Decreases it', 'Increases it', 'Has no effect', 'Reverses it'], why: 'From I=V/R: at constant voltage, higher resistance means lower current.' },
    { level: 60, q: 'What is the efficiency equation for energy transfer?', a: 'Efficiency = (useful energy output \u00f7 total energy input) \u00d7 100%', d: ['Efficiency = (useful energy output \u00f7 total energy input) \u00d7 100%', 'Efficiency = total input \u00f7 useful output', 'Efficiency = output \u2212 input', 'Efficiency = input \u00d7 output'], why: 'No device is 100% efficient — some energy is always wasted (usually as heat).' }
  ];
  var PRACTICAL = [
    { level: 5, q: 'What piece of equipment measures the volume of a liquid precisely?', a: 'Measuring cylinder', d: ['Measuring cylinder', 'Thermometer', 'Balance', 'Stopwatch'], why: 'A measuring cylinder gives an accurate reading of liquid volume, read at eye level from the meniscus.' },
    { level: 7, q: 'In an experiment, the variable you deliberately change is called the...', a: 'Independent variable', d: ['Independent variable', 'Dependent variable', 'Control variable', 'Confounding variable'], why: 'The independent variable is what YOU change; the dependent variable is what you MEASURE as a result.' },
    { level: 8, q: 'What should you do with variables that could affect your results but aren\u2019t being tested?', a: 'Keep them constant (control variables)', d: ['Keep them constant (control variables)', 'Change them randomly', 'Ignore them', 'Measure them instead'], why: 'Controlling other variables ensures any change in your result is due to the independent variable only.' },
    { level: 9, q: 'Why should an experiment be repeated multiple times?', a: 'To check reliability and calculate an average', d: ['To check reliability and calculate an average', 'To use up more equipment', 'To make it take longer', 'It is not necessary'], why: 'Repeats let you spot anomalies and calculate a mean, making your data more reliable.' },
    { level: 10, q: 'What safety equipment protects your eyes in a school lab?', a: 'Safety goggles', d: ['Safety goggles', 'Lab coat only', 'Gloves only', 'Face mask'], why: 'Safety goggles protect eyes from chemical splashes, heat and glass fragments during practicals.' },
    { level: 11, q: 'On a line graph, what does the gradient (slope) usually represent?', a: 'Rate of change', d: ['Rate of change', 'A single measurement', 'The starting value', 'An anomaly'], why: 'The gradient of a graph shows how quickly one variable changes relative to another (a rate).' },
    { level: 12, q: 'What is an anomalous result?', a: 'A result that doesn\u2019t fit the overall pattern', d: ['A result that doesn\u2019t fit the overall pattern', 'The average result', 'The first result taken', 'The most accurate result'], why: 'Anomalies are outliers that don\u2019t fit the trend — usually excluded when calculating a mean.' },
    { level: 13, q: 'What does "accuracy" mean in an experiment?', a: 'How close a measurement is to the true value', d: ['How close a measurement is to the true value', 'How many times you repeated it', 'How precise your equipment is', 'How fast you completed it'], why: 'Accuracy is closeness to the true/real value, distinct from precision (consistency of repeated measurements).' }
  ];
  var VOCAB = [
    { level: 3, q: 'A substance that cannot be broken down into simpler substances is a(n)...', a: 'Element', d: ['Element', 'Compound', 'Mixture', 'Molecule'], why: 'Elements are made of only one type of atom and appear on the periodic table.' },
    { level: 4, q: 'Two or more elements chemically joined together form a...', a: 'Compound', d: ['Compound', 'Mixture', 'Element', 'Solution'], why: 'A compound forms when elements chemically bond in fixed ratios, e.g. H\u2082O.' },
    { level: 6, q: 'The smallest unit of an element that retains its properties is a(n)...', a: 'Atom', d: ['Atom', 'Molecule', 'Ion', 'Cell'], why: 'Atoms are the basic building blocks of all matter, defined by their number of protons.' },
    { level: 14, q: 'A change that can be reversed, like melting ice, is called...', a: 'Reversible/physical change', d: ['Reversible/physical change', 'Chemical change', 'Nuclear change', 'Permanent change'], why: 'Physical changes (state changes, dissolving) don\u2019t form new substances and can usually be reversed.' },
    { level: 20, q: 'An organism\u2019s observable characteristics (e.g. eye colour) are its...', a: 'Phenotype', d: ['Phenotype', 'Genotype', 'Genome', 'Allele'], why: 'Phenotype is what you can observe; genotype is the underlying genetic makeup that produces it.' },
    { level: 36, q: 'A substance that speeds up a reaction without being used up is a...', a: 'Catalyst', d: ['Catalyst', 'Reactant', 'Product', 'Solvent'], why: 'Catalysts lower the activation energy of a reaction and are chemically unchanged at the end.' },
    { level: 46, q: 'The force that opposes motion between two surfaces in contact is...', a: 'Friction', d: ['Friction', 'Tension', 'Upthrust', 'Gravity'], why: 'Friction acts to resist relative motion between surfaces, converting kinetic energy to heat.' }
  ];

  var BANKS = { biology: BIOLOGY, chemistry: CHEMISTRY, physics: PHYSICS, practical: PRACTICAL, vocabulary: VOCAB };
  function mcFromEntry(topicLabel, e) {
    var options = shuffle(e.d);
    return { type: 'mc', topic: topicLabel, level: e.level, prompt: e.q, options: options, answer: e.a, method: e.why };
  }
  function nearestByLevel(bank, level) {
    return bank.slice().sort(function (a, b) { return Math.abs(a.level - level) - Math.abs(b.level - level); });
  }
  var _rot = {};
  function rr(key, arr) {
    var st = _rot[key];
    if (!st || st.i >= st.order.length || st.order.length !== arr.length) { st = { order: shuffle(arr.map(function (_, i) { return i; })), i: 0 }; _rot[key] = st; }
    return arr[st.order[st.i++]];
  }
  function generateFromBank(poolKey, level, topicLabel) {
    var bank = BANKS[poolKey];
    var near = nearestByLevel(bank, level || 1);
    var e = rr(poolKey, near);
    return mcFromEntry(topicLabel, e);
  }

  /* ---- SCIENTIFIC CALCULATIONS (procedural, like Maths) ------------------- */
  function qSpeed() { var d = ri(20, 400), t = ri(2, 20); return { type: 'calc', topic: 'Scientific Calculations', prompt: 'A car travels ' + d + 'm in ' + t + 's. What is its speed in m/s?', answer: round(d / t, 2), method: 'speed = distance \u00f7 time = ' + d + '\u00f7' + t + ' = ' + round(d / t, 2) + ' m/s' }; }
  function qDensity() { var m = ri(10, 500), v = ri(2, 50); return { type: 'calc', topic: 'Scientific Calculations', prompt: 'An object has mass ' + m + 'g and volume ' + v + 'cm\u00b3. What is its density in g/cm\u00b3?', answer: round(m / v, 2), method: 'density = mass \u00f7 volume = ' + m + '\u00f7' + v + ' = ' + round(m / v, 2) + ' g/cm\u00b3' }; }
  function qForce() { var m = ri(2, 90), a = ri(2, 15); return { type: 'calc', topic: 'Scientific Calculations', prompt: 'What force (N) is needed to accelerate a ' + m + 'kg mass at ' + a + 'm/s\u00b2?', answer: m * a, method: 'F = m \u00d7 a = ' + m + ' \u00d7 ' + a + ' = ' + (m * a) + ' N' }; }
  function qWeight() { var m = ri(2, 100); return { type: 'calc', topic: 'Scientific Calculations', prompt: 'What is the weight (N) of a ' + m + 'kg object? (g = 10 N/kg)', answer: m * 10, method: 'W = m \u00d7 g = ' + m + ' \u00d7 10 = ' + (m * 10) + ' N' }; }
  function qOhm() { var i = ri(1, 12), r = ri(2, 40); return { type: 'calc', topic: 'Scientific Calculations', prompt: 'A circuit has current ' + i + 'A and resistance ' + r + '\u03a9. What is the voltage (V)?', answer: i * r, method: 'V = I \u00d7 R = ' + i + ' \u00d7 ' + r + ' = ' + (i * r) + ' V' }; }
  function qPower() { var v = ri(2, 240), i = ri(1, 13); return { type: 'calc', topic: 'Scientific Calculations', prompt: 'A device runs at ' + v + 'V and ' + i + 'A. What is its power (W)?', answer: v * i, method: 'P = V \u00d7 I = ' + v + ' \u00d7 ' + i + ' = ' + (v * i) + ' W' }; }
  function qMoles() { var mr = pick([12, 16, 18, 28, 32, 44, 58]), g = ri(1, 10) * mr; return { type: 'calc', topic: 'Scientific Calculations', prompt: g + 'g of a substance has Mr=' + mr + '. How many moles is this?', answer: round(g / mr, 2), method: 'moles = mass \u00f7 Mr = ' + g + '\u00f7' + mr + ' = ' + round(g / mr, 2) }; }
  function qWaveSpeed() { var f = ri(2, 20), wl = ri(1, 15); return { type: 'calc', topic: 'Scientific Calculations', prompt: 'A wave has frequency ' + f + 'Hz and wavelength ' + wl + 'm. What is its speed (m/s)?', answer: f * wl, method: 'v = f \u00d7 \u03bb = ' + f + ' \u00d7 ' + wl + ' = ' + (f * wl) + ' m/s' }; }
  function qKE() { var m = ri(1, 20), v = ri(2, 15); return { type: 'calc', topic: 'Scientific Calculations', prompt: 'What is the kinetic energy (J) of a ' + m + 'kg object moving at ' + v + 'm/s?', answer: round(0.5 * m * v * v, 1), method: 'KE = \u00bdmv\u00b2 = 0.5 \u00d7 ' + m + ' \u00d7 ' + v + '\u00b2 = ' + round(0.5 * m * v * v, 1) + ' J' }; }
  var CALC_FNS = [qSpeed, qDensity, qForce, qWeight, qOhm, qPower, qMoles, qWaveSpeed, qKE];
  function generateCalc() { return pick(CALC_FNS)(); }

  /* ---- LEVEL SYSTEM (1-60, banded) ---------------------------------------- */
  var LEVEL_BANDS = [
    { min: 1, max: 15, pools: ['practical', 'vocabulary', 'calc'] },
    { min: 16, max: 30, pools: ['biology', 'calc'] },
    { min: 31, max: 45, pools: ['chemistry', 'calc'] },
    { min: 46, max: 60, pools: ['physics', 'calc'] }
  ];
  var TOPIC_LABELS = { biology: 'Biology', chemistry: 'Chemistry', physics: 'Physics', practical: 'Practical Skills', vocabulary: 'Scientific Vocabulary' };
  function bandFor(level) { for (var i = 0; i < LEVEL_BANDS.length; i++) { var b = LEVEL_BANDS[i]; if (level >= b.min && level <= b.max) return b; } return LEVEL_BANDS[LEVEL_BANDS.length - 1]; }
  function generateForLevel(level) {
    level = Math.max(1, Math.min(60, level || 1));
    var band = bandFor(level);
    var pool = pick(band.pools);
    if (pool === 'calc') { var q = generateCalc(); q.level = level; return q; }
    var q2 = generateFromBank(pool, level, TOPIC_LABELS[pool]); q2.level = level; return q2;
  }
  function generateLevelSet(n, level) { var out = []; for (var i = 0; i < n; i++) out.push(generateForLevel(level)); return out; }
  function levelLabel(level) {
    if (level >= 50) return 'GCSE Ready'; if (level >= 40) return 'Advanced'; if (level >= 30) return 'Upper Intermediate';
    if (level >= 20) return 'Intermediate'; if (level >= 10) return 'Elementary'; return 'Beginner';
  }
  function gradeFromLevel(level) {
    if (level >= 56) return 9; if (level >= 51) return 8; if (level >= 46) return 7; if (level >= 40) return 6;
    if (level >= 33) return 5; if (level >= 26) return 4; if (level >= 18) return 3; if (level >= 10) return 2; return 1;
  }
  function generatePlacementSet(n) {
    n = n || 16; var out = [];
    for (var i = 0; i < n; i++) { var level = Math.round(1 + (i / (n - 1)) * 59); out.push(generateForLevel(level)); }
    return out;
  }
  function levelFromScore(pct) { return Math.max(1, Math.min(60, Math.round((pct / 100) * 59) + 1)); }
  function strongestWeakest(breakdown) {
    var scored = (breakdown || []).filter(function (b) { return b.total > 0; }).map(function (b) { return { topic: b.topic, acc: b.ok / b.total }; });
    if (!scored.length) return { strongest: '', weakest: '', focusAreas: [] };
    scored.sort(function (a, b) { return b.acc - a.acc; });
    var strongest = scored[0].topic, weakest = scored[scored.length - 1].topic;
    var focusAreas = scored.slice().sort(function (a, b) { return a.acc - b.acc; }).slice(0, 3).map(function (s) { return s.topic; });
    return { strongest: strongest, weakest: weakest, focusAreas: focusAreas };
  }

  /* ---- QUICK TEST ---------------------------------------------------------- */
  var QT_TYPES = [
    { key: 'biology', label: 'Biology' }, { key: 'chemistry', label: 'Chemistry' }, { key: 'physics', label: 'Physics' },
    { key: 'practical', label: 'Practical Skills' }, { key: 'vocabulary', label: 'Scientific Vocabulary' },
    { key: 'calculations', label: 'Scientific Calculations' }, { key: 'mixed', label: 'Mixed Science' }
  ];
  var QT_DIFFICULTIES = ['Beginner', 'Intermediate', 'GCSE Foundation', 'GCSE Higher', 'Auto'];
  var QT_LENGTHS = [5, 10, 20, 50];
  var QT_POOL_KEYS = ['biology', 'chemistry', 'physics', 'practical', 'vocabulary'];
  function qtDifficultyToTier(diff) { return { Beginner: 1, Intermediate: 2, 'GCSE Foundation': 3, 'GCSE Higher': 4 }[diff] || 2; }
  function qtLevelToTier(level) { level = level || 1; if (level <= 15) return 1; if (level <= 30) return 2; if (level <= 45) return 3; return 4; }
  function qtTierToLevel(tier) { return { 1: 8, 2: 23, 3: 38, 4: 52 }[tier] || 23; }
  function qtQuestionForType(typeKey, tier) {
    var level = qtTierToLevel(tier);
    if (typeKey === 'calculations') return generateCalc();
    if (typeKey === 'mixed') { var pool = pick(QT_POOL_KEYS.concat(['calc'])); return pool === 'calc' ? generateCalc() : generateFromBank(pool, level, TOPIC_LABELS[pool]); }
    return generateFromBank(typeKey, level, TOPIC_LABELS[typeKey]);
  }
  function buildQuickTest(typeKey, difficulty, length, userLevel) {
    var tier = difficulty === 'Auto' ? qtLevelToTier(userLevel || 1) : qtDifficultyToTier(difficulty);
    var out = []; for (var i = 0; i < (length || 10); i++) out.push(qtQuestionForType(typeKey, tier));
    return out;
  }
  function generateDailyChallenge(userLevel) {
    var tier = qtLevelToTier(userLevel || 1);
    var mix = ['biology', 'chemistry', 'physics', 'practical', 'vocabulary', 'calculations', 'biology', 'calculations'];
    var out = []; for (var i = 0; i < 8; i++) out.push(qtQuestionForType(mix[i % mix.length], tier));
    return out;
  }
  function checkAnswer(q, input) {
    if (q.type === 'calc') { var v = parseFloat(String(input == null ? '' : input).trim().replace(',', '.')); return isFinite(v) && Math.abs(v - q.answer) < 0.05; }
    var norm = function (s) { return (s || '').toLowerCase().trim().replace(/[^a-z0-9 ]/g, ''); };
    return norm(input) === norm(q.answer);
  }

  /* ---- LESSONS (Learn screens, deep long-form chapters) -------------- */
  var LESSONS = {
    biology: {
      title: 'Biology',
      intro: 'Biology is the study of living things — from the tiny cells that make up your body to entire ecosystems. GCSE Biology builds from cell structure up to genetics, evolution and ecology.',
      origin: 'Cell theory — the idea that all living things are made of cells, and cells only come from existing cells — wasn\u2019t established until the 1830s-50s, built on improvements in microscope quality that finally let scientists like Schleiden, Schwann and Virchow actually see cellular structure clearly. Darwin\u2019s theory of evolution by natural selection (1859) unified biology as a science by explaining WHY organisms are structured the way they are, not just describing what exists — before Darwin, the incredible diversity and "fit" of organisms to their environments had no unifying scientific explanation.',
      sections: [
        { heading: 'Why Cells Are the Universal Unit of Life', body: 'Every known living thing — from bacteria to blue whales — is built from cells, and this universality is itself strong evidence for a shared evolutionary origin (all life descending from a common ancestor). Specialisation is the key organising idea above the cell level: cells differentiate into specific types (nerve, muscle, red blood cell) that group into tissues, which group into organs, which group into organ systems — each level of organisation only makes sense in light of the division of labour it enables.' },
        { heading: 'Enzymes: Why Shape Is Everything', body: 'Enzymes are biological catalysts whose function depends entirely on a precisely-shaped "active site" that fits only specific molecules — like a lock and key (or, more accurately per modern models, an "induced fit" where the enzyme flexes slightly around its target). This is why body temperature and pH matter so much: heat above the optimum permanently distorts (denatures) the enzyme\u2019s shape, destroying its function irreversibly — a single degree Celsius of fever can already start reducing enzyme efficiency in the body.' },
        { heading: 'Homeostasis: The Body\u2019s Constant Balancing Act', body: 'Homeostasis — keeping internal conditions like temperature, blood glucose and water balance stable — relies on negative feedback loops: a change is detected, and the body responds in the OPPOSITE direction to correct it, then stops responding once balance is restored. Insulin and glucagon are the textbook example: insulin lowers blood glucose when it rises too high (after eating), glucagon raises it when it falls too low (between meals) — diabetes is fundamentally a breakdown in this specific feedback system.' },
        { heading: 'Natural Selection Is Simpler Than It Sounds', body: 'Darwin\u2019s theory rests on just a few observable facts: organisms produce more offspring than the environment can support; individuals vary in their inherited traits; some variations make survival and reproduction more likely; and those advantageous traits become more common in the population over generations. Crucially, natural selection doesn\u2019t act with foresight or intention — it simply means that whatever traits happen to help survival and reproduction in a GIVEN environment become more common, which is why the same species can evolve in very different directions in different environments.' }
      ],
      misconceptions: [
        { myth: 'Evolution means an individual organism changes and adapts during its lifetime.', reality: 'Natural selection acts on populations across generations, via inherited traits — an individual\u2019s own traits don\u2019t change through selection.' },
        { myth: 'Enzymes get "used up" performing a reaction, like a reactant.', reality: 'Enzymes are catalysts — they speed up a reaction and are chemically unchanged afterward, ready to catalyse again.' },
        { myth: 'Homeostasis means keeping the body completely unchanging.', reality: 'It means keeping conditions within a narrow OPTIMAL range via constant small corrections, not preventing any change at all.' }
      ],
      expertNotes: [
        'Biologists distinguish genotype (genetic makeup) from phenotype (observable trait) precisely because environment also shapes how a genotype is expressed.',
        'Evolutionary biologists stress that natural selection has no "goal" — traits persist because they work in a given environment, not because they\u2019re objectively "better."',
        'Clinicians monitor core body temperature closely in illness specifically because enzyme function (and therefore nearly every bodily process) is temperature-sensitive.'
      ],
      examples: [{ q: 'What controls entry/exit of substances in a cell?', working: 'The cell membrane is partially permeable', answer: 'Cell membrane' }, { q: 'What organelle releases energy via aerobic respiration?', working: 'This happens in the mitochondria', answer: 'Mitochondria' }, { q: 'What hormone lowers blood glucose?', working: 'Produced by the pancreas', answer: 'Insulin' }]
    },
    chemistry: {
      title: 'Chemistry',
      intro: 'Chemistry studies matter — what it\u2019s made of, how it\u2019s structured, and how it changes. GCSE Chemistry covers atomic structure, bonding, reactions and organic chemistry.',
      origin: 'Modern atomic theory only reached its current form in the early 20th century — J.J. Thomson discovered the electron in 1897, Ernest Rutherford\u2019s famous 1909 gold-foil experiment revealed that atoms are mostly empty space with a tiny dense nucleus, and Niels Bohr proposed electrons orbit in fixed energy shells in 1913. The periodic table itself predates this atomic model: Dmitri Mendeleev arranged elements by observed chemical properties in 1869, leaving deliberate gaps for undiscovered elements — his predictions were later confirmed almost exactly once those elements were found, a striking early validation of the table\u2019s underlying logic even before anyone understood WHY it worked (electron shell structure).',
      sections: [
        { heading: 'Why the Periodic Table Is Arranged the Way It Is', body: 'Elements are ordered by atomic number (proton count), but arranged into COLUMNS (groups) by outer-shell electron count, because it\u2019s specifically the outer-shell electrons that determine how an atom bonds and reacts chemically. This is why Group 1 metals (one outer electron, easily lost) are all highly reactive in a similar way, and why Group 0 noble gases (a full outer shell) are all almost completely unreactive — the table is really a periodic table of electron configurations, with chemical properties as the visible consequence.' },
        { heading: 'Ionic vs Covalent: Two Solutions to the Same Problem', body: 'Atoms bond because having a full outer electron shell is more stable — ionic bonding achieves this by fully transferring electrons (a metal atom loses electrons to become a positive ion, a non-metal gains them to become negative, and the opposite charges attract), while covalent bonding achieves it by SHARING electron pairs between non-metal atoms rather than transferring them outright. This is why ionic compounds tend to form hard, high-melting-point crystal lattices (strong electrostatic attraction throughout the structure) while covalent substances range from gases to giant structures like diamond, depending on whether the sharing forms small molecules or one continuous network.' },
        { heading: 'Acids, Alkalis and Neutralisation as Ion Exchange', body: 'The pH scale reflects the concentration of hydrogen ions (H⁺) in a solution — acids release H⁺ ions, alkalis release hydroxide ions (OH⁻), and neutralisation is fundamentally these two ions combining to form water (H⁺ + OH⁻ → H₂O), with the leftover metal and non-metal ions forming a salt. This ionic-level explanation is why neutralisation always follows the same basic pattern regardless of which specific acid and alkali are used — the "salt + water" outcome is a direct consequence of the ion chemistry, not a coincidence.' },
        { heading: 'Organic Chemistry: Why Carbon Is Special', body: 'Carbon can form four strong covalent bonds and link to other carbon atoms in long chains, branches and rings — a versatility almost no other element matches, which is why carbon-based (organic) chemistry alone accounts for millions of known compounds, from simple methane to complex proteins and plastics. Homologous series like the alkanes (CnH2n+2) show a clear pattern: each additional carbon and matching hydrogens changes physical properties (boiling point, viscosity) predictably and gradually, which is exactly how crude oil fractional distillation separates it into fuels of different chain lengths.' }
      ],
      misconceptions: [
        { myth: 'The periodic table is arranged mainly by element mass.', reality: 'It\u2019s arranged by atomic number (proton count) — mass roughly correlates but isn\u2019t the organising principle, which is why some historical mass-based orderings had inconsistencies later fixed by using atomic number instead.' },
        { myth: 'Ionic and covalent bonding are two completely unrelated processes.', reality: 'Both are ultimately solutions to the same goal — achieving a stable full outer electron shell — just achieved by transferring electrons versus sharing them.' },
        { myth: 'A catalyst changes the products of a reaction.', reality: 'A catalyst only changes the RATE of a reaction (by lowering activation energy) — it does not alter what products form or the overall energy change.' }
      ],
      expertNotes: [
        'Chemists predict an unfamiliar element\u2019s reactivity primarily from its group (outer-shell electron count) before consulting any other data.',
        'Industrial chemists choose catalysts specifically to speed up desired reactions at lower temperatures, reducing energy costs at scale.',
        'Forensic and analytical chemists use flame tests and chromatography as fast, low-cost first-pass identification tools before more precise instrumental analysis.'
      ],
      examples: [{ q: 'What is formed when an acid neutralises an alkali?', working: 'Acid + Alkali \u2192 Salt + Water', answer: 'A salt and water' }, { q: 'What type of bond forms between a metal and non-metal?', working: 'Electrons transfer, forming ions', answer: 'Ionic bond' }, { q: 'What is the Mr of CO\u2082? (C=12, O=16)', working: '12 + (16\u00d72) = 12+32', answer: '44' }]
    },
    physics: {
      title: 'Physics',
      intro: 'Physics explains how energy, forces and matter behave — from electric circuits to the motion of planets. GCSE Physics blends conceptual understanding with calculation.',
      origin: 'Much of GCSE Physics traces to two towering shifts in scientific history: Isaac Newton\u2019s laws of motion and gravitation (1687), which for the first time described both falling apples and orbiting planets with the SAME mathematical rules, and the 19th-20th century unification of electricity, magnetism and light into electromagnetic theory (Faraday, Maxwell), followed by the still-more-radical discovery that atoms themselves have internal structure and can undergo radioactive decay (Becquerel, the Curies, Rutherford, around 1896-1911).',
      sections: [
        { heading: 'Newton\u2019s Laws: Force as the Cause of Change', body: 'Newton\u2019s First Law states an object\u2019s motion only changes if an unbalanced (resultant) force acts on it — a genuinely counter-intuitive idea, since everyday experience (friction constantly slowing things down) makes "things naturally come to rest" feel obvious. The insight that rest and constant-velocity motion are physically equivalent states (both require zero resultant force) took centuries to establish and remains one of physics\u2019 most important reframes of common intuition.' },
        { heading: 'Energy Conservation: The Universe\u2019s Strictest Rule', body: 'The principle that energy cannot be created or destroyed, only transferred between stores or converted between forms, is one of the most rigorously tested laws in all of science — no confirmed exception has ever been found. This is why "energy efficiency" calculations always frame waste as energy transferred to a LESS useful store (usually heat dissipated to the surroundings) rather than energy disappearing — the total energy is always conserved, just spread into forms that are harder to usefully recover.' },
        { heading: 'Circuits: Why Ohm\u2019s Law Works the Way It Does', body: 'Resistance is fundamentally a measure of how much a component impedes the flow of charge-carrying electrons — a wire\u2019s atoms vibrate and collide with moving electrons, converting some electrical energy to heat and limiting current for a given voltage. This microscopic picture explains a genuinely useful GCSE fact: resistance increases with temperature in most conductors, because hotter atoms vibrate more and collide with flowing electrons more often, which is exactly why a filament lamp\u2019s resistance rises as it heats up during use.' },
        { heading: 'Radioactivity and Half-Life: Randomness at the Atom, Predictability at Scale', body: 'Radioactive decay of any SINGLE unstable nucleus is genuinely random — there is no way to predict exactly when it will decay. Yet across a large sample of billions of atoms, decay follows an extremely precise statistical pattern (half-life), the same way you can\u2019t predict one coin flip but can predict that ~50% of a million flips will land heads. This individual-randomness-but-population-predictability pattern is a recurring, important idea across physics, not unique to radioactivity.' }
      ],
      misconceptions: [
        { myth: 'A moving object needs a constant force to keep moving at constant speed.', reality: 'Newton\u2019s First Law: a resultant force is only needed to CHANGE motion — constant velocity in a straight line needs zero resultant force (friction is what usually creates the illusion otherwise).' },
        { myth: 'Energy gets "used up" and disappears in an inefficient process.', reality: 'Energy is always conserved — inefficiency means energy transfers into a less USEFUL form (usually heat), not that it vanishes.' },
        { myth: 'You can predict exactly when a specific radioactive atom will decay if you study it closely enough.', reality: 'Individual radioactive decay is fundamentally random — only statistical behaviour across large numbers of atoms (half-life) is predictable.' }
      ],
      expertNotes: [
        'Engineers design circuits accounting for resistance changing with temperature, not treating resistance as a fixed constant.',
        'Physicists distinguish "no force" from "balanced forces" carefully — both produce zero resultant force and identical motion, a frequent exam distinction.',
        'Radiographers and nuclear engineers plan around half-life statistically (population decay curves), never around predicting individual atomic events.'
      ],
      examples: [{ q: 'A circuit has V=12V, R=4\u03a9. What is the current?', working: 'I = V\u00f7R = 12\u00f74', answer: '3A' }, { q: 'What type of wave is light?', working: 'Vibrates perpendicular to travel direction', answer: 'Transverse' }, { q: 'What force keeps satellites in orbit?', working: 'Gravitational attraction provides centripetal force', answer: 'Gravity' }]
    },
    practical: {
      title: 'Practical Skills',
      intro: 'GCSE Science has required practicals you must understand — not just the results, but the method, variables, and how to evaluate the experiment\u2019s reliability and accuracy.',
      origin: 'The formal distinction between "accuracy" and "precision," and the structured independent/dependent/control variable framework used in school science, comes directly from the scientific method as it developed through the 17th-century Royal Society and later formalised statistical thinking (notably Ronald Fisher\u2019s work on experimental design in the 1920s-30s) — the emphasis on controlling variables and repeating trials exists because early scientists repeatedly found that uncontrolled, single-shot experiments produced results that couldn\u2019t be trusted or reproduced by others.',
      sections: [
        { heading: 'Why "Fair Test" Is a Precise Technical Idea', body: 'A fair test isn\u2019t just "being careful" — it specifically means changing ONLY the independent variable while holding every other relevant control variable constant, so that any change in the dependent variable can be attributed to the independent variable alone. Miss a control variable (e.g. not keeping temperature constant in a reaction-rate experiment) and the entire experiment becomes uninterpretable, because you can no longer tell which variable actually caused the observed change.' },
        { heading: 'Accuracy vs Precision: A Critical GCSE Distinction', body: 'Accuracy means how close a measurement is to the TRUE value; precision means how consistent repeated measurements are with EACH OTHER, regardless of whether they\u2019re close to the truth. A miscalibrated instrument can give highly precise (tightly clustered) but inaccurate (systematically wrong) readings every time — which is why calibration checks matter even when repeated results look reassuringly consistent.' },
        { heading: 'Why Repeats and Means Matter More Than One "Good" Result', body: 'A single measurement can\u2019t distinguish real experimental effect from random error or a one-off anomaly — repeating a measurement and taking a mean averages out random fluctuation, while comparing repeats against each other helps identify a genuine anomaly (a result inconsistent with the others) to exclude before calculating that mean. This is why examiners specifically reward "repeat and take a mean" as a method improvement, rather than just "be more careful."' },
        { heading: 'Evaluating an Experiment Like a Scientist', body: 'A strong evaluation doesn\u2019t just say "there could be human error" — it identifies a SPECIFIC source of error (e.g. reaction time starting/stopping a stopwatch, parallax error reading a scale at an angle), estimates its likely effect on the result, and proposes a specific, practical improvement (e.g. use a light gate instead of a stopwatch to remove human reaction-time error entirely).' }
      ],
      misconceptions: [
        { myth: 'A precise (consistent) set of results must also be accurate.', reality: 'Precision and accuracy are independent — a systematic error can produce very consistent results that are all equally wrong.' },
        { myth: '"There could have been human error" is a sufficient evaluation of an experiment.', reality: 'A strong evaluation names a SPECIFIC error source and its likely effect, then proposes a specific, practical fix.' },
        { myth: 'Repeating an experiment just means doing it more times for more data.', reality: 'The real purpose is to check reliability, identify anomalies to exclude, and calculate a more trustworthy mean.' }
      ],
      expertNotes: [
        'Researchers pre-register which variables will be controlled BEFORE running an experiment, specifically to prevent unconsciously adjusting the method after seeing early results.',
        'Lab technicians calibrate instruments against a known standard regularly, since precise-but-uncalibrated equipment can silently produce accurate-looking but wrong data.',
        'A well-written evaluation is judged on SPECIFICITY of error source and improvement, not on listing as many possible errors as can be imagined.'
      ],
      examples: [{ q: 'What is the variable you deliberately change called?', working: 'This is the one YOU control', answer: 'Independent variable' }, { q: 'Why repeat an experiment 3 times?', working: 'To check for anomalies and calculate a reliable mean', answer: 'To improve reliability' }]
    },
    vocabulary: {
      title: 'Scientific Vocabulary',
      intro: 'Precise scientific vocabulary is essential for GCSE marks — examiners look for exact terms, not vague descriptions.',
      origin: 'Standardised scientific vocabulary emerged specifically to eliminate the ambiguity of everyday language — words like "theory" mean something very different in science (a well-evidenced explanatory framework, like the theory of evolution) than in casual speech ("just a theory," meaning a guess), and this precision requirement is exactly why GCSE mark schemes are strict about exact terminology rather than accepting a "close enough" everyday description.',
      sections: [
        { heading: 'Element, Compound, Mixture: A Precise Hierarchy', body: 'These three terms describe a precise chemical hierarchy, not loosely interchangeable synonyms: an element contains only one type of atom (defined by proton number), a compound is two or more elements chemically bonded in a FIXED ratio (creating a genuinely new substance with new properties), and a mixture is two or more substances NOT chemically bonded, meaning they retain their individual properties and can be separated by physical methods (filtering, evaporating) rather than a chemical reaction.' },
        { heading: 'Genotype vs Phenotype: Genetic Code vs Visible Outcome', body: 'Genotype refers specifically to the genetic information itself (which alleles an organism carries), while phenotype refers to the observable characteristic that results — and critically, phenotype is often influenced by environment as well as genotype (identical genotype, different environment, can produce a different phenotype), which is why the distinction matters for understanding inheritance versus environmental effects.' },
        { heading: 'Physical vs Chemical Change: A Testable Distinction', body: 'The precise test for this distinction is whether a NEW substance forms: physical changes (melting, dissolving, changing state) rearrange existing particles without forming new substances and are usually reversible, while chemical changes form genuinely new substances with different properties (via bond-breaking and bond-forming) and are often difficult or impossible to reverse by physical means alone.' },
        { heading: 'Why Precise Definitions Earn Marks', body: 'GCSE mark schemes typically require the SPECIFIC mechanism in a definition, not just a correct-sounding description — "catalyst: speeds up a reaction" earns partial credit, but "catalyst: speeds up a reaction without being used up/chemically unchanged at the end" earns full marks, because the second version captures the precise scientific meaning that distinguishes a catalyst from, say, simply adding more reactant.' }
      ],
      misconceptions: [
        { myth: 'A "theory" in science is just an unproven guess.', reality: 'A scientific theory is a well-evidenced explanatory framework, tested extensively and not contradicted by available evidence — a much stronger claim than an everyday "theory."' },
        { myth: 'Mixture and compound are basically interchangeable words for "combination."', reality: 'A compound is chemically bonded in a fixed ratio, forming new properties; a mixture is not chemically bonded and can be separated physically.' },
        { myth: 'Getting the gist of a definition right is as good as using the precise term.', reality: 'GCSE mark schemes specifically reward the exact mechanism/wording, since vague-but-correct-sounding answers often miss the precise scientific distinction being tested.' }
      ],
      expertNotes: [
        'Examiners are trained to award marks based on precise mechanism language, which is why memorising exact definitions (not just "getting the idea") measurably improves exam scores.',
        'Scientists use standardised vocabulary specifically so that findings can be communicated unambiguously across labs, languages and countries.',
        'When revising, testing yourself on giving the FULL precise definition (not just recognising the term) closely mirrors what exams actually assess.'
      ],
      examples: [{ q: 'Two elements chemically bonded together form a...', working: 'Fixed ratio, chemically joined', answer: 'Compound' }, { q: 'What speeds up a reaction without being used up?', working: 'Lowers activation energy, unchanged at the end', answer: 'Catalyst' }]
    },
    calculations: {
      title: 'Scientific Calculations',
      intro: 'Many GCSE Science marks come from applying formulas correctly. Always write the equation first, substitute values, then calculate — showing your method earns method marks even with an arithmetic slip.',
      origin: 'The formulaic, equation-driven style of physics and chemistry calculations reflects a deliberate historical shift toward quantitative, mathematical description of nature — before the 17th-century Scientific Revolution (Galileo, Newton), natural philosophy was mostly qualitative description; Galileo\u2019s insistence on measuring and mathematically modelling motion (rather than just describing it) is often credited as the pivotal shift that made modern quantitative physics, and eventually chemistry, possible.',
      sections: [
        { heading: 'Why "Show Your Method" Earns Marks Even When Wrong', body: 'GCSE mark schemes award method marks separately from the final accuracy mark specifically because examiners want to distinguish a genuine conceptual misunderstanding (not knowing which equation applies) from a simple arithmetic slip (using the right equation but making a calculation error) — writing the equation and substitution clearly, even with a wrong final number, typically secures most of the available marks.' },
        { heading: 'Units Are Not Decoration — They\u2019re Part of the Answer', body: 'A numerical answer without correct units is often marked wrong even if the number itself is correct, because the unit specifies WHAT was actually calculated — "12" alone is meaningless, but "12 m/s" is a complete, checkable physical quantity. Unit conversion errors (forgetting to convert cm to m, or g to kg, before substituting into a formula) are one of the most common sources of an otherwise-correct method producing a wrong final answer.' },
        { heading: 'Rearranging Equations: One Skill, Many Formulas', body: 'Nearly every GCSE science formula (speed=distance/time, V=IR, F=ma) can be asked for any of its variables — the core transferable skill is rearranging the SAME equation to solve for a different unknown, not memorising a separate formula for each direction. A reliable method is the "formula triangle": covering the unknown quantity reveals whether the remaining two values should be multiplied or divided to find it.' },
        { heading: 'Why These Specific Equations Recur Across Topics', body: 'Many science formulas share the same underlying mathematical STRUCTURE (a rate = amount ÷ time pattern appears in speed, reaction rate, and radioactive count rate; a "quantity = mass ÷ something" pattern appears in density and moles) — recognising these recurring patterns across different topics makes new formulas feel familiar rather than being memorised as isolated, unconnected facts.' }
      ],
      misconceptions: [
        { myth: 'Getting the final number right is all that matters in a calculation question.', reality: 'Method marks are awarded for correct equation and substitution even with an arithmetic error — showing your working is a genuine scoring strategy, not just good practice.' },
        { myth: 'Units can be added at the end without needing to think about them during the calculation.', reality: 'Unit conversion errors mid-calculation (cm vs m, g vs kg) are a leading cause of wrong final answers despite a correct method.' },
        { myth: 'Each new formula is a completely separate thing to memorise.', reality: 'Many formulas share the same underlying rate/ratio structure — recognising the pattern makes new equations far easier to learn and rearrange.' }
      ],
      expertNotes: [
        'Examiners are specifically trained to award partial method marks, which is why science teachers drill "always write the equation first" as an exam technique, not just good habit.',
        'Physicists instinctively unit-check an answer (does "12" make sense as metres, or should it be metres per second?) as a fast error-detection habit.',
        'Recognising recurring formula structures (rate = amount ÷ time) is a technique explicitly taught to help students transfer calculation skill across topics rather than treating each as isolated.'
      ],
      examples: [{ q: 'Object of mass 20kg accelerates at 3m/s\u00b2. Force?', working: 'F = ma = 20\u00d73', answer: '60N' }, { q: '88g of CO\u2082 (Mr=44). How many moles?', working: 'moles = mass\u00f7Mr = 88\u00f744', answer: '2 mol' }]
    }
  };

  /* ---- FORMULA / REFERENCE LIBRARY ----------------------------------------- */
  var FORMULAS = [
    { topic: 'Physics', name: 'Speed', formula: 'speed = distance \u00f7 time', when: 'Any motion calculation.', example: '120m in 20s: 120\u00f720 = 6 m/s', tip: 'Units must match: metres and seconds give m/s.' },
    { topic: 'Physics', name: 'Density', formula: 'density = mass \u00f7 volume', when: 'Identifying/comparing materials, required practical.', example: '80g in 20cm\u00b3: 80\u00f720 = 4 g/cm\u00b3', tip: 'Common units: g/cm\u00b3 for small objects, kg/m\u00b3 for large ones.' },
    { topic: 'Physics', name: 'Newton\u2019s Second Law', formula: 'F = m \u00d7 a', when: 'Force needed to accelerate a mass.', example: '10kg at 2m/s\u00b2: 10\u00d72 = 20N', tip: 'F is the resultant (net) force, not any single force.' },
    { topic: 'Physics', name: 'Weight', formula: 'W = m \u00d7 g', when: 'Weight is a force due to gravity (g\u224810 N/kg on Earth).', example: '5kg: 5\u00d710 = 50N', tip: 'Weight changes with gravity; mass does not.' },
    { topic: 'Physics', name: 'Ohm\u2019s Law', formula: 'V = I \u00d7 R', when: 'Relating voltage, current and resistance in a circuit.', example: 'I=3A, R=4\u03a9: 3\u00d74 = 12V', tip: 'Rearrange: I=V/R or R=V/I depending what\u2019s asked.' },
    { topic: 'Physics', name: 'Electrical Power', formula: 'P = V \u00d7 I', when: 'Power used by an electrical device.', example: '230V, 2A: 230\u00d72 = 460W', tip: 'Also P=I\u00b2R and P=V\u00b2/R are useful alternate forms.' },
    { topic: 'Physics', name: 'Kinetic Energy', formula: 'KE = \u00bd \u00d7 m \u00d7 v\u00b2', when: 'Energy of a moving object.', example: '2kg at 10m/s: 0.5\u00d72\u00d710\u00b2 = 100J', tip: 'Velocity is squared — doubling speed quadruples KE.' },
    { topic: 'Physics', name: 'Wave Speed', formula: 'v = f \u00d7 \u03bb', when: 'Any wave (sound, light, water).', example: 'f=5Hz, \u03bb=2m: 5\u00d72 = 10 m/s', tip: '\u03bb (lambda) = wavelength, f = frequency in Hz.' },
    { topic: 'Physics', name: 'Efficiency', formula: 'efficiency = (useful output \u00f7 total input) \u00d7 100%', when: 'How much energy is usefully transferred (not wasted).', example: '80J useful from 100J input: (80\u00f7100)\u00d7100 = 80%', tip: 'No real device reaches 100% — some energy is always wasted as heat/sound.' },
    { topic: 'Chemistry', name: 'Relative Formula Mass', formula: 'Mr = sum of relative atomic masses in the formula', when: 'Any quantitative chemistry question.', example: 'H\u2082O: (1\u00d72)+16 = 18', tip: 'Multiply the atomic mass by the number of each atom shown in the formula.' },
    { topic: 'Chemistry', name: 'Moles', formula: 'moles = mass \u00f7 Mr', when: 'Converting between mass and amount of substance.', example: '36g of Mr=18: 36\u00f718 = 2 mol', tip: 'Rearrange: mass = moles \u00d7 Mr.' },
    { topic: 'Chemistry', name: 'Concentration', formula: 'concentration = moles \u00f7 volume (dm\u00b3)', when: 'Solutions in required practicals (e.g. titrations).', example: '0.5mol in 2dm\u00b3: 0.5\u00f72 = 0.25 mol/dm\u00b3', tip: '1 dm\u00b3 = 1 litre = 1000 cm\u00b3 — convert cm\u00b3 to dm\u00b3 by \u00f71000.' },
    { topic: 'Biology', name: 'Magnification', formula: 'magnification = image size \u00f7 actual size', when: 'Microscopy and cell measurements.', example: 'Image 5mm, actual 0.05mm: 5\u00f70.05 = \u00d7100', tip: 'Keep image and actual size in the same units before dividing.' },
    { topic: 'Biology', name: 'Rate of Reaction (Enzymes)', formula: 'rate = amount of product (or substrate used) \u00f7 time', when: 'Enzyme practicals (e.g. amylase breaking down starch).', example: '20cm\u00b3 gas in 40s: 20\u00f740 = 0.5 cm\u00b3/s', tip: 'A steeper graph line means a faster reaction rate.' },
    { topic: 'Constants & Units', name: 'Key SI units', formula: 'mass=kg, length=m, time=s, current=A, temperature=K', when: 'Always check you\u2019re using base SI units before calculating.', example: 'Convert 250g \u2192 0.25kg before using F=ma', tip: 'Convert cm\u2192m (\u00f7100) and g\u2192kg (\u00f71000) before substituting into equations.' },
    { topic: 'Constants & Units', name: 'Gravitational field strength (Earth)', formula: 'g \u2248 10 N/kg (or 9.8 N/kg)', when: 'Weight calculations near Earth\u2019s surface.', example: 'Used in W=mg', tip: 'GCSE exams usually state which value of g to use — check the question.' }
  ];

  function generate(topicKey, level) {
    if (topicKey === 'calculations') return generateCalc();
    return generateFromBank(topicKey, level || 1, TOPIC_LABELS[topicKey]);
  }

  root.LearningScience = {
    generate: generate, generateForLevel: generateForLevel, generateLevelSet: generateLevelSet, generatePlacementSet: generatePlacementSet,
    levelLabel: levelLabel, gradeFromLevel: gradeFromLevel, levelFromScore: levelFromScore, strongestWeakest: strongestWeakest,
    generateFromBank: generateFromBank, generateCalc: generateCalc, TOPIC_LABELS: TOPIC_LABELS,
    QT_TYPES: QT_TYPES, QT_DIFFICULTIES: QT_DIFFICULTIES, QT_LENGTHS: QT_LENGTHS,
    buildQuickTest: buildQuickTest, generateDailyChallenge: generateDailyChallenge, levelToTier: qtLevelToTier,
    checkAnswer: checkAnswer, LESSONS: LESSONS, FORMULAS: FORMULAS,
    TOPICS: [
      { key: 'biology', label: 'Biology', desc: 'Cells, genetics, ecology & the human body' },
      { key: 'chemistry', label: 'Chemistry', desc: 'Atomic structure, bonding & reactions' },
      { key: 'physics', label: 'Physics', desc: 'Energy, forces, electricity & waves' },
      { key: 'practical', label: 'Practical Skills', desc: 'Variables, method & evaluating experiments' },
      { key: 'vocabulary', label: 'Scientific Vocabulary', desc: 'Precise terms examiners look for' },
      { key: 'calculations', label: 'Scientific Calculations', desc: 'Speed, density, force, Ohm\u2019s law & moles' }
    ]
  };
})(window);

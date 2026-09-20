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
        'Real wealth is quiet — the loudest signals of money are usually the ones rented, not owned.',
        'A balance sheet tells you what is owned and what is owed — read it before you read the story built on top of it.',
        'Debt is a tool before it becomes a trap. The difference is who is paying, and by when.',
        'Sanctions and tariffs are financial weapons — used to move behaviour, not just prices.',
        'The favour that costs the giver the most is worth the most, regardless of what it is worth to you.',
      ] },
    { key: 'history', name: 'History & Culture', eyebrow: 'ENOUGH TO DISCUSS, NOT JUST RECOGNISE',
      lines: [
        'Deep knowledge of history, especially the rise and fall of empires and institutions.',
        'Art, architecture and literature — enough to discuss, not just recognise.',
        'Classical rhetoric and philosophy — Cicero, Machiavelli, Sun Tzu: the operating manuals of power.',
        'Reading the present through the past — knowing which of today’s crises are structural, and which are just noise.',
        'The Renaissance was a return to classical form, not an invention of new ideals.',
        'A revolution is rarely started by the poorest — it is usually led by the newly disappointed.',
        'Architecture is frozen power: a building’s scale tells you what its builder wanted you to feel.',
        'The victors write the first draft of history. The second draft is written by whoever outlasts them.',
      ] },
    { key: 'taste', name: 'Taste & Discernment', eyebrow: 'PALATE, NOT TRIVIA',
      lines: [
        'Wine, spirits and cigars — not trivia, but genuine palate and etiquette.',
        'Tailoring and dress — understanding fit and fabric, not just brands.',
        'Fine dining etiquette that is second nature, not performed.',
        'Restraint in taste — knowing what to leave out is as telling as what you choose.',
        'A good watch is chosen for what it says when no one is being shown it.',
        'Cologne should be noticed at a handshake’s distance, never across a room.',
        'The best-dressed man in the room is rarely the most decorated — fewer, better pieces beat more.',
        'Taste is consistency across contexts — the same standard at breakfast as at a state dinner.',
      ] },
    { key: 'conversation', name: 'Conversation', eyebrow: 'THE ROOM BEFORE THE WORDS',
      lines: [
        'The ability to ask sharp questions and actually listen.',
        'Knowing when to say nothing.',
        'Reading a room before you speak in it.',
        'Remembering what people tell you — and using it, without ever letting on that you kept it.',
        'A compliment lands harder when it is specific — anyone can say “well done.”',
        'Silence after a question is an invitation, not a failure. Let it sit before filling it.',
        'People forgive being disagreed with far more easily than being talked over.',
        'The best way to be interesting is to be interested — genuinely, not as a tactic.',
      ] },
    { key: 'foundation', name: 'Foundation', eyebrow: 'WHAT THE REST STANDS ON',
      lines: [
        'Command of language — writing and speaking with precision.',
        'Negotiation and persuasion.',
        'Restraint. The men who dominate a room rarely try to.',
        'Discipline — the standard you hold when no one is checking is the only one that is real.',
        'A promise made casually is a debt you did not mean to take on — weigh it before you say it.',
        'Consistency is what turns a reputation from an opinion into a fact.',
        'The apology that matters is the one that changes behaviour, not just the one that is said.',
        'What you tolerate, you teach people to keep doing to you.',
      ] },
  ];

  /* ---- dress code, by occasion --------------------------------------------------------- */

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

  var CATEGORIES = ['Events', 'History', 'Dining Manners'];

  /* ---- the subject test -----------------------------------------------------------------
     Distinct from the daily test above: this is a test yourself on demand, one subject at a
     time, at a difficulty you choose — Easy through Extra Hard. Every tier is its own small,
     fixed set rather than a draw from one big pool, so Easy never surfaces something written
     for Extra Hard and the reverse. Not seeded by date: run it as many times as you like. */
  var SUBJECT_TESTS = {
    money: {
      Easy: [
        { q: 'What does ‘liquidity’ mean when people talk about an asset?',
          a: ['How quickly it can be turned into cash without losing value', 'How much debt is attached to it', 'How fast its price is rising', 'How many people own it'], c: 0,
          why: 'Liquidity is about speed and price stability in conversion to cash — a house is valuable but illiquid; cash itself is the most liquid asset there is.' },
        { q: 'A company raises money by selling part of itself to investors. What is this called?',
          a: ['Equity', 'A loan', 'A bond', 'A subsidy'], c: 0,
          why: 'Equity is ownership sold for capital — the investor now owns a slice of the company rather than being owed money back.' },
        { q: 'Which of these best describes ‘leverage’ in a deal?',
          a: ['Using borrowed money to increase the size of a position', 'Negotiating from a position of strength', 'Owning a controlling stake', 'Diversifying across many assets'], c: 0,
          why: 'Leverage means using debt to control more than your own capital would allow — it multiplies gains and losses alike.' },
      ],
      Medium: [
        { q: 'Interest rates rise sharply. What typically happens to existing bond prices?',
          a: ['They fall', 'They rise', 'They stay flat', 'They only change for government bonds'], c: 0,
          why: 'Bond prices move inversely to rates — a bond paying yesterday’s lower rate is worth less once new bonds pay more.' },
        { q: 'A founder sells 40% of their company for cash but keeps control of the board. What have they actually given up?',
          a: ['A share of future profit and value, not control', 'Nothing of substance', 'Full control of the company', 'Only a symbolic stake'], c: 0,
          why: 'Control and economics are separate. Board structure decides who runs the company; the equity stake decides who is paid for it.' },
        { q: 'In geopolitics, why does control of a shipping chokepoint (like a strait) translate into economic power?',
          a: ['It lets a country tax or threaten trade that has no other route', 'It always leads to war', 'It only matters for oil', 'It has no real economic effect'], c: 0,
          why: 'A chokepoint turns geography into leverage — whoever controls it can price, delay, or deny trade that has nowhere else to go.' },
      ],
      Hard: [
        { q: 'A country’s currency is depreciating fast while its debt is denominated in a foreign currency. Why is this especially dangerous?',
          a: ['Its debt burden grows in real terms even if nothing else changes', 'It has no effect since debt is fixed', 'It automatically improves its trade balance enough to offset the risk', 'Depreciation always helps a debtor'], c: 0,
          why: 'When debt is owed in a currency you can’t print, a falling currency makes every repayment cost more in real domestic terms — this is the classic emerging-market debt trap.' },
        { q: 'A private equity firm buys a company mostly with borrowed money, then has the company itself carry that debt. What is this structure called, and what’s the strategic point?',
          a: ['A leveraged buyout — it lets the firm control a large asset with a small amount of its own capital', 'A merger — it combines two firms into one', 'A bailout — it rescues a failing company', 'An IPO — it takes the company public'], c: 0,
          why: 'In an LBO the target’s own future cash flow services the debt used to buy it — the buyer’s risk is capped near their equity slice while the upside, if it works, is leveraged many times over.' },
        { q: 'Two rival powers compete for influence over a resource-rich but politically unstable region. Why might both prefer influence over outright control?',
          a: ['Influence gets the economic benefit without the cost of governing or defending the territory', 'Influence is always weaker than control', 'Outright control is always cheaper', 'Neither benefits without full control'], c: 0,
          why: 'Direct control comes with the cost of administration, security and legitimacy. Influence — through investment, credit or alliance — can extract most of the value while leaving the liability with someone else.' },
      ],
      'Extra Hard': [
        { q: 'A central bank raises rates to fight inflation, but the same rate rise threatens to trigger a debt crisis in weaker economies pegged loosely to its currency. What is the actual trade-off it’s making?',
          a: ['Domestic price stability against exported financial instability elsewhere', 'There is no trade-off — rate rises only ever help', 'It’s choosing between inflation and unemployment domestically, nothing more', 'It’s a purely technical decision with no international effect'], c: 0,
          why: 'A reserve-currency central bank sets policy for its own economy, but the rest of the world borrows in that currency too — its cure for domestic inflation becomes tightening it never voted for, felt hardest by economies least able to absorb it.' },
        { q: 'An activist investor takes a small equity stake in a company and immediately starts publicly agitating for change. Since they don’t control the board, where does their actual leverage come from?',
          a: ['The threat of persuading other shareholders to vote with them, not the stake itself', 'Their stake is always large enough to force change directly', 'Company law requires management to obey any shareholder', 'They rely entirely on media pressure with no shareholder mechanism'], c: 0,
          why: 'A small stake is a ticket to the argument, not the vote. The real weapon is the proxy fight — convincing the shareholders who do control the vote that the current board is destroying value.' },
        { q: 'A nation offers cheap infrastructure loans to a smaller country, which later cannot repay. The lender then gains long-term operating control of the asset built. What is the actual transaction underneath the loan?',
          a: ['Debt was the mechanism; the strategic asset was always the real objective', 'It is simply a failed, well-intentioned loan', 'The borrowing country always comes out ahead', 'This only happens by accident, never by design'], c: 0,
          why: 'Sometimes financing terms are less about the interest earned than about what happens in default — the loan is the vehicle, and the port, railway or grid is the destination.' },
      ],
    },
    history: {
      Easy: [
        { q: 'Rome, Britain, Spain — what do their imperial declines have in common, in the pattern historians point to most often?',
          a: ['Overreach: their commitments grew past what their economies could sustain', 'They were all conquered by a single rival', 'They all collapsed within a decade', 'Religious conversion caused each decline'], c: 0,
          why: 'The pattern most often cited across the great empires is a frontier that costs more to hold than it returns to the centre.' },
        { q: 'What is Machiavelli’s The Prince actually a manual of?',
          a: ['How power is really held and kept, not how it ought to be', 'Christian virtue', 'Military engineering', 'Trade and commerce'], c: 0,
          why: 'It is descriptive, not moralising — which is exactly why it has stayed relevant long after the Medici it was written for are gone.' },
        { q: 'Why is the standard for art and architecture in this house ‘discuss it, not just recognise it’?',
          a: ['Recognition is a party trick; being able to argue why something is good is the real skill', 'Recognition is more useful than opinion', 'No standard is needed at all', 'Only professionals should have opinions on art'], c: 0,
          why: 'Naming the artist proves you’ve seen a photo. Explaining what makes the work good — and being willing to be argued with — proves you’ve actually looked.' },
      ],
      Medium: [
        { q: 'Sun Tzu argues the best victory is the one won without fighting. What does this actually require in practice?',
          a: ['Superior position and information, so the outcome is decided before the battle starts', 'A much larger army than the enemy', 'Moving first, always', 'Avoiding conflict entirely, even when necessary'], c: 0,
          why: 'Winning without fighting isn’t pacifism — it’s having arranged the position, intelligence and options so thoroughly that the enemy’s only rational move is to yield.' },
        { q: 'Cicero’s rhetoric still underlies most persuasive arguments today. What is the actual structure he’s known for?',
          a: ['Stating the case, presenting the evidence, and pre-empting the counterargument', 'Speaking with the loudest voice in the room', 'Appealing only to emotion', 'Repeating the claim until it’s accepted'], c: 0,
          why: 'The skeleton — claim, proof, anticipated objection answered before it’s raised — is still how a courtroom, a boardroom or an op-ed makes its case.' },
        { q: 'Reading history ‘for the mechanism, not the story’ means looking for what, specifically?',
          a: ['How the money moved, who owed whom, and what institutions actually controlled', 'Which king was most heroic', 'The most dramatic battles', 'Which century had the best architecture'], c: 0,
          why: 'The mechanism is the part that transfers to now — a court’s biography doesn’t repeat, but the incentives and constraints underneath it do.' },
      ],
      Hard: [
        { q: 'An empire’s frontier is expensive to defend but strategically ‘necessary’. What is usually the actual driver of that expansion, according to the overreach pattern?',
          a: ['Prestige and precedent compounding past the point the economics justify it', 'A genuine, calculated cost-benefit decision every time', 'Random chance', 'The wishes of the general population'], c: 0,
          why: 'Few empires expand by a single rational calculation — more often each new commitment is justified by the last one, until the accumulated frontier costs more than the centre can sustain.' },
        { q: 'Machiavelli separates how power is held from how it ‘ought’ to be held. Why does that distinction matter for reading current events?',
          a: ['It lets you predict what a self-interested actor will actually do, rather than what they claim to value', 'It means morality never matters in practice', 'It only applies to monarchies', 'It’s purely historical, with no current relevance'], c: 0,
          why: 'Public justification and private incentive are usually two different documents. Machiavelli’s use is in reading the second one, especially when it contradicts the first.' },
        { q: 'Why does Sun Tzu treat information and position as more decisive than force?',
          a: ['Because force applied in the wrong place, or too late, is wasted regardless of size', 'Because he believed armies were unnecessary', 'Because information always defeats a larger force automatically', 'Because position matters less than morale'], c: 0,
          why: 'A larger force badly positioned, or acting on stale information, loses to a smaller one that knows exactly where and when to act — size is a multiplier, not a substitute, for the other two.' },
      ],
      'Extra Hard': [
        { q: 'Two empires face the same frontier-overreach pattern, but only one survives it by contracting deliberately rather than collapsing. What does that survivor typically get right that the other doesn’t?',
          a: ['It cuts commitments before a crisis forces the cut, trading prestige for solvency early', 'It expands even faster to outrun the problem', 'It always finds a new territory to compensate', 'It relies entirely on a stronger military to hold the line'], c: 0,
          why: 'The empires that manage genuine strategic contraction — Byzantium for centuries, Britain after 1945 — chose the loss of prestige on their own terms, before the alternative was chosen for them.' },
        { q: 'Cicero’s rhetorical structure and Sun Tzu’s emphasis on position share an underlying logic. What is it?',
          a: ['Both treat the outcome as decided by preparation before the encounter, not by the encounter itself', 'Both rely on aggression as the deciding factor', 'Both assume the audience or enemy is irrational', 'Neither has anything in common'], c: 0,
          why: 'A case built and the objections pre-empted before the room hears it, and a battle won by position before a sword is drawn, are the same idea in two disciplines: the encounter reveals the outcome, it doesn’t create it.' },
        { q: 'A historian claims a modern institution’s collapse ‘has no precedent’. Using the mechanism-not-story approach, how should that claim be tested?',
          a: ['Check whether its actual incentive structure — not its surface details — matches a known pattern from history', 'Accept it, since every era is genuinely unique', 'Reject it automatically, since history always repeats exactly', 'Only trust claims made about ancient history, not modern'], c: 0,
          why: 'Surface details are always new — the personalities, the technology, the dates. The mechanism underneath (overreach, debasement, elite capture) is rarely as novel as it’s claimed to be.' },
      ],
    },
    taste: {
      Easy: [
        { q: 'You’re served red wine. How should you hold the glass?',
          a: ['By the stem', 'By the bowl', 'By the base only', 'However feels natural'], c: 0,
          why: 'By the stem, so your hand doesn’t warm the wine or leave marks on the bowl.' },
        { q: 'What’s the actual point of the standard ‘wine, spirits and cigars — not trivia, but genuine palate’?',
          a: ['Being able to actually taste and judge quality, not just recite labels', 'Memorising as many brand names as possible', 'Only drinking expensive things', 'Avoiding all opinions to seem humble'], c: 0,
          why: 'Reciting a label is trivia. Noticing what’s actually in the glass — and being able to say why it’s good or isn’t — is the discernment being asked for.' },
        { q: 'In tailoring, what should you actually be judging a jacket by?',
          a: ['Fit and fabric', 'The brand name on the label', 'The price tag', 'How many people recognise it'], c: 0,
          why: 'Fit and fabric are what a jacket is; the label is what it’s called. One survives close inspection, the other doesn’t.' },
      ],
      Medium: [
        { q: 'A cigar burns unevenly, going out on one side. What does this usually indicate?',
          a: ['It wasn’t lit evenly, or has been left sitting too long between draws', 'It’s a sign of poor tobacco quality every time', 'It means it was stored incorrectly for years', 'It has no meaning at all'], c: 0,
          why: 'An uneven burn is usually about handling in the moment — the light or the pacing — more often than the cigar itself.' },
        { q: 'What does ‘genuine palate, not performed’ mean in practice at a tasting?',
          a: ['Being willing to say a well-regarded bottle isn’t to your taste, and say why', 'Praising everything expensive automatically', 'Staying silent to avoid being wrong', 'Only trusting the opinions of experts'], c: 0,
          why: 'Performed taste agrees with the room. Genuine taste has actual, specific reasons — and is willing to disagree with the label’s reputation when the glass says otherwise.' },
        { q: 'A suit fits perfectly through the shoulders but the sleeve is slightly too long. What’s the right read?',
          a: ['Shoulders can’t be altered easily, so that’s the fit that matters most; sleeves are a simple, cheap fix', 'The suit is a bad fit overall and should be rejected', 'Sleeve length matters more than the shoulder', 'Neither can be altered, so it doesn’t matter'], c: 0,
          why: 'Shoulders are the one thing a tailor genuinely can’t move without remaking the jacket — everything else, sleeves included, is routine alteration.' },
      ],
      Hard: [
        { q: 'Two wines from the same grape and region taste noticeably different, one clearly better balanced. What is ‘balance’ actually referring to?',
          a: ['No single element — acid, tannin, fruit, alcohol — dominates the others', 'The wine has the highest alcohol content', 'The wine is the most expensive of the two', 'The wine has the strongest single flavour'], c: 0,
          why: 'Balance isn’t about intensity, it’s about proportion — a wine can be powerful and still balanced, or delicate and still unbalanced, depending on whether its parts sit together.' },
        { q: 'You’re asked to choose a cigar to pair with a particular spirit. What’s the actual principle behind pairing, rather than just matching strength to strength?',
          a: ['Finding complementary or contrasting flavour notes that neither one overwhelms', 'Always choosing the strongest cigar available', 'Matching the most expensive of each', 'There is no real principle, it’s random'], c: 0,
          why: 'A pairing that works either shares a flavour thread (say, both have a certain sweetness) or contrasts deliberately (a dry spirit cutting a rich cigar) — matching by strength alone often just cancels both out.' },
        { q: 'A jacket that was fashionable a decade ago now reads as dated, while a well-cut jacket from forty years ago still reads as sharp. What’s the actual distinction?',
          a: ['Fit and proportion age slowly; trend details (lapel width, cut fads) age fast', 'Older is always better, categorically', 'Newer is always better, categorically', 'There is no real distinction, it’s nostalgia'], c: 0,
          why: 'A jacket built on genuine proportion for the body wearing it holds up regardless of decade; one built around a passing silhouette trend is dated the moment the trend passes.' },
      ],
      'Extra Hard': [
        { q: 'A sommelier tastes a wine blind and correctly identifies the region but is uncertain of the vintage within a five-year range. What does this actually demonstrate about their skill?',
          a: ['They’re reading structural, terroir-driven traits reliably, which change less than vintage-to-vintage variation', 'They have failed the tasting entirely', 'Blind tasting has no real skill component', 'Region is easier to guess than vintage by pure chance'], c: 0,
          why: 'Terroir — soil, climate, technique — leaves a more stable signature than any single year’s weather. A five-year window on vintage while nailing the region is a genuinely strong result, not a near-miss.' },
        { q: 'A host serves a technically excellent but unfamiliar wine and the guests praise it uncertainly, unsure what to say. What is the discerning response, versus the performed one?',
          a: ['Ask a specific question about what makes it distinctive, rather than offering a generic compliment', 'Say nothing at all to avoid looking uninformed', 'Compliment it in the most elaborate language possible', 'Ask what it costs, to gauge the correct level of praise'], c: 0,
          why: 'A specific question (‘what’s driving that finish?’) signals real attention and invites the host to talk about their choice — a generic compliment signals the opposite, however polished it sounds.' },
        { q: 'Bespoke tailoring is said to be ‘built for the body, not the trend’. What does this predict about how a bespoke jacket should be judged over decades?',
          a: ['Its proportions should still flatter the same body even as fashion details around it change', 'It should be updated with new trend details every few years', 'It becomes worthless the moment the tailor’s style shifts', 'It should be judged purely on the cost of materials used'], c: 0,
          why: 'A garment cut to a body’s actual proportions, rather than a season’s silhouette, is judged the same way in year one and year thirty — the test is whether it still fits and flatters, not whether it matches this year’s cut.' },
      ],
    },
    conversation: {
      Easy: [
        { q: 'You walk into a room where you don’t know anyone. What’s the first move?',
          a: ['Read the room for thirty seconds before saying anything', 'Introduce yourself to everyone as fast as possible', 'Head straight for the most senior person present', 'Start talking about yourself to break the ice'], c: 0,
          why: 'Reading a room before you speak in it tells you more in thirty seconds than ten minutes of talking would.' },
        { q: 'What actually marks the strongest conversationalist in a room?',
          a: ['Asking sharp questions and genuinely listening to the answers', 'Having the most interesting stories', 'Talking to the largest number of people', 'Knowing the most facts'], c: 0,
          why: 'People remember how a conversation made them feel heard, not how many facts the other person recited.' },
        { q: 'Someone says something you know is factually wrong, in a social setting. What’s the first thing to weigh?',
          a: ['Whether correcting it is actually worth what it costs', 'Correcting it immediately, regardless of context', 'Correcting it as publicly and thoroughly as possible', 'Agreeing with it to avoid any friction'], c: 0,
          why: 'Knowing when to say nothing is a skill in its own right — being right in front of everyone is often the most expensive thing you can be.' },
      ],
      Medium: [
        { q: 'You’re in a negotiation and the other side goes quiet after your offer. What does the silence usually call for?',
          a: ['Waiting it out rather than filling it with a concession', 'Immediately sweetening the offer to break the silence', 'Repeating the offer, louder', 'Ending the conversation'], c: 0,
          why: 'The person who speaks first after an offer often gives something away. Silence is uncomfortable, but it isn’t a signal to negotiate against yourself.' },
        { q: 'Two people in a group are subtly disagreeing without saying so directly. What does ‘reading the room’ actually mean here?',
          a: ['Noticing the tension and choosing whether, when, and how to engage with it', 'Ignoring it, since it’s not verbalised', 'Pointing it out loudly to clear the air', 'Taking a side immediately'], c: 0,
          why: 'The words being said and the actual state of the room are often two different things — reading the second is the entire skill.' },
        { q: 'You ask someone a question and they give a short, guarded answer. What’s the better next move?',
          a: ['Let the topic go, rather than pressing on a door that’s closing', 'Ask the same question again, more directly', 'Point out that they seem evasive', 'Change the subject to something about yourself'], c: 0,
          why: 'A guarded answer is information. Pressing past it usually gets you less, not more, and it tells them something about you they’ll remember.' },
      ],
      Hard: [
        { q: 'In a negotiation, the other party keeps restating their position rather than responding to your questions. What does this usually indicate, and what should you do?',
          a: ['They may not have authority to move, or the real conversation isn’t happening at this table — probe for who does', 'They are winning and you should concede', 'They are simply rude and the deal should be abandoned', 'It’s a normal negotiating tactic that requires no response'], c: 0,
          why: 'A repeated position instead of engagement is often a sign the person across from you can’t actually move — the useful move is finding out who can, not pushing harder on someone who can’t say yes.' },
        { q: 'You’re the most knowledgeable person in the room on the topic being discussed. What does restraint actually look like here?',
          a: ['Asking questions that let others arrive at the point, rather than delivering it yourself', 'Staying completely silent regardless of the stakes', 'Correcting every inaccuracy as it’s said', 'Waiting to be asked before contributing anything'], c: 0,
          why: 'Being visibly the smartest person in the room is rarely the goal — getting the room to the right answer, with everyone feeling they got there, usually is.' },
        { q: 'A conversation partner reveals something sensitive, seemingly by accident. What’s the discerning response?',
          a: ['Note it without reacting visibly, and let them decide whether to say more', 'Immediately ask a follow-up question to get more detail', 'Point out that they probably didn’t mean to say that', 'Change the subject abruptly to spare them'], c: 0,
          why: 'Reacting visibly closes the door; abruptly changing the subject also closes it, just more awkwardly. A level response leaves the choice with them, which is where it belongs.' },
      ],
      'Extra Hard': [
        { q: 'You’re negotiating with someone who has more formal power than you but clearly needs the deal more than they’re letting on. How should that asymmetry change your approach?',
          a: ['Let your patience, not your leverage, do the work — urgency on their side will surface on its own', 'Point out their need directly to force a better price', 'Match their formal power by escalating pressure immediately', 'Ignore the asymmetry since formal power always wins'], c: 0,
          why: 'Naming someone’s hidden urgency out loud usually makes them defensive and erases your advantage. Staying patient lets their own need do the negotiating for you.' },
        { q: 'A group conversation has an unspoken hierarchy that doesn’t match the room’s formal titles. What is the actual skill in reading it correctly?',
          a: ['Noticing who the room actually defers to, and addressing that person’s concerns even when they speak last', 'Always deferring to whoever has the most senior title', 'Assuming the loudest person holds the real influence', 'Ignoring hierarchy entirely to appear neutral'], c: 0,
          why: 'Formal titles and actual influence often diverge, especially with legacy figures, key advisors or quiet founders. Missing that distinction means persuading the wrong person very effectively.' },
        { q: 'You successfully talk someone into a deal through pure pressure and clever framing, and they agree in the room. What is the actual risk with this kind of win?',
          a: ['A deal extracted rather than agreed to tends to get renegotiated or resented once the pressure is gone', 'There is no risk — an agreement is an agreement', 'The risk only applies to written contracts, not verbal ones', 'Pressure tactics always produce more durable outcomes'], c: 0,
          why: 'Persuasion that survives the room is different from pressure that only works inside it. The point of the room is to leave with a deal that holds up outside it too.' },
      ],
    },
    foundation: {
      Easy: [
        { q: '‘Command of language’ as a foundational skill mostly means what?',
          a: ['Writing and speaking with precision, not with the most words', 'Using the largest vocabulary possible', 'Speaking quickly and confidently', 'Avoiding ever using simple words'], c: 0,
          why: 'Precision beats volume — saying exactly what you mean, briefly, is the actual skill; a big vocabulary used imprecisely isn’t.' },
        { q: 'Why is restraint listed as a foundational skill rather than assertiveness?',
          a: ['The men who dominate a room rarely try to — visible effort to dominate is itself a tell', 'Restraint is simply the opposite of confidence', 'Assertiveness is never useful', 'Restraint means avoiding all conflict'], c: 0,
          why: 'Trying visibly to dominate a room is usually what costs you it. Restraint reads as control precisely because it isn’t performing control.' },
        { q: 'What is negotiation actually for, according to the standard this house sets?',
          a: ['Reaching a deal the other side will actually keep, not winning every point', 'Extracting the maximum possible concession every time', 'Ending the discussion as fast as possible', 'Avoiding any compromise'], c: 0,
          why: 'A deal squeezed out of someone who resents it gets renegotiated or broken. The point is an agreement that holds, not a scoreboard win.' },
      ],
      Medium: [
        { q: 'You need to make a written case for something important. What does ‘precision, not volume’ look like in practice?',
          a: ['Cutting every sentence that doesn’t carry weight, even if the document gets shorter', 'Adding more supporting detail so nothing can be questioned', 'Using more formal language to sound authoritative', 'Repeating the main point several times for emphasis'], c: 0,
          why: 'A shorter document that survives every sentence being challenged is stronger than a long one padded with material that doesn’t hold up.' },
        { q: 'In a negotiation, you have the stronger position but the other side doesn’t fully realise it yet. What does restraint suggest here?',
          a: ['Not spending that advantage until it’s actually needed', 'Announcing your position immediately to end the negotiation faster', 'Using the full advantage right away regardless of the relationship', 'Giving up the advantage to seem fair'], c: 0,
          why: 'An advantage spent early is an advantage the other side can now plan around. Held in reserve, it’s still working for you.' },
        { q: 'Someone challenges your argument in a meeting with a genuinely good point. What does command of language actually require here?',
          a: ['Restating their point accurately before responding to it', 'Rephrasing their point to make it easier to dismiss', 'Ignoring it and returning to your original point', 'Responding immediately to control the room'], c: 0,
          why: 'Accurately restating the other side’s point before answering it is a mark of real command — it proves you actually understood it, which makes your answer harder to dismiss and easier to trust.' },
      ],
      Hard: [
        { q: 'A negotiation is going your way, but pushing the final point risks damaging the relationship you’ll need afterward. What does restraint say to do?',
          a: ['Weigh the marginal gain against the cost to the relationship, and often stop short deliberately', 'Always take the maximum available, since the deal is what matters', 'Never push any point, to preserve the relationship entirely', 'Let the other side decide where to stop'], c: 0,
          why: 'The last few percent of a deal is often the most expensive thing you can take, once you count what it costs the relationship the deal depends on continuing.' },
        { q: 'You’re asked to persuade a sceptical audience of something true but unpopular. What does precision in language actually buy you here?',
          a: ['An argument specific enough that disagreement has to engage with the substance, not just the framing', 'An argument vague enough that nobody can disagree with it', 'An argument long enough to seem thorough', 'An argument delivered with enough confidence to override scepticism'], c: 0,
          why: 'Vague or padded language gives an audience room to reject the framing instead of the substance. Precision forces the real disagreement, if there is one, into the open.' },
        { q: 'Someone in a position of real power behaves with total restraint — no visible effort, no display. What is this restraint actually signalling to the room?',
          a: ['That they don’t need to perform power because everyone already knows they have it', 'That they lack real authority', 'That they are indifferent to the outcome', 'That the room should ignore them'], c: 0,
          why: 'Performance is for people establishing power. Someone who already has it, and knows the room knows it, has nothing to prove by performing it.' },
      ],
      'Extra Hard': [
        { q: 'You hold real leverage in a negotiation but using it openly would cost you standing with people watching, not just the counterpart. What does restraint require you to actually calculate?',
          a: ['The value of the deal against the cost of being seen exercising leverage, to an audience beyond just this negotiation', 'Only the immediate value of the deal in front of you', 'Nothing — leverage should always be used to the fullest the moment you have it', 'Whether the counterpart will notice, since only their opinion matters'], c: 0,
          why: 'A negotiation rarely happens in a vacuum — how you’re seen wielding power in one room follows you into every room afterward. The calculation includes reputation as a cost, not just the deal in front of you.' },
        { q: 'Two people make functionally the same argument in the same meeting. One is remembered as commanding, the other is forgotten. What is the most likely actual difference?',
          a: ['Precision and restraint in delivery — fewer words carrying the same weight, without visible effort to be noticed', 'The first speaker was simply louder', 'The first speaker spoke for longer', 'The first speaker used more technical jargon'], c: 0,
          why: 'Volume and length are usually noise, not signal. What tends to actually get remembered is the version that said the same thing in less space, without straining to be noticed doing it.' },
        { q: 'You’re negotiating on behalf of someone else and privately disagree with the position you’ve been told to hold. What does command of language actually require in that position?',
          a: ['Representing the position with genuine precision regardless of your private view, while raising your disagreement separately through the right channel', 'Softening the position on your own judgement, without saying so', 'Openly stating your disagreement during the negotiation itself', 'Refusing to negotiate the position at all'], c: 0,
          why: 'Precision on someone else’s behalf means representing their actual position faithfully, not your edited version of it — disagreement has its place, but it isn’t inside the negotiation you were sent to conduct.' },
      ],
    },
  };
  var SUBJECT_TEST_TIERS = ['Easy', 'Medium', 'Hard', 'Extra Hard'];

  function subjectTest(key, tier) {
    var bySubject = SUBJECT_TESTS[key];
    return (bySubject && bySubject[tier]) ? bySubject[tier].slice() : [];
  }

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
    if (!src && key === 'dining') { src = DINING; eyebrow = 'SECOND NATURE, NOT PERFORMED'; }
    if (!src) return [];

    var out = [];
    src.forEach(function (sec) {
      sec.lines.forEach(function (line, li) {
        out.push({
          eyebrow: eyebrow, title: sec.name, note: sec.note || '', text: line,
          /* Where you are inside the section as well as inside the deck: four rules under one
             heading should read as four, not as an undifferentiated run of cards. */
          step: li + 1, steps: sec.lines.length,
        });
      });
    });
    out.forEach(function (c, i) { c.n = i + 1; c.of = out.length; });
    return out;
  }

  /* ---- a subject in full, one card ------------------------------------------------------
     The five subject areas read as a short list you take in at once — four facts, not four
     cards to click through one at a time. Dining stays the deck cards() already builds: it
     is eighteen rules across five sections, not four short ones, and reads better paced. */
  function subjectFacts(key) {
    for (var i = 0; i < SUBJECTS.length; i++) if (SUBJECTS[i].key === key) {
      return { eyebrow: SUBJECTS[i].eyebrow, title: SUBJECTS[i].name, facts: SUBJECTS[i].lines.slice() };
    }
    return null;
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
    SUBJECTS: SUBJECTS, DINING: DINING,
    QUESTIONS: QUESTIONS, CATEGORIES: CATEGORIES,
    dailyQuestion: dailyQuestion, dailySet: dailySet, cards: cards, _seed: seed,
    SUBJECT_TESTS: SUBJECT_TESTS, SUBJECT_TEST_TIERS: SUBJECT_TEST_TIERS, subjectTest: subjectTest,
    subjectFacts: subjectFacts,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.GentlemenEtiquette;
})(typeof window !== 'undefined' ? window : this);

/* ============================================================================
   learning-money.js — Personal Finance / Money learning engine for the
   Learning Centre. Mirrors the Maths/Science engine shape: procedural
   generators for numeric topics, curated concept banks for conceptual
   topics, a 60-level topic-banded ladder, a placement test, a Quick Test
   builder + Daily Challenge, and a formula/reference library. Consumed by
   the DC logic class via window.LearningMoney.
   ============================================================================ */
(function (root) {
  'use strict';

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[ri(0, arr.length - 1)]; }
  function shuffle(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = ri(0, i); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function round(v, d) { var p = Math.pow(10, d == null ? 0 : d); return Math.round(v * p) / p; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ---- PROCEDURAL: BUDGETING ---------------------------------------------- */
  function qBudgeting(tier) {
    var income = ri(15, tier < 2 ? 30 : 60) * 100;
    var kind = pick(['split503020', 'leftover', 'category']);
    if (kind === 'split503020') {
      var part = pick([['needs', 50], ['wants', 30], ['savings', 20]]);
      var amt = round(income * part[1] / 100, 2);
      return { topic: 'Budgeting', topicKey: 'budgeting', type: 'calc', prompt: 'Using the 50/30/20 rule, how much of a £' + income + ' monthly income should go to ' + part[0] + '?', answer: amt, method: '£' + income + ' × ' + part[1] + '% = £' + amt };
    }
    if (kind === 'leftover') {
      var rent = ri(3, 12) * 100, bills = ri(1, 6) * 50, food = ri(1, 5) * 60;
      var left = income - rent - bills - food;
      return { topic: 'Budgeting', topicKey: 'budgeting', type: 'calc', prompt: 'Monthly income £' + income + '. Rent £' + rent + ', bills £' + bills + ', food £' + food + '. How much is left to save or spend?', answer: left, method: '£' + income + ' − £' + rent + ' − £' + bills + ' − £' + food + ' = £' + left };
    }
    var pct = pick([10, 15, 20, 25, 30]);
    var amt2 = round(income * pct / 100, 2);
    return { topic: 'Budgeting', topicKey: 'budgeting', type: 'calc', prompt: 'If you budget ' + pct + '% of a £' + income + ' income for groceries, how much is that?', answer: amt2, method: '(' + pct + '÷100) × £' + income + ' = £' + amt2 };
  }

  /* ---- PROCEDURAL: SAVING & INTEREST -------------------------------------- */
  function qSaving(tier) {
    var kind = tier < 2 ? pick(['goalTime', 'simple']) : pick(['simple', 'compound', 'goalTime']);
    if (kind === 'goalTime') {
      var goal = ri(5, 30) * 100, perMonth = ri(2, 20) * 10;
      var months = Math.ceil(goal / perMonth);
      return { topic: 'Saving', topicKey: 'saving', type: 'calc', prompt: 'You want to save £' + goal + ' by putting away £' + perMonth + ' a month. How many months will it take?', answer: months, method: '£' + goal + ' ÷ £' + perMonth + ' = ' + months + ' months' };
    }
    if (kind === 'simple') {
      var p = ri(2, 20) * 100, r = pick([1, 2, 3, 4, 5]), t = pick([1, 2, 3]);
      var interest = round(p * r * t / 100, 2);
      return { topic: 'Saving', topicKey: 'saving', type: 'calc', prompt: 'Simple interest: £' + p + ' saved at ' + r + '% per year for ' + t + ' years. How much interest is earned?', answer: interest, method: '(£' + p + ' × ' + r + ' × ' + t + ') ÷ 100 = £' + interest };
    }
    var p2 = ri(5, 30) * 100, r2 = pick([2, 3, 4, 5]), t2 = pick([2, 3]);
    var total = round(p2 * Math.pow(1 + r2 / 100, t2), 2);
    return { topic: 'Saving', topicKey: 'saving', type: 'calc', prompt: 'Compound interest: £' + p2 + ' saved at ' + r2 + '% per year for ' + t2 + ' years. Total amount? (2 d.p.)', answer: total, method: '£' + p2 + ' × (1.0' + r2 + ')^' + t2 + ' = £' + total };
  }

  /* ---- PROCEDURAL: TAXES & PAYSLIPS --------------------------------------- */
  function qTax(tier) {
    var kind = pick(['vat', 'takehome', 'band']);
    if (kind === 'vat') {
      var price = ri(5, 80) * 10;
      var withVat = round(price * 1.2, 2);
      return { topic: 'Taxes', topicKey: 'tax', type: 'calc', prompt: 'A product costs £' + price + ' before 20% VAT. What is the price including VAT?', answer: withVat, method: '£' + price + ' × 1.20 = £' + withVat };
    }
    if (kind === 'takehome') {
      var gross = ri(15, 45) * 1000;
      var taxRate = tier < 3 ? 0 : 20;
      var taxOwed = round(Math.max(0, gross - 12570) * taxRate / 100, 0);
      var takeHome = gross - taxOwed;
      return { topic: 'Taxes', topicKey: 'tax', type: 'calc', prompt: 'Annual salary £' + gross + '. Personal allowance £12,570 is tax-free; the rest is taxed at ' + taxRate + '%. What is the annual take-home pay (to nearest £)?', answer: takeHome, method: 'Taxable = £' + gross + ' − £12,570 = £' + (gross - 12570) + '; tax = ' + taxRate + '% of that = £' + taxOwed + '; take-home = £' + gross + ' − £' + taxOwed + ' = £' + takeHome };
    }
    var salary = ri(20, 60) * 1000;
    var band = salary <= 12570 ? 'No tax (Personal Allowance)' : salary <= 50270 ? 'Basic rate (20%)' : 'Higher rate (40%)';
    return { topic: 'Taxes', topicKey: 'tax', type: 'text', prompt: 'A UK salary of £' + salary + ' falls into which income tax band? (Personal Allowance / Basic rate / Higher rate)', answer: band.split(' (')[0], method: band + ' applies to income of £' + salary };
  }

  /* ---- PROCEDURAL: CONSUMER MATHS ----------------------------------------- */
  function qConsumer(tier) {
    var kind = pick(['discount', 'unitPrice', 'bestValue', 'currency']);
    if (kind === 'discount') {
      var price = ri(4, 40) * 5, pct = pick([10, 15, 20, 25, 30, 50]);
      var sale = round(price * (1 - pct / 100), 2);
      return { topic: 'Consumer Maths', topicKey: 'consumer', type: 'calc', prompt: 'An item costs £' + price + ' with a ' + pct + '% discount. What is the sale price?', answer: sale, method: '£' + price + ' × (1 − ' + (pct / 100) + ') = £' + sale };
    }
    if (kind === 'unitPrice') {
      var pack = pick([250, 500, 750, 1000]), price2 = ri(1, 6) + Math.random();
      var perUnit = round(price2 / (pack / 100), 3);
      return { topic: 'Consumer Maths', topicKey: 'consumer', type: 'calc', prompt: 'A ' + pack + 'g pack costs £' + round(price2, 2) + '. What is the price per 100g? (£, 2 d.p.)', answer: round(perUnit, 2), method: '£' + round(price2, 2) + ' ÷ (' + pack + '÷100) = £' + round(perUnit, 2) };
    }
    if (kind === 'bestValue') {
      var a = { size: 6, price: ri(2, 5) }, b = { size: 10, price: 0 };
      b.price = round(a.price * (10 / 6) * (Math.random() < 0.5 ? 0.9 : 1.1), 2);
      var aPer = a.price / a.size, bPer = b.price / b.size;
      var best = aPer < bPer ? ('Pack A (£' + a.price + ' for ' + a.size + ')') : ('Pack B (£' + b.price + ' for ' + b.size + ')');
      return { topic: 'Consumer Maths', topicKey: 'consumer', type: 'text', prompt: 'Pack A: £' + a.price + ' for ' + a.size + ' items. Pack B: £' + b.price + ' for ' + b.size + ' items. Which is better value?', answer: best.split(' (')[0], method: 'A = £' + round(aPer, 3) + '/item, B = £' + round(bPer, 3) + '/item — lower per-item price wins' };
    }
    var gbp = ri(20, 500), rate = pick([1.1, 1.25, 1.3, 1.5]);
    var usd = round(gbp * rate, 2);
    return { topic: 'Consumer Maths', topicKey: 'consumer', type: 'calc', prompt: 'Convert £' + gbp + ' to USD at an exchange rate of £1 = $' + rate + '.', answer: usd, method: '£' + gbp + ' × ' + rate + ' = $' + usd };
  }

  /* ---- PROCEDURAL: CREDIT & DEBT (numeric half) --------------------------- */
  function qCreditCalc(tier) {
    var kind = pick(['minPayment', 'aprCost']);
    if (kind === 'minPayment') {
      var balance = ri(5, 30) * 100, pct = pick([2, 3, 5]);
      var minPay = round(balance * pct / 100, 2);
      return { topic: 'Credit & Debt', topicKey: 'credit', type: 'calc', prompt: 'A credit card balance is £' + balance + '. The minimum payment is ' + pct + '% of the balance. What is the minimum payment?', answer: minPay, method: '£' + balance + ' × ' + pct + '% = £' + minPay };
    }
    var balance2 = ri(5, 20) * 100, apr = pick([18, 20, 22, 25]);
    var yearCost = round(balance2 * apr / 100, 2);
    return { topic: 'Credit & Debt', topicKey: 'credit', type: 'calc', prompt: 'A £' + balance2 + ' credit card balance is left unpaid for a year at ' + apr + '% APR. Roughly how much interest builds up?', answer: yearCost, method: '£' + balance2 + ' × ' + apr + '% ≈ £' + yearCost };
  }

  /* ---- CONCEPT BANKS (multiple-choice, curated across levels) ------------- */
  var BANKS = {
    banking: [
      { level: 3, type: 'mc', prompt: 'What is the main difference between a current account and a savings account?', options: ['Savings accounts are for everyday spending', 'Current accounts usually pay more interest', 'Savings accounts are designed to grow money over time, not daily spending', 'There is no difference'], answer: 'Savings accounts are designed to grow money over time, not daily spending', method: 'Current accounts are for everyday transactions; savings accounts are for growing money and often pay interest.' },
      { level: 6, type: 'mc', prompt: 'What does "overdraft" mean?', options: ['A type of savings bonus', 'Borrowing money by spending more than you have in your account', 'A fee for using a cash machine', 'Free money from the bank'], answer: 'Borrowing money by spending more than you have in your account', method: 'An overdraft is a short-term way of borrowing through your current account, usually with fees or interest.' },
      { level: 10, type: 'mc', prompt: 'What is a "direct debit"?', options: ['A one-time cash payment', 'An automatic, recurring payment set up to a company that can vary in amount', 'A type of loan', 'A savings account bonus'], answer: 'An automatic, recurring payment set up to a company that can vary in amount', method: 'Direct debits are commonly used for bills like utilities, where the amount can change each month.' },
      { level: 13, type: 'mc', prompt: 'What is the key difference between a "standing order" and a "direct debit"?', options: ['They are exactly the same', 'A standing order is a fixed amount you control; a direct debit lets the payee vary the amount', 'A direct debit is always smaller', 'Standing orders are only for savings'], answer: 'A standing order is a fixed amount you control; a direct debit lets the payee vary the amount', method: 'Standing orders send a fixed amount you set; direct debits authorise a company to take varying amounts.' },
      { level: 17, type: 'mc', prompt: 'What does "AER" stand for on a savings account?', options: ['Annual Equivalent Rate', 'Automatic Emergency Reserve', 'Account Extra Return', 'Average Expense Ratio'], answer: 'Annual Equivalent Rate', method: 'AER shows what the interest rate would be if paid and compounded once a year, making accounts easy to compare.' },
      { level: 22, type: 'mc', prompt: 'Why might someone choose an ISA (Individual Savings Account)?', options: ['It has higher fees', 'Interest/gains inside it are tax-free up to an annual allowance', 'It cannot be accessed', 'It only works for businesses'], answer: 'Interest/gains inside it are tax-free up to an annual allowance', method: 'ISAs shelter savings or investments from tax, up to a set yearly limit.' },
      { level: 27, type: 'mc', prompt: 'What is FSCS protection on a UK bank account?', options: ['Insurance for your car', 'Protects eligible deposits up to £85,000 per person per bank if the bank fails', 'A type of overdraft', 'A savings bonus scheme'], answer: 'Protects eligible deposits up to £85,000 per person per bank if the bank fails', method: 'The Financial Services Compensation Scheme protects depositors if a UK-authorised bank collapses.' },
      { level: 33, type: 'mc', prompt: 'What is a "current account switch"?', options: ['Closing a bank forever', 'A guaranteed service that moves your account, payments and direct debits to a new bank automatically', 'A type of loan', 'An overdraft fee'], answer: 'A guaranteed service that moves your account, payments and direct debits to a new bank automatically', method: 'The Current Account Switch Service moves everything (including direct debits) within 7 working days.' },
      { level: 40, type: 'mc', prompt: 'What is "compounding frequency" and why does it matter for savings?', options: ['It never matters', 'How often interest is calculated and added — more frequent compounding grows savings faster', 'The bank\u2019s opening hours', 'The number of branches a bank has'], answer: 'How often interest is calculated and added — more frequent compounding grows savings faster', method: 'Daily or monthly compounding earns slightly more than annual compounding at the same headline rate.' }
    ],
    credit: [
      { level: 5, type: 'mc', prompt: 'What is a "credit score" used for?', options: ['To track your spending habits publicly', 'To help lenders judge how likely you are to repay borrowed money', 'To set your salary', 'To open a savings account'], answer: 'To help lenders judge how likely you are to repay borrowed money', method: 'A credit score summarises your borrowing history to help lenders assess risk before approving credit.' },
      { level: 11, type: 'mc', prompt: 'What does APR stand for on a loan or credit card?', options: ['Annual Percentage Rate', 'Automatic Payment Request', 'Account Protection Rating', 'Average Purchase Return'], answer: 'Annual Percentage Rate', method: 'APR shows the yearly cost of borrowing, including interest and fees, as a percentage.' },
      { level: 16, type: 'mc', prompt: 'Why can only paying the "minimum payment" on a credit card be costly?', options: ['It pays off the balance instantly', 'Interest keeps building on the remaining balance, so debt can take years to clear', 'It improves your credit score fastest', 'There is no downside'], answer: 'Interest keeps building on the remaining balance, so debt can take years to clear', method: 'Minimum payments mostly cover interest, so the debt shrinks very slowly and costs much more overall.' },
      { level: 21, type: 'mc', prompt: 'What is one action that typically HURTS your credit score?', options: ['Paying bills on time', 'Missing debt repayments', 'Using a small amount of available credit', 'Being on the electoral roll'], answer: 'Missing debt repayments', method: 'Missed or late payments are one of the most damaging factors to a credit score.' },
      { level: 26, type: 'mc', prompt: 'What is "credit utilisation"?', options: ['The number of credit cards you own', 'The percentage of your available credit that you are currently using', 'Your annual salary', 'The interest rate on a loan'], answer: 'The percentage of your available credit that you are currently using', method: 'Keeping utilisation low (e.g. under 30%) generally supports a healthier credit score.' },
      { level: 32, type: 'mc', prompt: 'What is the "snowball method" for paying off multiple debts?', options: ['Pay off the largest debt first', 'Pay off the smallest debt first for quick wins, then roll payments onto the next', 'Ignore debts with the highest interest', 'Only pay minimums forever'], answer: 'Pay off the smallest debt first for quick wins, then roll payments onto the next', method: 'The snowball method builds motivation through quick wins; the "avalanche" method targets highest interest first to save more money.' },
      { level: 38, type: 'mc', prompt: 'What is a "secured" loan, as opposed to "unsecured"?', options: ['A loan with no paperwork', 'A loan backed by an asset (like a house or car) that can be repossessed if you default', 'A loan with no interest', 'A loan only for businesses'], answer: 'A loan backed by an asset (like a house or car) that can be repossessed if you default', method: 'Secured loans (e.g. mortgages) use an asset as collateral, usually allowing lower interest rates but higher risk to the borrower.' }
    ],
    investing: [
      { level: 8, type: 'mc', prompt: 'What does it mean to "diversify" an investment portfolio?', options: ['Put all your money into one stock', 'Spread money across different investments to reduce risk', 'Only invest in cash savings', 'Avoid investing altogether'], answer: 'Spread money across different investments to reduce risk', method: 'Diversification reduces the impact of any single investment performing badly.' },
      { level: 14, type: 'mc', prompt: 'Generally, which carries the highest risk (and potential reward) over the long term?', options: ['Cash savings account', 'Government bonds', 'Stocks/shares', 'Keeping cash under a mattress'], answer: 'Stocks/shares', method: 'Shares are historically more volatile but have offered higher long-term average returns than cash or bonds.' },
      { level: 19, type: 'mc', prompt: 'What is a "dividend"?', options: ['A fee charged by a stockbroker', 'A share of a company\u2019s profit paid out to shareholders', 'A type of loan', 'A government tax on investments'], answer: 'A share of a company\u2019s profit paid out to shareholders', method: 'Companies may distribute part of their profits to shareholders as dividends, usually paid per share owned.' },
      { level: 24, type: 'mc', prompt: 'What is a "bond" in simple terms?', options: ['A share of ownership in a company', 'A loan you give to a government or company that pays you interest', 'A type of bank account', 'An insurance product'], answer: 'A loan you give to a government or company that pays you interest', method: 'Bonds are essentially IOUs — the issuer promises to repay the loan plus interest over time.' },
      { level: 29, type: 'mc', prompt: 'What is an "index fund"?', options: ['A fund that picks a handful of hot stocks', 'A fund that tracks a whole market index (e.g. FTSE 100) rather than picking individual stocks', 'A savings account', 'An insurance policy'], answer: 'A fund that tracks a whole market index (e.g. FTSE 100) rather than picking individual stocks', method: 'Index funds passively mirror a market index, offering broad diversification at low cost.' },
      { level: 34, type: 'mc', prompt: 'What does "compound growth" mean for long-term investing?', options: ['Growth that resets to zero each year', 'Returns are earned not just on your original money, but on previous returns too', 'A guaranteed fixed return', 'A type of tax'], answer: 'Returns are earned not just on your original money, but on previous returns too', method: 'Compounding means gains generate their own further gains over time — the core reason to invest early.' },
      { level: 41, type: 'mc', prompt: 'What is "risk tolerance" when choosing investments?', options: ['How much tax you pay', 'How much investment value swings you can handle without panic-selling', 'The size of your salary', 'The number of banks you use'], answer: 'How much investment value swings you can handle without panic-selling', method: 'Risk tolerance depends on your timeframe, goals and comfort with short-term losses in pursuit of long-term gains.' },
      { level: 47, type: 'mc', prompt: 'What is "pound-cost averaging"?', options: ['Investing a lump sum only once', 'Investing a fixed amount regularly regardless of price, smoothing out market ups and downs', 'Only investing when prices are highest', 'A tax on investments'], answer: 'Investing a fixed amount regularly regardless of price, smoothing out market ups and downs', method: 'Regular fixed investments buy more units when prices are low and fewer when high, averaging the purchase cost.' }
    ],
    insurance: [
      { level: 7, type: 'mc', prompt: 'What is an insurance "premium"?', options: ['The payout you receive after a claim', 'The regular amount you pay for insurance cover', 'A type of savings bonus', 'A tax on your salary'], answer: 'The regular amount you pay for insurance cover', method: 'The premium is the ongoing cost (often monthly or annual) of keeping an insurance policy active.' },
      { level: 12, type: 'mc', prompt: 'What is an insurance "excess" (or deductible)?', options: ['The maximum payout ever', 'The amount you must pay yourself before the insurer pays the rest of a claim', 'A type of premium discount', 'The insurer\u2019s profit margin'], answer: 'The amount you must pay yourself before the insurer pays the rest of a claim', method: 'A higher excess usually means a lower premium, since you\u2019re covering more of small claims yourself.' },
      { level: 18, type: 'mc', prompt: 'Which type of insurance is legally required to drive a car in the UK?', options: ['Comprehensive cover', 'At least third-party insurance', 'Life insurance', 'No insurance is required'], answer: 'At least third-party insurance', method: 'UK law requires at minimum third-party cover, protecting others if you cause an accident.' },
      { level: 23, type: 'mc', prompt: 'What does "contents insurance" typically cover, as opposed to "buildings insurance"?', options: ['The physical structure of the building', 'Your personal belongings inside the home (furniture, electronics, etc.)', 'The land the house sits on', 'The mortgage itself'], answer: 'Your personal belongings inside the home (furniture, electronics, etc.)', method: 'Buildings insurance covers the structure (walls, roof); contents insurance covers what\u2019s inside it.' },
      { level: 30, type: 'mc', prompt: 'Why might someone buy income protection insurance?', options: ['To replace part of their income if they can\u2019t work due to illness or injury', 'To insure their pet', 'To cover holiday cancellations', 'To reduce their tax bill'], answer: 'To replace part of their income if they can\u2019t work due to illness or injury', method: 'Income protection provides a regular payment if you\u2019re unable to earn due to long-term illness or injury.' },
      { level: 36, type: 'mc', prompt: 'What is the general principle behind how insurance premiums are priced?', options: ['Everyone pays the same regardless of risk', 'Higher assessed risk of a claim generally means a higher premium', 'Premiums are random', 'Premiums only depend on age'], answer: 'Higher assessed risk of a claim generally means a higher premium', method: 'Insurers price premiums based on the statistical likelihood and potential cost of a claim.' }
    ]
  };

  var POOL_FN = { budgeting: qBudgeting, saving: qSaving, tax: qTax, consumer: qConsumer };
  var BANK_KEYS = ['banking', 'credit', 'investing', 'insurance'];

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
    var q = rr(poolKey, near);
    var out = { topic: topicLabel || poolKey, topicKey: poolKey, type: q.type, prompt: q.prompt, answer: q.answer, method: q.method };
    if (q.options) out.options = shuffle(q.options);
    return out;
  }
  function generateCreditQuestion(tier) { return Math.random() < 0.5 ? generateFromBank('credit', tierToLevel(tier), 'Credit & Debt') : qCreditCalc(tier); }

  var TOPIC_LABELS = { budgeting: 'Budgeting', saving: 'Saving & Interest', banking: 'Banking', credit: 'Credit & Debt', tax: 'Taxes & Payslips', investing: 'Investing', insurance: 'Insurance & Risk', consumer: 'Consumer Maths' };

  function tierToLevel(tier) { return { 1: 8, 2: 23, 3: 38, 4: 52 }[tier] || 23; }

  function questionForType(typeKey, tier) {
    var level = tierToLevel(tier);
    if (typeKey === 'budgeting') return qBudgeting(tier);
    if (typeKey === 'saving') return qSaving(tier);
    if (typeKey === 'tax') return qTax(tier);
    if (typeKey === 'consumer') return qConsumer(tier);
    if (typeKey === 'credit') return generateCreditQuestion(tier);
    if (typeKey === 'banking') return generateFromBank('banking', level, 'Banking');
    if (typeKey === 'investing') return generateFromBank('investing', level, 'Investing');
    if (typeKey === 'insurance') return generateFromBank('insurance', level, 'Insurance & Risk');
    return questionForType(pick(['budgeting', 'saving', 'banking', 'credit', 'tax', 'investing', 'insurance', 'consumer']), tier);
  }

  /* ---- LEVEL SYSTEM (1-60, topic-banded) ---------------------------------- */
  var LEVEL_BANDS = [
    { min: 1, max: 10, pools: ['budgeting'] },
    { min: 11, max: 20, pools: ['saving'] },
    { min: 21, max: 30, pools: ['banking', 'credit'] },
    { min: 31, max: 40, pools: ['tax'] },
    { min: 41, max: 50, pools: ['investing'] },
    { min: 51, max: 60, pools: ['insurance', 'consumer', 'mixed'] }
  ];
  function bandFor(level) { for (var i = 0; i < LEVEL_BANDS.length; i++) { var b = LEVEL_BANDS[i]; if (level >= b.min && level <= b.max) return b; } return LEVEL_BANDS[LEVEL_BANDS.length - 1]; }
  function tierForLevel(level) { level = level || 1; if (level <= 15) return 1; if (level <= 30) return 2; if (level <= 45) return 3; return 4; }
  function generateForLevel(level) {
    level = Math.max(1, Math.min(60, level || 1));
    var band = bandFor(level);
    var poolKey = band.pools[0] === 'mixed' ? pick(['budgeting', 'saving', 'banking', 'credit', 'tax', 'investing', 'insurance', 'consumer']) : pick(band.pools);
    var tier = tierForLevel(level);
    var q = questionForType(poolKey, tier);
    q.level = level;
    return q;
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
    n = n || 16;
    var out = [];
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
    { key: 'budgeting', label: 'Budgeting' }, { key: 'saving', label: 'Saving & Interest' }, { key: 'banking', label: 'Banking' },
    { key: 'credit', label: 'Credit & Debt' }, { key: 'tax', label: 'Taxes & Payslips' }, { key: 'investing', label: 'Investing' },
    { key: 'insurance', label: 'Insurance & Risk' }, { key: 'consumer', label: 'Consumer Maths' }, { key: 'mixed', label: 'Mixed Money Test' }
  ];
  var QT_DIFFICULTIES = ['Beginner', 'Intermediate', 'GCSE Foundation', 'GCSE Higher'];
  var QT_LENGTHS = [5, 10, 20, 50];
  function qtDifficultyToTier(diff) { return { Beginner: 1, Intermediate: 2, 'GCSE Foundation': 3, 'GCSE Higher': 4 }[diff] || 2; }
  function qtLevelToTier(level) { return tierForLevel(level); }
  function buildQuickTest(typeKey, difficulty, length, userLevel) {
    var tier = difficulty === 'Auto' ? qtLevelToTier(userLevel || 1) : qtDifficultyToTier(difficulty);
    var out = []; for (var i = 0; i < (length || 10); i++) out.push(questionForType(typeKey === 'mixed' ? pick(['budgeting', 'saving', 'banking', 'credit', 'tax', 'investing', 'insurance', 'consumer']) : typeKey, tier));
    return out;
  }
  function generateDailyChallenge(userLevel) {
    var tier = qtLevelToTier(userLevel || 1);
    var mix = ['budgeting', 'saving', 'banking', 'credit', 'tax', 'investing', 'insurance', 'consumer'];
    var out = []; for (var i = 0; i < 8; i++) out.push(questionForType(mix[i % mix.length], tier));
    return out;
  }
  function checkAnswer(q, input) {
    if (q.type === 'calc') { var v = parseFloat(String(input == null ? '' : input).trim().replace(/[£$,]/g, '')); return isFinite(v) && Math.abs(v - q.answer) < 0.5; }
    var norm = function (s) { return (s || '').toLowerCase().trim().replace(/[^a-z0-9 ]/g, ''); };
    return norm(input) === norm(q.answer);
  }

  /* ---- FORMULA / REFERENCE LIBRARY ---------------------------------------- */
  var FORMULAS = [
    { topic: 'Budgeting', name: '50/30/20 rule', formula: '50% needs · 30% wants · 20% savings/debt', when: 'Splitting take-home pay into a simple, balanced budget.', example: '£2,000 income → £1,000 needs, £600 wants, £400 savings', tip: 'Adjust the split to fit your situation — it\u2019s a starting guideline, not a strict law.' },
    { topic: 'Saving', name: 'Simple interest', formula: 'I = (P × r × t) ÷ 100', when: 'Interest that doesn\u2019t compound — the same amount each year.', example: '£500 at 4% for 3 years: (500×4×3)÷100 = £60', tip: 'Total balance = original amount (P) + interest (I).' },
    { topic: 'Saving', name: 'Compound interest', formula: 'A = P × (1 + r÷100)^t', when: 'Interest that grows on top of previous interest — most real savings/investments.', example: '£500 at 4% for 3yrs: 500×1.04³ ≈ £562.43', tip: 'Starting to save early matters more than the interest rate, thanks to compounding.' },
    { topic: 'Consumer Maths', name: 'Percentage discount', formula: 'sale price = original × (1 − discount%)', when: 'Any sale, promotion, or markdown.', example: '£80 item, 25% off: 80 × 0.75 = £60', tip: 'A 25% discount means you pay 75% of the original price, not 25%.' },
    { topic: 'Consumer Maths', name: 'Unit price', formula: 'unit price = total price ÷ quantity', when: 'Comparing value between different pack sizes.', example: '£3 for 500g = £0.006/g, or £0.60/100g', tip: 'Always compare using the SAME unit (e.g. both per 100g) before deciding what\u2019s better value.' },
    { topic: 'Taxes', name: 'VAT-inclusive price', formula: 'price with VAT = price × 1.20 (at 20% VAT)', when: 'UK standard-rate VAT on goods and services.', example: '£50 + 20% VAT = £50 × 1.20 = £60', tip: 'To find VAT already included in a price, divide by 1.20, then subtract from the total.' },
    { topic: 'Taxes', name: 'Income tax (basic UK model)', formula: 'tax = (income − personal allowance) × rate', when: 'Estimating take-home pay from a gross salary.', example: '£30,000 salary: (30,000−12,570) × 20% ≈ £3,486 tax', tip: 'The personal allowance (~£12,570) is tax-free; only income above it is taxed at each band\u2019s rate.' },
    { topic: 'Credit', name: 'Credit utilisation', formula: 'utilisation % = balance ÷ credit limit × 100', when: 'Understanding how credit card use affects your credit score.', example: '£600 balance on a £2,000 limit = 30% utilisation', tip: 'Keeping utilisation below ~30% is generally considered healthier for your credit score.' },
    { topic: 'Investing', name: 'Return on investment (ROI)', formula: 'ROI % = (gain − cost) ÷ cost × 100', when: 'Measuring how well an investment performed.', example: 'Bought for £1,000, sold for £1,150: (150÷1000)×100 = 15%', tip: 'ROI ignores the time taken — a 15% return over 10 years is very different from over 1 year.' },
    { topic: 'Investing', name: 'Rule of 72', formula: 'years to double ≈ 72 ÷ interest rate', when: 'Quick mental estimate of how long an investment takes to double.', example: 'At 6% growth: 72÷6 = 12 years to double', tip: 'A handy estimate, not exact — useful for quick comparisons between growth rates.' }
  ];

  /* ---- LESSONS (deep, long-form chapters) ----------------------------------- */
  var LESSONS = {
    budgeting: {
      title: 'Budgeting',
      intro: 'A budget is a plan for your money, decided in advance, so spending matches your priorities instead of just "running out" before the next payday.',
      origin: 'Budgeting predates currency — Babylonian farmers tracked grain stores against the coming season\u2019s needs. The modern personal budget emerged with industrial-era wage labour: once pay became a fixed, regular sum (rather than whatever a farm produced that year), families needed a system to spread it across irregular needs. The "envelope system" — dividing cash into envelopes for rent, food and savings — dates to early-20th-century household economics guides, and its core logic (separate pools of money for separate purposes) is exactly how modern apps and the 50/30/20 rule still work today.',
      sections: [
        { heading: 'Why Most Budgets Fail', body: 'Budgets rarely fail from bad arithmetic — they fail because they\u2019re built for an "average" month that never actually happens. Car repairs, birthdays, annual subscriptions and dental bills are predictable in aggregate but unpredictable in timing, so a budget with no slack gets blown by the first surprise and abandoned soon after. The fix planners use is a "sinking fund": dividing irregular annual costs (say £600/year in car maintenance) into a monthly amount (£50) saved continuously, so the "surprise" bill is already paid for when it arrives.' },
        { heading: 'Zero-Based vs 50/30/20 vs Envelope', body: 'The 50/30/20 rule (50% needs, 30% wants, 20% savings) is a fast starting template, not a law — it fits a mid-income earner with no debt reasonably well, but breaks down for someone with high rent or heavy debt repayments, where needs can exceed 50% by necessity. Zero-based budgeting assigns every pound a job (income minus all allocations must equal zero) and is more precise but more time-consuming. The envelope method (physical or digital) enforces hard spending limits per category — once an envelope is empty, spending in that category stops, which suits people who overspend on convenience or impulse.' },
        { heading: 'The Psychology of Spending', body: '"Mental accounting" — treating money differently depending on its source — explains why a £200 bonus gets spent freely while £200 of salary gets saved; the pound is identical, the psychology isn\u2019t, and a good budget works WITH this tendency (e.g. auto-labelling savings as "future holiday") rather than against it. Parkinson\u2019s Law of money says spending expands to consume whatever income is available — which is why "pay yourself first" (moving savings out on payday, before it can be spent) reliably outperforms "save whatever\u2019s left," where there is reliably nothing left.' },
        { heading: 'Building a Buffer', body: 'An emergency fund (typically 3\u20136 months of essential expenses) exists to break the debt spiral: without one, any unexpected cost gets paid for with high-interest credit, and that debt then makes the NEXT emergency harder to absorb. The buffer is deliberately kept in an easily accessible savings account rather than invested, because its job is to be there instantly when needed, not to grow — lower returns are the price of that certainty.' }
      ],
      misconceptions: [
        { myth: 'Budgeting means never spending on anything fun.', reality: 'A good budget explicitly includes a "wants" category — the goal is intentional spending, not zero spending.' },
        { myth: 'You need an expensive app or spreadsheet to budget properly.', reality: 'The envelope method has worked with literal cash envelopes for a century — the tool matters far less than checking in regularly.' },
        { myth: 'A budget is something you set once and follow forever.', reality: 'Real budgets are revised monthly as income, prices and priorities shift — treat it as a living plan, not a contract.' }
      ],
      expertNotes: [
        'Financial planners review a client\u2019s budget monthly, not annually — small drifts caught early are easy to correct; a year of drift is not.',
        'Sinking funds for irregular costs (car, gifts, annual subscriptions) are the single biggest fix for "my budget keeps breaking."',
        '"Pay yourself first" — automate the savings transfer for payday, before any spending happens.'
      ],
      examples: [{ q: '£2,000 monthly income, 50/30/20 split: how much for wants?', working: '30% of £2,000', answer: '£600' }, { q: 'Income £1,800, needs cost £1,000. Is that within the 50% guideline?', working: '50% of £1,800 = £900; £1,000 is above that', answer: 'No — needs exceed the 50% guideline' }]
    },
    saving: {
      title: 'Saving & Interest',
      intro: 'Saving is setting money aside for the future. Interest is what makes it grow — and the gap between simple and compound interest is why starting early beats almost any other financial decision.',
      origin: 'Interest is one of the oldest financial concepts on record — Mesopotamian temple-banks charged interest on grain loans over 4,000 years ago, and much of the Code of Hammurabi (c. 1750 BCE) regulates it. Compound interest specifically was well understood by the 17th century; it\u2019s often (apocryphally) attributed to Einstein as "the eighth wonder of the world," but its real origin is simple mathematics: money that earns a return, left in place, earns a return on its own return the next period — a snowballing effect formalised in banking practice centuries before modern economics existed.',
      sections: [
        { heading: 'Simple vs Compound: Why the Difference Is Huge', body: 'Simple interest always pays out on the ORIGINAL sum only — £1,000 at 5% simple interest earns exactly £50 every year, forever. Compound interest pays on the original sum PLUS all interest already earned, so year two earns interest on £1,050, not £1,000. Over short periods the difference looks small; over decades it compounds into a completely different outcome — £1,000 at 5% for 30 years is £2,500 under simple interest but over £4,300 under annual compounding, without a single extra pound deposited.' },
        { heading: 'Why Starting Early Beats Contributing More', body: 'Because compounding is exponential, TIME in the market usually matters more than the SIZE of contributions. Someone saving £100/month from age 20 will typically end up with more at 60 than someone saving £200/month from age 35, purely because the first saver\u2019s early contributions had decades longer to compound. This is the most common regret cited by older savers — not "I didn\u2019t save enough," but "I didn\u2019t start soon enough."' },
        { heading: 'Where To Keep Different Kinds of Savings', body: 'Money needed within 1\u20132 years (emergency fund, a house deposit next year) belongs in an easy-access savings account — safe and liquid, even if growth is modest. Money not needed for 5+ years is where investing (see the Investing chapter) usually makes more sense, since it has time to ride out short-term market drops in exchange for higher average long-term growth. Mixing these up — investing money you need next month, or leaving decade-long savings in low-interest cash — is one of the most common and costly saving mistakes.' },
        { heading: 'The Rule of 72', body: 'The Rule of 72 gives a fast mental estimate for how long money takes to double: divide 72 by the interest rate. At 6% growth, money doubles in about 12 years (72÷6); at 3%, it takes about 24 years. It\u2019s an approximation (most accurate between roughly 6-10%), but it\u2019s precise enough to instantly compare two interest rates without a calculator — a genuinely useful mental shortcut used by professional advisors.' }
      ],
      misconceptions: [
        { myth: 'A small difference in interest rate barely matters.', reality: 'Over decades, compounding turns a 1-2% rate difference into a very large difference in final balance.' },
        { myth: 'You need a lot of money to start "really" saving.', reality: 'Time in the market matters more than amount — starting small and early usually beats starting large and late.' },
        { myth: 'Savings and investing are the same thing.', reality: 'Savings prioritise safety and access; investing accepts more short-term risk for higher long-term growth potential.' }
      ],
      expertNotes: [
        'Advisors call the first years of saving "the boring years" — growth looks slow at first because compounding needs time to snowball.',
        'Always keep an accessible emergency fund in cash BEFORE investing further money — investments can drop right when you need to sell.',
        'Compare savings accounts using AER (Annual Equivalent Rate), which already standardises for different compounding frequencies.'
      ],
      examples: [{ q: '£1,000 at 5% simple interest for 4 years — total interest?', working: '(1000×5×4)÷100', answer: '£200' }, { q: '£1,000 at 5% compound for 2 years — total amount?', working: '1000 × 1.05²', answer: '£1,102.50' }]
    },
    banking: {
      title: 'Banking',
      intro: 'Banks provide the accounts and infrastructure that hold, move and grow everyday money. Knowing how the underlying system works avoids unnecessary fees and costly mistakes.',
      origin: 'Modern banking traces back to Renaissance Italy, where families like the Medici formalised lending, deposits and the bill of exchange (an early "cheque" letting a merchant in one city draw funds held in another). The word "bank" itself comes from the Italian "banco" — the bench moneylenders sat behind. Central banking and deposit protection are much newer: the Bank of England was founded in 1694, and deposit insurance schemes like the FSCS only emerged after 20th-century bank failures showed what happens to ordinary savers when a bank collapses without one.',
      sections: [
        { heading: 'How Banks Actually Make Money From Your Deposit', body: 'A bank doesn\u2019t just store your money in a vault — it lends most of it out to borrowers (mortgages, loans, credit cards) at a higher interest rate than it pays you on your savings, keeping the difference (the "net interest margin") as profit. This is why banks can pay you interest at all, and also why a system-wide loss of confidence (a "bank run," everyone trying to withdraw at once) is dangerous — the cash literally isn\u2019t all sitting there. Deposit protection schemes like the FSCS (UK, up to £85,000 per person per bank) exist specifically to make bank runs unnecessary by guaranteeing depositors get their money back regardless.' },
        { heading: 'Payment Rails: How Money Actually Moves', body: 'A standing order is an instruction YOU set (a fixed amount, to a fixed recipient, on a fixed schedule) — the bank just executes it mechanically. A direct debit flips control: you authorise a company to take a VARYING amount when it\u2019s due, which is why utility bills and subscriptions use direct debits, not standing orders — the amount changes. Faster Payments (used for most UK bank transfers) settles within seconds; older systems like BACS take up to three working days — the difference matters when timing a large payment against a deadline.' },
        { heading: 'Why Account "Switching" Used To Be Hard', body: 'Before the UK\u2019s Current Account Switch Service (2013), moving banks meant manually re-registering every direct debit and standing order yourself — miss one and a bill silently fails to pay. The Switch Service now moves everything (including the full payment history redirect) within 7 working days automatically, which is precisely why comparison sites can responsibly recommend switching for a better rate: the historical friction that used to trap people with an underperforming bank has been engineered away.' },
        { heading: 'Reading Between the Lines on Savings Rates', body: 'AER (Annual Equivalent Rate) exists because banks can quote the SAME real return in very different-looking headline numbers depending on compounding frequency (monthly vs annual). AER standardises all of them to "what you\u2019d effectively earn over one full year," making accounts genuinely comparable — always compare AER to AER, never a monthly rate to an annual one directly.' }
      ],
      misconceptions: [
        { myth: 'Your money just sits in the bank\u2019s vault until you withdraw it.', reality: 'Banks lend most deposits out to other customers — this "fractional reserve" model is exactly why deposit protection schemes exist.' },
        { myth: 'Switching banks is a hassle involving cancelling and re-setting up every payment yourself.', reality: 'The Current Account Switch Service automates the entire move, including direct debits, within 7 working days.' },
        { myth: 'An overdraft is basically free short-term borrowing.', reality: 'Overdrafts typically carry high interest or daily fees — they\u2019re one of the more expensive ways to borrow, not a free buffer.' }
      ],
      expertNotes: [
        'Compare savings and current accounts on AER, not headline "interest rate," since compounding frequency can make raw rates misleading.',
        'Check whether protection is per-bank, not per-account — some banking brands share one FSCS licence, which caps combined protection at £85,000 total.',
        'A standing order failing silently (insufficient funds) is a common cause of missed rent — direct debits usually retry, standing orders often don\u2019t.'
      ],
      examples: [{ q: 'Which pays a fixed amount you set: standing order or direct debit?', working: 'Standing orders are set and controlled by you', answer: 'Standing order' }, { q: 'What protects your savings if a UK bank collapses (up to £85,000)?', working: 'A government-backed compensation scheme', answer: 'FSCS' }]
    },
    credit: {
      title: 'Credit & Debt',
      intro: 'Credit lets you borrow money now and repay later, usually with interest. Used well it\u2019s a powerful tool; used poorly it becomes expensive debt — understanding APR, credit scoring and repayment strategy is the difference.',
      origin: 'Consumer credit is ancient (Mesopotamian merchants extended credit against future harvests), but the MODERN credit system — centralised credit bureaus, standardised scores, and revolving credit cards — is a 20th-century invention. The first general-purpose credit card (Diners Club, 1950) was created essentially to solve one problem: business travellers needed a way to pay across many different merchants without carrying cash or arranging credit individually with each one. Credit SCORING (a single number summarising creditworthiness) followed in the 1950s-60s specifically to make lending decisions faster and less subject to a loan officer\u2019s personal bias.',
      sections: [
        { heading: 'What a Credit Score Actually Measures', body: 'A credit score isn\u2019t a measure of wealth or income — it\u2019s a statistical estimate of how likely you are to repay debt on time, based almost entirely on your OWN past borrowing behaviour: payment history, how much of your available credit you use, how long you\u2019ve held accounts, and how often you\u2019ve applied for new credit recently. This is why someone with a high income but no borrowing history at all often has a mediocre score — the system has no repayment behaviour to measure, not because they look risky.' },
        { heading: 'Why the Minimum Payment Is a Trap', body: 'Credit card minimum payments (often 1-3% of the balance) are deliberately structured so that early payments mostly cover interest, with only a small sliver going to the actual balance. On a typical high-street APR of ~20%, paying only the minimum on a few thousand pounds of debt can take well over a decade to clear and cost more in interest than the original purchase. This isn\u2019t an accident of poor design — from the lender\u2019s side, the minimum payment structure is what makes revolving credit profitable.' },
        { heading: 'Avalanche vs Snowball: Two Repayment Strategies', body: 'The avalanche method pays extra toward whichever debt has the HIGHEST interest rate first (minimums on everything else), which is mathematically optimal — it minimises total interest paid over time. The snowball method instead targets the SMALLEST balance first regardless of rate, trading some extra interest cost for the psychological win of fully clearing a debt sooner — behavioural finance research (popularised by Dave Ramsey) finds this often produces better real-world follow-through, because visible progress sustains motivation better than an optimal-but-slow spreadsheet.' },
        { heading: 'Secured vs Unsecured, and Why Rates Differ So Much', body: 'A secured loan (mortgage, car finance) is backed by an asset the lender can repossess if you default, which lowers the lender\u2019s risk and therefore the interest rate. An unsecured loan or credit card has nothing backing it beyond your promise to repay, so lenders price in that extra risk with a much higher rate — this is exactly why credit card APRs (often 20%+) dwarf mortgage rates (often single digits), even from the very same bank.' }
      ],
      misconceptions: [
        { myth: 'Checking your own credit score damages it.', reality: 'A "soft" check (checking your own score, or a lender\u2019s eligibility pre-check) has no effect — only "hard" checks from actual applications have a small, temporary impact.' },
        { myth: 'Carrying a balance (not paying off in full) improves your credit score.', reality: 'It does not — paying in full every month costs no interest and is viewed at least as well by lenders as carrying a balance.' },
        { myth: 'Having no debt at all gives you the best possible credit score.', reality: 'With zero borrowing history, lenders have nothing to assess — a track record of small, well-managed credit is usually scored better than none at all.' }
      ],
      expertNotes: [
        'Financial counsellors almost always check for the highest-interest debt first (avalanche logic) before recommending any repayment plan.',
        'Utilisation (balance ÷ limit) is usually recommended to stay under ~30% — not because of any hard rule, but because it correlates with lower scored risk.',
        'A single missed payment typically stays on a credit file for years and outweighs many months of on-time payments — consistency matters more than any one large payment.'
      ],
      examples: [{ q: '£1,000 balance, 3% minimum payment — how much is due?', working: '1000 × 3%', answer: '£30' }, { q: 'Which debt strategy targets the highest interest rate first?', working: 'Saves the most money in total interest', answer: 'Avalanche method' }]
    },
    tax: {
      title: 'Taxes & Payslips',
      intro: 'Understanding tax reveals what you actually take home from a salary, and how the prices you pay already include tax — and why the system is structured in bands rather than one flat rate.',
      origin: 'Income tax as a permanent, universal system is relatively recent — the UK introduced it in 1799 as a temporary measure to fund the Napoleonic Wars, and it wasn\u2019t made permanent until 1842. The idea of PROGRESSIVE taxation (higher earners paying a higher rate on the portion above certain thresholds, rather than everyone paying the same flat percentage) reflects a specific policy choice: that the "marginal" value of money to a person decreases as they have more of it, so taxing higher amounts more heavily causes less hardship than a flat rate would for lower earners.',
      sections: [
        { heading: 'Why Tax Bands Don\u2019t Work the Way People Assume', body: 'A very common misunderstanding is that moving into a higher tax band means ALL your income gets taxed at the higher rate — it doesn\u2019t. Only the portion of income WITHIN each band is taxed at that band\u2019s rate; the Personal Allowance portion stays tax-free and the Basic Rate portion stays at 20% regardless of how much you earn above it. This "marginal" structure means a small pay rise that crosses into a new band can never actually reduce your take-home pay, contrary to the persistent myth that it can.' },
        { heading: 'What VAT Actually Is (And Who Really Pays It)', body: 'VAT (Value Added Tax) is a tax on the VALUE ADDED at each stage of production, not just a final sales tax — a retailer charges VAT on the sale price but reclaims the VAT it paid on stock, effectively passing the net tax down the chain until it lands on the final consumer, who cannot reclaim anything. This is why VAT-inclusive prices simply divide by 1.20 to find the tax-free base price, and why VAT is described as "regressive" in effect — it takes the same percentage regardless of the buyer\u2019s income, unlike income tax\u2019s progressive bands.' },
        { heading: 'National Insurance: A Tax By Another Name', body: 'National Insurance (NI) is deducted separately from Income Tax on a payslip, but functions much like a second income tax — it funds specific state benefits (the State Pension, certain unemployment and sickness benefits) rather than general government spending, which is the historical reason it\u2019s tracked and shown separately. Unlike Income Tax, NI has traditionally not applied to income beyond State Pension age, since the "insurance" logic is that you\u2019ve already qualified for the benefits it funds.' },
        { heading: 'Reading a Payslip Like an Expert', body: 'A payslip moves from Gross Pay (before anything is deducted) through pre-tax deductions (like pension contributions, which lower your TAXABLE income) to Income Tax and National Insurance, landing at Net Pay (what actually hits your bank account). Pension contributions taken BEFORE tax are a common area of confusion — increasing your pension contribution can lower your tax bill at the same time as it grows your retirement savings, because you\u2019re taxed on a smaller taxable amount.' }
      ],
      misconceptions: [
        { myth: 'Earning your way into a higher tax band means all your income gets taxed at that higher rate.', reality: 'Only the portion of income within each band is taxed at that band\u2019s rate — a pay rise can never lower your take-home pay.' },
        { myth: 'VAT and Income Tax work the same way.', reality: 'VAT is a flat percentage on spending (regressive in effect); Income Tax rises in bands with income (progressive).' },
        { myth: 'National Insurance is just another name for Income Tax.', reality: 'It\u2019s tracked separately because it specifically funds contributory benefits like the State Pension, with its own distinct rules.' }
      ],
      expertNotes: [
        'Accountants always compute tax band-by-band, never by applying one rate to the whole income — this single habit prevents most "am I worse off" tax mistakes.',
        'Increasing pre-tax pension contributions is one of the few legal ways to simultaneously reduce taxable income and grow long-term savings.',
        'Always check whether a quoted salary is gross or net — the two can differ by 20-30%+, and confusing them derails budgeting immediately.'
      ],
      examples: [{ q: '£40 item plus 20% VAT — total price?', working: '40 × 1.20', answer: '£48' }, { q: 'Salary £20,000, Personal Allowance £12,570, rest taxed at 20% — tax owed?', working: '(20000−12570) × 20%', answer: '£1,486' }]
    },
    investing: {
      title: 'Investing',
      intro: 'Investing means putting money into assets — stocks, bonds, funds — aiming to grow it over time, generally accepting more risk than plain savings in exchange for higher potential long-term reward.',
      origin: 'Public stock markets emerged from the need to fund ventures too large or risky for any single investor — the Dutch East India Company (1602) is widely considered the first company to issue tradeable shares to the public, letting many investors each take a small stake in a very large, risky voyage rather than one person bearing the whole cost. Bonds are older still — governments have borrowed from citizens via tradeable debt for centuries to fund wars and infrastructure. Index funds are the newest major innovation: the first was launched in 1976, built on the (initially controversial) academic finding that most professional stock-pickers fail to beat the market average over the long run.',
      sections: [
        { heading: 'Stocks vs Bonds: Ownership vs Lending', body: 'Buying a stock/share makes you a part-OWNER of a company — your return depends on the company\u2019s profit and growth, with no guaranteed payout, and if the company fails, shareholders are paid last (often nothing). Buying a bond makes you a LENDER — the issuer (government or company) promises to pay you back a fixed amount plus interest on a schedule, regardless of how well the business subsequently performs, and bondholders are paid before shareholders if things go wrong. This is the core reason bonds are considered lower-risk than stocks: the legal claim on repayment is structurally stronger.' },
        { heading: 'Why Diversification Is Not Optional', body: 'Diversification — spreading money across many different investments — works because different assets don\u2019t all rise and fall together; when one sector or company struggles, others may hold steady or grow, smoothing overall returns. This isn\u2019t just intuition: modern portfolio theory (Harry Markowitz, 1952, later a Nobel Prize) mathematically proved that a well-diversified portfolio can reduce risk WITHOUT necessarily sacrificing expected return, compared to concentrating in fewer holdings — a rare "free lunch" in finance.' },
        { heading: 'Why Index Funds Became the Default Recommendation', body: 'An index fund simply holds every company in a market index (like the FTSE 100 or S&P 500) in proportion to its size, rather than trying to pick winners. Decades of data comparing actively-managed funds (which pick stocks, charging higher fees for the attempt) against index funds have repeatedly found that MOST active funds fail to beat their index over 10+ year periods, after fees — which is why low-cost index investing is now the standard recommendation for most long-term investors, not because picking stocks is impossible, but because doing it consistently better than the market, after costs, is extremely rare even among professionals.' },
        { heading: 'Compounding and Time Horizon', body: 'Investment returns compound just like savings interest, but with a wider range of possible outcomes year to year — which is exactly why time horizon matters so much: a short-term dip that would be a disaster if you needed the money next month is usually irrelevant if you won\u2019t touch the money for 20 years, since markets have historically trended upward over long periods despite frequent short-term drops. Pound-cost averaging (investing a fixed amount on a fixed schedule, regardless of price) is a practical way to avoid the stress of "timing the market" — it automatically buys more units when prices are low and fewer when high.' }
      ],
      misconceptions: [
        { myth: 'Investing is basically the same as gambling.', reality: 'Gambling has a negative expected return by design; broad, diversified investing has historically had a positive expected return over long periods — the risk profile is fundamentally different.' },
        { myth: 'You need to be wealthy or an expert to start investing.', reality: 'Index funds and modern investing platforms let almost anyone start with small, regular amounts — expertise mainly helps with picking individual stocks, which most investors are advised to avoid anyway.' },
        { myth: 'A market drop means you\u2019ve "lost" that money permanently.', reality: 'A loss is only locked in if you sell during the drop — for money with a long time horizon, temporary drops are a normal, expected part of long-term investing.' }
      ],
      expertNotes: [
        'Professional advisors overwhelmingly recommend starting with broad index funds before ever considering individual stock picking.',
        'Rebalancing (periodically adjusting a portfolio back to its target mix) is a standard discipline to avoid risk drifting higher as winners grow to dominate a portfolio.',
        'Time horizon, not age alone, should drive how much risk (e.g. stocks vs bonds) is appropriate in a portfolio.'
      ],
      examples: [{ q: 'What reduces risk by spreading money across many investments?', working: 'Not putting "all eggs in one basket"', answer: 'Diversification' }, { q: '£1,000 invested, grows at 7% for 10 years — roughly how many years to double per the Rule of 72?', working: '72÷7', answer: '≈10.3 years' }]
    },
    insurance: {
      title: 'Insurance & Risk',
      intro: 'Insurance transfers the financial risk of unlikely-but-costly events — accidents, illness, theft — from an individual to a large pool of people, in exchange for a regular premium.',
      origin: 'Marine insurance is one of the oldest forms, dating to ancient trade routes where merchants pooled resources to cover the loss of any single ship — spreading a catastrophic individual risk across many people who each faced only a small chance of loss. Modern insurance regulation and actuarial science (the mathematics of pricing risk) developed heavily after major disasters exposed insurers who had under-priced risk and couldn\u2019t pay claims — the Great Fire of London (1666) directly led to the first fire insurance companies and, eventually, organised fire brigades funded by insurers with a direct financial interest in preventing fires.',
      sections: [
        { heading: 'The Core Idea: Risk Pooling', body: 'Insurance works because most large, costly events are rare for any one person but predictable in AGGREGATE across a large group — an insurer can\u2019t know which specific policyholder will have a car accident this year, but with enough policyholders, it can predict fairly accurately how MANY will, and price premiums so total payouts are covered with a margin for profit. This is why insurance is fundamentally a numbers game played at scale, and why a new, small insurer with too few policyholders is financially fragile compared to a large, established one.' },
        { heading: 'Premium and Excess: A Risk-Sharing Dial', body: 'The excess (or deductible) is the amount YOU agree to pay before the insurer covers the rest of a claim — choosing a higher excess lowers your premium because you\u2019re absorbing more of the small, routine claims yourself, leaving the insurer only exposed to larger losses. This is a genuine trade-off, not a trick: a high excess suits someone with savings to cover small incidents themselves and who mainly wants protection against a catastrophic loss; a low excess suits someone who couldn\u2019t easily absorb even a moderate unexpected cost.' },
        { heading: 'Moral Hazard and Adverse Selection', body: 'Two concepts explain most of insurance\u2019s pricing complexity. Moral hazard is the tendency for people to take MORE risk once they\u2019re insured against the consequences (driving less carefully once fully covered, for instance) — insurers counter this with excesses and no-claims discounts that keep some risk with the policyholder. Adverse selection is the tendency for the people MOST likely to claim to be the ones most eager to buy insurance (someone who already knows they\u2019re a high risk seeks cover more urgently than someone who knows they\u2019re not) — insurers counter this with detailed risk-based pricing (age, claims history, location) so premiums reflect actual risk rather than being gamed by whoever self-selects into buying.' },
        { heading: 'Which Type of Cover Actually Matters', body: 'Buildings insurance covers the physical structure (walls, roof, fixtures) — relevant to whoever owns the structure, which is why mortgage lenders typically require it. Contents insurance covers belongings inside (furniture, electronics) and is relevant to owners and renters alike. Income protection and life insurance address a different risk entirely: the loss of future earning ability, not property — and are most valuable to anyone whose household would struggle financially without their income, regardless of how much property they own.' }
      ],
      misconceptions: [
        { myth: 'Insurance is a waste of money if you never claim.', reality: 'Insurance is priced-in protection against a rare but catastrophic loss — "not needing it" most years is the whole point, not a sign of wasted money.' },
        { myth: 'A higher excess is always a worse deal.', reality: 'A higher excess genuinely lowers your premium and can be a good trade-off if you have savings to cover small claims yourself.' },
        { myth: 'Insurers set premiums arbitrarily.', reality: 'Premiums are calculated using actuarial risk models based on real claims data — the process is heavily mathematical, not arbitrary.' }
      ],
      expertNotes: [
        'Actuaries price insurance using large historical claims datasets — individual policyholders are essentially priced as a statistical risk profile, not a personal judgement.',
        'A strong no-claims history is one of the most reliable ways to lower a premium over time, since it directly counters adverse-selection risk from the insurer\u2019s view.',
        'Reviewing whether cover still matches your situation (e.g. dropping income protection once a mortgage is paid off) is a routine part of professional financial planning.'
      ],
      examples: [{ q: 'What is the amount you pay before insurance covers the rest of a claim called?', working: 'Also called a "deductible"', answer: 'Excess' }, { q: 'Which insurance type is legally required to drive in the UK?', working: 'Protects other people if you cause an accident', answer: 'Third-party insurance' }]
    },
    consumer: {
      title: 'Consumer Maths',
      intro: 'Everyday shopping and spending decisions involve maths — discounts, unit pricing and currency conversion all help you spot genuine value and avoid common pricing tricks.',
      origin: 'Unit pricing (price per standard unit, e.g. per 100g) became mandatory in many countries only in the mid-to-late 20th century, specifically because manufacturers were found to obscure true cost by constantly changing pack sizes, making direct price comparison nearly impossible for shoppers without doing the maths themselves. "Charm pricing" (ending prices in .99) has been studied by economists since the early 20th century and consistently measured to increase sales, revealing that consumers process the leftmost digit of a price disproportionately — £9.99 registers as meaningfully cheaper than £10.00, despite the real difference being a single penny.',
      sections: [
        { heading: 'Unit Price: The Only Fair Comparison', body: 'Comparing a £4 400g pack against a £5.50 500g pack directly is meaningless — the only fair comparison converts both to the SAME unit (price per 100g: £1.00 vs £1.10), which is exactly why unit pricing is now a legal requirement on shelf labels in many countries. "Bigger pack = better value" is a common assumption manufacturers rely on, and it is regularly false — bulk packaging sometimes carries a premium, not a discount, especially for "family size" or "premium" branded versions of the same product.' },
        { heading: 'How Discounts Are Framed to Look Bigger', body: 'A discount applied to an already-inflated "was" price is a well-documented retail tactic — a "50% off, was £100" deal is only genuinely good value if £100 was ever a real, sustained selling price, not a price set high specifically to make the markdown look larger. Sequential discounts also don\u2019t add up the way intuition suggests: "20% off, then an extra 10% off" is NOT a 30% total discount — it\u2019s applied multiplicatively (0.80 × 0.90 = 0.72), a 28% total discount, slightly less than naive addition would suggest.' },
        { heading: 'Psychological Pricing Tricks Worth Knowing', body: 'Charm pricing (£9.99 instead of £10) exploits how people read numbers left-to-right and anchor on the first digit. The "decoy effect" adds a deliberately unattractive third option to make one of the other two look better by comparison (a slightly-too-expensive "medium" size can make the "large" look like the obviously smart choice, even if the small would have been the objectively cheapest per-unit option). Recognising these patterns doesn\u2019t make them evil — retailers are optimising for sales, just as a savvy shopper optimises for value — but knowing the trick lets you evaluate the actual unit price rather than the framing.' },
        { heading: 'Currency Conversion in Real Life', body: 'Converting currency is simple multiplication (amount × exchange rate) but the practical complication is that the rate advertised and the rate actually applied often differ — banks, card providers and currency exchange kiosks all typically add a margin on top of the "real" market rate, and some also charge a flat foreign transaction fee on top of that. This is why the same £100 converted at an airport kiosk, a bank, and a specialist no-fee travel card can yield noticeably different amounts of foreign currency, despite all technically using "today\u2019s exchange rate."' }
      ],
      misconceptions: [
        { myth: 'A bigger pack is always better value per unit.', reality: 'Bulk and "premium" packaging sometimes cost MORE per unit — always check the per-unit price, never assume from size alone.' },
        { myth: 'Two discounts of 20% and 10% add up to 30% off.', reality: 'Sequential discounts multiply, not add — 20% then 10% off is a 28% total discount, not 30%.' },
        { myth: '£9.99 is basically the same as thinking of it as £10.', reality: 'Studies consistently show shoppers mentally register charm-priced items as meaningfully cheaper than the true, near-identical price.' }
      ],
      expertNotes: [
        'Always calculate the per-100g/per-litre/per-unit price yourself when comparing pack sizes — never trust "family size" or "value pack" labelling alone.',
        'Multiply sequential discounts together (as decimals) rather than adding their percentages — the correct total is always slightly less than the naive sum.',
        'For currency, compare the TOTAL amount received after fees across providers, not just the headline exchange rate quoted.'
      ],
      examples: [{ q: '£60 item with a 20% discount — sale price?', working: '60 × 0.80', answer: '£48' }, { q: '£4 for 400g vs £5.50 for 500g — which is better value per 100g?', working: '£1/100g vs £1.10/100g', answer: 'The £4 for 400g pack' }]
    }
  };

  /* ---- TOPIC CARDS (practice hub) ------------------------------------------ */
  var TOPICS = [
    { key: 'budgeting', label: 'Budgeting', desc: '50/30/20 splits, needs vs wants' },
    { key: 'saving', label: 'Saving & Interest', desc: 'Simple & compound interest, saving goals' },
    { key: 'banking', label: 'Banking', desc: 'Accounts, overdrafts, direct debits' },
    { key: 'credit', label: 'Credit & Debt', desc: 'APR, credit scores, payoff strategy' },
    { key: 'tax', label: 'Taxes & Payslips', desc: 'Income tax, VAT, take-home pay' },
    { key: 'investing', label: 'Investing', desc: 'Stocks, bonds, diversification, risk' },
    { key: 'insurance', label: 'Insurance & Risk', desc: 'Premiums, excess, coverage types' },
    { key: 'consumer', label: 'Consumer Maths', desc: 'Discounts, unit pricing, best value' }
  ];

  root.LearningMoney = {
    generate: function (topicKey) { return questionForType(topicKey, 2); },
    generateForLevel: generateForLevel, generateLevelSet: generateLevelSet, generatePlacementSet: generatePlacementSet,
    levelLabel: levelLabel, gradeFromLevel: gradeFromLevel, levelFromScore: levelFromScore, strongestWeakest: strongestWeakest,
    QT_TYPES: QT_TYPES, QT_DIFFICULTIES: QT_DIFFICULTIES, QT_LENGTHS: QT_LENGTHS,
    buildQuickTest: buildQuickTest, generateDailyChallenge: generateDailyChallenge, levelToTier: qtLevelToTier,
    checkAnswer: checkAnswer, LESSONS: LESSONS, FORMULAS: FORMULAS, TOPICS: TOPICS, TOPIC_LABELS: TOPIC_LABELS
  };
})(window);

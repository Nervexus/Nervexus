/* ============================================================================
   gentleman-blackbook.js — "The Black Book": an insider's reference for
   Gentleman's Etiquette. Two halves:

     BRAND_CATEGORIES[] — ultra-niche luxury houses across 12 categories
       (watches, tailoring, shoes, leather goods, fragrance, eyewear,
       jewellery, spirits & cigars, grooming, stationery, interiors &
       furniture, shirtmakers) chosen specifically because they're NOT the
       obvious, billboard-famous names — the ones recognised by people
       already deep in a category, not by logo recognition.

     CITIES[] — a worldwide guide (26 hubs across Europe, the Middle East,
       Asia, North & South America, Africa and Oceania), each with several
       picks across Hotels (4.5-5 star only), Restaurants, Events, Spas &
       Wellness, Motoring, Private Cinema and Luxury Clothing — landmark
       names alongside quieter insider ones, plus one holiday idea.

   This is curated editorial guidance based on reputation and general
   knowledge, not live availability, pricing, or booking data — hours,
   access routes and offerings change, so treat specifics as a starting
   point to verify, not a guarantee. Nothing here is a paid placement.
   ============================================================================ */
(function (root) {
  'use strict';

  var BRAND_CATEGORIES = [
    { key:'watches', label:'Watches', brands:[
      { name:'F.P. Journe', origin:'Geneva, Switzerland', blurb:'The name serious collectors give when asked who they’d buy if money were genuinely no object. Refused mass distribution for two decades before demand caught up with him, not the other way round.' },
      { name:'Philippe Dufour', origin:'Le Sentier, Switzerland', blurb:'Regarded by many watchmakers — not just collectors — as the finest living hand-finisher. Total output has run to single digits a year; owning one is a statement about craft, not display.' },
      { name:'Akrivia (Rexhep Rexhepi)', origin:'Geneva, Switzerland', blurb:'One of the youngest independents to earn the old guard’s respect. Everything is finished in-house, by hand, in a field where most brands outsource that work.' },
      { name:'Kari Voutilainen', origin:'Môtiers, Switzerland', blurb:'A Finnish master known for hand-guilloché dial work most maisons buy in rather than do themselves — the kind of detail only another watchmaker notices first.' },
      { name:'H. Moser & Cie', origin:'Neuchâtel, Switzerland', blurb:'Deliberately blank dials, deliberately anti-marketing — the “Swiss Mad” house that trolls the industry it belongs to and gets away with it because the watchmaking underneath is genuinely serious.' },
      { name:'Naoya Hida & Co.', origin:'Tokyo, Japan', blurb:'An ultra-traditional Japanese independent making watches that look implausibly like 1950s dress pieces. Tiny runs, brutal waiting lists, almost unknown outside serious collector circles.' },
      { name:'Laurent Ferrier', origin:'Geneva, Switzerland', blurb:'Founded by a former Patek Philippe development director after retirement. Output is deliberately tiny; the movements are finished to a standard he refused to compromise on when he went independent.' },
      { name:'Czapek', origin:'Geneva, Switzerland', blurb:'A revived 19th-century Polish-Swiss name, run today by a small, obsessive team — the kind of comeback watchmakers themselves take seriously, rather than a marketing relaunch.' },
    ]},
    { key:'tailoring', label:'Tailoring & Jackets', brands:[
      { name:'Liverano & Liverano', origin:'Florence, Italy', blurb:'The reference point for the soft, high-armhole “Florentine” jacket. Still cut, sewn and pressed entirely on the premises, the old-fashioned way.' },
      { name:'Sartoria Ciardi', origin:'Naples, Italy', blurb:'Third-generation house behind the exaggerated shoulder line that “Neapolitan tailoring” now generally means — copied everywhere, made properly in very few places.' },
      { name:'Solito', origin:'Naples, Italy', blurb:'Founded by a former Rubinacci cutter. Among the last true one-tailor-per-garment ateliers left in a city that used to be full of them.' },
      { name:'Anderson & Sheppard', origin:'Savile Row, London', blurb:'Inventor of the soft “London drape” cut — the reason Fred Astaire and generations of the genuinely well-dressed went there instead of the stiffer houses next door.' },
      { name:'Steed Bespoke', origin:'Savile Row, London', blurb:'Small enough that the cutter who takes your measurements is the same person who finishes your coat — no handoff between rooms, no house style diluted by scale.' },
      { name:'Rubinacci', origin:'Naples, Italy', blurb:'The Neapolitan house that trained a good number of the other names on this list, still family-run three generations in — the root the “Neapolitan tailoring” trend traces back to.' },
      { name:'Sartoria Dalcuore', origin:'Naples, Italy', blurb:'Known among tailoring obsessives for an even softer, more extreme construction than its Neapolitan peers — barely any padding, built to move with the body rather than shape it.' },
      { name:'Cifonelli', origin:'Paris, France', blurb:'A French tailoring house, family-run since 1880, famous for a structured shoulder that bridges English precision and Italian softness — copied by ready-to-wear brands for decades without credit.' },
    ]},
    { key:'shoes', label:'Shoes', brands:[
      { name:'Stefano Bemer', origin:'Florence, Italy', blurb:'Trained under a Ferragamo-schooled master; now the atelier that other insiders quietly send people to when they’ve outgrown ready-to-wear.' },
      { name:'Yohei Fukuda', origin:'Tokyo, Japan', blurb:'Trained in Vienna and Northampton, now considered by many to be making the best lasts of anyone working today — a genuinely global reputation built with almost no marketing.' },
      { name:'Corthay', origin:'Paris, France', blurb:'Pioneered the hand-painted “patina” finish the whole industry now imitates, and still does the real work in France rather than licensing the name out.' },
      { name:'Saint Crispin’s', origin:'Romania', blurb:'A small atelier that quietly makes some of the finest ready-to-wear shoes in the world — the name enthusiasts trade before the big Northampton and Parisian houses.' },
      { name:'Norman Vilalta', origin:'Barcelona, Spain', blurb:'An Argentine-trained cordwainer blending Spanish and English shoemaking traditions into something that doesn’t look like anyone else’s work.' },
      { name:'Gaziano & Girling', origin:'Northampton, England', blurb:'Younger than the historic English names on Northampton’s shoe row, but already spoken of in the same breath by collectors for the sharpness of its lasts.' },
      { name:'Roberto Ugolini', origin:'Florence, Italy', blurb:'Trained at a small Florentine workshop and now one of the few remaining true bespoke-only makers left in the city — no ready-to-wear line to fall back on.' },
    ]},
    { key:'leather', label:'Leather Goods', brands:[
      { name:'Delvaux', origin:'Brussels, Belgium', blurb:'Founded in 1829 — older than Hermès — and still quietly independent. Every bag is signed by the artisan who made it, not just stamped with a house mark.' },
      { name:'Il Bussetto', origin:'Le Marche, Italy', blurb:'Hand-dyed, hand-burnished small leather goods from a workshop most people outside the category have never heard of, and most who know it want to keep it that way.' },
      { name:'Mismo', origin:'Copenhagen, Denmark', blurb:'Scandinavian minimalism applied to bags most fashion editors haven’t caught onto — understated by design, not by accident.' },
      { name:'Equus Leather', origin:'Somerset, England', blurb:'Bridle-leather bags built to outlive their owner, made to order only — no ready stock, no seasonal collections, just a waiting list.' },
      { name:'Bill Amberg', origin:'London, England', blurb:'British saddlery-trained leatherworker whose bags are built for people who’d rather not carry a visible logo at all — quality that announces itself, not a monogram that does.' },
      { name:'Tanner Krolle', origin:'England', blurb:'An 1856-founded English leather house that quietly supplied luggage to old aristocracy long before the big French names turned luggage into a fashion category.' },
    ]},
    { key:'fragrance', label:'Fragrance', brands:[
      { name:'Bogue', origin:'Rome, Italy', blurb:'A one-man Roman perfumery sold through a handful of niche boutiques worldwide — no department store counter, no brand campaign, just the work.' },
      { name:'Areej Le Doré', origin:'United States', blurb:'Small-batch, naturals-heavy perfumery with genuine cult status among collectors — discovered through enthusiast forums, not advertising.' },
      { name:'Slumberhouse', origin:'Portland, Oregon', blurb:'Dense, unconventional compositions built with zero interest in mainstream appeal — polarising by design, which is exactly why the people who love it, love it.' },
      { name:'Bortnikoff', origin:'Ukraine / Russia', blurb:'Painterly, maximalist niche house known almost entirely by word of mouth among people who already own everything else on this list.' },
      { name:'Papillon Artisan Perfumes', origin:'England', blurb:'A single perfumer, Liz Moores, hand-making scents in tiny batches — cult-followed inside fragrance-collector circles and essentially invisible outside them.' },
      { name:'Bruno Fazzolari', origin:'San Francisco, USA', blurb:'An artist-perfumer whose work gets discussed in the same terms as fine art rather than sold at any department store counter.' },
    ]},
    { key:'eyewear', label:'Eyewear', brands:[
      { name:'Cubitts', origin:'London, England', blurb:'Bespoke eyewear with hand-finished acetate, made in small enough batches that most opticians never stock it — you go to them, not the other way round.' },
      { name:'Algha Works', origin:'London, England', blurb:'Makers of genuine gold-wire frames since 1919, still supplying components to legacy eyewear houses worldwide who quietly rely on them.' },
      { name:'Native Sons', origin:'Los Angeles, USA', blurb:'Small-run, Japan-made frames favoured by people who’ve already worn out the obvious designer names and want something with no logo at all.' },
      { name:'Anne et Valentin', origin:'France', blurb:'An architect-founded house doing genuinely original frame engineering, away from the big licensing conglomerates that make most “designer” glasses.' },
      { name:'L.G.R', origin:'Italy', blurb:'Hand-made sunglasses using vintage manufacturing techniques, favoured by people who’ve moved past the obvious designer sunglasses years ago.' },
    ]},
    { key:'jewellery', label:'Jewellery & Cufflinks', brands:[
      { name:'Hemmerle', origin:'Munich, Germany', blurb:'Fourth-generation family jeweller known for mixing unconventional materials — iron, bronze — with precious stones. Famously doesn’t advertise; the reputation travels on its own.' },
      { name:'JAR (Joel Arthur Rosenthal)', origin:'Paris, France', blurb:'Arguably the most secretive serious jeweller working today — no boutique signage, sales by appointment and existing relationship only.' },
      { name:'Wallace Chan', origin:'Hong Kong', blurb:'A self-taught master carver who invented his own gem-cutting technique. Treated by collectors as a fine artist who happens to work in stone and metal.' },
      { name:'Deakin & Francis', origin:'Birmingham, England', blurb:'Sixth-generation cufflink and small-jewellery maker — the name insiders reach for over the obvious fashion-house cufflinks everyone else defaults to.' },
      { name:'Bhagat', origin:'Mumbai, India', blurb:'A private jeweller working almost entirely by referral for serious collectors of coloured stones — no storefront to walk into.' },
    ]},
    { key:'spirits', label:'Spirits & Cigars', brands:[
      { name:'Gordon & MacPhail', origin:'Speyside, Scotland', blurb:'An independent bottler holding some of the oldest whisky casks in existence — known to serious collectors long before most of the famous distillery names became famous.' },
      { name:'The Scotch Malt Whisky Society', origin:'Edinburgh, Scotland', blurb:'A members-only bottler that labels casks with cryptic numbers instead of brand names, deliberately sidestepping the recognisable labels entirely.' },
      { name:'Chateau de Laubade', origin:'Armagnac, France', blurb:'Family-owned since 1870 — the connoisseur’s answer to the far more famous Cognac houses, from the region that arguably does it better.' },
      { name:'A.E. Dor', origin:'Cognac, France', blurb:'One of the last genuinely family-run Cognac houses still holding old reserve stock rather than having been absorbed into a conglomerate.' },
      { name:'Berry Bros. & Rudd (own casks)', origin:'London, England', blurb:'Britain’s oldest wine and spirits merchant, est. 1698, bottling small-batch whisky and rum under its own name — the trade’s trade, away from big distillery marketing.' },
    ]},
    { key:'grooming', label:'Grooming & Barbering', brands:[
      { name:'Truefitt & Hill', origin:'London, England', blurb:'The world’s oldest barbershop, established 1805, holding a royal warrant — the reference point every modern “gentleman’s barbershop” has since copied.' },
      { name:'D.R. Harris', origin:'London, England', blurb:'Apothecary-grade grooming products still made to nearly unchanged Victorian formulas, sold from the same kind of shop they always were.' },
      { name:'Officina Profumo-Farmaceutica di Santa Maria Novella', origin:'Florence, Italy', blurb:'A working pharmacy since 1221. Fragrance and grooming products have been made in the same building for eight centuries.' },
      { name:'Geo. F. Trumper', origin:'London, England', blurb:'An old-school wet-shave specialist — the barbershop insiders send people to before the trendier modern ones open up down the street.' },
      { name:'Castle Forbes', origin:'Aberdeenshire, Scotland', blurb:'Small-batch shaving products made on a real working Scottish estate, by the family that owns it rather than a licensed grooming conglomerate.' },
    ]},
    { key:'stationery', label:'Stationery & Pens', brands:[
      { name:'Visconti', origin:'Florence, Italy', blurb:'Hand-finished fountain pens using resin techniques few other makers still do entirely by hand.' },
      { name:'Onoto', origin:'England', blurb:'Britain’s oldest pen brand, revived by hand-craftspeople rather than relaunched as a mass-production line.' },
      { name:'Il Papiro', origin:'Florence, Italy', blurb:'Hand-marbled paper (marmorizzata) made using a centuries-old technique — the actual source serious stationers still order from.' },
      { name:'Pineider', origin:'Florence, Italy', blurb:'Founded 1774, supplied Napoleon and Shelley among others, and still hand-binds and hand-presses in the same city today.' },
      { name:'J. Herbin', origin:'France', blurb:'One of the oldest ink makers in the world, established 1670, still hand-crafting ink in small batches rather than on an industrial line.' },
    ]},
    { key:'interiors', label:'Interiors & Furniture', brands:[
      { name:'George Smith', origin:'London, England', blurb:'British upholstery made the old way — frame-up, by hand — favoured by interior designers who’d rather their client not recognise the name on the sofa.' },
      { name:'Soane Britain', origin:'London, England', blurb:'Founded by a former Nina Campbell designer; small-batch British-made furniture and textiles built to be used for decades, not seasons.' },
      { name:'Promemoria', origin:'Milan, Italy', blurb:'A family-run Italian furniture atelier that quietly supplies interior designers rather than chasing retail showroom presence.' },
      { name:'Pinch', origin:'London, England', blurb:'A husband-and-wife design studio making furniture in small English workshops — designed first, branded a distant second.' },
    ]},
    { key:'shirts', label:'Shirtmakers', brands:[
      { name:'Emma Willis', origin:'London, England', blurb:'Bespoke shirtmaker to discreet British clients, hand-finished in a small Gloucestershire workshop rather than a Jermyn Street factory floor.' },
      { name:'Charvet', origin:'Paris, France', blurb:'The Place Vendôme shirtmaker with thousands of fabric choices and zero ready-to-wear compromise — old enough and serious enough that it doesn’t need to shout about it.' },
      { name:'Ascot Chang', origin:'Hong Kong', blurb:'A third-generation shirtmaker who built a genuinely global bespoke clientele entirely by referral, with no advertising at all.' },
      { name:'Simone Abbarchi', origin:'Florence, Italy', blurb:'A small artisan shirtmaker working out of Florence’s backstreets, known almost entirely by word of mouth among people who already own bespoke suits.' },
    ]},
  ];

  var CITIES = [
    { key:'london', label:'London', region:'Europe',
      hotels:[
        { name:'41 (Buckingham Gate)', note:'A discreet 41-room hotel behind an unmarked entrance opposite Buckingham Palace — favoured by those who’d rather not be seen at the obvious address.' },
        { name:'Claridge’s', note:'Mayfair’s art deco grande dame — the address royalty, heads of state and old money default to when discretion still means somewhere everyone recognises.' },
        { name:'The Connaught', note:'A byword for quiet, serious luxury since 1897 — the Connaught Bar and its Michelin-starred Hélène Darroze dining room are reason enough on their own.' },
        { name:'The Ritz London', note:'The name that gave the word “ritzy” its meaning — Piccadilly’s definitive five-star, still requiring a jacket and tie in the Palm Court by longstanding house rule.' },
      ],
      restaurants:[
        { name:'Kitchen Table (Bubbledogs)', note:'A 19-seat counter with no printed menu in advance — one of the hardest bookings in London despite zero flash or fanfare.' },
        { name:'Core by Clare Smyth', note:'Three Michelin stars in Notting Hill from Britain’s most decorated female chef — technical, produce-led cooking without a trace of showmanship.' },
        { name:'Sketch, The Lecture Room & Library', note:'Two Michelin stars inside one of London’s most theatrical rooms — dinner as a genuine occasion, not just a meal.' },
      ],
      events:[
        { name:'Wimbledon Debenture seats', note:'Permanent, privately-owned seats resold on a legal secondary market — the only way to guarantee the same seat every year without a corporate box.' },
        { name:'Royal Ascot, Royal Enclosure', note:'Morning dress and a badge earned through sponsorship or a member’s recommendation — the most formal week on the British racing calendar.' },
        { name:'Glyndebourne Festival Opera', note:'Black tie in the English countryside, with a long picnic interval on the lawns — opera as a full summer evening, not just a performance.' },
      ],
      spas:[
        { name:'The Lanesborough Club & Spa', note:'A members’-club-style spa attached to the hotel — genuinely private treatment suites rather than a shared hotel wellness floor.' },
        { name:'ESPA Life at Corinthia', note:'A subterranean spa spanning three floors — one of the very few London hotel spas built as a real destination rather than an afterthought.' },
      ],
      motoring:[
        { name:'H.R. Owen', note:'A multi-marque luxury and exotic dealer with roots back to 1946 — old enough to have sold the first of several marques it still represents today.' },
        { name:'Talacrest, Surrey', note:'The world’s largest dealer in collector Ferraris, run entirely by appointment from a discreet showroom outside the city.' },
      ],
      cinema:[
        { name:'Electric Cinema, Portobello Road', note:'Leather armchairs, footstools and a bar since 1910 — one of the originals of the modern luxury-cinema format.' },
        { name:'Curzon Mayfair', note:'A single-screen cinema in the heart of Mayfair favoured for private hire and premiere screenings away from multiplex crowds.' },
      ],
      shopping:[
        { name:'The Armoury (via trunk shows)', note:'The globally respected menswear retailer runs periodic London trunk shows — worth timing a visit around.' },
        { name:'Trunk Clothiers, Marylebone', note:'A small, extremely well-edited boutique favoured by people who already know clothes — curation as the entire point.' },
      ],
      holiday:{ name:'A private Highland sporting week', note:'Grouse or stalking on a private Scottish estate, arranged through a sporting agent rather than a travel site.' } },
    { key:'paris', label:'Paris', region:'Europe',
      hotels:[
        { name:'Hôtel Particulier Montmartre', note:'An 18th-century private mansion with five rooms and no sign on the gate — you have to already know it’s there.' },
        { name:'Hôtel de Crillon, A Rosewood Hotel', note:'A genuine 18th-century palace on Place de la Concorde — as grand as Paris hotels get, restored rather than replaced.' },
        { name:'Le Bristol Paris', note:'Faubourg Saint-Honoré’s quietly aristocratic address, home to Epicure’s three Michelin stars and a rooftop pool few guests ever mention to outsiders.' },
        { name:'Ritz Paris', note:'The Place Vendôme original that Hemingway and Coco Chanel both called home for years — the hotel the word “ritzy” came from in the first place.' },
      ],
      restaurants:[
        { name:'Restaurant David Toutain', note:'One Michelin star that regulars will tell you should have three — still gettable without a black book, for now.' },
        { name:'Alléno Paris au Pavillon Ledoyen', note:'Three Michelin stars in a 1792 pavilion just off the Champs-Élysées — Yannick Alléno’s cuisine of sauces taken about as far as the craft goes.' },
        { name:'Guy Savoy', note:'Three stars inside the Monnaie de Paris on the Seine — often named the best restaurant in the world by people whose job is to know.' },
      ],
      events:[
        { name:'Le Bal des Débutantes', note:'An invitation-only Paris ball that quietly reintroduced old-world debutante presentations to a modern, international guest list.' },
        { name:'Prix de Diane, Chantilly', note:'French flat racing’s grandest garden party — elaborate hats optional, an invitation to a private box is not.' },
        { name:'Haute couture week, front row', note:'The actual invitation-only shows, not the public tents — seating is decided by the house, and it shows who they think matters.' },
      ],
      spas:[
        { name:'Dior Spa, Cheval Blanc Paris', note:'A subterranean spa built for one of the world’s most exclusive hotels — treatments booked months out even by guests staying upstairs.' },
        { name:'My Blend Spa by Clarins, Royal Monceau', note:'A serious science-led spa inside one of the Right Bank’s most design-forward hotels, favoured over the more tourist-facing names.' },
      ],
      motoring:[
        { name:'L’Automobile Club de France, private garage', note:'A historic members’ club with its own storage and viewing rooms — access to serious cars runs through membership, not a showroom.' },
        { name:'A private atelier visit, Boulogne-Billancourt', note:'Several French classic-car restoration houses will host a serious client for a workshop tour, by introduction.' },
      ],
      cinema:[
        { name:'Le Grand Rex', note:'A 1932 art deco cinema palace, one of the largest and most ornate screening rooms left in Europe — private hire for genuinely grand occasions.' },
        { name:'La Cinémathèque française, private screening', note:'The national film archive runs private and members’ screenings well beyond its public programme.' },
      ],
      shopping:[
        { name:'Cifonelli (made-to-measure ready pieces)', note:'The Paris tailoring house’s rare ready pieces — a way into the name without the full bespoke waiting list.' },
        { name:'A curated Marais menswear atelier', note:'Several small Marais boutiques stock genuinely well-edited European labels the department stores don’t carry.' },
      ],
      holiday:{ name:'The Basque coast (Biarritz / Guéthary)', note:'The surf-and-château alternative to the Riviera that French old money never actually left.' } },
    { key:'milan', label:'Milan', region:'Europe',
      hotels:[
        { name:'Portrait Milano', note:'A former seminary turned townhouse hotel a street back from the Quad — quieter than the big Milan names.' },
        { name:'Bulgari Hotel Milano', note:'A private garden behind Via Montenapoleone that most passers-by don’t know exists — discretion built into the address itself.' },
        { name:'Mandarin Oriental, Milan', note:'Four 18th-century buildings around a courtyard, minutes from the fashion district but built to feel nothing like it.' },
        { name:'Armani Hotel Milano', note:'Giorgio Armani’s own five-star, above his flagship on Via Manzoni — the designer’s aesthetic applied to an entire building rather than a collection.' },
      ],
      restaurants:[
        { name:'Trippa', note:'A no-reservations trattoria specialising in offal that Milan’s fashion and design crowd treats as a genuine local secret.' },
        { name:'Enrico Bartolini al MUDEC', note:'Three Michelin stars inside the city’s design museum — Italy’s most decorated living chef at full stretch.' },
        { name:'Cracco in Galleria', note:'Under the glass of the Galleria Vittorio Emanuele II — Carlo Cracco’s name on the room that makes tourists and Milanese regulars share a table.' },
      ],
      events:[
        { name:'Private showroom previews (Salone del Mobile / Fashion Week)', note:'The real business happens in the invitation-only previews before the public days open.' },
        { name:'La Scala, opening night (7 December)', note:'Sant’Ambrogio — Milan’s grandest fixed date, white tie in the stalls and a waiting list for boxes that outlasts most subscriptions.' },
        { name:'Fashion Week front-row seating', note:'Decided entirely by the house’s own guest list — the difference between watching a show and being seen at one.' },
      ],
      spas:[
        { name:'The spa at Bulgari Hotel Milano', note:'A 1,000m² wellness floor built into the hotel’s private garden — genuinely spacious by Milan hotel-spa standards.' },
        { name:'A private dermatology-led facial, by referral', note:'Milan’s serious skin clinics work almost entirely on referral rather than walk-in appointments.' },
      ],
      motoring:[
        { name:'Museo Alfa Romeo, Arese, private visit', note:'A curator-led tour of the marque’s own heritage collection, arranged outside normal visiting hours.' },
        { name:'A Quadrifoglio-only specialist dealer', note:'A handful of Milanese dealers deal almost exclusively in the marque’s highest-performance models, known mainly to serious collectors.' },
      ],
      cinema:[
        { name:'Cinema Anteo Palazzo del Cinema', note:'A restored multi-screen picture palace favoured by Milan’s design and fashion crowd over the multiplexes.' },
        { name:'A private screening at Fondazione Prada’s cinema', note:'The foundation’s own auditorium hosts curated and private screenings well beyond its public calendar.' },
      ],
      shopping:[
        { name:'A Quadrilatero della Moda private appointment', note:'Several houses in Milan’s fashion quadrilateral offer after-hours private shopping by relationship rather than walk-in.' },
        { name:'Al Bazar', note:'A long-standing Milanese multi-brand menswear boutique trusted by locals well before it appeared in any guidebook.' },
      ],
      holiday:{ name:'Lake Como, off-season', note:'Spring or autumn on the lake — the villas and gardens without the summer coach parties.' } },
    { key:'florence', label:'Florence', region:'Europe',
      hotels:[
        { name:'Villa San Michele, Fiesole', note:'A former monastery just outside the centre overlooking the city — chosen over the big-name Florence hotels for its quiet.' },
        { name:'Four Seasons Hotel Firenze', note:'A restored Renaissance palazzo with the largest private garden in the city — genuinely rare green space behind its own walls.' },
        { name:'Portrait Firenze', note:'The Ferragamo family’s own boutique hotel on the Arno, steps from Ponte Vecchio, run with a family’s attention rather than a chain’s.' },
        { name:'The St. Regis Florence', note:'A riverside 19th-century palazzo restored to full formal grandeur — old Florentine ceremony applied to a modern five-star stay.' },
      ],
      restaurants:[
        { name:'A Chianti producer’s own table', note:'The region’s best meals are rarely in a restaurant at all — ask an agriturismo host for a seat at the family table.' },
        { name:'Enoteca Pinchiorri', note:'Three Michelin stars and a wine cellar of roughly 150,000 bottles — Italy’s most serious wine list attached to cooking that keeps pace with it.' },
        { name:'Borgo San Jacopo', note:'A Michelin star with a private terrace looking straight down the Arno at Ponte Vecchio — the view alone books the table.' },
      ],
      events:[
        { name:'A private atelier visit', note:'Several Florentine tailoring and shoemaking houses will host serious clients for a fitting and a glass of wine, by introduction.' },
        { name:'Pitti Uomo, appointment-only previews', note:'The menswear trade fair’s real business — brand appointments before the halls open to the wider trade.' },
        { name:'A private after-hours Uffizi viewing', note:'Arranged through the gallery’s own patron circles — the Botticelli room with no one else in it.' },
      ],
      spas:[
        { name:'The spa at Four Seasons Firenze', note:'Set inside a former convent building within the hotel’s own garden — treatment rooms with genuine architectural history.' },
        { name:'A thermal morning at Bagno Vignoni', note:'A small Tuscan thermal town built literally around its natural hot spring — an hour or so south of the city.' },
      ],
      motoring:[
        { name:'A private Ferrari heritage day, Maranello', note:'Under an hour from Florence — a factory-adjacent experience arranged through a specialist rather than the public museum ticket.' },
        { name:'A vintage Vespa or classic-car concierge tour', note:'Several Florentine operators arrange private drives in genuinely well-kept vintage vehicles through the Tuscan hills.' },
      ],
      cinema:[
        { name:'Cinema Odeon Firenze', note:'A restored 1920s picture palace just off the centre — one of the most architecturally striking cinemas in Italy.' },
        { name:'A private Uffizi or Pitti Palace evening screening', note:'Occasional private cultural screenings are arranged in Florence’s museum courtyards through patron circles.' },
      ],
      shopping:[
        { name:'Stefano Bemer (ready-to-wear line)', note:'The bespoke shoemaker’s smaller ready line, sold from the same Florentine atelier as the full bespoke commissions.' },
        { name:'A tailoring-district walk-through, by introduction', note:'Florence’s backstreet ateliers rarely advertise; a local introduction is still the real way in.' },
      ],
      holiday:{ name:'A bespoke fitting trip', note:'Suits and shoes started on one visit, finished on a return trip months later — Florence as a wardrobe project, not just a city break.' } },
    { key:'geneva', label:'Geneva', region:'Europe',
      hotels:[
        { name:'La Réserve Genève', note:'Set back on its own lakeside grounds, away from the banking-district hotels everyone else defaults to.' },
        { name:'Beau-Rivage Geneva', note:'Family-owned since 1865 on the lakefront — the kind of old-world hotel where the same families have booked the same suites for generations.' },
        { name:'Mandarin Oriental, Geneva', note:'A Rhône-side address favoured for its discretion by the private-banking clientele who quietly run the city.' },
        { name:'Four Seasons Hôtel des Bergues', note:'An 1834 lakefront grande dame — Geneva’s original grand hotel, and still one of its most formally correct.' },
      ],
      restaurants:[
        { name:'A private banking club dining room', note:'Not open to the public — but the city’s real business, and its real watch talk, happens at these tables.' },
        { name:'Restaurant Vieux Bois', note:'A Michelin-starred room in a 19th-century villa near the UN quarter — precise, quiet, and rarely full of tourists.' },
        { name:'Il Lago, Beau-Rivage Geneva', note:'The hotel’s own Michelin-starred Italian room — lake views without leaving the property.' },
      ],
      events:[
        { name:'An independent watchmaker’s private viewing', note:'During the big watch fairs, the appointment-only back room matters more than the public hall.' },
        { name:'Geneva Watch Days, private previews', note:'Independent maisons show new references to dealers and serious collectors before anything reaches a press release.' },
        { name:'A private Patek Philippe Museum tour', note:'A curator-led walk through one of the world’s most serious horological collections, arranged outside public hours.' },
      ],
      spas:[
        { name:'Clinique La Prairie, Montreux', note:'The original Swiss medical revitalisation clinic since 1931, a short drive along the lake — a genuine clinic, not a resort spa.' },
        { name:'La Réserve Spa Genève', note:'A jungle-themed subterranean spa with one of Switzerland’s more theatrical hotel wellness settings.' },
      ],
      motoring:[
        { name:'A private classic-car storage viewing', note:'Several Geneva-area collectors keep cars in climate-controlled private facilities open only to fellow owners and serious introductions.' },
        { name:'Lukas Hüni AG, by way of Zurich', note:'A respected Swiss classic-car dealer serving collectors across both cities, appointment-only.' },
      ],
      cinema:[
        { name:'Cinémas du Grütli', note:'An arthouse cinema complex in a historic building, favoured by Geneva’s own cultural crowd over the multiplexes.' },
        { name:'A private members’ screening, Bains des Pâquis area', note:'A handful of Geneva private clubs run their own small screening rooms for members and guests.' },
      ],
      shopping:[
        { name:'A Rue du Rhône private appointment', note:'Several maisons on Geneva’s main luxury street offer after-hours viewings for serious, known clients.' },
        { name:'Grand Passage', note:'A long-established Geneva department store carrying genuinely well-edited menswear away from the flagship boutiques.' },
      ],
      holiday:{ name:'A drive through the watch valleys', note:'Vallée de Joux and Neuchâtel, with atelier visits arranged well in advance.' } },
    { key:'monaco', label:'Monaco', region:'Europe',
      hotels:[
        { name:'Hôtel Métropole Monte-Carlo', note:'Quieter and more design-forward than the Hôtel de Paris — for those who know Monaco beyond the casino.' },
        { name:'Hôtel de Paris Monte-Carlo', note:'The original grand hotel the whole principality was built around — belle époque, and still the address by which the others are measured.' },
        { name:'Monte-Carlo Beach Hotel', note:'A 1930s Riviera icon a few minutes along the coast — the beach-club version of Monaco rather than the casino one.' },
        { name:'Hôtel Hermitage Monte-Carlo', note:'A Belle Époque glass-domed winter garden hall and formal suites — quieter and more residential-feeling than the Hôtel de Paris next door.' },
      ],
      restaurants:[
        { name:'The Monaco Yacht Club dining room', note:'Members and their guests only — the view alone is worth the introduction.' },
        { name:'Le Louis XV – Alain Ducasse', note:'Three Michelin stars at the Hôtel de Paris — the room that helped define modern French haute cuisine on the Riviera.' },
        { name:'Blue Bay', note:'A Michelin-starred Caribbean-inflected kitchen at the Monte-Carlo Bay, a genuinely different register from the grand French rooms nearby.' },
      ],
      events:[
        { name:'Monaco Yacht Show VIP preview days', note:'Before the public days open, when the serious buyers and brokers actually do business.' },
        { name:'Monaco Grand Prix, Paddock Club', note:'Trackside hospitality along the harbour circuit — the closest a spectator gets to the teams without a team pass.' },
        { name:'Bal de la Rose (Rose Ball)', note:'The principality’s grandest charity gala, hosted by the ruling family — black tie, invitation only, genuinely old-world.' },
      ],
      spas:[
        { name:'Thermes Marins Monte-Carlo', note:'The principality’s original marine-therapy spa — seawater treatments overlooking the harbour since the 1900s.' },
        { name:'Espace Payot, Hôtel Hermitage', note:'A quieter, more residential-feeling spa than the larger Thermes complex, favoured by longer-staying guests.' },
      ],
      motoring:[
        { name:'A Monaco Grand Prix paddock-adjacent showroom visit', note:'Several manufacturers keep display suites along the circuit during race week, accessible through team or sponsor relationships.' },
        { name:'A private Riviera classic-car rally entry', note:'The coast’s rally circuit (echoing the old Monte Carlo Rally route) runs several private entry-only events each season.' },
      ],
      cinema:[
        { name:'Le Sporting Monte-Carlo, private screening room', note:'The Société des Bains de Mer’s entertainment complex runs private screening evenings during the Riviera season.' },
        { name:'A private yacht cinema evening', note:'Several charter yachts based in Monaco carry full cinema-grade screening setups on the upper deck.' },
      ],
      shopping:[
        { name:'A Place du Casino private appointment', note:'The maisons ringing the casino square offer after-hours viewings for established clients during the racing and yacht-show seasons.' },
        { name:'A tailoring pop-up during Grand Prix week', note:'Several European tailoring houses run temporary Monaco appointments timed to the racing calendar.' },
      ],
      holiday:{ name:'A week based aboard, not ashore', note:'Using Monaco as a mooring point for the wider Riviera by sea, rather than staying in town.' } },
    { key:'newyork', label:'New York', region:'North America',
      hotels:[
        { name:'The Lowell', note:'A small, quiet Upper East Side house favoured over the big midtown names by people who don’t need a landmark lobby.' },
        { name:'The Mark', note:'A discreetly grand Upper East Side address — the Frette linens and Jean-Georges room mean it never needs to compete on visibility.' },
        { name:'Aman New York', note:'Set inside the landmark Crown Building on Fifth Avenue — among the most private and expensive addresses in the city, by design.' },
        { name:'The Plaza', note:'The definitive New York five-star since 1907, on Central Park’s southeast corner — a landmark inside and out, protected by law from real alteration.' },
      ],
      restaurants:[
        { name:'Torrisi (and its successors)', note:'The kind of tasting-menu room that built its reputation on word of mouth, not a review.' },
        { name:'Le Bernardin', note:'Three Michelin stars for seafood since the late 1980s — a genuine New York institution that has never once coasted on its reputation.' },
        { name:'Per Se', note:'Thomas Keller’s Time Warner Center dining room — a French Laundry-level tasting menu with a Central Park view thrown in.' },
      ],
      events:[
        { name:'A private-room dinner at an old-school NY club', note:'Several of the city’s traditional members’ clubs still run private dining nights — guest-of-a-member only.' },
        { name:'The Met Gala', note:'Fashion’s most photographed night, and also its most closed — attendance is entirely by the Costume Institute’s own invitation.' },
        { name:'Opening night, the Metropolitan Opera', note:'The season’s single grandest evening at Lincoln Center — a subscriber’s box still outranks any ticket bought on the day.' },
      ],
      spas:[
        { name:'Aman Spa New York', note:'A three-floor wellness sanctuary inside the Crown Building, including a rooftop pool few New Yorkers know exists.' },
        { name:'The Spa at Mandarin Oriental, New York', note:'A 35th-floor spa with Central Park views — genuine altitude as part of the treatment experience, unusual for Manhattan.' },
      ],
      motoring:[
        { name:'Manhattan Motorcars', note:'A long-standing exotic and collector-car dealer serving the city’s serious buyers, appointment viewings for the rarer stock.' },
        { name:'RM Sotheby’s, New York previews', note:'The auction house’s New York previews bring serious consignments to the city ahead of major sales.' },
      ],
      cinema:[
        { name:'The Paris Theatre', note:'Manhattan’s last remaining single-screen cinema, steps from the Plaza — restored and still run as a genuine art-house destination.' },
        { name:'A private screening room, members’ club', note:'Several Manhattan private clubs run their own small cinema for members and industry guests.' },
      ],
      shopping:[
        { name:'The Armoury, New York', note:'The globally respected menswear retailer’s original US outpost — a genuine reference point for the city’s classic-menswear scene.' },
        { name:'No Man Walks Alone', note:'An insider American retailer built around brands the big department stores don’t carry — found through menswear forums first.' },
      ],
      holiday:{ name:'Hudson Valley or Litchfield County', note:'Old New York’s actual weekend-house country — not the Hamptons everyone assumes.' } },
    { key:'tokyo', label:'Tokyo', region:'Asia',
      hotels:[
        { name:'Hoshinoya Tokyo', note:'A modern ryokan built into a Tokyo office tower — the antidote to the big international lobby hotels.' },
        { name:'Aman Tokyo', note:'Minimalist, monastic luxury on the top floors of Otemachi Tower — a deliberately calm counterpoint to the city thirty floors below.' },
        { name:'The Peninsula Tokyo', note:'Marunouchi’s grand, formally correct address, favoured by an older, more traditional Tokyo clientele over the flashier towers.' },
        { name:'The Ritz-Carlton, Tokyo', note:'Occupying the top floors of Midtown Tower — some of the highest hotel rooms in the city, with a formality to match the address.' },
      ],
      restaurants:[
        { name:'A ten-seat sushi counter, by introduction', note:'The genuinely great rooms in Tokyo are rarely the ones with English-language reviews — a regular’s introduction still matters more than a booking app.' },
        { name:'Sukiyabashi Jiro', note:'The counter that became a documentary and, somehow, still books up entirely through personal introduction rather than any public system.' },
        { name:'Quintessence', note:'Three Michelin stars for French cooking in Tokyo, from a chef trained under Ducasse — a genuinely different register from the sushi counters.' },
      ],
      events:[
        { name:'A private sumo stable morning practice', note:'Arranged through a local fixer rather than a tour company — watching a heya train before the city wakes up.' },
        { name:'Grand Sumo Tournament, ringside tamari seats', note:'The floor-level cushions closest to the ring — sold through long-standing relationships with the sumo association, not a general box office.' },
        { name:'A private tea ceremony at a historic garden', note:'A formal chanoyu arranged inside one of Tokyo’s preserved Edo-period gardens, away from any public tour group.' },
      ],
      spas:[
        { name:'Aman Spa Tokyo', note:'A traditional onsen-style bath alongside the treatment floor, 33 storeys up — a rare combination of Japanese bathing custom and skyline view.' },
        { name:'A private onsen retreat, Hakone', note:'An hour from Tokyo by car — a traditional hot-spring ryokan day trip rather than a city spa.' },
      ],
      motoring:[
        { name:'A private Toyota heritage garage visit, by introduction', note:'Several Japanese manufacturers maintain small heritage collections shown mainly to serious enthusiasts and press by arrangement.' },
        { name:'Yohei Fukuda-adjacent classic-car specialists, Shibuya', note:'Tokyo’s classic and kyusha (vintage JDM) specialists trade almost entirely on reputation within a tight local collector circle.' },
      ],
      cinema:[
        { name:'Bunkamura Le Cinéma', note:'An art-house cinema inside Shibuya’s Bunkamura cultural complex, favoured by a design-conscious Tokyo audience.' },
        { name:'A private screening room, Roppongi members’ club', note:'A handful of Tokyo’s private members’ clubs maintain their own small cinema rooms for guest use.' },
      ],
      shopping:[
        { name:'Bryceland’s Co., Tokyo', note:'The cult vintage-inspired menswear house’s home base — a genuine pilgrimage site for people who take clothes seriously.' },
        { name:'A Ginza tailoring-district walk-through', note:'Several small Ginza ateliers work almost entirely by referral, largely unknown outside serious enthusiast circles.' },
      ],
      holiday:{ name:'Kanazawa over Kyoto', note:'A beautifully preserved historic city without the crowds Kyoto now draws.' } },
    { key:'hongkong', label:'Hong Kong', region:'Asia',
      hotels:[
        { name:'The Upper House', note:'Design-led and comparatively discreet against the harbour-view giants next door.' },
        { name:'The Peninsula Hong Kong', note:'The harbour’s original grand hotel since 1928 — a fleet of Rolls-Royces and a lobby that still sets the tone for the whole territory.' },
        { name:'Rosewood Hong Kong', note:'A newer Victoria Harbour address with some of the largest suites in the city — quietly favoured over the older names by a younger clientele.' },
        { name:'Mandarin Oriental, Hong Kong', note:'The 1963 original that gave the whole Mandarin Oriental group its name — still the address old Hong Kong measures the others against.' },
      ],
      restaurants:[
        { name:'A dai pai dong pointed out by a local', note:'Open-air street kitchens that often outcook the Michelin rooms two streets over — you need someone who already knows which one.' },
        { name:'Lung King Heen', note:'The first Chinese restaurant anywhere to earn three Michelin stars — harbour views and dim sum taken to their absolute limit.' },
        { name:'8½ Otto e Mezzo Bombana', note:'Three Michelin stars for Italian cooking, and reputedly the world’s single biggest consumer of white truffles each season.' },
      ],
      events:[
        { name:'A private members’ evening at the Hong Kong Jockey Club', note:'Racing as the city’s actual social network, not just a sport.' },
        { name:'Hong Kong Sevens, corporate box', note:'Rugby’s loudest weekend in Asia — a hospitality box turns the stadium’s carnival atmosphere into an actual vantage point.' },
        { name:'Art Basel Hong Kong, VIP preview', note:'The collector-and-dealer preview day, well before the paying public is let in.' },
      ],
      spas:[
        { name:'The Peninsula Spa by ESPA', note:'A skyline-view spa floor high above Kowloon — one of the more spacious hotel wellness levels in a notoriously vertical city.' },
        { name:'A private traditional Chinese medicine consultation', note:'Several long-established TCM practitioners work by referral only, treating wellness as diagnosis first, treatment second.' },
      ],
      motoring:[
        { name:'A private classic-car storage viewing, New Territories', note:'Hong Kong’s serious collectors keep cars in climate-controlled facilities well outside the city, shown by introduction only.' },
        { name:'A specialist exotic-car dealer, Wan Chai', note:'A handful of appointment-only dealers serve the territory’s collector market away from the public showrooms.' },
      ],
      cinema:[
        { name:'The Grand Cinema, West Kowloon', note:'A design-forward multiplex with a genuine luxury-recliner premium hall, favoured over the older cinema chains.' },
        { name:'Broadway Cinematheque', note:'An art-house cinema in Yau Ma Tei with a loyal following among Hong Kong’s film community.' },
      ],
      shopping:[
        { name:'Ascot Chang, Hong Kong', note:'A third-generation shirtmaker with a genuinely global bespoke clientele built entirely by referral — no advertising at all.' },
        { name:'A Central district tailoring-house walk-through', note:'Several of Hong Kong’s old-school tailoring houses, some over 70 years old, still work largely by word of mouth.' },
      ],
      holiday:{ name:'A junk boat weekend, outlying islands', note:'The local answer to a yacht charter, at a fraction of the fuss and cost.' } },
    { key:'dubai', label:'Dubai', region:'Middle East',
      hotels:[
        { name:'Al Maha, a Ritz-Carlton Reserve', note:'A desert resort an hour from the city rather than another tower on the Marina.' },
        { name:'Burj Al Arab, Royal Suite', note:'The sail-shaped skyline icon — the Royal Suite is Dubai’s single most recognisable expression of scale.' },
        { name:'One&Only The Palm', note:'Beachfront villas on the Palm with a level of privacy the Marina towers simply can’t offer.' },
        { name:'Armani Hotel Dubai', note:'Giorgio Armani’s own five-star inside the Burj Khalifa — the designer’s aesthetic applied to the world’s tallest building.' },
      ],
      restaurants:[
        { name:'A private majlis dinner with a local family', note:'The real Emirati hospitality tradition — not on any booking platform, extended by introduction.' },
        { name:'Nobu Dubai, Atlantis The Palm', note:'The global name’s Dubai outpost, with an over-the-top-of-the-Palm setting few other cities can match.' },
        { name:'Pierchic', note:'An overwater pavilion off Madinat Jumeirah — one of the most photographed fine-dining settings in the Gulf, and still genuinely good.' },
      ],
      events:[
        { name:'Camel racing at dawn, Al Marmoom track', note:'Free, public, and almost entirely un-touristed — go before sunrise.' },
        { name:'Dubai World Cup, Meydan trackside box', note:'The world’s richest horse race — a trackside hospitality box turns an evening at Meydan into the Gulf’s grandest racing occasion.' },
        { name:'A private falconry excursion', note:'A traditional Emirati falconer’s morning demonstration in the desert, arranged directly rather than through a resort activity desk.' },
      ],
      spas:[
        { name:'Talise Spa, Burj Al Arab', note:'A two-floor spa inside the sail — private couples’ suites and a hydrotherapy pool built for genuinely long stays.' },
        { name:'Six Senses Spa, Dubai', note:'A wellness philosophy built around sleep and recovery science rather than a standard treatment menu.' },
      ],
      motoring:[
        { name:'A private hypercar showroom, Sheikh Zayed Road', note:'Dubai’s appointment-only exotic-car showrooms stock inventory well beyond what’s displayed on the general forecourt.' },
        { name:'A desert supercar drive, private guide', note:'A guided highway-and-dune convoy arranged through a specialist rather than a general rental agency.' },
      ],
      cinema:[
        { name:'Reel Cinemas, Platinum Suite', note:'Full-recliner private-suite screenings at the Dubai Mall — dedicated butler service rather than standard concession counters.' },
        { name:'A private desert outdoor screening', note:'Several event companies arrange a full cinema setup under the stars in the desert, entirely private.' },
      ],
      shopping:[
        { name:'A Dubai Mall Fashion Avenue private appointment', note:'The mall’s flagship maisons offer after-hours private shopping for established clients away from the general floor.' },
        { name:'A bespoke thobe or kandura tailor, by referral', note:'The genuinely serious traditional tailors work almost entirely by local referral rather than tourist-facing storefronts.' },
      ],
      holiday:{ name:'A guided crossing of the Empty Quarter', note:'A multi-day traverse of the Rub’ al Khali with a proper desert guide, rather than a one-hour dune-bashing tour.' } },
    { key:'rome', label:'Rome', region:'Europe',
      hotels:[
        { name:'J.K. Place Roma', note:'A small townhouse hotel near the Spanish Steps, deliberately residential-feeling rather than a grand hotel lobby.' },
        { name:'Hotel de Russie', note:'A Rocco Forte property with a hidden terraced garden between the Spanish Steps and Piazza del Popolo — one of Rome’s best-kept outdoor spaces.' },
        { name:'Hotel Eden', note:'A Dorchester Collection address with a rooftop restaurant looking straight across the whole city — favoured by a quieter, older Rome crowd.' },
        { name:'Hotel Hassler Roma', note:'Family-owned since 1944, sitting directly atop the Spanish Steps — the address that has hosted Roman Holiday-era Hollywood ever since.' },
      ],
      restaurants:[
        { name:'Retrobottega', note:'A young, ingredient-driven kitchen locals talk about more than tourists do — no tablecloths, no ceremony, real technique.' },
        { name:'La Pergola', note:'Rome’s only three-Michelin-star restaurant, atop the Rome Cavalieri — the city’s rooftop dining reference point.' },
        { name:'Pipero Roma', note:'A Michelin-starred room near Piazza Navona known for a tasting menu that keeps a genuinely Roman identity rather than chasing trends.' },
      ],
      events:[
        { name:'A private after-hours palazzo opening', note:'Several of Rome’s smaller Renaissance palazzo museums can be opened for a private evening viewing through a well-connected fixer.' },
        { name:'A private Vatican Museums after-hours tour', note:'Arranged through the Vatican’s own private-tour office — the Sistine Chapel with no crowds and no queue.' },
        { name:'Opera at the Baths of Caracalla', note:'The Rome Opera’s summer open-air season, staged among ancient ruins — a genuinely singular setting, not a normal opera house.' },
      ],
      spas:[
        { name:'QC Termeroma', note:'A Roman-baths-inspired spa built into a converted 16th-century convent — thermal circuits echoing the city’s own bathing history.' },
        { name:'The spa at Rome Cavalieri', note:'A serious wellness floor beneath La Pergola’s own hotel — treatments that pair naturally with a stay for the restaurant.' },
      ],
      motoring:[
        { name:'A private classic Lancia or Alfa specialist, by referral', note:'Rome’s vintage-Italian specialists work mostly through introduction rather than a public storefront.' },
        { name:'A guided vintage Vespa or Lambretta tour', note:'A genuinely well-kept fleet and a private guide through Rome’s centre, arranged rather than a tourist rental stand.' },
      ],
      cinema:[
        { name:'Cinema Barberini', note:'A restored 1929 cinema on Piazza Barberini — one of Rome’s most architecturally significant surviving picture houses.' },
        { name:'A private Cinecittà studio tour and screening', note:'Rome’s legendary film studios arrange private tours and small screenings for serious industry guests.' },
      ],
      shopping:[
        { name:'A Via dei Condotti private appointment', note:'The maisons along Rome’s luxury shopping street offer after-hours viewings for established clients.' },
        { name:'A Roman sartoria walk-through, by introduction', note:'Rome’s tailoring scene is quieter than Naples’ but no less serious — access still runs mainly through referral.' },
      ],
      holiday:{ name:'A bespoke tailoring trip', note:'Rome’s sartoria scene is quieter than Naples’ but no less serious — a fitting trip built around the city rather than the obvious sights.' } },
    { key:'vienna', label:'Vienna', region:'Europe',
      hotels:[
        { name:'Das Triest', note:'A converted 18th-century stable block designed by Terence Conran — discreet compared to the grand hotels lining the Ringstrasse.' },
        { name:'Hotel Sacher Wien', note:'The original, directly opposite the State Opera — the Sachertorte is the least interesting reason to know the name.' },
        { name:'Palais Coburg', note:'Private residence-style suites inside a real 19th-century palace, with one of Europe’s most serious hotel wine cellars beneath it.' },
        { name:'Hotel Imperial, a Luxury Collection Hotel', note:'A former Habsburg-era private palace on the Ringstrasse — Vienna’s most formally correct address for well over a century.' },
      ],
      restaurants:[
        { name:'Steirereck', note:'Regularly rated among the best restaurants in the world, yet still primarily a locals’ destination rather than a tourist stop.' },
        { name:'Amador', note:'Vienna’s three-Michelin-star room, built around small, precisely composed tapas-scale courses — unusual for the city, and exceptional.' },
        { name:'Le Ciel by Toni Mörwald', note:'A Michelin-starred dining room inside the Grand Hotel Wien, directly opposite the Opera — formal, serious, old Vienna in tone.' },
      ],
      events:[
        { name:'A subscriber’s box at the Vienna State Opera', note:'Season box-holders can bring guests to a seat no public ticket window sells.' },
        { name:'Vienna Opera Ball (Opernball)', note:'The city’s single grandest social fixture — white tie, the Opera House floor converted for dancing, and a guest list decades in the making.' },
        { name:'A Lipizzaner morning training, Spanish Riding School', note:'The classical dressage school’s morning exercise sessions, watched from the same hall as the public performances but with none of the crowd.' },
      ],
      spas:[
        { name:'Kurhaus Oberlaa', note:'Vienna’s own historic thermal spa complex, drawing on real mineral springs rather than a hotel treatment menu.' },
        { name:'The spa at Palais Coburg', note:'A subterranean wellness floor beneath the palace, built into its original 19th-century foundations.' },
      ],
      motoring:[
        { name:'A private vintage-car collection viewing, Lower Austria', note:'Several Austrian collectors maintain private garages open by introduction, a short drive from the city.' },
        { name:'A classic Puch or Steyr heritage specialist, by referral', note:'Austria’s own historic marques have a small, dedicated specialist scene largely unknown outside the country.' },
      ],
      cinema:[
        { name:'Gartenbaukino', note:'A restored 1919 cinema with one of the largest single screens in Vienna — a genuine event venue as much as a cinema.' },
        { name:'A private Burgtheater or State Opera behind-the-scenes evening', note:'Arranged through patron circles — a very different evening from a standard ticketed performance.' },
      ],
      shopping:[
        { name:'A Kohlmarkt private appointment', note:'Vienna’s most formal shopping street offers after-hours private viewings for established clients at several of its houses.' },
        { name:'Knize (Adolf Loos-designed tailoring house)', note:'A historic Viennese tailoring name working from an architecturally significant early-modernist shopfront.' },
      ],
      holiday:{ name:'The Salzkammergut lake district', note:'Old Austrian aristocracy’s actual holiday country, an hour or two from Vienna and a world away from it.' } },
    { key:'zurich', label:'Zurich', region:'Europe',
      hotels:[
        { name:'Storchen Zürich', note:'On the river, family-run for generations, favoured by locals over the big international chains along the lake.' },
        { name:'Baur au Lac', note:'Lakeside and family-owned since 1844 — the address Zurich’s own old money has never seen a reason to leave.' },
        { name:'Dolder Grand', note:'A castle-turned-hotel above the city with its own art collection and spa — a genuinely different register from the downtown properties.' },
        { name:'Hotel Eden au Lac', note:'A restored 19th-century lakefront address, smaller and quieter than the grander names, favoured for its residential feel.' },
      ],
      restaurants:[
        { name:'Kronenhalle', note:'A genuine Zurich institution where the art on the walls — real Picassos, Chagalls, Mirós — was paid for by artists settling their bar tabs.' },
        { name:'Restaurant Ecco', note:'Two Michelin stars inside the Atlantis by Giardino — technical, exacting cooking well away from the tourist restaurants on the lake.' },
        { name:'Widder Restaurant', note:'A Michelin-recognised room inside a converted row of medieval guild houses in the old town — history and serious cooking in the same address.' },
      ],
      events:[
        { name:'A private preview before a major watch or art auction', note:'Zurich’s smaller, serious auction houses run appointment-only previews before the public sale.' },
        { name:'Zurich Opera House, gala evening', note:'One of the world’s better-funded opera houses, with a gala calendar that draws serious patrons rather than tourists.' },
        { name:'A private Bahnhofstrasse jeweller viewing', note:'An appointment-only back-room viewing at one of the flagship houses along Zurich’s famous shopping street.' },
      ],
      spas:[
        { name:'The spa at Dolder Grand', note:'A 4,000m² wellness floor above the city — one of the largest hotel spas in Switzerland, with its own art collection running through it.' },
        { name:'A day trip to Bad Ragaz', note:'Switzerland’s renowned thermal spa town, roughly an hour from Zurich — genuine mineral springs rather than a heated hotel pool.' },
      ],
      motoring:[
        { name:'Lukas Hüni AG', note:'A respected Swiss classic and competition car dealer, appointment-only, trusted by serious European collectors.' },
        { name:'A private vintage-car storage viewing, Zurich outskirts', note:'Several Swiss collectors keep cars in climate-controlled private facilities shown by introduction only.' },
      ],
      cinema:[
        { name:'Kino Arthouse Le Paris', note:'A long-standing single-screen cinema favoured by Zurich’s own film community over the multiplex chains.' },
        { name:'A private screening room, Zurich members’ club', note:'A handful of Zurich’s private clubs maintain small screening rooms for members and guests.' },
      ],
      shopping:[
        { name:'A Bahnhofstrasse private appointment', note:'Several maisons along Zurich’s flagship shopping street offer serious clients after-hours private viewings.' },
        { name:'Grieder', note:'A long-established Zurich multi-brand luxury store carrying a genuinely well-edited menswear floor.' },
      ],
      holiday:{ name:'A base for the Swiss watch valleys', note:'Zurich as the practical hub for reaching Vallée de Joux, Neuchâtel and private banking meetings alike.' } },
    { key:'madrid', label:'Madrid', region:'Europe',
      hotels:[
        { name:'Hotel Orfila', note:'An 1886 townhouse near Chueca, deliberately small and residential rather than another grand Gran Vía address.' },
        { name:'Rosewood Villa Magna', note:'A Paseo de la Castellana address favoured by Madrid’s own establishment over the more tourist-facing grand hotels.' },
        { name:'Mandarin Oriental Ritz, Madrid', note:'The 1910 original, restored — still the name older Madrid families mean when they simply say “the Ritz.”' },
        { name:'Four Seasons Madrid', note:'A restored historic block in the Centro district — a newer five-star that quickly became a favourite of Madrid’s business and social establishment.' },
      ],
      restaurants:[
        { name:'Casa Lucio', note:'A genuinely old-Madrid table that Madrileños themselves still book, not a tapas bar built for visitors.' },
        { name:'DiverXO', note:'Spain’s only three-Michelin-star restaurant outside the Basque Country — Dabiz Muñoz’s theatrical, globally-inflected cooking at full intensity.' },
        { name:'Horcher', note:'A Madrid institution since 1943, serving central-European game cookery essentially unchanged for generations.' },
      ],
      events:[
        { name:'A members’ evening at Casino de Madrid', note:'A grand 19th-century private society — not a gambling casino in the modern sense — largely unknown to visitors.' },
        { name:'A Real Madrid presidential box match', note:'The Bernabéu’s presidential tier — access runs through club patronage and relationships, not the public box office.' },
        { name:'Feria de San Isidro, palco seats', note:'Bullfighting’s grandest annual season at Las Ventas — a private palco is a different evening entirely from the general terraces.' },
      ],
      spas:[
        { name:'Medina Mayrit', note:'A genuine Arab-bath-style spa built into a restored historic building — an experience closer to Andalusian tradition than a standard hotel treatment.' },
        { name:'The spa at Rosewood Villa Magna', note:'A quieter, residential-feeling wellness floor favoured by Madrid’s own establishment over the larger tourist-hotel spas.' },
      ],
      motoring:[
        { name:'A private classic-car collection viewing, by referral', note:'Madrid’s serious collectors keep cars largely out of public view, accessible only through personal introduction.' },
        { name:'A specialist exotic dealer, Salamanca district', note:'A handful of appointment-only dealers serve the city’s collector market from the same upscale district as the fashion houses.' },
      ],
      cinema:[
        { name:'Cine Doré', note:'Madrid’s oldest cinema, now home to the Spanish national film archive — a genuinely historic single-screen setting.' },
        { name:'A private screening, Casino de Madrid', note:'The private society occasionally hosts small screening evenings for its own members.' },
      ],
      shopping:[
        { name:'A Calle Serrano private appointment', note:'Madrid’s premier shopping street offers after-hours private viewings at several of its flagship houses.' },
        { name:'A Salamanca-district bespoke tailor, by referral', note:'Madrid’s own tailoring scene is quieter than Rome’s or Naples’, but access still runs through introduction rather than a shopfront.' },
      ],
      holiday:{ name:'Extremadura’s dehesa jamón country', note:'Touring the pasture farms where real ibérico ham is actually produced, rather than the tourist-facing tapas-bar version of it.' } },
    { key:'berlin', label:'Berlin', region:'Europe',
      hotels:[
        { name:'Hotel de Rome', note:'A former bank headquarters turned hotel, architecturally serious and quieter than the big chain names near the Brandenburg Gate.' },
        { name:'Hotel Adlon Kempinski', note:'The historic Pariser Platz address, rebuilt on the original site — still the name Berlin’s establishment defaults to for a grand stay.' },
        { name:'Regent Berlin', note:'A formally traditional Gendarmenmarkt hotel, quieter and more classically appointed than the newer design-led properties.' },
        { name:'Ritz-Carlton, Berlin', note:'A Potsdamer Platz landmark built in a deliberately grand pre-war style — Berlin’s modern equivalent of an old-world five-star.' },
      ],
      restaurants:[
        { name:'Rutz', note:'An unassuming shopfront hiding one of Germany’s most awarded wine and tasting-menu rooms.' },
        { name:'Tim Raue', note:'Two Michelin stars for Asian-inflected cooking from a chef who built his reputation on precision rather than spectacle.' },
        { name:'Facil', note:'A Michelin-starred rooftop garden restaurant hidden above a Potsdamer Platz office block — genuinely surprising the first time you find it.' },
      ],
      events:[
        { name:'A private studio visit with a gallery artist', note:'Arranged directly through a Berlin gallery rather than attending a public opening.' },
        { name:'Berlinale, VIP screenings', note:'Industry and patron screenings at the Berlin International Film Festival, well away from the public ticket queues.' },
        { name:'A private Reichstag dome evening tour', note:'An after-hours visit to Norman Foster’s glass dome, arranged through a member of the Bundestag rather than the public booking system.' },
      ],
      spas:[
        { name:'Vabali Spa Berlin', note:'A large Southeast Asian-inspired spa village on the edge of the city — genuinely spacious grounds rather than a single hotel floor.' },
        { name:'The spa at Regent Berlin', note:'A quieter, more traditional hotel wellness floor favoured by Berlin’s own business establishment.' },
      ],
      motoring:[
        { name:'A private vintage Mercedes or Porsche heritage visit, Stuttgart day trip', note:'Both marques’ factory museums offer private curator-led tours for serious enthusiasts, a train ride from Berlin.' },
        { name:'A specialist classic-car dealer, Charlottenburg', note:'A handful of Berlin dealers work almost entirely by appointment with a serious European collector base.' },
      ],
      cinema:[
        { name:'Delphi Filmpalast', note:'A restored 1929 art deco cinema — one of Berlin’s most architecturally significant surviving picture houses, also used for premieres.' },
        { name:'A private Babelsberg Studios tour and screening', note:'Europe’s oldest large-scale film studio complex arranges private tours and small screenings for serious industry guests.' },
      ],
      shopping:[
        { name:'A Kurfürstendamm private appointment', note:'Berlin’s traditional luxury shopping boulevard offers after-hours viewings at several established houses.' },
        { name:'A Mitte-district tailoring atelier, by referral', note:'A small, serious tailoring scene has grown in Berlin’s Mitte district, known mainly by word of mouth.' },
      ],
      holiday:{ name:'The Uckermark lake country', note:'Where wealthy Berliners actually go to disappear for the weekend, north of the city and largely undiscovered by visitors.' } },
    { key:'stockholm', label:'Stockholm', region:'Europe',
      hotels:[
        { name:'Ett Hem', note:'A converted 1910 townhouse with only 12 rooms, run more like a private home than a hotel.' },
        { name:'Grand Hôtel Stockholm', note:'The waterfront address that has hosted the Nobel laureates’ own stay every December since the prizes began.' },
        { name:'Miss Clara by Nobis', note:'A design-forward former school building, favoured by a younger Stockholm crowd over the grander waterfront names.' },
        { name:'Hotel Diplomat Stockholm', note:'An Art Nouveau waterfront classic on Strandvägen, quietly favoured by Stockholm’s own establishment for its residential scale.' },
      ],
      restaurants:[
        { name:'Frantzén', note:'One of the hardest tables to get in Europe — a converted 18th-century building with a handful of seats and a years-long reputation to match.' },
        { name:'Oaxen Krog', note:'Two Michelin stars on Djurgården island — Nordic fine dining in a genuinely beautiful, quiet island setting.' },
        { name:'Gastrologik', note:'A tasting-menu room built entirely around what Swedish foraging and farming produce that particular week — no fixed menu at all.' },
      ],
      events:[
        { name:'A private midsummer celebration on the archipelago', note:'By invitation from a local family on one of the islands, rather than any public event in the city.' },
        { name:'Nobel Prize season events', note:'The banquet itself is by invitation only, but the surrounding week of lectures and receptions has more access points than people assume.' },
        { name:'A private Vasa Museum evening', note:'An after-hours viewing of the preserved 17th-century warship, arranged through the museum’s own patron circle.' },
      ],
      spas:[
        { name:'Yasuragi', note:'A renowned Japanese-inspired spa retreat on the water outside Stockholm — genuinely built around Japanese bathing philosophy, not a themed add-on.' },
        { name:'Sturebadet', note:'An 1885 Stockholm bathhouse-turned-private-club — a genuine historic institution rather than a modern spa brand.' },
      ],
      motoring:[
        { name:'A private Volvo or Saab heritage collection visit', note:'Both Swedish marques maintain heritage holdings shown to serious enthusiasts by private arrangement.' },
        { name:'A specialist classic-car dealer, Östermalm', note:'A small, serious Stockholm dealer scene serving Scandinavian collectors largely by appointment.' },
      ],
      cinema:[
        { name:'Skandia', note:'A 1923 cinema designed by Gunnar Asplund — one of the most architecturally significant single-screen cinemas in Scandinavia.' },
        { name:'A private screening room, Stureplan members’ club', note:'A handful of Stockholm’s private clubs maintain their own small cinema rooms for members and guests.' },
      ],
      shopping:[
        { name:'A Biblioteksgatan private appointment', note:'Stockholm’s premier shopping street offers after-hours private viewings at several established houses.' },
        { name:'Rubato', note:'A small, precisely edited Scandinavian menswear boutique known almost entirely by word of mouth among people who take clothes seriously.' },
      ],
      holiday:{ name:'Sailing the Stockholm archipelago', note:'A week among the 30,000 islands rather than staying in the city itself.' } },
    { key:'edinburgh', label:'Edinburgh', region:'Europe',
      hotels:[
        { name:'Prestonfield House', note:'A 17th-century manor on the edge of the city, deliberately old-world against the modern hotels on Princes Street.' },
        { name:'The Balmoral', note:'The clock-tower landmark at the top of Princes Street — a Rocco Forte hotel that still functions as the city’s grandest social hub.' },
        { name:'The Witchery by the Castle', note:'A handful of theatrical suites steps from the Castle esplanade — small, and genuinely hard to get during festival season.' },
        { name:'Waldorf Astoria Edinburgh – The Caledonian', note:'The city’s other great railway-era grande dame, known simply as “the Caley” — Princes Street’s other formal five-star landmark.' },
      ],
      restaurants:[
        { name:'The Kitchin', note:'A genuinely serious “nature to plate” kitchen run by a local chef, not a Royal Mile spot built for the festival crowds.' },
        { name:'Restaurant Martin Wishart', note:'A Michelin star on the Leith waterfront from one of Scotland’s most consistently decorated chefs.' },
        { name:'Aizle', note:'A no-choice tasting menu built weekly around Scottish seasonal produce — small, serious, and locally rather than tourist booked.' },
      ],
      events:[
        { name:'A private tasting at a working distillery', note:'Arranged directly with a Speyside or Islay distillery rather than through a coach-tour operator.' },
        { name:'Edinburgh Castle, Military Tattoo private box', note:'A hospitality box on the esplanade for August’s Tattoo — a very different evening from the general grandstand.' },
        { name:'Highland Games, VIP enclosure', note:'A hospitality enclosure at one of Scotland’s traditional summer Highland Games meets — chieftain’s-tent access rather than the public field.' },
      ],
      spas:[
        { name:'One Spa, Sheraton Grand Edinburgh', note:'A rooftop-pool wellness floor overlooking the Castle — one of the most serious hotel spas in the city.' },
        { name:'A private Highland spa retreat, by arrangement', note:'Several remote Scottish estates pair sporting stays with a genuine spa wing, well beyond the city itself.' },
      ],
      motoring:[
        { name:'A private classic-car collection viewing, Borders region', note:'Several Scottish collectors keep cars in private estate garages, shown by introduction rather than public display.' },
        { name:'A specialist Highland touring-car hire, by referral', note:'A small, serious operator arranging genuinely well-kept classic cars for Highland touring, distinct from a standard rental agency.' },
      ],
      cinema:[
        { name:'The Cameo', note:'A 1914 single-screen cinema, one of the oldest still operating in Scotland — a genuine local institution beyond the festival crowds.' },
        { name:'A private Edinburgh International Film Festival screening', note:'Industry and patron-tier access to EIFF screenings, well beyond the public ticket allocation.' },
      ],
      shopping:[
        { name:'A George Street private appointment', note:'Edinburgh’s New Town shopping street offers after-hours private viewings at a handful of established houses.' },
        { name:'A bespoke Highland tweed tailor, by referral', note:'Scotland’s own tailoring tradition runs through a small number of serious tweed and country-clothing makers, known mainly by word of mouth.' },
      ],
      holiday:{ name:'Highland sporting trips from Edinburgh', note:'Grouse, stalking or salmon on a private estate, arranged through a sporting agent as a base from the city.' } },
    { key:'singapore', label:'Singapore', region:'Asia',
      hotels:[
        { name:'The Warehouse Hotel', note:'A converted 1895 spice warehouse on the river, quieter and more residential than the big integrated resorts.' },
        { name:'Raffles Singapore', note:'The colonial-era icon, meticulously restored — the address the whole city’s hospitality reputation was built on.' },
        { name:'Capella Singapore', note:'A colonial-mansion-turned-resort on Sentosa — genuinely secluded despite sitting minutes from the main island.' },
        { name:'The Fullerton Hotel Singapore', note:'A restored 1928 former General Post Office on the river — one of the city’s most architecturally significant five-star conversions.' },
      ],
      restaurants:[
        { name:'A hawker stall pointed out by a local', note:'Several genuinely outclass the fine-dining rooms at a fraction of the ceremony — you need someone who already knows which one.' },
        { name:'Odette', note:'Three Michelin stars in the National Gallery — modern French cooking regularly named among the best tables in Asia.' },
        { name:'Les Amis', note:'A long-standing three-Michelin-star French room in the Botanic Gardens — one of Singapore’s original serious fine-dining addresses.' },
      ],
      events:[
        { name:'A members’ evening at The Straits Clan', note:'A modern private members’ club in a restored Chinatown shophouse, guest-of-a-member only.' },
        { name:'Singapore Grand Prix, Paddock Club', note:'The world’s original F1 night race — a Paddock Club pass turns Marina Bay into serious hospitality rather than a public grandstand.' },
        { name:'A private after-hours Gardens by the Bay tour', note:'The Supertree Grove and conservatories without the day’s crowds, arranged through the gardens’ own events office.' },
      ],
      spas:[
        { name:'The spa at Capella Singapore', note:'A colonial-mansion wellness wing on Sentosa — treatment rooms with genuine architectural history rather than a modern build.' },
        { name:'CHI, The Spa at Shangri-La', note:'A serious Asian-wellness treatment philosophy applied at real scale — one of the city’s more established hotel spa names.' },
      ],
      motoring:[
        { name:'A private classic-car collection viewing, Sentosa', note:'Several Singapore-based collectors keep cars in private facilities shown by introduction, distinct from the public car museums.' },
        { name:'A specialist exotic-car dealer, Ubi district', note:'A handful of appointment-only dealers serve Singapore’s notoriously high-cost collector market away from the general showrooms.' },
      ],
      cinema:[
        { name:'The Projector', note:'An independent cinema inside a restored 1970s Golden Mile complex — favoured by Singapore’s own film and design community.' },
        { name:'GV Gold Class, private suite booking', note:'Full-recliner private-suite cinema booking, a genuine step above the standard multiplex experience.' },
      ],
      shopping:[
        { name:'The Armoury, Singapore', note:'The globally respected menswear retailer’s Southeast Asian outpost — a reference point for the region’s classic-menswear scene.' },
        { name:'A Tanglin Shopping Centre bespoke tailor, by referral', note:'A small cluster of serious Singapore tailors work largely by word of mouth rather than storefront visibility.' },
      ],
      holiday:{ name:'A weekend on Bintan', note:'A short ferry to the nearby Indonesian island that Singaporeans themselves treat as their actual weekend escape.' } },
    { key:'losangeles', label:'Los Angeles', region:'North America',
      hotels:[
        { name:'San Vicente Bungalows', note:'A members’-club-and-hotel hybrid with a strict no-photos policy — discretion as the entire point, not a marketing line.' },
        { name:'Hotel Bel-Air', note:'Dorchester Collection grounds with swans on the lake — old Hollywood’s actual quiet address, away from the Strip entirely.' },
        { name:'Chateau Marmont', note:'The industry’s longest-running discretion policy, in bungalow form — a genuine Hollywood institution that has earned its own mythology.' },
        { name:'The Beverly Hills Hotel', note:'The Pink Palace since 1912 — the Polo Lounge alone has hosted more quiet industry dealmaking than most studio boardrooms.' },
      ],
      restaurants:[
        { name:'Dan Tana’s', note:'An old-school Hollywood favourite that has never once advertised and doesn’t need to — regulars have been regulars for decades.' },
        { name:'Providence', note:'Two Michelin stars for seafood-led fine dining — regularly named the best restaurant in the city by people who eat everywhere.' },
        { name:'Mélisse', note:'A long-standing Michelin-starred Santa Monica room favoured by an older, more established LA dining crowd.' },
      ],
      events:[
        { name:'A private studio-lot screening', note:'Arranged through industry contacts in a real working screening room, not a public premiere.' },
        { name:'Academy Awards after-party circuit', note:'The Vanity Fair and Governors Ball tiers are entirely by invitation — the ceremony itself is the least exclusive part of the night.' },
        { name:'A private Getty Villa evening', note:'An after-hours event in the recreated Roman villa above the Pacific, arranged through the museum’s own patron programme.' },
      ],
      spas:[
        { name:'The Spa at Four Seasons Beverly Hills', note:'A quiet, discretion-focused wellness floor favoured by industry regulars who’d rather not be recognised mid-treatment.' },
        { name:'Shibumi Spa, The Beverly Wilshire', note:'A Japanese-inspired spa inside a genuine old-Hollywood address, favoured over the newer, flashier LA spa brands.' },
      ],
      motoring:[
        { name:'Beverly Hills Car Club', note:'A well-known classic-car dealer with a genuinely serious inventory, appointment viewings for the rarer stock.' },
        { name:'The Petersen Automotive Museum, private vault tour', note:'A curator-led tour of the museum’s below-ground “Vault” collection, arranged outside general admission hours.' },
      ],
      cinema:[
        { name:'The Cinerama Dome', note:'An architecturally iconic single-screen dome cinema on Sunset — still used for genuine industry premieres.' },
        { name:'A private studio screening room, by industry introduction', note:'Working studio lots maintain formal screening rooms used for private cuts and premieres, well away from any public cinema.' },
      ],
      shopping:[
        { name:'Native Sons', origin:'Los Angeles, USA', note:'Small-run, Japan-made eyewear favoured by people who’ve already worn out the obvious designer names.' },
        { name:'A Rodeo Drive private appointment', note:'Beverly Hills’ flagship shopping street offers after-hours private viewings at several of its houses.' },
      ],
      holiday:{ name:'Ojai or the Santa Ynez Valley', note:'LA’s quiet wine-country retreat that isn’t Napa and isn’t trying to be.' } },
    { key:'buenosaires', label:'Buenos Aires', region:'South America',
      hotels:[
        { name:'Home Hotel Buenos Aires', note:'A small, design-led boutique in Palermo, chosen over the grand palace hotels for its scale and quiet.' },
        { name:'Alvear Palace Hotel', note:'Recoleta’s belle époque icon — Buenos Aires’ own establishment has stayed here for a century, and still does.' },
        { name:'Palacio Duhau – Park Hyatt Buenos Aires', note:'A restored 1930s palace with its own private garden and wine cellar, next door to the French embassy.' },
        { name:'Faena Hotel Buenos Aires', note:'A Philippe Starck-designed reinvention of a Puerto Madero grain warehouse — the city’s most theatrical modern five-star.' },
      ],
      restaurants:[
        { name:'A parrilla recommended by a local butcher', note:'The real steakhouse recommendation chain runs through the meat trade, not a tourist “best of” list.' },
        { name:'Don Julio', note:'Regularly ranked among the best steakhouses on earth — famous now, but still the parrilla locals themselves actually book.' },
        { name:'Elena, Four Seasons Buenos Aires', note:'A Michelin-recognised grill inside the old Duhau mansion — formal Argentine steakhouse cooking done at hotel-restaurant precision.' },
      ],
      events:[
        { name:'A private polo match at a Campo Argentino estancia', note:'By invitation only — Argentine polo’s serious matches are rarely open to the general public.' },
        { name:'Argentine Open Polo Championship, VIP box', note:'The sport’s world championship, held at Palermo’s polo grounds — a box seat among the game’s serious patrons.' },
        { name:'A private tango salon evening', note:'A milonga arranged in a genuine, non-touristed salon rather than a dinner-show built for visitors.' },
      ],
      spas:[
        { name:'The spa at Palacio Duhau', note:'A wellness floor built into the old mansion’s original footprint — one of the more serious hotel spas in the city.' },
        { name:'Aqua Vita', note:'A well-regarded Buenos Aires day spa favoured by locals over the larger hotel wellness brands.' },
      ],
      motoring:[
        { name:'A private classic-car collection viewing, by referral', note:'Argentina’s serious collectors — including several from the polo and racing world — keep cars largely out of public view.' },
        { name:'A specialist exotic dealer, Recoleta', note:'A small, appointment-only Buenos Aires dealer scene serves the country’s collector market.' },
      ],
      cinema:[
        { name:'Cine Gaumont', note:'A restored historic single-screen cinema, part of the city’s state film institute — a genuine cultural landmark.' },
        { name:'A private screening, Jockey Club Argentino', note:'The historic club occasionally hosts private screening evenings for its own members.' },
      ],
      shopping:[
        { name:'A Recoleta private appointment', note:'Buenos Aires’ most formal shopping district offers after-hours viewings at a handful of established houses.' },
        { name:'A Palermo Soho bespoke leather atelier, by referral', note:'Argentina’s leather tradition runs through a number of small, serious ateliers known mainly by word of mouth.' },
      ],
      holiday:{ name:'A week on a Pampas estancia', note:'Horsemanship and asado on a working ranch, rather than another week in the city.' } },
    { key:'capetown', label:'Cape Town', region:'Africa',
      hotels:[
        { name:'Ellerman House', note:'A small clifftop mansion above Bantry Bay, quieter and more private than the big waterfront hotels.' },
        { name:'The Silo Hotel', note:'Penthouse suites atop the old grain silo at the V&A Waterfront, above Africa’s largest contemporary art museum.' },
        { name:'One&Only Cape Town', note:'A private island-style resort inside the working waterfront, with Table Mountain views most hotels in the city can’t match.' },
        { name:'The Twelve Apostles Hotel', note:'Set directly into the mountainside between the city and the ocean — one of the most dramatically located five-stars anywhere.' },
      ],
      restaurants:[
        { name:'A braai hosted at a Cape wine estate', note:'The real local version of a restaurant reservation — an invitation to a farm braai rather than a table in the city.' },
        { name:'La Colombe', note:'A Constantia institution, consistently ranked among Africa’s best restaurants — serious technique in a genuinely beautiful vineyard setting.' },
        { name:'Wolfgat-style destination dining, Western Cape', note:'The tasting-menu tradition Wolfgat began — remote, produce-obsessed rooms worth the drive out of the city on their own.' },
      ],
      events:[
        { name:'A private cellar tasting, small Stellenbosch estate', note:'A family-run producer’s own cellar rather than the big-name wineries on the tour-bus circuit.' },
        { name:'A private Table Mountain sunset flight and dinner', note:'A helicopter transfer and a table arranged above the city at dusk — booked through a private aviation operator, not a tour desk.' },
        { name:'Cape Town International Jazz Festival, VIP', note:'Africa’s largest jazz festival — VIP access means artist-side viewing rather than the general festival crowd.' },
      ],
      spas:[
        { name:'The Angsana Spa, Twelve Apostles', note:'A clifftop treatment floor between mountain and ocean — few spas anywhere combine both views at once.' },
        { name:'A private thalassotherapy treatment, Atlantic Seaboard', note:'Seawater-based treatments arranged in a private clinic setting overlooking the coast.' },
      ],
      motoring:[
        { name:'A private classic-car collection viewing, Stellenbosch', note:'Several South African collectors keep cars in private wine-country garages, shown by introduction.' },
        { name:'A Franschhoek supercar touring day', note:'A specialist operator arranging a genuinely well-kept convoy through the Cape winelands, distinct from a general rental.' },
      ],
      cinema:[
        { name:'The Labia Theatre', note:'A converted former ballroom turned art-house cinema — one of the oldest independent cinemas in South Africa.' },
        { name:'A private outdoor screening, wine estate lawn', note:'Several Stellenbosch and Franschhoek estates arrange full private cinema setups on their own grounds.' },
      ],
      shopping:[
        { name:'A V&A Waterfront private appointment', note:'A handful of flagship houses at the Waterfront offer after-hours private viewings for established clients.' },
        { name:'A Cape Town bespoke leather or safari-tailoring atelier, by referral', note:'A small, serious local tailoring and leather scene serves the city’s established families largely by word of mouth.' },
      ],
      holiday:{ name:'A self-drive along the Garden Route', note:'Small guesthouses strung along the coast, in place of one big resort stay.' } },
    { key:'marrakech', label:'Marrakech', region:'Africa',
      hotels:[
        { name:'A small riad in the medina', note:'A handful of rooms behind an unmarked door, rather than one of the big resort compounds outside town.' },
        { name:'La Mamounia', note:'The legendary palace hotel with its own historic gardens — the name that put Marrakech on the luxury map in the first place.' },
        { name:'Royal Mansour Marrakech', note:'Private riads within a single resort, each with its own rooftop terrace and dedicated staff entrance beneath the streets.' },
        { name:'Four Seasons Resort Marrakech', note:'A large, landscaped resort just outside the medina walls — a more contemporary five-star register than the palace hotels within.' },
      ],
      restaurants:[
        { name:'A home-cooked meal in a private riad', note:'Arranged through a local fixer — the real Marrakchi cooking happens in homes, not on restaurant menus.' },
        { name:'Le Jardin', note:'A courtyard restaurant in the medina, genuinely favoured by Marrakech’s own creative and hospitality crowd over the tourist rooftop bars.' },
        { name:'Dar Yacout', note:'A restored riad turned restaurant known for a rooftop setting and a traditional Moroccan menu served across several courses.' },
      ],
      events:[
        { name:'A guided evening off the main Djemaa el-Fna square', note:'The quieter side streets and smaller squares, with a local guide who knows which stalls and musicians are worth the detour.' },
        { name:'A private hammam and spa evening, Royal Mansour', note:'An after-hours spa arranged for a single party, rather than the shared communal hammam experience.' },
        { name:'A desert camp dinner under the stars, Agafay', note:'A private table set in the rocky Agafay desert less than an hour from the city — dinner without the multi-day Sahara trip.' },
      ],
      spas:[
        { name:'La Mamounia Spa', note:'One of the most genuinely iconic hotel spas in Africa — traditional hammam ritual set inside the palace’s own historic grounds.' },
        { name:'A private hammam in a restored riad', note:'A single-party traditional steam and scrub ritual, arranged in a small riad rather than a shared public bathhouse.' },
      ],
      motoring:[
        { name:'A private vintage Land Rover desert tour', note:'A specialist operator running genuinely well-kept classic 4x4s into the Atlas foothills, distinct from a standard dune-buggy rental.' },
        { name:'A classic-car concierge drive through the Palmeraie', note:'A private chauffeured tour in a well-kept vintage vehicle through Marrakech’s palm-grove district.' },
      ],
      cinema:[
        { name:'Cinéma Colisée', note:'A restored art deco cinema in the Gueliz district — one of Marrakech’s most architecturally notable single screens.' },
        { name:'A private riad rooftop screening', note:'Several riads will arrange a full outdoor cinema setup on their own rooftop terrace for a private party.' },
      ],
      shopping:[
        { name:'A Gueliz district concept-store appointment', note:'Marrakech’s newer design district carries genuinely well-edited North African and international menswear away from the souk stalls.' },
        { name:'A bespoke babouche or leather atelier, by referral', note:'The medina’s serious leather craftsmen work largely by referral, distinct from the tourist-facing souk stands.' },
      ],
      holiday:{ name:'A multi-day trip into the Atlas Mountains', note:'Berber villages and mountain guesthouses, well beyond the city itself.' } },
    { key:'shanghai', label:'Shanghai', region:'Asia',
      hotels:[
        { name:'The Middle House', note:'A design-led hotel in the former French Concession, quieter and more residential than the Bund’s grand hotels.' },
        { name:'The Peninsula Shanghai', note:'A grand Bund address built in the same classical style as the historic 1920s trading houses either side of it.' },
        { name:'Mandarin Oriental Pudong', note:'River-facing suites looking straight across at the Bund skyline — the view the Puxi side hotels can’t offer.' },
        { name:'Fairmont Peace Hotel', note:'The Bund’s original 1929 art deco icon — old Shanghai’s single most historically significant hotel address.' },
      ],
      restaurants:[
        { name:'A speakeasy-style Huaiyang restaurant', note:'Tucked into the former French Concession, found by introduction rather than a listing.' },
        { name:'Ultraviolet by Paul Pairet', note:'A single ten-seat table for a fully immersive tasting menu — regularly named among the hardest reservations on earth.' },
        { name:'Fu He Hui', note:'Michelin-starred vegetarian fine dining in a converted French Concession lane house — serious technique applied entirely without meat.' },
      ],
      events:[
        { name:'A private viewing at a small French Concession gallery', note:'Independent galleries rather than the major museum openings everyone already knows about.' },
        { name:'Shanghai Fashion Week, front row', note:'Seating decided by the individual houses — the difference between a public livestream and an actual invitation.' },
        { name:'A private Bund rooftop evening', note:'A members’-only rooftop bar booking overlooking the river, arranged through hotel or club connections rather than a walk-in queue.' },
      ],
      spas:[
        { name:'The Mandarin Spa, Mandarin Oriental Pudong', note:'A river-view treatment floor with the same skyline outlook as the hotel’s best suites.' },
        { name:'A traditional Chinese tui na massage house, by referral', note:'Shanghai’s serious traditional-medicine practitioners work largely by referral rather than public storefront.' },
      ],
      motoring:[
        { name:'A private classic-car collection viewing, by referral', note:'A small but serious Shanghai collector scene keeps cars largely out of public view.' },
        { name:'A specialist exotic-car dealer, Xintiandi district', note:'A handful of appointment-only dealers serve Shanghai’s collector market from the city’s design-forward retail district.' },
      ],
      cinema:[
        { name:'Shanghai Grand Theatre, private screening', note:'The city’s premier performing-arts venue occasionally hosts private film events beyond its main programme.' },
        { name:'A private French Concession lane-house screening room', note:'Several boutique members’ venues in the former Concession run small private cinema evenings.' },
      ],
      shopping:[
        { name:'A Xintiandi private appointment', note:'Shanghai’s design-led retail district offers after-hours private viewings at several of its flagship houses.' },
        { name:'A former French Concession tailoring atelier, by referral', note:'A small, serious tailoring scene has grown in the old Concession lanes, known mainly by word of mouth.' },
      ],
      holiday:{ name:'A weekend in Suzhou’s classical gardens', note:'An hour from Shanghai — the genteel, unhurried counterpoint to the city’s pace.' } },
    { key:'seoul', label:'Seoul', region:'Asia',
      hotels:[
        { name:'The Shilla’s older, more discreet wing', note:'Favoured over the newer glass towers by those who know the property well.' },
        { name:'Josun Palace, a Luxury Collection Hotel', note:'Built on the site of a former royal shrine in Gangnam — one of Seoul’s most historically grounded new luxury addresses.' },
        { name:'Four Seasons Hotel Seoul', note:'A Gwanghwamun address minutes from the old royal palaces, favoured by an international business clientele for its central discretion.' },
        { name:'Signiel Seoul', note:'Occupying the top floors of Lotte World Tower — the highest and among the most formally correct five-stars in the city.' },
      ],
      restaurants:[
        { name:'A hanwoo omakase counter in Gangnam', note:'Korean beef at a counter that takes reservations by word of mouth rather than an app.' },
        { name:'Gaon', note:'Three Michelin stars for modern hanjeongsik — a full Korean court-style tasting menu taken to its most refined form.' },
        { name:'La Yeon, The Shilla', note:'Three Michelin stars inside the hotel, with a private hanok-style dining room and a view over Namsan.' },
      ],
      events:[
        { name:'A private tea ceremony in a restored Bukchon hanok', note:'Arranged through a cultural fixer in one of the traditional houses in the Bukchon hanok village.' },
        { name:'A private after-hours Gyeongbokgung tour', note:'The main royal palace grounds without the daytime crowds, arranged through the Cultural Heritage Administration’s private-visit office.' },
        { name:'K-pop industry showcase access', note:'Label showcase events ahead of public release — arranged through entertainment-industry contacts rather than fan ticket sales.' },
      ],
      spas:[
        { name:'A private upscale jjimjilbang suite, Gangnam', note:'A single-party version of the traditional Korean bathhouse ritual, distinct from the shared public facilities.' },
        { name:'The spa at Josun Palace', note:'A wellness floor built on the site of a former royal shrine — Korean bathing tradition applied at genuine five-star scale.' },
      ],
      motoring:[
        { name:'A private classic-car collection viewing, by referral', note:'A small, serious Korean collector scene has grown around both domestic and imported classics, known mainly through introduction.' },
        { name:'A specialist exotic-car dealer, Cheongdam-dong', note:'A handful of appointment-only dealers serve Seoul’s collector market from the city’s most exclusive retail district.' },
      ],
      cinema:[
        { name:'CGV Cheongdam CINE&FORET', note:'A design-forward premium cinema with private-suite seating, well above the standard multiplex format.' },
        { name:'A private Bukchon hanok courtyard screening', note:'Several restored traditional houses can be booked for a private outdoor screening evening.' },
      ],
      shopping:[
        { name:'A Cheongdam-dong private appointment', note:'Seoul’s most exclusive shopping district offers after-hours private viewings at several flagship houses.' },
        { name:'A Korean bespoke hanbok-and-tailoring atelier, by referral', note:'A small, serious scene blending traditional Korean tailoring with Western bespoke technique, known mainly by referral.' },
      ],
      holiday:{ name:'The Boseong tea fields or Jeju’s west coast', note:'Away from the main tourist circuit on both counts.' } },
    { key:'sydney', label:'Sydney', region:'Oceania',
      hotels:[
        { name:'The Old Clare Hotel', note:'A converted brewery, design-led and discreet against the big harbour-view names.' },
        { name:'Park Hyatt Sydney', note:'The single best hotel vantage point on the Opera House and Harbour Bridge together — nothing else in the city competes on that view.' },
        { name:'Crown Sydney', note:'A Barangaroo tower with sweeping harbour suites, favoured by a newer, higher-spending Sydney crowd over the older heritage hotels.' },
        { name:'Four Seasons Hotel Sydney', note:'A harbourside address minutes from Circular Quay, favoured by an international business clientele for its central position and formality.' },
      ],
      restaurants:[
        { name:'A chef’s-counter omakase in Potts Point', note:'Small enough that it’s known mainly to locals rather than appearing on visitor itineraries.' },
        { name:'Quay', note:'Peter Gilmore’s harbourfront tasting menu, regularly ranked among Australia’s very best — the view and the cooking both earn their reputation.' },
        { name:'Bennelong', note:'Set inside one of the Opera House’s own shells — genuinely rare to dine inside the building rather than just look at it.' },
      ],
      events:[
        { name:'A members’ evening at the Australian Club', note:'One of Sydney’s oldest private clubs, guest-of-a-member only.' },
        { name:'Sydney to Hobart Yacht Race, start-day box', note:'A harbourside hospitality box for the Boxing Day start — the fleet leaving the Heads is one of Sydney’s great annual sights.' },
        { name:'An Opera House gala opening night', note:'Premiere-night galas for the Opera House’s major seasons — patron and donor tiers still outrank a standard ticket.' },
      ],
      spas:[
        { name:'The spa at Park Hyatt Sydney', note:'A harbour-view wellness floor with the same vantage point as the hotel’s best suites.' },
        { name:'Vie Spa', note:'A well-regarded Sydney day-spa brand favoured by locals for its more clinical, results-driven treatment menu.' },
      ],
      motoring:[
        { name:'A private classic-car collection viewing, by referral', note:'A serious Sydney collector scene, including several historic Australian marques, keeps cars largely out of public view.' },
        { name:'A specialist exotic-car dealer, Rushcutters Bay', note:'A handful of appointment-only dealers serve Sydney’s harbourside collector market.' },
      ],
      cinema:[
        { name:'The State Theatre', note:'A 1929 movie palace on Market Street — one of the most ornate surviving cinemas in the Southern Hemisphere, still used for premieres.' },
        { name:'A private Sydney Opera House screening evening', note:'Occasional private film events are arranged inside the Opera House itself, well beyond its standard programme.' },
      ],
      shopping:[
        { name:'A Castlereagh Street private appointment', note:'Sydney’s premier shopping strip offers after-hours private viewings at several established houses.' },
        { name:'A Paddington bespoke tailoring atelier, by referral', note:'A small, serious Sydney tailoring scene has grown around Paddington, known mainly by word of mouth.' },
      ],
      holiday:{ name:'The Southern Highlands or Hunter Valley', note:'Sydney’s quiet wine-country escape, well away from the coastal tourist run.' } },
    { key:'mexicocity', label:'Mexico City', region:'North America',
      hotels:[
        { name:'Círculo Mexicano', note:'A converted 1930s building in the historic centre, minimalist and quiet against the big international names in Polanco.' },
        { name:'Four Seasons Mexico City', note:'A colonial-style courtyard hotel on Reforma — the address that has anchored the city’s international hospitality scene for decades.' },
        { name:'Las Alcobas, Polanco', note:'A design-led boutique on one of the city’s most exclusive shopping streets, favoured by a design-conscious local crowd.' },
        { name:'The St. Regis Mexico City', note:'A Reforma tower address with the brand’s signature formal butler service — one of the city’s most consistently ranked five-stars.' },
      ],
      restaurants:[
        { name:'A market-stall taco counter, chef-recommended', note:'Picked by a local chef rather than a “best tacos” listicle — the real hierarchy runs through the trade, not the guidebooks.' },
        { name:'Pujol', note:'Enrique Olvera’s tasting menu, a fixture of the world’s best-restaurant lists — the mole madre alone is worth the reservation effort.' },
        { name:'Quintonil', note:'A Polanco tasting-menu room built entirely around Mexican ingredients and technique, consistently ranked among Latin America’s best.' },
      ],
      events:[
        { name:'A private mezcal tasting with a small Oaxacan producer', note:'A family producer’s own selection, arranged directly rather than a bar’s tasting flight.' },
        { name:'A private sunrise balloon flight over Teotihuacán', note:'A dawn flight above the pyramids booked through a private operator rather than a group tour bus.' },
        { name:'A private after-hours Frida Kahlo Museum visit', note:'Casa Azul without the daytime queue, arranged through the museum’s own private-visit programme.' },
      ],
      spas:[
        { name:'Naay Spa, Four Seasons Mexico City', note:'A courtyard-set wellness floor inside the hotel’s historic footprint — treatments paired with the same colonial architecture as the suites.' },
        { name:'A private temazcal ceremony, by arrangement', note:'A traditional Mexican indigenous sweat-lodge ritual, arranged privately rather than as a group tourist activity.' },
      ],
      motoring:[
        { name:'A private classic-car collection viewing, Polanco', note:'A small but serious Mexico City collector scene keeps cars largely out of public view, shown by introduction.' },
        { name:'A specialist exotic-car dealer, Bosques de las Lomas', note:'A handful of appointment-only dealers serve the capital’s collector market from its most exclusive residential district.' },
      ],
      cinema:[
        { name:'Cinema Ópera', note:'A restored historic single-screen cinema in the centre — one of the city’s architecturally notable surviving picture houses.' },
        { name:'A private Chapultepec Castle evening screening', note:'Occasional private cultural events are arranged on the historic castle grounds through patron circles.' },
      ],
      shopping:[
        { name:'A Polanco private appointment, Avenida Presidente Masaryk', note:'Mexico City’s premier shopping street offers after-hours private viewings at several flagship houses.' },
        { name:'A bespoke leather or guayabera atelier, by referral', note:'Mexico’s own tailoring and leather tradition runs through a small number of serious ateliers known mainly by word of mouth.' },
      ],
      holiday:{ name:'San Miguel de Allende', note:'Colonial Mexico’s quieter counterpart to the coastal resorts, a few hours from the city.' } },
  ];

  root.BLACKBOOK_DATA = {
    BRAND_CATEGORIES: BRAND_CATEGORIES,
    CITIES: CITIES,
    catById: function (key) { for (var i=0;i<BRAND_CATEGORIES.length;i++) if (BRAND_CATEGORIES[i].key===key) return BRAND_CATEGORIES[i]; return null; },
    cityById: function (key) { for (var i=0;i<CITIES.length;i++) if (CITIES[i].key===key) return CITIES[i]; return null; },
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.BLACKBOOK_DATA;
})(typeof window !== 'undefined' ? window : this);

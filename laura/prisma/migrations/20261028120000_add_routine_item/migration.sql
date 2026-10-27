-- CreateTable
CREATE TABLE "RoutineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slot" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "product" TEXT,
    "link" TEXT,
    "owned" BOOLEAN NOT NULL DEFAULT true,
    "days" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Starting routine (editable on the Routine page)
INSERT INTO "RoutineItem" ("id", "slot", "text", "product", "link", "owned", "days", "sort") VALUES
  ('ri-am-wash',  'morning',   'Clean & Clear wash',                         'Clean & Clear Deep Action Cream Wash',      'https://www.amazon.co.uk/s?k=Clean+%26+Clear+Deep+Action+Cream+Wash', true,  NULL, 1),
  ('ri-am-eye',   'morning',   'Caffeine eye serum, tap under the eyes',     'The Ordinary Caffeine Solution 5% + EGCG',  'https://www.amazon.co.uk/s?k=The+Ordinary+Caffeine+Solution+5%25+%2B+EGCG', false, NULL, 2),
  ('ri-am-moist', 'morning',   'Mattifying moisturiser',                     'Nutmeg Tea Tree Mattifying Moisturiser',    'https://www.amazon.co.uk/s?k=Nutmeg+Tea+Tree+Mattifying+Moisturiser', true,  NULL, 3),
  ('ri-am-spf',   'morning',   'SPF, every morning',                         'Altruist Oily Skin Cream SPF50, 50ml',      'https://www.amazon.co.uk/s?k=Altruist+Oily+Skin+Cream+SPF50+50ml', false, NULL, 4),
  ('ri-am-oil',   'morning',   'Perfume oil, 1–2 dabs on wrists and neck',   'Eternal Perfume Oils (one single to test)', 'https://www.google.com/search?q=Eternal+Perfume+Oils+best+sellers', false, NULL, 5),
  ('ri-af-water', 'afternoon', 'Drink water',                                NULL, NULL, true, NULL, 1),
  ('ri-pm-wash',  'night',     'Clean & Clear wash',                         'Clean & Clear Deep Action Cream Wash',      'https://www.amazon.co.uk/s?k=Clean+%26+Clear+Deep+Action+Cream+Wash', true,  '0,2,4,5', 1),
  ('ri-pm-exf',   'night',     'Nutmeg exfoliator (instead of Clean & Clear)', 'Nutmeg exfoliator',                       'https://www.amazon.co.uk/s?k=Nutmeg+exfoliator', true, '1,3,6', 2),
  ('ri-pm-moist', 'night',     'Rich moisturiser',                           NULL, NULL, true, NULL, 3),
  ('ri-pm-cloth', 'night',     'Clothes out for tomorrow',                   NULL, NULL, true, NULL, 4),
  ('ri-pm-phone', 'night',     'Phone on charge',                            NULL, NULL, true, NULL, 5);

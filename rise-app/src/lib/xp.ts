export const XP_REWARDS = {
  habitToggle: 10,
  checklistToggle: 5,
  goalStep: 5,
  goalComplete: 100,
};

const RANKS: { level: number; name: string }[] = [
  { level: 1, name: "Dormant" },
  { level: 5, name: "Awakening" },
  { level: 10, name: "Rising" },
  { level: 15, name: "Driven" },
  { level: 25, name: "Relentless" },
  { level: 35, name: "Apex" },
  { level: 50, name: "Legendary" },
  { level: 75, name: "Immortal" },
];

export function rankForLevel(level: number): string {
  let current = RANKS[0].name;
  for (const r of RANKS) {
    if (level >= r.level) current = r.name;
    else break;
  }
  return current;
}

// XP required to climb from `level` to `level + 1`.
function xpRequiredForLevel(level: number): number {
  return 100 + (level - 1) * 25;
}

export function levelFromXp(totalXp: number) {
  let level = 1;
  let remaining = Math.max(0, totalXp);
  while (remaining >= xpRequiredForLevel(level)) {
    remaining -= xpRequiredForLevel(level);
    level += 1;
  }
  return {
    level,
    xpIntoLevel: remaining,
    xpForNextLevel: xpRequiredForLevel(level),
  };
}

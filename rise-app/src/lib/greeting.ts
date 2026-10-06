export const HARSH_LINES = [
  "Excuses don't build anything. Get up and work.",
  "Comfort is the enemy of everything you say you want.",
  "Nobody is coming to save you. Move.",
  "You already know what you haven't done yet.",
  "Mediocre is a choice you keep making.",
  "The version of you that wins isn't scrolling right now.",
  "Stop negotiating with yourself. Start working.",
  "Tired is not an excuse. Weak is a decision.",
  "Every day you waste, someone else is taking it.",
  "Talk is free. Results aren't.",
  "Discipline doesn't care how you feel today.",
  "You don't get what you wish for. You get what you repeat.",
];

export function timeOfDayGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export type CategoryKey =
  | "self-improvement"
  | "health"
  | "social-media"
  | "looks";

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Checklist {
  id: string;
  title: string;
  category?: CategoryKey | "general";
  items: ChecklistItem[];
  createdAt: number;
}

export interface Goal {
  id: string;
  title: string;
  category: CategoryKey | "general";
  unit?: string;
  target: number;
  current: number;
  deadline?: string;
  createdAt: number;
}

export interface RoutineItem {
  id: string;
  text: string;
  done: boolean;
}

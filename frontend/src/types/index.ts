export interface Milestone {
  id: number;
  task_id: number;
  order: number;
  title: string;
  relevance: string;
  done: boolean;
}

export interface Task {
  id: number;
  owner_id: number;
  title: string;
  description: string;
  impact: number;
  effort: number;
  urgency: number;
  priority_score: number;
  status: string;
  is_selected_this_week: boolean;
  selected_at: string | null;
  created_at: string;
  updated_at: string;
  milestones: Milestone[];
}

export interface MilestoneInput {
  title: string;
  relevance: string;
  order?: number;
}

export interface TaskInput {
  title: string;
  description: string;
  impact: number;
  effort: number;
  urgency: number;
  milestones: MilestoneInput[];
}

// Mirrors backend core/config.py defaults so the form can preview the score.
export const WEIGHTS = { impact: 2, urgency: 2, effort: 1 };
export const MILESTONE_MIN = 5;
export const MILESTONE_MAX = 7;
export const WEEKLY_MAX = 3;

export function previewScore(impact: number, urgency: number, effort: number): number {
  return impact * WEIGHTS.impact + urgency * WEIGHTS.urgency - effort * WEIGHTS.effort;
}

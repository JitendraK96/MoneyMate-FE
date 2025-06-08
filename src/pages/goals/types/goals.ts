// types/goals.ts
export interface Contribution {
  id: string;
  goal_id: string;
  amount: number;
  contribution_date: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  name: string;
  description?: string | null;
  target_amount: number;
  current_balance: number;
  target_date: string;
  is_completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  contributions?: Contribution[];
}

export interface GoalFormData {
  name: string;
  description?: string;
  targetAmount: number;
  currentBalance: number;
  targetDate: Date | null;
}

export interface ContributionFormData {
  amount: number;
  contributionDate: Date | null;
  description?: string;
}

export interface GoalProgress {
  progressPercentage: number;
  remainingAmount: number;
  daysRemaining: number;
  isOverdue: boolean;
  averageMonthlyRequired: number;
  projectedCompletionDate: Date | null;
}

export interface GoalSummary {
  totalContributions: number;
  contributionCount: number;
  averageContribution: number;
  lastContributionDate: Date | null;
  monthlyProgress: Record<string, number>;
}

export type GoalStatus = "active" | "completed" | "overdue" | "at_risk";

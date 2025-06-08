// utils/goalUtils.ts
import { differenceInDays, differenceInMonths, format } from "date-fns";
import { Goal, GoalProgress, GoalSummary, GoalStatus } from "../types/goals";

/**
 * Calculate goal progress and statistics
 */
export const calculateGoalProgress = (goal: Goal): GoalProgress => {
  const progressPercentage =
    goal.target_amount > 0
      ? Math.round((goal.current_balance / goal.target_amount) * 100)
      : 0;

  const remainingAmount = Math.max(
    0,
    goal.target_amount - goal.current_balance
  );

  const targetDate = new Date(goal.target_date);
  const today = new Date();
  const daysRemaining = differenceInDays(targetDate, today);
  const monthsRemaining = Math.max(1, differenceInMonths(targetDate, today));

  const isOverdue = daysRemaining < 0;

  const averageMonthlyRequired = remainingAmount / monthsRemaining;

  // Calculate projected completion date based on current progress
  let projectedCompletionDate: Date | null = null;
  if (goal.current_balance > 0 && remainingAmount > 0) {
    const contributions = goal.contributions || [];
    if (contributions.length > 0) {
      const totalDays = differenceInDays(
        today,
        new Date(contributions[0]?.created_at || goal.created_at)
      );
      const avgDailyContribution =
        goal.current_balance / Math.max(1, totalDays);
      const daysToComplete =
        remainingAmount / Math.max(0.01, avgDailyContribution);
      projectedCompletionDate = new Date(
        today.getTime() + daysToComplete * 24 * 60 * 60 * 1000
      );
    }
  }

  return {
    progressPercentage: Math.min(100, progressPercentage),
    remainingAmount,
    daysRemaining,
    isOverdue,
    averageMonthlyRequired,
    projectedCompletionDate,
  };
};

/**
 * Get goal status
 */
export const getGoalStatus = (goal: Goal): GoalStatus => {
  if (goal.is_completed || goal.current_balance >= goal.target_amount) {
    return "completed";
  }

  const progress = calculateGoalProgress(goal);

  if (progress.isOverdue) {
    return "overdue";
  }

  // Check if goal is at risk (needs more than double the historical average)
  const contributions = goal.contributions || [];
  if (contributions.length > 0) {
    const avgContribution = goal.current_balance / contributions.length;
    const monthsRemaining = Math.max(
      1,
      differenceInMonths(new Date(goal.target_date), new Date())
    );
    const requiredMonthlyContribution =
      progress.remainingAmount / monthsRemaining;

    if (requiredMonthlyContribution > avgContribution * 2) {
      return "at_risk";
    }
  }

  return "active";
};

/**
 * Calculate goal summary statistics
 */
export const calculateGoalSummary = (goal: Goal): GoalSummary => {
  const contributions = goal.contributions || [];
  const totalContributions = goal.current_balance;
  const contributionCount = contributions.length;
  const averageContribution =
    contributionCount > 0 ? totalContributions / contributionCount : 0;

  const lastContributionDate =
    contributions.length > 0
      ? new Date(
          contributions.sort(
            (a, b) =>
              new Date(b.contribution_date).getTime() -
              new Date(a.contribution_date).getTime()
          )[0].contribution_date
        )
      : null;

  // Group contributions by month
  const monthlyProgress: Record<string, number> = {};
  contributions.forEach((contribution) => {
    const monthKey = format(
      new Date(contribution.contribution_date),
      "yyyy-MM"
    );
    monthlyProgress[monthKey] =
      (monthlyProgress[monthKey] || 0) + contribution.amount;
  });

  return {
    totalContributions,
    contributionCount,
    averageContribution,
    lastContributionDate,
    monthlyProgress,
  };
};

/**
 * Generate month key for grouping
 */
export const generateMonthKey = (date: Date): string => {
  return format(date, "yyyy-MM");
};

/**
 * Filter goals based on search term
 */
export const filterGoals = (goals: Goal[], searchTerm: string): Goal[] => {
  if (!searchTerm.trim()) return goals;

  const searchLower = searchTerm.toLowerCase();

  return goals.filter(
    (goal) =>
      goal.name.toLowerCase().includes(searchLower) ||
      goal.description?.toLowerCase().includes(searchLower) ||
      goal.target_amount.toString().includes(searchLower) ||
      goal.current_balance.toString().includes(searchLower)
  );
};

/**
 * Calculate recommended monthly contribution
 */
export const calculateRecommendedContribution = (goal: Goal): number => {
  const progress = calculateGoalProgress(goal);
  const monthsRemaining = Math.max(
    1,
    differenceInMonths(new Date(goal.target_date), new Date())
  );

  return Math.ceil(progress.remainingAmount / monthsRemaining);
};

/**
 * Validate contribution against goal
 */
export const validateContribution = (
  goal: Goal,
  contributionAmount: number
): { isValid: boolean; message?: string; warning?: string } => {
  if (contributionAmount <= 0) {
    return {
      isValid: false,
      message: "Contribution amount must be greater than zero.",
    };
  }

  const newBalance = goal.current_balance + contributionAmount;

  if (newBalance > goal.target_amount) {
    return {
      isValid: true,
      warning: `This contribution will exceed your target by ₹${(
        newBalance - goal.target_amount
      ).toLocaleString("en-IN")}. Your goal will be marked as completed.`,
    };
  }

  return { isValid: true };
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString("en-IN")}`;
};

/**
 * Calculate time remaining in human readable format
 */
export const formatTimeRemaining = (targetDate: string): string => {
  const target = new Date(targetDate);
  const today = new Date();
  const daysRemaining = differenceInDays(target, today);

  if (daysRemaining < 0) {
    return `Overdue by ${Math.abs(daysRemaining)} days`;
  }

  if (daysRemaining === 0) {
    return "Due today";
  }

  if (daysRemaining < 30) {
    return `${daysRemaining} days remaining`;
  }

  const monthsRemaining = differenceInMonths(target, today);
  if (monthsRemaining < 12) {
    return `${monthsRemaining} months remaining`;
  }

  const years = Math.floor(monthsRemaining / 12);
  const months = monthsRemaining % 12;

  if (months === 0) {
    return `${years} year${years !== 1 ? "s" : ""} remaining`;
  }

  return `${years} year${years !== 1 ? "s" : ""} and ${months} month${
    months !== 1 ? "s" : ""
  } remaining`;
};

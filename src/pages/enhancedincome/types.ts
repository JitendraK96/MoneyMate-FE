// ===========================
// EXISTING INCOME TYPES (From your current system - NO CHANGES)
// ===========================

export interface Income {
  id: string;
  user_id: string;
  source: string;
  description?: string;
  amount: number;
  frequency: IncomeFrequency;
  needs_percentage: number;
  wants_percentage: number;
  savings_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type IncomeFrequency = "monthly" | "yearly" | "weekly" | "bi-weekly";

export interface FrequencyOption {
  key: IncomeFrequency;
  label: string;
  multiplier: number;
  description?: string;
}

export const INCOME_FREQUENCIES: readonly FrequencyOption[] = [
  {
    key: "monthly",
    label: "Monthly",
    multiplier: 12,
    description: "Received every month",
  },
  {
    key: "yearly",
    label: "Yearly",
    multiplier: 1,
    description: "Received once per year",
  },
  {
    key: "weekly",
    label: "Weekly",
    multiplier: 52,
    description: "Received every week",
  },
  {
    key: "bi-weekly",
    label: "Bi-Weekly",
    multiplier: 26,
    description: "Received every two weeks",
  },
] as const;

export type BucketKey = "needs" | "wants" | "savings";

export interface BucketAllocation {
  needs_amount: number;
  wants_amount: number;
  savings_amount: number;
  total_amount: number;
}

export interface BucketPercentages {
  needs_percentage: number;
  wants_percentage: number;
  savings_percentage: number;
}

export interface BucketConfig {
  key: BucketKey;
  label: string;
  color: string;
  recommendedPercentage: number;
  description: string;
}

export const BUCKETS: readonly BucketConfig[] = [
  {
    key: "needs",
    label: "Needs",
    color: "#ef4444",
    recommendedPercentage: 50,
    description: "Essential expenses like rent, utilities, groceries",
  },
  {
    key: "wants",
    label: "Wants",
    color: "#3b82f6",
    recommendedPercentage: 30,
    description: "Entertainment, dining out, hobbies",
  },
  {
    key: "savings",
    label: "Savings",
    color: "#22c55e",
    recommendedPercentage: 20,
    description: "Emergency fund, investments, debt repayment",
  },
] as const;

export const DEFAULT_SPLIT: BucketPercentages = {
  needs_percentage: 50,
  wants_percentage: 30,
  savings_percentage: 20,
} as const;

export interface IncomeFormData {
  source: string;
  description?: string;
  amount: number;
  frequency: IncomeFrequency;
  needs_percentage: number;
  wants_percentage: number;
  savings_percentage: number;
  is_active: boolean;
}

export interface MonthlyIncomeBreakdown {
  id: string;
  source: string;
  original_amount: number;
  frequency: IncomeFrequency;
  monthly_amount: number;
  needs_amount: number;
  wants_amount: number;
  savings_amount: number;
  needs_percentage: number;
  wants_percentage: number;
  savings_percentage: number;
  is_active: boolean;
}

export interface TotalIncomeAllocation {
  total_monthly_income: number;
  total_needs_amount: number;
  total_wants_amount: number;
  total_savings_amount: number;
  needs_percentage: number;
  wants_percentage: number;
  savings_percentage: number;
  active_income_count: number;
  total_income_count: number;
}

export interface IncomeStatistics {
  highest_income_source: Income | null;
  lowest_income_source: Income | null;
  average_monthly_income: number;
  total_yearly_income: number;
  frequency_distribution: {
    [K in IncomeFrequency]: number;
  };
}

export interface FrequencyConverter {
  toMonthly: (amount: number, frequency: IncomeFrequency) => number;
  toYearly: (amount: number, frequency: IncomeFrequency) => number;
  fromMonthly: (
    monthlyAmount: number,
    targetFrequency: IncomeFrequency
  ) => number;
}

export const FREQUENCY_CONVERTER: FrequencyConverter = {
  toMonthly: (amount: number, frequency: IncomeFrequency): number => {
    const freq = INCOME_FREQUENCIES.find((f) => f.key === frequency);
    return freq ? (amount * freq.multiplier) / 12 : amount;
  },

  toYearly: (amount: number, frequency: IncomeFrequency): number => {
    const freq = INCOME_FREQUENCIES.find((f) => f.key === frequency);
    return freq ? amount * freq.multiplier : amount;
  },

  fromMonthly: (
    monthlyAmount: number,
    targetFrequency: IncomeFrequency
  ): number => {
    const freq = INCOME_FREQUENCIES.find((f) => f.key === targetFrequency);
    return freq ? (monthlyAmount * 12) / freq.multiplier : monthlyAmount;
  },
};

export const INCOME_CONSTRAINTS = {
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 99999999.99,
  MIN_SOURCE_LENGTH: 2,
  MAX_SOURCE_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 1000,
  MIN_PERCENTAGE: 0,
  MAX_PERCENTAGE: 100,
  REQUIRED_PERCENTAGE_SUM: 100,
} as const;

export interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  income?: Income | null;
  mode?: "create" | "edit";
}

// ===========================
// NEW TYPES FOR CATEGORY ALLOCATION ENHANCEMENT
// ===========================

export interface CategoryAllocation {
  category_id: string;
  category_name?: string; // For display purposes
  category_color?: string; // For display purposes
  allocated_percentage: number;
  allocated_amount?: number; // Calculated field
}

export interface EnhancedIncome extends Income {
  // Category-specific allocations within each bucket
  needs_category_allocations?: CategoryAllocation[];
  wants_category_allocations?: CategoryAllocation[];
  savings_category_allocations?: CategoryAllocation[];

  // Calculated unallocated amounts
  unallocated_needs_percentage?: number;
  unallocated_wants_percentage?: number;
  unallocated_savings_percentage?: number;
}

export interface BucketAllocationSummary {
  bucket: BucketKey;
  total_percentage: number;
  total_amount: number;
  category_allocations: CategoryAllocation[];
  unallocated_percentage: number;
  unallocated_amount: number;
  available_categories: Category[]; // Your existing Category interface
}

export interface IncomeAllocationBreakdown {
  income_id: string;
  monthly_amount: number;
  buckets: {
    needs: BucketAllocationSummary;
    wants: BucketAllocationSummary;
    savings: BucketAllocationSummary;
  };
  total_allocated_percentage: number;
  total_unallocated_percentage: number;
}

// Database schema for category allocations
export interface IncomeCategAllocations {
  id: string;
  income_id: string;
  category_id: string;
  allocated_percentage: number;
  created_at: string;
  updated_at: string;
}

// Enhanced form data with category allocations
export interface EnhancedIncomeFormData extends IncomeFormData {
  needs_category_allocations?: CategoryAllocation[];
  wants_category_allocations?: CategoryAllocation[];
  savings_category_allocations?: CategoryAllocation[];
}

// API response types for enhanced income
export interface EnhancedIncomeApiResponse {
  data: EnhancedIncome[];
  count: number;
  error: string | null;
}

export interface SingleEnhancedIncomeApiResponse {
  data: EnhancedIncome | null;
  error: string | null;
}

// Create/Update requests with category allocations
export interface IncomeCreateRequest {
  source: string;
  description?: string;
  amount: number;
  frequency: IncomeFrequency;
  needs_percentage: number;
  wants_percentage: number;
  savings_percentage: number;
  is_active?: boolean;
  category_allocations?: {
    category_id: string;
    allocated_percentage: number;
  }[];
}

export interface IncomeUpdateRequest extends Partial<IncomeCreateRequest> {
  id: string;
}

// Enhanced component props
export interface EnhancedIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  income?: EnhancedIncome | null;
  mode?: "create" | "edit";
  categories?: Category[]; // Your existing categories
}

export interface CategoryAllocationInputProps {
  bucketKey: BucketKey;
  bucketPercentage: number;
  categoryAllocations: CategoryAllocation[];
  availableCategories: Category[];
  onUpdateAllocation: (categoryId: string, percentage: number) => void;
  onAddAllocation: (categoryId: string) => void;
  onRemoveAllocation: (categoryId: string) => void;
  monthlyAmount: number;
  formatCurrency: (amount: number) => string;
}

// ===========================
// VALIDATION CONSTRAINTS FOR CATEGORY ALLOCATIONS
// ===========================

export const CATEGORY_ALLOCATION_CONSTRAINTS = {
  MIN_ALLOCATION_PERCENTAGE: 0.01, // 0.01%
  MAX_ALLOCATION_PERCENTAGE: 100, // 100%
  ALLOCATION_STEP: 0.1, // 0.1% increments
} as const;

// ===========================
// HELPER FUNCTIONS FOR CATEGORY ALLOCATIONS
// ===========================

export const validateCategoryAllocations = (
  bucketPercentage: number,
  categoryAllocations: CategoryAllocation[]
): { isValid: boolean; totalAllocated: number; unallocated: number } => {
  const totalAllocated = categoryAllocations.reduce(
    (sum, alloc) => sum + alloc.allocated_percentage,
    0
  );

  return {
    isValid: totalAllocated <= bucketPercentage,
    totalAllocated,
    unallocated: bucketPercentage - totalAllocated,
  };
};

export const calculateCategoryAmounts = (
  monthlyIncome: number,
  categoryAllocations: CategoryAllocation[]
): CategoryAllocation[] => {
  return categoryAllocations.map((allocation) => ({
    ...allocation,
    allocated_amount: (monthlyIncome * allocation.allocated_percentage) / 100,
  }));
};

export const getBucketUnallocatedPercentage = (
  bucketPercentage: number,
  categoryAllocations: CategoryAllocation[]
): number => {
  const totalAllocated = categoryAllocations.reduce(
    (sum, alloc) => sum + alloc.allocated_percentage,
    0
  );
  return bucketPercentage - totalAllocated;
};

export const getBucketUnallocatedAmount = (
  monthlyIncome: number,
  bucketPercentage: number,
  categoryAllocations: CategoryAllocation[]
): number => {
  const unallocatedPercentage = getBucketUnallocatedPercentage(
    bucketPercentage,
    categoryAllocations
  );
  return (monthlyIncome * unallocatedPercentage) / 100;
};

// Type guards
export const isEnhancedIncome = (
  income: Income | EnhancedIncome
): income is EnhancedIncome => {
  return "needs_category_allocations" in income;
};

export const hasValidCategoryAllocations = (
  income: EnhancedIncome
): boolean => {
  const needsValid = validateCategoryAllocations(
    income.needs_percentage,
    income.needs_category_allocations || []
  ).isValid;

  const wantsValid = validateCategoryAllocations(
    income.wants_percentage,
    income.wants_category_allocations || []
  ).isValid;

  const savingsValid = validateCategoryAllocations(
    income.savings_percentage,
    income.savings_category_allocations || []
  ).isValid;

  return needsValid && wantsValid && savingsValid;
};

// ===========================
// CATEGORY REFERENCE (Your existing types - NO CHANGES)
// ===========================

// These are your existing category types that the income system references
export interface Category {
  id: string;
  name: string;
  description?: string;
  bucket: "needs" | "wants" | "savings";
  color?: string;
  icon?: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

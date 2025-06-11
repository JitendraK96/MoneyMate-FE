// ===========================
// CORE INCOME TYPES
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

// ===========================
// FREQUENCY CONFIGURATION
// ===========================

export interface FrequencyOption {
  key: IncomeFrequency;
  label: string;
  multiplier: number; // How many times per year
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

// ===========================
// BUDGET ALLOCATION TYPES
// ===========================

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

// ===========================
// DEFAULT CONFIGURATION
// ===========================

export const DEFAULT_SPLIT: BucketPercentages = {
  needs_percentage: 50,
  wants_percentage: 30,
  savings_percentage: 20,
} as const;

// ===========================
// FORM & VALIDATION TYPES
// ===========================

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

export interface IncomeFormErrors {
  source?: string;
  description?: string;
  amount?: string;
  frequency?: string;
  needs_percentage?: string;
  wants_percentage?: string;
  savings_percentage?: string;
  percentages_sum?: string;
}

// ===========================
// CALCULATION TYPES
// ===========================

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

// ===========================
// API RESPONSE TYPES
// ===========================

export interface IncomeApiResponse {
  data: Income[];
  count: number;
  error: string | null;
}

export interface SingleIncomeApiResponse {
  data: Income | null;
  error: string | null;
}

export interface IncomeCreateRequest {
  source: string;
  description?: string;
  amount: number;
  frequency: IncomeFrequency;
  needs_percentage: number;
  wants_percentage: number;
  savings_percentage: number;
  is_active?: boolean;
}

export interface IncomeUpdateRequest extends Partial<IncomeCreateRequest> {
  id: string;
}

// ===========================
// UI STATE TYPES
// ===========================

export interface IncomeState {
  incomes: Income[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedIncome: Income | null;
  isModalOpen: boolean;
  editingIncome: Income | null;
}

export interface IncomeFilters {
  isActive?: boolean;
  frequency?: IncomeFrequency;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

export interface IncomeSortOptions {
  field: keyof Income;
  direction: "asc" | "desc";
}

// ===========================
// COMPONENT PROP TYPES
// ===========================

export interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  income?: Income | null;
  mode?: "create" | "edit";
}

export interface IncomeTableProps {
  incomes: Income[];
  onEdit: (income: Income) => void;
  onDelete: (id: string) => void;
  onToggleActive: (income: Income) => void;
  isLoading?: boolean;
  searchQuery?: string;
  onSearch?: (query: string) => void;
}

export interface IncomeOverviewProps {
  allocation: TotalIncomeAllocation;
  statistics: IncomeStatistics;
  isLoading?: boolean;
}

export interface BucketCardProps {
  bucket: BucketConfig;
  amount: number;
  percentage: number;
  totalAmount: number;
  isActive?: boolean;
}

// ===========================
// UTILITY TYPES
// ===========================

export type IncomeKeys = keyof Income;
export type BucketAmountKeys = keyof BucketAllocation;
export type PercentageKeys = keyof BucketPercentages;

// Type guard functions
export const isValidFrequency = (
  frequency: string
): frequency is IncomeFrequency => {
  return ["monthly", "yearly", "weekly", "bi-weekly"].includes(frequency);
};

export const isValidBucketKey = (key: string): key is BucketKey => {
  return ["needs", "wants", "savings"].includes(key);
};

// ===========================
// CALCULATION UTILITIES
// ===========================

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

// ===========================
// CONSTANTS FOR VALIDATION
// ===========================

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

// ===========================
// ERROR TYPES
// ===========================

export interface IncomeError {
  code: string;
  message: string;
  field?: keyof IncomeFormData;
}

export const INCOME_ERROR_CODES = {
  INVALID_AMOUNT: "INVALID_AMOUNT",
  INVALID_PERCENTAGE: "INVALID_PERCENTAGE",
  PERCENTAGE_SUM_ERROR: "PERCENTAGE_SUM_ERROR",
  INVALID_FREQUENCY: "INVALID_FREQUENCY",
  SOURCE_TOO_SHORT: "SOURCE_TOO_SHORT",
  SOURCE_TOO_LONG: "SOURCE_TOO_LONG",
  DESCRIPTION_TOO_LONG: "DESCRIPTION_TOO_LONG",
  NETWORK_ERROR: "NETWORK_ERROR",
  PERMISSION_ERROR: "PERMISSION_ERROR",
  NOT_FOUND: "NOT_FOUND",
} as const;

export type IncomeErrorCode =
  (typeof INCOME_ERROR_CODES)[keyof typeof INCOME_ERROR_CODES];

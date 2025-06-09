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

export interface Payee {
  id: string;
  name: string;
  category_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface BucketInfo {
  key: "needs" | "wants" | "savings";
  label: string;
  description: string;
  color: string;
  recommendedPercentage: number;
}

export const BUCKETS: BucketInfo[] = [
  {
    key: "needs",
    label: "Needs",
    description: "Essential expenses like rent, utilities, groceries",
    color: "#ef4444", // red
    recommendedPercentage: 50,
  },
  {
    key: "wants",
    label: "Wants",
    description: "Non-essential expenses like entertainment, dining out",
    color: "#f59e0b", // yellow
    recommendedPercentage: 30,
  },
  {
    key: "savings",
    label: "Savings",
    description: "Savings, investments, debt payments",
    color: "#22c55e", // green
    recommendedPercentage: 20,
  },
];

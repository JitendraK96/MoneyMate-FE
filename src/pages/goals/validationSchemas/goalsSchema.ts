import { z } from "zod";

export const GoalFormSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Goal name must be at least 2 characters long." })
      .max(100, { message: "Goal name must not exceed 100 characters." })
      .regex(/^[a-zA-Z0-9\s\-_.()]+$/, {
        message:
          "Goal name can only contain letters, numbers, spaces, and basic punctuation.",
      }),

    description: z
      .string()
      .max(500, { message: "Description must not exceed 500 characters." })
      .optional()
      .or(z.literal("")),

    targetAmount: z
      .number({
        required_error: "Target amount is required.",
        invalid_type_error: "Target amount must be a number.",
      })
      .min(100, { message: "Target amount must be at least ₹100." })
      .max(100000000, {
        message: "Target amount cannot exceed ₹10,00,00,000.",
      }),

    currentBalance: z
      .number({
        required_error: "Current balance is required.",
        invalid_type_error: "Current balance must be a number.",
      })
      .min(0, { message: "Current balance cannot be negative." }),

    targetDate: z
      .date({ invalid_type_error: "Target date must be a valid date." })
      .refine((d) => d > new Date(), {
        message: "Target date must be in the future.",
      })
      .nullable(),
  })
  .refine(
    (data) => {
      // Current balance should not exceed target amount
      return data.currentBalance <= data.targetAmount;
    },
    {
      message: "Current balance cannot be greater than target amount.",
      path: ["currentBalance"],
    }
  )
  .refine(
    (data) => {
      // Target date should be reasonable (not more than 50 years in the future)
      if (!data.targetDate) return true;
      const maxFuture = new Date();
      maxFuture.setFullYear(maxFuture.getFullYear() + 50);
      return data.targetDate <= maxFuture;
    },
    {
      message: "Target date cannot be more than 50 years in the future.",
      path: ["targetDate"],
    }
  )
  .refine(
    (data) => {
      // If name is provided, target date must not be null
      return data.name.trim().length >= 2 ? data.targetDate !== null : true;
    },
    {
      message: "Target date is required when goal name is filled.",
      path: ["targetDate"],
    }
  );

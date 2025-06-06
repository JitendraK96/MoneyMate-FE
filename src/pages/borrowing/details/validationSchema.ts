import { z } from "zod";

export const BorrowingFormSchema = z
  .object({
    title: z
      .string()
      .min(2, { message: "Title must be at least 2 characters long." })
      .max(100, { message: "Title must not exceed 100 characters." })
      .regex(/^[a-zA-Z0-9\s\-_.()]+$/, {
        message:
          "Title can only contain letters, numbers, spaces, and basic punctuation.",
      }),

    description: z
      .string()
      .max(500, { message: "Description must not exceed 500 characters." })
      .optional()
      .or(z.literal("")),

    // We keep startDate as nullable here, but will “require” it below if title is provided
    startDate: z
      .date({ invalid_type_error: "Start date must be a valid date." })
      .refine((d) => d <= new Date(), {
        message: "Start date cannot be in the future.",
      })
      .nullable(),

    borrowingAmount: z
      .number({
        required_error: "Borrowing amount is required.",
        invalid_type_error: "Borrowing amount must be a number.",
      })
      .min(1000, { message: "Borrowing amount must be at least ₹1,000." })
      .max(10000000, {
        message: "Borrowing amount cannot exceed ₹1,00,00,000.",
      }),

    tenure: z
      .number({
        required_error: "Tenure is required.",
        invalid_type_error: "Tenure must be a number.",
      })
      .int({ message: "Tenure must be a whole number." })
      .min(1, { message: "Tenure must be at least 1 year." })
      .max(30, { message: "Tenure cannot exceed 30 years." }),

    emiAmount: z
      .number({
        required_error: "EMI amount is required.",
        invalid_type_error: "EMI amount must be a number.",
      })
      .min(100, { message: "EMI amount must be at least ₹100." })
      .max(1000000, { message: "EMI amount cannot exceed ₹10,00,000." }),

    paidMonths: z.record(z.string(), z.boolean()).default({}).optional(),

    paymentDetails: z
      .record(
        z.string(),
        z.string().max(200, {
          message: "Payment details must not exceed 200 characters per month.",
        })
      )
      .default({})
      .optional(),
  })
  //––– existing refinements below –––
  .refine(
    (data) => {
      // EMI amount ≤ borrowingAmount
      return data.emiAmount <= data.borrowingAmount;
    },
    {
      message: "EMI amount cannot be greater than borrowing amount.",
      path: ["emiAmount"],
    }
  )
  .refine(
    (data) => {
      // Total EMI payments ≥ 80% of borrowingAmount
      const totalMonths = data.tenure * 12;
      const totalEmiPayments = data.emiAmount * totalMonths;
      return totalEmiPayments >= data.borrowingAmount * 0.8;
    },
    {
      message:
        "Total EMI payments seem too low compared to borrowing amount. Please verify tenure and EMI amount.",
      path: ["tenure"],
    }
  )
  .refine(
    (data) => {
      // startDate + tenure must not exceed 50 years from now
      if (!data.startDate) return true;
      const start = new Date(data.startDate);
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + data.tenure);
      const maxFuture = new Date();
      maxFuture.setFullYear(maxFuture.getFullYear() + 50);
      return end <= maxFuture;
    },
    {
      message:
        "The combination of start date and tenure extends too far into the future.",
      path: ["tenure"],
    }
  )
  //––– NEW: require `startDate` whenever `title` is non-empty –––
  .refine(
    (data) => {
      // If title is provided (length ≥ 2), startDate must not be null
      return data.title.trim().length >= 2 ? data.startDate !== null : true;
    },
    {
      message: "Start date is required when title is filled.",
      path: ["startDate"],
    }
  );

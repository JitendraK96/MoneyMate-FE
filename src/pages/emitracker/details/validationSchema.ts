import { z } from "zod";

export const FormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." })
    .max(50, { message: "Name must not exceed 50 characters." })
    .regex(/^[a-zA-Z\s]+$/, {
      message: "Name can only contain letters and spaces.",
    }),
  loanAmount: z
    .number({
      required_error: "Loan amount is required.",
      invalid_type_error: "Loan amount must be a number.",
    })
    .min(1000, { message: "Loan amount must be at least ₹1,000." })
    .max(10000000, { message: "Loan amount cannot exceed ₹1,00,00,000." }),
  rateOfInterest: z
    .number({
      required_error: "Rate of interest is required.",
      invalid_type_error: "Rate of interest must be a number.",
    })
    .min(0.1, { message: "Rate of interest must be at least 0.1%." })
    .max(50, { message: "Rate of interest cannot exceed 50%." }),
  tenure: z
    .number({
      required_error: "Tenure is required.",
      invalid_type_error: "Tenure must be a number.",
    })
    .int({ message: "Tenure must be a whole number." })
    .min(1, { message: "Tenure must be at least 1 year." })
    .max(30, { message: "Tenure cannot exceed 30 years." }),
  hikePercentage: z
    .number({
      required_error: "EMI hike percentage is required.",
      invalid_type_error: "EMI hike percentage must be a number.",
    })
    .min(0, { message: "EMI hike percentage cannot be negative." })
    .max(100, { message: "EMI hike percentage cannot exceed 100%." })
    .optional()
    .or(z.literal(0)),
  prepayments: z.any().default({}),
});

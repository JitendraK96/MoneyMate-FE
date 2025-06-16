import { z } from "zod";

export const FormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name must be less than 255 characters"),

  loanAmount: z
    .number({
      required_error: "Loan amount is required",
      invalid_type_error: "Loan amount must be a number",
    })
    .positive("Loan amount must be greater than zero"),

  rateOfInterest: z
    .number({
      required_error: "Rate of interest is required",
      invalid_type_error: "Interest must be a number",
    })
    .positive("Interest rate must be greater than 0"),

  tenure: z
    .number({
      required_error: "Tenure is required",
      invalid_type_error: "Tenure must be a number",
    })
    .int("Tenure must be an integer")
    .positive("Tenure must be greater than 0"),

  hikePercentage: z
    .number({
      invalid_type_error: "Hike percentage must be a number",
    })
    .min(0, "Hike percentage cannot be negative")
    .max(100, "Hike percentage cannot exceed 100%"),

  prepayments: z.any().default({}), // ✅ relaxed validation
  floatingRates: z.any().default({}), // ✅ relaxed validation
});

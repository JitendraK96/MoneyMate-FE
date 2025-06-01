import { z } from "zod";

const FormSchema = z
  .object({
    title: z
      .string()
      .min(2, { message: "Title must be at least 2 characters long." })
      .max(50, { message: "Title must not exceed 50 characters." })
      .regex(/^[a-zA-Z0-9\s\-_.,!?]+$/, {
        message:
          "Title can only contain letters, numbers, spaces, and basic punctuation.",
      }),
    description: z
      .string()
      .max(200, { message: "Description must not exceed 200 characters." })
      .optional()
      .or(z.literal("")), // Allow empty strings
    reminderDate: z.date({
      required_error: "Please select a reminder date.",
    }),
    reminderType: z.enum(["single", "recurring"], {
      required_error: "Please select a reminder type.",
    }),
    recurringType: z
      .enum(["weekly", "monthly"], {
        required_error: "Please select a recurring type.",
      })
      .optional(),
    dayOfWeek: z
      .enum([
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ])
      .optional(),
    weeklyExpirationDate: z.date().optional(),
    monthlyExpirationDate: z.date().optional(),
    dateOfMonth: z
      .number({
        invalid_type_error: "Date of Month must be a number.",
      })
      .int({ message: "Date of Month must be a whole number." })
      .min(1, { message: "Date of Month must be at least 1." })
      .max(31, { message: "Date of Month cannot exceed 31." })
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Conditional validation for recurring reminders
    if (data.reminderType === "recurring") {
      // recurringType is required when reminderType is recurring
      if (!data.recurringType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Recurring type is required for recurring reminders.",
          path: ["recurringType"],
        });
      }

      // Weekly recurring validation
      if (data.recurringType === "weekly") {
        if (!data.dayOfWeek) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Day of week is required for weekly recurring reminders.",
            path: ["dayOfWeek"],
          });
        }

        if (!data.weeklyExpirationDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Expiration date is required for weekly recurring reminders.",
            path: ["weeklyExpirationDate"],
          });
        }
      }

      // Monthly recurring validation
      if (data.recurringType === "monthly") {
        if (!data.dateOfMonth) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Date of month is required for monthly recurring reminders.",
            path: ["dateOfMonth"],
          });
        }

        if (!data.monthlyExpirationDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Expiration date is required for monthly recurring reminders.",
            path: ["monthlyExpirationDate"],
          });
        }
      }
    }
  });

// Type inference for TypeScript
type FormData = z.infer<typeof FormSchema>;

export { FormSchema, type FormData };

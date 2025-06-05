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

    reminderDate: z.date().optional(), // Only required when reminderType === "single"
    reminderType: z.enum(["single", "recurring"], {
      required_error: "Please select a reminder type.",
    }),

    recurringType: z
      .enum(["weekly", "monthly"], {
        required_error: "Please select a recurring type.",
      })
      .optional()
      .or(z.literal("")),

    dayOfWeek: z
      .enum(
        [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ],
        { required_error: "Please select a day of week." }
      )
      .optional()
      .or(z.literal("")),
    weeklyExpirationDate: z.date().optional(),

    dateOfMonth: z
      .number({
        invalid_type_error: "Date of Month must be a number.",
      })
      .int({ message: "Date of Month must be a whole number." })
      .min(1, { message: "Date of Month must be at least 1." })
      .max(31, { message: "Date of Month cannot exceed 31." })
      .optional()
      .nullable(), // Allow null when isLastDayOfMonth is true

    // NEW: boolean flag for "Last Day of Month" option
    isLastDayOfMonth: z.boolean().optional(),

    monthlyExpirationDate: z.date().optional(),
  })
  .superRefine((data, ctx) => {
    //
    // 1) Single-reminder validation
    //
    if (data.reminderType === "single") {
      if (!data.reminderDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a reminder date.",
          path: ["reminderDate"],
        });
      }
    }

    //
    // 2) Recurring-reminder validation
    //
    if (data.reminderType === "recurring") {
      // 2a) recurringType is required
      if (!data.recurringType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Recurring type is required for recurring reminders.",
          path: ["recurringType"],
        });
      }

      //
      // 2b) Weekly recurring fields
      //
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

      //
      // 2c) Monthly recurring fields
      //
      if (data.recurringType === "monthly") {
        // Must supply either dateOfMonth OR isLastDayOfMonth
        const hasDateOfMonth = typeof data.dateOfMonth === "number";
        const hasLastDayFlag = data.isLastDayOfMonth === true;

        if (!hasDateOfMonth && !hasLastDayFlag) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Either 'Date of Month' or 'Last Day of Month' must be selected for monthly reminders.",
            path: ["dateOfMonth"], // can attach to either field; here it's on dateOfMonth
          });
        }

        // If dateOfMonth is provided AND isLastDayOfMonth is also true → ambiguous
        if (hasDateOfMonth && hasLastDayFlag) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Cannot specify both a day-of-month and 'Last Day of Month'. Choose one.",
            path: ["dateOfMonth"], // attach warning to dateOfMonth; optionally could also reference isLastDayOfMonth
          });
        }

        // monthlyExpirationDate is required always for monthly recurring
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

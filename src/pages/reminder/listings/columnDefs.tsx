import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Sort from "@/components/sort";

interface EmiRow {
  title: string;
  id: number;
  reminder_type: string;
  description: string;
  reminder_date: string | null;
  recurring_type: "weekly" | "monthly" | null;
  day_of_week: string | null; // e.g. "monday"
  date_of_month: number | null; // 1–31
  is_last_day_of_month: boolean;
  weekly_expiration_date: string | null;
  monthly_expiration_date: string | null;
}

export const getColumns = (
  onDelete: (id: number) => void,
  onView: (id: number) => void
): ColumnDef<EmiRow>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Title
        <Sort />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("title")}</div>
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Description
        <Sort />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("description")}</div>
    ),
  },
  {
    accessorKey: "reminder_type",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Type
        <Sort />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("reminder_type")}</div>,
  },
  {
    id: "schedule", // no accessorKey; compute in cell
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Schedule
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const {
        reminder_type,
        reminder_date,
        recurring_type,
        day_of_week,
        date_of_month,
        is_last_day_of_month,
      } = row.original;

      // 1) Single-occurrence: format `reminder_date`
      if (reminder_type === "single" && reminder_date) {
        // Format: "Jun 11, 2025 10:00 AM"
        try {
          const dt = new Date(reminder_date);
          return <div>{format(dt, "MMM d, yyyy h:mm a")}</div>;
        } catch {
          return <div>Invalid date</div>;
        }
      }

      // 2) Recurring:
      if (reminder_type === "recurring" && recurring_type) {
        // WEEKLY
        if (recurring_type === "weekly" && day_of_week) {
          // Capitalize day_of_week (e.g. "friday" → "Friday")
          const capitalizedDay =
            day_of_week.charAt(0).toUpperCase() + day_of_week.slice(1);
          return <div>Every {capitalizedDay}</div>;
        }

        // MONTHLY
        if (recurring_type === "monthly") {
          if (is_last_day_of_month) {
            return <div>Last day of month</div>;
          }
          if (date_of_month) {
            // Convert "3" → "3rd", "1" → "1st", etc. (simple ordinal)
            const nth = (() => {
              const d = date_of_month;
              if (d % 10 === 1 && d !== 11) return d + "st";
              if (d % 10 === 2 && d !== 12) return d + "nd";
              if (d % 10 === 3 && d !== 13) return d + "rd";
              return d + "th";
            })();
            return <div>Every {nth} of month</div>;
          }
        }
      }

      return <div>—</div>;
    },
  },
  {
    id: "next_occurrence",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Next Occurrence
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const {
        reminder_type,
        reminder_date,
        recurring_type,
        day_of_week,
        date_of_month,
        is_last_day_of_month,
      } = row.original;

      const today = new Date();
      today.setHours(0, 0, 0, 0); // normalize to midnight

      // HELPER: Format a JS Date or return "Invalid date"
      const formatOrInvalid = (d: Date | null) => {
        if (!d || isNaN(d.getTime())) return "Invalid date";
        return format(d, "MMM d, yyyy");
      };

      // 1) Single-occurrence: if reminder_date is in the future, show it; else "Expired"
      if (reminder_type === "single" && reminder_date) {
        const dt = new Date(reminder_date);
        if (dt.getTime() >= Date.now()) {
          return <div>{formatOrInvalid(dt)}</div>;
        } else {
          return <div>Expired</div>;
        }
      }

      // 2) Recurring:
      if (reminder_type === "recurring" && recurring_type) {
        // a) WEEKLY: find the next weekday after today
        if (recurring_type === "weekly" && day_of_week) {
          // Build array to map string → 0–6 (Sun=0 … Sat=6)
          const daysMap = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ];
          const targetIndex = daysMap.indexOf(day_of_week.toLowerCase());
          if (targetIndex < 0) return <div>Invalid day</div>;

          const todayIndex = today.getDay();
          let diff = (targetIndex - todayIndex + 7) % 7;
          if (diff === 0) diff = 7; // if today is the same day, schedule for next week

          const nextDate = new Date(today);
          nextDate.setDate(today.getDate() + diff);
          return <div>{formatOrInvalid(nextDate)}</div>;
        }

        // b) MONTHLY:
        if (recurring_type === "monthly") {
          const year = today.getFullYear();
          const month = today.getMonth(); // 0-based

          // i) LAST DAY OF MONTH
          if (is_last_day_of_month) {
            // Calculate last day of current month:
            const lastDayCurrentMonth = new Date(year, month + 1, 0);
            if (today.getDate() < lastDayCurrentMonth.getDate()) {
              // still this month’s last day
              return <div>{formatOrInvalid(lastDayCurrentMonth)}</div>;
            } else {
              // go to next month’s last day
              const lastDayNextMonth = new Date(year, month + 2, 0);
              return <div>{formatOrInvalid(lastDayNextMonth)}</div>;
            }
          }

          // ii) SPECIFIC DATE OF MONTH
          if (date_of_month != null) {
            // If today is before date_of_month this month:
            if (today.getDate() < date_of_month) {
              const candidate = new Date(year, month, date_of_month);
              return <div>{formatOrInvalid(candidate)}</div>;
            } else {
              // go to next month’s nth day
              // watch out for months with fewer days (e.g. Feb 30 → Mar 2?).
              // A simple approach is to clamp to the last day if that month doesn't have "date_of_month".
              const nextMonth = month + 1;
              const candidateNext = new Date(year, nextMonth, date_of_month);
              // If creating a date like "2025-02-30" auto-rolls into "Mar 2", we can check:
              if (candidateNext.getDate() !== date_of_month) {
                // that means next month is too short; pick its last day:
                const lastDayNextMonth = new Date(year, nextMonth + 1, 0);
                return <div>{formatOrInvalid(lastDayNextMonth)}</div>;
              }
              return <div>{formatOrInvalid(candidateNext)}</div>;
            }
          }
        }
      }

      return <div>—</div>;
    },
  },
  {
    id: "expiry_date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Expiry Date
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const {
        reminder_type,
        recurring_type,
        weekly_expiration_date,
        monthly_expiration_date,
      } = row.original;

      // Only recurring reminders may have an expiry date
      if (reminder_type === "recurring" && recurring_type) {
        // Weekly expiry
        if (recurring_type === "weekly" && weekly_expiration_date) {
          try {
            const dt = new Date(weekly_expiration_date);
            return <div>{format(dt, "MMM d, yyyy")}</div>;
          } catch {
            return <div>Invalid date</div>;
          }
        }
        // Monthly expiry
        if (recurring_type === "monthly" && monthly_expiration_date) {
          try {
            const dt = new Date(monthly_expiration_date);
            return <div>{format(dt, "MMM d, yyyy")}</div>;
          } catch {
            return <div>Invalid date</div>;
          }
        }
        // If it's recurring but no expiration is set
        return <div>—</div>;
      }

      // Single reminders have no “expiry date”
      return <div>—</div>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const rowData = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            asChild
            className="!bg-[var(--content)] !border-[var(--common-inputborder)]"
          >
            <Button
              variant="ghost"
              className="ml-auto text-[var(--content-textprimary)] font-size-extra-small !border-[var(--common-inputborder)] focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="!bg-[var(--content)] !border-[var(--common-inputborder)]"
          >
            <DropdownMenuItem
              onClick={() => onView?.(rowData.id)}
              className="text-[var(--content-textprimary)] font-size-extra-small "
            >
              View
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(rowData.id)}
              className="text-[var(--content-textprimary)] font-size-extra-small "
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

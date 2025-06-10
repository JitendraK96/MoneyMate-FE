import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  DollarSign,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Sort from "@/components/sort";
import { Badge } from "@/components/ui/badge";
import {
  Income,
  BUCKETS,
  INCOME_FREQUENCIES,
  FREQUENCY_CONVERTER,
} from "../types";

export const getIncomeColumns = (
  onEdit: (income: Income) => void,
  onDelete: (id: string) => void,
  onToggleActive: (income: Income) => void,
  formatCurrency: (amount: number) => string
): ColumnDef<Income>[] => [
  {
    accessorKey: "source",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Income Source
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const { source, description } = row.original;
      return (
        <div>
          <div className="font-medium text-[var(--content-textprimary)] flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[var(--common-brand)]" />
            {source}
          </div>
          {description && (
            <div className="text-sm text-[var(--content-textsecondary)] truncate max-w-[200px] mt-1">
              {description}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Amount & Frequency
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const { amount, frequency } = row.original;
      const frequencyInfo = INCOME_FREQUENCIES.find((f) => f.key === frequency);
      const monthlyAmount = FREQUENCY_CONVERTER.toMonthly(amount, frequency);

      return (
        <div>
          <div className="font-medium text-[var(--content-textprimary)]">
            {formatCurrency(amount)}
          </div>
          <div className="flex items-center gap-1 text-sm text-[var(--content-textsecondary)]">
            <Calendar className="w-3 h-3" />
            <span>{frequencyInfo?.label}</span>
          </div>
          {frequency !== "monthly" && (
            <div className="text-xs text-[var(--content-textsecondary)] mt-1">
              ≈ {formatCurrency(monthlyAmount)}/month
            </div>
          )}
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      // Sort by monthly equivalent for fair comparison
      const monthlyA = FREQUENCY_CONVERTER.toMonthly(
        rowA.original.amount,
        rowA.original.frequency
      );
      const monthlyB = FREQUENCY_CONVERTER.toMonthly(
        rowB.original.amount,
        rowB.original.frequency
      );
      return monthlyA - monthlyB;
    },
  },
  {
    id: "allocation",
    header: () => <div>Budget Allocation</div>,
    cell: ({ row }) => {
      const {
        needs_percentage,
        wants_percentage,
        savings_percentage,
        amount,
        frequency,
      } = row.original;

      // Calculate monthly amount for display
      const monthlyAmount = FREQUENCY_CONVERTER.toMonthly(amount, frequency);

      return (
        <div className="space-y-1.5">
          {BUCKETS.map((bucket) => {
            const percentage = row.original[
              `${bucket.key}_percentage` as keyof Income
            ] as number;
            const bucketAmount = (monthlyAmount * percentage) / 100;

            return (
              <div key={bucket.key} className="flex items-center gap-2 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: bucket.color }}
                />
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <span className="font-medium w-8 text-right">
                    {percentage}%
                  </span>
                  <span className="text-[var(--content-textsecondary)] truncate">
                    {formatCurrency(bucketAmount)}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Validation indicator */}
          {needs_percentage + wants_percentage + savings_percentage !== 100 && (
            <div className="text-xs text-red-500 mt-1">
              ⚠ Total:{" "}
              {needs_percentage + wants_percentage + savings_percentage}%
            </div>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    id: "monthly_breakdown",
    header: () => <div className="text-center">Monthly Breakdown</div>,
    cell: ({ row }) => {
      const {
        amount,
        frequency,
        needs_percentage,
        wants_percentage,
        savings_percentage,
      } = row.original;
      const monthlyAmount = FREQUENCY_CONVERTER.toMonthly(amount, frequency);

      const needsAmount = (monthlyAmount * needs_percentage) / 100;
      const wantsAmount = (monthlyAmount * wants_percentage) / 100;
      const savingsAmount = (monthlyAmount * savings_percentage) / 100;

      return (
        <div className="text-center space-y-1">
          <div className="font-medium text-[var(--content-textprimary)] text-sm">
            {formatCurrency(monthlyAmount)}
          </div>
          <div className="space-y-0.5">
            <div className="text-xs text-[var(--content-textsecondary)]">
              <span style={{ color: BUCKETS[0].color }}>
                ₹{needsAmount.toFixed(0)}
              </span>{" "}
              •
              <span style={{ color: BUCKETS[1].color }}>
                {" "}
                ₹{wantsAmount.toFixed(0)}
              </span>{" "}
              •
              <span style={{ color: BUCKETS[2].color }}>
                {" "}
                ₹{savingsAmount.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    id: "status",
    header: () => <div>Status</div>,
    cell: ({ row }) => {
      const isActive = row.original.is_active;
      return (
        <div className="flex flex-col gap-1">
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
          {!isActive && (
            <div className="text-xs text-[var(--content-textsecondary)]">
              Not included in totals
            </div>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Created
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const createdAt = new Date(row.getValue("created_at"));
      return (
        <div className="text-sm text-[var(--content-textsecondary)]">
          {createdAt.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const income = row.original;

      const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onEdit(income);
      };

      const handleToggleActive = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleActive(income);
      };

      const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete(income.id);
      };

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-white border border-gray-200 shadow-lg z-50"
              side="bottom"
              sideOffset={5}
            >
              <DropdownMenuItem
                onClick={handleEdit}
                className="cursor-pointer hover:bg-gray-50 text-sm px-3 py-2"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Income
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleToggleActive}
                className="cursor-pointer hover:bg-gray-50 text-sm px-3 py-2"
              >
                {income.is_active ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-gray-200" />

              <DropdownMenuItem
                onClick={handleDelete}
                className="cursor-pointer hover:bg-red-50 text-red-600 text-sm px-3 py-2"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

// Alternative simplified columns for mobile or compact view
export const getIncomeColumnsCompact = (
  onEdit: (income: Income) => void,
  onDelete: (id: string) => void,
  onToggleActive: (income: Income) => void,
  formatCurrency: (amount: number) => string
): ColumnDef<Income>[] => [
  {
    accessorKey: "source",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Source
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const { source, amount, frequency, is_active } = row.original;
      const monthlyAmount = FREQUENCY_CONVERTER.toMonthly(amount, frequency);
      const frequencyInfo = INCOME_FREQUENCIES.find((f) => f.key === frequency);

      return (
        <div>
          <div className="flex items-center gap-2">
            <div className="font-medium text-[var(--content-textprimary)]">
              {source}
            </div>
            <Badge
              variant={is_active ? "default" : "secondary"}
              className="text-xs"
            >
              {is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="text-sm text-[var(--content-textsecondary)]">
            {formatCurrency(amount)} • {frequencyInfo?.label}
          </div>
          <div className="text-xs text-[var(--content-textsecondary)]">
            {formatCurrency(monthlyAmount)}/month
          </div>
        </div>
      );
    },
  },
  {
    id: "allocation_compact",
    header: () => <div>Allocation</div>,
    cell: ({ row }) => {
      const { needs_percentage, wants_percentage, savings_percentage } =
        row.original;

      return (
        <div className="text-center">
          <div className="text-sm font-medium text-[var(--content-textprimary)]">
            {needs_percentage}% • {wants_percentage}% • {savings_percentage}%
          </div>
          <div className="flex justify-center gap-1 mt-1">
            {BUCKETS.map((bucket) => (
              <div
                key={bucket.key}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: bucket.color }}
              />
            ))}
          </div>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const income = row.original;

      const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onEdit(income);
      };

      const handleToggleActive = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleActive(income);
      };

      const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete(income.id);
      };

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 bg-white border border-gray-200 shadow-lg z-50"
              side="bottom"
              sideOffset={5}
            >
              <DropdownMenuItem
                onClick={handleEdit}
                className="cursor-pointer hover:bg-gray-50 text-xs px-2 py-1.5"
              >
                <Edit className="mr-2 h-3 w-3" />
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleToggleActive}
                className="cursor-pointer hover:bg-gray-50 text-xs px-2 py-1.5"
              >
                {income.is_active ? (
                  <>
                    <EyeOff className="mr-2 h-3 w-3" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-3 w-3" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-gray-200" />

              <DropdownMenuItem
                onClick={handleDelete}
                className="cursor-pointer hover:bg-red-50 text-red-600 text-xs px-2 py-1.5"
              >
                <Trash2 className="mr-2 h-3 w-3" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

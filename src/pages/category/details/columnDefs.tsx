import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Sort from "@/components/sort";
import { Badge } from "@/components/ui/badge";
import { Category, BUCKETS } from "../types";

export const getCategoryColumns = (
  onEdit: (category: Category) => void,
  onDelete: (id: string) => void
): ColumnDef<Category>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Category Name
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const { name, description, color } = row.original;
      return (
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: color || "#6b7280" }}
          />
          <div>
            <div className="font-medium text-[var(--content-textprimary)]">
              {name}
            </div>
            {description && (
              <div className="text-sm text-[var(--content-textsecondary)] truncate max-w-[200px]">
                {description}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "bucket",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Bucket
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const bucket = row.getValue("bucket") as string;
      const bucketInfo = BUCKETS.find((b) => b.key === bucket);

      return (
        <Badge
          variant="secondary"
          style={{ backgroundColor: bucketInfo?.color, color: "white" }}
        >
          {bucketInfo?.label || bucket}
        </Badge>
      );
    },
  },
  {
    id: "status",
    header: () => <div>Status</div>,
    cell: ({ row }) => {
      const isActive = row.original.is_active;
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
    enableSorting: false,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const category = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            asChild
            className="!bg-[var(--content)] !border-[var(--common-inputborder)]"
          >
            <Button
              variant="ghost"
              className="ml-auto text-[var(--content-textprimary)] font-size-extra-small !border-[var(--common-inputborder)]"
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
              onClick={() => onEdit(category)}
              className="text-[var(--content-textprimary)] font-size-extra-small"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(category.id)}
              className="text-[var(--common-error)] font-size-extra-small"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

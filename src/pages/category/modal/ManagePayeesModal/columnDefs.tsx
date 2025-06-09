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
import { Payee, Category } from "../../types";

export const getPayeeColumns = (
  onEdit: (payee: Payee) => void,
  onDelete: (id: string) => void,
  categories: Category[]
): ColumnDef<Payee>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading text-xs"
      >
        Payee Name
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      return (
        <div className="font-medium text-[var(--content-textprimary)] text-sm">
          {row.getValue("name")}
        </div>
      );
    },
  },
  {
    accessorKey: "category_id",
    header: () => <div className="text-xs">Default Category</div>,
    cell: ({ row }) => {
      const categoryId = row.getValue("category_id") as string;
      const category = categories.find((cat) => cat.id === categoryId);

      if (!category) {
        return (
          <Badge variant="secondary" className="text-xs">
            No default
          </Badge>
        );
      }

      return (
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          <span className="text-xs">{category.name}</span>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const payee = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            asChild
            className="!bg-[var(--content)] !border-[var(--common-inputborder)]"
          >
            <Button
              variant="ghost"
              className="h-6 w-6 p-0 text-[var(--content-textprimary)]"
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="!bg-[var(--content)] !border-[var(--common-inputborder)]"
          >
            <DropdownMenuItem
              onClick={() => onEdit(payee)}
              className="text-[var(--content-textprimary)] text-xs"
            >
              <Edit className="mr-2 h-3 w-3" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(payee.id)}
              className="text-[var(--common-error)] text-xs"
            >
              <Trash2 className="mr-2 h-3 w-3" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

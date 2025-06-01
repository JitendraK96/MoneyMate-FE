import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
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
      >
        Reminder Type
        <Sort />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("reminder_type")}</div>,
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

import React, { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "@/components/ui/separator";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormField } from "@/components/ui/form";
import { Input, Button } from "@/components/inputs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataTable from "@/components/table";
import { getPayeeColumns } from "./columnDefs";
import { Plus } from "lucide-react";
import { Category, Payee } from "../../types";

const PayeeFormSchema = z.object({
  name: z.string().min(1, "Payee name is required"),
  category_id: z.string(),
});

interface ManagePayeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  payees: Payee[];
}

const ManagePayeesModal: React.FC<ManagePayeesModalProps> = ({
  isOpen,
  onClose,
  categories,
  payees,
}) => {
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [editingPayee, setEditingPayee] = useState<Payee | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<z.infer<typeof PayeeFormSchema>>({
    resolver: zodResolver(PayeeFormSchema),
    defaultValues: {
      name: "",
      category_id: "none",
    },
  });

  useEffect(() => {
    if (editingPayee) {
      form.reset({
        name: editingPayee.name,
        category_id: editingPayee.category_id || "none",
      });
    } else {
      form.reset({
        name: "",
        category_id: "none",
      });
    }
  }, [editingPayee, form]);

  const onSubmit = async (values: z.infer<typeof PayeeFormSchema>) => {
    setIsSaving(true);
    try {
      const categoryId =
        values.category_id === "none" ? null : values.category_id;

      if (editingPayee) {
        const { error } = await supabase
          .from("payees")
          .update({
            name: values.name,
            category_id: categoryId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingPayee.id)
          .eq("user_id", user.id);

        if (error) throw error;
        toast.success("Payee updated successfully!");
      } else {
        const { error } = await supabase.from("payees").insert([
          {
            user_id: user.id,
            name: values.name,
            category_id: categoryId,
          },
        ]);

        if (error) throw error;
        toast.success("Payee created successfully!");
      }

      setEditingPayee(null);
      form.reset();
      onClose();
    } catch (error) {
      console.error("Error saving payee:", error);
      toast.error("Failed to save payee. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditPayee = (payee: Payee) => {
    setEditingPayee(payee);
  };

  const handleDeletePayee = async (id: string) => {
    try {
      const { error } = await supabase
        .from("payees")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Payee deleted successfully!");
      onClose();
    } catch (error) {
      console.error("Error deleting payee:", error);
      toast.error("Failed to delete payee. Please try again.");
    }
  };

  const handleSearch = (search: string) => {
    setSearchQuery(search.trim());
  };

  const filteredPayees = payees.filter((payee) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return payee.name.toLowerCase().includes(searchLower);
  });

  const handleClose = () => {
    form.reset({
      name: "",
      category_id: "none",
    });
    setEditingPayee(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!bg-[var(--content)] !border-[var(--common-inputborder)] min-w-6xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-[var(--content-textprimary)]">
            Manage Payees
          </DialogTitle>
          <DialogDescription className="text-[var(--content-textsecondary)]">
            Link payees to categories for automatic expense categorization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 overflow-y-auto">
          {/* Add/Edit Payee Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[var(--content-textprimary)]">
              {editingPayee ? "Edit Payee" : "Add New Payee"}
            </h3>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <Input
                      field={field}
                      type="text"
                      placeholder="e.g., MSEB, Swiggy, Amazon"
                      label="Payee Name"
                      required
                    />
                  )}
                />

                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--content-textprimary)]">
                        Default Category (Optional)
                      </label>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="!bg-[var(--content)] !border-[var(--common-inputborder)]">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent className="!bg-[var(--content)] !border-[var(--common-inputborder)]">
                          <SelectItem value="none">
                            No default category
                          </SelectItem>
                          {categories
                            .filter((cat) => cat.is_active)
                            .map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: category.color }}
                                  />
                                  <span>{category.name}</span>
                                  <span className="text-xs text-[var(--content-textsecondary)]">
                                    ({category.bucket})
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-[var(--content-textsecondary)]">
                        When this payee is selected, the category will be
                        auto-selected
                      </p>
                    </div>
                  )}
                />

                <div className="flex gap-2">
                  {editingPayee && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setEditingPayee(null);
                        form.reset({
                          name: "",
                          category_id: "none",
                        });
                      }}
                      title="Cancel"
                    />
                  )}
                  <Button
                    type="submit"
                    title={editingPayee ? "Update Payee" : "Add Payee"}
                    isLoading={isSaving}
                    disabled={!form.formState.isValid}
                    icon={!editingPayee ? <Plus /> : undefined}
                    className="w-fit"
                  />
                </div>
              </form>
            </Form>
          </div>

          <Separator className="bg-[var(--content-textplaceholder)]" />

          {/* Payees List */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[var(--content-textprimary)]">
              Your Payees ({payees.length})
            </h3>

            {payees.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-[var(--content-textsecondary)]">
                  <Plus size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    No payees yet. Add your first payee to get started.
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <DataTable
                  data={filteredPayees}
                  columns={getPayeeColumns(
                    handleEditPayee,
                    handleDeletePayee,
                    categories
                  )}
                  onSearch={handleSearch}
                  loading={false}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            title="Close"
            className="w-fit"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManagePayeesModal;

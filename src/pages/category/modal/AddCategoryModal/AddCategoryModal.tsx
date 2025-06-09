import React, { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Category, BUCKETS } from "../../types";

const CategoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  bucket: z.enum(["needs", "wants", "savings"]),
  color: z.string().optional(),
  is_active: z.boolean(),
});

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
}

const COLOR_OPTIONS = [
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  category,
}) => {
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = !!category;

  const form = useForm<z.infer<typeof CategoryFormSchema>>({
    resolver: zodResolver(CategoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      bucket: "needs",
      color: COLOR_OPTIONS[0],
      is_active: true,
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        description: category.description || "",
        bucket: category.bucket,
        color: category.color || COLOR_OPTIONS[0],
        is_active: category.is_active,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        bucket: "needs",
        color: COLOR_OPTIONS[0],
        is_active: true,
      });
    }
  }, [category, form]);

  const onSubmit = async (values: z.infer<typeof CategoryFormSchema>) => {
    setIsSaving(true);
    try {
      if (isEditMode) {
        const { error } = await supabase
          .from("categories")
          .update({
            name: values.name,
            description: values.description,
            bucket: values.bucket,
            color: values.color,
            is_active: values.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", category.id)
          .eq("user_id", user.id);

        if (error) throw error;
        toast.success("Category updated successfully!");
      } else {
        const { error } = await supabase.from("categories").insert([
          {
            user_id: user.id,
            name: values.name,
            description: values.description,
            bucket: values.bucket,
            color: values.color,
            is_active: values.is_active,
          },
        ]);

        if (error) throw error;
        toast.success("Category created successfully!");
      }

      onClose();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Failed to save category. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!bg-[var(--content)] !border-[var(--common-inputborder)]">
        <DialogHeader>
          <DialogTitle className="text-[var(--content-textprimary)]">
            {isEditMode ? "Edit Category" : "Add New Category"}
          </DialogTitle>
          <DialogDescription className="text-[var(--content-textsecondary)]">
            {isEditMode
              ? "Update your expense category details."
              : "Create a new category to organize your expenses."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <Input
                  field={field}
                  type="text"
                  placeholder="e.g., Electricity, Groceries"
                  label="Category Name"
                  required
                />
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <Input
                  field={field}
                  type="textarea"
                  placeholder="Optional description for this category"
                  label="Description"
                />
              )}
            />

            <FormField
              control={form.control}
              name="bucket"
              render={({ field }) => (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--content-textprimary)]">
                    Budget Bucket *
                  </label>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="!bg-[var(--content)] !border-[var(--common-inputborder)]">
                      <SelectValue placeholder="Select a bucket" />
                    </SelectTrigger>
                    <SelectContent className="!bg-[var(--content)] !border-[var(--common-inputborder)]">
                      {BUCKETS.map((bucket) => (
                        <SelectItem key={bucket.key} value={bucket.key}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: bucket.color }}
                            />
                            <span>{bucket.label}</span>
                            <span className="text-xs text-[var(--content-textsecondary)]">
                              ({bucket.recommendedPercentage}%)
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-[var(--content-textsecondary)]">
                    {
                      BUCKETS.find((b) => b.key === form.watch("bucket"))
                        ?.description
                    }
                  </p>
                </div>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--content-textprimary)]">
                    Color
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${
                          field.value === color
                            ? "border-[var(--common-brand)]"
                            : "border-[var(--common-inputborder)]"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => field.onChange(color)}
                      />
                    ))}
                  </div>
                </div>
              )}
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                title="Cancel"
                className="w-fit"
              />
              <Button
                type="submit"
                title={isEditMode ? "Update Category" : "Create Category"}
                isLoading={isSaving}
                disabled={!form.formState.isValid}
                className="w-fit"
              />
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCategoryModal;

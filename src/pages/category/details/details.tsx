import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import Page from "@/components/page";
import Card from "@/components/card";
import { Button } from "@/components/inputs";
import DataTable from "@/components/table";
import { Plus, Settings } from "lucide-react";
import { getCategoryColumns } from "./columnDefs";
import AddCategoryModal from "../modal/AddCategoryModal/AddCategoryModal";
import ManagePayeesModal from "../modal/ManagePayeesModal/ManagePayeesModal";
import { Category, Payee, BUCKETS } from "../types";

const Details = () => {
  const { user } = useUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isPayeeModalOpen, setIsPayeeModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (categoriesError) throw categoriesError;

      // Fetch payees
      const { data: payeesData, error: payeesError } = await supabase
        .from("payees")
        .select(
          `
          *,
          category:categories(name, bucket)
        `
        )
        .eq("user_id", user.id)
        .order("name");

      if (payeesError) throw payeesError;

      setCategories(categoriesData || []);
      setPayees(payeesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Category deleted successfully!");
      fetchData();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category. Please try again.");
    }
  };

  const handleCategoryModalClose = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    fetchData();
  };

  const handlePayeeModalClose = () => {
    setIsPayeeModalOpen(false);
    fetchData();
  };

  const handleSearch = (search: string) => {
    setSearchQuery(search.trim());
  };

  const filteredCategories = categories.filter((category) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      category.name.toLowerCase().includes(searchLower) ||
      category.bucket.toLowerCase().includes(searchLower) ||
      (category.description &&
        category.description.toLowerCase().includes(searchLower))
    );
  });

  // Calculate bucket distribution
  const bucketStats = BUCKETS.map((bucket) => {
    const bucketCategories = categories.filter(
      (cat) => cat.bucket === bucket.key && cat.is_active
    );
    return {
      ...bucket,
      categoryCount: bucketCategories.length,
    };
  });

  return (
    <Page
      title="Category Management"
      subTitle="Organize your expenses with custom categories linked to your budget buckets"
    >
      {/* Bucket Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {bucketStats.map((bucket) => (
          <Card
            key={bucket.key}
            cardContent={
              <div className="text-center">
                <div
                  className="w-4 h-4 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: bucket.color }}
                />
                <div className="text-lg font-bold text-[var(--content-textprimary)]">
                  {bucket.label}
                </div>
                <div className="text-sm text-[var(--content-textsecondary)] mb-2">
                  {bucket.description}
                </div>
                <div className="text-xs text-[var(--content-textsecondary)]">
                  {bucket.categoryCount} categories •{" "}
                  {bucket.recommendedPercentage}% recommended
                </div>
              </div>
            }
          />
        ))}
      </div>

      {/* Categories Table */}
      <Card
        title="Categories"
        headerContent={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              title="Manage Payees"
              variant="secondary"
              className="w-fit"
              onClick={() => setIsPayeeModalOpen(true)}
              icon={<Settings />}
            />
            <Button
              type="button"
              title="Add Category"
              className="w-fit"
              onClick={handleAddCategory}
              icon={<Plus />}
            />
          </div>
        }
        cardContent={
          <>
            {categories.length === 0 && !isLoading ? (
              <div className="text-center py-12">
                <div className="text-[var(--content-textsecondary)] mb-4">
                  <Plus size={48} className="mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">
                    No categories yet
                  </h3>
                  <p className="text-sm">
                    Create categories to organize your expenses into needs,
                    wants, and savings.
                  </p>
                </div>
                <Button
                  type="button"
                  title="Create Your First Category"
                  className="w-fit"
                  onClick={handleAddCategory}
                  icon={<Plus />}
                />
              </div>
            ) : (
              <DataTable
                data={filteredCategories}
                columns={getCategoryColumns(
                  handleEditCategory,
                  handleDeleteCategory
                )}
                onSearch={handleSearch}
                loading={isLoading}
              />
            )}
          </>
        }
      />

      {/* Modals */}
      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={handleCategoryModalClose}
        category={editingCategory}
      />

      <ManagePayeesModal
        isOpen={isPayeeModalOpen}
        onClose={handlePayeeModalClose}
        categories={categories}
        payees={payees}
      />
    </Page>
  );
};

export default Details;

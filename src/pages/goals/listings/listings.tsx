import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { RootState } from "@/store";
import { setList } from "@/store/slices/goalSlice";
import { useUser } from "@/context/UserContext";
import { decryptGoalData, decryptContributionData } from "@/utils/encryption";
import Card from "@/components/card";
import { Button } from "@/components/inputs";
import { CirclePlus } from "lucide-react";
import DataTable from "@/components/table";
import { getColumns } from "./columnDefs";
import { searchFilter } from "@/components/table/utils";
import Page from "@/components/page";
import { toast } from "sonner";

const GoalsListing = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const goals = useSelector((state: RootState) => state.goal.list);

  useEffect(() => {
    const fetchGoals = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("goals")
          .select(
            `
            *,
            contributions (
              id,
              amount,
              contribution_date
            )
          `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching goals:", error.message);
          toast.error("Failed to fetch goals. Please try again.");
          return;
        }

        // Decrypt the goals data
        const decryptedGoals = (data || []).map(goal => {
          try {
            const decryptedGoalData = decryptGoalData({
              ...goal,
              target_amount: goal.target_amount,
              current_balance: goal.current_balance,
            });

            // Decrypt contributions if they exist
            const decryptedContributions = (goal.contributions || []).map((contribution: any) => {
              try {
                const decryptedContribution = decryptContributionData({
                  ...contribution,
                  amount: contribution.amount,
                });
                return {
                  ...contribution,
                  amount: decryptedContribution.amount,
                };
              } catch (decryptError) {
                console.error("Error decrypting contribution:", contribution.id, decryptError);
                return contribution;
              }
            });

            return {
              ...goal,
              target_amount: decryptedGoalData.target_amount,
              current_balance: decryptedGoalData.current_balance,
              contributions: decryptedContributions,
            };
          } catch (decryptError) {
            console.error("Error decrypting goal data for goal:", goal.id, decryptError);
            return goal;
          }
        });

        dispatch(setList(decryptedGoals));
      } catch (error) {
        console.error("Error fetching goals:", error);
        toast.error("Failed to fetch goals. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoals();
  }, [dispatch, user?.id]);

  const handleSearch = (search: string) => {
    setSearchQuery(search.trim());
  };

  const handleAddNewGoal = () => {
    navigate("/dashboard/goals/create");
  };

  const handleRowClick = (id: string) => {
    navigate(`/dashboard/goals/${id}`);
  };

  const handleDeleteGoal = async (id: string) => {
    console.log(id);
  };

  const filteredGoals =
    searchQuery !== ""
      ? searchFilter({ rows: goals, term: searchQuery })
      : goals;

  // Calculate summary statistics
  const totalGoals = goals.length;
  const totalTargetAmount = goals.reduce(
    (sum, goal) => sum + goal.target_amount,
    0
  );
  const totalCurrentBalance = goals.reduce(
    (sum, goal) => sum + goal.current_balance,
    0
  );

  return (
    <Page
      title="All Goals Listing"
      subTitle="Track all your savings goals and monitor your progress"
    >
      {/* Summary Cards
      {totalGoals > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card
            cardContent={
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--content-textprimary)]">
                  {totalGoals}
                </div>
                <div className="text-sm text-[var(--content-textsecondary)]">
                  Total Goals
                </div>
              </div>
            }
          />
          <Card
            cardContent={
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--common-success)]">
                  {completedGoals}
                </div>
                <div className="text-sm text-[var(--content-textsecondary)]">
                  Completed
                </div>
              </div>
            }
          />
          <Card
            cardContent={
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--common-brand)]">
                  {activeGoals}
                </div>
                <div className="text-sm text-[var(--content-textsecondary)]">
                  Active
                </div>
              </div>
            }
          />
          <Card
            cardContent={
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--content-textprimary)]">
                  {overallProgress}%
                </div>
                <div className="text-sm text-[var(--content-textsecondary)]">
                  Overall Progress
                </div>
              </div>
            }
          />
        </div>
      )} */}

      {/* Goals Table */}
      <Card
        title="Your Goals"
        headerContent={
          <div className="flex items-center gap-4">
            {totalGoals > 0 && (
              <div className="text-sm text-[var(--content-textsecondary)]">
                ₹{totalCurrentBalance.toLocaleString("en-IN")} / ₹
                {totalTargetAmount.toLocaleString("en-IN")}
              </div>
            )}
            <Button
              type="button"
              title="Add New Goal"
              className="w-fit"
              onClick={handleAddNewGoal}
              icon={<CirclePlus />}
            />
          </div>
        }
        cardContent={
          <>
            {totalGoals === 0 && !isLoading ? (
              <div className="text-center py-12">
                <div className="text-[var(--content-textsecondary)] mb-4">
                  <CirclePlus size={48} className="mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No goals yet</h3>
                  <p className="text-sm">
                    Start your savings journey by creating your first goal!
                  </p>
                </div>
                <Button
                  type="button"
                  title="Create Your First Goal"
                  className="w-fit"
                  onClick={handleAddNewGoal}
                  icon={<CirclePlus />}
                />
              </div>
            ) : (
              <DataTable
                data={filteredGoals}
                columns={getColumns(handleRowClick, handleDeleteGoal)}
                onSearch={handleSearch}
                loading={isLoading}
              />
            )}
          </>
        }
      />
    </Page>
  );
};

export default GoalsListing;

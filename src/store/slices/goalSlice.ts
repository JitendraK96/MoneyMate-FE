import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Goal {
  id: string;
  name: string;
  description: string | null;
  target_amount: number;
  current_balance: number;
  target_date: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  contributions?: Array<{
    id: string;
    amount: number;
    contribution_date: string;
    description?: string | null;
    created_at: string;
  }>;
}

interface GoalState {
  list: Goal[];
}

const initialState: GoalState = {
  list: [],
};

export const goalSlice = createSlice({
  name: "goal",
  initialState,
  reducers: {
    setList: (state, action: PayloadAction<GoalState["list"]>) => {
      state.list = action.payload;
    },
  },
});

export const { setList } = goalSlice.actions;

export default goalSlice.reducer;

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ExpenseState {
  list: Array<{
    id: number;
    title: string;
    reminder_type: string;
    description: string;
    total_transactions: number;
    total_expenses: number;
    total_income: number;
  }>;
}

const initialState: ExpenseState = {
  list: [],
};

export const expenseSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    setList: (state, action: PayloadAction<ExpenseState["list"]>) => {
      state.list = action.payload;
    },
  },
});

export const { setList } = expenseSlice.actions;

export default expenseSlice.reducer;

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface BorrowingState {
  list: Array<{
    id: number;
    title: string;
    reminder_type: string;
    description: string;
  }>;
}

const initialState: BorrowingState = {
  list: [],
};

export const borrowingSlice = createSlice({
  name: "borrowing",
  initialState,
  reducers: {
    setList: (state, action: PayloadAction<BorrowingState["list"]>) => {
      state.list = action.payload;
    },
  },
});

export const { setList } = borrowingSlice.actions;

export default borrowingSlice.reducer;

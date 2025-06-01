import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ReminderState {
  list: Array<{
    id: number;
    title: string;
    reminder_type: string;
    description: string;
  }>;
}

const initialState: ReminderState = {
  list: [],
};

export const emiDetailsSlice = createSlice({
  name: "reminder",
  initialState,
  reducers: {
    setList: (state, action: PayloadAction<ReminderState["list"]>) => {
      state.list = action.payload;
    },
  },
});

export const { setList } = emiDetailsSlice.actions;

export default emiDetailsSlice.reducer;

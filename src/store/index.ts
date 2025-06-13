// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./slices/themeSlice";
import userReducer from "./slices/userSlice";
import emiDetailsReducer from "./slices/emiDetailsSlice";
import reminderReducer from "./slices/reminderSlice";
import borrowingReducer from "./slices/borrowingSlice";
import goalReducer from "./slices/goalSlice";
import expensesReducer from "./slices/expensesSlice";

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    user: userReducer,
    emiDetails: emiDetailsReducer,
    reminder: reminderReducer,
    borrowing: borrowingReducer,
    goal: goalReducer,
    expenses: expensesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

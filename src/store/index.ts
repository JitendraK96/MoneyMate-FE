// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./slices/themeSlice";
import userReducer from "./slices/userSlice";
import emiDetailsReducer from "./slices/emiDetailsSlice";

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    user: userReducer,
    emiDetails: emiDetailsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

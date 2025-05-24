import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface EmiDetailsState {
  loanAmount: number;
  rateOfInterest: number;
  tenure: number;
  hikePercentage: number;
  prepayments: { [month: number]: number };
  emiList: Array<{
    id: number;
    loan_amount: number;
    rate_of_interest: number;
    tenure: number;
    hike_percentage: number;
    prepayments: { [month: number]: number };
  }>;
}

const initialState: EmiDetailsState = {
  loanAmount: 0,
  rateOfInterest: 0,
  tenure: 0,
  hikePercentage: 0,
  prepayments: {},
  emiList: [],
};

export const emiDetailsSlice = createSlice({
  name: "emiDetails",
  initialState,
  reducers: {
    setLoanAmount: (state, action: PayloadAction<number>) => {
      state.loanAmount = action.payload;
    },
    setRateOfInterest: (state, action: PayloadAction<number>) => {
      state.rateOfInterest = action.payload;
    },
    setTenure: (state, action: PayloadAction<number>) => {
      state.tenure = action.payload;
    },
    setHikePercentage: (state, action: PayloadAction<number>) => {
      state.hikePercentage = action.payload;
    },
    setPrepayment: (
      state,
      action: PayloadAction<{ month: number; amount: number }>
    ) => {
      state.prepayments[action.payload.month] = action.payload.amount;
    },
    resetEmiDetails: (state) => {
      state.loanAmount = initialState.loanAmount;
      state.rateOfInterest = initialState.rateOfInterest;
      state.tenure = initialState.tenure;
      state.hikePercentage = initialState.hikePercentage;
      state.prepayments = {};
    },
    setEmiList: (state, action: PayloadAction<EmiDetailsState["emiList"]>) => {
      state.emiList = action.payload;
    },
  },
});

export const {
  setLoanAmount,
  setRateOfInterest,
  setTenure,
  setHikePercentage,
  setPrepayment,
  resetEmiDetails,
  setEmiList,
} = emiDetailsSlice.actions;

export default emiDetailsSlice.reducer;

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface EmiDetailsState {
  form: {
    name: string;
    loanAmount: number;
    rateOfInterest: number;
    tenure: number;
    hikePercentage: number;
    prepayments: { [month: number]: number };
  };
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
  form: {
    name: "",
    loanAmount: 1000,
    rateOfInterest: 0.1,
    tenure: 1,
    hikePercentage: 0,
    prepayments: {},
  },
  emiList: [],
};

export const emiDetailsSlice = createSlice({
  name: "emiDetails",
  initialState,
  reducers: {
    setName: (state, action: PayloadAction<string>) => {
      state.form.name = action.payload;
    },
    setLoanAmount: (state, action: PayloadAction<number>) => {
      state.form.loanAmount = action.payload;
    },
    setRateOfInterest: (state, action: PayloadAction<number>) => {
      state.form.rateOfInterest = action.payload;
    },
    setTenure: (state, action: PayloadAction<number>) => {
      state.form.tenure = action.payload;
    },
    setHikePercentage: (state, action: PayloadAction<number>) => {
      state.form.hikePercentage = action.payload;
    },
    setPrepayment: (
      state,
      action: PayloadAction<{ month: number; amount: number }>
    ) => {
      state.form.prepayments[action.payload.month] = action.payload.amount;
    },
    resetEmiForm: (state) => {
      state.form.name = initialState.form.name;
      state.form.loanAmount = initialState.form.loanAmount;
      state.form.rateOfInterest = initialState.form.rateOfInterest;
      state.form.tenure = initialState.form.tenure;
      state.form.hikePercentage = initialState.form.hikePercentage;
      state.form.prepayments = {};
    },
    setEmiList: (state, action: PayloadAction<EmiDetailsState["emiList"]>) => {
      state.emiList = action.payload;
    },
  },
});

export const {
  setName,
  setLoanAmount,
  setRateOfInterest,
  setTenure,
  setHikePercentage,
  setPrepayment,
  resetEmiForm,
  setEmiList,
} = emiDetailsSlice.actions;

export default emiDetailsSlice.reducer;

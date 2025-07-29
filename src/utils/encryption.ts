import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-secret-key-change-in-production';

export const encryptData = (data: any): string => {
  const jsonString = JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
};

export const decryptData = <T>(encryptedData: string): T => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
  const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(decryptedString) as T;
};

interface EmiEncryptedData {
  loan_amount: string;
  prepayments: string;
  [key: string]: any;
}

interface EmiDecryptedData {
  loan_amount: number;
  prepayments: Record<number, number>;
  [key: string]: any;
}

export const encryptEmiData = (data: EmiDecryptedData): EmiEncryptedData => {
  return {
    ...data,
    loan_amount: encryptData(data.loan_amount),
    prepayments: encryptData(data.prepayments),
  };
};

export const decryptEmiData = (data: EmiEncryptedData): EmiDecryptedData => {
  return {
    ...data,
    loan_amount: decryptData<number>(data.loan_amount),
    prepayments: decryptData<Record<number, number>>(data.prepayments),
  };
};

interface BorrowingEncryptedData {
  emi_amount: string;
  borrowing_amount: string;
  payment_details: string;
  [key: string]: any;
}

interface BorrowingDecryptedData {
  emi_amount: number;
  borrowing_amount: number;
  payment_details: Record<string, any>;
  [key: string]: any;
}

export const encryptBorrowingData = (data: BorrowingDecryptedData): BorrowingEncryptedData => {
  return {
    ...data,
    emi_amount: encryptData(data.emi_amount),
    borrowing_amount: encryptData(data.borrowing_amount),
    payment_details: encryptData(data.payment_details),
  };
};

export const decryptBorrowingData = (data: BorrowingEncryptedData): BorrowingDecryptedData => {
  return {
    ...data,
    emi_amount: decryptData<number>(data.emi_amount),
    borrowing_amount: decryptData<number>(data.borrowing_amount),
    payment_details: decryptData<Record<string, any>>(data.payment_details),
  };
};

interface GoalEncryptedData {
  target_amount: string;
  current_balance: string;
  [key: string]: any;
}

interface GoalDecryptedData {
  target_amount: number;
  current_balance: number;
  [key: string]: any;
}

interface ContributionEncryptedData {
  amount: string;
  [key: string]: any;
}

interface ContributionDecryptedData {
  amount: number;
  [key: string]: any;
}

export const encryptGoalData = (data: GoalDecryptedData): GoalEncryptedData => {
  return {
    ...data,
    target_amount: encryptData(data.target_amount),
    current_balance: encryptData(data.current_balance),
  };
};

export const decryptGoalData = (data: GoalEncryptedData): GoalDecryptedData => {
  return {
    ...data,
    target_amount: decryptData<number>(data.target_amount),
    current_balance: decryptData<number>(data.current_balance),
  };
};

export const encryptContributionData = (data: ContributionDecryptedData): ContributionEncryptedData => {
  return {
    ...data,
    amount: encryptData(data.amount),
  };
};

export const decryptContributionData = (data: ContributionEncryptedData): ContributionDecryptedData => {
  return {
    ...data,
    amount: decryptData<number>(data.amount),
  };
};

interface IncomeEncryptedData {
  amount: string;
  [key: string]: any;
}

interface IncomeDecryptedData {
  amount: number;
  [key: string]: any;
}

interface AllocationEncryptedData {
  allocation_amount: string;
  [key: string]: any;
}

interface AllocationDecryptedData {
  allocation_amount: number;
  [key: string]: any;
}

export const encryptIncomeData = (data: IncomeDecryptedData): IncomeEncryptedData => {
  return {
    ...data,
    amount: encryptData(data.amount),
  };
};

export const decryptIncomeData = (data: IncomeEncryptedData): IncomeDecryptedData => {
  return {
    ...data,
    amount: decryptData<number>(data.amount),
  };
};

export const encryptAllocationData = (data: AllocationDecryptedData): AllocationEncryptedData => {
  return {
    ...data,
    allocation_amount: encryptData(data.allocation_amount),
  };
};

export const decryptAllocationData = (data: AllocationEncryptedData): AllocationDecryptedData => {
  return {
    ...data,
    allocation_amount: decryptData<number>(data.allocation_amount),
  };
};

interface TransactionEncryptedData {
  amount: string;
  [key: string]: any;
}

interface TransactionDecryptedData {
  amount: number;
  [key: string]: any;
}

export const encryptTransactionData = (data: TransactionDecryptedData): TransactionEncryptedData => {
  return {
    ...data,
    amount: encryptData(data.amount),
  };
};

export const decryptTransactionData = (data: TransactionEncryptedData): TransactionDecryptedData => {
  return {
    ...data,
    amount: decryptData<number>(data.amount),
  };
};
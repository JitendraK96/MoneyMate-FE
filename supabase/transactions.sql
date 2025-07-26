-- Transactions Table
-- Purpose: Store individual financial transactions

-- Drop table if exists
DROP TABLE IF EXISTS transactions CASCADE;

-- Create transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expense_sheet_id UUID NOT NULL REFERENCES expense_sheets(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('expense', 'income')),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    payee_id UUID REFERENCES payees(id) ON DELETE SET NULL,
    signed_amount DECIMAL(15,2) NOT NULL,
    absolute_amount DECIMAL(15,2) NOT NULL CHECK (absolute_amount >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_expense_sheet_id ON transactions(expense_sheet_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_payee_id ON transactions(payee_id);
CREATE INDEX idx_transactions_transaction_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_transaction_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_is_active ON transactions(is_active);
CREATE INDEX idx_transactions_amount ON transactions(amount);

-- Composite indexes for common queries
CREATE INDEX idx_transactions_user_sheet_date ON transactions(user_id, expense_sheet_id, transaction_date);
CREATE INDEX idx_transactions_user_type_date ON transactions(user_id, transaction_type, transaction_date);

-- Enable Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON transactions
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
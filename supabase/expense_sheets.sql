-- Expense Sheets Table
-- Purpose: Store expense tracking sheets/periods

-- Drop table if exists
DROP TABLE IF EXISTS expense_sheets CASCADE;

-- Create expense_sheets table
CREATE TABLE expense_sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    income_id UUID REFERENCES incomes(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_expense_sheets_user_id ON expense_sheets(user_id);
CREATE INDEX idx_expense_sheets_income_id ON expense_sheets(income_id);
CREATE INDEX idx_expense_sheets_is_active ON expense_sheets(is_active);
CREATE INDEX idx_expense_sheets_name ON expense_sheets(name);

-- Create unique constraint for expense sheet name per user
CREATE UNIQUE INDEX idx_expense_sheets_user_name_unique ON expense_sheets(user_id, name) WHERE is_active = TRUE;

-- Enable Row Level Security (RLS)
ALTER TABLE expense_sheets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own expense sheets" ON expense_sheets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expense sheets" ON expense_sheets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense sheets" ON expense_sheets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expense sheets" ON expense_sheets
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_expense_sheets_updated_at BEFORE UPDATE ON expense_sheets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
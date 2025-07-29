-- Income Category Allocations Table
-- Purpose: Store detailed allocation of income to specific categories

-- Drop table if exists
DROP TABLE IF EXISTS income_category_allocations CASCADE;

-- Create income_category_allocations table
CREATE TABLE income_category_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    income_id UUID NOT NULL REFERENCES incomes(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    allocation_percentage DECIMAL(5,2) NOT NULL CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
    allocation_amount TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_income_category_allocations_income_id ON income_category_allocations(income_id);
CREATE INDEX idx_income_category_allocations_category_id ON income_category_allocations(category_id);
CREATE INDEX idx_income_category_allocations_user_id ON income_category_allocations(user_id);
CREATE INDEX idx_income_category_allocations_is_active ON income_category_allocations(is_active);

-- Create unique constraint for income-category allocation per user
CREATE UNIQUE INDEX idx_income_category_allocations_unique 
ON income_category_allocations(income_id, category_id) WHERE is_active = TRUE;

-- Enable Row Level Security (RLS)
ALTER TABLE income_category_allocations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own income category allocations" ON income_category_allocations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own income category allocations" ON income_category_allocations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own income category allocations" ON income_category_allocations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own income category allocations" ON income_category_allocations
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_income_category_allocations_updated_at BEFORE UPDATE ON income_category_allocations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Incomes Table
-- Purpose: Store user income sources with budget allocation percentages

-- Drop table if exists
DROP TABLE IF EXISTS incomes CASCADE;

-- Create incomes table
CREATE TABLE incomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('monthly', 'yearly', 'weekly', 'bi-weekly')),
    needs_percentage DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (needs_percentage >= 0 AND needs_percentage <= 100),
    wants_percentage DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (wants_percentage >= 0 AND wants_percentage <= 100),
    savings_percentage DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (savings_percentage >= 0 AND savings_percentage <= 100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_percentage_sum CHECK ((needs_percentage + wants_percentage + savings_percentage) = 100)
);

-- Create indexes for performance
CREATE INDEX idx_incomes_user_id ON incomes(user_id);
CREATE INDEX idx_incomes_is_active ON incomes(is_active);
CREATE INDEX idx_incomes_frequency ON incomes(frequency);

-- Create unique constraint for income source per user
CREATE UNIQUE INDEX idx_incomes_user_source_unique ON incomes(user_id, source) WHERE is_active = TRUE;

-- Enable Row Level Security (RLS)
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own incomes" ON incomes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own incomes" ON incomes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own incomes" ON incomes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own incomes" ON incomes
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_incomes_updated_at BEFORE UPDATE ON incomes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
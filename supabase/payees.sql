-- Payees Table
-- Purpose: Store payee/merchant information

-- Drop table if exists
DROP TABLE IF EXISTS payees CASCADE;

-- Create payees table
CREATE TABLE payees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_payees_user_id ON payees(user_id);
CREATE INDEX idx_payees_category_id ON payees(category_id);
CREATE INDEX idx_payees_name ON payees(name);

-- Create unique constraint for payee name per user
CREATE UNIQUE INDEX idx_payees_user_name_unique ON payees(user_id, name);

-- Enable Row Level Security (RLS)
ALTER TABLE payees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own payees" ON payees
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payees" ON payees
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payees" ON payees
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payees" ON payees
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_payees_updated_at BEFORE UPDATE ON payees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
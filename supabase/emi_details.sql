-- EMI Details Table
-- Purpose: Store EMI/loan tracking information

-- Drop table if exists
DROP TABLE IF EXISTS emi_details CASCADE;

-- Create emi_details table
CREATE TABLE emi_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    loan_amount TEXT NOT NULL,
    rate_of_interest DECIMAL(5,4) NOT NULL CHECK (rate_of_interest >= 0),
    tenure INTEGER NOT NULL CHECK (tenure > 0),
    hike_percentage DECIMAL(5,4) NOT NULL DEFAULT 0 CHECK (hike_percentage >= 0),
    prepayments TEXT NOT NULL DEFAULT '',
    floating_rates JSONB NOT NULL DEFAULT '{}',
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    is_compound_interest BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_emi_details_user_id ON emi_details(user_id);
CREATE INDEX idx_emi_details_is_paid ON emi_details(is_paid);
CREATE INDEX idx_emi_details_name ON emi_details(name);

-- Create GIN index for JSONB columns (only floating_rates now, prepayments is encrypted TEXT)
CREATE INDEX idx_emi_details_floating_rates ON emi_details USING GIN (floating_rates);

-- Create unique constraint for EMI name per user
CREATE UNIQUE INDEX idx_emi_details_user_name_unique ON emi_details(user_id, name);

-- Enable Row Level Security (RLS)
ALTER TABLE emi_details ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own EMI details" ON emi_details
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own EMI details" ON emi_details
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own EMI details" ON emi_details
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own EMI details" ON emi_details
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_emi_details_updated_at BEFORE UPDATE ON emi_details
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
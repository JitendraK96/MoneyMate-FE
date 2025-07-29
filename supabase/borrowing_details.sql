-- Borrowing Details Table
-- Purpose: Store borrowing/lending tracking information

-- Drop table if exists
DROP TABLE IF EXISTS borrowing_details CASCADE;

-- Create borrowing_details table
CREATE TABLE borrowing_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    borrowing_amount TEXT NOT NULL,
    tenure INTEGER NOT NULL CHECK (tenure > 0),
    emi_amount TEXT NOT NULL,
    payment_info TEXT,
    paid_months JSONB NOT NULL DEFAULT '{}',
    payment_details TEXT NOT NULL DEFAULT '',
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_borrowing_details_user_id ON borrowing_details(user_id);
CREATE INDEX idx_borrowing_details_is_completed ON borrowing_details(is_completed);
CREATE INDEX idx_borrowing_details_start_date ON borrowing_details(start_date);
CREATE INDEX idx_borrowing_details_title ON borrowing_details(title);

-- Create GIN index for JSONB columns (only paid_months now, payment_details is encrypted TEXT)
CREATE INDEX idx_borrowing_details_paid_months ON borrowing_details USING GIN (paid_months);

-- Create unique constraint for borrowing title per user
CREATE UNIQUE INDEX idx_borrowing_details_user_title_unique ON borrowing_details(user_id, title);

-- Enable Row Level Security (RLS)
ALTER TABLE borrowing_details ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own borrowing details" ON borrowing_details
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own borrowing details" ON borrowing_details
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own borrowing details" ON borrowing_details
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own borrowing details" ON borrowing_details
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_borrowing_details_updated_at BEFORE UPDATE ON borrowing_details
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
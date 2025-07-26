-- Reminders Table
-- Purpose: Store user reminders with recurring options

-- Drop table if exists
DROP TABLE IF EXISTS reminders CASCADE;

-- Create reminders table
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reminder_date DATE,
    reminder_type VARCHAR(50),
    recurring_type VARCHAR(20) CHECK (recurring_type IN ('weekly', 'monthly', 'none') OR recurring_type IS NULL),
    date_of_month INTEGER CHECK (date_of_month >= 1 AND date_of_month <= 31),
    day_of_week VARCHAR(10) CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
    weekly_expiration_date DATE,
    monthly_expiration_date DATE,
    is_last_day_of_month BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_reminder_date ON reminders(reminder_date);
CREATE INDEX idx_reminders_recurring_type ON reminders(recurring_type);
CREATE INDEX idx_reminders_day_of_week ON reminders(day_of_week);
CREATE INDEX idx_reminders_date_of_month ON reminders(date_of_month);
CREATE INDEX idx_reminders_title ON reminders(title);

-- Composite indexes for recurring reminders
CREATE INDEX idx_reminders_weekly_recurring ON reminders(user_id, recurring_type, day_of_week) 
    WHERE recurring_type = 'weekly';
CREATE INDEX idx_reminders_monthly_recurring ON reminders(user_id, recurring_type, date_of_month) 
    WHERE recurring_type = 'monthly';

-- Enable Row Level Security (RLS)
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own reminders" ON reminders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders" ON reminders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders" ON reminders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders" ON reminders
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraint to ensure proper recurring reminder configuration
ALTER TABLE reminders ADD CONSTRAINT check_recurring_config 
CHECK (
    (recurring_type = 'weekly' AND day_of_week IS NOT NULL) OR
    (recurring_type = 'monthly' AND (date_of_month IS NOT NULL OR is_last_day_of_month = TRUE)) OR
    (recurring_type = 'none' OR recurring_type IS NULL)
);
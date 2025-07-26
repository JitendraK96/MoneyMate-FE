-- Contributions Table
-- Purpose: Store contributions made towards goals

-- Drop table if exists
DROP TABLE IF EXISTS contributions CASCADE;

-- Create contributions table
CREATE TABLE contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    contribution_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_contributions_goal_id ON contributions(goal_id);
CREATE INDEX idx_contributions_contribution_date ON contributions(contribution_date);
CREATE INDEX idx_contributions_amount ON contributions(amount);

-- Composite index for common queries
CREATE INDEX idx_contributions_goal_date ON contributions(goal_id, contribution_date);

-- Enable Row Level Security (RLS)
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (based on goal ownership)
CREATE POLICY "Users can view contributions for their own goals" ON contributions
    FOR SELECT USING (
        goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert contributions for their own goals" ON contributions
    FOR INSERT WITH CHECK (
        goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update contributions for their own goals" ON contributions
    FOR UPDATE USING (
        goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete contributions for their own goals" ON contributions
    FOR DELETE USING (
        goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
    );

-- Create trigger for updated_at
CREATE TRIGGER update_contributions_updated_at BEFORE UPDATE ON contributions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update goal current_balance on contribution changes
CREATE OR REPLACE FUNCTION update_goal_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE goals 
        SET current_balance = current_balance + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.goal_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE goals 
        SET current_balance = current_balance - OLD.amount + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.goal_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE goals 
        SET current_balance = current_balance - OLD.amount,
            updated_at = NOW()
        WHERE id = OLD.goal_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_goal_balance
    AFTER INSERT OR UPDATE OR DELETE ON contributions
    FOR EACH ROW EXECUTE FUNCTION update_goal_balance();
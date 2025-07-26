-- MoneyMate Database Setup Script
-- Purpose: Complete database setup for MoneyMate application
-- Execute this script to set up all tables, indexes, constraints, and policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create reusable function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Execute table creation scripts in dependency order
\i categories.sql
\i payees.sql
\i incomes.sql
\i income_category_allocations.sql
\i expense_sheets.sql
\i transactions.sql
\i goals.sql
\i contributions.sql
\i emi_details.sql
\i borrowing_details.sql
\i reminders.sql

-- Create views
\i views.sql

-- Create additional production indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_category_date 
ON transactions(user_id, category_id, transaction_date) WHERE is_active = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_payee_date 
ON transactions(user_id, payee_id, transaction_date) WHERE is_active = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_goals_user_target_date 
ON goals(user_id, target_date) WHERE is_completed = FALSE;

-- Grant necessary permissions (adjust schema name as needed)
-- GRANT USAGE ON SCHEMA public TO authenticated;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Insert default categories for new users (optional)
-- You can uncomment and modify this section if you want default categories
/*
INSERT INTO categories (name, description, bucket, color, icon, user_id) VALUES
('Groceries', 'Food and household essentials', 'needs', '#FF6B6B', 'shopping-cart', '00000000-0000-0000-0000-000000000000'),
('Rent/Mortgage', 'Housing costs', 'needs', '#4ECDC4', 'home', '00000000-0000-0000-0000-000000000000'),
('Utilities', 'Electricity, water, gas, internet', 'needs', '#45B7D1', 'zap', '00000000-0000-0000-0000-000000000000'),
('Transportation', 'Fuel, public transport, maintenance', 'needs', '#96CEB4', 'car', '00000000-0000-0000-0000-000000000000'),
('Entertainment', 'Movies, games, subscriptions', 'wants', '#FFEAA7', 'play-circle', '00000000-0000-0000-0000-000000000000'),
('Dining Out', 'Restaurants and takeout', 'wants', '#DDA0DD', 'utensils', '00000000-0000-0000-0000-000000000000'),
('Emergency Fund', 'Emergency savings', 'savings', '#98D8C8', 'shield', '00000000-0000-0000-0000-000000000000'),
('Investments', 'Stocks, bonds, mutual funds', 'savings', '#F7DC6F', 'trending-up', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (user_id, name) DO NOTHING;
*/

-- Performance optimization settings (adjust based on your needs)
-- These are suggestions for production environment
/*
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;
*/
-- Database Views
-- Purpose: Create optimized views for common queries

-- Drop views if they exist (in reverse dependency order)
DROP VIEW IF EXISTS expense_sheets_with_summary CASCADE;
DROP VIEW IF EXISTS incomes_with_category_allocations CASCADE;
DROP VIEW IF EXISTS transactions_with_details CASCADE;

-- 1. Transactions with Details View
-- Purpose: Denormalized view of transactions with category and payee details
CREATE VIEW transactions_with_details AS
SELECT 
    t.*,
    c.name as category_name,
    c.bucket as category_bucket,
    c.color as category_color,
    p.name as payee_name,
    es.name as expense_sheet_name
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN payees p ON t.payee_id = p.id
JOIN expense_sheets es ON t.expense_sheet_id = es.id
WHERE t.is_active = TRUE;

-- 2. Expense Sheets with Summary View
-- Purpose: Expense sheets with computed summary statistics
CREATE VIEW expense_sheets_with_summary AS
SELECT 
    es.*,
    COALESCE(stats.total_transactions, 0) as total_transactions,
    COALESCE(stats.expense_transactions, 0) as expense_transactions,
    COALESCE(stats.total_expenses, 0) as total_expenses,
    COALESCE(stats.needs_expenses, 0) as needs_expenses,
    COALESCE(stats.wants_expenses, 0) as wants_expenses,
    COALESCE(stats.savings_expenses, 0) as savings_expenses,
    stats.first_transaction_date,
    stats.last_transaction_date
FROM expense_sheets es
LEFT JOIN (
    SELECT 
        t.expense_sheet_id,
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN t.transaction_type = 'expense' THEN 1 END) as expense_transactions,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'expense' THEN t.absolute_amount END), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'expense' AND c.bucket = 'needs' THEN t.absolute_amount END), 0) as needs_expenses,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'expense' AND c.bucket = 'wants' THEN t.absolute_amount END), 0) as wants_expenses,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'expense' AND c.bucket = 'savings' THEN t.absolute_amount END), 0) as savings_expenses,
        MIN(t.transaction_date) as first_transaction_date,
        MAX(t.transaction_date) as last_transaction_date
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.is_active = TRUE
    GROUP BY t.expense_sheet_id
) stats ON es.id = stats.expense_sheet_id
WHERE es.is_active = TRUE;

-- 3. Incomes with Category Allocations View
-- Purpose: Incomes with detailed category allocation information
CREATE VIEW incomes_with_category_allocations AS
SELECT 
    i.*,
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'category_id', ica.category_id,
                'category_name', c.name,
                'category_bucket', c.bucket,
                'allocation_percentage', ica.allocation_percentage,
                'allocation_amount', ica.allocation_amount
            )
        ) FILTER (WHERE ica.id IS NOT NULL), 
        '[]'::json
    ) as category_allocations
FROM incomes i
LEFT JOIN income_category_allocations ica ON i.id = ica.income_id AND ica.is_active = TRUE
LEFT JOIN categories c ON ica.category_id = c.id AND c.is_active = TRUE
WHERE i.is_active = TRUE
GROUP BY i.id, i.user_id, i.source, i.description, i.amount, i.frequency, 
         i.needs_percentage, i.wants_percentage, i.savings_percentage, 
         i.is_active, i.created_at, i.updated_at;

-- Note: Views automatically inherit RLS policies from their underlying tables
-- No need to create separate RLS policies for views
-- Views also inherit indexes from their underlying tables automatically
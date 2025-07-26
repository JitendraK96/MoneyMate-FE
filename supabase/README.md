# MoneyMate Database Schema

This folder contains production-ready Supabase SQL scripts for the MoneyMate application.

## Files Structure

- `setup.sql` - Master setup script that executes all other scripts in the correct order
- `categories.sql` - Categories table for expense/income classification
- `payees.sql` - Payees/merchants table
- `incomes.sql` - User income sources with budget allocation
- `income_category_allocations.sql` - Detailed income-to-category allocations
- `expense_sheets.sql` - Expense tracking sheets/periods
- `transactions.sql` - Individual financial transactions
- `goals.sql` - User savings goals
- `contributions.sql` - Contributions made towards goals
- `emi_details.sql` - EMI/loan tracking
- `borrowing_details.sql` - Borrowing/lending tracking
- `reminders.sql` - User reminders with recurring options
- `views.sql` - Database views for optimized queries

## Quick Setup

1. **Run the master setup script:**
   ```sql
   \i setup.sql
   ```

2. **Or run individual files in this order:**
   ```sql
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
   \i views.sql
   ```

## Features

✅ **Production Ready**
- DROP IF EXISTS for safe re-execution
- Proper data types and constraints
- Performance indexes
- Foreign key relationships

✅ **Security**
- Row Level Security (RLS) enabled
- User-specific data isolation
- Proper authentication policies

✅ **Performance**
- Optimized indexes for common queries
- Composite indexes for complex operations
- GIN indexes for JSONB columns

✅ **Data Integrity**
- Check constraints for valid data
- Unique constraints where needed
- Automatic timestamp management
- Cascading deletes/updates

## Database Schema Overview

### Core Tables
1. **categories** - Expense/income categories with budget buckets (needs/wants/savings)
2. **payees** - Merchants and payees
3. **incomes** - Income sources with budget allocation percentages
4. **expense_sheets** - Expense tracking periods
5. **transactions** - Individual financial transactions

### Goal Management
6. **goals** - Savings goals
7. **contributions** - Goal contributions (auto-updates goal balance)

### Loan Management  
8. **emi_details** - EMI/loan tracking with prepayments
9. **borrowing_details** - Borrowing/lending management

### Utilities
10. **reminders** - Recurring and one-time reminders
11. **income_category_allocations** - Detailed income-to-category mapping

### Views
- **transactions_with_details** - Transactions with category/payee names
- **expense_sheets_with_summary** - Sheets with computed statistics
- **incomes_with_category_allocations** - Incomes with allocation details

## Notes

- All tables use UUID primary keys
- RLS policies ensure users only see their own data
- Automatic `updated_at` timestamp triggers
- JSONB columns for flexible data storage (EMI prepayments, etc.)
- Production-optimized with proper indexes and constraints
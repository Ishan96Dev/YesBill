# ============================================================
# YesBill - Supabase Setup Guide
# ============================================================
# Complete guide for setting up your Supabase database

## Prerequisites

✅ Supabase account created
✅ Project created: dmabraziqscumpbwhjbf
✅ Project URL: https://dmabraziqscumpbwhjbf.supabase.co

---

## Step 1: Run Database Migrations

### Option A: Using Supabase Dashboard (Recommended for First Time)

1. Go to your Supabase Dashboard:
   https://supabase.com/dashboard/project/dmabraziqscumpbwhjbf

2. Navigate to: **SQL Editor** (left sidebar)

3. Run migrations in order:

#### Migration 1: Bill Configs Table
```bash
# Open and copy: supabase/migrations/001_create_bill_configs.sql
# Paste into SQL Editor
# Click "Run"
```

#### Migration 2: Daily Records Table
```bash
# Open and copy: supabase/migrations/002_create_daily_records.sql
# Paste into SQL Editor
# Click "Run"
```

#### Migration 3: Helper Functions
```bash
# Open and copy: supabase/migrations/003_create_helper_functions.sql
# Paste into SQL Editor
# Click "Run"
```

4. Verify tables created:
   - Go to **Table Editor** (left sidebar)
   - You should see: `bill_configs` and `daily_records`

---

### Option B: Using Supabase CLI (For Advanced Users)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref dmabraziqscumpbwhjbf

# Run all migrations
supabase db push
```

---

## Step 2: Enable Authentication

### Email Authentication (Default)

1. Go to: **Authentication > Providers** in Supabase Dashboard
2. **Email** should already be enabled by default
3. Settings to check:
   - ✅ Enable email provider
   - ✅ Confirm email (recommended for production)
   - ✅ Secure email change (recommended)

### Optional: Enable Social Login

#### Google OAuth
1. Go to: **Authentication > Providers > Google**
2. Enable Google provider
3. Add your credentials:
   - Client ID (from Google Cloud Console)
   - Client Secret
   - Authorized redirect URLs: `https://dmabraziqscumpbwhjbf.supabase.co/auth/v1/callback`

#### GitHub OAuth
1. Go to: **Authentication > Providers > GitHub**
2. Enable GitHub provider
3. Add your credentials:
   - Client ID (from GitHub OAuth Apps)
   - Client Secret
   - Authorized redirect URLs: `https://dmabraziqscumpbwhjbf.supabase.co/auth/v1/callback`

---

## Step 3: Configure Authentication Settings

1. Go to: **Authentication > Settings**

### Site URL Configuration
```
Site URL: https://your-domain.com
Additional Redirect URLs:
  - http://localhost:5173
  - http://localhost:3000
  - https://your-production-domain.com
```

### Email Templates (Optional)
Customize email templates for:
- Confirmation email
- Magic link email
- Password reset email
- Email change confirmation

---

## Step 4: Set Up Row Level Security (RLS)

RLS is already configured in the migrations! Verify:

1. Go to: **Authentication > Policies**
2. Check `bill_configs` table:
   - ✅ Users can view their own bill configs
   - ✅ Users can create their own bill configs
   - ✅ Users can update their own bill configs
   - ✅ Users can delete their own bill configs

3. Check `daily_records` table:
   - ✅ Users can view their own daily records
   - ✅ Users can create their own daily records
   - ✅ Users can update their own daily records
   - ✅ Users can delete their own daily records

---

## Step 5: Test Database Setup

### Using SQL Editor

```sql
-- Test 1: Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Test 2: Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Test 3: Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';

-- Expected functions:
-- - get_monthly_summary
-- - get_records_by_month
-- - get_active_bill_config
-- - get_user_statistics
```

---

## Step 6: Create Test User

### Using Supabase Dashboard

1. Go to: **Authentication > Users**
2. Click: **Add User**
3. Enter:
   - Email: test@yesbill.com
   - Password: Test123456!
   - Auto-confirm: ✅ (for testing)
4. Click: **Create User**

### Using Your Frontend (Better)

1. Start your frontend: `npm run dev`
2. Go to: http://localhost:5173/signup
3. Register a new account
4. Check email for confirmation link (if enabled)

---

## Step 7: Test Authentication Flow

### Test with curl

```bash
# 1. Sign up
curl -X POST 'https://dmabraziqscumpbwhjbf.supabase.co/auth/v1/signup' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYWJyYXppcXNjdW1wYndoamJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTExNzUsImV4cCI6MjA4NTc4NzE3NX0.W_AApu-t2O-RbxO9AN-wTYmdIX7IBRAi08rBOF_dTDY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepass123"
  }'

# 2. Sign in
curl -X POST 'https://dmabraziqscumpbwhjbf.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYWJyYXppcXNjdW1wYndoamJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTExNzUsImV4cCI6MjA4NTc4NzE3NX0.W_AApu-t2O-RbxO9AN-wTYmdIX7IBRAi08rBOF_dTDY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepass123"
  }'
```

---

## Step 8: Verify Everything Works

### Checklist

- [ ] Bill configs table created
- [ ] Daily records table created
- [ ] RLS policies active on both tables
- [ ] Helper functions created
- [ ] Email authentication enabled
- [ ] Test user created successfully
- [ ] User can sign up
- [ ] User can sign in
- [ ] User receives JWT token

---

## Database Schema Overview

### Tables

#### `bill_configs`
```
id              UUID (PRIMARY KEY)
user_id         UUID (FOREIGN KEY → auth.users)
daily_amount    DECIMAL(10,2)
currency        VARCHAR(3)
start_date      DATE
active          BOOLEAN
created_at      TIMESTAMP
updated_at      TIMESTAMP

Constraints:
- Only one active config per user
- daily_amount must be > 0 and < 1,000,000
- start_date cannot be in future
```

#### `daily_records`
```
id              UUID (PRIMARY KEY)
user_id         UUID (FOREIGN KEY → auth.users)
bill_config_id  UUID (FOREIGN KEY → bill_configs)
date            DATE
status          ENUM('YES', 'NO')
amount          DECIMAL(10,2) [auto-calculated]
created_at      TIMESTAMP
updated_at      TIMESTAMP

Constraints:
- Only one record per user per date
- date cannot be in future
- amount auto-set based on status
```

---

## Helper Functions

### `get_monthly_summary(user_id, year_month)`
Returns aggregated monthly data:
- total_yes_days
- total_amount
- currency
- daily_rate

### `get_records_by_month(user_id, year_month)`
Returns all daily records for a specific month

### `get_active_bill_config(user_id)`
Returns the currently active bill configuration

### `get_user_statistics(user_id)`
Returns overall user statistics

---

## Security Features

✅ **Row Level Security (RLS)**: Users can only access their own data
✅ **Automatic user_id binding**: Can't access other users' records
✅ **Cascade deletes**: Deleting user deletes all their data
✅ **Data validation**: Constraints prevent invalid data
✅ **Auto-calculated amounts**: Amount set based on status automatically
✅ **Updated timestamps**: Auto-updated on every change

---

## Next Steps

1. ✅ Database setup complete
2. ⏭️ Update backend to use Supabase (see backend/README.md)
3. ⏭️ Update frontend to use Supabase (see frontend/README.md)
4. ⏭️ Test end-to-end flow
5. ⏭️ Deploy to production

---

## Troubleshooting

### Issue: Migrations fail
**Solution**: Check SQL syntax, run migrations one at a time

### Issue: RLS blocks all queries
**Solution**: Make sure JWT token contains correct user_id

### Issue: Can't create records
**Solution**: Verify active bill_config exists for user

### Issue: Email not sending
**Solution**: Check Authentication > Settings > Email auth settings

---

## Support Resources

- Supabase Docs: https://supabase.com/docs
- SQL Editor: https://supabase.com/dashboard/project/dmabraziqscumpbwhjbf/editor
- Table Editor: https://supabase.com/dashboard/project/dmabraziqscumpbwhjbf/editor
- API Docs: https://supabase.com/docs/reference/javascript

---

**✅ Setup Complete! Your Supabase database is ready for YesBill!**

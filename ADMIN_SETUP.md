# Admin Panel Setup Guide

## Overview
A complete admin panel has been created for your online banking platform with full control over users, balances, crypto wallets, and transfers.

## Security Notice
**IMPORTANT**: For security reasons, admin credentials are NOT hardcoded in the application. Instead, the admin panel uses a secure role-based authentication system through the database.

## How to Set Up Admin Access

### Step 1: Create an Admin Account
1. Go to your application's signup page (`/auth`)
2. Create a new account with your desired credentials (use the email: `piofficialreception@gmail.com` if you wish)
3. Complete the signup process

### Step 2: Assign Admin Role via Database
After creating your account, you need to assign the admin role through the database:

1. Open your backend management panel (click the "Cloud" tab in Lovable or access Supabase directly)
2. Go to the **Database** section
3. Find the **user_roles** table
4. Click **Insert Row** and add:
   - `user_id`: [Your user ID from the profiles or auth.users table]
   - `role`: Select `admin` from the dropdown
5. Save the record

### Step 3: Access the Admin Panel
1. Sign in with your admin account credentials
2. Navigate to `/admin` in your browser
3. You now have full admin access!

## Admin Panel Features

### 1. **Dashboard**
- View total users, active users, deposits, withdrawals
- See pending transfers and completed transactions
- Real-time statistics overview

### 2. **Manage Users**
- Search and view all users
- Block/unblock user accounts
- View detailed user information
- Blocked users receive notification: "Your account has been restricted. Contact support."

### 3. **Edit Balances**
- Add funds to user accounts
- Subtract funds from user accounts
- Changes reflect instantly on user dashboard
- All transactions are logged

### 4. **Crypto Funding**
- Fund crypto balances for BTC, ETH, LTC, USDT, BNB
- Add or deduct crypto balances
- Automatically creates wallets if they don't exist
- View current crypto wallet balances

### 5. **Wallet Address Update**
- Change or update user crypto wallet addresses
- All changes reflect instantly on user accounts

### 6. **Pending Transfers**
- View all pending transfers
- Approve transfers → Status changes to "Completed"
- Reject transfers → Status changes to "Failed" with reason
- Users see full transaction details and status

### 7. **Settings**
- Additional admin configurations (placeholder for future features)

## Security Features

✅ **Role-Based Access Control**: Only users with admin role can access the panel

✅ **RLS Policies**: Database-level security ensures admins can only perform authorized actions

✅ **Action Logging**: All admin actions are logged in the `admin_logs` table with timestamps

✅ **Session Validation**: Admin status is verified on every page load

✅ **Blocked User Protection**: Blocked users cannot login or access any features

## Technical Details

### Database Tables Created:
- `admin_logs`: Tracks all admin actions
- `user_roles`: Stores user roles (admin/user)

### RLS Policies Added:
- Admins can view/update all profiles
- Admins can manage all accounts and balances
- Admins can manage all crypto wallets
- Admins can approve/reject transfers
- Admins can view all transactions

### Functions Created:
- `admin_update_user_status()`: Securely updates user status (active/blocked)

## Quick SQL Command to Make Yourself Admin

If you have access to the SQL editor, you can run this command (replace with your actual user_id):

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('[YOUR_USER_ID_HERE]', 'admin');
```

To find your user ID, you can run:
```sql
SELECT id, email FROM auth.users WHERE email = 'piofficialreception@gmail.com';
```

## Navigation
Access the admin panel at: `https://your-domain.com/admin`

## Support
If you encounter any issues setting up admin access, please check:
1. You've signed up for an account
2. You've added the admin role to the user_roles table
3. You're logged in with the admin account
4. You're navigating to `/admin`

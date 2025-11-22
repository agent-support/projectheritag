-- Comprehensive RLS Policy Fix for All Tables
-- This ensures users can INSERT, SELECT, and UPDATE their own data without errors

-- ============================================
-- ACCOUNTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can create own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;

CREATE POLICY "Users can create own accounts"
ON public.accounts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own accounts"
ON public.accounts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
ON public.accounts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can create own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;

CREATE POLICY "Users can create own transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM public.accounts WHERE id = account_id
));

CREATE POLICY "Users can view own transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (auth.uid() IN (
  SELECT user_id FROM public.accounts WHERE id = account_id
));

-- ============================================
-- TRANSFERS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can create own transfers" ON public.transfers;
DROP POLICY IF EXISTS "Users can view own transfers" ON public.transfers;
DROP POLICY IF EXISTS "transfers_insert_policy" ON public.transfers;
DROP POLICY IF EXISTS "transfers_select_policy" ON public.transfers;

CREATE POLICY "Users can create own transfers"
ON public.transfers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own transfers"
ON public.transfers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- CRYPTO_WALLETS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can create own crypto wallets" ON public.crypto_wallets;
DROP POLICY IF EXISTS "Users can view own crypto wallets" ON public.crypto_wallets;
DROP POLICY IF EXISTS "Users can update own crypto wallets" ON public.crypto_wallets;
DROP POLICY IF EXISTS "crypto_wallets_insert_policy" ON public.crypto_wallets;
DROP POLICY IF EXISTS "crypto_wallets_select_policy" ON public.crypto_wallets;
DROP POLICY IF EXISTS "crypto_wallets_update_policy" ON public.crypto_wallets;

CREATE POLICY "Users can create own crypto wallets"
ON public.crypto_wallets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own crypto wallets"
ON public.crypto_wallets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own crypto wallets"
ON public.crypto_wallets
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- CRYPTO_TRANSACTIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can create own crypto transactions" ON public.crypto_transactions;
DROP POLICY IF EXISTS "Users can view own crypto transactions" ON public.crypto_transactions;

CREATE POLICY "Users can create own crypto transactions"
ON public.crypto_transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own crypto transactions"
ON public.crypto_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- BILLS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can create own bills" ON public.bills;
DROP POLICY IF EXISTS "Users can view own bills" ON public.bills;
DROP POLICY IF EXISTS "Users can update own bills" ON public.bills;
DROP POLICY IF EXISTS "Users can delete own bills" ON public.bills;

CREATE POLICY "Users can create own bills"
ON public.bills
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own bills"
ON public.bills
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own bills"
ON public.bills
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bills"
ON public.bills
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- PORTFOLIOS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can create own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can view own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can update own portfolios" ON public.portfolios;

CREATE POLICY "Users can create own portfolios"
ON public.portfolios
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own portfolios"
ON public.portfolios
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios"
ON public.portfolios
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- HOLDINGS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can create own holdings" ON public.holdings;
DROP POLICY IF EXISTS "Users can view own holdings" ON public.holdings;
DROP POLICY IF EXISTS "Users can update own holdings" ON public.holdings;
DROP POLICY IF EXISTS "Users can delete own holdings" ON public.holdings;

CREATE POLICY "Users can create own holdings"
ON public.holdings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM public.portfolios WHERE id = portfolio_id
));

CREATE POLICY "Users can view own holdings"
ON public.holdings
FOR SELECT
TO authenticated
USING (auth.uid() IN (
  SELECT user_id FROM public.portfolios WHERE id = portfolio_id
));

CREATE POLICY "Users can update own holdings"
ON public.holdings
FOR UPDATE
TO authenticated
USING (auth.uid() IN (
  SELECT user_id FROM public.portfolios WHERE id = portfolio_id
));

CREATE POLICY "Users can delete own holdings"
ON public.holdings
FOR DELETE
TO authenticated
USING (auth.uid() IN (
  SELECT user_id FROM public.portfolios WHERE id = portfolio_id
));

-- ============================================
-- GRANT NECESSARY PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT ALL ON public.accounts TO authenticated;
GRANT ALL ON public.transactions TO authenticated;
GRANT ALL ON public.transfers TO authenticated;
GRANT ALL ON public.crypto_wallets TO authenticated;
GRANT ALL ON public.crypto_transactions TO authenticated;
GRANT ALL ON public.bills TO authenticated;
GRANT ALL ON public.portfolios TO authenticated;
GRANT ALL ON public.holdings TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
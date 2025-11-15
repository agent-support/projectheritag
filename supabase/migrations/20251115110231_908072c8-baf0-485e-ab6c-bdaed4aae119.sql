-- Add transfer_pin to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS transfer_pin text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS profile_picture_url text,
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS username text;

-- Create transfers table to store transfer history
CREATE TABLE IF NOT EXISTS public.transfers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  recipient_name text NOT NULL,
  recipient_account text NOT NULL,
  recipient_bank text,
  recipient_country text,
  amount numeric NOT NULL,
  transfer_type text NOT NULL CHECK (transfer_type IN ('local', 'international')),
  status text NOT NULL DEFAULT 'completed',
  reference_number text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on transfers table
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- Create policies for transfers
CREATE POLICY "Users can view own transfers" 
ON public.transfers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transfers" 
ON public.transfers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create crypto_wallets table
CREATE TABLE IF NOT EXISTS public.crypto_wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  coin_symbol text NOT NULL,
  wallet_address text NOT NULL,
  balance numeric DEFAULT 0.00,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on crypto_wallets table
ALTER TABLE public.crypto_wallets ENABLE ROW LEVEL SECURITY;

-- Create policies for crypto_wallets
CREATE POLICY "Users can view own crypto wallets" 
ON public.crypto_wallets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own crypto wallets" 
ON public.crypto_wallets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own crypto wallets" 
ON public.crypto_wallets 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for crypto_wallets updated_at
CREATE TRIGGER update_crypto_wallets_updated_at
BEFORE UPDATE ON public.crypto_wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Add transfer_pin to profiles table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'transfer_pin') THEN
    ALTER TABLE public.profiles ADD COLUMN transfer_pin text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'address') THEN
    ALTER TABLE public.profiles ADD COLUMN address text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'date_of_birth') THEN
    ALTER TABLE public.profiles ADD COLUMN date_of_birth date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'profile_picture_url') THEN
    ALTER TABLE public.profiles ADD COLUMN profile_picture_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'age') THEN
    ALTER TABLE public.profiles ADD COLUMN age integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'username') THEN
    ALTER TABLE public.profiles ADD COLUMN username text;
  END IF;
END $$;

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

-- Create policies for transfers (with unique names)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transfers' AND policyname = 'transfers_select_policy') THEN
    CREATE POLICY "transfers_select_policy" 
    ON public.transfers 
    FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transfers' AND policyname = 'transfers_insert_policy') THEN
    CREATE POLICY "transfers_insert_policy" 
    ON public.transfers 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

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
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'crypto_wallets' AND policyname = 'crypto_wallets_select_policy') THEN
    CREATE POLICY "crypto_wallets_select_policy" 
    ON public.crypto_wallets 
    FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'crypto_wallets' AND policyname = 'crypto_wallets_insert_policy') THEN
    CREATE POLICY "crypto_wallets_insert_policy" 
    ON public.crypto_wallets 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'crypto_wallets' AND policyname = 'crypto_wallets_update_policy') THEN
    CREATE POLICY "crypto_wallets_update_policy" 
    ON public.crypto_wallets 
    FOR UPDATE 
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create trigger for crypto_wallets updated_at if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_crypto_wallets_updated_at') THEN
    CREATE TRIGGER update_crypto_wallets_updated_at
    BEFORE UPDATE ON public.crypto_wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
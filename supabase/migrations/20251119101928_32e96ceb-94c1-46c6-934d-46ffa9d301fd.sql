-- Add coin_symbol to crypto_transfer_fees and rename btc_fee to fee_amount
ALTER TABLE public.crypto_transfer_fees 
ADD COLUMN coin_symbol TEXT NOT NULL DEFAULT 'BTC',
ADD COLUMN fee_amount NUMERIC NOT NULL DEFAULT 0.0001;

-- Copy btc_fee to fee_amount then drop btc_fee
UPDATE public.crypto_transfer_fees SET fee_amount = btc_fee;
ALTER TABLE public.crypto_transfer_fees DROP COLUMN btc_fee;

-- Add business_account_required to profiles
ALTER TABLE public.profiles 
ADD COLUMN business_account_required BOOLEAN NOT NULL DEFAULT false;

-- Add transfer_fee to profiles for bank transfers
ALTER TABLE public.profiles 
ADD COLUMN bank_transfer_fee NUMERIC NOT NULL DEFAULT 25.00;
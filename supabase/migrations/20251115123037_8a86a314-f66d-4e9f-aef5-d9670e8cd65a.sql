-- Create crypto_transactions table
CREATE TABLE public.crypto_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL, -- 'send', 'receive', 'convert_to_bank', 'convert_to_crypto'
  coin_symbol TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  usd_value NUMERIC NOT NULL,
  recipient_address TEXT,
  status TEXT NOT NULL DEFAULT 'completed', -- 'completed', 'pending', 'failed'
  reference_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crypto_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own crypto transactions"
ON public.crypto_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own crypto transactions"
ON public.crypto_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_crypto_transactions_user_id ON public.crypto_transactions(user_id);
CREATE INDEX idx_crypto_transactions_created_at ON public.crypto_transactions(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_crypto_transactions_updated_at
BEFORE UPDATE ON public.crypto_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
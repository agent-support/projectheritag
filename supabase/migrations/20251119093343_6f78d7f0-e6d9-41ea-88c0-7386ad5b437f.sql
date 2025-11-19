-- Create crypto transfer fees table
CREATE TABLE IF NOT EXISTS public.crypto_transfer_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  btc_fee NUMERIC NOT NULL DEFAULT 0.0001,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crypto_transfer_fees ENABLE ROW LEVEL SECURITY;

-- Users can view their own fees
CREATE POLICY "Users can view own crypto fees"
ON public.crypto_transfer_fees
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all fees
CREATE POLICY "Admins can view all crypto fees"
ON public.crypto_transfer_fees
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can insert fees
CREATE POLICY "Admins can insert crypto fees"
ON public.crypto_transfer_fees
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins can update fees
CREATE POLICY "Admins can update crypto fees"
ON public.crypto_transfer_fees
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete fees
CREATE POLICY "Admins can delete crypto fees"
ON public.crypto_transfer_fees
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_crypto_transfer_fees_updated_at
BEFORE UPDATE ON public.crypto_transfer_fees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create table for storing OTP codes
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own OTP
CREATE POLICY "Users can view own OTP"
  ON public.otp_codes
  FOR SELECT
  USING (email = auth.email());

-- Policy: Anyone can insert OTP (for registration)
CREATE POLICY "Anyone can insert OTP"
  ON public.otp_codes
  FOR INSERT
  WITH CHECK (TRUE);

-- Policy: Users can update their own OTP
CREATE POLICY "Users can update own OTP"
  ON public.otp_codes
  FOR UPDATE
  USING (email = auth.email());

-- Index for faster lookups
CREATE INDEX idx_otp_email ON public.otp_codes(email);
CREATE INDEX idx_otp_expires_at ON public.otp_codes(expires_at);

-- Function to clean up expired OTPs (optional, for maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.otp_codes
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$;
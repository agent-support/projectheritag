-- Add admin logs table for tracking all admin actions
CREATE TABLE public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on admin_logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Admin logs policies
CREATE POLICY "Admins can view all logs"
  ON public.admin_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert logs"
  ON public.admin_logs
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add index for performance
CREATE INDEX idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX idx_admin_logs_created_at ON public.admin_logs(created_at DESC);

-- Update transfers table to add admin approval fields
ALTER TABLE public.transfers 
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Admins can delete transfers (for management)
CREATE POLICY "Admins can delete transfers"
  ON public.transfers
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Admins can insert accounts for users
CREATE POLICY "Admins can insert accounts"
  ON public.accounts
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins can delete accounts
CREATE POLICY "Admins can delete accounts"
  ON public.accounts
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Admins can update profiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Admins can delete crypto wallets
CREATE POLICY "Admins can delete crypto wallets"
  ON public.crypto_wallets
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Admins can insert crypto wallets
CREATE POLICY "Admins can insert crypto wallets"
  ON public.crypto_wallets
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create a function for admins to activate users
CREATE OR REPLACE FUNCTION public.admin_update_user_status(
  _user_id uuid,
  _status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can call this
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can update user status';
  END IF;
  
  UPDATE public.profiles
  SET status = _status
  WHERE id = _user_id;
END;
$$;
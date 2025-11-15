-- Add status column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive'));

-- Update existing users to active status
UPDATE public.profiles SET status = 'active';

-- Create function to activate user account
CREATE OR REPLACE FUNCTION public.activate_user_account(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET status = 'active'
  WHERE id = _user_id;
END;
$$;

-- Grant execute permission to authenticated users (admins will use RLS)
GRANT EXECUTE ON FUNCTION public.activate_user_account TO authenticated;
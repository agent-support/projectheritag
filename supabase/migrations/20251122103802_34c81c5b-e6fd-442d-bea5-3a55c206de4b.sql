-- Fix RLS policies for profile creation during signup
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create a more permissive policy that allows profile creation
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Also ensure the trigger function can bypass RLS
-- Update the handle_new_user trigger function to run with security definer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    full_name, 
    email,
    date_of_birth,
    country,
    address,
    username,
    phone,
    profile_picture_url
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'date_of_birth', NULL)::date,
    COALESCE(NEW.raw_user_meta_data->>'country', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'profile_picture_url', '')
  );
  RETURN NEW;
END;
$function$;

-- Ensure account number generation returns pure 10-digit numbers
CREATE OR REPLACE FUNCTION public.generate_account_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_account_number text;
  number_exists boolean;
BEGIN
  LOOP
    -- Generate a random 10-digit number (1000000000 to 9999999999)
    new_account_number := LPAD(FLOOR(RANDOM() * 9000000000 + 1000000000)::text, 10, '0');
    
    -- Check if this account number already exists
    SELECT EXISTS(
      SELECT 1 FROM public.accounts WHERE account_number = new_account_number
    ) INTO number_exists;
    
    -- If it doesn't exist, we can use it
    EXIT WHEN NOT number_exists;
  END LOOP;
  
  RETURN new_account_number;
END;
$function$;
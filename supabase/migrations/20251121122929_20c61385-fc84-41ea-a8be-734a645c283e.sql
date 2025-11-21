-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.generate_account_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_account_number text;
  number_exists boolean;
BEGIN
  LOOP
    -- Generate a random 10-digit number
    new_account_number := LPAD(FLOOR(RANDOM() * 10000000000)::text, 10, '0');
    
    -- Check if this account number already exists
    SELECT EXISTS(
      SELECT 1 FROM public.accounts WHERE account_number = new_account_number
    ) INTO number_exists;
    
    -- If it doesn't exist, we can use it
    EXIT WHEN NOT number_exists;
  END LOOP;
  
  RETURN new_account_number;
END;
$$;
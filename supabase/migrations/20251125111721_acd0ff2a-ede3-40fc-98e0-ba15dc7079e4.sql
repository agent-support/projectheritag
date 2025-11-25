-- Update the handle_new_user function to also create an account with a random account number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert directly into profiles, bypassing RLS because of SECURITY DEFINER
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
    profile_picture_url,
    status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'date_of_birth')::date, NULL),
    COALESCE(NEW.raw_user_meta_data->>'country', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'profile_picture_url', ''),
    'active'
  );

  -- Create a default account for the new user
  INSERT INTO public.accounts (
    user_id,
    account_type,
    account_number,
    balance,
    currency,
    status
  )
  VALUES (
    NEW.id,
    'savings',
    generate_account_number(),
    0.00,
    'USD',
    'active'
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block signup
    RAISE WARNING 'Failed to create profile or account for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;
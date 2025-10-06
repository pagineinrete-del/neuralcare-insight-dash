-- Update the handle_new_user function to create user role and patient record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role text;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, name, email, birth_year, sex)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    (NEW.raw_user_meta_data->>'birth_year')::integer,
    NEW.raw_user_meta_data->>'sex'
  );
  
  -- Get the role from metadata (default to patient if not specified)
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role::app_role);
  
  -- If role is patient, create patient record
  IF user_role = 'patient' THEN
    INSERT INTO public.patients (
      user_id, 
      birth_year, 
      sex,
      risk_level
    )
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data->>'birth_year')::integer,
      NEW.raw_user_meta_data->>'sex',
      'low'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;
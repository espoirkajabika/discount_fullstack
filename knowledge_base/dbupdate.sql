-- Check if the trigger function exists
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'create_profile_for_user';

-- Check if the trigger exists
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';


-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_profile_for_user();

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, created_at, updated_at)
    VALUES (
        NEW.id, 
        NEW.email,
        NOW(),
        NOW()
    );
    RETURN NEW;
EXCEPTION 
    WHEN others THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();


-- Check current RLS policies on profiles
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Grant necessary permissions for the trigger
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.profiles TO authenticated, anon;
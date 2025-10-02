-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('patient', 'clinician', 'admin');

-- Create user_roles table (secure role management)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  birth_year integer,
  sex text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Clinicians and admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    public.has_role(auth.uid(), 'clinician') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create patients table
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  clinician_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  birth_year integer NOT NULL,
  sex text NOT NULL,
  conditions text[] DEFAULT '{}',
  risk_level text DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view their own data"
  ON public.patients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Clinicians can view their patients"
  ON public.patients FOR SELECT
  USING (
    public.has_role(auth.uid(), 'clinician') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Clinicians can update their patients"
  ON public.patients FOR UPDATE
  USING (
    auth.uid() = clinician_id OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Clinicians can insert patients"
  ON public.patients FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'clinician') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Create measurements table
CREATE TABLE public.measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  cognitive_score numeric(5,2) NOT NULL,
  sleep_hours numeric(4,2) NOT NULL,
  reaction_ms integer NOT NULL,
  tremor_level numeric(3,2) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own measurements"
  ON public.measurements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p 
      WHERE p.id = patient_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Clinicians can view patient measurements"
  ON public.measurements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p 
      WHERE p.id = patient_id AND (
        p.clinician_id = auth.uid() OR 
        public.has_role(auth.uid(), 'admin')
      )
    )
  );

CREATE POLICY "Clinicians can insert measurements"
  ON public.measurements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients p 
      WHERE p.id = patient_id AND (
        p.clinician_id = auth.uid() OR 
        public.has_role(auth.uid(), 'admin')
      )
    )
  );

-- Create insights table
CREATE TABLE public.insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  date date DEFAULT CURRENT_DATE NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own insights"
  ON public.insights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p 
      WHERE p.id = patient_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Clinicians can view patient insights"
  ON public.insights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p 
      WHERE p.id = patient_id AND (
        p.clinician_id = auth.uid() OR 
        public.has_role(auth.uid(), 'admin')
      )
    )
  );

CREATE POLICY "System can insert insights"
  ON public.insights FOR INSERT
  WITH CHECK (true);

-- Create test_results table
CREATE TABLE public.test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  test_type text NOT NULL,
  date date DEFAULT CURRENT_DATE NOT NULL,
  score numeric(5,2) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own test results"
  ON public.test_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p 
      WHERE p.id = patient_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Clinicians can view patient test results"
  ON public.test_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p 
      WHERE p.id = patient_id AND (
        p.clinician_id = auth.uid() OR 
        public.has_role(auth.uid(), 'admin')
      )
    )
  );

CREATE POLICY "Clinicians can insert test results"
  ON public.test_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients p 
      WHERE p.id = patient_id AND (
        p.clinician_id = auth.uid() OR 
        public.has_role(auth.uid(), 'admin')
      )
    )
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_patients_user_id ON public.patients(user_id);
CREATE INDEX idx_patients_clinician_id ON public.patients(clinician_id);
CREATE INDEX idx_measurements_patient_id ON public.measurements(patient_id);
CREATE INDEX idx_measurements_date ON public.measurements(date);
CREATE INDEX idx_insights_patient_id ON public.insights(patient_id);
CREATE INDEX idx_test_results_patient_id ON public.test_results(patient_id);
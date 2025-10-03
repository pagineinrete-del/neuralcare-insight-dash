-- Create table for exercises that clinicians can assign to patients
CREATE TABLE public.assigned_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinician_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('memory', 'attention', 'reasoning', 'language')),
  instructions TEXT NOT NULL,
  duration_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
  assigned_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_date TIMESTAMP WITH TIME ZONE,
  score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assigned_exercises ENABLE ROW LEVEL SECURITY;

-- Clinicians can view exercises they assigned
CREATE POLICY "Clinicians can view their assigned exercises"
ON public.assigned_exercises
FOR SELECT
USING (
  clinician_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
);

-- Clinicians can insert exercises for their patients
CREATE POLICY "Clinicians can assign exercises"
ON public.assigned_exercises
FOR INSERT
WITH CHECK (
  clinician_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = assigned_exercises.patient_id
    AND (p.clinician_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Clinicians can update exercises they assigned
CREATE POLICY "Clinicians can update their exercises"
ON public.assigned_exercises
FOR UPDATE
USING (clinician_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Patients can view their assigned exercises
CREATE POLICY "Patients can view assigned exercises"
ON public.assigned_exercises
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = assigned_exercises.patient_id
    AND p.user_id = auth.uid()
  )
);

-- Patients can update their exercise status and score
CREATE POLICY "Patients can update exercise completion"
ON public.assigned_exercises
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = assigned_exercises.patient_id
    AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM patients p
    WHERE p.id = assigned_exercises.patient_id
    AND p.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_assigned_exercises_updated_at
BEFORE UPDATE ON public.assigned_exercises
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Clinicians can assign exercises" ON public.assigned_exercises;

-- Create a simpler policy that allows clinicians to assign exercises to any patient
CREATE POLICY "Clinicians can assign exercises" 
ON public.assigned_exercises 
FOR INSERT 
WITH CHECK (
  (clinician_id = auth.uid()) AND 
  (has_role(auth.uid(), 'clinician'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);
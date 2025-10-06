import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface Patient {
  id: string;
  profiles?: {
    name: string;
  };
}

interface Exercise {
  id: string;
  title: string;
  description: string;
  exercise_type: string;
  status: string;
  assigned_date: string;
  patient_id: string;
  patients: {
    profiles?: {
      name: string;
    };
  };
}

export default function Exercises() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: "",
    title: "",
    description: "",
    exercise_type: "memory",
    instructions: "",
    duration_minutes: ""
  });

  useEffect(() => {
    if (user) {
      fetchExercises();
      fetchPatients();
    }
  }, [user]);

  const fetchExercises = async () => {
    try {
      const { data: exercisesData, error } = await supabase
        .from("assigned_exercises")
        .select("*")
        .eq("clinician_id", user!.id)
        .order("assigned_date", { ascending: false });

      if (error) throw error;

      if (exercisesData) {
        const patientIds = [...new Set(exercisesData.map(e => e.patient_id))];
        
        const { data: patientsData } = await supabase
          .from("patients")
          .select("id, user_id")
          .in("id", patientIds);

        const userIds = patientsData?.map(p => p.user_id).filter(Boolean) || [];
        
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", userIds);

        const enrichedExercises = exercisesData.map(exercise => {
          const patient = patientsData?.find(p => p.id === exercise.patient_id);
          const profile = profilesData?.find(pr => pr.id === patient?.user_id);
          return {
            ...exercise,
            patients: {
              profiles: profile ? { name: profile.name } : undefined
            }
          };
        });

        setExercises(enrichedExercises as any);
      }
    } catch (error) {
      console.error("Error fetching exercises:", error);
      toast.error("Errore nel caricamento degli esercizi");
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data: patientsData, error } = await supabase
        .from("patients")
        .select("id, user_id");

      if (error) throw error;

      if (patientsData) {
        const userIds = patientsData.map(p => p.user_id).filter(Boolean);
        
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", userIds);

        const enrichedPatients = patientsData.map(patient => {
          const profile = profilesData?.find(p => p.id === patient.user_id);
          return {
            id: patient.id,
            profiles: profile ? { name: profile.name } : undefined
          };
        });

        setPatients(enrichedPatients as any);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from("assigned_exercises")
        .insert({
          ...formData,
          clinician_id: user!.id,
          duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null
        });

      if (error) throw error;

      toast.success("Esercizio assegnato con successo!");
      setOpen(false);
      setFormData({
        patient_id: "",
        title: "",
        description: "",
        exercise_type: "memory",
        instructions: "",
        duration_minutes: ""
      });
      fetchExercises();
    } catch (error) {
      console.error("Error assigning exercise:", error);
      toast.error("Errore nell'assegnazione dell'esercizio");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      completed: "default",
      skipped: "destructive"
    };
    const labels: Record<string, string> = {
      pending: "In Attesa",
      completed: "Completato",
      skipped: "Saltato"
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getExerciseTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      memory: "Memoria",
      attention: "Attenzione",
      reasoning: "Ragionamento",
      language: "Linguaggio"
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Esercizi Cognitivi</h1>
            <p className="text-muted-foreground">Assegna esercizi ai tuoi pazienti</p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuovo Esercizio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Assegna Nuovo Esercizio</DialogTitle>
                <DialogDescription>
                  Crea un esercizio cognitivo personalizzato per un paziente
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patient">Paziente</Label>
                  <Select
                    value={formData.patient_id}
                    onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona paziente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.profiles?.name || "Senza nome"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Titolo</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Es: Test di memoria visiva"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exercise_type">Tipo di Esercizio</Label>
                  <Select
                    value={formData.exercise_type}
                    onValueChange={(value) => setFormData({ ...formData, exercise_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="memory">Memoria</SelectItem>
                      <SelectItem value="attention">Attenzione</SelectItem>
                      <SelectItem value="reasoning">Ragionamento</SelectItem>
                      <SelectItem value="language">Linguaggio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrizione</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Breve descrizione dell'esercizio"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions">Istruzioni</Label>
                  <Textarea
                    id="instructions"
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    placeholder="Istruzioni dettagliate per il paziente"
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Durata (minuti - opzionale)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    placeholder="15"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Annulla
                  </Button>
                  <Button type="submit">Assegna Esercizio</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Esercizi Assegnati</CardTitle>
            <CardDescription>
              Lista di tutti gli esercizi che hai assegnato ai pazienti
            </CardDescription>
          </CardHeader>
          <CardContent>
            {exercises.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nessun esercizio assegnato ancora
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paziente</TableHead>
                    <TableHead>Titolo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data Assegnazione</TableHead>
                    <TableHead>Stato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exercises.map((exercise) => (
                    <TableRow key={exercise.id}>
                      <TableCell className="font-medium">
                        {exercise.patients?.profiles?.name || "N/A"}
                      </TableCell>
                      <TableCell>{exercise.title}</TableCell>
                      <TableCell>{getExerciseTypeLabel(exercise.exercise_type)}</TableCell>
                      <TableCell>
                        {new Date(exercise.assigned_date).toLocaleDateString("it-IT")}
                      </TableCell>
                      <TableCell>{getStatusBadge(exercise.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

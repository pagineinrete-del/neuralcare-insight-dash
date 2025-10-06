import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Brain } from "lucide-react";
import { CognitiveTest } from "@/components/CognitiveTest";

interface TestResult {
  id: string;
  test_type: string;
  score: number;
  date: string;
}

interface AssignedExercise {
  id: string;
  title: string;
  description: string;
  exercise_type: string;
  instructions: string;
  duration_minutes: number | null;
  status: string;
  assigned_date: string;
  score: number | null;
}

export default function Tests() {
  const { user, userRole } = useAuth();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [exercises, setExercises] = useState<AssignedExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<AssignedExercise | null>(null);
  const [exerciseScore, setExerciseScore] = useState("");
  const [showCognitiveTest, setShowCognitiveTest] = useState(false);

  useEffect(() => {
    if (user && userRole) {
      fetchTests();
      if (userRole.role === "patient") {
        fetchExercises();
      }
    }
  }, [user, userRole]);

  const fetchTests = async () => {
    try {
      let patientId: string | null = null;

      if (userRole?.role === "patient") {
        const { data: patientData } = await supabase
          .from("patients")
          .select("id")
          .eq("user_id", user!.id)
          .maybeSingle();
        
        patientId = patientData?.id || null;
      }

      if (patientId) {
        const { data, error } = await supabase
          .from("test_results")
          .select("*")
          .eq("patient_id", patientId)
          .order("date", { ascending: false });
        
        if (!error && data) {
          setTests(data);
        }
      }
    } catch (error) {
      console.error("Error fetching tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExercises = async () => {
    try {
      const { data: patientData } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (patientData) {
        const { data, error } = await supabase
          .from("assigned_exercises")
          .select("*")
          .eq("patient_id", patientData.id)
          .order("assigned_date", { ascending: false });

        if (!error && data) {
          setExercises(data);
        }
      }
    } catch (error) {
      console.error("Error fetching exercises:", error);
    }
  };

  const handleCompleteExercise = async () => {
    if (!selectedExercise) return;

    try {
      const { error } = await supabase
        .from("assigned_exercises")
        .update({
          status: "completed",
          completed_date: new Date().toISOString(),
          score: exerciseScore ? parseFloat(exerciseScore) : null
        })
        .eq("id", selectedExercise.id);

      if (error) throw error;

      toast.success("Esercizio completato!");
      setSelectedExercise(null);
      setExerciseScore("");
      fetchExercises();
    } catch (error) {
      console.error("Error completing exercise:", error);
      toast.error("Errore nel completamento dell'esercizio");
    }
  };

  const handleSkipExercise = async (exerciseId: string) => {
    try {
      const { error } = await supabase
        .from("assigned_exercises")
        .update({ status: "skipped" })
        .eq("id", exerciseId);

      if (error) throw error;

      toast.info("Esercizio saltato");
      fetchExercises();
    } catch (error) {
      console.error("Error skipping exercise:", error);
      toast.error("Errore");
    }
  };

  const getTestTypeName = (testType: string): string => {
    const testTypeNames: Record<string, string> = {
      tremor: "Test Tremore",
      reaction: "Test Reazione",
      memory: "Test Memoria",
      cognitive: "Test Cognitivo"
    };
    return testTypeNames[testType] || testType;
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "skipped":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const handleTestComplete = async (score: number) => {
    try {
      const { data: patientData } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (!patientData) {
        toast.error("Errore: paziente non trovato");
        return;
      }

      const { error } = await supabase
        .from("test_results")
        .insert({
          patient_id: patientData.id,
          test_type: "memory",
          score: score,
          date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      toast.success("Risultato salvato con successo!");
      setShowCognitiveTest(false);
      fetchTests();
    } catch (error) {
      console.error("Error saving test result:", error);
      toast.error("Errore nel salvataggio del risultato");
    }
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

  if (showCognitiveTest) {
    return (
      <AppLayout>
        <div className="py-8">
          <CognitiveTest 
            onComplete={handleTestComplete}
            onCancel={() => setShowCognitiveTest(false)}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Test Cognitivi</h1>
            <p className="text-muted-foreground">I tuoi test ed esercizi cognitivi</p>
          </div>
          {userRole?.role === "patient" && (
            <Button onClick={() => setShowCognitiveTest(true)} className="gap-2">
              <Brain className="h-5 w-5" />
              Nuovo Test di Memoria
            </Button>
          )}
        </div>

        {userRole?.role === "patient" && exercises.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Esercizi Assegnati</CardTitle>
              <CardDescription>Esercizi da completare assegnati dal tuo medico</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {exercises.map((exercise) => (
                <Card key={exercise.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(exercise.status)}
                          <h3 className="font-semibold text-lg">{exercise.title}</h3>
                          <Badge variant="outline">{getExerciseTypeLabel(exercise.exercise_type)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{exercise.description}</p>
                        <div className="bg-muted p-4 rounded-lg mb-3">
                          <p className="text-sm font-medium mb-2">Istruzioni:</p>
                          <p className="text-sm whitespace-pre-wrap">{exercise.instructions}</p>
                          {exercise.duration_minutes && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Durata stimata: {exercise.duration_minutes} minuti
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Assegnato il: {new Date(exercise.assigned_date).toLocaleDateString("it-IT")}
                        </p>
                      </div>
                    </div>
                    {exercise.status === "pending" && (
                      <div className="flex gap-2 mt-4">
                        <Button onClick={() => setSelectedExercise(exercise)}>
                          Completa Esercizio
                        </Button>
                        <Button variant="outline" onClick={() => handleSkipExercise(exercise.id)}>
                          Salta
                        </Button>
                      </div>
                    )}
                    {exercise.status === "completed" && exercise.score && (
                      <Badge className="mt-4" variant="default">
                        Punteggio: {exercise.score}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Storico Test</CardTitle>
            <CardDescription>Risultati delle valutazioni cognitive</CardDescription>
          </CardHeader>
          <CardContent>
            {tests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nessun risultato disponibile
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo Test</TableHead>
                    <TableHead>Punteggio</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell className="font-medium">{getTestTypeName(test.test_type)}</TableCell>
                      <TableCell>
                        <Badge variant={test.score >= 70 ? "default" : test.score >= 50 ? "secondary" : "destructive"}>
                          {test.score}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(test.date).toLocaleDateString("it-IT")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedExercise} onOpenChange={(open) => !open && setSelectedExercise(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Completa Esercizio</DialogTitle>
            <DialogDescription>
              Inserisci il tuo punteggio per completare l'esercizio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="score">Punteggio (opzionale)</Label>
              <Input
                id="score"
                type="number"
                min="0"
                max="100"
                value={exerciseScore}
                onChange={(e) => setExerciseScore(e.target.value)}
                placeholder="Es: 85"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedExercise(null)}>
                Annulla
              </Button>
              <Button onClick={handleCompleteExercise}>
                Conferma Completamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

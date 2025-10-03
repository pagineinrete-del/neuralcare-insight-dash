import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TestResult {
  id: string;
  test_type: string;
  date: string;
  score: number;
}

export default function Tests() {
  const { user, userRole } = useAuth();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && userRole) {
      fetchTests();
    }
  }, [user, userRole]);

  const fetchTests = async () => {
    try {
      console.log("Fetching tests for user:", user?.id, "role:", userRole?.role);
      let patientId: string | null = null;

      if (userRole?.role === "patient") {
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .select("id")
          .eq("user_id", user!.id)
          .maybeSingle();
        
        console.log("Patient data:", patientData, "error:", patientError);
        patientId = patientData?.id || null;
      }

      if (patientId) {
        const { data, error } = await supabase
          .from("test_results")
          .select("*")
          .eq("patient_id", patientId)
          .order("date", { ascending: false });

        console.log("Test results:", data, "error:", error);
        
        if (error) {
          console.error("Error fetching test results:", error);
        } else if (data) {
          setTests(data);
        }
      } else {
        console.log("No patient ID found for user");
      }
    } catch (error) {
      console.error("Error fetching tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "destructive";
  };

  const getTrend = (index: number) => {
    if (index === tests.length - 1) return null;
    const current = tests[index].score;
    const previous = tests[index + 1].score;
    if (current > previous) return "up";
    if (current < previous) return "down";
    return "stable";
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cognitive Tests</h1>
          <p className="text-muted-foreground">Track your cognitive assessment history</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test History</CardTitle>
            <CardDescription>
              View all completed cognitive assessments and their results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : tests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((test, index) => {
                    const trend = getTrend(index);
                    return (
                      <TableRow key={test.id}>
                        <TableCell className="font-medium">{test.test_type}</TableCell>
                        <TableCell>{new Date(test.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={getScoreColor(test.score)}>
                            {test.score}/100
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {trend === "up" && <TrendingUp className="h-4 w-4 text-success" />}
                          {trend === "down" && <TrendingDown className="h-4 w-4 text-destructive" />}
                          {trend === "stable" && <Minus className="h-4 w-4 text-muted-foreground" />}
                          {!trend && <span className="text-muted-foreground text-sm">-</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No test results available yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
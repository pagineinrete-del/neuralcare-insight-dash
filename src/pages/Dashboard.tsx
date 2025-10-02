import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { KPICard } from "@/components/KPICard";
import { Brain, Moon, Timer, Activity, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DashboardStats {
  cognitiveScore: number;
  sleepQuality: number;
  reactionTime: number;
  tremorIndex: number;
}

interface Insight {
  id: string;
  severity: "low" | "medium" | "high";
  title: string;
  body: string;
  date: string;
}

export default function Dashboard() {
  const { user, userRole } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [timeRange, setTimeRange] = useState("7");

  useEffect(() => {
    if (user && userRole) {
      fetchDashboardData();
    }
  }, [user, userRole, timeRange]);

  const fetchDashboardData = async () => {
    try {
      let patientId: string | null = null;

      if (userRole?.role === "patient") {
        const { data: patientData } = await supabase
          .from("patients")
          .select("id")
          .eq("user_id", user!.id)
          .single();
        
        patientId = patientData?.id || null;
      }

      if (patientId) {
        const daysAgo = parseInt(timeRange);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);

        const { data: measurements } = await supabase
          .from("measurements")
          .select("*")
          .eq("patient_id", patientId)
          .gte("date", startDate.toISOString().split('T')[0])
          .order("date", { ascending: false });

        if (measurements && measurements.length > 0) {
          const avgScore = measurements.reduce((sum, m) => sum + Number(m.cognitive_score), 0) / measurements.length;
          const avgSleep = measurements.reduce((sum, m) => sum + Number(m.sleep_hours), 0) / measurements.length;
          const avgReaction = measurements.reduce((sum, m) => sum + m.reaction_ms, 0) / measurements.length;
          const avgTremor = measurements.reduce((sum, m) => sum + Number(m.tremor_level), 0) / measurements.length;

          setStats({
            cognitiveScore: Math.round(avgScore),
            sleepQuality: Math.round(avgSleep * 10) / 10,
            reactionTime: Math.round(avgReaction),
            tremorIndex: Math.round(avgTremor * 100) / 100,
          });
        }

        const { data: insightsData } = await supabase
          .from("insights")
          .select("*")
          .eq("patient_id", patientId)
          .order("date", { ascending: false })
          .limit(5);

        if (insightsData) {
          setInsights(insightsData as Insight[]);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertCircle className="h-4 w-4" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      default:
        return "success";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back to your cognitive health overview</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Cognitive Health Score"
              value={stats.cognitiveScore}
              icon={Brain}
              variant={stats.cognitiveScore >= 80 ? "success" : stats.cognitiveScore >= 60 ? "warning" : "destructive"}
            />
            <KPICard
              title="Sleep Quality"
              value={`${stats.sleepQuality}h`}
              icon={Moon}
              variant={stats.sleepQuality >= 7 ? "success" : "warning"}
            />
            <KPICard
              title="Reaction Time"
              value={`${stats.reactionTime}ms`}
              icon={Timer}
              variant={stats.reactionTime <= 300 ? "success" : stats.reactionTime <= 400 ? "warning" : "destructive"}
            />
            <KPICard
              title="Tremor Index"
              value={stats.tremorIndex}
              icon={Activity}
              variant={stats.tremorIndex <= 0.3 ? "success" : stats.tremorIndex <= 0.6 ? "warning" : "destructive"}
            />
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>AI Health Insights</CardTitle>
            <CardDescription>
              Recent analysis of your cognitive health data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.length > 0 ? (
              insights.map((insight) => (
                <div
                  key={insight.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Badge variant={getSeverityColor(insight.severity)} className="mt-1">
                    {getSeverityIcon(insight.severity)}
                  </Badge>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground">{insight.body}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(insight.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No insights available yet. Data will appear as you complete more tests.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
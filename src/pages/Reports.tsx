import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { toast } = useToast();

  const handleGenerateReport = () => {
    toast({
      title: "Report Generation",
      description: "PDF report generation feature will be available soon.",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate and download cognitive health reports</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>
              Create a comprehensive PDF report of your cognitive health data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-12 border-2 border-dashed rounded-lg">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Cognitive Health Report</h3>
                <p className="text-muted-foreground mb-4">
                  Generate a detailed 4-week summary report
                </p>
                <Button onClick={handleGenerateReport}>
                  Generate PDF Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
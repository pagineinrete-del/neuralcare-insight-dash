import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function AdminSettings() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground">Manage system settings and user permissions</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
            <CardDescription>
              Configure platform settings and feature flags
            </CardDescription>
          </CardHeader>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4" />
              <p>Admin settings panel will be available soon.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
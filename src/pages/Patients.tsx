import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Patient {
  id: string;
  birth_year: number;
  sex: string;
  risk_level: "low" | "medium" | "high";
  profiles?: {
    name: string;
  };
}

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchQuery, riskFilter]);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("id, birth_year, sex, risk_level, user_id")
        .order("created_at", { ascending: false });

      if (!error && data) {
        const patientsWithProfiles = await Promise.all(
          data.map(async (patient) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("name")
              .eq("id", patient.user_id)
              .single();
            return { ...patient, profiles: profile };
          })
        );
        setPatients(patientsWithProfiles as Patient[]);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = [...patients];

    if (searchQuery) {
      filtered = filtered.filter((patient) =>
        patient.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (riskFilter !== "all") {
      filtered = filtered.filter((patient) => patient.risk_level === riskFilter);
    }

    setFilteredPatients(filtered);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
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
        <div>
          <h1 className="text-3xl font-bold">Patients</h1>
          <p className="text-muted-foreground">Manage and monitor patient cognitive health</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Patient List</CardTitle>
            <CardDescription>
              Search and filter patients by risk level
            </CardDescription>
            <div className="flex gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risks</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filteredPatients.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Birth Year</TableHead>
                    <TableHead>Sex</TableHead>
                    <TableHead>Risk Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {patient.profiles?.name || "Unknown"}
                      </TableCell>
                      <TableCell>{patient.birth_year}</TableCell>
                      <TableCell className="capitalize">{patient.sex}</TableCell>
                      <TableCell>
                        <Badge variant={getRiskColor(patient.risk_level)}>
                          {patient.risk_level}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No patients found matching your criteria.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
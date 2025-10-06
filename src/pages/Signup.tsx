import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AuthLayout } from "@/components/AuthLayout";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  role: z.enum(["patient", "clinician"]),
  birthYear: z.number().min(1900).max(new Date().getFullYear()).optional(),
  sex: z.enum(["M", "F"]).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === "patient") {
    return data.birthYear && data.sex;
  }
  return true;
}, {
  message: "Birth year and sex are required for patients",
  path: ["birthYear"],
});

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"patient" | "clinician">("patient");
  const [birthYear, setBirthYear] = useState<number>();
  const [sex, setSex] = useState<"M" | "F">();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = signupSchema.safeParse({ 
      name, 
      email, 
      password, 
      confirmPassword, 
      role,
      birthYear,
      sex 
    });
    
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const metadata: any = {
        name,
        role,
      };
      
      // Add patient-specific metadata
      if (role === "patient" && birthYear && sex) {
        metadata.birth_year = birthYear;
        metadata.sex = sex;
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "Account Exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Signup Failed",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      if (data.user) {
        toast({
          title: "Account Created!",
          description: "Welcome to NeuralCare. Redirecting to dashboard...",
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Create Account" 
      subtitle="Start monitoring your cognitive health"
    >
      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome Completo</Label>
          <Input
            id="name"
            type="text"
            placeholder="Mario Rossi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="email@esempio.it"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Tipo di Account</Label>
          <RadioGroup value={role} onValueChange={(value) => setRole(value as "patient" | "clinician")}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="patient" id="patient" />
              <Label htmlFor="patient" className="font-normal cursor-pointer">Paziente</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="clinician" id="clinician" />
              <Label htmlFor="clinician" className="font-normal cursor-pointer">Dottore</Label>
            </div>
          </RadioGroup>
        </div>

        {role === "patient" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="birthYear">Anno di Nascita</Label>
              <Input
                id="birthYear"
                type="number"
                placeholder="1980"
                min="1900"
                max={new Date().getFullYear()}
                value={birthYear || ""}
                onChange={(e) => setBirthYear(parseInt(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sex">Sesso</Label>
              <Select value={sex} onValueChange={(value) => setSex(value as "M" | "F")}>
                <SelectTrigger id="sex">
                  <SelectValue placeholder="Seleziona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Maschio</SelectItem>
                  <SelectItem value="F">Femmina</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Conferma Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading}
        >
          {loading ? "Creazione account..." : "Crea Account"}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          Hai già un account?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Accedi
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
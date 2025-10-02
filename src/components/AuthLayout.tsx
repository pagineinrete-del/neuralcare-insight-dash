import { Brain } from "lucide-react";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary rounded-2xl">
              <Brain className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">NeuralCare</h1>
          <h2 className="text-xl font-semibold text-foreground mb-1">{title}</h2>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        
        <div className="bg-card border border-border rounded-xl shadow-lg p-8">
          {children}
        </div>
      </div>
    </div>
  );
};
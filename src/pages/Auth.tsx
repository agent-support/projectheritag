import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Navbar } from "@/components/Navbar";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const mode = searchParams.get("mode") || "login";
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate auth
    setTimeout(() => {
      toast({
        title: mode === "signup" ? "Account created!" : "Welcome back!",
        description: mode === "signup" 
          ? "Your Heritage Bank account has been created successfully."
          : "You have been logged in successfully.",
      });
      setIsLoading(false);
      navigate("/");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-primary">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-16">
        <Card className="max-w-md mx-auto p-8 bg-card border-border">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-foreground">
              {mode === "signup" ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "signup" 
                ? "Start your premium banking journey" 
                : "Sign in to your Heritage Bank account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" type="text" placeholder="John Doe" required />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" required />
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input id="confirm" type="password" placeholder="••••••••" required />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : mode === "signup" ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
              <a 
                href={mode === "signup" ? "/auth" : "/auth?mode=signup"}
                className="text-accent hover:underline"
              >
                {mode === "signup" ? "Sign In" : "Sign Up"}
              </a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;

import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { Shield } from "lucide-react";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <span className="text-2xl font-bold text-accent-foreground">H</span>
            </div>
            <span className="text-xl font-bold text-foreground">Heritage Bank</span>
          </NavLink>

          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/" className="text-foreground/80 hover:text-foreground transition-colors">
              Home
            </NavLink>
            <NavLink to="/about" className="text-foreground/80 hover:text-foreground transition-colors">
              About Us
            </NavLink>
            <NavLink to="/services" className="text-foreground/80 hover:text-foreground transition-colors">
              Services
            </NavLink>
            <NavLink to="/loans" className="text-foreground/80 hover:text-foreground transition-colors">
              Loans & Credit
            </NavLink>
            <NavLink to="/investments" className="text-foreground/80 hover:text-foreground transition-colors">
              Investments
            </NavLink>
            <NavLink to="/contact" className="text-foreground/80 hover:text-foreground transition-colors">
              Contact & Support
            </NavLink>
            <NavLink to="/dashboard" className="text-foreground/80 hover:text-foreground transition-colors">
              Dashboard
            </NavLink>
          </div>

          <Button asChild variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
            <NavLink to="/auth">Login</NavLink>
          </Button>
        </div>
      </div>
    </nav>
  );
};

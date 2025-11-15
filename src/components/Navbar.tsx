import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export const Navbar = () => {
  const [open, setOpen] = useState(false);

  const NavLinks = () => (
    <>
      <NavLink 
        to="/" 
        className="text-foreground/80 hover:text-foreground transition-colors block py-2"
        onClick={() => setOpen(false)}
      >
        Home
      </NavLink>
      <NavLink 
        to="/about" 
        className="text-foreground/80 hover:text-foreground transition-colors block py-2"
        onClick={() => setOpen(false)}
      >
        About Us
      </NavLink>
      <NavLink 
        to="/services" 
        className="text-foreground/80 hover:text-foreground transition-colors block py-2"
        onClick={() => setOpen(false)}
      >
        Services
      </NavLink>
      <NavLink 
        to="/loans" 
        className="text-foreground/80 hover:text-foreground transition-colors block py-2"
        onClick={() => setOpen(false)}
      >
        Loans & Credit
      </NavLink>
      <NavLink 
        to="/investments" 
        className="text-foreground/80 hover:text-foreground transition-colors block py-2"
        onClick={() => setOpen(false)}
      >
        Investments
      </NavLink>
      <NavLink 
        to="/contact" 
        className="text-foreground/80 hover:text-foreground transition-colors block py-2"
        onClick={() => setOpen(false)}
      >
        Contact & Support
      </NavLink>
      <NavLink 
        to="/dashboard" 
        className="text-foreground/80 hover:text-foreground transition-colors block py-2"
        onClick={() => setOpen(false)}
      >
        Dashboard
      </NavLink>
    </>
  );

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

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <NavLinks />
          </div>

          {/* Desktop Login Button */}
          <div className="hidden md:block">
            <Button asChild variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
              <NavLink to="/auth">Login</NavLink>
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 mt-8">
                <NavLinks />
                <Button asChild variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground mt-4">
                  <NavLink to="/auth" onClick={() => setOpen(false)}>Login</NavLink>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

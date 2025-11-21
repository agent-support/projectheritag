import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import About from "./pages/About";
import Services from "./pages/Services";
import Loans from "./pages/Loans";
import Investments from "./pages/Investments";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import Transfer from "./pages/Transfer";
import Profile from "./pages/Profile";
import Crypto from "./pages/Crypto";
import ATMCard from "./pages/ATMCard";
import MobileDeposit from "./pages/MobileDeposit";
import Admin from "./pages/Admin";
import TransactionHistory from "./pages/TransactionHistory";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/investments" element={<Investments />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/portfolio" element={<Portfolio />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/crypto" element={<Crypto />} />
          <Route path="/atm-card" element={<ATMCard />} />
          <Route path="/mobile-deposit" element={<MobileDeposit />} />
          <Route path="/admin/auth" element={<Admin />} />
          <Route path="/transactions" element={<TransactionHistory />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

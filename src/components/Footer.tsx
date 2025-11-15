import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-primary border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-foreground">Heritage Bank</h3>
            <p className="text-muted-foreground">Banking Excellence Since 1885</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Services</h4>
            <ul className="space-y-2">
              <li><Link to="/services" className="text-muted-foreground hover:text-accent transition-colors">Personal Banking</Link></li>
              <li><Link to="/services" className="text-muted-foreground hover:text-accent transition-colors">Business Banking</Link></li>
              <li><Link to="/loans" className="text-muted-foreground hover:text-accent transition-colors">Loans & Credit</Link></li>
              <li><Link to="/investments" className="text-muted-foreground hover:text-accent transition-colors">Investments</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-muted-foreground hover:text-accent transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-accent transition-colors">Contact</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-accent transition-colors">Support</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-muted-foreground hover:text-accent transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-accent transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-accent transition-colors">FDIC Insurance</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-8 text-center">
          <p className="text-muted-foreground">© 2024 Heritage Bank. All rights reserved. Member FDIC. Equal Housing Lender.</p>
        </div>
      </div>
    </footer>
  );
};

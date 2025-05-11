
import { NavLink } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-sentio-gray/20">
      <div className="sentio-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sentio-purple to-sentio-dark-purple"></div>
              <span className="font-bold text-xl">Sentio</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Elevating wellness through emotional intelligence and AI-powered insights.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <NavLink to="/features" className="text-sm text-muted-foreground hover:text-sentio-purple">
                  Features
                </NavLink>
              </li>
              <li>
                <NavLink to="/dashboard" className="text-sm text-muted-foreground hover:text-sentio-purple">
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/" className="text-sm text-muted-foreground hover:text-sentio-purple">
                  Integrations
                </NavLink>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <NavLink to="/" className="text-sm text-muted-foreground hover:text-sentio-purple">
                  Documentation
                </NavLink>
              </li>
              <li>
                <NavLink to="/" className="text-sm text-muted-foreground hover:text-sentio-purple">
                  API Reference
                </NavLink>
              </li>
              <li>
                <NavLink to="/" className="text-sm text-muted-foreground hover:text-sentio-purple">
                  Privacy Policy
                </NavLink>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <NavLink to="/" className="text-sm text-muted-foreground hover:text-sentio-purple">
                  About Us
                </NavLink>
              </li>
              <li>
                <NavLink to="/" className="text-sm text-muted-foreground hover:text-sentio-purple">
                  Careers
                </NavLink>
              </li>
              <li>
                <NavLink to="/" className="text-sm text-muted-foreground hover:text-sentio-purple">
                  Contact
                </NavLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center border-t border-sentio-gray/20 mt-10 pt-8">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Sentio. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-muted-foreground hover:text-sentio-purple">
              Twitter
            </a>
            <a href="#" className="text-muted-foreground hover:text-sentio-purple">
              LinkedIn
            </a>
            <a href="#" className="text-muted-foreground hover:text-sentio-purple">
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

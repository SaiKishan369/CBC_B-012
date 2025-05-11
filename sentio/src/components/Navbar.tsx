import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/features' },
    { name: 'Therapists', path: 'http://localhost:3001/', isExternal: true },
    { name: 'Medicine', path: 'http://172.16.6.176:3000', isExternal: true },
    { name: 'Dashboard', path: '/dashboard' },
  ];

  const handleNavClick = (link: { path: string; isExternal?: boolean }) => {
    if (link.isExternal) {
      window.location.href = link.path;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="sentio-container">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sentio-purple to-sentio-dark-purple"></div>
            <span className="font-bold text-xl">Sentio</span>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              link.isExternal ? (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link)}
                  className="text-sm font-medium transition-colors hover:text-sentio-purple text-foreground"
                >
                  {link.name}
                </button>
              ) : (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors hover:text-sentio-purple ${
                      isActive ? 'text-sentio-purple' : 'text-foreground'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              )
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <NavLink to="/auth?mode=login">
              <Button variant="ghost" className="hover:text-sentio-purple">
                Log in
              </Button>
            </NavLink>
            <NavLink to="/auth?mode=signup">
              <Button className="bg-sentio-purple hover:bg-sentio-dark-purple text-white">
                Sign up
              </Button>
            </NavLink>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 animate-fade-in">
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                link.isExternal ? (
                  <button
                    key={link.name}
                    onClick={() => {
                      handleNavClick(link);
                      setIsMenuOpen(false);
                    }}
                    className="px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-sentio-gray text-left"
                  >
                    {link.name}
                  </button>
                ) : (
                  <NavLink
                    key={link.name}
                    to={link.path}
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-sentio-light-purple text-sentio-dark-purple'
                          : 'hover:bg-sentio-gray'
                      }`
                    }
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </NavLink>
                )
              ))}
              <div className="flex flex-col space-y-2 pt-2 border-t border-sentio-gray">
                <NavLink
                  to="/auth?mode=login"
                  className="px-4 py-2 text-sm font-medium hover:bg-sentio-gray rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Log in
                </NavLink>
                <NavLink
                  to="/auth?mode=signup"
                  className="px-4 py-2 bg-sentio-purple hover:bg-sentio-dark-purple text-white rounded-md text-center text-sm font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign up
                </NavLink>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;

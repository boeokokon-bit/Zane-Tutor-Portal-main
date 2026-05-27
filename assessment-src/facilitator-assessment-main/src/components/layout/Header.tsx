import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ExternalLink, User, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import zaneLogo from '@/assets/zane-logo.png';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const isHome = location.pathname === '/';
  const isAdmin = user?.roles?.some(r => ['administrator', 'editor', 'admin'].includes(r));

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 mr-4">
              <img src={zaneLogo} alt="ZaneTutors" className="h-10 w-auto" />
            </Link>
            
            {!isHome && (
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a href="https://zanetutors.com.ng" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Zane Home</span>
              </Button>
            </a>
            
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Shield className="w-4 h-4" />
                      <span className="hidden sm:inline">Admin</span>
                    </Button>
                  </Link>
                )}
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Button>
                </Link>
                <span className="hidden md:inline text-sm text-muted-foreground">{user?.first_name}</span>
                <Button variant="outline" size="sm" className="gap-2" onClick={logout}>
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Log Out</span>
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

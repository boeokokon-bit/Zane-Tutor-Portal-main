import { Link, useLocation, NavLink as RouterNavLink, NavLinkProps } from 'react-router-dom';
import { forwardRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Home, ExternalLink, User, LogOut, LayoutDashboard, Shield, Menu as MenuIcon, Copy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Drawer, DrawerTrigger, DrawerContent } from '@/components/ui/drawer';
import { toast } from 'sonner';

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const isAuthenticated = !!user;
  const isHome = location.pathname === '/';

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 mr-4">
              <span className="text-xl font-bold gradient-text">ZaneTutors</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-2">
              {!isHome && (
                <Link to="/">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Home className="w-4 h-4" />
                    <span>Home</span>
                  </Button>
                </Link>
              )}
            </div>

            <div className="md:hidden">
              <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(true)}>
                    <MenuIcon className="w-5 h-5" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <div className="flex flex-col space-y-2 p-4">
                    {isAuthenticated && (
                      <Button variant="outline" size="sm" onClick={() => {
                        const url = `${window.location.origin}/tutor/${user?.id}`;
                        navigator.clipboard.writeText(url).then(() => toast.success('Public profile URL copied!'));
                      }}>
                        <Copy className="w-4 h-4 mr-1" /> Share Profile
                      </Button>
                    )}
                    <NavLink to="/" className="text-base" onClick={() => setMobileMenuOpen(false)}>Home</NavLink>
                    <a href="https://zanetutors.com.ng" target="_blank" rel="noopener noreferrer" className="text-base" onClick={() => setMobileMenuOpen(false)}>Zane Home</a>
                    {isAuthenticated && (
                      <>
                        {isAdmin && (
                          <NavLink to="/admin" className="text-base" onClick={() => setMobileMenuOpen(false)}>Admin</NavLink>
                        )}
                        <NavLink to="/tutor" className="text-base" onClick={() => setMobileMenuOpen(false)}>Dashboard</NavLink>
                        <span className="text-sm text-muted-foreground">{user?.firstName}</span>
                        <Button variant="outline" size="sm" onClick={() => { logout(); setMobileMenuOpen(false); }}>Log Out</Button>
                      </>
                    )}
                    {!isAuthenticated && (
                      <NavLink to="/login" className="text-base" onClick={() => setMobileMenuOpen(false)}>Sign In</NavLink>
                    )}
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
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
                <Link to="/tutor">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Button>
                </Link>
                <span className="hidden md:inline text-sm text-muted-foreground">{user?.firstName}</span>
                <Button variant="outline" size="sm" className="gap-2" onClick={logout}>
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Log Out</span>
                </Button>
              </>
            ) : (
              <Link to="/login">
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
}

export default Header;

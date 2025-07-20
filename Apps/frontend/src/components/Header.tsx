import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calculator, Settings, LogIn, LogOut, User, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import EnhancedLoginModal from './EnhancedLoginModal';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-brand-green/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 brand-green rounded-lg flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-brand-green">ANAN IP CO., LTD.</h1>
                <p className="text-xs text-brand-gold">คำนวณเบี้ยประกันภัย</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-brand-green/10 rounded-lg">
                    <User className="w-4 h-4 text-brand-green" />
                    <span className="text-sm text-brand-green font-medium">{user.username}</span>
                    {user?.role === 'admin' && (
                      <span className="text-xs bg-brand-gold text-white px-2 py-1 rounded-full">
                        Admin
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <Link to="/admin">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-brand-green text-brand-green hover:bg-brand-green hover:text-white"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Admin
                      </Button>
                    </Link>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-white"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    ออกจากระบบ
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-brand-green text-brand-green hover:bg-brand-green hover:text-white"
                  onClick={() => setShowLoginModal(true)}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  เข้าสู่ระบบ
                </Button>
              )}
            </nav>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <Button variant="ghost" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="mt-4 md:hidden space-y-3">
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-brand-green/10 rounded-lg">
                    <User className="w-4 h-4 text-brand-green" />
                    <span className="text-sm text-brand-green font-medium">{user.username}</span>
                    {user?.role === 'admin' && (
                      <span className="text-xs bg-brand-gold text-white px-2 py-1 rounded-full ml-auto">
                        Admin
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <Link to="/admin">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-brand-green text-brand-green hover:bg-brand-green hover:text-white"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Admin
                      </Button>
                    </Link>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-white"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    ออกจากระบบ
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-brand-green text-brand-green hover:bg-brand-green hover:text-white"
                  onClick={() => setShowLoginModal(true)}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  เข้าสู่ระบบ
                </Button>
              )}
            </div>
          )}
        </div>
      </header>

      <EnhancedLoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
};

export default Header;

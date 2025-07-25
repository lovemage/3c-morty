import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

export function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { getCartItemsCount } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const cartItemsCount = getCartItemsCount();

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-yellow-400/30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-14 h-14 flex items-center justify-center">
                          <img 
              src="/images/others/logo.png"
              alt="Corba 3C Shop Logo" 
                className="w-14 h-14 object-contain transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="w-14 h-14 rm-portal flex items-center justify-center text-dark font-bold text-lg hidden">
                Corba
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 rm-text-glow">
                Corba 3C Shop
              </h1>
            </div>
          </Link>



          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/products" className="nav-link">
              產品
            </Link>
            <Link to="/categories" className="nav-link">
              分類
            </Link>
            <Link to="/contact" className="nav-link">
              聯絡我們
            </Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                {isAdmin && (
                  <Link to="/admin" className="nav-link flex items-center space-x-1">
                    <Settings className="w-4 h-4" />
                    <span>管理後台</span>
                  </Link>
                )}
                
                <Link to="/profile" className="nav-link flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>{user.name}</span>
                </Link>
                
                <button onClick={handleLogout} className="nav-link">
                  登出
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="nav-link">登入</Link>
                <Link to="/register" className="rm-button-secondary px-4 py-2 text-sm">
                  註冊
                </Link>
              </div>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative nav-link">
              <ShoppingCart className="w-6 h-6" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {cartItemsCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-700">


            <div className="space-y-2">
              <Link
                to="/products"
                className="block py-2 px-4 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                產品
              </Link>
              <Link
                to="/categories"
                className="block py-2 px-4 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                分類
              </Link>
              <Link
                to="/contact"
                className="block py-2 px-4 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                聯絡我們
              </Link>
              
              {user ? (
                <>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="block py-2 px-4 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      管理後台
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="block py-2 px-4 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    個人資料
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left py-2 px-4 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
                  >
                    登出
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block py-2 px-4 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    登入
                  </Link>
                  <Link
                    to="/register"
                    className="block py-2 px-4 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    註冊
                  </Link>
                </>
              )}
              
              <Link
                to="/cart"
                className="flex items-center justify-between py-2 px-4 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <span>購物車</span>
                {cartItemsCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// Add to global CSS
const style = document.createElement('style');
style.textContent = `
  .nav-link {
    @apply text-gray-300 hover:text-white transition-all duration-200 font-medium;
    font-family: 'Roboto Mono', monospace;
  }
  
  .nav-link:hover {
    text-shadow: 0 0 8px currentColor;
  }
`;
document.head.appendChild(style);

import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Globe, Settings } from 'lucide-react';
import React, { useState } from 'react';
export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const categories = [
    'Política Internacional',
    'Geopolítica',
    'Esportes',
    'Economia Global',
    'Tecnologia',
    'Análises'
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/busca?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Globe className="h-8 w-8 text-blue-700" />
              <div>
                <span className="font-serif font-bold text-2xl tracking-tight text-gray-900">GlobalPulse</span>
                <span className="font-serif font-bold text-2xl tracking-tight text-blue-700">News</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            {categories.map((cat) => (
              <Link
                key={cat}
                to={`/categoria/${encodeURIComponent(cat)}`}
                className="text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors"
              >
                {cat}
              </Link>
            ))}
          </nav>

          {/* Search & Icons & Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            <Link to="/admin" className="hidden md:flex text-gray-500 hover:text-gray-700 transition-colors" title="Administração">
              <Settings className="h-5 w-5" />
            </Link>
            
            <form onSubmit={handleSearch} className="hidden md:flex relative">
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-3 pr-10 py-1 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 transition-all focus:w-64"
              />
              <button type="submit" className="absolute right-3 top-1.5 text-gray-400 hover:text-gray-600">
                <Search className="h-4 w-4" />
              </button>
            </form>

            <button
              className="md:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <form onSubmit={handleSearch} className="mb-4 relative px-3">
              <input
                type="text"
                placeholder="Buscar notícias..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="absolute right-6 top-2.5 text-gray-400 hover:text-gray-600">
                <Search className="h-4 w-4" />
              </button>
            </form>
            {categories.map((cat) => (
              <Link
                key={cat}
                to={`/categoria/${encodeURIComponent(cat)}`}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-700 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                {cat}
              </Link>
            ))}
            <Link
              to="/sobre"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-700 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Sobre
            </Link>
            <Link
              to="/admin"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-700 hover:bg-gray-50 flex items-center gap-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Settings className="h-5 w-5" /> Administração
            </Link>
            <Link
              to="/contato"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-700 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Contato
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

import { Link } from 'react-router-dom';
import { Globe, Rss, Mail, Twitter, Facebook, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-12 pb-8 border-t-4 border-blue-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Globe className="h-8 w-8 text-blue-500" />
              <div>
                <span className="font-serif font-bold text-2xl tracking-tight text-white">GlobalPulse</span>
                <span className="font-serif font-bold text-2xl tracking-tight text-blue-500">News</span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm mb-4">
              Informação global com contexto e análise. Cobertura completa dos principais eventos mundiais.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">Categorias</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/categoria/Política Internacional" className="hover:text-blue-400 transition-colors">Política Internacional</Link></li>
              <li><Link to="/categoria/Geopolítica" className="hover:text-blue-400 transition-colors">Geopolítica</Link></li>
              <li><Link to="/categoria/Esportes" className="hover:text-blue-400 transition-colors">Esportes</Link></li>
              <li><Link to="/categoria/Economia Global" className="hover:text-blue-400 transition-colors">Economia Global</Link></li>
              <li><Link to="/categoria/Tecnologia" className="hover:text-blue-400 transition-colors">Tecnologia</Link></li>
            </ul>
          </div>

          {/* Institucional */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">Institucional</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/sobre" className="hover:text-blue-400 transition-colors">Sobre o portal</Link></li>
              <li><Link to="/privacidade" className="hover:text-blue-400 transition-colors">Política de privacidade</Link></li>
              <li><Link to="/termos" className="hover:text-blue-400 transition-colors">Termos de uso</Link></li>
              <li><Link to="/contato" className="hover:text-blue-400 transition-colors">Contato</Link></li>
              <li>
                <a href="/api/rss" className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                  <Rss className="h-4 w-4" /> Feed RSS
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">Newsletter</h3>
            <p className="text-gray-400 text-sm mb-4">Receba as principais notícias do dia no seu e-mail.</p>
            <form className="flex flex-col space-y-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Seu e-mail"
                className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:border-blue-500 text-sm"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Mail className="h-4 w-4" /> Assinar
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 mt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} GlobalPulse News. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

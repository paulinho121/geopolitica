import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Clock, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AdSpace from './AdSpace';
import { supabase, mapNoticia } from '../lib/supabase';

export default function Sidebar() {
  const [trending, setTrending] = useState<any[]>([]);
  const [latest, setLatest] = useState<any[]>([]);

  useEffect(() => {
    const fetchTrending = async () => {
      const { data } = await supabase
        .from('noticias')
        .select('*')
        .order('views', { ascending: false })
        .limit(5);
      if (data) setTrending(data.map(mapNoticia));
    };

    const fetchLatest = async () => {
      const { data } = await supabase
        .from('noticias')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setLatest(data.map(mapNoticia));
    };

    fetchTrending();
    fetchLatest();
  }, []);

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 space-y-8">
      {/* Newsletter */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
        <h3 className="text-lg font-serif font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          Newsletter
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Receba as principais análises geopolíticas e econômicas diariamente.
        </p>
        <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            placeholder="Seu e-mail"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors text-sm"
          >
            Inscrever-se
          </button>
        </form>
      </div>

      {/* AdSpace */}
      <AdSpace format="square" />

      {/* Trending */}
      <div>
        <h3 className="text-lg font-serif font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Tendências
        </h3>
        <ul className="space-y-4">
          {trending.map((post, index) => (
            <li key={post.id} className="flex gap-4 group">
              <span className="text-3xl font-serif font-bold text-gray-200 group-hover:text-blue-200 transition-colors">
                {index + 1}
              </span>
              <div>
                <Link to={`/${post.slug}`} className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">
                  {post.title}
                </Link>
                <span className="text-xs text-gray-500 mt-1 block">
                  {post.category}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Latest */}
      <div>
        <h3 className="text-lg font-serif font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Últimas Notícias
        </h3>
        <ul className="space-y-4">
          {latest.map((post) => (
            <li key={post.id} className="group">
              <Link to={`/${post.slug}`} className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">
                {post.title}
              </Link>
              <span className="text-xs text-gray-500 mt-1 block">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* AdSpace */}
      <AdSpace format="vertical" />
    </aside>
  );
}

import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Sidebar from '../components/Sidebar';
import AdSpace from '../components/AdSpace';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!query) {
      setPosts([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/posts?search=${encodeURIComponent(query)}&limit=10&offset=${(page - 1) * 10}`)
      .then(res => res.json())
      .then(data => {
        setPosts(data.posts);
        setTotal(data.total);
        setLoading(false);
      });
  }, [query, page]);

  return (
    <>
      <Helmet>
        <title>Resultados para "{query}" | GlobalPulse News</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <AdSpace format="horizontal" className="mb-8" />

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow">
          <div className="mb-8 pb-4 border-b-4 border-blue-600">
            <h1 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">
              Resultados da busca por: <span className="text-blue-600">"{query}"</span>
            </h1>
            <p className="text-gray-600 mt-2">
              Encontrados {total} resultados.
            </p>
          </div>

          {loading ? (
            <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex gap-6">
                  <div className="w-48 h-32 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-3 py-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-8">
              {posts.map(post => (
                <article key={post.id} className="flex flex-col sm:flex-row gap-6 group">
                  <Link to={`/${post.slug}`} className="sm:w-1/3 flex-shrink-0 relative overflow-hidden rounded-lg aspect-video sm:aspect-auto sm:h-40">
                    <img
                      src={post.image}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </Link>
                  <div className="sm:w-2/3 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-blue-600">
                      <span>{post.category}</span>
                      <span className="text-gray-300">&bull;</span>
                      <span className="text-gray-500">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}</span>
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors leading-tight">
                      <Link to={`/${post.slug}`}>{post.title}</Link>
                    </h2>
                    <p className="text-gray-600 line-clamp-2 leading-relaxed mb-3">
                      {post.subtitle}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 mt-auto">
                      <span className="font-medium text-gray-700">Por {post.source}</span>
                    </div>
                  </div>
                </article>
              ))}

              {/* Pagination */}
              {total > 10 && (
                <div className="flex justify-center gap-2 mt-12 pt-8 border-t border-gray-200">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-gray-700">
                    Página {page} de {Math.ceil(total / 10)}
                  </span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= Math.ceil(total / 10)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500 text-lg">Nenhum resultado encontrado para a sua busca.</p>
              <p className="text-gray-400 mt-2">Tente usar palavras-chave diferentes ou mais genéricas.</p>
            </div>
          )}
        </div>

        <Sidebar />
      </div>
    </>
  );
}

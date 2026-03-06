import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Sidebar from '../components/Sidebar';
import AdSpace from '../components/AdSpace';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Home() {
  const [featured, setFeatured] = useState<any>(null);
  const [gridPosts, setGridPosts] = useState<any[]>([]);
  const [categoryPosts, setCategoryPosts] = useState<Record<string, any[]>>({});

  useEffect(() => {
    fetch('/api/posts?limit=7')
      .then(res => res.json())
      .then(data => {
        if (data.posts.length > 0) {
          setFeatured(data.posts[0]);
          setGridPosts(data.posts.slice(1, 7));
        }
      });

    const categories = ['Política', 'Geopolítica', 'Economia', 'Tecnologia'];
    categories.forEach(cat => {
      fetch(`/api/posts?category=${encodeURIComponent(cat)}&limit=3`)
        .then(res => res.json())
        .then(data => {
          setCategoryPosts(prev => ({ ...prev, [cat]: data.posts }));
        });
    });
  }, []);

  return (
    <>
      <Helmet>
        <title>GlobalPulse News | Informação global com contexto e análise</title>
        <meta name="description" content="Portal de notícias internacional profissional. Cobertura completa de política, economia, geopolítica, esportes e tecnologia." />
      </Helmet>

      <AdSpace format="horizontal" className="mb-8" />

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow">
          {/* Featured Post */}
          {featured && (
            <article className="mb-12 group">
              <Link to={`/${featured.slug}`} className="block relative overflow-hidden rounded-lg aspect-video mb-4">
                <img
                  src={featured.image}
                  alt={featured.title}
                  loading="lazy"
                  className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded">
                  {featured.category}
                </div>
              </Link>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors leading-tight">
                <Link to={`/${featured.slug}`}>{featured.title}</Link>
              </h2>
              <p className="text-lg text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                {featured.subtitle}
              </p>
              <div className="flex items-center text-sm text-gray-500 gap-4">
                <span className="font-medium text-gray-700">{featured.source}</span>
                <span>{formatDistanceToNow(new Date(featured.created_at), { addSuffix: true, locale: ptBR })}</span>
              </div>
            </article>
          )}

          {/* Grid Posts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {gridPosts.map(post => (
              <article key={post.id} className="group flex flex-col">
                <Link to={`/${post.slug}`} className="block relative overflow-hidden rounded-lg aspect-video mb-3">
                  <img
                    src={post.image}
                    alt={post.title}
                    loading="lazy"
                    className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 bg-gray-900/80 backdrop-blur text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded">
                    {post.category}
                  </div>
                </Link>
                <h3 className="text-lg font-serif font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors leading-snug flex-grow">
                  <Link to={`/${post.slug}`}>{post.title}</Link>
                </h3>
                <div className="flex items-center text-xs text-gray-500 gap-2 mt-auto pt-2 border-t border-gray-100">
                  <span className="font-medium text-gray-700 truncate max-w-[100px]">{post.source}</span>
                  <span>&bull;</span>
                  <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}</span>
                </div>
              </article>
            ))}
          </div>

          <AdSpace format="horizontal" className="mb-12" />

          {/* Category Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {Object.entries(categoryPosts).map(([category, posts]: [string, any[]]) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-blue-600">
                  <h3 className="text-xl font-serif font-bold text-gray-900">
                    {category}
                  </h3>
                  <Link to={`/categoria/${encodeURIComponent(category)}`} className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                    Ver mais &rarr;
                  </Link>
                </div>
                <div className="space-y-6">
                  {posts.map((post, index) => (
                    <article key={post.id} className="flex gap-4 group">
                      <Link to={`/${post.slug}`} className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-24 relative overflow-hidden rounded-md">
                        <img
                          src={post.image}
                          alt={post.title}
                          loading="lazy"
                          className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      </Link>
                      <div className="flex flex-col justify-center">
                        <h4 className="text-base font-serif font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors leading-snug line-clamp-2">
                          <Link to={`/${post.slug}`}>{post.title}</Link>
                        </h4>
                        <div className="text-xs text-gray-500 mt-auto">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Sidebar />
      </div>
    </>
  );
}

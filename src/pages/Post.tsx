import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Facebook, Twitter, MessageCircle, Send, Share2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import AdSpace from '../components/AdSpace';
import { supabase, mapNoticia } from '../lib/supabase';

export default function Post() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<any[]>([]);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('noticias')
          .select('*')
          .eq('slug', slug)
          .single();
        
        if (error || !data) throw new Error('Post not found');
        
        const mapped = mapNoticia(data);
        setPost(mapped);
        
        // Fetch related posts
        const { data: relatedData } = await supabase
          .from('noticias')
          .select('*')
          .eq('categoria', data.categoria)
          .neq('id', data.id)
          .limit(3);
        
        if (relatedData) {
          setRelated(relatedData.map(mapNoticia));
        }
      } catch (err) {
        console.error('Error fetching post from Supabase:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row gap-8 animate-pulse">
        <div className="flex-grow">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-96 bg-gray-200 rounded-lg mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="h-64 bg-gray-200 rounded-lg mb-8"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">Notícia não encontrada</h1>
        <p className="text-gray-600 mb-8">A página que você está procurando pode ter sido removida ou está temporariamente indisponível.</p>
        <Link to="/" className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors">
          Voltar para a página inicial
        </Link>
      </div>
    );
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <>
      <Helmet>
        <title>{post.title} | GlobalPulse News</title>
        <meta name="description" content={post.subtitle || post.title} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.subtitle || post.title} />
        <meta property="og:image" content={post.image} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": post.title,
            "image": [post.image],
            "datePublished": post.created_at,
            "author": [{
              "@type": "Organization",
              "name": post.source || "GlobalPulse News"
            }]
          })}
        </script>
      </Helmet>

      <AdSpace format="horizontal" className="mb-8" />

      <div className="flex flex-col lg:flex-row gap-8">
        <article className="flex-grow max-w-3xl">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Link to={`/categoria/${encodeURIComponent(post.category)}`} className="text-sm font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 transition-colors">
                {post.category}
              </Link>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4 leading-tight">
              {post.title}
            </h1>
            {post.subtitle && (
              <p className="text-xl text-gray-600 mb-6 leading-relaxed font-serif italic">
                {post.subtitle}
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-y border-gray-200 gap-4">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="font-medium text-gray-900">Por {post.source || 'GlobalPulse News'}</span>
                <span>&bull;</span>
                <time dateTime={post.created_at}>
                  {format(new Date(post.created_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
                </time>
              </div>
              
              {/* Share Buttons */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 mr-2 flex items-center gap-1"><Share2 className="w-4 h-4" /> Compartilhar:</span>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors" aria-label="Compartilhar no Facebook">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition-colors" aria-label="Compartilhar no Twitter">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + ' ' + shareUrl)}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors" aria-label="Compartilhar no WhatsApp">
                  <MessageCircle className="w-4 h-4" />
                </a>
                <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors" aria-label="Compartilhar no Telegram">
                  <Send className="w-4 h-4" />
                </a>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          {post.image && (
            <figure className="mb-8">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-auto rounded-lg shadow-sm"
                referrerPolicy="no-referrer"
              />
              <figcaption className="text-xs text-gray-500 mt-2 text-right">
                Foto: {post.source || 'Divulgação'}
              </figcaption>
            </figure>
          )}

          {/* Context Block (Geopolitics) */}
          {post.category === 'Geopolítica' && (
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-8 rounded-r-lg">
              <h3 className="text-lg font-serif font-bold text-gray-900 mb-2">Contexto Geopolítico</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                As relações internacionais na região têm sido marcadas por tensões históricas e interesses estratégicos conflitantes. Este evento representa um desdobramento significativo no equilíbrio de poder global, afetando diretamente as cadeias de suprimento e a diplomacia internacional.
              </p>
            </div>
          )}

          {/* Content */}
          <div 
            className="prose prose-lg prose-blue max-w-none font-serif text-gray-800 leading-relaxed mb-12"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <AdSpace format="horizontal" className="my-12" />

          {/* Tags */}
          {post.tags && (
            <div className="mb-12 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Tópicos Relacionados</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.split(',').map((tag: string) => (
                  <Link
                    key={tag.trim()}
                    to={`/busca?q=${encodeURIComponent(tag.trim())}`}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
                  >
                    #{tag.trim()}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related Posts */}
          {related.length > 0 && (
            <div className="mb-12">
              <h3 className="text-2xl font-serif font-bold text-gray-900 mb-6 pb-2 border-b-2 border-blue-600">
                Leia também
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {related.map(rel => (
                  <article key={rel.id} className="group">
                    <Link to={`/${rel.slug}`} className="block relative overflow-hidden rounded-lg aspect-video mb-3">
                      <img
                        src={rel.image}
                        alt={rel.title}
                        loading="lazy"
                        className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </Link>
                    <h4 className="text-base font-serif font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors leading-snug line-clamp-3">
                      <Link to={`/${rel.slug}`}>{rel.title}</Link>
                    </h4>
                  </article>
                ))}
              </div>
            </div>
          )}
        </article>

        <Sidebar />
      </div>
    </>
  );
}

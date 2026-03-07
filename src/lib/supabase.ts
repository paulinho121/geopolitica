import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to bridge Supabase fields to Legacy UI fields
export const mapNoticia = (n: any) => {
  if (!n) return null;
  return {
    ...n,
    title: n.rewritten_title || n.titulo || n.title,
    subtitle: n.meta_description || n.resumo_seo || n.subtitle || n.excerpt,
    content: n.rewritten_content || n.conteudo_html || n.content,
    image: n.rewritten_image || n.url_imagem || n.image || n.image_url,
    category: n.categoria || n.category,
    source: n.url_fonte_original || n.source || n.source_url,
    // Add fallback for created_at if only data_publicacao exists
    created_at: n.created_at || n.data_publicacao
  };
};

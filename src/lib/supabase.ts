import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to bridge Supabase fields to Legacy UI fields
export const mapNoticia = (n: any) => {
  if (!n) return null;
  return {
    ...n,
    title: n.titulo,
    subtitle: n.resumo_seo,
    content: n.conteudo_html,
    image: n.url_imagem,
    category: n.categoria,
    source: n.url_fonte_original,
    // Add fallback for created_at if only data_publicacao exists
    created_at: n.created_at || n.data_publicacao
  };
};

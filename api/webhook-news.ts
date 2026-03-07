import { createClient } from '@supabase/supabase-js';

// Função para formatar slug caso não venha no post
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, '-');
}

export default async function handler(req: any, res: any) {
  // Configuração CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-API-Key, x-webhook-secret'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'Webhook LabNews online. Aguardando POST.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Verificar Secret
  const webhookSecret = req.headers['x-webhook-secret'];
  const validSecret = process.env.WEBHOOK_SECRET || 'GP_SECURE_KEY_7788';

  if (webhookSecret !== validSecret) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Webhook Secret' });
  }

  const { event, post } = req.body;
  if (event !== 'post_created' || !post) {
    return res.status(400).json({ error: 'Invalid event or post data' });
  }

  const { 
    id, 
    title, 
    rewritten_title,
    content, 
    rewritten_content,
    excerpt, 
    meta_description,
    slug, 
    image_url, 
    rewritten_image,
    tags, 
    keywords, 
    source_url 
  } = post;

  const finalTitle = rewritten_title || title;
  const finalContent = rewritten_content || content;
  const finalImage = rewritten_image || image_url;
  const finalSummary = meta_description || excerpt;

  if (!finalTitle || !finalContent) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const finalSlug = slug || `${slugify(finalTitle)}-${Date.now().toString().slice(-4)}`;

  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ 
      error: 'Configuração Incompleta', 
      details: 'As variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não foram encontradas no ambiente do Vercel.' 
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data, error } = await supabase
      .from('noticias')
      .upsert({
        id_externo: id || null,
        titulo: finalTitle,
        conteudo_html: finalContent,
        resumo_seo: finalSummary || null,
        slug: finalSlug,
        url_imagem: finalImage || null,
        tags: tags ? (Array.isArray(tags) ? tags.join(', ') : tags) : '',
        keywords: keywords ? (Array.isArray(keywords) ? keywords.join(', ') : keywords) : '',
        url_fonte_original: source_url || null,
        data_publicacao: new Date().toISOString()
      }, { onConflict: 'id_externo' })
      .select('slug')
      .single();

    if (error) {
       console.error('Supabase error:', error);
       return res.status(500).json({ 
         error: 'Erro no Supabase', 
         details: error.message,
         code: error.code,
         hint: error.hint
       });
    }

    return res.status(200).json({ status: 'success', slug: data.slug });
  } catch (err: any) {
    console.error('Webhook Unexpected Error:', err);
    return res.status(500).json({ 
      error: 'Erro Inesperado', 
      details: err.message 
    });
  }
}

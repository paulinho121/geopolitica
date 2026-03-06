import { createClient } from '@supabase/supabase-js';

// Função para formatar slug
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
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-API-Key'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Apenas aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Verifica a chave de segurança
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.WEBHOOK_API_KEY || 'sua-chave-secreta';
  
  if (apiKey !== validApiKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase credentials missing on Vercel Environment Variables' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { title, subtitle, content, image, category, tags, source } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const baseSlug = slugify(title);
    let finalSlug = baseSlug;
    
    // Insere no Supabase
    const { data, error } = await supabase
      .from('posts')
      .insert([
        { 
          title, 
          subtitle, 
          content, 
          image, 
          category, 
          tags, 
          source, 
          slug: finalSlug,
          views: 0
        }
      ])
      .select('id, slug')
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
         finalSlug = `${baseSlug}-${Date.now()}`;
         const retry = await supabase
          .from('posts')
          .insert([{ title, subtitle, content, image, category, tags, source, slug: finalSlug, views: 0 }])
          .select('id, slug')
          .single();
         if (retry.error) throw retry.error;
         return res.status(200).json({ status: 'success', slug: retry.data.slug });
      }
      throw error;
    }

    return res.status(200).json({ status: 'success', slug: data.slug });

  } catch (error: any) {
    console.error('Webhook Vercel erro:', error);
    return res.status(500).json({ error: 'Failed to process webhook', details: error.message });
  }
}

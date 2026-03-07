
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import slugify from 'slugify';

dotenv.config({ path: '.env.local' });
dotenv.config();

const db = new Database('news.db');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_JWT = process.env.SUPABASE_JWT_TOKEN || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Erro: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar no .env.local');
  process.exit(1);
}

function generateUniqueSlug(title: string) {
  let baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = db.prepare('SELECT id FROM noticias WHERE slug = ?').get(slug);
    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

async function sync() {
  console.log('Iniciando sincronização manual via API Supabase...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/feed_items?status=eq.success&select=*&order=created_at.desc&limit=50`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY!,
        'Authorization': `Bearer ${SUPABASE_JWT}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase erro: ${response.status} - ${error}`);
    }

    const items = await response.json() as any[];
    console.log(`Encontrados ${items.length} itens no Supabase.`);
    
    let imported = 0;
    
    for (const item of items) {
      const externalId = item.id || item.id_externo;
      const existing = db.prepare('SELECT id FROM noticias WHERE id_externo = ?').get(externalId);
      
      if (!existing) {
        // Prioritize rewritten fields from LabNews AI
        const title = item.rewritten_title || item.title || item.titulo;
        const content = item.rewritten_content || item.content || item.conteudo_html;
        const slug = item.slug || generateUniqueSlug(title);
        const image = item.rewritten_image || item.image_url || item.url_imagem || null;
        const summary = item.meta_description || item.excerpt || item.resumo_seo || null;
        
        console.log(`Importando: ${title}`);
        
        const stmt = db.prepare(`
          INSERT INTO noticias (
            id_externo, titulo, resumo_seo, conteudo_html, url_imagem, 
            tags, keywords, url_fonte_original, slug, data_publicacao
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
          externalId,
          title,
          summary,
          content,
          image,
          Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''),
          Array.isArray(item.keywords) ? item.keywords.join(', ') : (item.keywords || ''),
          item.source_url || item.url_fonte_original || null,
          slug,
          item.data_publicacao || item.created_at || new Date().toISOString()
        );
        imported++;
      }
    }
    
    console.log(`Sincronização concluída. ${imported} novas notícias importadas.`);
  } catch (error: any) {
    console.error('Erro durante a sincronização:', error.message);
    process.exit(1);
  }
}

sync();

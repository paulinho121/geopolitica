import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import slugify from 'slugify';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Database setup
const db = new Database('news.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS noticias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_externo TEXT UNIQUE,
    titulo TEXT NOT NULL,
    resumo_seo TEXT,
    conteudo_html TEXT NOT NULL,
    url_imagem TEXT,
    categoria TEXT,
    tags TEXT,
    keywords TEXT,
    url_fonte_original TEXT,
    slug TEXT UNIQUE NOT NULL,
    views INTEGER DEFAULT 0,
    data_publicacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Migration from posts to noticias if posts exists and noticias is empty
try {
  const postsCount = (db.prepare('SELECT COUNT(*) as count FROM posts').get() as any)?.count || 0;
  const noticiasCount = (db.prepare('SELECT COUNT(*) as count FROM noticias').get() as any)?.count || 0;
  
  if (postsCount > 0 && noticiasCount === 0) {
    console.log('Migrating existing posts to new noticias table...');
    db.prepare(`
      INSERT INTO noticias (titulo, resumo_seo, conteudo_html, url_imagem, categoria, tags, url_fonte_original, slug, views, created_at)
      SELECT title, subtitle, content, image, category, tags, source, slug, views, created_at FROM posts
    `).run();
    console.log('Migration completed successfully.');
  }
} catch (e) {
  // Posts table might not exist yet in fresh installs, ignore
}

// Helper to generate unique slug
function generateUniqueSlug(title: string) {
  let baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = db.prepare('SELECT id FROM noticias WHERE slug = ?').get(slug);
    if (!existing) {
      break;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

// API Routes
app.get('/api/posts', (req, res) => {
  const { category, tag, search, limit = 10, offset = 0, sort = 'created_at' } = req.query;
  
  // Mapping noticias table fields to expected frontend "post" fields
  let query = `
    SELECT 
      id, 
      id_externo, 
      titulo as title, 
      resumo_seo as subtitle, 
      conteudo_html as content, 
      url_imagem as image, 
      categoria as category, 
      tags, 
      url_fonte_original as source, 
      slug, 
      views, 
      data_publicacao,
      created_at 
    FROM noticias 
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (category) {
    query += ' AND categoria = ?';
    params.push(category);
  }
  
  if (tag) {
    query += ' AND tags LIKE ?';
    params.push(`%${tag}%`);
  }
  
  if (search) {
    query += ' AND (titulo LIKE ? OR conteudo_html LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (sort === 'views') {
    query += ' ORDER BY views DESC, created_at DESC';
  } else {
    query += ' ORDER BY created_at DESC';
  }
  
  query += ' LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  
  const posts = db.prepare(query).all(...params);
  
  // Get total count
  let countQuery = 'SELECT COUNT(*) as count FROM noticias WHERE 1=1';
  const countParams: any[] = [];
  if (category) { countQuery += ' AND categoria = ?'; countParams.push(category); }
  if (tag) { countQuery += ' AND tags LIKE ?'; countParams.push(`%${tag}%`); }
  if (search) { countQuery += ' AND (titulo LIKE ? OR conteudo_html LIKE ?)'; countParams.push(`%${search}%`, `%${search}%`); }
  
  const totalCount = (db.prepare(countQuery).get(...countParams) as any).count;
  
  res.json({ posts, total: totalCount });
});

app.get('/api/posts/:slug', (req, res) => {
  const post = db.prepare(`
    SELECT 
      id, 
      id_externo, 
      titulo as title, 
      resumo_seo as subtitle, 
      conteudo_html as content, 
      url_imagem as image, 
      categoria as category, 
      tags, 
      keywords,
      url_fonte_original as source, 
      slug, 
      views, 
      data_publicacao,
      created_at 
    FROM noticias WHERE slug = ?
  `).get(req.params.slug);
  
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  // Increment views
  db.prepare('UPDATE noticias SET views = views + 1 WHERE slug = ?').run(req.params.slug);
  
  res.json(post);
});

app.get('/api/categories', (req, res) => {
  const categories = db.prepare('SELECT DISTINCT categoria FROM noticias WHERE categoria IS NOT NULL').all();
  res.json(categories.map((c: any) => c.categoria));
});

app.get('/api/tags', (req, res) => {
  const tagsRows = db.prepare('SELECT tags FROM noticias WHERE tags IS NOT NULL').all();
  const allTags = new Set<string>();
  tagsRows.forEach((row: any) => {
    if (row.tags) {
      const tags = row.tags.split(',').map((t: string) => t.trim().toLowerCase());
      tags.forEach((t: string) => {
        if (t) allTags.add(t);
      });
    }
  });
  res.json(Array.from(allTags));
});

// New Webhook for Automatic Content
app.post('/api/webhook-news', (req, res) => {
  console.log('Receiving webhook-news request...');
  const webhookSecret = req.headers['x-webhook-secret'];
  const validSecret = process.env.WEBHOOK_SECRET || 'GP_SECURE_KEY_7788';

  if (webhookSecret !== validSecret) {
    console.warn('Webhook Unauthorized: Invalid Secret');
    return res.status(401).json({ error: 'Unauthorized: Invalid Webhook Secret' });
  }

  const { event, post } = req.body;
  if (event !== 'post_created' || !post) {
    return res.status(400).json({ error: 'Invalid event or post data' });
  }

  const { id, title, content, excerpt, slug, image_url, tags, keywords, source_url } = post;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const finalSlug = slug || generateUniqueSlug(title);

  try {
    const stmt = db.prepare(`
      INSERT INTO noticias (
        id_externo, titulo, conteudo_html, resumo_seo, slug, 
        url_imagem, tags, keywords, url_fonte_original
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id_externo) DO UPDATE SET
        titulo = excluded.titulo,
        resumo_seo = excluded.resumo_seo,
        conteudo_html = excluded.conteudo_html,
        url_imagem = excluded.url_imagem,
        tags = excluded.tags,
        keywords = excluded.keywords,
        url_fonte_original = excluded.url_fonte_original
    `);

    stmt.run(
      id || null, 
      title, 
      content, 
      excerpt || null, 
      finalSlug, 
      image_url || null, 
      tags ? (Array.isArray(tags) ? tags.join(', ') : tags) : '',
      keywords ? (Array.isArray(keywords) ? keywords.join(', ') : keywords) : '',
      source_url || null
    );

    res.json({ status: 'success', slug: finalSlug });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Failed to process news', details: error.message });
  }
});

// Existing Webhook (kept for backward compatibility)
app.post('/api/webhook', (req, res) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  
  const dbKeyRow = db.prepare("SELECT value FROM settings WHERE key = 'incomingWebhookKey'").get() as any;
  const validApiKey = (dbKeyRow && dbKeyRow.value) 
      ? dbKeyRow.value 
      : (process.env.WEBHOOK_API_KEY || 'sua-chave-secreta');
  
  if (apiKey !== validApiKey && apiKey !== `Bearer ${validApiKey}`) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }
  
  const { title, subtitle, content, image, category, tags, source } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  
  const slug = generateUniqueSlug(title);
  
  try {
    const stmt = db.prepare(`
      INSERT INTO noticias (titulo, resumo_seo, conteudo_html, url_imagem, categoria, tags, url_fonte_original, slug)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(title, subtitle, content, image, category, tags, source, slug);
    const postId = info.lastInsertRowid;
    
    res.json({ status: 'success', slug, id: postId });
  } catch (error: any) {
    console.error('Webhook legacy error:', error);
    res.status(500).json({ error: 'Failed to insert post', details: error.message });
  }
});

// Admin API Routes
app.get('/api/settings', (req, res) => {
  const settingsRows = db.prepare('SELECT key, value FROM settings').all();
  const settings = settingsRows.reduce((acc: any, row: any) => {
    acc[row.key] = row.value === 'true' ? true : row.value === 'false' ? false : row.value;
    return acc;
  }, {});
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const { webhookUrl, authHeader, autoPublish, publicUrl, incomingWebhookKey } = req.body;
  
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  
  const updateSetting = (key: string, value: any) => {
    if (value !== undefined) {
      stmt.run(key, String(value));
    }
  };

  updateSetting('webhookUrl', webhookUrl);
  updateSetting('authHeader', authHeader);
  updateSetting('autoPublish', autoPublish);
  updateSetting('publicUrl', publicUrl);
  updateSetting('incomingWebhookKey', incomingWebhookKey);

  res.json({ success: true });
});

app.delete('/api/posts/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM noticias WHERE id = ?').run(req.params.id);
    if (result.changes > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Post not found' });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete post', details: error.message });
  }
});

app.post('/api/sync-pull', async (req, res) => {
  const { supabaseUrl, apiKey, jwtToken } = req.body;
  
  if (!supabaseUrl || !apiKey || !jwtToken) {
    return res.status(400).json({ error: 'Missing Supabase credentials' });
  }
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/feed_items?status=eq.success&select=*`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Supabase responded with ${response.status}`);
    }
    
    const items = await response.json() as any[];
    let imported = 0;
    
    for (const item of items) {
      // Check if already imported by id_externo
      const existing = db.prepare('SELECT id FROM noticias WHERE id_externo = ?').get(item.id || item.id_externo);
      
      if (!existing) {
        const title = item.title || item.titulo;
        const content = item.content || item.conteudo_html;
        const slug = item.slug || generateUniqueSlug(title);
        
        const stmt = db.prepare(`
          INSERT INTO noticias (
            id_externo, titulo, resumo_seo, conteudo_html, url_imagem, 
            tags, keywords, url_fonte_original, slug, data_publicacao
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
          item.id || item.id_externo,
          title,
          item.excerpt || item.resumo_seo || null,
          content,
          item.image_url || item.url_imagem || null,
          item.tags ? (Array.isArray(item.tags) ? item.tags.join(', ') : item.tags) : '',
          item.keywords ? (Array.isArray(item.keywords) ? item.keywords.join(', ') : item.keywords) : '',
          item.source_url || item.url_fonte_original || null,
          slug,
          item.data_publicacao || item.created_at || new Date().toISOString()
        );
        imported++;
      }
    }
    
    res.json({ success: true, imported });
  } catch (error: any) {
    console.error('Pull sync error:', error);
    res.status(500).json({ error: 'Failed to sync news from Supabase', details: error.message });
  }
});

// Seed some initial data if empty
const countNoticias = (db.prepare('SELECT COUNT(*) as count FROM noticias').get() as any).count;
if (countNoticias === 0) {
  const seedPosts = [
    {
      title: 'Tensão entre China e EUA no Pacífico atinge novo patamar',
      subtitle: 'Movimentações navais recentes indicam escalada na região do Mar do Sul da China.',
      content: '<p>A tensão entre as duas maiores potências econômicas mundiais, China e Estados Unidos, atingiu um novo patamar nesta semana após uma série de exercícios militares conjuntos na região do Indo-Pacífico.</p><p>Especialistas em geopolítica alertam que a situação exige diplomacia imediata para evitar um conflito direto. O contexto geopolítico atual é marcado por disputas comerciais e tecnológicas que agora se estendem para o campo militar.</p><p>A comunidade internacional observa com apreensão, enquanto líderes europeus pedem moderação de ambos os lados.</p>',
      image: 'https://picsum.photos/seed/geopolitics1/1200/600',
      category: 'Geopolítica',
      tags: 'china,eua,pacifico,militar',
      source: 'GlobalPulse Analysis',
      slug: 'tensao-china-eua-pacifico'
    }
    // ... other seeds can be added if needed, but one is enough for testing
  ];

  const insert = db.prepare(`
    INSERT INTO noticias (titulo, resumo_seo, conteudo_html, url_imagem, categoria, tags, url_fonte_original, slug)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  seedPosts.forEach(p => {
    insert.run(p.title, p.subtitle, p.content, p.image, p.category, p.tags, p.source, p.slug);
  });
}

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

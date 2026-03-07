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
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subtitle TEXT,
    content TEXT NOT NULL,
    image TEXT,
    category TEXT,
    tags TEXT,
    source TEXT,
    slug TEXT UNIQUE NOT NULL,
    views INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Helper to generate unique slug
function generateUniqueSlug(title: string) {
  let baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = db.prepare('SELECT id FROM posts WHERE slug = ?').get(slug);
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
  
  let query = 'SELECT * FROM posts WHERE 1=1';
  const params: any[] = [];
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  
  if (tag) {
    query += ' AND tags LIKE ?';
    params.push(`%${tag}%`);
  }
  
  if (search) {
    query += ' AND (title LIKE ? OR content LIKE ?)';
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
  let countQuery = 'SELECT COUNT(*) as count FROM posts WHERE 1=1';
  const countParams: any[] = [];
  if (category) { countQuery += ' AND category = ?'; countParams.push(category); }
  if (tag) { countQuery += ' AND tags LIKE ?'; countParams.push(`%${tag}%`); }
  if (search) { countQuery += ' AND (title LIKE ? OR content LIKE ?)'; countParams.push(`%${search}%`, `%${search}%`); }
  
  const totalCount = (db.prepare(countQuery).get(...countParams) as any).count;
  
  res.json({ posts, total: totalCount });
});

app.get('/api/posts/:slug', (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE slug = ?').get(req.params.slug);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  // Increment views
  db.prepare('UPDATE posts SET views = views + 1 WHERE slug = ?').run(req.params.slug);
  
  res.json(post);
});

app.get('/api/categories', (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM posts WHERE category IS NOT NULL').all();
  res.json(categories.map((c: any) => c.category));
});

app.get('/api/tags', (req, res) => {
  const tagsRows = db.prepare('SELECT tags FROM posts WHERE tags IS NOT NULL').all();
  const allTags = new Set<string>();
  tagsRows.forEach((row: any) => {
    const tags = row.tags.split(',').map((t: string) => t.trim().toLowerCase());
    tags.forEach((t: string) => {
      if (t) allTags.add(t);
    });
  });
  res.json(Array.from(allTags));
});

// Webhook endpoint
app.post('/api/webhook', (req, res) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  
  // Try to get from database first, then process.env, then default fallback
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
      INSERT INTO posts (title, subtitle, content, image, category, tags, source, slug)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(title, subtitle, content, image, category, tags, source, slug);
    const postId = info.lastInsertRowid;
    
    // Auto-publish if configured
    try {
      const autoPublishSettings = db.prepare("SELECT value FROM settings WHERE key = 'autoPublish'").get() as any;
      if (autoPublishSettings && autoPublishSettings.value === 'true') {
        const webhookUrl = db.prepare("SELECT value FROM settings WHERE key = 'webhookUrl'").get() as any;
        const authHeader = db.prepare("SELECT value FROM settings WHERE key = 'authHeader'").get() as any;
        
        if (webhookUrl && webhookUrl.value) {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          
          if (authHeader && authHeader.value) {
            const [key, val] = authHeader.value.split(':').map((s: string) => s.trim());
            if (key && val) {
              headers[key] = val;
              // If it's apikey for supabase, also add Authorization Bearer
              if (key.toLowerCase() === 'apikey') {
                headers['Authorization'] = `Bearer ${val}`;
              }
            }
          }

          // Strip local id to avoid conflicts on external DB
          const { id: _id, ...postData } = {
            title, subtitle, content, image, category, tags, source, slug, created_at: new Date().toISOString(), views: 0
          } as any;

          fetch(webhookUrl.value, {
            method: 'POST',
            headers,
            body: JSON.stringify(postData)
          }).catch(e => console.error('Failed to auto-publish to external webhook:', e));
        }
      }
    } catch (e) {
      console.error('Error during auto-publish check:', e);
    }
    
    res.json({ status: 'success', slug, id: postId });
  } catch (error: any) {
    console.error('Webhook error:', error);
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
    const result = db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
    if (result.changes > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Post not found' });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete post', details: error.message });
  }
});

app.post('/api/posts/:id/sync', async (req, res) => {
  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id) as any;
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const webhookUrlSettings = db.prepare("SELECT value FROM settings WHERE key = 'webhookUrl'").get() as any;
    const authHeaderSettings = db.prepare("SELECT value FROM settings WHERE key = 'authHeader'").get() as any;

    if (!webhookUrlSettings || !webhookUrlSettings.value) {
      return res.status(400).json({ error: 'Webhook URL not configured' });
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    
    if (authHeaderSettings && authHeaderSettings.value) {
      // Parse "X-API-Key: sua-chave" format
      const [key, val] = authHeaderSettings.value.split(':').map((s: string) => s.trim());
      if (key && val) {
        headers[key] = val;
        if (key.toLowerCase() === 'apikey') {
           headers['Authorization'] = `Bearer ${val}`;
        }
      }
    }

    // Strip local id for external insertion
    const { id: _id, ...postData } = post;
    // Prefer array wrap for Rest API just in case, but standard Supabase row insert is just object if creating one
    // But actually Supabase prefers `Prefer: return=minimal` or just object payload
    // Let's remove the wrapper, just use postData
    
    // Add Prefer header if it's supabase to return representation
    if (webhookUrlSettings.value.includes('supabase.co')) {
      headers['Prefer'] = 'return=representation';
    }

    const response = await fetch(webhookUrlSettings.value, {
      method: 'POST',
      headers,
      body: JSON.stringify(postData)
    });

    if (!response.ok) {
      const respError = await response.text();
      throw new Error(`External server responded with status: ${response.status} - ${respError}`);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Manual sync error:', error);
    res.status(500).json({ error: 'Failed to sync post', details: error.message });
  }
});

// Download Source Code Endpoint
app.get('/api/download-source', (req, res) => {
  try {
    const zip = new AdmZip();
    
    // Add directories
    if (fs.existsSync('./src')) {
      zip.addLocalFolder('./src', 'src');
    }
    
    // Add root files
    const filesToInclude = [
      'package.json',
      'server.ts',
      'tsconfig.json',
      'vite.config.ts',
      'index.html',
      'metadata.json',
      '.env.example',
      '.gitignore'
    ];
    
    filesToInclude.forEach(file => {
      if (fs.existsSync(file)) {
        zip.addLocalFile(file);
      }
    });
    
    const zipBuffer = zip.toBuffer();
    
    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', 'attachment; filename="globalpulse-news-source.zip"');
    res.set('Content-Length', zipBuffer.length.toString());
    
    res.send(zipBuffer);
  } catch (error) {
    console.error('Error generating zip:', error);
    res.status(500).json({ error: 'Failed to generate zip file' });
  }
});

// Seed some initial data if empty
const count = (db.prepare('SELECT COUNT(*) as count FROM posts').get() as any).count;
if (count === 0) {
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
    },
    {
      title: 'Mercados globais reagem positivamente a novos dados de inflação',
      subtitle: 'Bolsas asiáticas e europeias fecham em alta após relatório do Fed.',
      content: '<p>Os mercados financeiros globais tiveram um dia de forte alta nesta terça-feira. O otimismo foi impulsionado pelos novos dados de inflação divulgados pelo Federal Reserve (Fed), que vieram abaixo do esperado pelos analistas.</p><p>Investidores agora apostam em uma possível redução na taxa de juros americana antes do final do ano. O setor de tecnologia foi o principal beneficiado, liderando os ganhos nas bolsas de Nova York.</p>',
      image: 'https://picsum.photos/seed/economy1/1200/600',
      category: 'Economia',
      tags: 'mercados,inflacao,fed,bolsas',
      source: 'Reuters',
      slug: 'mercados-globais-reagem-positivamente-inflacao'
    },
    {
      title: 'Nova IA promete revolucionar diagnósticos médicos',
      subtitle: 'Sistema desenvolvido por consórcio europeu atinge 99% de precisão em testes iniciais.',
      content: '<p>Um novo sistema de Inteligência Artificial, desenvolvido por um consórcio de universidades europeias, demonstrou resultados impressionantes na detecção precoce de doenças raras.</p><p>A tecnologia utiliza redes neurais profundas para analisar exames de imagem e cruzar dados com um vasto banco de históricos médicos. Hospitais no Reino Unido e na Alemanha já planejam integrar a ferramenta em seus fluxos de trabalho a partir do próximo ano.</p>',
      image: 'https://picsum.photos/seed/tech1/1200/600',
      category: 'Tecnologia',
      tags: 'ia,saude,inovacao,medicina',
      source: 'BBC Tech',
      slug: 'nova-ia-promete-revolucionar-diagnosticos'
    },
    {
      title: 'Final da Champions League será sediada em nova arena sustentável',
      subtitle: 'UEFA anuncia mudança de local visando reduzir pegada de carbono do evento.',
      content: '<p>A UEFA anunciou hoje que a próxima final da Champions League acontecerá em uma arena recém-inaugurada que opera 100% com energia renovável.</p><p>A decisão faz parte do novo plano de sustentabilidade da organização, que visa zerar as emissões de carbono de seus principais eventos até 2030. A arena conta com painéis solares na cobertura e um sistema avançado de captação de água da chuva.</p>',
      image: 'https://picsum.photos/seed/sports1/1200/600',
      category: 'Esportes',
      tags: 'futebol,champions,sustentabilidade',
      source: 'The Guardian Sports',
      slug: 'final-champions-league-arena-sustentavel'
    },
    {
      title: 'Cúpula do Clima termina com acordo histórico sobre emissões',
      subtitle: 'Países concordam em metas mais rígidas para a próxima década.',
      content: '<p>Após duas semanas de intensas negociações, a Cúpula do Clima foi encerrada com a assinatura de um acordo considerado histórico por ativistas ambientais.</p><p>As nações signatárias se comprometeram a reduzir suas emissões de gases de efeito estufa em 45% até 2030, em comparação com os níveis de 2010. Um fundo de compensação para países em desenvolvimento também foi estabelecido, com um aporte inicial de 100 bilhões de dólares.</p>',
      image: 'https://picsum.photos/seed/politics1/1200/600',
      category: 'Política',
      tags: 'clima,meio-ambiente,acordo,onu',
      source: 'Al Jazeera',
      slug: 'cupula-clima-termina-acordo-historico'
    }
  ];

  const insert = db.prepare(`
    INSERT INTO posts (title, subtitle, content, image, category, tags, source, slug)
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

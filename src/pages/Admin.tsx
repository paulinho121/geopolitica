import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Settings, Globe, Trash2, RefreshCcw, ExternalLink, Key } from 'lucide-react';

interface Post {
  id: number;
  title: string;
  category: string;
  created_at: string;
  views: number;
}

interface ApiSettings {
  webhookUrl: string;
  authHeader: string;
  autoPublish: boolean;
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'posts' | 'settings'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [settings, setSettings] = useState<ApiSettings>({
    webhookUrl: '',
    authHeader: '',
    autoPublish: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string>('sua-chave-secreta');

  const handleGenerateKey = () => {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    const keyStr = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    setGeneratedKey(`gpnews_${keyStr}`);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [postsRes, settingsRes] = await Promise.all([
        fetch('/api/posts?limit=50'),
        fetch('/api/settings')
      ]);
      const postsData = await postsRes.json();
      const settingsData = await settingsRes.json();
      
      setPosts(postsData.posts || []);
      setSettings({
        webhookUrl: settingsData.webhookUrl || '',
        authHeader: settingsData.authHeader || '',
        autoPublish: settingsData.autoPublish === true || settingsData.autoPublish === 'true'
      });
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error('Failed to save settings');
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta notícia?')) return;
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setPosts(posts.filter(p => p.id !== id));
    } catch (err) {
      alert('Erro ao excluir notícia.');
    }
  };

  const handleSyncPost = async (id: number) => {
    try {
      const res = await fetch(`/api/posts/${id}/sync`, { method: 'POST' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to sync');
      }
      alert('Notícia sincronizada com sucesso!');
    } catch (err: any) {
      alert(`Erro na sincronização: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="text-center py-20">Carregando painel de administração...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <Helmet>
        <title>Administração | GlobalPulse News</title>
      </Helmet>

      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-8 h-8 text-blue-700" />
        <h1 className="text-3xl font-bold font-serif text-gray-900">Manutenção do Site</h1>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('posts')}
              className={`w-1/2 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'posts'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Gerenciar Notícias
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-1/2 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sincronização / API
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'posts' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Últimas Publicações</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {posts.map((post) => (
                      <tr key={post.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {post.title.length > 50 ? post.title.substring(0, 50) + '...' : post.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{post.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(post.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => handleSyncPost(post.id)}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                              title="Sincronizar com Site Externo"
                            >
                              <RefreshCcw className="w-4 h-4" /> Sincronizar
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="text-red-600 hover:text-red-900 flex items-center gap-1"
                              title="Excluir Notícia"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {posts.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                          Nenhuma notícia encontrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Globe className="w-8 h-8 text-blue-700" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Integração Externa (Sua API)</h2>
                    <p className="text-gray-500 mt-1">
                      Forneça estes dados exatos na sua plataforma de postagem automática para que ela envie notícias para cá.
                    </p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 relative">
                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                      1. Webhook para Notificação (URL)
                    </label>
                    <p className="text-sm text-gray-500 mb-3">Copie essa URL e cole no campo "Webhook para Notificação" da plataforma externa.</p>
                    <div className="flex mt-1 relative">
                      <input
                        readOnly
                        value={`${window.location.origin}/api/webhook`}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white p-3 font-mono text-blue-700 font-medium"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/api/webhook`);
                          alert('URL do Webhook copiada!');
                        }}
                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 relative">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                      <Key className="w-4 h-4" /> 2. Header de Autenticação (Chave de API)
                    </label>
                    <p className="text-sm text-gray-500 mb-3">Copie esse texto exato e cole na plataforma externa para autorizar as postagens no seu site.</p>
                    <div className="flex mt-1 relative items-center gap-3">
                      <div className="flex-1">
                        <input
                          readOnly
                          value={`X-API-Key: ${generatedKey}`}
                          className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm bg-white p-3 font-mono text-green-700 font-medium border focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        onClick={handleGenerateKey}
                        className="inline-flex items-center justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        title="Gerar uma nova chave aleatória mais segura"
                      >
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Gerar Segura
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`X-API-Key: ${generatedKey}`);
                          alert('Chave de API copiada! Lembre-se de adicionar ' + generatedKey + ' nas configurações do Vercel.');
                        }}
                        className="inline-flex justify-center py-2 px-4 shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Copiar
                      </button>
                    </div>
                    
                    {generatedKey !== 'sua-chave-secreta' && (
                      <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 text-sm rounded-md border border-yellow-200">
                        <strong>⚠️ Aviso Importante:</strong> Como você gerou uma chave personalizada mais segura, o seu servidor precisa saber dela! Vá no painel do <strong>Vercel</strong> (Settings &gt; Environment Variables) e crie uma variável exatamente assim:
                        <div className="mt-2 bg-white p-3 rounded border border-yellow-300 font-mono text-xs">
                          Name: <strong>WEBHOOK_API_KEY</strong> <br/>
                          Value: <strong>{generatedKey}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 bg-blue-50 p-6 rounded-lg text-sm text-blue-800 border border-blue-100">
                  <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <RefreshCcw className="w-5 h-5" />
                    Como funciona?
                  </h3>
                  <p className="mb-2">A plataforma de postagem automatizada (Ex: Labnews/Vercel) precisa saber <strong>onde aplicar o texto gerado</strong> e provar que <strong>tem permissão</strong> para isso.</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Sempre que uma inteligência artificial terminar de escrever um texto, ela chamará sua URL acima.</li>
                    <li>O seu site filtrará a chamada checando se ela contém exatamente <code>X-API-Key: sua-chave-secreta</code>.</li>
                    <li>Se sim, seu site cria a postagem instantaneamente no banco de dados. Se não, a tentativa é classificada como bloqueada.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

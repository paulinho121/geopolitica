import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Settings, Globe, Trash2, RefreshCcw, ExternalLink } from 'lucide-react';

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
            <div className="max-w-2xl mx-auto">
              {message && (
                <div className={`mb-6 p-4 rounded border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  {message.text}
                </div>
              )}
              
              <div className="bg-[#0f111a] p-6 rounded-xl text-white shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="w-6 h-6 text-blue-400" />
                  <h2 className="text-xl font-bold">Configurar Site Externo (PHP/API)</h2>
                </div>
                <p className="text-gray-400 text-sm mb-6">Insira suas credenciais de API para conectar ao Site Externo (PHP/API)</p>

                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                      Webhook para Notificação
                    </label>
                    <input
                      type="url"
                      value={settings.webhookUrl}
                      onChange={e => setSettings({...settings, webhookUrl: e.target.value})}
                      placeholder="https://seu-site.com/api/webhook.php"
                      className="w-full bg-[#1a1d27] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                      Header de Autenticação (Opcional)
                    </label>
                    <input
                      type="text"
                      value={settings.authHeader}
                      onChange={e => setSettings({...settings, authHeader: e.target.value})}
                      placeholder="X-API-Key: sua-chave"
                      className="w-full bg-[#1a1d27] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                  </div>

                  <div className="bg-[#1a1d27] border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Publicação Automática</h3>
                      <p className="text-gray-400 text-sm">Publicar posts automaticamente nesta plataforma</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={settings.autoPublish}
                        onChange={e => setSettings({...settings, autoPublish: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-6 border-t border-gray-800">
                    <button type="button" className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors text-blue-400 hover:text-blue-300">
                      <ExternalLink className="w-4 h-4" /> Ver Documentação
                    </button>
                    <div className="flex gap-3">
                      <button 
                        type="button" 
                        onClick={() => fetchData()}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0f111a] focus:ring-blue-500 disabled:opacity-50"
                      >
                        {saving ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

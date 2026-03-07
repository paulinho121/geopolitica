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
  publicUrl: string;
  incomingWebhookKey: string;
  supabaseFunctionUrl?: string;
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'posts' | 'settings'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [settings, setSettings] = useState<ApiSettings>({
    webhookUrl: '',
    authHeader: '',
    autoPublish: false,
    publicUrl: '',
    incomingWebhookKey: 'sua-chave-secreta',
    supabaseFunctionUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [testing, setTesting] = useState(false);

  const handleTestWebhook = async () => {
    setTesting(true);
    setMessage(null);
    try {
      // Use the public URL if provided, otherwise fallback to current origin
      const baseUrl = settings.publicUrl || window.location.origin;
      // The new endpoint we created in server.ts
      const testUrl = `${baseUrl}/api/webhook-news`;
      
      const payload = {
        event: "post_created",
        post: {
          id: `test-${Date.now()}`,
          title: "Notícia de Teste (IA)",
          content: "<p>Esta é uma notícia enviada automaticamente para testar a conexão do seu site com o Supabase/IA.</p>",
          excerpt: "Resumo do teste de conexão.",
          image_url: "https://picsum.photos/seed/test/1200/600",
          tags: ["teste", "conexao"],
          keywords: ["ia", "automatico"],
          source_url: "https://google.com"
        }
      };

      const res = await fetch(testUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Webhook-Secret': 'GP_SECURE_KEY_7788'
        },
        body: JSON.stringify(payload)
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Servidor retornou erro inesperado (HTML/Texto). Verifique se o backend está rodando.`);
      }

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || 'Falha na conexão');
      }

      setMessage({ type: 'success', text: 'Conexão confirmada! Notícia de teste inserida com sucesso.' });
      fetchData(); // Refresh list
    } catch (err: any) {
      setMessage({ type: 'error', text: `Erro de conexão: ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  const handleGenerateKey = () => {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    const keyStr = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    setSettings(prev => ({ ...prev, incomingWebhookKey: `gpnews_${keyStr}` }));
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
        autoPublish: settingsData.autoPublish === true || settingsData.autoPublish === 'true',
        publicUrl: settingsData.publicUrl || '',
        incomingWebhookKey: settingsData.incomingWebhookKey || 'sua-chave-secreta',
        supabaseFunctionUrl: settingsData.supabaseFunctionUrl || ''
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
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || `Erro do Servidor (${res.status})`);
      }
      
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: `Erro ao salvar: ${err.message}` });
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
              {message && (
                <div className={`mb-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {message.text}
                </div>
              )}
              
              <form onSubmit={handleSaveSettings} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                
                {/* 1. Integração Externa (Entrada) */}
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

                <div className="space-y-8 mb-12">
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 relative">
                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                       Link da sua Função Supabase (Edge Function)
                    </label>
                    <p className="text-sm text-blue-800 mb-3">Cole aqui a URL da função que você criou no Supabase (ex: https://.../webhook-news)</p>
                    <input
                      type="text"
                      placeholder="https://qxaqlqivyeahadjtauvo.supabase.co/functions/v1/webhook-news"
                      value={settings.supabaseFunctionUrl}
                      onChange={e => setSettings({...settings, supabaseFunctionUrl: e.target.value})}
                      className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white p-3 border"
                    />
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 relative">
                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                      Domínio Público do seu Site (Opcional)
                    </label>
                    <p className="text-sm text-gray-500 mb-3">Se o seu site está na Vercel, cole o link aqui. Se vazio, usará localhost.</p>
                    <input
                      type="text"
                      placeholder="Ex: https://meusite-news.vercel.app"
                      value={settings.publicUrl}
                      onChange={e => setSettings({...settings, publicUrl: e.target.value})}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white p-3 border"
                    />
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 relative">
                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                      1. Webhook para Notificação (URL)
                    </label>
                    <p className="text-sm text-gray-500 mb-3">Copie essa URL e cole no campo "Webhook para Notificação" da plataforma externa.</p>
                    <div className="flex mt-1 relative">
                      <input
                        readOnly
                        value={settings.supabaseFunctionUrl || `${settings.publicUrl || window.location.origin}/api/webhook-news`}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white p-3 font-mono text-blue-700 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = settings.supabaseFunctionUrl || `${settings.publicUrl || window.location.origin}/api/webhook-news`;
                          navigator.clipboard.writeText(url);
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
                          value={`X-Webhook-Secret: GP_SECURE_KEY_7788`}
                          className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm bg-white p-3 font-mono text-green-700 font-medium border focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`X-Webhook-Secret: GP_SECURE_KEY_7788`);
                          alert('Chave secreta copiada!');
                        }}
                        className="inline-flex justify-center py-2 px-4 shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleTestWebhook}
                      disabled={testing}
                      className="flex-1 flex justify-center items-center gap-2 py-3 px-4 border border-blue-200 rounded-md shadow-sm text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
                    >
                      {testing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : '🚀 Testar Conexão com IA (Simular Post)'}
                    </button>
                  </div>
                </div>

                {/* 1.1 Sincronização Manual (Pull) */}
                <div className="bg-orange-50 p-6 rounded-lg border border-orange-100 mb-12">
                   <h3 className="text-lg font-bold text-orange-900 mb-2 flex items-center gap-2">
                     <RefreshCcw className="w-5 h-5" /> Sincronização Manual (Pull)
                   </h3>
                   <p className="text-sm text-orange-800 mb-4">
                     Se alguma notícia falhou no Webhook, você pode puxar manualmente do Supabase.
                   </p>
                   <button
                     type="button"
                     onClick={async () => {
                       if (!settings.publicUrl && !confirm('Você não definiu uma URL Pública. Deseja tentar sincronizar localmente?')) return;
                       setLoading(true);
                       try {
                         const res = await fetch('/api/sync-pull', {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({
                             supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
                             apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                             jwtToken: import.meta.env.VITE_SUPABASE_ANON_KEY // Using anon key as token for simplicity just like in sync-news.ts
                           })
                         });
                         const data = await res.json();
                         alert(`Sincronização concluída! ${data.imported || 0} novas notícias importadas.`);
                         fetchData();
                       } catch (e: any) {
                         alert('Erro: ' + e.message);
                       } finally {
                         setLoading(false);
                       }
                     }}
                     className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded font-bold transition-colors"
                   >
                     Buscar Novas Notícias Agora
                   </button>
                </div>

                {/* 2. Sincronização Outbound */}
                <div className="flex items-center gap-3 mb-6 pt-6 border-t border-gray-100">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <ExternalLink className="w-8 h-8 text-purple-700" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Enviar para Plataforma Externa</h2>
                    <p className="text-gray-500 mt-1">
                      Configure para onde enviar as notícias publicadas localmente.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL de Destino (Webhook URL)</label>
                    <input
                      type="url"
                      placeholder="https://api.siteexterno.com/v1/posts"
                      value={settings.webhookUrl}
                      onChange={e => setSettings({...settings, webhookUrl: e.target.value})}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-3 border"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cabeçalho de Autenticação (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Authorization: Bearer seu-token-aqui"
                      value={settings.authHeader}
                      onChange={e => setSettings({...settings, authHeader: e.target.value})}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-3 border font-mono text-sm"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      id="autoPublish"
                      type="checkbox"
                      checked={settings.autoPublish}
                      onChange={e => setSettings({...settings, autoPublish: e.target.checked})}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="autoPublish" className="ml-2 block text-sm text-gray-900">
                      Publicar automaticamente em plataforma externa ao criar nova notícia
                    </label>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                  >
                    {saving ? 'Salvando...' : 'Salvar Todas as Configurações'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

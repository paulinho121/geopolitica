/**
 * LabNews API Client - Integração Simples (Node.js/TypeScript version)
 */
export class LabNewsAPI {
  private url: string;
  private key: string;
  private token: string;

  constructor(url?: string, key?: string, token?: string) {
    this.url = url || import.meta.env.VITE_SUPABASE_URL || '';
    this.key = key || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    this.token = token || import.meta.env.VITE_SUPABASE_JWT_TOKEN || this.key;
  }

  async getLatestNews(limit: number = 10) {
    const endpoint = `${this.url}/rest/v1/feed_items`;
    const params = new URLSearchParams({
      'select': 'rewritten_title,rewritten_content,rewritten_image,slug,meta_description,id,created_at,tags,keywords,source_url',
      'status': 'eq.success',
      'order': 'created_at.desc',
      'limit': String(limit)
    });

    try {
      const response = await fetch(`${endpoint}?${params.toString()}`, {
        method: 'GET',
        headers: {
          "apikey": this.key,
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`LabNews API error: ${response.status} - ${await response.text()}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching from LabNews:', error);
      throw error;
    }
  }
}

// Singleton instance for easy use
export const labNews = new LabNewsAPI();

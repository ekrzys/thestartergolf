// v2
export const config = { runtime: 'nodejs18.x' };
export default async function handler(req, res) {
  const urlObj = new URL(req.url, 'https://thestartergolf.vercel.app');
const url = urlObj.searchParams.get('url');
const category = urlObj.searchParams.get('category');

  if (category) {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/headlines?category=eq.${category}&order=fetched_at.desc&limit=50`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        }
      );
      const data = await resp.json();
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json(data);
    } catch(err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (!url) return res.status(400).json({ error: 'No URL or category provided' });
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Referer': 'https://www.google.com/',
      }
    });
    const text = await response.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(text);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

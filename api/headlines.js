const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  const { category } = req.query;
  if (!category) return res.status(400).json({ error: 'No category provided' });

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
    res.status(200).json(data);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
}

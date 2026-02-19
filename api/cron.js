const FEEDS = [
  { category: 'pga', source: 'ESPN Golf', url: 'https://www.espn.com/espn/rss/golf/news' },
  { category: 'pga', source: 'Global Golf Post', url: 'https://globalgolfpost.com/feed' },
  { category: 'pga', source: 'Geoff Shackelford', url: 'https://geoffshackelford.com/homepage/rss.xml' },
  { category: 'dp', source: 'ESPN Golf', url: 'https://www.espn.com/espn/rss/golf/news' },
  { category: 'dp', source: 'Global Golf Post', url: 'https://globalgolfpost.com/feed' },
  { category: 'liv', source: 'ESPN Golf', url: 'https://www.espn.com/espn/rss/golf/news' },
  { category: 'liv', source: 'Global Golf Post', url: 'https://globalgolfpost.com/feed' },
  { category: 'majors', source: 'ESPN Golf', url: 'https://www.espn.com/espn/rss/golf/news' },
  { category: 'majors', source: 'Global Golf Post', url: 'https://globalgolfpost.com/feed' },
  { category: 'amateur', source: 'ESPN Golf', url: 'https://www.espn.com/espn/rss/golf/news' },
  { category: 'amateur', source: 'Global Golf Post', url: 'https://globalgolfpost.com/feed' },
  { category: 'juniors', source: 'ESPN Golf', url: 'https://www.espn.com/espn/rss/golf/news' },
  { category: 'instruction', source: 'Geoff Shackelford', url: 'https://geoffshackelford.com/homepage/rss.xml' },
  { category: 'instruction', source: 'Global Golf Post', url: 'https://globalgolfpost.com/feed' },
  { category: 'equipment', source: 'ESPN Golf', url: 'https://www.espn.com/espn/rss/golf/news' },
  { category: 'equipment', source: 'Global Golf Post', url: 'https://globalgolfpost.com/feed' },
  { category: 'architecture', source: 'Geoff Shackelford', url: 'https://geoffshackelford.com/homepage/rss.xml' },
  { category: 'architecture', source: 'Global Golf Post', url: 'https://globalgolfpost.com/feed' },
  { category: 'travel', source: 'Global Golf Post', url: 'https://globalgolfpost.com/feed' },
  { category: 'travel', source: 'Geoff Shackelford', url: 'https://geoffshackelford.com/homepage/rss.xml' },
];

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

async function fetchFeed(url) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.google.com/',
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const resp = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeout);
    const text = await resp.text();
    const items = [];
    const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/g);
    for (const match of itemMatches) {
      const item = match[1];
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] || item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[2] || '';
      const link = item.match(/<link>(.*?)<\/link>|<link\/>(.*?)|<guid>(.*?)<\/guid>/)?.[1] || item.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] || '';
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      if (title && link) items.push({ title: title.trim(), link: link.trim(), pubDate: pubDate.trim() });
      if (items.length >= 8) break;
    }
    return items;
  } catch(e) {
    clearTimeout(timeout);
    return [];
  }
}

async function saveToSupabase(headlines) {
  if (!headlines.length) return;
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/headlines`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(headlines),
  });
  return resp.ok;
}

async function clearOldHeadlines() {
  await fetch(`${SUPABASE_URL}/rest/v1/headlines?id=gt.0`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
}

export default async function handler(req, res) {
  try {
    await clearOldHeadlines();
    const allHeadlines = [];
    for (const feed of FEEDS) {
      const items = await fetchFeed(feed.url);
      for (const item of items) {
        allHeadlines.push({
          category: feed.category,
          source: feed.source,
          title: item.title,
          link: item.link,
          pub_date: item.pubDate,
        });
      }
    }
    await saveToSupabase(allHeadlines);
    res.status(200).json({ success: true, count: allHeadlines.length });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
}

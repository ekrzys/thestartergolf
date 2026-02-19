export default async function handler(req, res) {
  res.status(200).json({ message: 'Use /api/feed?category=pga instead' });
}

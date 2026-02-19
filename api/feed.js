export  default async function handler(req, res) {
  res.status(200).json({ 
    reqUrl: req.url,
    reqQuery:  req.query,
    reqHeaders: req.headers
  });
}

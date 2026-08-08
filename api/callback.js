// OAuth-прокси для Decap CMS: получение токена и возврат в панель
export default async function handler(req, res) {
  const { code, state } = req.query;
  if (!code) return res.status(400).send('No code');
  let st = { s: '', r: '/' };
  try {
    st = JSON.parse(Buffer.from(String(state || ''), 'base64url').toString());
  } catch (_) {}
  const r = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const data = await r.json();
  if (data.error) return res.status(400).send(data.error_description || data.error);
  const target = st.r || '/';
  const sep = target.includes('#') ? '&' : '#';
  res.redirect(`${target}${sep}access_token=${data.access_token}&token_type=bearer&scope=${encodeURIComponent(data.scope || '')}`);
}

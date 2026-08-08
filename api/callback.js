// OAuth-прокси для Decap CMS: обмен code на токен и возврат через postMessage
// targetOrigin админки восстанавливается из site_id (переданного через state в auth)
export default async function handler(req, res) {
  const { code, state, provider = 'github' } = req.query;
  if (!code) return res.status(400).send('No code');

  let siteId = '';
  try {
    siteId = JSON.parse(Buffer.from(String(state || ''), 'base64url').toString()).site_id || '';
  } catch (_) {}
  // origin админки: https://<site_id>; для localhost подстраховка через referrer
  let targetOrigin = siteId ? `https://${siteId}` : '';
  if (!targetOrigin) {
    const ref = req.headers.referer || req.headers.referrer || '';
    if (ref) {
      try { targetOrigin = new URL(ref).origin; } catch (_) {}
    }
  }
  if (!targetOrigin) targetOrigin = 'https://horelkinai.github.io';

  const sendPage = (title, text, msg) => {
    const html = `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:sans-serif;text-align:center;padding-top:40px;color:#333">
<p>${text}</p>
<script>
(function () {
  var provider = ${JSON.stringify(provider)};
  var targetOrigin = ${JSON.stringify(targetOrigin)};
  if (window.opener) {
    window.opener.postMessage('authorization:' + provider + ':' + ${JSON.stringify(msg.kind)} + ':' + ${JSON.stringify(msg.payload)}, targetOrigin);
  }
})();
<\/script>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  };

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
  if (data.error) {
    return sendPage('Ошибка авторизации',
      'Не удалось авторизоваться: ' + (data.error_description || data.error) + '. Это окно можно закрыть и попробовать ещё раз.',
      { kind: 'error', payload: JSON.stringify({ message: data.error_description || data.error }) });
  }

  return sendPage('Готово',
    '✅ Авторизация прошла успешно. Это окно можно закрыть.',
    { kind: 'success', payload: JSON.stringify({ token: data.access_token, provider, scope: data.scope || '' }) });
}

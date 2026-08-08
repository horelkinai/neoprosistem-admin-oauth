// OAuth-прокси: обмен code на токен.
// - popup-режим: postMessage 'authorization:<provider>:success|error:payload' в opener
// - redirect-режим (return_url в state): редирект на return_url#token=... / #error=...
export default async function handler(req, res) {
  const { code, state, provider = 'github' } = req.query;
  if (!code) return res.status(400).send('No code');

  let siteId = '';
  let returnUrl = '';
  try {
    const st = JSON.parse(Buffer.from(String(state || ''), 'base64url').toString());
    siteId = st.site_id || '';
    returnUrl = st.return_url || '';
  } catch (_) {}
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
    if (returnUrl) {
      return res.redirect(returnUrl + '#error=' + encodeURIComponent(data.error_description || data.error));
    }
    return sendPage('Ошибка авторизации',
      'Не удалось авторизоваться: ' + (data.error_description || data.error) + '. Это окно можно закрыть и попробовать ещё раз.',
      { kind: 'error', payload: JSON.stringify({ message: data.error_description || data.error }) });
  }

  if (returnUrl) {
    // редирект-режим: токен в hash (hash не уходит на сервер)
    return res.redirect(returnUrl + '#token=' + encodeURIComponent(data.access_token) + '&provider=github');
  }

  return sendPage('Готово',
    '✅ Авторизация прошла успешно. Это окно можно закрыть.',
    { kind: 'success', payload: JSON.stringify({ token: data.access_token, provider, scope: data.scope || '' }) });
}

// OAuth-прокси для Decap CMS (Netlify popup-протокол)
// Отдаёт HTML-страницу (popup), которая:
//  1) шлёт opener'у postMessage 'authorizing:<provider>'
//  2) редиректит на GitHub authorize (site_id прокидывается через state)
export default function handler(req, res) {
  const { provider = 'github', scope = 'repo', site_id = '' } = req.query;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || 'localhost';
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return res.status(500).send('GITHUB_CLIENT_ID is not set');
  }

  const redirectUri = `${proto}://${host}/api/callback`;
  const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('scope', scope);
  // Прокидываем site_id (хост админки) через state, чтобы callback знал origin для postMessage
  authorizeUrl.searchParams.set('state', Buffer.from(JSON.stringify({ site_id })).toString('base64url'));

  const html = `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"><title>Авторизация GitHub</title></head>
<body style="font-family:sans-serif;text-align:center;padding-top:40px;color:#333">
<p>Подключение к GitHub…</p>
<script>
(function () {
  var provider = ${JSON.stringify(provider)};
  var targetOrigin = ${JSON.stringify('https://' + site_id)};
  if (window.opener) {
    window.opener.postMessage('authorizing:' + provider, targetOrigin);
  }
  window.location.replace(${JSON.stringify(authorizeUrl.toString())});
})();
<\/script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}

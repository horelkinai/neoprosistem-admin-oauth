// OAuth-прокси для Decap CMS: обмен code на токен и возврат через postMessage
export default async function handler(req, res) {
  const { code, provider = 'github' } = req.query;
  if (!code) return res.status(400).send('No code');

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
    const err = JSON.stringify({ message: data.error_description || data.error });
    const htmlErr = `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>Ошибка авторизации</title></head>
<body style="font-family:sans-serif;text-align:center;padding-top:40px;color:#b00020">
<p>Не удалось авторизоваться: ${data.error_description || data.error}</p>
<p>Это окно можно закрыть и попробовать ещё раз.</p>
<script>
(function () {
  var provider = ${JSON.stringify(provider)};
  var targetOrigin = (function () {
    try { return new URL(document.referrer).origin; } catch (e) {}
    return 'https://horelkinai.github.io';
  })();
  if (window.opener) {
    window.opener.postMessage('authorization:' + provider + ':error:' + ${JSON.stringify(err)}, targetOrigin);
  }
})();
<\/script>
</body></html>`;
    return res.status(200).send(htmlErr);
  }

  const payload = JSON.stringify({
    token: data.access_token,
    provider,
    scope: data.scope || '',
  });

  const html = `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"><title>Готово</title></head>
<body style="font-family:sans-serif;text-align:center;padding-top:40px;color:#333">
<p style="font-size:18px">✅ Авторизация прошла успешно.</p>
<p>Это окно можно закрыть.</p>
<script>
(function () {
  var provider = ${JSON.stringify(provider)};
  var targetOrigin = (function () {
    try { return new URL(document.referrer).origin; } catch (e) {}
    return 'https://horelkinai.github.io';
  })();
  if (window.opener) {
    window.opener.postMessage('authorization:' + provider + ':success:' + ${JSON.stringify(payload)}, targetOrigin);
  }
})();
<\/script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}

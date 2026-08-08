// OAuth-прокси для Decap CMS: начало авторизации GitHub
export default function handler(req, res) {
  const { scope = 'repo', state = '', redirect_uri = '' } = req.query;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || 'localhost';
  // Запоминаем адрес, куда Decap должен вернуться после входа
  const ghState = Buffer.from(JSON.stringify({ s: state, r: redirect_uri })).toString('base64url');
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    scope,
    state: ghState,
    redirect_uri: `${proto}://${host}/api/callback`,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
}

# NEO PRO SISTEM — OAuth-прокси для панели Decap CMS

Vercel Serverless-прокси для входа в Decap CMS через GitHub (popup + postMessage-протокол Decap).

## Как работает
1. Панель `https://horelkinai.github.io/admin/` открывает popup на `/api/auth?provider=github&scope=repo`.
2. `/api/auth` отдаёт HTML: шлёт opener'у `postMessage('authorizing:github')` и редиректит на GitHub authorize.
3. GitHub редиректит на `/api/callback?code=...`; прокси обменивает code на токен.
4. `/api/callback` отдаёт HTML с `postMessage('authorization:github:success:{token,...}')` в opener — Decap принимает токен и открывает панель.

## Конфиг панели (admin/config.yml)
```yaml
backend:
  name: github
  repo: horelkinai/horelkinai.github.io
  branch: main
  base_url: https://neoprosistem-admin-oauth.vercel.app
  auth_endpoint: api/auth
```
`base_url` обязательно БЕЗ пути — Decap сравнивает его с `event.origin`.

## Деплой на Vercel (API)
```bash
curl -X POST https://api.vercel.com/v13/deployments \
  -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"neoprosistem-admin-oauth","project":"neoprosistem-admin-oauth","target":"production","files":[...]}'
```
Env: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.

## GitHub OAuth App
https://github.com/settings/developers → New OAuth App:
- Homepage URL: `https://horelkinai.github.io/`
- Authorization callback URL: `https://neoprosistem-admin-oauth.vercel.app/api/callback`

# NEO PRO SISTEM — OAuth-прокси для панели Decap CMS

Vercel Serverless-прокси для входа в Decap CMS через GitHub.

## Деплой на Vercel
1. vercel.com → Sign up with GitHub
2. Add New → Project → Import `neoprosistem-admin-oauth` → Deploy
3. Settings → Environment Variables:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
4. Redeploy

## GitHub OAuth App
https://github.com/settings/developers → New OAuth App:
- Homepage URL: `https://horelkinai.github.io/`
- Authorization callback URL: `https://<ваш-проект>.vercel.app/api/callback`

# Pulsar — site

Landing imersiva do Pulsar (AG Consultoria). Estático, com build só de minificação.

- `index.html` — DOM
- `style.css` — estilos
- `app.js` — engine (scroll, WebGL, som, coreografia)

Fonte de verdade: os três arquivos da raiz, comentados. O que vai ao ar é `dist/`, gerado por
`npm run build` (`scripts/build.mjs`) sem nenhum comentário; o build falha se sobrar algum.

Deploy: Vercel (projeto `pulsar-site`) pela CLI; `vercel.json` manda rodar `npm ci` + `npm run build` e publicar `dist/`.


# Pulsar — site

Landing imersiva do Pulsar (AG Consultoria). Estático, sem build.

- `index.html` — DOM
- `style.css` — estilos
- `app.js` — engine (scroll, WebGL, som, coreografia)

Fonte de verdade: `../pulsar.html` (arquivo único, fontes embutidas, zero dependência).
Este `dist/` é a cópia de produção: fontes vêm do CDN e o CSS/JS saem em arquivos separados.

Deploy: Vercel (projeto `pulsar-site`), framework "Other", sem build command, output = raiz.

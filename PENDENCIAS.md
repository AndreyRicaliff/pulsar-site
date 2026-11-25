# Pendências — pulsar-site

Repo público: nada sensível aqui (credencial, dado pessoal, caminho de exploração vai em `C:\CODE\PENDENCIAS.md`).

- 2026-11-25 — **Aplicar a adaptação de inspiração (INSPIRACAO.md §6) DEPOIS do tema claro
  aterrissar.** A base nova vem da branch `claude/tema-branco-7d60a4` (PR do tema claro). Aplicar
  em cima do dark seria retrabalho. Ordem sugerida no §6 do INSPIRACAO.md.
- 2026-11-25 — **Fontes sem versão fixa no CDN.** `style.css:1-2` carrega `@fontsource-variable/inter` e
  `space-grotesk` do jsdelivr sem `@versão`: uma publicação nova do pacote muda a fonte do site sem commit.
  Fixar a versão (ou servir os `.woff2` do próprio repositório).
- 2026-11-25 — **Sem CSP nem X-Frame-Options.** `vercel.json` só manda `nosniff` e `Referrer-Policy`. Site sem
  formulário nem login, risco baixo; ainda assim falta `Content-Security-Policy` (script/style self + jsdelivr) e
  `frame-ancestors 'none'`.
- 2026-11-25 — **Modal "Saiba mais" sem gestão de foco.** `app.js` abre o modal sem levar o foco para dentro,
  sem prender o Tab e sem devolver o foco ao botão ao fechar (o Esc já fecha). Teclado e leitor de tela se perdem.
- 2026-11-25 — **Placeholders ainda no ar.** `index.html:6` tem `noindex` ("tirar quando os contatos reais
  entrarem") e os links sociais do menu e do rodapé são `href="#"`. Depende dos contatos reais (Ricaliff).
- 2026-11-25 — **`app.js` com ~830 linhas e várias responsabilidades** (som, scroll, GL, canvases, demos, modal).
  Separar em módulos por domínio quando houver a próxima feature grande.
- 2026-11-25 — **CTA com gradiente x porta v4.** A skill `corporativo` (porta v4, 25/08) pede CTA sólido na porta
  pública; o site mantém o gradiente `#7048E8→#A55EFF` no hero e nos CTAs por pedido explícito desta tarefa.
  Decidir se a landing entra na porta v4 (Fraunces, CTA sólido) ou fica como exceção registrada.
- 2026-11-25 — **Header fixo sobrepõe o rótulo das seções sticky.** O logo do header (canto superior esquerdo)
  cai em cima do `Sec__label` e, no celular, do título da seção (ex.: "Na palma da sua mão", "Ecossistema").
  Já acontecia no tema escuro; é ajuste de layout (respiro no topo das seções), fora do escopo do tema claro.

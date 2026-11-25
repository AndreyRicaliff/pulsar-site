# Pendências — pulsar-site

- 2026-11-25 — **Aplicar a adaptação de inspiração (INSPIRACAO.md §6) DEPOIS do tema claro
  aterrissar.** A base nova vem da branch `claude/tema-branco-7d60a4` (sessão própria, em
  andamento, sem commit até 25/11). Aplicar em cima do dark atual seria retrabalho. Ordem
  sugerida no §6 do INSPIRACAO.md.
- 2026-11-25 — **Criar `trilho.json` no PR da aplicação do restyle** (tipo `produto-interno`).
  Não nasceu no PR de docs porque o site publica a raiz do repo na Vercel e o trilho precisa
  entrar junto com o `.vercelignore` + conferência de 404 pós-deploy — e o deploy daqui é por
  CLI, sem auto-deploy que permita conferir agora.
- 2026-11-25 — **Conferir drift repo × produção antes do próximo deploy** (deploy por CLI sem
  link com GitHub — aviso do CLAUDE.md do projeto).

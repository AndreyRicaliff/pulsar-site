<!-- Area de trabalho deste projeto. Carregado automaticamente em toda sessao aberta nesta pasta. -->

# Pulsar Site

Site institucional, em producao. **Repo PUBLICO.**

## Estado (18/08/2026)

Ate 18/08 este repo **nao tinha copia local** - existia so no GitHub, o que impedia auditar ou
corrigir daqui. Foi clonado nesse dia. Sao 5 arquivos e 10 commits.

Deploy: esta entre os projetos Vercel que sobem **por CLI, sem link com o GitHub** - a causa
estrutural do drift repo != prod que ja congelou o hub `Ricaliff` por 6 semanas. Antes de mudar,
conferir o que esta no ar contra o HEAD do repo.

Auditado em 18/08 (todas as refs; chave, JWT, senha, CPF/CNPJ, e-mail, telefone): **zero achados**.
Como e publico, vale a regua: nada de dado real de cliente nem credencial, nem em comentario.

## Onde as coisas ficam

- Inventario de todos os projetos: `C:\CODE\PROJETOS.md`
- Regras da area e do ambiente: `C:\CODE\CLAUDE.md`
- Pendencia **sensivel** (credencial, PII, caminho de exploracao) vai em `C:\CODE\PENDENCIAS.md`, nunca no repo do projeto quando ele for publico -- o hook `auto-backup` da push sem revisao humana.

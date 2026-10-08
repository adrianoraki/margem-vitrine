# 0012: Limites do plano GitHub para repositório privado

**Contexto.** O kickoff pede um repositório privado com a `main` protegida, CodeQL, e coleta
horária "sem custo" no Actions. Em repositório privado no plano GitHub Free:

- **Proteção de branch e rulesets** não estão disponíveis. Exigem GitHub Pro ou Team.
- **CodeQL (code scanning)** e **secret scanning** exigem GitHub Advanced Security.
- **Actions** tem 2.000 minutos/mês. O coletor horário gasta de 720 a 1.440 min/mês (1–2 min
  por execução, e o GitHub arredonda cada job para cima no minuto). Somado ao CI, o limite
  estoura.
- **1 aprovação obrigatória** com `enforce_admins`: o GitHub não deixa o autor aprovar a própria
  PR. Sem um segundo revisor com escrita, nada é mesclado.

**Decisão.** Os arquivos ficam prontos para a configuração completa: workflows,
`configurar-repositorio.sh`, CODEOWNERS e Dependabot. A escolha de plano é do dono do repositório:

1. **GitHub Pro** (US$ 4/mês): proteção de branch e 3.000 min de Actions. O CodeQL continua
   indisponível no privado.
2. **Tornar o repositório público**: proteção, CodeQL e Actions ilimitados sem custo. Os limites
   são o código exposto e a desativação do cron após 60 dias sem atividade.
3. **Manter no Free**: sem proteção de verdade, e o coletor precisa rodar com menos frequência
   (ex.: a cada 2 h) para caber nos minutos.

O script de configuração aceita `APROVACOES=0`, para manter PR e CI obrigatórios sem revisor
enquanto houver uma pessoa só.

**Consequências.** Até a escolha, "sem push direto" e "CI obrigatório" dependem de disciplina, e
não do GitHub. O Dependabot (alertas e PRs de versão) funciona em qualquer plano.

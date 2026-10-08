#!/usr/bin/env bash
# Configura o repositório no GitHub: descrição, topics, segurança e proteção da main.
# Rode UMA vez, com o GitHub CLI autenticado como dono do repositório:
#
#   gh auth login
#   bash .github/scripts/configurar-repositorio.sh adrianoraki/margem-saas
#
# Idempotente: pode rodar de novo sem efeito colateral.
set -euo pipefail
REPO="${1:?uso: configurar-repositorio.sh dono/repositorio}"
# Aprovações exigidas. ATENÇÃO: o GitHub não deixa o autor aprovar a própria PR. Com 1 aprovação
# e enforce_admins, quem trabalha sozinho não consegue mesclar nada até ter um segundo revisor
# com acesso de escrita. Rode com APROVACOES=0 para manter PR + CI obrigatórios sem revisor.
APROVACOES="${APROVACOES:-1}"

echo "→ descrição e topics"
gh repo edit "$REPO" \
  --description "Radar de licitações e painel de compras para pequenas empresas" \
  --add-topic saas --add-topic licitacoes --add-topic nfe --add-topic supabase --add-topic nextjs \
  --enable-auto-merge=false --delete-branch-on-merge

echo "→ Dependabot: alertas e correções automáticas de segurança"
gh api -X PUT "repos/$REPO/vulnerability-alerts" >/dev/null
gh api -X PUT "repos/$REPO/automated-security-fixes" >/dev/null

echo "→ secret scanning e push protection (em repositório privado exige GitHub Advanced Security)"
gh api -X PATCH "repos/$REPO" --input - >/dev/null <<'JSON' || echo "  ! não disponível neste plano — veja docs/adr/0012"
{ "security_and_analysis": {
    "secret_scanning": { "status": "enabled" },
    "secret_scanning_push_protection": { "status": "enabled" } } }
JSON

echo "→ proteção da main: PR obrigatório, 1 aprovação, checks do CI verdes, sem push direto"
# Em repositório privado, exige plano GitHub Pro/Team (no Free, a API responde 403).
sed "s/APROVACOES_AQUI/$APROVACOES/" <<'JSON' | gh api -X PUT "repos/$REPO/branches/main/protection" --input - >/dev/null
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Lint, typecheck, testes e build",
      "Migrations e RLS",
      "Edge Functions (Deno)",
      "Fluxos críticos (Playwright)"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": APROVACOES_AQUI,
    "require_code_owner_reviews": true,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON

echo "→ segredos que os workflows esperam (valores NÃO são definidos aqui):"
for s in SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY VERCEL_TOKEN VERCEL_ORG_ID VERCEL_PROJECT_ID; do
  if gh secret list --repo "$REPO" | grep -q "^$s\b"; then echo "  ✓ $s"; else echo "  ✗ $s  → gh secret set $s --repo $REPO"; fi
done
echo "Pronto."

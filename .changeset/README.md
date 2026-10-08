# Changesets

Toda PR que muda comportamento de um pacote traz um changeset:

```bash
pnpm changeset
```

Escolha os pacotes afetados, o tipo (patch/minor/major) e escreva uma linha em português
dizendo o que muda para quem usa. `pnpm version-packages` consome os changesets e atualiza
versões e CHANGELOGs. Os pacotes são privados: nada é publicado no npm.

# Operação, backup, restauração e atualização

## Conteúdo

Entre por Access em `/admin` (local: `/entrar`). Crie artigo, título e slug; selecione a categoria, escreva no TipTap e preencha SEO. Visual/HTML/Pré-visualização são abas do editor. HTML é somente leitura, evitando importação de scripts.

Blocos especiais: clique para selecionar e edite os campos abaixo da área visual. No tutorial, adicione etapas, preencha título, descrição, URL da imagem e observações; use “Mover para cima” para reorganizar. Internamente, as etapas são preservadas em JSON, por exemplo:

```json
[{"title":"Abra a ferramenta","description":"Faça login no serviço escolhido.","image":"","notes":"Confira se está na conta correta."}]
```

Imagens: compartilhe manualmente no Drive com leitura pública, cole um link `file/d/ID/view`, `open?id=ID` ou `uc?id=ID`; descreva o texto alternativo e a legenda. Mídia registra apenas referências. Links de download são separados da prévia. Quando houver falha, verifique se é imagem, permissões e limites. Não existe proxy de contorno.

Salve/publice explicitamente. Agendamento usa data/hora local do navegador, convertida para UTC no armazenamento. Rascunhos têm autosave a cada 15 segundos com título e slug válidos. Revisões restauram somente o conteúdo do editor; salve após restaurar. Exclusão apaga conteúdo e revisões, com confirmação; para recuperar, use backup.

## Backup

Crie pasta `backups` fora do controle de versão, com acesso restrito. Com o ID de produção configurado:

```powershell
npx wrangler d1 export DB --remote --env production --output backups/infoblog-AAAA-MM-DD.sql
```

Guarde também o código versionado, configurações do Wrangler sem segredos, políticas Access e imagens originais do Drive. A exportação SQL contém conteúdo e configurações editoriais, não arquivos binários. Faça backup antes de migration e regularmente conforme o volume editorial. Confirme tamanho e abra o arquivo sem expor dados. Time Travel do D1 é complementar e tem retenção por plano; verifique no painel.

## Restauração segura

1. Não importe o backup sobre a base em uso sem ensaio. Crie um D1 separado de recuperação: `npx wrangler d1 create infonavidareal-recuperacao`.
2. Adicione um binding de recuperação em arquivo/configuração de ensaio. Use o banco vazio e importe o export com `wrangler d1 execute NOME-DO-BANCO --remote --file backups/arquivo.sql`. Leia a confirmação e confirme que é a base de recuperação, não a original.
3. Execute testes de contagem, artigos, blocos, categorias, mídia e configurações. A migration original não deve ser reaplicada antes de um dump que já inclui o schema.
4. Após validação e autorização operacional, troque o binding de produção para o banco restaurado e publique. Preserve o banco anterior para rollback; não o exclua durante recuperação.
5. Confira sitemap, Access, referências Drive, datas e anúncios desligados quando apropriado.

## Atualizações

Fixe o lockfile, crie branch, exporte backup e leia release notes oficiais. Atualize dependências de forma coordenada (todos os pacotes TipTap na mesma versão). Rode `npm ci`, `npm run check`, `npm test`, `npm run build`; teste migrations localmente e restauração em base separada. Teste editor, revisões, páginas públicas e autenticação antes do deploy autorizado. Nunca execute migrations destrutivas sem estratégia de recuperação.

## Limites e manutenção

Monitore Workers/D1 e erros sem registrar tokens/cookies. Reduza REVISION_LIMIT se necessário. Remova revisões órfãs apenas por rotina explícita com backup. Para acervo superior a 1.000 artigos, implemente sitemap index e arquivos paginados. Para mais de 100 resultados administrativos, use filtros ou implemente paginação. Conteúdo simultâneo não tem resolução de conflitos: coordene editores.

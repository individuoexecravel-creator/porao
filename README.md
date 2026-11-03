# O Porão

Ala de crimes reais do Indivíduo Execrável. Site em Hugo, publicado no GitHub Pages:
https://individuoexecravel-creator.github.io/porao/

## Publicar um caso novo (pelo GitHub, sem instalar nada)

1. Entre na pasta `content/casos`.
2. **Add file → Create new file**.
3. Nome do arquivo: o nome do caso, sem acento e com hífens. Ex.: `meninos-de-altamira.md`
4. Cole o modelo abaixo, preencha e clique em **Commit changes**.

```
---
title: "Nome do caso"
date: 2026-11-10
numero: 1
description: "Resumo do caso em uma ou duas frases."
local: "Altamira (PA)"
periodo: "1989–1993"
vitimas: ""
situacao: "Condenado"
capa: "img/casos/nome-do-arquivo.jpg"
video: ""
audio: ""
fontes:
  - titulo: "Título da fonte"
    veiculo: "Veículo ou órgão"
    ano: 1993
    url: "https://..."
---
Texto do caso aqui.
```

- `situacao` aparece como carimbo: use palavras curtas (Condenado, Impune, Arquivado, Em aberto).
- `capa`: envie a imagem para `static/img/casos/`. Ela aparece sempre em preto e branco.
- `video`: só o código do vídeo do YouTube (o que vem depois de `v=`).
- `audio`: narração gravada. Envie o mp3 para `static/audio/` e escreva só o nome do arquivo. Sem áudio, o botão Ouvir usa a voz do navegador.
- Enquanto não houver nenhum caso, o arquivo mostra o quadro de evidências vazio.

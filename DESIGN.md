# Sistema de design do Porão

Irmão do Portal: mesma estrutura (topo com Leitura, Buscar e menu do celular; rodapé com beira rasgada; autor no fim), outro visual. Os valores ficam no começo de `assets/css/porao.css`, em `:root`.

## Princípios

1. **Sem cor.** Preto, branco, cinza e papel. O vermelho é do Portal.
2. **Papel no quadro.** Conteúdo importante aparece como papel preso no quadro de evidências (`.papel`, `.alfinete`, `.fita`).
3. **Lápis e máquina de escrever.** Títulos em Special Elite, rótulos em Courier Prime, anotações em Nanum Pen Script, texto corrido em Literata. As fontes ficam em `static/fonts` (não dependem do Google).
4. **Acessível.** Contraste mínimo de 4,5:1, área de toque de 44 px, foco visível.

## Tema e leitura

- Escuro (padrão) e claro: no claro o papel vira o fundo (`html[data-tema="claro"]`).
- Tema e tamanho do texto usam as mesmas chaves do Portal (`portal-tema`, `portal-escala`), então a escolha vale para os dois sites. Os dossiês lidos ficam em `porao-lidos`.
- "Ouvir" usa a voz do navegador. Para áudio gravado: `static/audio/<arquivo>.mp3` e `audio: "<arquivo>.mp3"` no caso.

## Campos de cada caso

Veja o modelo no `README.md`. A `situacao` vira carimbo; a `capa` aparece sempre em preto e branco.

# Sprint Final

Projeto desenvolvido para a Atividade Prática 1 da disciplina **GAC116 - Programação Web (2026/1)**.

## Proposta

`Sprint Final` é um jogo arcade em 2D no qual o jogador precisa coletar pacotes do projeto e escapar dos bugs que circulam pela arena. A cada fase, a quantidade de inimigos aumenta e o tempo continua limitado.

## Requisitos atendidos

- Desenvolvimento com HTML, CSS e JavaScript puro
- Execução completa no navegador
- Interface visual organizada e responsiva
- Regras claras e objetivo definido
- Interação do usuário por teclado e toque
- Lógica de pontuação, fases, tempo, vidas, vitória, derrota e reinício
- Estrutura pronta para publicação no GitHub Pages
- Licença MIT incluída

## Como jogar

- Use `WASD` ou `setas` para mover o jogador
- Colete os pacotes azuis para marcar pontos
- Evite os bugs vermelhos para não perder vidas
- Complete a meta de cada fase antes que o tempo acabe
- Conclua as três fases para vencer

## Estrutura

```text
.
├── index.html
├── styles.css
├── script.js
├── README.md
└── LICENSE
```

## Execução local

Por ser um projeto estático, basta abrir o arquivo `index.html` no navegador.

Se preferir testar com servidor local:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Publicação no GitHub Pages

1. Crie um repositório público no GitHub.
2. Envie os arquivos do projeto para a branch principal.
3. No repositório, abra `Settings > Pages`.
4. Em `Build and deployment`, selecione a branch principal e a pasta `/ (root)`.
5. Salve a configuração e aguarde a geração do link público.

## Sugestão de apresentação

- Nome do jogo: Sprint Final
- Proposta: coletar recursos e evitar bugs até concluir a entrega
- Regras: três fases, tempo limitado, três vidas e pontuação acumulada
- Decisões técnicas: uso de canvas para renderização, lógica em JavaScript puro e persistência simples do recorde com `localStorage`

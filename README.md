# Rota de Fuga

## Proposta

Rota de Fuga é um jogo web de carro em que o jogador controla um veículo em uma pista com 3 faixas e avança por um percurso cheio de obstáculos. O objetivo é sobreviver o maior tempo possível, passar pelos objetos sem colisão e acumular pontos.

## Regras

- Use a seta para a esquerda para mudar para a faixa da esquerda.
- Use a seta para a direita para mudar para a faixa da direita.
- Passe pelos obstáculos trocando de faixa no momento certo.
- A pontuação aumenta com o tempo de sobrevivência.
- O objetivo é alcançar 500 pontos para vencer.
- O jogo termina quando ocorre uma colisão.

## Tecnologias usadas

- HTML5
- CSS3
- JavaScript puro

## Como executar

1. Baixe ou clone o projeto.
2. Abra o arquivo `index.html` em qualquer navegador moderno.
3. Clique em `Iniciar` para começar a partida.

## Testes

Com Node.js 20 ou superior instalado, execute na pasta do projeto:

```bash
node --test tests/game.test.cjs
```

Os testes verificam movimentação entre faixas, colisão, vitória e reinício com uma simulação da página. Eles não substituem a verificação visual em um navegador.

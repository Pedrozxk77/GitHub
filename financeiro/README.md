# Controle Financeiro

Aplicação web simples para controle de fluxo de caixa pessoal.

## Funcionalidades

- Registrar entradas e saídas com descrição, valor e data
- Saldo, total de entradas e saídas calculados automaticamente
- Filtro por tipo (entrada/saída)
- Remoção de registros
- Persistência local com SQLite
- Interface mobile-first

## Estrutura

```
financeiro/
├── server.js              # Servidor Express
├── db.js                  # Conexão e setup do SQLite
├── routes/
│   └── movimentacoes.js   # Rotas da API REST
├── public/
│   ├── index.html         # Interface
│   ├── style.css          # Estilos
│   └── app.js             # Lógica do frontend
└── package.json
```

## API

| Método | Rota                    | Descrição              |
|--------|-------------------------|------------------------|
| GET    | /movimentacoes          | Lista todas            |
| POST   | /movimentacoes          | Cria nova              |
| DELETE | /movimentacoes/:id      | Remove por ID          |

## Como rodar

```bash
cd financeiro
npm install
npm start
```

Acesse: http://localhost:3000

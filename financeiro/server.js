// Ponto de entrada da aplicação — configura o Express e registra as rotas
const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ── Rotas da API (ANTES do static para não serem interceptadas) ──
app.use('/auth',          require('./routes/auth'));
app.use('/movimentacoes', require('./routes/movimentacoes'));
app.use('/usuarios',      require('./routes/usuarios'));
app.use('/dev',           require('./routes/dev')); // debug — remover em produção

// Serve arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Fallback SPA — apenas para rotas que não são da API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

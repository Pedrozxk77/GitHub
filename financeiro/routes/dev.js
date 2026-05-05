// Rota exclusiva para desenvolvimento — NÃO expor em produção
// Retorna todos os dados dos usuários incluindo senha_hash para debug
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /dev/usuarios — lista completa para a página de debug
router.get('/usuarios', (req, res) => {
  const usuarios = db.prepare(
    'SELECT id, nome, email, senha_hash, role, criado_em FROM usuarios ORDER BY id ASC'
  ).all();

  const movs = db.prepare(
    'SELECT usuario_id, COUNT(*) as total FROM movimentacoes GROUP BY usuario_id'
  ).all();

  // Adiciona contagem de movimentações por usuário
  const movMap = Object.fromEntries(movs.map(m => [m.usuario_id, m.total]));
  const resultado = usuarios.map(u => ({
    ...u,
    total_movimentacoes: movMap[u.id] || 0,
  }));

  res.json(resultado);
});

// DELETE /dev/usuarios/:id — remove usuário direto (sem restrição de self)
router.delete('/usuarios/:id', (req, res) => {
  db.prepare('DELETE FROM movimentacoes WHERE usuario_id = ?').run(req.params.id);
  const r = db.prepare('DELETE FROM usuarios WHERE id = ?').run(req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: 'Não encontrado.' });
  res.json({ ok: true });
});

module.exports = router;

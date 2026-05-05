// Rotas de gestão de usuários — acessíveis apenas por administradores
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { auth, soAdmin } = require('../middleware/auth');

// Aplica autenticação + verificação de admin em todas as rotas deste arquivo
router.use(auth, soAdmin);

// GET /usuarios — retorna todos os usuários cadastrados
router.get('/', (req, res) => {
  const rows = db.prepare(
    'SELECT id, nome, email, role, criado_em FROM usuarios ORDER BY criado_em DESC'
  ).all();
  res.json(rows);
});

// PATCH /usuarios/:id/role — promove ou rebaixa um usuário
router.patch('/:id/role', (req, res) => {
  const { role } = req.body;

  if (!['admin', 'usuario'].includes(role))
    return res.status(400).json({ error: 'Role inválida.' });

  // Admin não pode alterar a própria role para evitar bloqueio acidental
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ error: 'Você não pode alterar sua própria role.' });

  const result = db.prepare('UPDATE usuarios SET role = ? WHERE id = ?')
                   .run(role, req.params.id);

  if (result.changes === 0)
    return res.status(404).json({ error: 'Usuário não encontrado.' });

  res.json({ message: 'Role atualizada.' });
});

// DELETE /usuarios/:id — remove um usuário do sistema
router.delete('/:id', (req, res) => {
  // Admin não pode remover a si mesmo
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ error: 'Você não pode remover a si mesmo.' });

  const result = db.prepare('DELETE FROM usuarios WHERE id = ?').run(req.params.id);

  if (result.changes === 0)
    return res.status(404).json({ error: 'Usuário não encontrado.' });

  res.json({ message: 'Usuário removido.' });
});

module.exports = router;

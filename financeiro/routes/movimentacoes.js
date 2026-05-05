// Rotas de movimentações financeiras — exigem autenticação
const express  = require('express');
const router   = express.Router();
const db       = require('../db');
const { auth } = require('../middleware/auth');

router.use(auth);

// GET /movimentacoes
// Admin vê todos os registros com o nome do autor; usuário comum vê apenas os seus
router.get('/', (req, res) => {
  try {
    const rows = req.user.role === 'admin'
      ? db.prepare(`
          SELECT m.*, u.nome AS usuario_nome
          FROM movimentacoes m
          JOIN usuarios u ON u.id = m.usuario_id
          ORDER BY m.data DESC, m.id DESC
        `).all()
      : db.prepare(
          'SELECT * FROM movimentacoes WHERE usuario_id = ? ORDER BY data DESC, id DESC'
        ).all(req.user.id);

    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar movimentações.' });
  }
});

// POST /movimentacoes — qualquer usuário autenticado pode lançar uma movimentação
router.post('/', (req, res) => {
  const { descricao, valor, data, tipo } = req.body;

  if (!descricao || valor == null || !data || !tipo)
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });

  if (!['entrada', 'saida'].includes(tipo))
    return res.status(400).json({ error: 'Tipo deve ser "entrada" ou "saida".' });

  const valorNum = parseFloat(valor);
  if (isNaN(valorNum) || valorNum <= 0)
    return res.status(400).json({ error: 'Valor deve ser um número positivo.' });

  try {
    // Vincula o registro ao usuário logado via usuario_id
    const result = db.prepare(
      'INSERT INTO movimentacoes (descricao, valor, data, tipo, usuario_id) VALUES (?, ?, ?, ?, ?)'
    ).run(descricao.trim(), valorNum, data, tipo, req.user.id);

    const nova = db.prepare('SELECT * FROM movimentacoes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(nova);
  } catch {
    res.status(500).json({ error: 'Erro ao inserir movimentação.' });
  }
});

// DELETE /movimentacoes/:id
// Admin pode remover qualquer registro; usuário comum só pode remover os próprios
router.delete('/:id', (req, res) => {
  try {
    const mov = db.prepare('SELECT * FROM movimentacoes WHERE id = ?').get(req.params.id);
    if (!mov) return res.status(404).json({ error: 'Movimentação não encontrada.' });

    if (req.user.role !== 'admin' && mov.usuario_id !== req.user.id)
      return res.status(403).json({ error: 'Sem permissão para remover este registro.' });

    db.prepare('DELETE FROM movimentacoes WHERE id = ?').run(req.params.id);
    res.json({ message: 'Removido com sucesso.' });
  } catch {
    res.status(500).json({ error: 'Erro ao remover movimentação.' });
  }
});

module.exports = router;

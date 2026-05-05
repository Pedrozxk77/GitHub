// Rotas públicas de autenticação: registro e login
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const router   = express.Router();
const db       = require('../db');
const { SECRET } = require('../middleware/auth');

// POST /auth/registro — cria um novo usuário
router.post('/registro', async (req, res) => {
  const { nome, email, senha, role: roleRequisitada } = req.body;

  // Validações básicas de entrada
  if (!nome || !email || !senha)
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });

  if (senha.length < 6)
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return res.status(400).json({ error: 'E-mail inválido.' });

  // Aceita 'admin' ou 'usuario'; padrão é 'usuario'
  const roleValida = ['admin', 'usuario'].includes(roleRequisitada) ? roleRequisitada : 'usuario';

  try {
    // Gera hash da senha com custo 10 (bcrypt)
    const hash   = await bcrypt.hash(senha, 10);
    const result = db.prepare(
      'INSERT INTO usuarios (nome, email, senha_hash, role) VALUES (?, ?, ?, ?)'
    ).run(nome.trim(), email.toLowerCase().trim(), hash, roleValida);

    const user  = db.prepare('SELECT id, nome, email, role, criado_em FROM usuarios WHERE id = ?')
                    .get(result.lastInsertRowid);

    // Gera token JWT com validade de 8 horas
    const token = jwt.sign(
      { id: user.id, nome: user.nome, email: user.email, role: user.role },
      SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    if (err.message?.includes('UNIQUE'))
      return res.status(409).json({ error: 'E-mail já cadastrado.' });
    res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
});

// POST /auth/login — autentica usuário existente
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha)
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });

  try {
    const user = db.prepare('SELECT * FROM usuarios WHERE email = ?')
                   .get(email.toLowerCase().trim());

    // Mensagem genérica para não revelar se o e-mail existe
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const ok = await bcrypt.compare(senha, user.senha_hash);
    if (!ok)  return res.status(401).json({ error: 'Credenciais inválidas.' });

    const token = jwt.sign(
      { id: user.id, nome: user.nome, email: user.email, role: user.role },
      SECRET,
      { expiresIn: '8h' }
    );

    // Retorna token + dados públicos do usuário (sem o hash da senha)
    res.json({
      token,
      user: { id: user.id, nome: user.nome, email: user.email, role: user.role, criado_em: user.criado_em }
    });
  } catch {
    res.status(500).json({ error: 'Erro ao fazer login.' });
  }
});

module.exports = router;

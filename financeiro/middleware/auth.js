// Middlewares de autenticação e autorização via JWT
const jwt    = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'financeiro_secret_dev'; // troque em produção

// Verifica o token Bearer no header Authorization e popula req.user
function auth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: 'Não autenticado.' });

  try {
    req.user = jwt.verify(token, SECRET); // decodifica e valida assinatura + expiração
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

// Bloqueia acesso a rotas exclusivas de administrador
function soAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores.' });
  }
  next();
}

module.exports = { auth, soAdmin, SECRET };

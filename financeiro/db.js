// Conexão com o banco de dados SQLite usando better-sqlite3 (síncrono)
const Database = require('better-sqlite3');
const path     = require('path');

// Abre (ou cria) o arquivo do banco na mesma pasta do projeto
const db = new Database(path.join(__dirname, 'financeiro.db'));

// Cria as tabelas na primeira execução; não faz nada se já existirem
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nome       TEXT    NOT NULL,
    email      TEXT    NOT NULL UNIQUE,        -- e-mail único por usuário
    senha_hash TEXT    NOT NULL,               -- senha armazenada como hash bcrypt
    role       TEXT    NOT NULL DEFAULT 'usuario' CHECK(role IN ('admin', 'usuario')),
    criado_em  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS movimentacoes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    descricao  TEXT    NOT NULL,
    valor      REAL    NOT NULL,
    data       TEXT    NOT NULL,
    tipo       TEXT    NOT NULL CHECK(tipo IN ('entrada', 'saida')),
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id)  -- vínculo com o dono do registro
  );
`);

module.exports = db;

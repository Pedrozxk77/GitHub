// Frontend da aplicação — controla autenticação, navegação e chamadas à API

// ── Estado global ─────────────────────────────────────────
let currentUser     = null; // dados do usuário logado
let tipoSelecionado = 'entrada'; // tipo ativo no formulário de movimentação
let roleSelecionada = 'usuario'; // role escolhida no formulário de registro

// ── Inicialização ─────────────────────────────────────────
// Verifica se já existe sessão salva no localStorage ao carregar a página
(function init() {
  const token = localStorage.getItem('token');
  const user  = safeParseJSON(localStorage.getItem('user'));
  if (token && user) {
    currentUser = user;
    mostrarApp();
  } else {
    mostrarAuth();
  }
})();

// ── Abas da tela de autenticação ──────────────────────────
function setAuthTab(tab) {
  document.getElementById('formLogin').style.display    = tab === 'login'    ? '' : 'none';
  document.getElementById('formRegistro').style.display = tab === 'registro' ? '' : 'none';
  document.querySelectorAll('.auth-tab').forEach((el, i) => {
    el.classList.toggle('auth-tab--active', (i === 0 && tab === 'login') || (i === 1 && tab === 'registro'));
  });
}

// ── Login ─────────────────────────────────────────────────
document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const senha = document.getElementById('loginSenha').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';

  const btn = e.target.querySelector('.btn-submit');
  setLoading(btn, true);

  try {
    const res  = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });
    const data = await res.json();
    if (!res.ok) return (errEl.textContent = data.error);
    salvarSessao(data.token, data.user);
    mostrarApp();
  } catch {
    errEl.textContent = 'Erro de conexão.';
  } finally {
    setLoading(btn, false);
  }
});

// ── Seletor de role no registro ───────────────────────────
function setRegRole(role) {
  roleSelecionada = role;
  document.querySelectorAll('.role-opt').forEach(el => {
    el.classList.toggle('role-opt--active', el.dataset.role === role);
  });
}

// ── Registro ──────────────────────────────────────────────
document.getElementById('formRegistro').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome  = document.getElementById('regNome').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const senha = document.getElementById('regSenha').value;
  const errEl = document.getElementById('regError');
  errEl.textContent = '';

  const btn = e.target.querySelector('.btn-submit');
  setLoading(btn, true);

  try {
    const res  = await fetch('/auth/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha, role: roleSelecionada }),
    });
    const data = await res.json();
    if (!res.ok) return (errEl.textContent = data.error);
    salvarSessao(data.token, data.user);
    mostrarApp();
  } catch {
    errEl.textContent = 'Erro de conexão.';
  } finally {
    setLoading(btn, false);
  }
});

// ── Gerenciamento de sessão ───────────────────────────────
function salvarSessao(token, user) {
  // Persiste token e dados do usuário para sobreviver a recarregamentos
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  currentUser = user;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  currentUser = null;
  mostrarAuth();
}

function getToken() { return localStorage.getItem('token'); }

// ── Alternância entre tela de auth e app ──────────────────
function mostrarAuth() {
  document.getElementById('telaAuth').style.display = 'flex';
  document.getElementById('telaApp').style.display  = 'none';
}

function mostrarApp() {
  document.getElementById('telaAuth').style.display = 'none';
  document.getElementById('telaApp').style.display  = 'flex';

  // Preenche header com nome e badge de role do usuário logado
  document.getElementById('userName').textContent = currentUser.nome;
  const badge = document.getElementById('userBadge');
  badge.textContent = currentUser.role === 'admin' ? 'Admin' : 'Usuário';
  badge.className   = 'user-badge user-badge--' + currentUser.role;

  // Aba "Usuários" só aparece para admins
  document.getElementById('tabUsuarios').style.display = currentUser.role === 'admin' ? '' : 'none';

  setAppTab('dashboard');
}

// ── Abas do app (Dashboard / Usuários) ───────────────────
function setAppTab(tab) {
  document.getElementById('painelDashboard').style.display = tab === 'dashboard' ? '' : 'none';
  document.getElementById('painelUsuarios').style.display  = tab === 'usuarios'  ? '' : 'none';
  document.querySelectorAll('.app-tab').forEach(el => {
    el.classList.toggle('app-tab--active', el.textContent.toLowerCase().includes(tab === 'dashboard' ? 'dash' : 'usu'));
  });

  if (tab === 'dashboard') { setDataHoje(); carregarMovimentacoes(); }
  if (tab === 'usuarios')  carregarUsuarios();
}

// ── Toggle entrada / saída ────────────────────────────────
document.getElementById('btnEntrada').addEventListener('click', () => setTipo('entrada'));
document.getElementById('btnSaida').addEventListener('click',   () => setTipo('saida'));

function setTipo(tipo) {
  tipoSelecionado = tipo;
  document.getElementById('btnEntrada').classList.toggle('tipo-btn--active', tipo === 'entrada');
  document.getElementById('btnSaida').classList.toggle('tipo-btn--active',   tipo === 'saida');
}

// ── Formulário de nova movimentação ──────────────────────
document.getElementById('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('formError');
  errEl.textContent = '';

  const descricao = document.getElementById('descricao').value.trim();
  const valor     = parseFloat(document.getElementById('valor').value);
  const data      = document.getElementById('data').value;

  // Validação no frontend antes de enviar
  if (!descricao)         return (errEl.textContent = 'Informe uma descrição.');
  if (!valor || valor<=0) return (errEl.textContent = 'Informe um valor válido.');
  if (!data)              return (errEl.textContent = 'Informe a data.');

  const btn = e.target.querySelector('.btn-submit');
  setLoading(btn, true);

  try {
    const res = await apiFetch('/movimentacoes', {
      method: 'POST',
      body: JSON.stringify({ descricao, valor, data, tipo: tipoSelecionado }),
    });
    if (!res.ok) {
      const err = await res.json();
      return (errEl.textContent = err.error || 'Erro ao salvar.');
    }
    document.getElementById('form').reset();
    setDataHoje();
    setTipo('entrada');
    await carregarMovimentacoes();
    showToast('Movimentação adicionada ✓');
  } catch {
    errEl.textContent = 'Erro de conexão.';
  } finally {
    setLoading(btn, false);
  }
});

// ── Carrega e renderiza movimentações ─────────────────────
async function carregarMovimentacoes() {
  const lista = document.getElementById('lista');
  try {
    const res = await apiFetch('/movimentacoes');
    if (res.status === 401) return logout(); // token expirado
    const data = await res.json();
    renderLista(data);
    renderResumo(data);
  } catch {
    lista.innerHTML = '<p class="error-msg">Erro ao carregar dados.</p>';
  }
}

function renderLista(items) {
  const lista = document.getElementById('lista');
  if (!items.length) {
    lista.innerHTML = `<div class="empty-state"><span class="empty-icon">📋</span><p>Nenhuma movimentação ainda.</p></div>`;
    return;
  }
  lista.innerHTML = items.map(item => {
    // Usuário comum só vê o botão de deletar nos próprios registros
    const podeDeletar = currentUser.role === 'admin' || item.usuario_id === currentUser.id;
    // Admin vê o nome do autor de cada lançamento
    const autorLabel  = currentUser.role === 'admin' && item.usuario_nome
      ? `<span class="item-author">${esc(item.usuario_nome)}</span>` : '';
    return `
      <article class="item item--${item.tipo}">
        <div class="item-icon">${item.tipo === 'entrada' ? '↑' : '↓'}</div>
        <div class="item-info">
          <div class="item-desc">${esc(item.descricao)} ${autorLabel}</div>
          <div class="item-date">${formatarData(item.data)}</div>
        </div>
        <span class="item-valor">${item.tipo === 'entrada' ? '+' : '-'} ${formatarValor(item.valor)}</span>
        ${podeDeletar
          ? `<button class="item-delete" aria-label="Remover" onclick="remover(${item.id})">✕</button>`
          : '<span class="item-delete-placeholder"></span>'}
      </article>`;
  }).join('');
}

// Calcula e exibe saldo, total de entradas e saídas
function renderResumo(items) {
  const entradas = items.filter(i => i.tipo === 'entrada').reduce((s, i) => s + i.valor, 0);
  const saidas   = items.filter(i => i.tipo === 'saida').reduce((s, i) => s + i.valor, 0);
  const saldo    = entradas - saidas;

  document.getElementById('totalEntradas').textContent = formatarValor(entradas);
  document.getElementById('totalSaidas').textContent   = formatarValor(saidas);

  const elSaldo = document.getElementById('saldo');
  elSaldo.textContent = formatarValor(saldo);
  elSaldo.style.color = saldo < 0 ? 'var(--red)' : saldo > 0 ? 'var(--green)' : '#fff';
}

async function remover(id) {
  if (!confirm('Remover esta movimentação?')) return;
  try {
    const res = await apiFetch(`/movimentacoes/${id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); return showToast(e.error); }
    await carregarMovimentacoes();
    showToast('Removido.');
  } catch { showToast('Erro de conexão.'); }
}

// ── Painel de usuários (admin) ────────────────────────────
async function carregarUsuarios() {
  const lista = document.getElementById('listaUsuarios');
  lista.innerHTML = '<p class="loading-msg">Carregando…</p>';
  try {
    const res = await apiFetch('/usuarios');
    if (res.status === 401) return logout();
    const users = await res.json();
    // Atualiza contador no cabeçalho do painel
    document.getElementById('usersCount').textContent =
      users.length === 0 ? 'Nenhum usuário cadastrado'
      : users.length === 1 ? '1 usuário cadastrado'
      : `${users.length} usuários cadastrados`;
    renderUsuarios(users);
  } catch {
    lista.innerHTML = '<p class="error-msg">Erro ao carregar usuários.</p>';
  }
}

function renderUsuarios(users) {
  const lista = document.getElementById('listaUsuarios');
  if (!users.length) {
    lista.innerHTML = '<div class="empty-state"><span class="empty-icon">👤</span><p>Nenhum usuário cadastrado ainda.</p></div>';
    return;
  }
  lista.innerHTML = users.map(u => {
    const dataFormatada = formatarData(u.criado_em.split('T')[0] || u.criado_em.split(' ')[0]);
    const isSelf = u.id === currentUser.id;
    return `
    <div class="user-item">
      <div class="user-avatar">${u.nome.charAt(0).toUpperCase()}</div>
      <div class="user-info">
        <div class="user-item-name">${esc(u.nome)}</div>
        <div class="user-item-email">${esc(u.email)}</div>
      </div>
      <div class="user-item-date">${dataFormatada}</div>
      <div class="user-actions">
        <span class="user-badge user-badge--${u.role}">${u.role === 'admin' ? 'Admin' : 'Usuário'}</span>
        ${isSelf
          ? '<span class="user-you">(você)</span>'
          : `<button class="btn-role" title="${u.role === 'admin' ? 'Rebaixar para Usuário' : 'Promover para Admin'}"
               onclick="alterarRole(${u.id}, '${u.role === 'admin' ? 'usuario' : 'admin'}')">
               ${u.role === 'admin' ? '↓ Rebaixar' : '↑ Promover'}
             </button>
             <button class="btn-del-user" title="Remover ${esc(u.nome)}"
               onclick="removerUsuario(${u.id}, '${esc(u.nome)}')">🗑</button>`
        }
      </div>
    </div>`;
  }).join('');
}

async function alterarRole(id, novaRole) {
  try {
    const res = await apiFetch(`/usuarios/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role: novaRole }),
    });
    if (!res.ok) { const e = await res.json(); return showToast(e.error); }
    await carregarUsuarios();
    showToast('Role atualizada ✓');
  } catch { showToast('Erro de conexão.'); }
}

async function removerUsuario(id, nome) {
  if (!confirm(`Remover o usuário "${nome}"?\nEsta ação não pode ser desfeita.`)) return;
  try {
    const res = await apiFetch(`/usuarios/${id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); return showToast(e.error); }
    await carregarUsuarios();
    showToast(`Usuário "${nome}" removido.`);
  } catch { showToast('Erro de conexão.'); }
}

// ── Utilitários ───────────────────────────────────────────

// Wrapper do fetch que injeta o token JWT em todas as requisições autenticadas
function apiFetch(url, opts = {}) {
  return fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      ...(opts.headers || {}),
    },
  });
}

function setDataHoje() {
  document.getElementById('data').value = new Date().toISOString().split('T')[0];
}

// Desabilita o botão durante requisições para evitar duplo envio
function setLoading(btn, loading) {
  if (loading) {
    // Salva o texto original antes de sobrescrever
    if (!btn.dataset.label) btn.dataset.label = btn.textContent;
    btn.disabled    = true;
    btn.textContent = 'Aguarde…';
  } else {
    btn.disabled    = false;
    btn.textContent = btn.dataset.label || btn.textContent;
  }
}

function formatarValor(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(d) {
  if (!d) return '—';
  const [ano, mes, dia] = d.split('-');
  return `${dia}/${mes}/${ano}`;
}

// Escapa HTML para evitar XSS ao renderizar dados do usuário
function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function safeParseJSON(str) {
  try { return JSON.parse(str); } catch { return null; }
}

// Exibe uma notificação temporária no rodapé da tela
let toastTimer;
function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

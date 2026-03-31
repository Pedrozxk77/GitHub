let allData = [];

// ── File upload ───────────────────────────────────────────
document.getElementById('fileInput').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (ev) { parseWorkbook(ev.target.result); };
  reader.readAsArrayBuffer(file);
});

function parseWorkbook(buffer) {
  const wb   = XLSX.read(buffer, { type: 'array' });
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  allData = rows.map(function (r, i) {
    return {
      id:     r['id']     ?? r['ID']     ?? i + 1,
      nome:   r['nome']   ?? r['Nome']   ?? r['NOME']   ?? '—',
      cidade: r['cidade'] ?? r['Cidade'] ?? r['CIDADE'] ?? '—',
    };
  });
  clearFilters();
  renderCards(allData);
}

// ── Sample data ───────────────────────────────────────────
function loadSample() {
  allData = [
    { id: 1, nome: 'Pedro',   cidade: 'São Paulo'      },
    { id: 2, nome: 'Delta',   cidade: 'Rio de Janeiro' },
    { id: 3, nome: 'Ana',     cidade: 'Belo Horizonte' },
    { id: 4, nome: 'Lucas',   cidade: 'Curitiba'       },
    { id: 5, nome: 'Mariana', cidade: 'Fortaleza'      },
    { id: 6, nome: 'Carlos',  cidade: 'Salvador'       },
    { id: 7, nome: 'Juliana', cidade: 'Manaus'         },
    { id: 8, nome: 'Rafael',  cidade: 'Porto Alegre'   },
  ];
  clearFilters();
  renderCards(allData);
}

// ── Filters ───────────────────────────────────────────────
function clearFilters() {
  ['filterName', 'filterCity', 'filterID'].forEach(function (id) {
    document.getElementById(id).value = '';
  });
}

function applyFilters() {
  const name = document.getElementById('filterName').value.trim().toLowerCase();
  const city = document.getElementById('filterCity').value.trim().toLowerCase();
  const id   = document.getElementById('filterID').value.trim().toLowerCase();

  const filtered = allData.filter(function (r) {
    return (!name || String(r.nome).toLowerCase().includes(name))
        && (!city || String(r.cidade).toLowerCase().includes(city))
        && (!id   || String(r.id).toLowerCase().includes(id));
  });
  renderCards(filtered);
}

// ── Render ────────────────────────────────────────────────
function renderCards(data) {
  const content  = document.getElementById('content');
  const statsBar = document.getElementById('statsBar');

  document.getElementById('countVisible').textContent = data.length;
  document.getElementById('countTotal').textContent   = allData.length;
  statsBar.style.display = 'flex';

  if (!data.length) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔍</div>
        <p>Nenhum resultado encontrado para os filtros aplicados.</p>
      </div>`;
    return;
  }

  content.innerHTML = `<div class="cards-grid">${data.map(cardHTML).join('')}</div>`;
}

function cardHTML(r) {
  const initials = String(r.nome).trim().split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
  return `
    <div class="card">
      <div class="card-top">
        <span class="card-id">#${r.id}</span>
        <span class="card-avatar">${initials}</span>
      </div>
      <div class="card-name">${esc(r.nome)}</div>
      <div class="card-city">📍 ${esc(r.cidade)}</div>
    </div>`;
}

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

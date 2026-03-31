// Instale a dependência antes de rodar: npm install xlsx
// Depois execute: node gerar-xlsx.js

const XLSX = require('xlsx');

const dados = [
  { id: 1, nome: 'Pedro',   cidade: 'São Paulo'      },
  { id: 2, nome: 'Delta',   cidade: 'Rio de Janeiro' },
  { id: 3, nome: 'Ana',     cidade: 'Belo Horizonte' },
  { id: 4, nome: 'Lucas',   cidade: 'Curitiba'       },
  { id: 5, nome: 'Mariana', cidade: 'Fortaleza'      },
  { id: 6, nome: 'Carlos',  cidade: 'Salvador'       },
  { id: 7, nome: 'Juliana', cidade: 'Manaus'         },
  { id: 8, nome: 'Rafael',  cidade: 'Porto Alegre'   },
];

const ws = XLSX.utils.json_to_sheet(dados);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Dados');
XLSX.writeFile(wb, 'dados.xlsx');

console.log('✔ dados.xlsx gerado com sucesso!');

// ==========================
// FIREBASE CONFIG
// Substitua pelos seus dados caso necessário (já usei os dados que você forneceu)
// ==========================
const firebaseConfig = {
  apiKey: "AIzaSyCztzjnqsASSgQAGJNNyp0XLzAeeEKclPY",
  authDomain: "controle-de-financas-8bfdf.firebaseapp.com",
  databaseURL: "https://controle-de-financas-8bfdf-default-rtdb.firebaseio.com",
  projectId: "controle-de-financas-8bfdf",
  storageBucket: "controle-de-financas-8bfdf.firebasestorage.app",
  messagingSenderId: "269562705866",
  appId: "1:269562705866:web:58aeae4840ec2c6c7cc133",
  measurementId: "G-BZE9L6267J"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();
const provider = new firebase.auth.GoogleAuthProvider();

// Utilidades
function formatMoney(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0,10);
}

// ===== LOGIN =====
document.getElementById("googleLogin").onclick = () => auth.signInWithPopup(provider);
document.getElementById("logoutBtn").onclick = () => auth.signOut();

// Monitor de autenticação
auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById('loginArea').style.display = 'none';
    document.getElementById('appArea').style.display = 'block';
    document.getElementById('userName').innerText = user.displayName;

    // carrega configurações e dados
    carregarConfigs();
    carregarDespesas();
    carregarRendas();

    // solicitar permissão de notificação (opcional)
    if (Notification && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  } else {
    document.getElementById('loginArea').style.display = 'block';
    document.getElementById('appArea').style.display = 'none';
  }
});

// PRIVACIDADE
let ocultar = false;
document.getElementById('togglePrivacidade').onclick = () => { ocultar = !ocultar; renderDespesas(currentMonth()); };

// SALVAR RENDAS
document.getElementById('salvarRendas').onclick = async () => {
  const user = auth.currentUser; if (!user) return alert('Usuário não autenticado');
  const principal = document.getElementById('rendaPrincipal').value || '0';
  const secund = document.getElementById('rendaSecundaria').value || '0';
  const outras = document.getElementById('outrasRendas').value || '';

  await db.ref(`users/${user.uid}/rendas`).set({ principal, secundaria: secund, outras });
  alert('Rendas salvas');
  carregarRendas();
};

async function carregarRendas() {
  const user = auth.currentUser; if (!user) return;
  const snap = await db.ref(`users/${user.uid}/rendas`).once('value');
  const val = snap.val();
  if (!val) return;
  document.getElementById('rendaPrincipal').value = val.principal || '';
  document.getElementById('rendaSecundaria').value = val.secundaria || '';
  document.getElementById('outrasRendas').value = val.outras || '';
}

// SALVAR DESPESA
document.getElementById('salvarBtn').onclick = async () => {
  const user = auth.currentUser; if (!user) return alert('Faça login');
  const descricao = document.getElementById('descricao').value.trim();
  const valor = Number(document.getElementById('valor').value);
  const data = document.getElementById('vencimento').value;
  const repetir = document.getElementById('repetirMensal').checked;
  const diasAlerta = Number(document.getElementById('diasAlerta').value) || 3;

  if (!descricao || !valor || !data) return alert('Preencha todos os campos');

  const id = db.ref().push().key;
  await db.ref(`despesas/${user.uid}/${id}`).set({ descricao, valor, data, repetir, pago: false, diasAlerta });

  document.getElementById('descricao').value = '';
  document.getElementById('valor').value = '';
  document.getElementById('vencimento').value = '';
  document.getElementById('repetirMensal').checked = false;

  carregarDespesas();
};

// CARREGAR DESPESAS POR MÊS
function currentMonth() {
  const m = document.getElementById('mesFiltro').value;
  if (m) return m; // formato YYYY-MM
  const d = new Date();
  return d.toISOString().slice(0,7);
}

document.getElementById('mesFiltro').onchange = () => carregarDespesas();

async function carregarConfigs() {
  const user = auth.currentUser; if (!user) return;
  const cfgSnap = await db.ref(`users/${user.uid}/config`).once('value');
  const cfg = cfgSnap.val() || {};
  if (cfg.mes) document.getElementById('mesFiltro').value = cfg.mes;
}

async function carregarDespesas() {
  try {
    const user = auth.currentUser; if (!user) return;
    const snap = await db.ref(`despesas/${user.uid}`).once('value');
    const obj = snap.val() || {};
    const arr = Object.entries(obj).map(([id, v]) => ({ id, ...v }));

    // filtrar por mês atual selecionado
    const mes = currentMonth(); // 'YYYY-MM'
    const filtrado = arr.filter(it => it.data && it.data.slice(0,7) === mes);

    // ordenar por data
    filtrado.sort((a,b) => new Date(a.data) - new Date(b.data));

    renderDespesas(mes, filtrado);
    gerarResumo(filtrado);
    gerarGrafico();

    checarAlertas(filtrado);
  } catch (e) {
    console.error('Erro ao carregar despesas:', e);
    alert('Erro ao carregar despesas. Verifique regras de segurança do Realtime Database.');
  }
}

function renderDespesas(mes, arr) {
  const lista = document.getElementById('lista');
  lista.innerHTML = '';

  const totalPrev = arr.reduce((s, i) => s + Number(i.valor || 0), 0);
  const totalPago = arr.reduce((s, i) => s + (i.pago ? Number(i.valor || 0) : 0), 0);

  document.getElementById('totalPrevisto').innerText = formatMoney(totalPrev);
  document.getElementById('totalPago').innerText = formatMoney(totalPago);
  document.getElementById('saldo').innerText = formatMoney((Number(getRendaTotal()) - totalPrev));

  arr.forEach(item => {
    const li = document.createElement('li');
    const status = getStatus(item);

    li.innerHTML = `
      <div class="itemLeft ${ocultar ? 'privado' : ''}">
        <div class="descricao">${item.data} — ${item.descricao}</div>
        <div class="valor">${formatMoney(item.valor)} ${item.repetir ? '🔄' : ''}</div>
        <div class="status">${status}</div>
      </div>
      <div class="acoes">
        <button class="smallBtn" onclick="marcarPago('${item.id}', ${item.pago ? 'false' : 'true'})">${item.pago ? 'Desmarcar' : 'Pagar'}</button>
        <button class="smallBtn" onclick="editarDespesa('${item.id}')">Editar</button>
        <button class="smallBtn" onclick="excluirDespesa('${item.id}')">Excluir</button>
      </div>
    `;

    lista.appendChild(li);
  });
}

function getStatus(item) {
  if (item.pago) return 'Pago';
  const hoje = new Date();
  const venc = new Date(item.data + 'T23:59:59');
  if (venc < hoje) return 'Atrasado';
  return 'Pendente';
}

async function marcarPago(id, marcar) {
  const user = auth.currentUser; if (!user) return;
  await db.ref(`despesas/${user.uid}/${id}`).update({ pago: marcar, dataPago: marcar ? todayISO() : null });
  carregarDespesas();
}

async function excluirDespesa(id) {
  const user = auth.currentUser; if (!user) return;
  await db.ref(`despesas/${user.uid}/${id}`).remove();
  carregarDespesas();
}

async function editarDespesa(id) {
  const user = auth.currentUser; if (!user) return;
  const snap = await db.ref(`despesas/${user.uid}/${id}`).once('value');
  const item = snap.val();
  if (!item) return alert('Item não encontrado');

  const descricao = prompt('Descrição:', item.descricao) || item.descricao;
  const valor = prompt('Valor:', item.valor) || item.valor;
  const data = prompt('Vencimento (YYYY-MM-DD):', item.data) || item.data;

  await db.ref(`despesas/${user.uid}/${id}`).update({ descricao, valor, data });
  carregarDespesas();
}

// RENDAS TOTAIS (simples)
function getRendaTotal() {
  const principal = Number(document.getElementById('rendaPrincipal').value || 0);
  const secund = Number(document.getElementById('rendaSecundaria').value || 0);
  const outrasStr = document.getElementById('outrasRendas').value || '';
  const outras = outrasStr.split(',').map(s => Number(s.trim()||0)).reduce((s,v)=>s+v,0);
  return principal + secund + outras;
}

// ALERTAS
function checarAlertas(arr) {
  const hoje = new Date();
  arr.forEach(item => {
    if (item.pago) return;
    const venc = new Date(item.data + 'T09:00:00');
    const diasAlerta = Number(item.diasAlerta || 3);
    const diffDays = Math.ceil((venc - hoje)/(1000*60*60*24));

    if (diffDays <= diasAlerta && diffDays >= 0) {
      // alerta antecipado
      notificar(`Vencimento próximo: ${item.descricao} em ${item.data}`);
    } else if (diffDays < 0) {
      notificar(`Despesa atrasada: ${item.descricao} (venc ${item.data})`);
    }
  });
}

function notificar(text) {
  // Notificação do navegador
  if (Notification && Notification.permission === 'granted') {
    new Notification('Controle de Finanças', { body: text });
  } else {
    // fallback: alerta in-app
    console.log('ALERTA:', text);
  }
}

// GRÁFICO SIMPLES (comparativo por mês — pega os últimos 6 meses)
async function gerarGrafico() {
  const user = auth.currentUser; if (!user) return;
  const snap = await db.ref(`despesas/${user.uid}`).once('value');
  const obj = snap.val() || {};
  const arr = Object.values(obj);

  // agrupa por mês (YYYY-MM)
  const mapa = {};
  arr.forEach(it => {
    if (!it.data) return;
    const m = it.data.slice(0,7);
    mapa[m] = (mapa[m] || 0) + Number(it.valor || 0);
  });

  const meses = Object.keys(mapa).sort().slice(-6);
  const valores = meses.map(m=>mapa[m]);

  const ctx = document.getElementById('grafico').getContext('2d');
  if (window._chart) window._chart.destroy();
  window._chart = new Chart(ctx, {
    type: 'bar',
    data: { labels: meses, datasets: [{ label: 'Gastos', data: valores }] },
    options: { responsive: true }
  });
}

// salvar configuração do mês selecionado
document.getElementById('mesFiltro').onchange = async () => {
  const user = auth.currentUser; if (!user) return;
  const mes = document.getElementById('mesFiltro').value;
  await db.ref(`users/${user.uid}/config`).update({ mes });
  carregarDespesas();
};

// inicializar valor do mêsFiltro para mês atual
(function() {
  const m = new Date().toISOString().slice(0,7);
  if (!document.getElementById('mesFiltro').value) document.getElementById('mesFiltro').value = m;
})();

// expose some functions to window for inline onclicks
window.marcarPago = marcarPago;
window.excluirDespesa = excluirDespesa;
window.editarDespesa = editarDespesa;


console.log('app.js carregado');

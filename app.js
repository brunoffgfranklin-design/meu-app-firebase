// ===============================
// CONFIG FIREBASE
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyCztzjnqsASSgQAGJNNyp0XLzAeeEKclPY",
  authDomain: "controle-de-financas-8bfdf.firebaseapp.com",
  databaseURL: "https://controle-de-financas-8bfdf-default-rtdb.firebaseio.com",
  projectId: "controle-de-financas-8bfdf",
  storageBucket: "controle-de-financas-8bfdf.firebasestorage.app",
  messagingSenderId: "269562705866",
  appId: "1:269562705866:web:58aeae4840ec2c6c7cc133"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.database();
const provider = new firebase.auth.GoogleAuthProvider();

// ===============================
// LOGIN
// ===============================
document.getElementById("googleLogin").onclick = () => {
  auth.signInWithPopup(provider)
    .catch(e => alert("Erro ao logar: " + e.message));
};

document.getElementById("logoutBtn").onclick = () => {
  auth.signOut();
};

// MONITOR DE LOGIN
auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("loginArea").style.display = "none";
    document.getElementById("appArea").style.display   = "block";
    document.getElementById("userName").innerText = user.displayName;

    carregarDespesas();
  } else {
    document.getElementById("loginArea").style.display = "block";
    document.getElementById("appArea").style.display   = "none";
  }
});

// ===============================
// CRUD DE DESPESAS
// ===============================
document.getElementById("salvarBtn").onclick = salvarDespesa;

function salvarDespesa() {
  const user = auth.currentUser;
  if (!user) return;

  const descricao = document.getElementById("descricao").value.trim();
  const valor     = document.getElementById("valor").value;
  const liquido   = document.getElementById("valorLiquido").value;
  const data      = document.getElementById("data").value;

  if (!descricao || !valor || !data) {
    alert("Preencha todos os campos obrigatórios!");
    return;
  }

  const id = db.ref().push().key;

  db.ref(`despesas/${user.uid}/${id}`).set({
    id,
    descricao,
    valor: Number(valor),
    liquido: Number(liquido || 0),
    data
  });

  document.getElementById("descricao").value = "";
  document.getElementById("valor").value = "";
  document.getElementById("valorLiquido").value = "";
  document.getElementById("data").value = "";

  carregarDespesas();
}

// LISTAR
function carregarDespesas() {
  const user = auth.currentUser;
  if (!user) return;

  db.ref(`despesas/${user.uid}`).orderByChild("data").on("value", snapshot => {
    const lista = document.getElementById("listaDespesas");
    lista.innerHTML = "";

    const dados = snapshot.val();
    if (!dados) return;

    Object.values(dados).forEach(item => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="descricao">${item.descricao}</span>
        <span class="valor" data-valor="${item.valor}">R$ ${item.valor.toFixed(2)}</span>
        <span class="data">${item.data}</span>
        <button onclick="editarDespesa('${item.id}')">Editar</button>
        <button onclick="excluirDespesa('${item.id}')">Excluir</button>
      `;
      lista.appendChild(li);
    });
  });
}

// EDITAR
function editarDespesa(id) {
  const user = auth.currentUser;
  db.ref(`despesas/${user.uid}/${id}`).once("value")
    .then(s => {
      const item = s.val();

      document.getElementById("descricao").value = item.descricao;
      document.getElementById("valor").value     = item.valor;
      document.getElementById("valorLiquido").value = item.liquido;
      document.getElementById("data").value      = item.data;

      excluirDespesa(id); // sobrescreve ao salvar
    });
}

// EXCLUIR
function excluirDespesa(id) {
  const user = auth.currentUser;
  if (!confirm("Excluir este item?")) return;

  db.ref(`despesas/${user.uid}/${id}`).remove();
}

// ===============================
// PRIVACIDADE — Camuflar valores
// ===============================
let oculto = false;

document.getElementById("btnPrivacidade").onclick = () => {
  oculto = !oculto;
  document.querySelectorAll(".valor").forEach(el => {
    if (oculto) {
      el.innerText = "R$ •••••";
    } else {
      const v = Number(el.dataset.valor);
      el.innerText = "R$ " + v.toFixed(2);
    }
  });

  document.getElementById("btnPrivacidade").innerText =
    oculto ? "Mostrar Valores" : "Ocultar Valores";
};

// ==========================
// FIREBASE CONFIG
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

let ocultar = false;

// Aguarda DOM carregado
document.addEventListener('DOMContentLoaded', () => {

  // LOGIN / LOGOUT
  document.getElementById("googleLogin").onclick = () => {
    auth.signInWithPopup(provider).catch(err => {
      console.error("Erro ao abrir popup:", err);
      alert("Erro ao iniciar login: " + err.message);
    });
  };

  document.getElementById("logoutBtn").onclick = () => {
    auth.signOut().catch(err => {
      console.error("Erro ao deslogar:", err);
    });
  };

  // Toggle privacidade
  document.getElementById("togglePrivacidade").onclick = () => {
    ocultar = !ocultar;
    carregarDespesas();
  };

  // Salvar despesa
  document.getElementById("salvarBtn").onclick = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Você precisa entrar com Google antes de salvar.");
        return;
      }

      const descricao = document.getElementById("descricao").value.trim();
      const valor = document.getElementById("valor").value;
      const data = document.getElementById("data").value;
      const repetir = document.getElementById("repetirMensal").checked;

      if (!descricao || !valor || !data) {
        alert("Preencha todos os campos (descrição, valor e data).");
        return;
      }

      // Cria nó com push() e seta valor
      const ref = db.ref(`despesas/${user.uid}`).push();
      await ref.set({
        descricao,
        valor: Number(valor),
        data,
        repetir: !!repetir,
        criadoEm: new Date().toISOString()
      });

      // limpa campos
      document.getElementById("descricao").value = "";
      document.getElementById("valor").value = "";
      document.getElementById("data").value = "";
      document.getElementById("repetirMensal").checked = false;

      alert("Despesa salva com sucesso!");
      carregarDespesas();

    } catch (err) {
      console.error("Erro salvando despesa:", err);
      alert("Erro ao salvar: " + (err.message || err));
    }
  };

  // Monitora auth
  auth.onAuthStateChanged(user => {
    if (user) {
      document.getElementById("loginArea").style.display = "none";
      document.getElementById("appArea").style.display = "block";
      document.getElementById("userName").innerText = user.displayName || user.email;
      carregarDespesas();
    } else {
      document.getElementById("loginArea").style.display = "block";
      document.getElementById("appArea").style.display = "none";
    }
  });

}); // DOMContentLoaded end


// ==========================
// CARREGAR LISTA (ORDENADA)
// ==========================
async function carregarDespesas() {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const snap = await db.ref(`despesas/${user.uid}`).once("value");
    const lista = document.getElementById("lista");
    lista.innerHTML = "";

    const itens = snap.val();
    if (!itens) return;

    const arr = Object.entries(itens).map(([id, obj]) => ({ id, ...obj }));

    // Ordenar por data
    arr.sort((a, b) => new Date(a.data) - new Date(b.data));

    arr.forEach(item => {
      const li = document.createElement("li");

      const spanInfo = document.createElement("span");
      if (ocultar) spanInfo.classList.add("privado");

      // formata valor com 2 casas
      const valorFmt = (Number(item.valor) || 0).toFixed(2).replace('.', ',');

      spanInfo.innerText = `${item.data} — ${item.descricao} — R$ ${valorFmt} ${item.repetir ? "🔄" : ""}`;

      const spanBtns = document.createElement("span");

      const btnEditar = document.createElement("button");
      btnEditar.className = "smallBtn";
      btnEditar.textContent = "✏";
      btnEditar.onclick = () => editar(item.id, item);

      const btnExcluir = document.createElement("button");
      btnExcluir.className = "smallBtn";
      btnExcluir.textContent = "🗑";
      btnExcluir.onclick = () => {
        if (confirm("Deseja excluir esta despesa?")) {
          excluir(item.id);
        }
      };

      spanBtns.appendChild(btnEditar);
      spanBtns.appendChild(btnExcluir);

      li.appendChild(spanInfo);
      li.appendChild(spanBtns);

      lista.appendChild(li);
    });

  } catch (err) {
    console.error("Erro carregando despesas:", err);
    alert("Erro ao carregar despesas: " + (err.message || err));
  }
}


// ==========================
// EXCLUIR
// ==========================
async function excluir(id) {
  try {
    const user = auth.currentUser;
    if (!user) return;
    await db.ref(`despesas/${user.uid}/${id}`).remove();
    carregarDespesas();
  } catch (err) {
    console.error("Erro excluindo:", err);
    alert("Erro ao excluir: " + (err.message || err));
  }
}


// ==========================
// EDITAR (modal simples)
// ==========================
function editar(id, item) {
  const novoDesc = prompt("Descrição:", item.descricao || "");
  if (novoDesc === null) return; // cancelou
  const novoValor = prompt("Valor:", item.valor || "");
  if (novoValor === null) return;
  const novaData = prompt("Data (YYYY-MM-DD):", item.data || "");
  if (novaData === null) return;

  const user = auth.currentUser;
  if (!user) return alert("Usuário não autenticado.");

  db.ref(`despesas/${user.uid}/${id}`).update({
    descricao: novoDesc.trim(),
    valor: Number(novoValor),
    data: novaData,
  }).then(() => carregarDespesas())
    .catch(err => {
      console.error("Erro atualizando:", err);
      alert("Erro ao atualizar: " + (err.message || err));
    });
}

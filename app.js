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


// ==========================
// LOGIN
// ==========================
document.getElementById("googleLogin").onclick = () => {
    auth.signInWithPopup(provider);
};

document.getElementById("logoutBtn").onclick = () => {
    auth.signOut();
};


// MONITOR LOGIN
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById("loginArea").style.display = "none";
        document.getElementById("appArea").style.display = "block";
        document.getElementById("userName").innerText = user.displayName;

        carregarDespesas();
    } else {
        document.getElementById("loginArea").style.display = "block";
        document.getElementById("appArea").style.display = "none";
    }
});

// ==========================
// PRIVACIDADE
// ==========================
let ocultar = false;

document.getElementById("togglePrivacidade").onclick = () => {
    ocultar = !ocultar;
    carregarDespesas();
};


// ==========================
// SALVAR DESPESA
// ==========================
document.getElementById("salvarBtn").onclick = () => {

    const user = auth.currentUser;
    if (!user) return;

    const descricao = document.getElementById("descricao").value;
    const valor = document.getElementById("valor").value;
    const data = document.getElementById("data").value;
    const repetir = document.getElementById("repetirMensal").checked;

    if (!descricao || !valor || !data) {
        alert("Preencha todos os campos");
        return;
    }

    const id = db.ref().push().key;

    db.ref(`despesas/${user.uid}/${id}`).set({
        descricao,
        valor,
        data,
        repetir
    });

    document.getElementById("descricao").value = "";
    document.getElementById("valor").value = "";
    document.getElementById("data").value = "";

    carregarDespesas();
};


// ==========================
// CARREGAR LISTA (ORDENADA)
// ==========================
function carregarDespesas() {
    const user = auth.currentUser;
    if (!user) return;

    db.ref(`despesas/${user.uid}`).once("value")
    .then(snap => {
        
        const lista = document.getElementById("lista");
        lista.innerHTML = "";

        const itens = snap.val();
        if (!itens) return;

        const arr = Object.entries(itens).map(([id, obj]) => ({ id, ...obj }));

        // Ordenar por data
        arr.sort((a, b) => new Date(a.data) - new Date(b.data));

        arr.forEach(item => {
            const li = document.createElement("li");

            li.innerHTML = `
                <span class="${ocultar ? "privado" : ""}">
                    ${item.data} — ${item.descricao} — R$ ${item.valor}
                    ${item.repetir ? " 🔄" : ""}
                </span>

                <span>
                    <button class="smallBtn" onclick="editar('${item.id}')">✏</button>
                    <button class="smallBtn" onclick="excluir('${item.id}')">🗑</button>
                </span>
            `;

            lista.appendChild(li);
        });

    });
}


// ==========================
// EXCLUIR
// ==========================
function excluir(id) {
    const user = auth.currentUser;
    db.ref(`despesas/${user.uid}/${id}`).remove();
    carregarDespesas();
}


// ==========================
// EDITAR (SIMPLIFICADO)
// ==========================
function editar(id) {
    const user = auth.currentUser;

    const novoValor = prompt("Novo valor:");
    if (!novoValor) return;

    db.ref(`despesas/${user.uid}/${id}`).update({
        valor: novoValor
    });

    carregarDespesas();
}

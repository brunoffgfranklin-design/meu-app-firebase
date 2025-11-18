// 1) CONFIGURAÇÃO DO FIREBASE → SUBSTITUIR PELOS SEUS DADOS
const firebaseConfig = {
    apiKey: "AIzaSyCztzjnqsASSgQAGJNNyp0XLzAeeEKclPY",
  authDomain: "controle-de-financas-8bfdf.firebaseapp.com",
  databaseURL: "https://controle-de-financas-8bfdf-default-rtdb.firebaseio.com/"
  projectId: "controle-de-financas-8bfdf",
  storageBucket: "controle-de-financas-8bfdf.firebasestorage.app",
  messagingSenderId: "269562705866",
  appId: "1:269562705866:web:58aeae4840ec2c6c7cc133",
  measurementId: "G-BZE9L6267J"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referência dos serviços
const auth = firebase.auth();
const db = firebase.database();


// ------------------------------------------------
// 🚀 LOGIN COM GOOGLE
// ------------------------------------------------
document.getElementById("googleLoginBtn").addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();

    auth.signInWithPopup(provider)
        .then(result => {
            const user = result.user;
            mostrarUsuario(user);
        })
        .catch(err => alert("Erro no login: " + err.message));
});


// ------------------------------------------------
// 👤 MOSTRAR USUÁRIO LOGADO
// ------------------------------------------------
function mostrarUsuario(user) {
    document.getElementById("googleLoginBtn").classList.add("hidden");

    document.getElementById("userPhoto").src = user.photoURL;
    document.getElementById("userName").innerText = user.displayName;
    document.getElementById("userEmail").innerText = user.email;

    document.getElementById("userInfo").classList.remove("hidden");
    document.getElementById("dbBox").classList.remove("hidden");
}


// ------------------------------------------------
// 🚪 LOGOUT
// ------------------------------------------------
document.getElementById("logoutBtn").addEventListener("click", () => {
    auth.signOut();
    location.reload();
});


// ------------------------------------------------
// ✍️ ENVIAR DADO PARA REALTIME DATABASE
// ------------------------------------------------
document.getElementById("sendBtn").addEventListener("click", () => {
    const value = document.getElementById("dataInput").value;

    if (value.trim() === "") return;

    db.ref("ultimoValor").set(value);

    document.getElementById("dataInput").value = "";
});


// ------------------------------------------------
// 📡 LER EM TEMPO REAL
// ------------------------------------------------
db.ref("ultimoValor").on("value", snapshot => {
    const val = snapshot.val();
    document.getElementById("lastValue").innerText = val ?? "---";
});

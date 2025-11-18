// ========================================
// CONFIGURAÇÃO DO FIREBASE
// ========================================
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

// Inicializa
firebase.initializeApp(firebaseConfig);

// ========================================
// AUTENTICAÇÃO
// ========================================
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// Login Google
function loginGoogle() {
  auth.signInWithPopup(provider)
    .then(result => {
      console.log("Logado:", result.user);

      document.getElementById("loginArea").style.display = "none";
      document.getElementById("appArea").style.display = "block";

      document.getElementById("userName").innerText = result.user.displayName;
    })
    .catch(err => {
      console.error(err);
      alert("Erro ao logar: " + err.message);
    });
}

// Logout
function logout() {
  auth.signOut().then(() => {
    document.getElementById("loginArea").style.display = "block";
    document.getElementById("appArea").style.display = "none";
  });
}

// Monitor login/logout
auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("loginArea").style.display = "none";
    document.getElementById("appArea").style.display = "block";
    document.getElementById("userName").innerText = user.displayName;
  } else {
    document.getElementById("loginArea").style.display = "block";
    document.getElementById("appArea").style.display = "none";
  }
});

// ========================================
// REALTIME DATABASE
// ========================================
const db = firebase.database();

// Salvar valor
function salvarValor() {
  const valor = document.getElementById("valor").value;
  const saque = document.getElementById("valorSaque").value;
  const user = auth.currentUser;

  if (!user) {
    alert("Faça login primeiro!");
    return;
  }

  const registro = {
    valor: valor,
    saque: saque,
    data: new Date().toISOString()
  };

  db.ref("usuarios/" + user.uid + "/lancamentos").push(registro);

  alert("Valor salvo!");

  document.getElementById("valor").value = "";
  document.getElementById("valorSaque").value = "";
}

// Conecta funções aos botões
document.getElementById("googleLogin").onclick = loginGoogle;
document.getElementById("logoutBtn").onclick = logout;
document.getElementById("salvarBtn").onclick = salvarValor;

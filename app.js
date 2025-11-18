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

// Botão de login
function loginGoogle() {
  auth.signInWithPopup(provider)
    .then(result => {
      console.log("Logado:", result.user);
      alert("Login OK!");
      document.getElementById("userName").innerText = result.user.displayName;
    })
    .catch(err => {
      console.error(err);
      alert("Erro ao logar");
    });
}

// Logout
function logout() {
  auth.signOut().then(() => {
    alert("Deslogado!");
    document.getElementById("userName").innerText = "";
  });
}

// Monitor de login
auth.onAuthStateChanged(user => {
  if (user) {
    console.log("Usuário ativo:", user.email);
    document.getElementById("userName").innerText = user.displayName;
  } else {
    console.log("Ninguém logado");
    document.getElementById("userName").innerText = "";
  }
});

// ========================================
// REALTIME DATABASE
// ========================================
const db = firebase.database();

// Salvar valor
function salvarValor() {
  const valor = document.getElementById("valorInput").value;
  const data = new Date().toISOString();

  db.ref("valores/" + data).set({
    valor: valor
  });

  alert("Valor salvo!");
}

// Ler valores
function carregarValores() {
  db.ref("valores").once("value")
    .then(snapshot => {
      console.log(snapshot.val());
    });
}

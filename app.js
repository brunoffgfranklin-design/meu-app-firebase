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

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);

// Referências
const auth = firebase.auth();
const db = firebase.database();

// Botões
const googleBtn = document.getElementById("googleLogin");
const logoutBtn = document.getElementById("logoutBtn");

// Login com Google
googleBtn.onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(result => {
            const user = result.user;

            // Exibe na tela
            document.getElementById("userName").innerText = user.displayName;
            document.getElementById("userEmail").innerText = user.email;
            document.getElementById("userPhoto").src = user.photoURL;

            document.getElementById("googleLogin").style.display = "none";
            document.getElementById("userBox").style.display = "block";

            // Salva no Realtime Database
            db.ref("users/" + user.uid).set({
                name: user.displayName,
                email: user.email,
                photo: user.photoURL,
                lastLogin: new Date().toISOString()
            });

        })
        .catch(err => {
            alert("Erro ao logar: " + err.message);
        });
};

// Logout
logoutBtn.onclick = () => {
    auth.signOut().then(() => {
        document.getElementById("googleLogin").style.display = "block";
        document.getElementById("userBox").style.display = "none";
    });
};


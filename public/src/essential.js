import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getFirestore, getDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
const firebaseConfig = {

    apiKey: "AIzaSyCbdnUcn-NLuOx8do7fkyrElmd2AsdIy7A",
  
    authDomain: "navya-organics.firebaseapp.com",
  
    projectId: "navya-organics",
  
    storageBucket: "navya-organics.appspot.com",
  
    messagingSenderId: "187805348788",
  
    appId: "1:187805348788:web:55956d2a2ee911dcf938e1",
  
    measurementId: "G-J75XMS8XK2"
  
  };

const app = initializeApp(firebaseConfig);

const auth = getAuth();

const db = getFirestore(app);

//update navbar
onAuthStateChanged(auth, async (user) => {
    if (user) {

        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        let userRole = docSnap.data().userRole;

        if(userRole=="admin"){
            document.getElementById("login").innerHTML = 
            `
            <a class="nav-link" href="profile_admin.html"><i class="fa-solid fa-bars"> Dashboard</i></a>
            `
            document.getElementById("cart").innerHTML = '';
            return;
        }

        document.getElementById("login").innerHTML = 
        `
        <a class="nav-link" href="profile_user.html"><i class="fa-solid fa-user"id="loginIcon" > Profile</i></a>
        `

        document.getElementById("cart").innerHTML =
        `
        <a class="nav-link" href="shop.html"><i class="fa-solid fa-cart-shopping"id="cartIcon"></i></a>
        `
    } else {
        document.getElementById("login").innerHTML = 
        `
        <a class="nav-link" href="login.html"><i class="fa-solid fa-user"id="loginIcon" > Login</i></a>
        `
        document.getElementById("cart").innerHTML =
        `
        <a class="nav-link" href="login.html"><i class="fa-solid fa-cart-shopping"id="cartIcon"></i></a>
        `
    }
});
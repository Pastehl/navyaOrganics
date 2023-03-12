import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

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

onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/firebase.User
      console.log(user);
      // ...
    } else {
      // User is signed out
      // ...
    }
  });

// const user = auth.currentUser;

// if (user !== null) {
//     user.providerData.forEach((profile) => {
//       console.log("Sign-in provider: " + profile.providerId);
//       console.log("  Provider-specific UID: " + profile.uid);
//       console.log("  Name: " + profile.displayName);
//       console.log("  Email: " + profile.email);
//       console.log("  Photo URL: " + profile.photoURL);
//     });
//   }

  document.getElementById('logout').onclick = function(e){
    logoutUser();
  }

  function logoutUser(){
    signOut(auth).then(() => {
        window.location.href = "index.html";
      }).catch((error) => {
        // An error happened.
      });
  }
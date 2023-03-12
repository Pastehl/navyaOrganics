import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword  } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

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

function processForm(e) {
    if (e.preventDefault) e.preventDefault();

    /* do what you want with the form */
    var email = document.getElementById('userEmail').value;
    var password = document.getElementById('userPassword').value;
    createUser(email, password);

    // You must return false to prevent the default form behavior
    return false;
}

var form = document.getElementById('my-form');
if (form.attachEvent) {
    form.attachEvent("submit", processForm);
} else {
    form.addEventListener("submit", processForm);
}

async function createUser(email, password){
    createUserWithEmailAndPassword(auth, email, password)
  .then(async (userCredential) => {
    // Signed in 
    showSuccessToast("Account Registration Processing", "Please do not close this tab");
    await setDoc(doc(db, "users", userCredential.user.uid), {
      firstname: "",
    }).then(()=>{
      showSuccessToast("Account Successfully Registered", "You will now be redirected");
      window.location.href = "index.html";
    });
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log(error);

    switch (errorCode) {
      case 'auth/email-already-in-use':
        showErrorToast("Email already in use", "Please use another email")
        break;
      case 'auth/invalid-email':
        showErrorToast("Invalid email", "Please use a valid email address")
        break;
      case 'auth/weak-password':
        showErrorToast("Weak Password", "Please use a stronger password")
        break;
        
      default:
        showErrorToast("Error", "Please try again later");
        break;
    }
    
  });
};

function showSuccessToast(header, message){
  removeElementsByClass("hide");
  document.getElementById("toastsContainer").innerHTML += `
  <div class="toast" data-autohide="false" >
    <div class="toast-header">
      <strong class="mr-auto text-primary">`+header+`</strong>
    </div>
    <div class="toast-body">
      `+message+`
    </div>
  </div>
  `
  showToasts();
}

function showErrorToast(header, message){
  removeElementsByClass("hide");
  document.getElementById("toastsContainer").innerHTML += `
  <div class="toast" data-autohide="false" >
    <div class="toast-header">
      <strong class="mr-auto text-danger">`+header+`</strong>
    </div>
    <div class="toast-body">
      `+message+`
    </div>
  </div>
  `
  showToasts();
}

function removeElementsByClass(className){
  const elements = document.getElementsByClassName(className);
  while(elements.length > 0){
      elements[0].parentNode.removeChild(elements[0]);
  }
}

function showToasts(){
  $(document).ready(function(){
      $('.toast').toast('show');
  });
}
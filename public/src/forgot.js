import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

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

async function processForm(e) {
    if (e.preventDefault) e.preventDefault();

    /* do what you want with the form */
    var email = document.getElementById('userEmail').value;
    // console.log(email);
    // console.log(password);
    await resetPasswordEmail(email);

    // You must return false to prevent the default form behavior
    return false;
}

var form = document.getElementById('my-form');
if (form.attachEvent) {
    form.attachEvent("submit", processForm);
} else {
    form.addEventListener("submit", processForm);
}

function resetPasswordEmail(email){
    sendPasswordResetEmail(auth, email)
    .then(() => {
        showSuccessToast("Email has been sent", "Please check your email to reset your password")
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        showErrorToast("Error sending email", "Please enter a valid email")
    });
}

// Toasts
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
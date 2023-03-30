import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getFirestore, doc, collection, getDoc, getDocs, updateDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

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

showProducts(document.getElementById("orderProducts").value);

async function showProducts(order){
    const productsRef = collection(db, "products");
    let q;
    if(order == "price high to low"){
        q = query(productsRef, orderBy("price", "desc"));
    }else{
        q = query(productsRef);
    }

    const querySnapshot = await getDocs(q);

    // const querySnapshot = await getDocs(collection(db, "products"));
    let productsHTML = "";
    querySnapshot.forEach((doc) => {
    // doc.data() is never undefined for query doc snapshots
        // console.log(doc.id, " => ", doc.data());
        productsHTML +=
        `
        <div class="" style="flex: 1 0 25%;">
            <div class="card shadow-lg mb-5 bg-white rounded" style="width: 16rem; height:35rem; position:relative;padding-top:2rem;margin:auto;">
                <div style="overflow:hidden;">
                <img src="`+doc.data().image+`" class="card-img-top" alt="..." style="max-height:16rem;object-fit:contain;transform:scale(1.25)">
                </div>
                <div class="card-body">
                    <h6 class="card-title"><b>`+doc.data().name+`</b></h6>
                    <h6 class="card-subtitle mb-2 text-muted">₱`+parseFloat(doc.data().price).toFixed(2)+`</h6>
                    <p class="card-text" style="font-size:0.7rem;text-align:justify;">`+doc.data().description+`</p>
                    <a data-item-id="`+doc.id+`" class="btn btn-primary cart-button" style="position:absolute;bottom:1rem;"><i class="fas  fa-shopping-cart"></i> Add to cart</a>
                </div>
            </div>
        </div> 
        `;
    });
    document.getElementById("productsContainer").innerHTML = productsHTML;

    for (const elem of document.getElementsByClassName("cart-button")) {
        elem.onclick = function(e){
            let itemID = elem.getAttribute('data-item-id')
            console.log(itemID);
            addToCart(itemID);
        }
        
    }
}

document.getElementById("orderProducts").addEventListener("change", function(){
    showProducts(this.value);
});

async function addToCart(itemID){
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            let cartItems = docSnap.data().cartItems;

            let newCartItems = [];

            let duplicate = false;
            if(!cartItems){
                newCartItems.push({productID:itemID,quantity:1})
            }else{
                newCartItems = cartItems;
                for (let i = 0; i < newCartItems.length; i++) {
                    if(newCartItems[i].productID === itemID){
                        duplicate = true;
                    }
                }
                if(!duplicate){
                    newCartItems.push({productID:itemID,quantity:1})
                }
            }

            await updateDoc(docRef, {
                cartItems: newCartItems
            }).then(function() {
                showSuccessToast("Item Added to Cart ", "Check your cart to see your items")
            });
            
        } else {
            window.location.href = "login.html";
        }
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
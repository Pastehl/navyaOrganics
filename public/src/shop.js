import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
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

onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log(user);

        showCartItems(user.uid);

        let isVerified = user.emailVerified;
        if(isVerified){
            document.getElementById("accountVerifiedChecklist").checked = true;
        }
        let completeprofile = await checkCompleteUserProfile(user.uid);
        if(completeprofile){
            // console.log("gettingChecked");
            document.getElementById("userProfileChecklist").checked = true;
        }
        let hasItems = await hasCartItems(user.uid);
        console.log(isVerified,completeprofile,hasItems)

        if(isVerified && completeprofile && hasItems){
            let checkoutButton = document.getElementById("checkout");
            checkoutButton.disabled = false;
            checkoutButton.addEventListener('click', function(){
                window.location.href = "checkout.html";
            });
        }
        addPrompts();
    } else {
        addPrompts();
        window.location.href = "index.html";
    }
});


async function updateCheckoutButton(){
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            let isVerified = user.emailVerified;
            let completeprofile = await checkCompleteUserProfile(user.uid);
            let hasItems = await hasCartItems(user.uid);

            if(isVerified && completeprofile && hasItems){
                let checkoutButton = document.getElementById("checkout");
                checkoutButton.disabled = false;
                checkoutButton.addEventListener('click', function(){
                    window.location.href = "checkout.html";
                });
            }else{
                let checkoutButton = document.getElementById("checkout");
                checkoutButton.disabled = true;
            }
        }
    });
}

async function hasCartItems(userID){
    const docRef = doc(db, "users", userID);
    const docSnap = await getDoc(docRef);

    let cartItems = docSnap.data().cartItems;

    if(cartItems != null){
        if(cartItems.length>0){
            return true;
        }
    }
    return false;
}

async function showCartItems(userID){
    const docRef = doc(db, "users", userID);
    const docSnap = await getDoc(docRef);

    console.log("Document data:", docSnap.data());
    let cartItems = docSnap.data().cartItems;

    let qtyArray = [];

    console.log(cartItems);

    if(cartItems == null || cartItems == undefined || cartItems == [] || cartItems.length == 0){
        document.getElementById("cartContainer").innerHTML = 
        `
        <div class="rounded-3 mb-4">
            <h2 style="text-align: center;">Your cart is empty</h2>
        </div>
        `
    }else{
        for (let i = 0; i < cartItems.length; i++) {
            let productID = cartItems[i].productID;
            let quantity = cartItems[i].quantity;
            
            const prodRef = doc(db, "products", productID);
            const prodDoc = await getDoc(prodRef);

            let name = prodDoc.data().name;
            let description = prodDoc.data().description;
            let price = prodDoc.data().price;
            let image = prodDoc.data().image;
            let qty = prodDoc.data().qty;
            qtyArray.push(Number(qty));

            document.getElementById("cartContainer").innerHTML += 
            `
            <div id="`+productID+`" class="card rounded-3 mb-4">
              <div class="card-body p-4">
                <div class="row d-flex justify-content-between align-items-center">
                  <div class="col-md-2 col-lg-2 col-xl-2">
                    <img
                      src="`+image+`"
                      class="img-fluid rounded-3" alt="Cotton T-shirt">
                  </div>
                  <div class="col-md-3 col-lg-3 col-xl-3">
                    <p class="lead fw-normal mb-2">`+name+`</p>
                    <p>Units left: `+qty+`</p>
                    <p>`+description+`</p>
                  </div>
                  <div class="col-md-3 col-lg-3 col-xl-2 d-flex">
                    <button data-operation="sub" data-product-id="`+productID+`" class="btn btn-link px-2 itemQuantityButton"
                      onclick="this.parentNode.querySelector('input[type=number] nn').stepDown()">
                      <i class="fas fa-minus"></i>
                    </button>
    
                    <input data-product-id="`+productID+`" class="itemQuantity" id="`+productID+`Qty" min="1" max="`+qty+`" name="quantity" value="`+quantity+`" type="number"
                      class="form-control form-control-sm" />
    
                    <button data-operation="add" data-product-id="`+productID+`" class="btn btn-link px-2 itemQuantityButton"
                      onclick="this.parentNode.querySelector('input[type=number]').stepUp()">
                      <i class="fas fa-plus"></i>
                    </button>
                  </div>
                  <div class="col-md-3 col-lg-2 col-xl-2 offset-lg-1">
                    <h5 data-price="`+price+`" id="`+productID+`Price" class="mb-0">₱`+parseFloat(quantity*price).toFixed(2)+`</h5>
                  </div>
                  <div data-product-id="`+productID+`" class="col-md-1 col-lg-1 col-xl-1 text-end trash-button" style="cursor: pointer;">
                    <a class="text-danger"><i class="fas fa-trash fa-lg"></i></a>
                  </div>
                </div>
              </div>
            </div>
            `
        }

        await addQtyButtonFunctionality(userID,qtyArray);
        await addTrashButtonFunctionality(userID);
    }
}

async function addQtyButtonFunctionality(userID,qtyArray){
    // console.log(document.getElementsByClassName("itemQuantity"));

    let itemQuantity = document.getElementsByClassName("itemQuantity");

    for (let index = 0; index < itemQuantity.length; index++) {
        const elem = itemQuantity[index];
        elem.addEventListener('keypress', function(e){
            const key = e.key;
             if(key == "."){
                 e.preventDefault();
             }
        });
        
        elem.onchange = async function(e){
            let itemID = elem.getAttribute('data-product-id');
            let newQty = elem.value;

            if(newQty<1){     
                elem.value = 1;
                newQty = 1;
            }

            if(newQty>qtyArray[index]){
                elem.value = qtyArray[index];
                return
            }

            const userRef = doc(db, "users", userID);
            const docSnap = await getDoc(userRef);

            let cartItems = docSnap.data().cartItems;
            let newCartItems = [];

            for (let i = 0; i < cartItems.length; i++) {                
                if(cartItems[i].productID == itemID){
                    let updatedItem = {productID:cartItems[i].productID, quantity:newQty}
                    newCartItems.push(updatedItem);
                    updatePriceCalc(cartItems[i].productID+"Price", newQty);
                }else{
                    newCartItems.push(cartItems[i]);
                }
                // console.log(newCartItems);
            }

            await updateDoc(userRef, {
                cartItems: newCartItems
            })
        }
    }

    // for (const [index,elem] of document.getElementsByClassName("itemQuantity")) {
    //     console.log(index)

    // }

    // console.log(document.getElementsByClassName("itemQuantityButton"));

    let itemQuantityButton = document.getElementsByClassName("itemQuantityButton");

    for (let index = 0; index < itemQuantityButton.length; index++) {
        const elem = itemQuantityButton[index];
        elem.onclick = async function(e){
            let operation = elem.getAttribute('data-operation');
            if(operation=="add"){
                let numInput = elem.parentNode.querySelector('input[type=number]');
                if ((Number(numInput.value) + 1) > qtyArray[Math.floor(index/2)]) {
                    return
                }
                numInput.value = Number(numInput.value) + 1
            }else if (operation=="sub"){
                let numInput = elem.parentNode.querySelector('input[type=number]');
                if(numInput.value > 1){
                    numInput.value = Number(numInput.value) - 1
                }
            }

            // elem.parentNode.querySelector('input[type=number]').stepUp();
            // console.log(elem.parentNode.querySelector('input[type=number]'));
            let itemID = elem.getAttribute('data-product-id');
            // let newQty = elem.value;

            const userRef = doc(db, "users", userID);
            const docSnap = await getDoc(userRef);

            let cartItems = docSnap.data().cartItems;
            let newCartItems = [];

            for (let i = 0; i < cartItems.length; i++) {                
                if(cartItems[i].productID == itemID){
                    let newQuantity = document.getElementById(cartItems[i].productID+"Qty").value;
                    if(newQuantity>0){
                        let updatedItem = {productID:cartItems[i].productID, quantity:newQuantity}
                        newCartItems.push(updatedItem);
                        updatePriceCalc(cartItems[i].productID+"Price", newQuantity);
                    }else{
                        newCartItems.push(cartItems[i]);
                    }
                    
                }else{
                    newCartItems.push(cartItems[i]);
                }
                // console.log(newCartItems);
            }

            await updateDoc(userRef, {
                cartItems: newCartItems
            })
        }
    }
}

async function addTrashButtonFunctionality(userID){
    for (const elem of document.getElementsByClassName("trash-button")) {
        // console.log(elem.getAttribute('data-product-id'));
        elem.onclick = async function(e){
            let itemID = elem.getAttribute('data-product-id')
            // console.log(itemID);

            //remove item from cart visually
            const element = document.getElementById(itemID);
            element.remove();

            //remove item from cart in database
            const userRef = doc(db, "users", userID);
            const docSnap = await getDoc(userRef);

            let cartItems = docSnap.data().cartItems;
            let newCartItems = [];

            if(cartItems == null || cartItems == undefined){
                newCartItems = [];
                await updateDoc(userRef, {
                    cartItems: newCartItems
                })
            }else{
                for (let i = 0; i < cartItems.length; i++) {
                    // console.log(i);
                    // console.log(cartItems[i].productID);
                    // console.log(itemID);
                    
                    if(cartItems[i].productID != itemID){
                        newCartItems.push(cartItems[i]);
                    }
                    // console.log(newCartItems);
                }
                if(newCartItems.length == 0){
                    document.getElementById("cartContainer").innerHTML = 
                    `
                    <div class="rounded-3 mb-4">
                        <h2 style="text-align: center;">Your cart is empty</h2>
                    </div>
                    `
                }
                await updateDoc(userRef, {
                    cartItems: newCartItems
                }).then(function(){
                    updateCheckoutButton();
                });
            }
            updateCheckoutButton();
        }
    }
}

function updatePriceCalc(elem, qty){
    let el = document.getElementById(elem);
    let itemPrice = el.getAttribute('data-price');
    let priceCalc = Number(itemPrice) * Number(qty);
    el.innerHTML = "₱" + parseFloat(priceCalc).toFixed(2);
}

//Checklist
async function checkCompleteUserProfile(userID){
    const docRef = doc(db, "users", userID);
    const docSnap = await getDoc(docRef);
    let isComplete = true;

    console.log("Document data:", docSnap.data());
    let firstname = docSnap.data().firstname;
    let lastname = docSnap.data().lastname;
    let mobile = docSnap.data().mobile;
    let address1 = docSnap.data().address1;
    let address2 = docSnap.data().address2;
    let postal = docSnap.data().postal;
    let province = docSnap.data().province;

    let userData = [firstname,lastname,mobile,address1,address2,postal,province];
    for (let i = 0; i < userData.length; i++){
        if(userData[i] == undefined){
            isComplete = false;
            return isComplete;
        }
        if(userData[i] == null || userData[i] == "" || userData[i].replace(/\s/g,'') === ""){
            console.log("empty");
            isComplete = false;
            return isComplete;
        }
    }
    return isComplete;
}

function addPrompts(){
    let accountVerified = document.getElementById("accountVerifiedChecklist");
    if(!accountVerified.checked){
        document.getElementById("verifyEmailPrompt").innerHTML = 
        `Click <a href="profile_user.html">here</a> to verify your email address.`;
    }

    let userProfile = document.getElementById("userProfileChecklist");
    if(!userProfile.checked){
        document.getElementById("userProfilePrompt").innerHTML = 
        `Click <a href="profile_user.html">here</a> to complete your User Profile.`;
    }
}
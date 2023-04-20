import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, sendEmailVerification, sendSignInLinkToEmail } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getFirestore, doc, collection, getDoc, setDoc, getDocs, updateDoc, deleteDoc, Timestamp, runTransaction, increment, arrayUnion } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-storage.js";

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

onAuthStateChanged(auth, (user) => {
    if (user) {
        showCartItems(user.uid);
        showUserInfo(user.uid, user.email);
    } else {
    }
});

async function showCartItems(userID){
    const docRef = doc(db, "users", userID);
    const docSnap = await getDoc(docRef);
    let cartItems = docSnap.data().cartItems;

    let total = 0;

    let cartContainer = document.getElementById("cartItemsTable");
    cartContainer.innerHTML = "";
    for (let i = 0; i < cartItems.length; i++) {
        let productID = cartItems[i].productID;
        let quantity = cartItems[i].quantity;
        
        const prodRef = doc(db, "products", productID);
        const prodDoc = await getDoc(prodRef);

        let name = prodDoc.data().name;
        let description = prodDoc.data().description;
        let price = prodDoc.data().price;
        let image = prodDoc.data().image;

        //add to total amount
        total += Number(price*quantity);
        
        cartContainer.innerHTML += 
        `
        <tr>
            <td><img class="rounded img-fluid" src="`+image+`" style="width:3rem;height:3rem;object-fit:cover;margin-right:1rem;">`+name+`</td>
            <td>`+price+`</td>
            <td>`+quantity+`</td>
        </tr>
        `
    }

    document.getElementById("total").innerHTML = "Total Due: Php"+parseFloat(total).toFixed(2);
}

async function showUserInfo(userID, userEmail){
    const docRef = doc(db, "users", userID);
    const docSnap = await getDoc(docRef);

    let firstname = docSnap.data().firstname;
    let lastname = docSnap.data().lastname;
    let mobile = docSnap.data().mobile;
    let address1 = docSnap.data().address1;
    let address2 = docSnap.data().address2;
    let postal = docSnap.data().postal;
    let province = docSnap.data().province;
    let image = docSnap.data().image;

    document.getElementById("firstname").value = firstname;
    document.getElementById("lastname").value = lastname;
    document.getElementById("mobile").value = mobile;
    document.getElementById("address1").value = address1;
    document.getElementById("address2").value = address2;
    document.getElementById("postal").value = postal;
    document.getElementById("province").value = province;
    document.getElementById("email").value = userEmail;
}

function getPaymentMethod(){
    let element = document.getElementsByName("flexRadioDefault");
    for(let i = 0; i < element.length; i++) {
        if(element[i].checked){
            // console.log(element[i].value);
            return element[i].value;
        }
    }
    return false;
}

document.getElementById("checkout").addEventListener('click', function(){
    confirmOrder();
});

async function confirmOrder(){
    let paymentMethod = getPaymentMethod();
    if(paymentMethod==false){
        showErrorToast("No Payment Method", "Please choose a payment method")
        return;
    }

    $('#confirmModal').modal('show');
    // showSuccessToast("Processing Request", "Please wait")

    // onAuthStateChanged(auth, async (user) => {
    //     if(user){
    //         const docRef = doc(db, "users", user.uid);
    //         const docSnap = await getDoc(docRef);

    //         let userID = user.uid;
    //         let firstname = docSnap.data().firstname;
    //         let lastname = docSnap.data().lastname;
    //         let mobile = docSnap.data().mobile;
    //         let address1 = docSnap.data().address1;
    //         let address2 = docSnap.data().address2;
    //         let postal = docSnap.data().postal;
    //         let province = docSnap.data().province;
    //         let cartItems = docSnap.data().cartItems;
    //         let orders = docSnap.data().orders;

    //         let orderID = makeid(15);

    //         let totalAmount = await calculateCartTotal(user.uid);

    //         if(orders==null){
    //             orders = []
    //             orders.push({orderID:orderID,status:"pending"});
    //         }else{
    //             orders.push({orderID:orderID,status:"pending"});
    //         }

    //         await setDoc(doc(db, "orders", orderID), {
    //             userID, userID,
    //             firstname: firstname,
    //             lastname: lastname,
    //             mobile: mobile,
    //             address1: address1,
    //             address2: address2,
    //             postal: postal,
    //             province: province,
    //             cartItems: cartItems,
    //             total: totalAmount,
    //             paymentMethod: paymentMethod,
    //             date: Timestamp.fromDate(new Date()),
    //             status: "pending"
    //         }).then(async function(){
    //             const userRef = doc(db, "users", userID);
    //             await updateDoc(userRef, {
    //                 cartItems: [],
    //                 orders: orders
    //             }).then(function(){
    //                 showSuccessToast("Order Placed", "You will now be redirected");
    //                 window.location.href = "profile_user.html";
    //             });
    //         });
    //     }
    // })
}

document.getElementById("doubleConfirm").addEventListener('click', function(){
    doubleConfirmOrder();
});

async function doubleConfirmOrder(){
    let paymentMethod = getPaymentMethod();
    showSuccessToast("Processing Request", "Please wait")

    onAuthStateChanged(auth, async (user) => {
        if(user){
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);
            
            // Get a reference to the "counters" collection
            const countersRef = collection(db, "orders");

            // Get the current value of the "documents" counter
            const docCounterRef = doc(countersRef, "placeholderID");
            const docCounterSnapshot = await getDoc(docCounterRef);
            const currentId = docCounterSnapshot.exists() ? docCounterSnapshot.data().currentOrderId : 0;

            let userID = user.uid;
            let firstname = docSnap.data().firstname;
            let lastname = docSnap.data().lastname;
            let mobile = docSnap.data().mobile;
            let address1 = docSnap.data().address1;
            let address2 = docSnap.data().address2;
            let postal = docSnap.data().postal;
            let province = docSnap.data().province;
            let cartItems = docSnap.data().cartItems;
            let orders = docSnap.data().orders;

            const orderID = currentId + 1;

            let totalAmount = await calculateCartTotal(user.uid);

            let status = paymentMethod.toUpperCase();
            
            if(orders==null){
                orders = []
                orders.push({orderID:orderID,status:status});
            }else{
                orders.push({orderID:orderID,status:status});
            }
            // await setDoc(doc(db, "users" ,"placeholderID"),{
            //     transactionID,orderID
            // })
            // Use a transaction to increment the counter and create a new document
            await runTransaction(db, async (transaction) => {
                 // Increment the counter
                //const orderID = currentId + 1;
                await updateDoc(docCounterRef, { currentOrderId: orderID });
                // console.log(typeof orderID);
                
                for (let index = 0; index < cartItems.length; index++) {
                    const element = cartItems[index];
                    let productID = element.productID;
                    let quantity = element.quantity;
                    const washingtonRef = doc(db, "products", productID);

                    // Atomically increment the population of the city by 50.
                    await updateDoc(washingtonRef, {
                        qty: increment(Number(quantity*(-1)))
                    });
                    }

                await setDoc(doc(db, "orders", String(orderID)), {
                    userID, userID,
                    firstname: firstname,
                    lastname: lastname,
                    mobile: mobile,
                    address1: address1,
                    address2: address2,
                    postal: postal,
                    province: province,
                    cartItems: cartItems,
                    total: totalAmount,
                    paymentMethod: paymentMethod,
                    date: Timestamp.fromDate(new Date()),
                    status: status
                });

                //order stats
                for (let index = 0; index < cartItems.length; index++) {
                    const element = cartItems[index];
                    let productID = element.productID;
                    let quantity = element.quantity;

                    await updateDoc(doc(db, "orders", "orderStats"),{
                        [productID]: arrayUnion({dateTime: Timestamp.fromDate(new Date()), quantity:quantity})
                    });
                }
                
                const userRef = doc(db, "users", userID);
                    await updateDoc(userRef, {
                        cartItems: [],
                        orders: orders
                    }).then(function(){
                        showSuccessToast("Order Placed", "You will now be redirected");
                        window.location.href = "profile_user.html";
                    });
            });

        }
    })
}

async function calculateCartTotal(userID){
    const docRef = doc(db, "users", userID);
    const docSnap = await getDoc(docRef);
    let cartItems = docSnap.data().cartItems;

    let total = 0;

    for (let i = 0; i < cartItems.length; i++) {
        let productID = cartItems[i].productID;
        let quantity = cartItems[i].quantity;
        
        const prodRef = doc(db, "products", productID);
        const prodDoc = await getDoc(prodRef);

        let price = prodDoc.data().price;

        //add to total amount
        total += Number(price*quantity);
    }

    return total;
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

// Random Code Generator
function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}
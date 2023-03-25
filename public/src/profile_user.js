import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, sendEmailVerification, sendSignInLinkToEmail } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getFirestore, getDoc, getDocs, doc, updateDoc, collection, query, where, orderBy} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
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

const actionCodeSettings = {
    // URL you want to redirect back to. The domain (www.example.com) for this
    // URL must be in the authorized domains list in the Firebase Console.
    url: 'https://navya-organics.web.app/profile_user.html',
    // This must be true.
    handleCodeInApp: true,
};

const app = initializeApp(firebaseConfig);

const auth = getAuth();

const db = getFirestore(app);

//show user data
onAuthStateChanged(auth, (user) => {
    if (user) {
        // console.log(user.uid);
        // console.log(user.email);
        showUserData(user.uid, user.email);
        // console.log(user);
        let isVerified = user.emailVerified;
        if(isVerified){
            let verifyButton = document.getElementById("verify");
            verifyButton.disabled = true;
            verifyButton.innerHTML = "Verified"
        }
    } else {
        showDangerAlert();
        window.location.href = "index.html";
    }
});

// sidebar Nav
let sidebarButtons = document.getElementsByClassName("sidebarButton");
let contentContainers = document.getElementsByClassName("contentContainer");
for (const elem of sidebarButtons) {
    elem.onclick = function(e){
        for (const el of sidebarButtons) {
            el.classList.remove("active");
        }
        for (const el of contentContainers) {
            el.style.display = "none";
        }
        let content = elem.getAttribute('data-label');
        document.getElementById(content).style.display = "block";
        elem.classList.add("active");
    }
}

// ****************

// See Orders

// ****************

showOrders();
async function showOrders(){
    onAuthStateChanged(auth, async (user) => {
        if(user){
            const docsRef = collection(db, "orders");

            const q = query(docsRef, orderBy("date", "desc"), where("userID", "==", user.uid));

            const querySnapshot = await getDocs(q);

            let ordersListContainer = document.getElementById("ordersListContainer");
            ordersListContainer.innerHTML = "";

            const productsSnapshot = await getDocs(collection(db, "products"));

            querySnapshot.forEach((docItem) => {
                let orderID = docItem.id;

                //date and time
                let timestamp = docItem.data().date;
                let date = timestamp.toDate();
                let dateFormat = date.getHours() + ":" + ("0"+date.getMinutes()).slice(-2) + ", "+ date.toDateString();
                //items list
                let cartItems = docItem.data().cartItems;
                let itemsList = "";
                
                for (let index = 0; index < cartItems.length; index++) {
                    const element = cartItems[index];
                    // console.log(element.productID);
                    // const docRef = doc(db, "products", element.productID);
                    // const docSnap = await getDoc(docRef);
                    let prodName = "";
                    productsSnapshot.forEach((docProd) => {
                       if(docProd.id==element.productID) {
                            prodName = docProd.data().name;
                       }
                    });

                    let item = prodName+"["+element.quantity+"]";
                    if(index==cartItems.length-1){
                        itemsList += item;
                        continue;
                    }
                    itemsList += item+"<br>";
                }

                let status = (docItem.data().status);
                switch (status) {
                    case 'pending':
                        status = 'Pending'
                        break;
                    case 'awaitingPayment':
                        status = 'Awaiting Payment'
                        break;
                    case 'paid':
                        status = 'Paid'
                        break;
                    case 'beingMade':
                        status = 'Being Made'
                        break;
                    case 'beingDelivered':
                        status = 'Out for Delivery'
                        break;
                    case 'delivered':
                        status = 'Delivered'
                        break;
                    case 'Cancelled - Product Unavailable':
                        status = 'Cancelled - Product Unavailable'
                        break;
                    case 'Cancelled - User Info Incomplete':
                        status = 'Cancelled - User Info Incomplete'
                        break;
                    case 'Cancelled - Address out of Coverage Area':
                        status = 'Cancelled - Address out of Coverage Area'
                        break;
                    
                    default:
                        break;
                }
                if(status=="Awaiting Payment"){
                    status = `<a class="gcashClickable" style="cursor:pointer;">`+status+`</a>`
                }

                let total = docItem.data().total;

                let statusHTML = "";
                if((status.toLowerCase()).includes("cancelled")){
                    statusHTML = `<td class="text-danger">`+status+`</td>`
                }else{
                    statusHTML = `<td>`+status+`</td>`
                };
                
                ordersListContainer.innerHTML += `
                <tr style="background-color: #ffffff;">
                    <td>`+orderID+`</td>
                    <td>`+dateFormat+`</td>
                    <td>`+itemsList+`</td>
                    `+statusHTML+`
                    <td>Php `+parseFloat(total).toFixed(2)+`</td>
                </tr>
                `

                addGcashModalFunc();
            });
        }
    });
    // addManageButtonFunctionality();
    // addEditButtonFunctionality();
    // addDeleteButtonFunctionality();
    // return querySnapshot;
}

function addGcashModalFunc(){
    let gcash = document.getElementsByClassName("gcashClickable");
    for (const elem of gcash) {
        elem.addEventListener('click', function(){
            $('#myModal').modal('show');
        });
    }
}

// ****************

// Update Profile

// ****************

document.getElementById("save").onclick = function(e){
    onAuthStateChanged(auth, (user) => {
        if (user) {
          // User is signed in, see docs for a list of available properties
          // https://firebase.google.com/docs/reference/js/firebase.User
          // console.log(user);
        
          updateUserData(user.uid, user.email)
          

        } else {
            showDangerAlert();
        }
    });
}

async function showUserData(userID, userEmail){
    
    const docRef = doc(db, "users", userID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        // console.log("Document data:", docSnap.data());
        let firstname = docSnap.data().firstname;
        let lastname = docSnap.data().lastname;
        let mobile = docSnap.data().mobile;
        let address1 = docSnap.data().address1;
        let address2 = docSnap.data().address2;
        let postal = docSnap.data().postal;
        let province = docSnap.data().province;
        let image = docSnap.data().image;

        if(!firstname){
            firstname = "";
        }
        if(!lastname){
            lastname = "";
        }
        if(!mobile){
            mobile = "";
        }
        if(!address1){
            address1 = "";
        }
        if(!address2){
            address2 = "";
        }
        if(!postal){
            postal = "";
        }
        if(!province){
            province = "";
        }
        if(!image){
            image = "";
        }

        document.getElementById("displayName").innerHTML = firstname + " " + lastname;
        document.getElementById("displayEmail").innerHTML = userEmail;
        document.getElementById("firstname").value = firstname;
        document.getElementById("lastname").value = lastname;
        document.getElementById("mobile").value = mobile;
        document.getElementById("address1").value = address1;
        document.getElementById("address2").value = address2;
        document.getElementById("postal").value = postal;
        document.getElementById("province").value = province;
        document.getElementById("email").value = userEmail;

        // user image
        if(image != ""){
            document.getElementById("userProfilePic").src = image;
        }else{
            document.getElementById("userProfilePic").src = "./assets/loading_gif.gif"
        }
        

    } else {
    // doc.data() will be undefined in this case
    console.log("No such document!");
    document.getElementById("displayEmail").innerHTML = userEmail;
    document.getElementById("email").value = userEmail;
    }
}

async function updateUserData(userID, userEmail){
    const userRef = doc(db, "users", userID);

    let firstname = document.getElementById("firstname").value;
    let lastname = document.getElementById("lastname").value;
    let mobile = document.getElementById("mobile").value;
    let address1 = document.getElementById("address1").value;
    let address2 = document.getElementById("address2").value;
    let postal = document.getElementById("postal").value;
    let province = document.getElementById("province").value;

    // let image = await updateUserImage(userID);
    // console.log("image", image);

    let imageElement = document.getElementById("uploadUserProfilePicture");
    if(imageElement.value != "" && imageElement != null){
        updateUserWithImage(userID, firstname, lastname, mobile, address1, address2, postal, province, userEmail);
    }else{
        await updateDoc(userRef, {
            firstname: firstname,
            lastname: lastname,
            mobile: mobile,
            address1: address1,
            address2: address2,
            postal: postal,
            province: province
    
        }).then(function() {
            showSuccessAlert();
            showUserData(userID, userEmail);
        });
    }
}

async function updateUserWithImage(userID, firstname, lastname, mobile, address1, address2, postal, province, userEmail){
    let imageElement = document.getElementById("uploadUserProfilePicture");
    if(imageElement.value != "" && imageElement != null){
        // console.log("new Image");
        // console.log(imageElement.files);
        // console.log(imageElement.files[0]);

        if(imageElement.classList.contains("is-invalid")){
            imageElement.focus();
            return;
        }
        
        if (imageElement.files && imageElement.files[0]) {
            // let filename = makeid(10);
            const storage = getStorage();
            const storageRef = ref(storage, "users/"+userID+"/"+userID);
    
            const UploadTask = uploadBytesResumable(storageRef, imageElement.files[0]);
            UploadTask.on('state-changed', (snapshot)=>{},
                (error) =>{
                    console.log(error);
                    showErrorToast("Error Uploading Image", "Please try again")
                },
                ()=>{
                    getDownloadURL(UploadTask.snapshot.ref).then( async (downloadURL)=>{
                        // console.log(downloadURL);
                        document.getElementById("userProfilePic").src = downloadURL;
                        const userRef = doc(db, "users", userID);
                        await updateDoc(userRef, {
                            firstname: firstname,
                            lastname: lastname,
                            mobile: mobile,
                            address1: address1,
                            address2: address2,
                            postal: postal,
                            province: province,
                            image: downloadURL
                    
                        }).then(function() {
                            showSuccessAlert();
                            showUserData(userID, userEmail);
                        });
                    });
                }
            );
        }
    }else{
        return null;
    }
}

document.getElementById("uploadUserProfilePicture").addEventListener('change', async function() {
    if(this.files[0].size > 2097152){
        // showErrorToast("File size too big", "Images must be less than 2MB");
        this.classList.remove("is-valid");
        this.classList.add("is-invalid");
        // this.value=""
        return;
    }
    if(this.value==""){
        this.classList.remove("is-valid");
        this.classList.remove("is-invalid");
        return;
    }
    if(this.value!=""){
        this.classList.remove("is-invalid");
        this.classList.add("is-valid");
    }
});

document.getElementById("clearProfilePicInput").addEventListener('click', async function() {
    let profilePicInput = document.getElementById("uploadUserProfilePicture");
    profilePicInput.value = '';
    profilePicInput.files = null;
    profilePicInput.classList.remove("is-valid");
    profilePicInput.classList.remove("is-invalid");
});

function showSuccessAlert(){
    document.getElementById("alertsContainer").innerHTML = `
    <div class="alert alert-success alert-dismissible alert-success fade show">
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      <strong>Update Success!</strong> Your information has been saved.
    </div>  
    `;
}

function showDangerAlert(){
    document.getElementById("alertsContainer").innerHTML = `
    <div class="alert alert-danger alert-dismissible fade show">
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      <strong>User Logged Out!</strong> Refresh the page or sign in <a href="login.html">here</a>.
    </div>  
    `;
}

// Logout
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

// Email Verification
document.getElementById('verify').onclick = function(e){
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // console.log(user);
            sendEmailVerification(user, actionCodeSettings);
            showSuccessToast();
            //user.currentUser;
            //sendVerificationEmail(user.email)

        } else {
            showErrorToast();
        }
    });
}

// Toasts
function showSuccessToast(){
    removeElementsByClass("hide");
    document.getElementById("toastsContainer").innerHTML += `
    <div class="toast" data-autohide="false" >
      <div class="toast-header">
        <strong class="mr-auto text-primary">Email Verification Sent</strong>
      </div>
      <div class="toast-body">
        Please check your email to continue verification
      </div>
    </div>
    `
    showToasts();
}

function showErrorToast(){
    removeElementsByClass("hide");
    document.getElementById("toastsContainer").innerHTML += `
    <div class="toast" data-autohide="false" >
      <div class="toast-header">
        <strong class="mr-auto text-danger">Error Sending Email</strong>
      </div>
      <div class="toast-body">
        Please try again later
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

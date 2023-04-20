import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, sendEmailVerification, sendSignInLinkToEmail } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getFirestore, getDoc, getDocs, doc, deleteDoc, updateDoc, collection, query, where, orderBy} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
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
            verifyButton.innerHTML = "Verified";
        }
    } else {
        showDangerAlert();
        // window.location.href = "index.html";
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
                    <td>
                        <li class="list-inline-item">
                            <a href="javascript:void(0);" data-bs-toggle="tooltip" data-bs-placement="top" data-productID="`+orderID+`" title="Delete" class="px-2 text-danger showCancelOrderButton"><i class="fa-solid fa-ban"></i></a>
                        </li>
                    </td>
                </tr>
                `

                addGcashModalFunc();
            });
            addCancelOrderButtonFunctionality();
        }
    });
    
    // addManageButtonFunctionality();
    // addEditButtonFunctionality();
    // addDeleteButtonFunctionality();
    // return querySnapshot;
}

function addCancelOrderButtonFunctionality(){
    let editButtons = document.getElementsByClassName("showCancelOrderButton");
    for (const elem of editButtons) {
        elem.addEventListener('click', async function() {

            let orderID = elem.getAttribute("data-productID");

            document.getElementById("cancelOrderPrompt").innerHTML =
            "Are you sure you want to cancel your order?";
            
            $('#cancelOrderModal').modal('show');

            //reset event listeners
            var old_element = document.getElementById("cancelOrderButton");
            var new_element = old_element.cloneNode(true);
            old_element.parentNode.replaceChild(new_element, old_element);

            document.getElementById("cancelOrderButton").addEventListener('click', async function() {
                $('#cancelOrderModal').modal('hide');
                showSuccessToast("Processing Request", "Please Wait");
                // console.log("stuff here");
                cancelOrder(orderID);
            });
        });
    }
};

async function cancelOrder(orderID){
    const docRef = doc(db, "orders", orderID);
    const docSnap = await getDoc(docRef);

    let status = docSnap.data().status;

    if(status == "pending" || status == "awaitingPayment" || status == "paid" || status == "beingMade"){
        await updateDoc(docRef, {
            status: "Cancelled - Cancelled by Customer"
        }).then(function(){
            showSuccessToast("Success", "Your order has been cancelled");
        });
    }else if(status == "beingDelivered"){
        showErrorToast("Cannot be Cancelled","Your order is out for delivery.");
    }
    else if(status == "delivered"){
        showErrorToast("Cannot be Cancelled","Your order has already been delivered.");
    }
    else{
        showErrorToast("Cannot be Cancelled","Order has already been cancelled.");
    }
    querySnapshotReviews = await showOrders("desc");
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

// Manage Reviews

// ****************

var querySnapshotReviews = await showReviews("desc");
async function showReviews(order){
    onAuthStateChanged(auth, async (user) => {
        if(user){
            // const querySnapshot = await getDocs(collection(db, "orders"));
            const docsRef = collection(db, "reviews");
            let q;
            if(order=="asc"){
                q = query(docsRef, where("userID","==",user.uid), orderBy("date", "asc"));
            }else{
                q = query(docsRef, where("userID","==",user.uid), orderBy("date", "desc"));
            }
            
            const querySnapshot = await getDocs(q);
            let reviewsListContainer = document.getElementById("reviewsListContainer");
            reviewsListContainer.innerHTML = "";
            querySnapshot.forEach((doc) => {
                // doc.data() is never undefined for query doc snapshots
                // console.log(doc.id, " => ", doc.data());

                //name
                // let firstname = doc.data().firstname;
                // let lastname = doc.data().lastname;
                let fullname = doc.data().user;

                //date and time
                let timestamp = doc.data().date;
                let date = timestamp.toDate();
                let dateFormat = date.getHours() + ":" + ("0"+date.getMinutes()).slice(-2) + ", "+ date.toDateString();

                //product
                let product = doc.data().product;
                // let itemsList = "";

                // for (let index = 0; index < cartItems.length; index++) {
                //     const element = cartItems[index];
                //     let item = element.productID+"["+element.quantity+"]";
                //     if(index==cartItems.length-1){
                //         itemsList += item;
                //         continue;
                //     }
                //     itemsList += item+",";
                // }

                //rating
                let rating = doc.data().rating;

                //total
                let review = doc.data().review;

                reviewsListContainer.innerHTML += `
                <tr style="background-color: #ffffff;">
                    <td>`+dateFormat+`</td>
                    <td>`+product+`</td>
                    <td>`+rating+`</td>
                    <td style="word-wrap: break-word;">`+review+`</td>
                    <td>
                        <ul class="list-inline mb-0">
                            <li class="list-inline-item">
                                <a href="javascript:void(0);" data-bs-toggle="tooltip" data-bs-placement="top" data-productID="`+doc.id+`" title="Edit" class="px-2 text-primary showEditModalButton"><i class="fa-solid fa-pen"></i></a>
                            </li>
                            <li class="list-inline-item">
                                <a href="javascript:void(0);" data-bs-toggle="tooltip" data-bs-placement="top" data-productID="`+doc.id+`" title="Delete" class="px-2 text-danger showDeleteReviewModalButton"><i class="fa-solid fa-trash"></i></a>
                            </li>
                        </ul>
                    </td>
                </tr>
                `
            });
            addEditReviewButtonFunctionality();
            addDeleteReviewButtonFunctionality();
           
            // addEditButtonFunctionality();
            // addDeleteButtonFunctionality();
            return querySnapshot;
        }
    });
}

document.getElementById("reviewsSearchOrdering").addEventListener("change", function(){
    console.log(this.value);
    if(this.value == "desc"){
        showReviews("desc");
    }
    else{
        showReviews("asc");
    }
});

function addEditReviewButtonFunctionality(){
    let editButtons = document.getElementsByClassName("showEditModalButton");
    for (const elem of editButtons) {
        elem.addEventListener('click', async function() {
            document.getElementById("reviewTextAreaLabel").innerHTML = "Comments (0/150)";
            
            let reviewsID = elem.getAttribute("data-productID");

            const docRef = doc(db, "reviews", reviewsID);
            const docSnap = await getDoc(docRef);
            document.getElementById("reviewTextArea").value = docSnap.data().review;
            let product = docSnap.data().product;
            
            document.getElementById("productSelectOption").innerHTML =
                `
                <option value="`+product+`" selected>`+product+`</option>
                `;

            let ratingScore = docSnap.data().rating;
            let starsDiv = document.getElementById('starsDiv');

            let ratingHTML = "";
            for (let index = 0; index < 5; index++) {
                if(ratingScore>0){
                    ratingHTML+=
                    `
                    <i data-rating="`+Number(index+1)+`" class="fa-solid fa-star ratingStar"></i>
                    `
                }else{
                    ratingHTML+=
                    `
                    <i data-rating="`+Number(index+1)+`" class="fa-regular fa-star ratingStar"></i>
                    `
                }
                
                ratingScore--;
            }
            starsDiv.innerHTML = ratingHTML;
            addStarFunc();

            document.getElementById("updateReviewButton").addEventListener("click", function(){
                updateReview(reviewsID);
            });
            
            $('#newReviewModal').modal('show');
        });
    }
}

document.getElementById("reviewTextArea").addEventListener('input', function(){
    let inputString = document.getElementById("reviewTextArea").value;
    // console.log(inputString);
    // console.log(inputString.length);
    document.getElementById("reviewTextAreaLabel").innerHTML = "Comments ("+inputString.length+"/150)";
});

function addStarFunc(){
    let stars = document.getElementsByClassName("ratingStar")
    for (const elem of stars) {
        elem.addEventListener('click', function(){
            let rating = this.getAttribute("data-rating");
            let starsDiv = document.getElementById("starsDiv");
            let ratingHTML = '';
            for (let index = 0; index < 5; index++) {
                if(rating>0){
                    ratingHTML+=
                    `
                    <i data-rating="`+Number(index+1)+`" class="fa-solid fa-star ratingStar"></i>
                    `
                }else{
                    ratingHTML+=
                    `
                    <i data-rating="`+Number(index+1)+`" class="fa-regular fa-star ratingStar"></i>
                    `
                }
                
                rating--;
            }
            starsDiv.innerHTML = ratingHTML;
            // prevStars = ratingHTML;
            addStarFunc();
            // addStarHoverFunc();
        })
    }
}

async function updateReview(reviewID){

    var productOption = document.getElementById("productSelectOption").value;

    let starRating = document.getElementsByClassName("fa-solid ratingStar").length;

    if(starRating < 1){
        showErrorToast("No Rating Given", "Please choose a star rating")
        return;
    }

    let reviewTextArea = document.getElementById("reviewTextArea").value;

    showSuccessToast("Processing Request", "Please Wait");

    const docRef = doc(db, "reviews", reviewID);

    await updateDoc(docRef, {
        product: productOption,
        rating: starRating,
        review: reviewTextArea
    }).then(function(){
        showSuccessToast("Success", "Review Updated");
        $('#newReviewModal').modal('hide');
    });
}

function addDeleteReviewButtonFunctionality(){
    let editButtons = document.getElementsByClassName("showDeleteReviewModalButton");
    for (const elem of editButtons) {
        elem.addEventListener('click', async function() {

            let reviewID = elem.getAttribute("data-productID");

            document.getElementById("deleteReviewPrompt").innerHTML =
            "Are you sure you want to delete your review?";
            
            $('#deleteReviewModal').modal('show');

            document.getElementById("deleteReviewButton").addEventListener('click', async function() {
                $('#deleteReviewModal').modal('hide');
                showSuccessToast("Processing Request", "Please Wait");
                // console.log("stuff here");
                deleteReview(reviewID);
                querySnapshotReviews = await showReviews("desc");
            });
        });
    }
}

async function deleteReview(reviewsID){
    await deleteDoc(doc(db, "reviews", reviewsID)).then(function() {
        showSuccessToast("Success", "Review has been deleted")
    });;
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
    let missingRequired = false

    let firstname = document.getElementById("firstname").value;
    let lastname = document.getElementById("lastname").value;
    let mobile = document.getElementById("mobile").value;
    let address1 = document.getElementById("address1").value;
    let address2 = document.getElementById("address2").value;
    let postal = document.getElementById("postal").value;
    let province = document.getElementById("province").value;

    if (!firstname) {
        document.getElementById("firstname").style.background = "#E97777";
        missingRequired = true;
        console.log(firstname)
    }
    if (!lastname) {
        document.getElementById("lastname").style.background = "#E97777";
        missingRequired = true;
    }
    if (!mobile) {
        document.getElementById("mobile").style.background = "#E97777";
        missingRequired = true;
    }
    if (!address1) {
        document.getElementById("address1").style.background = "#E97777";
        missingRequired = true;
    }
    if (!address2) {
        document.getElementById("address2").style.background = "#E97777";
        missingRequired = true;
    }
    if (!postal) {
        document.getElementById("postal").style.background = "#E97777";
        missingRequired = true;
    }
    if (!province) {
        document.getElementById("province").style.background = "#E97777";
        missingRequired = true;
    }
    if (missingRequired) {
        return
    }

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
            showSuccessToast("Email Verification Sent","Please check your email to continue verification");
            //user.currentUser;
            //sendVerificationEmail(user.email)

        } else {
            showErrorToast("Error Sending Email","Please try again later");
        }
    });
}

// Clear fields
document.getElementById("firstname").onclick = function(e) {
    document.getElementById("firstname").style.background = "none";
}
document.getElementById("lastname").onclick = function(e) {
    document.getElementById("lastname").style.background = "none";
}
document.getElementById("mobile").onclick = function(e) {
    document.getElementById("mobile").style.background = "none";
}
document.getElementById("address1").onclick = function(e) {
    document.getElementById("address1").style.background = "none";
}
document.getElementById("address2").onclick = function(e) {
    document.getElementById("address2").style.background = "none";
}
document.getElementById("postal").onclick = function(e) {
    document.getElementById("postal").style.background = "none";
}
document.getElementById("province").onclick = function(e) {
    document.getElementById("province").style.background = "none";
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

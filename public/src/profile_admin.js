import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getFirestore, doc, collection, getDoc, setDoc, getDocs, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
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

// window.addEventListener('load', function() {
//     document.querySelector('input[type="file"]').addEventListener('change', function() {
//         if (this.files && this.files[0]) {
//             // var img = document.querySelector('img');
//             // img.onload = () => {
//             //     URL.revokeObjectURL(img.src);  // no longer needed, free memory
//             // }
            
//             let filename = makeid(10);
//             const storage = getStorage();
//             const storageRef = ref(storage, "products/"+filename);

//             // 'file' comes from the Blob or File API
//             // uploadBytes(storageRef, this.files[0]).then((snapshot) => {
//             // console.log('Uploaded a blob or file!');
//             // });

  
//             const UploadTask = uploadBytesResumable(storageRef, this.files[0]);
//             UploadTask.on('state-changed', (snapshot)=>{},
//                 (error) =>{
//                     console.log(error);
//                     //errorOkPopUp("Error Uploading Image", "Please try again later");
//                 },
//                 ()=>{

//                     getDownloadURL(UploadTask.snapshot.ref).then((downloadURL)=>{
//                         console.log(downloadURL);
//                         // const userDBRef = doc(db, "users", user.uid);
//                         // setDoc(userDBRef, {
//                         //     image: downloadURL
//                         // }, { merge: true });
//                         // document.getElementById("profileImage").src = downloadURL;
//                     });
                    
//                 }
//             );
//         }
//     });
// });




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

// ************************

// Manage Orders

// ************************

var querySnapshotOrders = await showOrders("desc");
async function showOrders(order){
    // const querySnapshot = await getDocs(collection(db, "orders"));
    const docsRef = collection(db, "orders");
    let q;
    if(order=="asc"){
        q = query(docsRef, orderBy("date", "asc"));
    }else{
        q = query(docsRef, orderBy("date", "desc"));
    }
     
    const querySnapshot = await getDocs(q);
    let ordersListContainer = document.getElementById("ordersListContainer");
    ordersListContainer.innerHTML = "";
    querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        // console.log(doc.id, " => ", doc.data());

        //name
        let firstname = doc.data().firstname;
        let lastname = doc.data().lastname;
        let fullname = firstname + " " + lastname;

        //date and time
        let timestamp = doc.data().date;
        let date = timestamp.toDate();
        let dateFormat = date.getHours() + ":" + ("0"+date.getMinutes()).slice(-2) + ", "+ date.toDateString();

        //items list
        let cartItems = doc.data().cartItems;
        let itemsList = "";

        for (let index = 0; index < cartItems.length; index++) {
            const element = cartItems[index];
            let item = element.productID+"["+element.quantity+"]";
            if(index==cartItems.length-1){
                itemsList += item;
                continue;
            }
            itemsList += item+",";
        }

        //status
        let statusData = doc.data().status;
        let status = capitalizeFirstLetter(statusData);

        //total
        let total = doc.data().total;

        let statusHTML = "";
        if((status.toLowerCase()).includes("cancelled")){
            statusHTML = `<td class="text-danger">`+status+`</td>`
        }else{
            statusHTML = `<td>`+status+`</td>`
        };

        ordersListContainer.innerHTML += `
        <tr style="background-color: #ffffff;">
            <td>`+doc.id+`</td>
            <td>`+fullname+`</td>
            <td>`+dateFormat+`</td>
            <td>`+itemsList+`</td>
            `+statusHTML+`
            <td>Php `+parseFloat(total).toFixed(2)+`</td>
            <td>
                <ul class="list-inline mb-0">
                    <li class="list-inline-item">
                        <a href="javascript:void(0);" data-bs-toggle="tooltip" data-bs-placement="top" data-productID="`+doc.id+`" title="Manage" class="px-2 text-primary showManageModalButton"><i class="fa-solid fa-bars"></i></a>
                    </li>
                </ul>
            </td>
        </tr>
        `
    });
    addManageButtonFunctionality();
    // addEditButtonFunctionality();
    // addDeleteButtonFunctionality();
    return querySnapshot;
}

// Orders Search
document.getElementById("ordersSearchButton").addEventListener('click', async function() {
    ordersSearchFunctionality(querySnapshotOrders);
});

document.addEventListener("keyup", function(event) {
    if (event.code === 'Enter') {
        if(document.getElementById("ordersSearch") === document.activeElement){
            ordersSearchFunctionality(querySnapshotOrders);
        }
    }
});

function ordersSearchFunctionality(querySnapshotOrders){
    var searchInput = document.getElementById("ordersSearch").value;
    var searchOption = document.getElementById("ordersSearchOption").value;
    switch (searchOption) {
        case "id":
            document.getElementById("ordersListContainer").innerHTML = "";
            querySnapshotOrders.forEach((doc) => {
                if((doc.id.toLowerCase()).includes(searchInput.toLowerCase())){
                    showSearchedOrders(doc.id,doc.data().firstname,doc.data().lastname,doc.data().date,doc.data().cartItems,doc.data().status,doc.data().total);
                }
            });
            addManageButtonFunctionality();
            // addEditButtonFunctionality();
            // addDeleteButtonFunctionality();
            break;
        case "user":
            document.getElementById("ordersListContainer").innerHTML = "";
            querySnapshotOrders.forEach((doc) => {
                if((((doc.data().firstname)+" "+(doc.data().lastname)).toLowerCase()).includes(searchInput.toLowerCase())){
                    showSearchedOrders(doc.id,doc.data().firstname,doc.data().lastname,doc.data().date,doc.data().cartItems,doc.data().status,doc.data().total);
                }
            });
            addManageButtonFunctionality();
            break;
        case "status":
            document.getElementById("ordersListContainer").innerHTML = "";
            querySnapshotOrders.forEach((doc) => {
                if((doc.data().status.toLowerCase()).includes(searchInput.toLowerCase())){
                    showSearchedOrders(doc.id,doc.data().firstname,doc.data().lastname,doc.data().date,doc.data().cartItems,doc.data().status,doc.data().total);
                }
            });
            addManageButtonFunctionality();
            break;
        case "total >=":
            document.getElementById("ordersListContainer").innerHTML = "";
            querySnapshotOrders.forEach((doc) => {
                if(doc.data().total >= searchInput){
                    showSearchedOrders(doc.id,doc.data().firstname,doc.data().lastname,doc.data().date,doc.data().cartItems,doc.data().status,doc.data().total);
                }
            });
            addManageButtonFunctionality();
            break;
        case "total <=":
            document.getElementById("ordersListContainer").innerHTML = "";
            querySnapshotOrders.forEach((doc) => {
                if(doc.data().total <= searchInput){
                    showSearchedOrders(doc.id,doc.data().firstname,doc.data().lastname,doc.data().date,doc.data().cartItems,doc.data().status,doc.data().total);
                }
            });
            addManageButtonFunctionality();
            break;
        case "products":
            document.getElementById("ordersListContainer").innerHTML = "";
            querySnapshotOrders.forEach((doc) => {
                if(hasProduct(doc.data().cartItems, searchInput)){
                    showSearchedOrders(doc.id,doc.data().firstname,doc.data().lastname,doc.data().date,doc.data().cartItems,doc.data().status,doc.data().total);
                }
            });
            addManageButtonFunctionality();
            break;
    
        default:
            break;
    }

    if(searchInput==""){
        let order = document.getElementById("ordersSearchOrdering").value;
        if(order=="asc"){
            showOrders("asc");
        }else{
            showOrders("desc");
        }
        
    }

    function hasProduct(cartItems, product){
        for (let index = 0; index < cartItems.length; index++) {
            const element = cartItems[index];
            if(element.productID==product){
                return true;
            }
        }
        return false;
    };

    function showSearchedOrders(id,firstname,lastname,date,cartItems,stat,total){

        //name
        let fname = firstname;
        let lname = lastname;
        let fullname = fname + " " + lname;

        //date and time
        let timestamp = date;
        let dateTime = timestamp.toDate();
        let dateFormat = dateTime.getHours() + ":" + ("0"+dateTime.getMinutes()).slice(-2) + ", "+ dateTime.toDateString();

        //items list
        let cartItems2 = cartItems;
        let itemsList = "";

        for (let index = 0; index < cartItems2.length; index++) {
            const element = cartItems2[index];
            let item = element.productID+"["+element.quantity+"]";
            if(index==cartItems2.length-1){
                itemsList += item;
                continue;
            }
            itemsList += item+",";
        }

        //status
        let statusData = stat;
        let status = capitalizeFirstLetter(statusData);


        let ordersListContainer = document.getElementById("ordersListContainer");
        ordersListContainer.innerHTML += `
        <tr style="background-color: #ffffff;">
            <td>`+id+`</td>
            <td>`+fullname+`</td>
            <td>`+dateFormat+`</td>
            <td>`+itemsList+`</td>
            <td>`+status+`</td>
            <td>Php `+parseFloat(total).toFixed(2)+`</td>
            <td>
                <ul class="list-inline mb-0">
                    <li class="list-inline-item">
                        <a href="javascript:void(0);" data-bs-toggle="tooltip" data-bs-placement="top" data-productID="`+id+`" title="Manage" class="px-2 text-primary showManageModalButton"><i class="fa-solid fa-bars"></i></a>
                    </li>
                </ul>
            </td>
        </tr>
        `
    }
}

document.getElementById("ordersSearchOrdering").addEventListener("change", function(){
    console.log(this.value);
    if(this.value == "desc"){
        ordersSearchFunctionality(querySnapshotOrders);
    }
    else{
        ordersSearchFunctionality(querySnapshotOrders.docs.reverse());
    }
});

function addManageButtonFunctionality(){
    let editButtons = document.getElementsByClassName("showManageModalButton");
    for (const elem of editButtons) {
        elem.addEventListener('click', async function() {
            document.getElementById("orderName").value = "";
            document.getElementById("orderUserID").value = "";
            document.getElementById("orderMobile").value = "";
            document.getElementById("orderAddress1").value = "";
            document.getElementById("orderAddress2").value = "";
            document.getElementById("orderPostcode").value = "";
            document.getElementById("orderProvince").value = "";

            document.getElementById("orderID").value = "";
            document.getElementById("orderDate").value = "";
            document.getElementById("orderCart").value = "";
            document.getElementById("orderTotal").value = "";
            document.getElementById("orderPaymentMethod").value = "";

            let orderID = elem.getAttribute("data-productID");

            const docRef = doc(db, "orders", orderID);
            const docSnap = await getDoc(docRef);

            let data = docSnap.data();

            document.getElementById("orderName").value = data.firstname + " " + data.lastname;
            document.getElementById("orderUserID").value = data.userID;
            document.getElementById("orderMobile").value = data.mobile;
            document.getElementById("orderAddress1").value = data.address1;
            document.getElementById("orderAddress2").value = data.address2;
            document.getElementById("orderPostcode").value = data.postal;
            document.getElementById("orderProvince").value = data.province;

            document.getElementById("orderID").value = docSnap.id;

            //date and time
            let timestamp = data.date;
            let dateTime = timestamp.toDate();
            let dateFormat = dateTime.getHours() + ":" + ("0"+dateTime.getMinutes()).slice(-2) + ", "+ dateTime.toDateString();

            document.getElementById("orderDate").value = dateFormat;

            //items list
            let cartItems2 = data.cartItems;
            let itemsList = "";

            for (let index = 0; index < cartItems2.length; index++) {
                const element = cartItems2[index];
                let item = element.productID+"["+element.quantity+"]";
                if(index==cartItems2.length-1){
                    itemsList += item;
                    continue;
                }
                itemsList += item+",";
            }

            document.getElementById("orderCart").value = itemsList;
            document.getElementById("orderTotal").value = data.total;
            document.getElementById("orderPaymentMethod").value = data.paymentMethod.toUpperCase();

            var mySelect = document.getElementById('orderStatusOption');
            mySelect.value = data.status;
            mySelect.onchange = async (event) => {
                var inputText = event.target.value;
                // console.log(inputText);
                const docRef = doc(db, "orders", orderID);
                await updateDoc(docRef, {
                    status: inputText
                }).then(async function(){
                    querySnapshotOrders = await showOrders("desc");
                })
            }
            
            $('#manageOrderModal').modal('show');
        });
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// ************************

// Manage Reviews

// ************************

var querySnapshotReviews = await showReviews("desc");
async function showReviews(order){
    // const querySnapshot = await getDocs(collection(db, "orders"));
    const docsRef = collection(db, "reviews");
    let q;
    if(order=="asc"){
        q = query(docsRef, orderBy("date", "asc"));
    }else{
        q = query(docsRef, orderBy("date", "desc"));
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
        let reviewDisabled = doc.data().reviewDisabled;
        if(reviewDisabled === true){
            review = "Comment has been disabled due to violation of Terms and Service."
        }


        reviewsListContainer.innerHTML += `
        <tr style="background-color: #ffffff;">
            <td>`+doc.id+`</td>
            <td>`+dateFormat+`</td>
            <td>`+fullname+`</td>
            <td>`+product+`</td>
            <td>`+rating+`</td>
            <td>`+review+`</td>
            <td>
                <ul class="list-inline mb-0">
                    <li class="list-inline-item">
                        <a href="javascript:void(0);" data-bs-toggle="tooltip" data-bs-placement="top" data-productID="`+doc.id+`" title="Delete" class="px-2 text-danger showDeleteReviewModalButton"><i class="fa-solid fa-trash"></i></a>
                    </li>
                </ul>
            </td>
        </tr>
        `
    });
    addDeleteReviewButtonFunctionality();
    // addEditButtonFunctionality();
    // addDeleteButtonFunctionality();
    return querySnapshot;
}

// Reviews Search
document.getElementById("reviewsSearchButton").addEventListener('click', async function() {
    reviewsSearchFunctionality(querySnapshotReviews);
});

document.addEventListener("keyup", function(event) {
    if (event.code === 'Enter') {
        if(document.getElementById("reviewsSearch") === document.activeElement){
            reviewsSearchFunctionality(querySnapshotReviews);
        }
    }
});

function reviewsSearchFunctionality(querySnapshotReviews){
    var searchInput = document.getElementById("reviewsSearch").value;
    var searchOption = document.getElementById("reviewsSearchOption").value;
    switch (searchOption) {
        case "id":
            document.getElementById("reviewsListContainer").innerHTML = "";
            querySnapshotReviews.forEach((doc) => {
                if((doc.id.toLowerCase()).includes(searchInput.toLowerCase())){
                    showSearchedReviews(doc.id,doc.data().date,doc.data().user,doc.data().product,doc.data().rating,doc.data().review);
                }
            });
            addDeleteReviewButtonFunctionality();
            // addEditButtonFunctionality();
            // addDeleteButtonFunctionality();
            break;
        case "user":
            document.getElementById("reviewsListContainer").innerHTML = "";
            querySnapshotReviews.forEach((doc) => {
                if(((doc.data().user).toLowerCase()).includes(searchInput.toLowerCase())){
                    showSearchedReviews(doc.id,doc.data().date,doc.data().user,doc.data().product,doc.data().rating,doc.data().review);
                }
            });
            addDeleteReviewButtonFunctionality();
            break;
        case "product":
            document.getElementById("reviewsListContainer").innerHTML = "";
            querySnapshotReviews.forEach((doc) => {
                if((doc.data().product.toLowerCase()).includes(searchInput.toLowerCase())){
                    showSearchedReviews(doc.id,doc.data().date,doc.data().user,doc.data().product,doc.data().rating,doc.data().review);
                }
            });
            addDeleteReviewButtonFunctionality();
            break;
        case "rating >=":
            document.getElementById("reviewsListContainer").innerHTML = "";
            querySnapshotReviews.forEach((doc) => {
                if(doc.data().rating >= searchInput){
                    showSearchedReviews(doc.id,doc.data().date,doc.data().user,doc.data().product,doc.data().rating,doc.data().review);
                }
            });
            addDeleteReviewButtonFunctionality();
            break;
        case "rating <=":
            document.getElementById("reviewsListContainer").innerHTML = "";
            querySnapshotReviews.forEach((doc) => {
                if(doc.data().rating <= searchInput){
                    showSearchedReviews(doc.id,doc.data().date,doc.data().user,doc.data().product,doc.data().rating,doc.data().review);
                }
            });
            addDeleteReviewButtonFunctionality();
            break;
        case "comment":
            document.getElementById("reviewsListContainer").innerHTML = "";
            querySnapshotReviews.forEach((doc) => {
                if((doc.data().review.toLowerCase()).includes(searchInput.toLowerCase())){
                    showSearchedReviews(doc.id,doc.data().date,doc.data().user,doc.data().product,doc.data().rating,doc.data().review);
                }
            });
            addDeleteReviewButtonFunctionality();
            break;
        default:
            break;
    }

    if(searchInput==""){
        let order = document.getElementById("reviewsSearchOrdering").value;
        if(order=="asc"){
            showReviews("asc");
        }else{
            showReviews("desc");
        }
        
    }

    function showSearchedReviews(id,dateInput,user,productInput,ratingInput,comment){

        let fullname = user;

        //date and time
        let timestamp = dateInput;
        let date = timestamp.toDate();
        let dateFormat = date.getHours() + ":" + ("0"+date.getMinutes()).slice(-2) + ", "+ date.toDateString();

        //product
        let product = productInput;

        //rating
        let rating = ratingInput;

        //total
        let review = comment;

        reviewsListContainer.innerHTML += `
        <tr style="background-color: #ffffff;">
            <td>`+id+`</td>
            <td>`+dateFormat+`</td>
            <td>`+fullname+`</td>
            <td>`+product+`</td>
            <td>`+rating+`</td>
            <td style="word-wrap: break-word;">`+review+`</td>
            <td>
                <ul class="list-inline mb-0">
                    <li class="list-inline-item">
                        <a href="javascript:void(0);" data-bs-toggle="tooltip" data-bs-placement="top" data-productID="`+doc.id+`" title="Delete" class="px-2 text-danger showDeleteReviewModalButton"><i class="fa-solid fa-trash"></i></a>
                    </li>
                </ul>
            </td>
        </tr>
        `
    }
}

document.getElementById("reviewsSearchOrdering").addEventListener("change", function(){
    console.log(this.value);
    if(this.value == "desc"){
        reviewsSearchFunctionality(querySnapshotReviews);
    }
    else{
        reviewsSearchFunctionality(querySnapshotReviews.docs.reverse());
    }
});

function addDeleteReviewButtonFunctionality(){
    let editButtons = document.getElementsByClassName("showDeleteReviewModalButton");
    for (const elem of editButtons) {
        elem.addEventListener('click', async function() {

            let reviewID = elem.getAttribute("data-productID");

            document.getElementById("deleteReviewPrompt").innerHTML =
            "Are you sure you want to delete review <b>"+reviewID+"</b>?";
            
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
    await updateDoc(doc(db, "reviews", reviewsID)).then(function() {
            reviewDisabled: Boolean(true)
        }).then( async function() {
            showSuccessToast("Success", "Review has been deleted")
        });
       
}

// ************************

// Manage Products

// ************************

// initial show products
var querySnapshot = await showProducts();


async function showProducts(){
    const querySnapshot = await getDocs(collection(db, "products"));
    let productsListContainer = document.getElementById("productsListContainer");
    productsListContainer.innerHTML = "";
    querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        // console.log(doc.id, " => ", doc.data());
        let quantity = doc.data().qty;

        let statusHTML = "<td>"+quantity+"</td>"

        if (Number(quantity) <= 5) {
            statusHTML = `<td class="text-danger">`+quantity+`</td>`
        }

        productsListContainer.innerHTML += `
        <tr style="background-color: #ffffff;">
            <td>`+doc.id+`</td>
            <td>`+doc.data().name+`</td>
            <td><img src="`+doc.data().image+`" class="card-img-top" alt="..." style="height:3rem;width: auto;"></td>
            <td>`+doc.data().description+`</td>
            <td>Php `+parseFloat(doc.data().price).toFixed(2)+`</td>
            `+statusHTML+`
            <td>
                <ul class="list-inline mb-0">
                    <li class="list-inline-item">
                        <a href="javascript:void(0);" data-bs-toggle="tooltip" data-bs-placement="top" data-productID="`+doc.id+`" title="Edit" class="px-2 text-primary showEditModalButton"><i class="fa-solid fa-pen"></i></a>
                    </li>
                    <li class="list-inline-item">
                        <a href="javascript:void(0);" data-bs-toggle="tooltip" data-bs-placement="top" data-productID="`+doc.id+`" title="Delete" class="px-2 text-danger showDeleteModalButton"><i class="fa-solid fa-trash"></i></a>
                    </li>
                </ul>
            </td>
        </tr>
        `
    });

    addEditButtonFunctionality();
    addDeleteButtonFunctionality();
    return querySnapshot;
}

// Products Search
document.getElementById("productsSearchButton").addEventListener('click', async function() {
    productsSearchFunctionality();
});

document.addEventListener("keyup", function(event) {
    if (event.code === 'Enter') {
        if(document.getElementById("productsSearch") === document.activeElement){
            productsSearchFunctionality();
        }
    }
});

function productsSearchFunctionality(){
    var searchInput = document.getElementById("productsSearch").value;
    var searchOption = document.getElementById("productsSearchOption").value;
    switch (searchOption) {
        case "id":
            document.getElementById("productsListContainer").innerHTML = "";
            querySnapshot.forEach((doc) => {
                if((doc.id.toLowerCase()).includes(searchInput.toLowerCase())){
                    showSearchedProducts(doc.id,doc.data().name,doc.data().description,doc.data().price,doc.data().image);
                }
            });
            addEditButtonFunctionality();
            addDeleteButtonFunctionality();
            break;
        case "name":
            document.getElementById("productsListContainer").innerHTML = "";
            querySnapshot.forEach((doc) => {
                if((doc.data().name.toLowerCase()).includes(searchInput.toLowerCase())){
                    showSearchedProducts(doc.id,doc.data().name,doc.data().description,doc.data().price,doc.data().image);
                }
            });
            addEditButtonFunctionality();
            addDeleteButtonFunctionality();
            break;
        case "description":
            document.getElementById("productsListContainer").innerHTML = "";
            querySnapshot.forEach((doc) => {
                if((doc.data().description.toLowerCase()).includes(searchInput.toLowerCase())){
                    showSearchedProducts(doc.id,doc.data().name,doc.data().description,doc.data().price,doc.data().image);
                }
            });
            addEditButtonFunctionality();
            addDeleteButtonFunctionality();
            break;
        case "price >=":
            document.getElementById("productsListContainer").innerHTML = "";
            querySnapshot.forEach((doc) => {
                if(Number(doc.data().price) >= searchInput){
                    showSearchedProducts(doc.id,doc.data().name,doc.data().description,doc.data().price,doc.data().image);
                }
            });
            addEditButtonFunctionality();
            addDeleteButtonFunctionality();
            break;
        case "price <=":
            document.getElementById("productsListContainer").innerHTML = "";
            querySnapshot.forEach((doc) => {
                if(Number(doc.data().price) <= searchInput){
                    showSearchedProducts(doc.id,doc.data().name,doc.data().description,doc.data().price,doc.data().image);
                }
            });
            addEditButtonFunctionality();
            addDeleteButtonFunctionality();
            break;
    
        default:
            break;
    }

    if(searchInput==""){
        showProducts();
    }

    function showSearchedProducts(id,name,description,price,image){
        let productsListContainer = document.getElementById("productsListContainer");
        productsListContainer.innerHTML += `
        <tr style="background-color: #ffffff;">
            <td>`+id+`</td>
            <td>`+name+`</td>
            <td><img src="`+image+`" class="card-img-top" alt="..." style="height:3rem;width: auto;"></td>
            <td>`+description+`</td>
            <td>Php `+parseFloat(price).toFixed(2)+`</td>
            <td>
                <ul class="list-inline mb-0">
                    <li class="list-inline-item">
                        <a href="javascript:void(0);" data-bs-toggle="tooltip" data-bs-placement="top" data-productID="`+id+`" title="Edit" class="px-2 text-primary showEditModalButton"><i class="fa-solid fa-pen"></i></a>
                    </li>
                    <li class="list-inline-item">
                        <a href="javascript:void(0);" data-bs-toggle="tooltip" data-bs-placement="top" data-productID="`+id+`" title="Delete" class="px-2 text-danger showDeleteModalButton"><i class="fa-solid fa-trash"></i></a>
                    </li>
                </ul>
            </td>
        </tr>
        `
    }
}

// clear create new product form
document.getElementById("showNewProductModalButton").addEventListener('click', async function() {
    let productID = document.getElementById("newProductIDInput")
    let productName = document.getElementById("newProductNameInput")
    let productImage = document.getElementById("newProductImageInput")
    let productDescription = document.getElementById("newProductDescriptionInput")
    let productPrice = document.getElementById("newProductPriceInput")
    let productQuantity =  document.getElementById("newProductQuantityInput")

    productID.value = "";
    productName.value = "";
    productImage.value = "";
    productDescription.value = "";
    productPrice.value = "";
    productQuantity.value = "";

    productID.classList.remove("is-valid");
    productName.classList.remove("is-valid");
    productImage.classList.remove("is-valid");
    productDescription.classList.remove("is-valid");
    productPrice.classList.remove("is-valid");
    productQuantity.classList.remove("is-valid");

    productID.classList.remove("is-invalid");
    productName.classList.remove("is-invalid");
    productImage.classList.remove("is-invalid");
    productDescription.classList.remove("is-invalid");
    productPrice.classList.remove("is-invalid");
    productQuantity.classList.remove("is-invalid");
});

// input validation
document.getElementById("newProductIDInput").addEventListener('change', async function() {
    if(this.value==""){
        this.classList.remove("is-valid");
        this.classList.remove("is-invalid");
        return
    }
    if(this.value.includes(" ")){
        this.classList.remove("is-valid");
        this.classList.add("is-invalid");
        return
    }
    if(this.value!=""){
        this.classList.remove("is-invalid");
        this.classList.add("is-valid");
    }
});

document.getElementById("newProductNameInput").addEventListener('change', async function() {
    if(this.value==""){
        this.classList.remove("is-valid");
        this.classList.remove("is-invalid");
        return
    }
    if(this.value!=""){
        this.classList.remove("is-invalid");
        this.classList.add("is-valid");
    }
});

document.getElementById("newProductImageInput").addEventListener('change', async function() {
    if(this.files[0].size > 2097152){
        showErrorToast("File size too big", "Images must be less than 2MB");
        console.log("too big");
        this.classList.remove("is-valid");
        this.classList.add("is-invalid");
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

document.getElementById("newProductDescriptionInput").addEventListener('change', async function() {
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

document.getElementById("newProductPriceInput").addEventListener('change', async function() {
    if(this.value==""){
        this.classList.remove("is-valid");
        this.classList.remove("is-invalid");
        return;
    }
    if(Number(this.value)<0){
        this.classList.remove("is-valid");
        this.classList.add("is-invalid");
        return;
    }
    if(this.value!=""){
        this.classList.remove("is-invalid");
        this.classList.add("is-valid");
    }
});

document.getElementById("newProductQuantityInput").addEventListener('change', async function() {
    if(this.value==""){
        this.classList.remove("is-valid");
        this.classList.remove("is-invalid");
        return;
    }
    if(Number(this.value)<0){
        this.classList.remove("is-valid");
        this.classList.add("is-invalid");
        return;
    }
    if(this.value!=""){
        this.classList.remove("is-invalid");
        this.classList.add("is-valid");
    }
});

document.getElementById("newProductPriceInput").addEventListener('keypress', function (e) {
    // Get the code of pressed key
    const key = e.key;
    if (document.getElementById("newProductPriceInput").value.includes(".") && key == "."){
        e.preventDefault();
    }

    if (key != "0" && key != "1" && key != "2" && key != "3" && key != "4" && key != "5" && key != "6" && key != "7" && key != "8" && key != "9"  && key != ".") {
        // Prevent the default action
        e.preventDefault();
    }
});

document.getElementById("newProductQuantityInput").addEventListener('keypress', function (e){
        const key = e.key;
         if(key == "."){
             e.preventDefault();
         }})


// create new product

document.getElementById("createNewProductButton").addEventListener('click', async function() {
    let productID = document.getElementById("newProductIDInput").value;
    let name = document.getElementById("newProductNameInput").value;
    let imageElement = document.getElementById("newProductImageInput");
    let description = document.getElementById("newProductDescriptionInput").value;
    let price = document.getElementById("newProductPriceInput").value;
    let quantity = document.getElementById("newProductQuantityInput").value;

    // input validation check
    let inputs = document.getElementsByClassName("newProductFormInput");
    for (const elem of inputs) {
        if(elem.classList.contains("is-invalid") || elem.value==""){
            // console.log(elem, elem.value)
            // console.log("thingy");
            elem.focus();
            return;
        }
    }

    // notify things are working
    showSuccessToast("Processing Request", "Please Wait");
    // console.log("things are working");
    if(imageElement.files.length > 0){
        // console.log("new Image");
        if (imageElement.files && imageElement.files[0]) {
            let filename = makeid(10);
            const storage = getStorage();
            const storageRef = ref(storage, "products/"+filename);
    
            const UploadTask = uploadBytesResumable(storageRef, imageElement.files[0]);
            UploadTask.on('state-changed', (snapshot)=>{},
                (error) =>{
                    console.log(error);
                    showErrorToast("Error Uploading Image", "Please try again")
                },
                ()=>{
                    getDownloadURL(UploadTask.snapshot.ref).then((downloadURL)=>{
                        // console.log(downloadURL);
                        addProduct(productID, name, description, price, downloadURL, quantity).then(function(){
                            $('#myModal').modal('hide');
                        });
                        // const userDBRef = doc(db, "users", user.uid);
                        // setDoc(userDBRef, {
                        //     image: downloadURL
                        // }, { merge: true });
                        // document.getElementById("profileImage").src = downloadURL;
                    });
                }
            );
        }
    }else{
        // console.log("no new Image");
    }
});

async function addProduct(productID, name, description, price, image, quantity){
    const docRef = doc(db, "products", productID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        showErrorToast("Error", "Product ID is already being used");
    } else {
        await setDoc(doc(db, "products", productID), {
            name: name,
            description: description,
            price: Number(price),
            image: image,
            qty: Number(quantity)
        }).then( async function() {
            showSuccessToast("Success", "Product has been added");
            querySnapshot = await showProducts();
        });
    }
}

// ---------------------------

function addEditButtonFunctionality(){
    let editButtons = document.getElementsByClassName("showEditModalButton");
    for (const elem of editButtons) {
        elem.addEventListener('click', async function() {
            document.getElementById("updateProductIDInput").value = "";
            document.getElementById("updateProductNameInput").value = "";
            document.getElementById("updateProductImageInput").value = "";
            document.getElementById("updateProductDescriptionInput").value = "";
            document.getElementById("updateProductPriceInput").value = "";
            document.getElementById("updateProductQuantityInput").value = "";

            let productID = elem.getAttribute("data-productID");
            console.log(productID);

            const docRef = doc(db, "products", productID);
            const docSnap = await getDoc(docRef);

            document.getElementById("updateProductIDInput").value = docSnap.id;
            document.getElementById("updateProductNameInput").value = docSnap.data().name;
            document.getElementById("updateProductDescriptionInput").value = docSnap.data().description;
            document.getElementById("updateProductPriceInput").value = docSnap.data().price;
            document.getElementById("updateProductQuantityInput").value = docSnap.data().qty;

            document.getElementById("updateProductNameInput").classList.add("is-valid");
            document.getElementById("updateProductDescriptionInput").classList.add("is-valid");
            document.getElementById("updateProductPriceInput").classList.add("is-valid");
            document.getElementById("updateProductQuantityInput").classList.add("is-valid");

            
            $('#updateItemModal').modal('show');
        });
    }
}

// input validation
document.getElementById("updateProductNameInput").addEventListener('change', async function() {
    if(this.value==""){
        this.classList.remove("is-valid");
        this.classList.remove("is-invalid");
        return
    }
    if(this.value!=""){
        this.classList.remove("is-invalid");
        this.classList.add("is-valid");
    }
});

document.getElementById("updateProductImageInput").addEventListener('change', async function() {
    if(this.files[0].size > 2097152){
        showErrorToast("File size too big", "Images must be less than 2MB");
        console.log("too big");
        this.classList.remove("is-valid");
        this.classList.add("is-invalid");
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

document.getElementById("updateProductDescriptionInput").addEventListener('change', async function() {
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

document.getElementById("updateProductPriceInput").addEventListener('change', async function() {
    if(this.value==""){
        this.classList.remove("is-valid");
        this.classList.remove("is-invalid");
        return;
    }
    if(Number(this.value)<0){
        this.classList.remove("is-valid");
        this.classList.add("is-invalid");
        return;
    }
    if(this.value!=""){
        this.classList.remove("is-invalid");
        this.classList.add("is-valid");
    }
});
document.getElementById("updateProductQuantityInput").addEventListener('change', async function() {
    if(this.value==""){
        this.classList.remove("is-valid");
        this.classList.remove("is-invalid");
        return;
    }
    if(Number(this.value)<0){
        this.classList.remove("is-valid");
        this.classList.add("is-invalid");
        return;
    }
    if(this.value!=""){
        this.classList.remove("is-invalid");
        this.classList.add("is-valid");
    }
});
document.getElementById("updateProductPriceInput").addEventListener('keypress', function (e) {
    // Get the code of pressed key
    const key = e.key;
    if (document.getElementById("updateProductPriceInput").value.includes(".") && key == "."){
        e.preventDefault();
    }

    if (key != "0" && key != "1" && key != "2" && key != "3" && key != "4" && key != "5" && key != "6" && key != "7" && key != "8" && key != "9"  && key != ".") {
        // Prevent the default action
        e.preventDefault();
    }
});
document.getElementById("updateProductQuantityInput").addEventListener('keypress', function (e){
    const key = e.key;
     if(key == "."){
         e.preventDefault();
     }})

// update product
document.getElementById("updateProductButton").addEventListener('click', async function() {
    let productID = document.getElementById("updateProductIDInput").value;
    let name = document.getElementById("updateProductNameInput").value;
    let imageElement = document.getElementById("updateProductImageInput");
    let description = document.getElementById("updateProductDescriptionInput").value;
    let price = document.getElementById("updateProductPriceInput").value;
    let quantity = document.getElementById("updateProductQuantityInput").value;

    // input validation check
    let inputs = document.getElementsByClassName("updateProductFormInput");
    for (const elem of inputs) {
        if(elem.classList.contains("is-invalid") || elem.value==""){
            // console.log(elem, elem.value)
            // console.log("thingy");
            elem.focus();
            return;
        }
    }

    let imageInput = document.getElementById("updateProductImageInput");
    if (imageInput.value != "" && imageInput.classList.contains("is-invalid")){
        imageInput.focus();
        return;
    }

    // notify things are working
    showSuccessToast("Processing Request", "Please Wait");
    // console.log("things are working");
    if(imageElement.value != "" && imageElement != null){
        // console.log("new Image");
        // console.log(imageElement.files);
        // console.log(imageElement.files[0]);
        if (imageElement.files && imageElement.files[0]) {
            let filename = makeid(10);
            const storage = getStorage();
            const storageRef = ref(storage, "products/"+filename);
    
            const UploadTask = uploadBytesResumable(storageRef, imageElement.files[0]);
            UploadTask.on('state-changed', (snapshot)=>{},
                (error) =>{
                    console.log(error);
                    showErrorToast("Error Uploading Image", "Please try again")
                },
                ()=>{
                    getDownloadURL(UploadTask.snapshot.ref).then((downloadURL)=>{
                        // console.log(downloadURL);
                        updateProduct(productID, name, description, price, downloadURL, quantity).then(function(){
                            $('#updateItemModal').modal('hide');
                        });
                    });
                }
            );
        }
    }else{
        // console.log("no new Image");
        updateProduct(productID, name, description, price, "" , quantity).then(function(){
            $('#updateItemModal').modal('hide');
        });
    }
});

async function updateProduct(productID, name, description, price, image, quantity){
    if(image == "" || image == null){
        const docRef = doc(db, "products", productID);
        await updateDoc(docRef, {
            name: name,
            description: description,
            price: price,
            qty: Number(quantity)
        }).then(async function() {
            showSuccessToast("Success", "Product has been updated");
            querySnapshot = await showProducts();
        });
    }else{
        const docRef = doc(db, "products", productID);
        await updateDoc(docRef, {
            name: name,
            description: description,
            price: price,
            image: image,
            qty: Number(quantity)
        }).then(async function() {
            showSuccessToast("Success", "Product has been updated");
            querySnapshot = await showProducts();
        });
    }
}

// ---------------------------

//delete product
function addDeleteButtonFunctionality(){
    let editButtons = document.getElementsByClassName("showDeleteModalButton");
    for (const elem of editButtons) {
        elem.addEventListener('click', async function() {

            let productID = elem.getAttribute("data-productID");

            document.getElementById("deleteItemPrompt").innerHTML =
            "Are you sure you want to delete <b>"+productID+"</b>?";
            
            $('#deleteItemModal').modal('show');

            document.getElementById("deleteProductButton").addEventListener('click', async function() {
                $('#deleteItemModal').modal('hide');
                showSuccessToast("Processing Request", "Please Wait");
                console.log("stuff here");
                deleteProduct(productID);
                querySnapshot = await showProducts();
            });
        });
    }
}

async function deleteProduct(productID){
    await deleteDoc(doc(db, "products", productID)).then(function() {
        showSuccessToast("Success", "Product has been deleted")
    });;
}

// ************************

// Edit Profile

// ************************

//show user data
onAuthStateChanged(auth, (user) => {
    if (user) {
        // console.log(user.uid);
        // console.log(user.email);
        showUserData(user.uid, user.email);
        // console.log(user);
        // let isVerified = user.emailVerified;
        // if(isVerified){
        //     let verifyButton = document.getElementById("verify");
        //     verifyButton.disabled = true;
        //     verifyButton.innerHTML = "Verified"
        // }
    } else {
        showDangerAlert();
        window.location.href = "index.html";
    }
});

async function showUserData(userID, userEmail){ 
    const docRef = doc(db, "users", userID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        // console.log("Document data:", docSnap.data());
        let firstname = docSnap.data().firstname;
        let lastname = docSnap.data().lastname;
        let image = docSnap.data().image;

        if(!firstname){
            firstname = "";
        }
        if(!lastname){
            lastname = "";
        }
        if(!image){
            image = "";
        }

        document.getElementById("displayName").innerHTML = firstname + " " + lastname;
        document.getElementById("displayEmail").innerHTML = userEmail;
        document.getElementById("firstname").value = firstname;
        document.getElementById("lastname").value = lastname;

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

// Edit user data

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

async function updateUserData(userID, userEmail){
    const userRef = doc(db, "users", userID);

    let firstname = document.getElementById("firstname").value;
    let lastname = document.getElementById("lastname").value;

    let imageElement = document.getElementById("uploadUserProfilePicture");
    if(imageElement.value != "" && imageElement != null){
        updateUserWithImage(userID, firstname, lastname, userEmail);
    }else{
        await updateDoc(userRef, {
            firstname: firstname,
            lastname: lastname
    
        }).then(function() {
            showSuccessAlert();
            showUserData(userID, userEmail);
        });
    }
}

async function updateUserWithImage(userID, firstname, lastname, userEmail){
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

// Alerts
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

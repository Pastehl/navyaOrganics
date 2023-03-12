import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, getDoc, getDocs, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

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

showReviews();
async function showReviews(){
    const querySnapshot = await getDocs(collection(db, "reviews"));
    let reviewsHTML = "";
    querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        // console.log(doc.id, " => ", doc.data());
        
        let rating = doc.data().rating;
        let ratingHTML = '';

        for (let index = 0; index < 5; index++) {
            if(rating>0){
                ratingHTML+=
                `
                <i class="fa-solid fa-star"></i>
                `
            }else{
                ratingHTML+=
                `
                <i class="fa-regular fa-star"></i>
                `
            }
            
            rating--;
        }

        reviewsHTML +=
        `
            <div class="rounded shadow-lg" style="background-color:#fefcf9;height:6rem;width:98%;margin-bottom:1rem;display:flex;column-gap:1rem;padding:0.5rem;">
            <div style="display:flex; justify-content: center;align-items: center;">
            <img class="rounded img-fluid" src="`+doc.data().userImage+`" style="width:2rem;height:2rem;bobject-fit:cover;">
            <p style="margin:0;font-size:smaller;text-align:left;overflow-wrap: break-word;width:10rem;margin-left:0.5rem;">`+doc.data().user+`</p>
            </div>
            <div style="display:flex; justify-content: center;align-items: center;">
            <img class="rounded img-fluid" src="`+doc.data().productImage+`" style="width:4rem;height:4rem;object-fit:cover;margin-right:1rem;">
            <p style="margin:0;overflow-wrap: break-word;width:16rem;font-size:small;">`+doc.data().product+`</p>
            </div>
            <div style="display:flex; justify-content: center;align-items: center;">
            `+ratingHTML+`
            </div>
            <div style="display:flex; justify-content: center;align-items: center;width:40rem;">
            <p style="text-align:left;width:100%;margin:0;">`+doc.data().review+`</p>
            </div>
        </div>

        `;
    });
    document.getElementById("reviewsContainer").innerHTML = reviewsHTML;
}

//create product review

document.getElementById("showReviewModal").addEventListener('click', function(){
    onAuthStateChanged(auth, async (user) => {
        if(user){
            const docRef = collection(db, "orders");
            const q = query(docRef, where("userID", "==", user.uid), where("status", "==", "delivered"));
            const querySnapshot = await getDocs(q);

            let hasPurchased = false;
            let productsPurchased = [];
            querySnapshot.forEach((doc) => {
                hasPurchased = true;
                let cartItems = doc.data().cartItems;

                for (let index = 0; index < cartItems.length; index++) {
                    const element = cartItems[index];
                    if(productsPurchased.includes(element.productID) == false){
                        productsPurchased.push(element.productID);
                    }
                    
                }
            });

            let productNames = []
            if(!hasPurchased){
                showErrorToast("No Completed Orders Found", "Review cannot be created ");
                return
            }else{
                for (let index = 0; index < productsPurchased.length; index++) {
                    const element = productsPurchased[index];
                    const docRef = doc(db, "products", element);
                    const docSnap = await getDoc(docRef);

                    productNames.push({productID: element, productName: docSnap.data().name})
                }
                console.log(productNames);
                document.getElementById("productSelectOption").innerHTML =
                `
                <option value="default" selected>Please Select a Previously Purchased Product</option>
                `;
                for (let index = 0; index < productNames.length; index++) {
                    const element = productNames[index];
                    document.getElementById("productSelectOption").innerHTML +=
                    `
                    <option value="`+element.productID+`">`+element.productName+`</option>
                    `;
                }
            }
            
            document.getElementById("createNewProductButton").addEventListener('click', function(){
                createReview(user.uid);
            });

            $('#newReviewModal').modal('show');
        }else{
            window.location.href = "login.html"
        }
    });
   
});


document.getElementById("reviewTextArea").addEventListener('input', function(){
    let inputString = document.getElementById("reviewTextArea").value;
    // console.log(inputString);
    // console.log(inputString.length);
    document.getElementById("reviewTextAreaLabel").innerHTML = "Comments ("+inputString.length+"/150)";
});

addStarFunc();
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
            prevStars = ratingHTML;
            addStarFunc();
            // addStarHoverFunc();
        })
    }
}

let prevStars = document.getElementById("starsDiv").innerHTML;

// addStarHoverFunc();
// function addStarHoverFunc(){
//     let stars = document.getElementsByClassName("ratingStar");
//     for (const elem of stars) {
//         elem.style.cursor = "pointer";
//         elem.addEventListener('mouseover', function(){
//             let rating = this.getAttribute("data-rating");
//             let starsDiv = document.getElementById("starsDiv");

//             let ratingHTML = '';
//             for (let index = 0; index < 5; index++) {
//                 if(rating>0){
//                     ratingHTML+=
//                     `
//                     <i data-rating="`+Number(index+1)+`" class="fa-solid fa-star ratingStar"></i>
//                     `
//                 }else{
//                     ratingHTML+=
//                     `
//                     <i data-rating="`+Number(index+1)+`" class="fa-regular fa-star ratingStar"></i>
//                     `
//                 }
                
//                 rating--;
//             }
//             starsDiv.innerHTML = ratingHTML;
//             addStarFunc();
//             addStarHoverFunc()
//         })
//     }

//     for (const elem of stars) {
//         elem.addEventListener('mouseout', function(){
//             let starsDiv = document.getElementById("starsDiv");

//             starsDiv.innerHTML = prevStars;
            
//             addStarFunc();
//             addStarHoverFunc();
//         })
//     }
// }


// create review
async function createReview(userID){

    var productOption = document.getElementById("productSelectOption").value;
    if(productOption=="default"){
        showErrorToast("No Product Chosen", "Please choose a product to review")
        return;
    }
    // console.log(productOption);

    let starRating = document.getElementsByClassName("fa-solid ratingStar").length;
    // console.log(document.getElementsByClassName("fa-solid"))
    // console.log(starRating);
    if(starRating < 1){
        showErrorToast("No Rating Given", "Please choose a star rating")
        return;
    }

    let reviewTextArea = document.getElementById("reviewTextArea").value;
    // if(reviewTextArea.replaceAll(' ', '') == ""){
    //     showErrorToast("Empty Review", "Please write your feedback")
    //     return;
    // }

    showSuccessToast("Processing Request", "Please Wait");

    const docRef = doc(db, "products", productOption);
    const docSnap = await getDoc(docRef);

    let product = docSnap.data().name;
    let productImage = docSnap.data().image;

    const userRef = doc(db, "users", userID);
    const userSnap = await getDoc(userRef);

    let username = userSnap.data().firstname + " " + userSnap.data().lastname
    let userImage = userSnap.data().image;

    await setDoc(doc(db, "reviews", makeid(15)), {
        product: product,
        productImage: productImage,
        rating: starRating,
        review: reviewTextArea,
        user: username,
        userImage: userImage
    }).then(function(){
        showSuccessToast("Success", "Your review is now posted");
        $('#newReviewModal').modal('hide');
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
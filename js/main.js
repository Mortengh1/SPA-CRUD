"use strict";

// ========== Firebase sign in functionality ========== //

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2PQHFTcOpbfddZQnh9o7OqwyDm3cn7cU",
  authDomain: "jagt-c32bf.firebaseapp.com",
  projectId: "jagt-c32bf",
  storageBucket: "jagt-c32bf.appspot.com",
  messagingSenderId: "904531969006",
  appId: "1:904531969006:web:c0c6d0cb5fece9b58384ff"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const placeRef = db.collection("places");

let selectedUserId = "";

let _firebaseUI;

// ========== FIREBASE AUTH ========== //
// Listen on authentication state change
firebase.auth().onAuthStateChanged(function (user) {
  if (user) { // if user exists and is authenticated
    userAuthenticated(user);
  } else { // if user is not logged in
    userNotAuthenticated();
  }
});

function userAuthenticated(user) {
  appendUserData(user);
  hideTabbar(false);
  showLoader(false);
}

function userNotAuthenticated() {
  hideTabbar(true);
  showPage("login");

  // Firebase UI configuration
  const uiConfig = {
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    signInOptions: [
      firebase.auth.EmailAuthProvider.PROVIDER_ID,
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      firebase.auth.FacebookAuthProvider.PROVIDER_ID
    ],
    signInSuccessUrl: '#home'
  };
  // Init Firebase UI Authentication
  if (!_firebaseUI) {
    _firebaseUI = new firebaseui.auth.AuthUI(firebase.auth());
  }
  _firebaseUI.start('#firebaseui-auth-container', uiConfig);
  showLoader(false);
}


// show and hide tabbar
function hideTabbar(hide) {
  let tabbar = document.querySelector('#tabbar');
  if (hide) {
    tabbar.classList.add("hide");
  } else {
    tabbar.classList.remove("hide");
  }
}

// sign out user
function logout() {
  firebase.auth().signOut();
}

function appendUserData(user) {
  console.log(user);
  document.querySelector('#user-data').innerHTML = `
    <img class="profile-img" src="${user.photoURL || "img/placeholder.jpg"}">
    <h3>${user.displayName}</h3>
    <p>${user.email}</p>
  `;
}

// ========== READ ==========
placeRef.onSnapshot(function (snapshotData) {
  let places = [];
  snapshotData.forEach(function (doc) {
    let place = doc.data();
    console.log(place);
    place.id = doc.id;
    places.push(place);
  });
  appendUsers(places);
});

// append users to the DOM
function appendUsers(places) {
  console.log(places);
  let htmlTemplate = "";
  for (const place of places) {
    htmlTemplate += /*html*/ `
    <article>
      <div class="headline">
    <h2>${place.name}</h2>
    <p id="postnr">${place.postnr}</p>
  </div>
    <img src="${place.img}">

    <div class="beskrivelse">
    <h3>Beskrivelse:</h3>
    <p>${place.description}</p>
    </div>

    <div class="dyr-våben">
      <div class="dyr">
        <h3>Dyr:</h3>
        <p>${place.animal}</p>
      </div>
      <div class="våben">
        <h3>Våben:</h3>
        <p>${place.weapon}</p>
      </div>
    </div>

    <div class="owner">
    <p><span>Ejer:</span> ${place.owner}</p>
    <p><span>Email:</span> ${place.email}</p>
    <p><span>Adresse:</span> ${place.address}</p>
    <p><span>Tlf.:</span> ${place.tlf}</p>
  </div>
  <div class="buttons">
    <button onclick="selectUser('${place.id}','${place.name}', '${place.mail}');"><a href="#update-user">Update</a></button>
    <button class="button-delete" onclick="deleteUser('${place.id}')">Delete</button>
    <button class="addToFavorite"  onclick="addFavorite('${place.id}')"><i class="fas fa-star"></i></button>
  </div>
  </article>
    `;
  }
  document.querySelector("#places-container").innerHTML = htmlTemplate;
}

//TODO: Make favoriteButton to a checkbox and make it add post to favorite page if checked
function addFavorite() {


}

// Dropdown til dyr og våben

let checkList = document.getElementById('list1');
checkList.getElementsByClassName('anchor')[0].onclick = function (evt) {
  if (checkList.classList.contains('visible'))
    checkList.classList.remove('visible');
  else
    checkList.classList.add('visible');
}
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
const _db = firebase.firestore();
const _placeRef = _db.collection("places");
const _userRef = _db.collection("users")

let _currentUser;
let _places;
let _selectedPlaceId = "";


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
  _currentUser = user;
  hideTabbar(false);
  init();
  showLoader(false);
}

function userNotAuthenticated() {
  _currentUser = null;
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
  // reset input fields
  document.querySelector('#user-name').value = "";
  document.querySelector('#user-mail').value = "";
  document.querySelector('#user-birthdate').value = "";
  document.querySelector('#imagePreview').src = "";
}

function appendUserData(user) {
  console.log(user);
  document.querySelector('#user-name').value = _currentUser.userName;
  document.querySelector('#user-mail').value = _currentUser.userMail;
  document.querySelector('#user-birthdate').value = _currentUser.userBirthdate;
  document.querySelector('#imagePreview').src = _currentUser.userImg;
  console.log(user);
}

// update user data - auth user and database object
function updateUser() {
  let user = firebase.auth().currentUser;

  // update auth user
  user.updateProfile({
    displayName: document.querySelector('#user-name').value
  });

  // update database user
  _userRef.doc(_currentUser.uid).set({
    img: document.querySelector('#imagePreview').src,
    birthdate: document.querySelector('#user-birthdate').value,
  }, {
    merge: true
  });
}


// ========== READ ==========

// ========== PLACE FUNCTIONALITY ========== / /

// initialize place references - all movies and user's favourite movies
function init() {
  // init user data and favourite movies
  _userRef.doc(_currentUser.uid).onSnapshot({
    includeMetadataChanges: true
  }, function (userData) {
    if (!userData.metadata.hasPendingWrites && userData.data()) {
      _currentUser = {
        ...firebase.auth().currentUser,
        ...userData.data()
      }; //concating two objects: authUser object and userData objec from the db
      appendUserData();
      appendFavPlace(_currentUser.favPlaces);
      if (_places) {
        appendPlaces(_places); // refresh movies when user data changes
      }
      showLoader(false);
    }
  });

  // init all movies
  _placeRef.onSnapshot(snapshotData => {
    _places = [];
    snapshotData.forEach(doc => {
      let place = doc.data();
      place.id = doc.id;
      _places.push(place);
    });
    appendPlaces(_places);
  });
}


// append users to the DOM
function appendPlaces(places) {
  console.log(places);
  let htmlTemplate = "";
  for (let place of places) {
    htmlTemplate += /*html*/ `
    <article>
      <div class="headline">
    <h2>${place.name}</h2>
    <p id="by">${place.postnr}</p>
  </div>
    <img src="${place.img || 'img/placeholder.jpg'}">

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
    <p><span>Email:</span> ${place.mail}</p>
    <p><span>Adresse:</span> ${place.address}</p>
    <p><span>Tlf.:</span> ${place.tlf}</p>
  </div>
  <div class="buttons">
    <button class="btn-place" onclick="selectPlace('${place.id}','${place.name}', '${place.postnr}', '${place.description}', '${place.animal}', '${place.weapon}', '${place.owner}', '${place.mail}' ,'${place.address}', '${place.tlf},', '${place.img}');"><a href="#add"><i class="far fa-edit"></i></a></button>
    <button class="btn-place" id="button-delete" onclick="deletePlace('${place.id}')"><i class="far fa-trash-alt"></i></button>
    ${generateFavPlaceButton(place.id)}
  </div>
  </article>
    `;
  }
  document.querySelector("#place-container").innerHTML = htmlTemplate;
}

function generateFavPlaceButton(placeId) {
  let btnTemplate = /*html*/ `
    <button class="addToFavorite" onclick="addToFavourites('${placeId}')"><i class="fas fa-star"></i></button>`;
  if (_currentUser.favPlaces && _currentUser.favPlaces.includes(placeId)) {
    btnTemplate = /*html*/ `
      <button class="btn-place" onclick="removeFromFavourites('${placeId}')" class="rm"><i class="fas fa-star"></i></button>`;
  }
  return btnTemplate;
}

// append favourite movies to the DOM
async function appendFavPlace(favPlaceIds = []) {
  console.log(favPlaceIds);
  let htmlTemplate = "";
  if (favPlaceIds.length === 0) {
    htmlTemplate = "<p>Please, add places to favourites.</p>";
  } else {
    for (let placeId of favPlaceIds) {
      await _placeRef.doc(placeId).get().then(function (doc) {
        let place = doc.data();
        place.id = doc.id;
        htmlTemplate += /*html*/ `
        <article>
      <div class="headline">
    <h2>${place.name}</h2>
    <p id="by">${place.postnr}</p>
  </div>
    <img src="${place.img || 'img/placeholder.jpg'}">

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
    <p><span>Email:</span> ${place.mail}</p>
    <p><span>Adresse:</span> ${place.address}</p>
    <p><span>Tlf.:</span> ${place.tlf}</p>
  </div>
  <div class="buttons">
    <button class="btn-place" onclick = "selectPlace('${place.id}', '${place.name}', '${place.postnr}','${place.description}', '${place.animal}', '${place.weapon}', '${place.owner}', '${place.mail}', '${place.address}', '${place.tlf}', '${place.img}')"><a href="#add"><i class="far fa-edit"></i></a></button>
    <button class="btn-place" id="button-delete" onclick="deletePlace('${place.id}')"><i class="far fa-trash-alt"></i></button>
    <button class="btn-place" onclick="removeFromFavourites('${place.id}')" class="rm"><i class="fas fa-star"></i></button>
  </div>
        </article>
      `;
      });
    }
  }
  document.querySelector('#fav-place-container').innerHTML = htmlTemplate;
}


// adds a given movieId to the favMovies array inside _currentUser
function addToFavourites(placeId) {
  showLoader(true);
  _userRef.doc(_currentUser.uid).set({
    favPlaces: firebase.firestore.FieldValue.arrayUnion(placeId)
  }, {
    merge: true
  });
  showLoader(false);
}

// removes a given movieId to the favMovies array inside _currentUser
function removeFromFavourites(placeId) {
  showLoader(true);
  _userRef.doc(_currentUser.uid).update({
    favPlaces: firebase.firestore.FieldValue.arrayRemove(placeId)
  });
  showLoader(false);
}

//TODO: Make favoriteButton to a checkbox and make it add post to favorite page if checked

// ========== CREATE ==========
function createPlace() {
  let nameVal = document.querySelector('#name');
  let postnrVal = document.querySelector('#postnr');
  let descriptionVal = document.querySelector('#description');
  let animalVal = document.querySelector('#animal');
  let weaponVal = document.querySelector('#weapon');
  let ownerVal = document.querySelector('#owner');
  let mailVal = document.querySelector('#mail');
  let addressVal = document.querySelector('#address');
  let tlfVal = document.querySelector('#tlf');
  let imgVal = document.querySelector('#img');

  // make sure to nagivate to home: navigateTo("home");
  let newPlace = {
    name: nameVal.value,
    postnr: postnrVal.value,
    description: descriptionVal.value,
    animal: animalVal.value,
    weapon: weaponVal.value,
    owner: ownerVal.value,
    mail: mailVal.value,
    address: addressVal.value,
    tlf: tlfVal.value,
    img: imgVal.value
  };
  console.log(newPlace);

  _placeRef.add(newPlace);
  showLoader(true);

  navigateTo("home");

  //RESET
  nameVal.value = "";
  postnrVal.value = "";
  descriptionVal.value = "";
  animalVal.value = "";
  weaponVal.value = "";
  ownerVal.value = "";
  mailVal.value = "";
  addressVal.value = "";
  tlfVal.value = "";
  imgVal.value = "";

  showLoader(false);
}

// ========== UPDATE ==========

async function selectPlace(id, name, postnr, description, animal, weapon, owner, mail, address, tlf, img) {
  // references to the input fields
  let nameInput = document.querySelector('#name-update');
  let postnrInput = document.querySelector('#postnr-update');
  let descriptionInput = document.querySelector('#description-update');
  let animalInput = document.querySelector('#animal-update');
  let weaponInput = document.querySelector('#weapon-update');
  let ownerInput = document.querySelector('#owner-update');
  let mailInput = document.querySelector('#mail-update');
  let addressInput = document.querySelector('#address-update');
  let tlfInput = document.querySelector('#tlf-update');
  let imgInput = document.querySelector('#img-update');

  nameInput.value = name;
  postnrInput.value = postnr;
  descriptionInput.value = description;
  animalInput.value = animal;
  weaponInput.value = weapon;
  ownerInput.value = owner;
  mailInput.value = mail;
  addressInput.value = address;
  tlfInput.value = tlf;
  imgInput.value = img;


  _selectedPlaceId = id;

  navigateTo("add");
}

function updatePlace() {
  let nameInput = document.querySelector('#name-update');
  let postnrInput = document.querySelector('#postnr-update');
  let descriptionInput = document.querySelector('#description-update');
  let animalInput = document.querySelector('#animal-update');
  let weaponInput = document.querySelector('#weapon-update');
  let ownerInput = document.querySelector('#owner-update');
  let mailInput = document.querySelector('#mail-update');
  let addressInput = document.querySelector('#address-update');
  let tlfInput = document.querySelector('#tlf-update');
  let imgInput = document.querySelector('#img-update');

  // TODO: create a userToUpdate object and update _userRef (cloud firestore)
  // make sure to nagivate to home
  let placeToUpdate = {
    name: nameInput.value,
    postnr: postnrInput.value,
    description: descriptionInput.value,
    animal: animalInput.value,
    weapon: weaponInput.value,
    owner: ownerInput.value,
    mail: mailInput.value,
    address: addressInput.value,
    tlf: tlfInput.value,
    img: imgInput.value
  };
  _placeRef.doc(_selectedPlaceId).set(placeToUpdate);

  showLoader(true);

  navigateTo("home");

  //RESET
  nameInput.value = "";
  postnrInput.value = "";
  descriptionInput.value = "";
  animalInput.value = "";
  weaponInput.value = "";
  ownerInput.value = "";
  mailInput.value = "";
  addressInput.value = "";
  tlfInput.value = "";
  imgInput.value = "";

  showLoader(false);
}
// ========== DELETE ==========
function deletePlace(id) {
  // TODO: delete user by the given id
  console.log(id);
  _placeRef.doc(id).delete();
}

// doing the magic - image preview
function previewImage(file, previewId) {
  if (file) {

    let reader = new FileReader();
    reader.onload = event => {
      document.querySelector('#' + previewId).setAttribute('src', event.target.result);
    };
    reader.readAsDataURL(file);
  }
}
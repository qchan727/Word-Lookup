"use strict";

const body = document.querySelector("body");
const modal = document.querySelector(".modal");
const overlay = document.querySelector(".overlay");
const btnCloseModal = document.querySelector(".close-modal");
const btnsOpenModal = document.querySelector(".login-btn");
const year = document.querySelector(".year");
const newUserTab = document.querySelector(".type-tab--new");
const oldUserTab = document.querySelector(".type-tab--old");
const loginFormTitle = document.querySelector(".login-form-title");

const openModal = function () {
   modal.classList.remove("hidden");
   overlay.classList.remove("hidden");
   body.classList.add("form-scroll");
};

const closeModal = function () {
   modal.classList.add("hidden");
   overlay.classList.add("hidden");
   body.classList.remove("form-scroll");
};

year.textContent = new Date().getFullYear();

// oldUserTab.addEventListener("click", () => {
//    if (newUserTab.classList.contains("active-tab")) {
//       newUserTab.classList.remove("active-tab");
//       oldUserTab.classList.add("active-tab");
//       loginFormTitle.textContent = "Sign in with email";
//    }
// });

// newUserTab.addEventListener("click", () => {
//    if (oldUserTab.classList.contains("active-tab")) {
//       oldUserTab.classList.remove("active-tab");
//       newUserTab.classList.add("active-tab");
//       loginFormTitle.textContent = "Sign up with email";
//    }
// });

btnsOpenModal.addEventListener("click", openModal);

btnCloseModal.addEventListener("click", closeModal);
overlay.addEventListener("click", closeModal);

document.addEventListener("keydown", function (e) {
   // console.log(e.key);

   if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
   }
});

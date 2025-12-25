import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword, // <--- ត្រូវតែមានមួយនេះ
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  setDoc, // <--- ត្រូវតែមានមួយនេះសម្រាប់ចុះឈ្មោះ
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getFirestore,
  updateDoc,
  doc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// ==========================================================================================================1. Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBE4iy1F8SUjpKcv3tpIi3VE5pixvxIaTk",
  authDomain: "b0-pro.firebaseapp.com",
  projectId: "b0-pro",
  storageBucket: "b0-pro.firebasestorage.app",
  messagingSenderId: "365201811616",
  appId: "1:365201811616:web:564942962a802dac71c1c5",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

//============================================================================================================

// មុខងារបិទ Modal
window.closePaymentModal = function () {
  document.getElementById("paymentModal").style.display = "none";
};

// មុខងារបិទ Modal
window.closePaymentModal = function () {
  const modal = document.getElementById("paymentModal");
  if (modal) modal.style.display = "none";
};
//==================================================================================== 3. Authentication (Login & Sign Up)
window.handleLogin = async function () {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    showWarning("សូមបញ្ចូល Email និង Password!");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    Swal.fire({
      icon: "success",
      title: "ចូលប្រើជោគជ័យ!",
      showConfirmButton: false,
      timer: 1500,
    }).then(() => {
      document.getElementById("authModal").style.display = "none";
      location.reload();
    });
  } catch (error) {
    showError("ការចូលប្រើបរាជ័យ!", "Email ឬ លេខសម្ងាត់មិនត្រឹមត្រូវឡើយ");
  }
};

// មុខងារសម្រាប់ចុះឈ្មោះ (Sign Up)
window.handleSignUp = async function () {
  const emailInput = document.getElementById("signupEmail");
  const passwordInput = document.getElementById("signupPassword");

  if (!emailInput || !passwordInput) {
    console.error("រកមិនឃើញ ID signupEmail ឬ signupPassword ក្នុង HTML ទេ!");
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  // ១. ឆែកបើមិនទាន់បញ្ចូលទិន្នន័យ
  if (!email || !password) {
    Swal.fire({
      icon: "warning",
      title: "សូមបំពេញព័ត៌មាន",
      text: "សូមបញ្ចូល Email និង Password ឱ្យបានគ្រប់គ្រាន់!",
    });
    return;
  }

  Swal.fire({
    title: "កំពុងបង្កើតគណនី...",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  try {
    // ២. បង្កើត User ក្នុង Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // ៣. បង្កើតទិន្នន័យ User ក្នុង Firestore (Status គឺ unpaid ជាមេ)
    // ត្រូវប្រាកដថាអ្នកបាន import { setDoc, doc } ពី firestore រួចហើយ
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      status: "unpaid",
      createdAt: new Date(),
    });

    Swal.close();
    Swal.fire({
      icon: "success",
      title: "ចុះឈ្មោះជោគជ័យ!",
      text: "គណនីរបស់អ្នកត្រូវបានបង្កើត។ ឥឡូវនេះអ្នកអាចបង់ប្រាក់ដើម្បីប្រើ Tool!",
      timer: 2000,
      showConfirmButton: false,
    }).then(() => {
      document.getElementById("authModal").style.display = "none";
    });
  } catch (error) {
    Swal.close();
    console.error("Sign Up Error Code:", error.code);

    let errorMessage = "មិនអាចចុះឈ្មោះបានទេ! សូមព្យាយាមម្តងទៀត។";

    // ឆែកមើលប្រភេទ Error ដើម្បីប្រាប់ User ឱ្យចំចំណុច
    if (error.code === "auth/email-already-in-use") {
      errorMessage = "Email នេះត្រូវបានគេយកទៅប្រើបាត់ហើយ!";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "លេខសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ ខ្ទង់!";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "ទម្រង់ Email របស់អ្នកមិនត្រឹមត្រូវទេ!";
    }

    Swal.fire({
      icon: "error",
      title: "បរាជ័យ",
      text: errorMessage,
      confirmButtonColor: "#e74c3c",
    });
  }
};

// =================================================================================================4. Payment Logic
window.submitPayment = async function () {
  const user = auth.currentUser;
  if (!user) return;

  document.getElementById("loadingModal").style.display = "flex";
  document.getElementById("paymentModal").style.display = "none";

  try {
    await addDoc(collection(db, "payments"), {
      uid: user.uid,
      email: user.email,
      plan: selectedPlan,
      amount: selectedAmount,
      status: "pending",
      createdAt: new Date(),
    });

    setTimeout(() => {
      document.getElementById("loadingModal").style.display = "none";
      document.getElementById("successModal").style.display = "flex";
    }, 2000);
  } catch (error) {
    document.getElementById("loadingModal").style.display = "none";
    showError("បរាជ័យ", "មានបញ្ហាក្នុងការផ្ញើទិន្នន័យ!");
  }
};

// ======================================================================================5. UI Helpers (Modals & Navigation)
window.toggleAuthModal = () => {
  const modal = document.getElementById("authModal");
  modal.style.display = modal.style.display === "flex" ? "none" : "flex";

  window.closePaymentModal = () =>
    (document.getElementById("paymentModal").style.display = "none");

  window.goToDashboard = () => (window.location.href = "dashboard.html");

  window.switchForm = (type) => {
    document.getElementById("loginForm").style.display =
      type === "login" ? "block" : "none";
    document.getElementById("signupForm").style.display =
      type === "signup" ? "block" : "none";
  };

  // ==============================================================Short Helpers for SweetAlert
  function showWarning(text) {
    Swal.fire({
      icon: "warning",
      title: "សូមបំពេញព័ត៌មាន",
      text,
      confirmButtonColor: "#6c5ce7",
    });
  }

  function showError(title, text) {
    Swal.fire({ icon: "error", title, text, confirmButtonColor: "#e74c3c" });
  }
};

//====================================================================== មុខងារឆែកមើលស្ថានភាព Login រាល់ពេលបើកវេបសាយ ==============//
// ដាក់នៅខាងក្រោមបង្អស់នៃ script.js
onAuthStateChanged(auth, (user) => {
  const loggedInUI = document.getElementById("loggedInUI");
  const loggedOutUI = document.getElementById("loggedOutUI");
  const emailText = document.getElementById("userEmailDisplay");

  if (user) {
    // បើ Login ហើយ៖ បង្ហាញ Profile និងលាក់ Sign In
    if (loggedInUI) loggedInUI.style.display = "flex";
    if (loggedOutUI) loggedOutUI.style.display = "none";
    if (emailText) emailText.innerText = user.email.split("@")[0];
  } else {
    // បើ Logout៖ បង្ហាញ Sign In និងលាក់ Profile
    if (loggedInUI) loggedInUI.style.display = "none";
    if (loggedOutUI) loggedOutUI.style.display = "block";
  }
});

// មុខងារ Logout
window.handleLogout = async function () {
  await signOut(auth);
  location.reload();
};

window.handleLogin = async function () {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  // បង្ហាញ Loading
  Swal.fire({
    title: "កំពុងផ្ទៀងផ្ទាត់...",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  try {
    await signInWithEmailAndPassword(auth, email, password);
    document.getElementById("authModal").style.display = "none";
    Swal.close(); // បិទ Loading វិញ
  } catch (error) {
    showError("បរាជ័យ", "Email ឬ លេខសម្ងាត់មិនត្រឹមត្រូវ!");
  }
};

//--------------------------------------------------------------------------
onAuthStateChanged(auth, (user) => {
  const loggedInUI = document.getElementById("loggedInUI");
  const loggedOutUI = document.getElementById("loggedOutUI");
  const emailText = document.getElementById("userEmailDisplay");

  if (user) {
    // បើមាន User Login ឱ្យបង្ហាញ UI ភ្លាមៗ ទោះបីជាចុច Back ក៏ដោយ
    if (loggedInUI) loggedInUI.style.display = "flex";
    if (loggedOutUI) loggedOutUI.style.display = "none";
    if (emailText) emailText.innerText = user.email.split("@")[0];
  } else {
    // បើអត់មាន User ឱ្យបង្ហាញប៊ូតុង Sign In វិញ
    if (loggedInUI) loggedInUI.style.display = "none";
    if (loggedOutUI) loggedOutUI.style.display = "block";
  }
});

//====================================================================
// ១. មុខងារសម្រាប់ប៊ូតុង Get Started
window.checkAccess = function (plan, price) {
  const user = auth.currentUser;
  if (!user) {
    window.toggleAuthModal(); // បើមិនទាន់ Login ឱ្យបើកផ្ទាំង Login
    return;
  }
  // បើ Login ហើយ ឱ្យបើកផ្ទាំងបង់ប្រាក់
  const paymentModal = document.getElementById("paymentModal");
  if (paymentModal) {
    paymentModal.style.display = "flex";
    document.getElementById("displayPlan").innerText = plan;
    document.getElementById("displayPrice").innerText = "$" + price;
  }
};

// ២.-------------------------------------------------------------------- មុខងារ Auto-Redirect (Processing -> Dashboard)
window.confirmPayment = async function () {
  const user = auth.currentUser;
  if (!user) return;

  // ចាប់យកតម្លៃដែលបង្ហាញលើអេក្រង់នាពេលនោះ
  const plan = document.getElementById("displayPlan").innerText;
  const price = document.getElementById("displayPrice").innerText;

  // ១. បង្ហាញផ្ទាំង Loading ស្អាតដែលអ្នកចូលចិត្ត
  Swal.fire({
    title: "កំពុងផ្ទៀងផ្ទាត់ការបង់ប្រាក់...",
    html: `<div class="custom-loader"></div>
               <p style="font-size: 14px; margin-top: 15px;">
               សូមរង់ចាំ Admin ពិនិត្យទឹកប្រាក់ ${price} របស់អ្នក
               </p>`,
    showConfirmButton: false,
    allowOutsideClick: false,
    customClass: { popup: "swal-custom-popup" },
  });

  try {
    // ២. បញ្ជូនទិន្នន័យទៅ Firestore ដើម្បីឱ្យ Admin ឃើញក្នុង Admin Panel
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      pendingPlan: plan,
      pendingAmount: price,
      status: "pending", // ប្តូរពី unpaid ទៅជា pending
      lastRequestAt: new Date(),
    });
    await notifyAdminViaTelegram(plan, price, user.email, user.uid);
    // ៣. ចាប់ផ្តើមស្តាប់ (Listen) ការអនុម័តពី Admin បែប Real-time
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().status === "paid") {
        unsubscribe(); // ឈប់ស្តាប់នៅពេលបង់រួច

        // បង្ហាញផ្ទាំងជោគជ័យ និង Auto-Redirect
        Swal.fire({
          icon: "success",
          title: "បង់ប្រាក់ជោគជ័យ!",
          text: "ប្រព័ន្ធបានអនុម័តគណនីរបស់អ្នកហើយ។ កំពុងនាំទៅ Dashboard...",
          timer: 3500,
          showConfirmButton: false,
        }).then(() => {
          window.location.href = "dashboard.html"; // ទៅកាន់ទំព័រប្រើ Tool
        });
      }
    });
  } catch (error) {
    console.error("Error:", error);
    Swal.fire("បរាជ័យ", "មានបញ្ហាបច្ចេកទេស សូមព្យាយាមម្តងទៀត", "error");
  }
};
//==================================================================================================================

window.closePaymentModal = () => {
  document.getElementById("paymentModal").style.display = "none";
};

//=============================================================================== User Price QR Code ===========//
window.checkAccess = function (planName, price) {
  // បន្ទាត់នេះនឹងបង្ហាញតម្លៃក្នុង Console ឱ្យអ្នកឃើញច្បាស់ៗ
  console.log("--- ទិន្នន័យដែលចាប់បាន ---");
  console.log("ឈ្មោះកញ្ចប់:", planName);
  console.log("តម្លៃត្រូវបង់: $" + price);

  const user = auth.currentUser;
  if (!user) {
    window.toggleAuthModal(); // បើមិនទាន់ Login ឱ្យលោតផ្ទាំង Login
    return;
  }

  const modal = document.getElementById("paymentModal");
  if (modal) {
    modal.style.display = "flex";

    // បង្ហាញតម្លៃលើផ្ទាំង Checkout ឱ្យ User ឃើញ
    document.getElementById("displayPlan").innerText = planName;
    document.getElementById("displayPrice").innerText = "$" + price;

    // ប្តូររូបភាព QR ទៅតាមតម្លៃជាក់លាក់ (សំខាន់បំផុតសម្រាប់បង់អូតូ)
    const qrImg = document.querySelector("#paymentModal img");
    if (qrImg) {
      qrImg.src = `image.jpg/qr-${price}.jpg`;
      console.log("រូបភាព QR ដែលកំពុងប្រើ:", qrImg.src);
    }
  }
};

//======================================================================= Telegram Payment Bot =========//
// ១. បង្កើត Function សម្រាប់ផ្ញើសារ
async function notifyAdminViaTelegram(plan, price, email, uid) {
  const token = "7954142926:AAGOLl9NcWCTcF2pvHTyr-gcH2RbFDmUksg";
  const chatId = "1434601059";

  try {
    const docRef = await addDoc(collection(db, "subscriptions"), {
      userEmail: emailFromInput, // អ៊ីមែលភ្ញៀវ
      planName: selectedPlan, // កញ្ចប់ដែលគេរើស
      amount: selectedPrice, // តម្លៃ
      status: "pending", // ស្ថានភាពរង់ចាំលោកអ្នក Approved
      createdAt: new Date(), // ម៉ោងដែលគេបង់
      licenseKey: "", // ទុកទំនេរសម្រាប់លោកអ្នកដាក់ឱ្យពេលក្រោយ
    });

    // បន្ទាប់ពីសរសេរចូល Firebase ជោគជ័យ ទើបឱ្យវាឈប់វិល
    hideLoadingOverlay();
    alert(
      "ព័ត៌មានបង់ប្រាក់ត្រូវបានផ្ញើ! សូមរង់ចាំ Admin Approved ក្នុង Email របស់អ្នក។"
    );
  } catch (e) {
    console.error("Firebase Error: ", e);
  }

  // សារដែលត្រូវបង្ហាញក្នុង Telegram Admin
  const message =
    `🔔 **មានការបង់ប្រាក់ថ្មី!**\n\n` +
    `📧 អ៊ីមែល: ${email}\n` +
    `📦 កញ្ចប់: ${plan}\n` +
    `💰 តម្លៃ: ${price}\n` +
    `🆔 User ID: ${uid}\n\n` +
    `👉 សូមពិនិត្យមើលគណនី ABA រួចកែ Status ក្នុង Firebase!`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    }),
  });
}

// ២. ហៅប្រើវានៅក្នុង window.confirmPayment
// ដាក់វានៅខាងក្រោមបន្ទាត់ await updateDoc(...)
import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

async function handleConfirmPayment(userEmail, planName, amount) {
  try {
    // ១. រក្សាទុកក្នុង Firebase
    await addDoc(collection(db, "subscriptions"), {
      userEmail: userEmail,
      planName: planName,
      amount: amount,
      status: "pending", // ស្ថានភាពរង់ចាំ Admin
      createdAt: serverTimestamp(),
      licenseKey: "",
    });

    // ២. បញ្ឈប់ការវិល (Loading) ហើយបង្ហាញសារជោគជ័យ
    alert("ព័ត៌មានបង់ប្រាក់ត្រូវបានផ្ញើ! សូមរង់ចាំ Admin Approved។");
    window.location.reload(); // បិទផ្ទាំង Checkout
  } catch (error) {
    console.error("Error:", error);
    alert("មានបញ្ហាបច្ចេកទេស!");
  }
}

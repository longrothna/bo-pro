import { db } from "./firebase-config.js"; // ប្រើ Config ដែលអ្នកមានស្រាប់
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

let currentDocId = null;
let currentEmail = null;

// ១. ទាញទិន្នន័យមកបង្ហាញអូតូ (Real-time)
const q = query(collection(db, "subscriptions"), orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
  const tableBody = document.getElementById("tableBody");
  let html = "";
  snapshot.forEach((doc) => {
    const data = doc.data();
    const statusClass =
      data.status === "pending" ? "status-pending" : "status-paid";
    const btnHtml =
      data.status === "pending" ? (
        <button
          class="btn-approve"
          onclick="openModal('${doc.id}', '${data.userEmail}')"
        >
          Approve
        </button>
      ) : (
        "រួចរាល់"
      );

    html += (
      <tr>
        <td>${data.userEmail}</td>
        <td>${data.planName || data.plan}</td>
        <td>
          <span class="${statusClass}">${data.status.toUpperCase()}</span>
        </td>
        <td>${btnHtml}</td>
      </tr>
    );
  });
  tableBody.innerHTML = html;
});

// ២. មុខងារបើកផ្ទាំង Approve
window.openModal = function (id, email) {
  currentDocId = id;
  currentEmail = email;
  document.getElementById("targetEmail").innerText = email;
  document.getElementById("approveModal").style.display = "block";
};

window.closeModal = function () {
  document.getElementById("approveModal").style.display = "none";
};

// ៣. មុខងារ Approve និង Update ចូល Firebase
window.processApprove = async function () {
  const key = document.getElementById("licenseKeyInput").value;
  if (!key) return alert("សូមបញ្ចូល Key សិន!");

  try {
    const docRef = doc(db, "subscriptions", currentDocId);
    await updateDoc(docRef, {
      status: "PAID",
      licenseKey: key,
      approvedAt: new Date(),
    });

    // បន្ទាប់ពី Update ក្នុង Firebase រួច លោកអ្នកអាចបន្ថែមការផ្ញើ Email នៅទីនេះ
    alert("បាន Approve ជោគជ័យសម្រាប់៖ " + currentEmail);
    closeModal();
    document.getElementById("licenseKeyInput").value = "";
  } catch (e) {
    console.error("Error: ", e);
  }
};

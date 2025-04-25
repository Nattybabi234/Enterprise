import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBf56KIkY6197EpikJWA4J2KbPVpGGM3xY",
  authDomain: "najazachat.firebaseapp.com",
  projectId: "najazachat",
  storageBucket: "najazachat.firebasestorage.app",
  messagingSenderId: "93782128218",
  appId: "1:93782128218:web:169cf9051f2532a9664a63",
  measurementId: "G-28QPTZ86DV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const loginForm = document.getElementById("login-form");
const loginSection = document.getElementById("login-section");
const dashboard = document.getElementById("admin-dashboard");
const chatBox = document.getElementById("chat-box-admin");
const chatForm = document.getElementById("admin-chat-form");
const messageInput = document.getElementById("admin-message");
const userProgressList = document.getElementById("user-progress-list");
const searchInput = document.getElementById("searchInput");
const addUserForm = document.getElementById("add-user-form");

const allowedAdmins = ["layeninathania@gmail.com"];

let CURRENT_SELECTED_USER_EMAIL = ""; // Track selected user email for chat

// Handle login
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      if (!allowedAdmins.includes(user.email)) {
        signOut(auth);
        alert("Access denied.");
      } else {
        loginSection.style.display = "none";
        dashboard.style.display = "block";
      }
    })
    .catch((err) => alert("Login failed: " + err.message));
});

// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
  if (confirm("Are you sure you want to log out?")) {
    signOut(auth).then(() => {
      loginSection.style.display = "block";
      dashboard.style.display = "none";
    });
  }
});

// View Chat for selected user
function viewUserChat(email) {
  CURRENT_SELECTED_USER_EMAIL = email;
  chatBox.innerHTML = "Loading chat..."; // Display loading message
  const chatQuery = query(collection(db, "users", email, "messages"), orderBy("createdAt", "asc"));
  
  onSnapshot(chatQuery, (snapshot) => {
    chatBox.innerHTML = ""; // Clear existing messages
    snapshot.forEach((doc) => {
      const data = doc.data();
      const type = data.sender === "client" ? "client" : "najaza";
      const msgDiv = document.createElement("div");
      msgDiv.className = `message ${type}`;
      msgDiv.innerHTML = `${data.text}<span class="message-time">${new Date(data.createdAt?.seconds * 1000 || Date.now()).toLocaleTimeString()}</span>`;
      chatBox.appendChild(msgDiv);
    });
    chatBox.scrollTop = chatBox.scrollHeight; // Scroll to latest message
  });
}

// Send chat message
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = messageInput.value.trim();
  if (msg && CURRENT_SELECTED_USER_EMAIL) {
    const msgRef = collection(db, "users", CURRENT_SELECTED_USER_EMAIL, "messages");
    await addDoc(msgRef, {
      sender: "najaza",
      text: msg,
      createdAt: serverTimestamp(),
      read: false
    });
    messageInput.value = ""; // Clear the input field after sending
  }
});

// User progress display
let allUsers = [];
onSnapshot(collection(db, "users"), (snapshot) => {
  allUsers = [];
  snapshot.forEach((docSnap) => {
    allUsers.push({ id: docSnap.id, ...docSnap.data() });
  });
  renderUserProgress();
});

// Render progress cards with a button to view chat
function renderUserProgress() {
  const search = searchInput.value.toLowerCase();
  userProgressList.innerHTML = "";
  allUsers
    .filter((u) => (u.name || "").toLowerCase().includes(search))
    .forEach((user) => {
      const div = document.createElement("div");
      div.classList.add("user-progress-item");

      div.innerHTML = `
        <p>${user.name} (${user.project})</p>
        <progress value="${user.progress}" max="100"></progress>
        <button onclick="viewUserChat('${user.id}')">View Chat</button>
      `;
      userProgressList.appendChild(div);
    });
}

// Update user progress
window.updateProgress = async function (userId) {
  const input = document.getElementById(`progress-${userId}`);
  const newProgress = parseInt(input.value);

  if (isNaN(newProgress) || newProgress < 0 || newProgress > 100) {
    alert("Please enter a valid progress between 0 and 100.");
    return;
  }

  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { progress: newProgress });
    alert(`Progress updated to ${newProgress}%`);
  } catch (error) {
    console.error("Error updating progress:", error);
    alert("Failed to update progress.");
  }
};

// Add user
addUserForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("new-user-email").value.trim();
  const name = document.getElementById("new-user-name").value.trim();
  const project = document.getElementById("new-user-project").value.trim();
  const dueDate = document.getElementById("new-user-due").value;
  const progress = parseInt(document.getElementById("new-user-progress").value) || 0;

  if (!email || !name) {
    alert("Email and name are required!");
    return;
  }

  try {
    await setDoc(doc(db, "users", email), {
      name,
      project,
      dueDate,
      progress
    });
    alert("User added successfully!");
    addUserForm.reset();
  } catch (err) {
    alert("Error adding user: " + err.message);
  }
});

// Search input
searchInput.addEventListener("input", renderUserProgress);

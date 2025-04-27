// admin-dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  browserLocalPersistence
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

let CURRENT_SELECTED_USER_EMAIL = null;
let unsubscribeMessages = null;
let allUsers = [];
let userUnreadCounts = {};
let isFirstLoad = true;

// Session persistence
auth.setPersistence(browserLocalPersistence).catch((error) => {
  console.error("Error setting persistence", error);
});

// Login
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

// Auth State
onAuthStateChanged(auth, (user) => {
  if (user && allowedAdmins.includes(user.email)) {
    loginSection.style.display = "none";
    dashboard.style.display = "block";
  } else {
    loginSection.style.display = "block";
    dashboard.style.display = "none";
  }
});

// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
  if (confirm("Are you sure you want to log out?")) {
    signOut(auth);
  }
});

// Select User and Listen to Messages
window.selectUser = async function (userEmail) {
  CURRENT_SELECTED_USER_EMAIL = userEmail;

  if (unsubscribeMessages) unsubscribeMessages();

  const msgRef = collection(db, "users", userEmail, "messages");
  const msgQuery = query(msgRef, orderBy("createdAt", "asc"));

  unsubscribeMessages = onSnapshot(msgQuery, (snapshot) => {
    chatBox.innerHTML = "";

    const batchUpdates = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const type = data.sender === "client" ? "client" : "najaza";

      const msgDiv = document.createElement("div");
      msgDiv.className = `message ${type}`;
      msgDiv.innerHTML = `${data.text}<span class="message-time">${new Date(data.createdAt?.seconds * 1000 || Date.now()).toLocaleTimeString()}</span>`;
      chatBox.appendChild(msgDiv);

      if (data.sender === "client" && data.read === false) {
        batchUpdates.push(updateDoc(doc(db, "users", userEmail, "messages", docSnap.id), { read: true }));
      }
    });

    Promise.all(batchUpdates).then(() => {
      console.log("All client messages marked as read");
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  });
};

// Send chat message
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = messageInput.value.trim();

  if (!CURRENT_SELECTED_USER_EMAIL) {
    alert("Please select a user to chat with first!");
    return;
  }

  if (msg) {
    const msgRef = collection(db, "users", CURRENT_SELECTED_USER_EMAIL, "messages");

    await addDoc(msgRef, {
      sender: "najaza",
      text: msg,
      createdAt: serverTimestamp(),
      read: false
    });

    messageInput.value = "";
  }
});

// User Progress and Listeners
onSnapshot(collection(db, "users"), (snapshot) => {
  allUsers = [];
  userUnreadCounts = {};

  snapshot.forEach((docSnap) => {
    const user = { id: docSnap.id, ...docSnap.data() };
    allUsers.push(user);

    // Unread messages tracking
    const msgRef = collection(db, "users", user.id, "messages");
    const unreadQuery = query(msgRef, orderBy("createdAt", "desc"));

    onSnapshot(unreadQuery, (msgsSnap) => {
      let count = 0;
      msgsSnap.forEach((msgDoc) => {
        const msg = msgDoc.data();
        if (msg.sender === "client" && msg.read === false) {
          count++;
        }
      });
      userUnreadCounts[user.id] = count;
      renderUserProgress();
    });
  });

  renderUserProgress();

  // Auto select first user if none selected yet
  if (isFirstLoad && allUsers.length > 0) {
    selectUser(allUsers[0].id);
    isFirstLoad = false;
  }
});

// Render user progress
function renderUserProgress() {
  const search = searchInput.value.toLowerCase();
  userProgressList.innerHTML = "";

  allUsers
    .filter((u) => (u.name || "").toLowerCase().includes(search))
    .forEach((user) => {
      const unreadCount = userUnreadCounts[user.id] || 0;

      const div = document.createElement("div");
      div.classList.add("user-progress-item");

      div.innerHTML = `
        <h4>${user.name} ${unreadCount > 0 ? `<span style="color: red;">(${unreadCount})</span>` : ""}</h4>
        <p>Project: ${user.project}</p>
        <p>Progress: ${user.progress || 0}%</p>
        <button onclick="selectUser('${user.id}')">Chat</button>
      `;

      userProgressList.appendChild(div);
    });
}

// Add new user
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

    const msgRef = collection(db, "users", email, "messages");
    await addDoc(msgRef, {
      sender: "najaza",
      text: "Welcome to the project!",
      createdAt: serverTimestamp(),
      read: false
    });

    alert("User added successfully!");
    addUserForm.reset();
  } catch (err) {
    alert("Error adding user: " + err.message);
  }
});

// Update progress
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

// Search filter
searchInput.addEventListener("input", renderUserProgress);

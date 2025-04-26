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

// Ensure Firebase session persistence
auth.setPersistence(browserLocalPersistence)
  .then(() => {
    // Your login logic here will go inside
  })
  .catch((error) => {
    console.error("Error setting persistence", error);
  });

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

// Handle session state when page loads
onAuthStateChanged(auth, (user) => {
  if (user) {
    const email = user.email;
    if (!allowedAdmins.includes(email)) {
      signOut(auth);  // Sign out if the user is not an allowed admin
      alert("Access denied.");
    } else {
      loginSection.style.display = "none";
      dashboard.style.display = "block";
    }
  } else {
    loginSection.style.display = "block";
    dashboard.style.display = "none";
  }
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

// Chat listener
const chatQuery = query(collection(db, "messages"), orderBy("createdAt", "asc"));
onSnapshot(chatQuery, (snapshot) => {
  chatBox.innerHTML = "";
  snapshot.forEach((doc) => {
    const data = doc.data();
    const type = data.sender === "client" ? "client" : "najaza";
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${type}`;
    msgDiv.innerHTML = `${data.text}<span class="message-time">${new Date(data.createdAt?.seconds * 1000 || Date.now()).toLocaleTimeString()}</span>`;
    chatBox.appendChild(msgDiv);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
});

// Send chat message
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = messageInput.value.trim();
  if (msg) {
    const selectedUserEmail = CURRENT_SELECTED_USER_EMAIL; // ← You'll dynamically set this!
    const msgRef = collection(db, "users", selectedUserEmail, "messages");

    await addDoc(msgRef, {
      sender: "najaza",
      text: msg,
      createdAt: serverTimestamp(),
      read: false
    });

    messageInput.value = "";
  }
});

// User progress display
let allUsers = [];
onSnapshot(collection(db, "users"), (snapshot) => {
  allUsers = [];
  userUnreadCounts = {}; // reset
  
  snapshot.forEach((docSnap) => {
    const user = { id: docSnap.id, ...docSnap.data() };
    allUsers.push(user);

    // Now check for unread messages
    const msgRef = collection(db, "users", user.id, "messages");
    const unreadQuery = query(msgRef, 
      orderBy("createdAt", "desc")
    );

    onSnapshot(unreadQuery, (msgsSnap) => {
      let count = 0;
      msgsSnap.forEach((msgDoc) => {
        const msg = msgDoc.data();
        if (msg.sender === "client" && msg.read === false) {
          count++;
        }
      });
      userUnreadCounts[user.id] = count;
      renderUserProgress(); // update UI
    });
  });

  renderUserProgress();
});


// Render progress cards
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


let CURRENT_SELECTED_USER_EMAIL = null;
let unsubscribeMessages = null;

window.selectUser = async function(userEmail) {
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

      // If unread client message, mark it as read
      if (data.sender === "client" && data.read === false) {
        batchUpdates.push(updateDoc(docSnap.ref, { read: true }));
      }
    });

    Promise.all(batchUpdates).then(() => {
      console.log("All messages marked as read");
    });

    chatBox.scrollTop = chatBox.scrollHeight;
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
    // 1. Create the user profile document
    await setDoc(doc(db, "users", email), {
      name,
      project,
      dueDate,
      progress
    });

    // 2. Create an empty message document (optional starter message)
    const msgRef = collection(db, "users", email, "messages");
    await addDoc(msgRef, {
      sender: "najaza",
      text: "Welcome to the project!",
      createdAt: serverTimestamp(),
      read: false
    });

    alert("User added successfully and private chat initialized!");
    addUserForm.reset();
  } catch (err) {
    alert("Error adding user: " + err.message);
  }
});


// Search input
searchInput.addEventListener("input", renderUserProgress);

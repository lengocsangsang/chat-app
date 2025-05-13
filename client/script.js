let socket;
let token = "";
let chatDiv = document.getElementById("chat");
let messageInput = document.getElementById("messageInput");

function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  fetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("status").innerText = "Registered! Now login.";
    });
}

function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.token) {
        token = data.token;
        startWebSocket();
        document.getElementById("login").style.display = "none";
        document.getElementById("chat-container").style.display = "block";
      } else {
        document.getElementById("status").innerText = "Login failed.";
      }
    });
}

function startWebSocket() {
  socket = new WebSocket(`ws://${window.location.host}`);

  socket.onopen = () => {
    socket.send(JSON.stringify({ type: "auth", token }));
  };

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "auth-success") {
      appendMessage(`✅ Welcome ${msg.username}`);
    }

    if (msg.type === "history") {
      msg.messages.forEach((m) => {
        appendMessage(
          `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.sender}: ${
            m.text
          }`
        );
      });
    }

    if (msg.type === "message") {
      appendMessage(
        `[${new Date(msg.timestamp).toLocaleTimeString()}] ${msg.sender}: ${
          msg.text
        }`
      );
    }
  };
}

function sendMessage() {
  const text = messageInput.value;
  socket.send(JSON.stringify({ type: "message", text }));
  messageInput.value = "";
}

function appendMessage(text) {
  const p = document.createElement("p");
  p.innerText = text;
  chatDiv.appendChild(p);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

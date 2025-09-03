# 🎓 AI-BOT

A full-stack AI study assistant built with React (frontend) and Flask (backend), integrating GPT-4, speech-to-text, file upload, and email functionality.

---

## 🔹 Section 1: Frontend

### 🧱 Step 1: Folder Structure

```
ai-buddy/
└── frontend/
    ├── public/
    └── src/
        ├── App.js
        ├── components/
        │   └── ChatBox.js
        ├── index.js
        └── App.css
```

### 🔄 Step 2: Code Flow

```
📄 public/index.html
    ↓
📄 src/index.js
    → ReactDOM renders <App />

📄 src/App.js
    → Renders <ChatBox /> component
    → Imports global styles from App.css

📄 src/components/ChatBox.js
    → Handles:
        - User input
        - Speech-to-text (Web Speech API)
        - File upload (PDF)
        - GPT-4 API call via POST to `/ask`
        - Text-to-speech for responses
        - Email POST to `/send-email`
```


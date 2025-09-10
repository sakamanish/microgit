import React, { useState } from "react";

const ChatBox = () => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    setLoading(true);
    setResponse("");
    try {
      const res = await fetch("http://localhost:5000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.response) {
        setResponse(data.response);
      } else {
        setResponse("Error: " + data.error);
      }
    } catch (err) {
      setResponse("Error connecting to server.");
    }
    setLoading(false);
  };

  return (
    <div className="chatbox">
      <textarea
        placeholder="Ask a question or paste your notes..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button onClick={handleAsk} disabled={loading}>
        {loading ? "Asking..." : "Submit"}
      </button>
      <div className="response">
        <strong>Response:</strong>
        <p>{response}</p>
      </div>
    </div>
  );
};

export default ChatBox;

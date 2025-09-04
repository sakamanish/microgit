import React, { useState, useRef, useEffect } from 'react';
import './App.css'; // We'll create this file next

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // This function scrolls to the bottom of the chat window whenever a new message is added.
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // This function handles sending a message. It will need to be connected to your backend API.
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    // Add user's message to the state
    const userMessage = { text: input, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');

    // --- You would connect to your backend API here ---
    // Example using fetch:
    /*
    try {
      const response = await fetch('/api/chat', { // Replace with your actual backend endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });
      const data = await response.json();
      
      // Add AI's response to the state
      const aiMessage = { text: data.aiResponse, sender: 'ai' };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);

    } catch (error) {
      console.error("Error sending message to backend:", error);
      const errorMessage = { text: "Sorry, something went wrong. Please try again.", sender: 'ai' };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }
    */
    // --- End of backend connection placeholder ---

    // For demonstration, let's simulate an AI response
    const aiResponse = { text: `AI: You said "${input}". I am processing this...`, sender: 'ai' };
    setTimeout(() => {
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
    }, 1000); // Simulate a 1-second delay for the AI response
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h1>MicroAI</h1>
        <p>A helpful AI assistant.</p>
      </header>
      <main className="chat-window">
        {messages.map((message, index) => (
          <div key={index} className={`message-bubble ${message.sender}`}>
            <p>{message.text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>
      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
        />
        <button type="submit">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send">
            <path d="m22 2-7 19-3-6-6-3 19-7z"/><path d="M12 12l6-6"/>
          </svg>
        </button>
      </form>
    </div>
  );
}

export default App;

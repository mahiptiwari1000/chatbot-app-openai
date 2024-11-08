// src/app/page.js

'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messageEndRef = useRef(null);

 const sendMessage = async () => {
  if (!input.trim()) return; // Prevent sending empty messages

  const userMessage = { role: "user", content: input };
  setMessages([...messages, userMessage]);
  setInput(""); // Clear the input field after sending

  // Add a temporary empty bot message for streaming
  const tempBotMessage = { role: "assistant", content: "" };
  setMessages((prev) => [...prev, tempBotMessage]);

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: input }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let botMessageContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Decode the chunk and treat it as plain text
    const chunk = decoder.decode(value);

    // Append the chunk directly to botMessageContent
    botMessageContent += chunk;

    // Update bot's message progressively
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages];
      updatedMessages[updatedMessages.length - 1] = {
        role: "assistant",
        content: botMessageContent,
      };
      return updatedMessages;
    });
  }
};


  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  useEffect(() => {
    // Scroll to the bottom of the message list whenever a new message is added
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-4xl font-bold mb-4 text-blue-600">Chatty</h1>
      <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-4">
        <div className="max-h-96 overflow-y-auto mb-4 p-2 space-y-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`p-3 rounded-lg ${
                  msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-900 border border-gray-300"
                } max-w-xs break-words`}
              >
                <strong>{msg.role === "user" ? "You: " : "Bot: "}</strong>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messageEndRef} />
        </div>
        <div className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown} // Add the Enter key listener here
            placeholder="Type your message..."
            className="flex-grow p-2 border border-gray-300 rounded-md mr-2 focus:outline-none focus:border-blue-500 bg-gray-100 text-gray-900 placeholder-gray-500"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

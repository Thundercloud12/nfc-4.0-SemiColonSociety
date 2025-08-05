"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SymptomLogger() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/login");
      return;
    }
    
    if (session.user.role !== "pregnant") {
      router.push("/");
      return;
    }
    
    // Initialize conversation
    initializeConversation();
  }, [session, status, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeConversation = () => {
    const welcomeMessage = {
      type: "bot",
      content: "Hello! I'm here to help you log your symptoms today. Please tell me how you're feeling. You can describe any symptoms, discomfort, or concerns you might have. When you're done, just say 'stop' or 'that's all' to finish.",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading || sessionEnded) return;

    const userMessage = {
      type: "user",
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Check if user wants to end the session
      const stopWords = ["stop", "that's all", "done", "finish", "end", "complete"];
      const shouldStop = stopWords.some(word => 
        currentMessage.toLowerCase().includes(word)
      );

      const response = await fetch("/api/patient/symptom-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentMessage,
          conversationHistory: messages,
          shouldEndSession: shouldStop
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsTyping(false);
        
        const botMessage = {
          type: "bot",
          content: data.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);

        // If session should end, process the structured data
        if (shouldStop && data.structuredData) {
          setSessionEnded(true);
          await saveSymptomLog(data.structuredData);
          
          const summaryMessage = {
            type: "system",
            content: "Your symptoms have been logged successfully. You can start a new session or return to your dashboard.",
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, summaryMessage]);
        }
      } else {
        setIsTyping(false);
        const errorMessage = {
          type: "system",
          content: "Sorry, I'm having trouble processing your message. Please try again.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      setIsTyping(false);
      console.error("Error sending message:", error);
      const errorMessage = {
        type: "system",
        content: "Sorry, I'm having trouble connecting. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSymptomLog = async (structuredData) => {
    try {
      const response = await fetch("/api/patient/symptom-log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(structuredData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Symptom log saved successfully:", result);
        
        // Display priority information to the user
        if (result.priority) {
          const priorityMessage = {
            type: "bot",
            content: `✅ Your symptoms have been logged successfully.\n\n📊 **Priority Assessment: ${result.priority}**\n\n${result.priorityMessage || ''}\n\n${result.priority === 'HIGH' ? '🚨 Please contact your healthcare provider immediately.' : result.priority === 'MEDIUM' ? '⚠️ Please monitor these symptoms and consult your healthcare provider if they worsen.' : '📝 Continue tracking your symptoms regularly.'}`,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, priorityMessage]);
        }
      } else {
        console.error("Failed to save symptom log");
        const errorMessage = {
          type: "bot",
          content: "❌ There was an error saving your symptom log. Please try again or contact support.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Error saving symptom log:", error);
      const errorMessage = {
        type: "bot",
        content: "❌ There was an error saving your symptom log. Please check your connection and try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewSession = () => {
    setMessages([]);
    setSessionEnded(false);
    initializeConversation();
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Symptom Logger
              </h1>
              <p className="text-gray-600">Describe your symptoms and I'll help log them</p>
            </div>
            <button
              onClick={() => router.push("/patient-dashboard")}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-lg shadow-md h-96 flex flex-col">
          {/* Messages */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === "user"
                        ? "bg-blue-500 text-white"
                        : message.type === "system"
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.type === "user" ? "text-blue-100" : "text-gray-500"
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: "0.1s"}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            {sessionEnded ? (
              <div className="flex justify-center">
                <button
                  onClick={startNewSession}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Start New Session
                </button>
              </div>
            ) : (
              <div className="flex space-x-4">
                <textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe your symptoms..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="2"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !currentMessage.trim()}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? "..." : "Send"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">How to use:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Describe your symptoms in detail</li>
            <li>• I'll ask follow-up questions to understand better</li>
            <li>• When you're done, say "stop" or "that's all"</li>
            <li>• Your symptoms will be automatically logged and saved</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

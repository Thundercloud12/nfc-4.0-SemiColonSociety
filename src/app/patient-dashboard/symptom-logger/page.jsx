"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import offlineManager from "@/lib/offlineManager";
import OfflineStatus from "@/components/OfflineStatus";

export default function SymptomLogger() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const messagesEndRef = useRef(null);

  // Audio-related states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  
  // Audio refs
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

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
    
    // Initialize audio features
    initializeAudio();
    
    // Check initial offline status
    setIsOffline(!navigator.onLine);
    
    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      // Cleanup audio
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        speechSynthesis.cancel();
      }
    };
  }, [session, status, router]);

  // Audio initialization
  const initializeAudio = () => {
    // Check for Speech Recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      // Configure recognition settings
      recognitionRef.current.continuous = true; // Keep listening
      recognitionRef.current.interimResults = true; // Show interim results
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event) => {
        console.log('Speech recognition result:', event);
        
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        console.log('Final transcript:', finalTranscript);
        console.log('Interim transcript:', interimTranscript);

        // Update the message with final transcript
        if (finalTranscript) {
          setCurrentMessage(prev => {
            const newMessage = prev ? prev + ' ' + finalTranscript : finalTranscript;
            console.log('Updated current message:', newMessage);
            return newMessage;
          });
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        console.error('Error details:', event);
        setIsListening(false);
        
        // Handle specific errors
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access and try again.');
        } else if (event.error === 'no-speech') {
          console.log('No speech detected, restarting...');
          // Auto-restart if no speech detected
          setTimeout(() => {
            if (recognitionRef.current && speechSupported) {
              try {
                recognitionRef.current.start();
              } catch (err) {
                console.error('Error restarting recognition:', err);
              }
            }
          }, 1000);
        }
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };

      recognitionRef.current.onnomatch = () => {
        console.log('No speech match found');
      };

      recognitionRef.current.onspeechstart = () => {
        console.log('Speech started');
      };

      recognitionRef.current.onspeechend = () => {
        console.log('Speech ended');
      };

    } else {
      console.warn('Speech Recognition not supported in this browser');
    }

    // Check for Speech Synthesis support
    if ('speechSynthesis' in window) {
      setTtsSupported(true);
      synthRef.current = speechSynthesis;
    } else {
      console.warn('Speech Synthesis not supported in this browser');
    }
  };

  // Separate useEffect for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Space bar to toggle voice recording (when not typing)
      if (event.code === 'Space' && event.ctrlKey && speechSupported) {
        event.preventDefault();
        if (isListening) {
          stopListening();
        } else {
          startListening();
        }
      }
      // Escape to stop all audio
      if (event.code === 'Escape') {
        if (isListening) stopListening();
        if (isSpeaking) stopSpeaking();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [speechSupported, isListening, isSpeaking]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeConversation = () => {
    const welcomeMessage = {
      type: "bot",
      content: `Hello! I'm here to help you log your symptoms today. Please tell me how you're feeling. You can describe any symptoms, discomfort, or concerns you might have. When you're done, just say 'stop' or 'that's all' to finish.${
        !navigator.onLine ? '\n\n📴 You are currently offline. Your symptoms will be saved locally and synced when your connection is restored.' : ''
      }`,
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

        // Speak the bot response if audio is enabled
        if (audioEnabled && data.response) {
          console.log('Audio enabled, scheduling TTS for bot response');
          setTimeout(() => {
            console.log('Attempting to speak bot response:', data.response.substring(0, 100) + '...');
            speakText(data.response);
          }, 500); // Small delay for better UX
        } else {
          console.log('TTS not triggered:', { audioEnabled, hasResponse: !!data.response });
        }

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
      // Check if offline and save locally
      if (!navigator.onLine) {
        console.log('[SymptomLogger] Offline - saving symptom log locally');
        
        const offlineResult = await offlineManager.storeSymptomLogOffline(
          structuredData, 
          session.user.id
        );
        
        if (offlineResult.success) {
          const offlineMessage = {
            type: "bot",
            content: ` Your symptoms have been saved offline successfully!\n\n **Symptoms Logged Locally**\n\nYour symptom data has been stored on your device and will be automatically synced to the server when your internet connection is restored.\n\n📱 You can continue using the app offline - all your data will be safely stored.`,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, offlineMessage]);
        }
        return;
      }

      // Online - save normally
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
            content: ` Your symptoms have been logged successfully.\n\n**Priority Assessment: ${result.priority}**\n\n${result.priorityMessage || ''}\n\n${result.priority === 'HIGH' ? '🚨 Please contact your healthcare provider immediately.' : result.priority === 'MEDIUM' ? '⚠️ Please monitor these symptoms and consult your healthcare provider if they worsen.' : '📝 Continue tracking your symptoms regularly.'}`,
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
      
      // If network error and we're offline, try to save locally
      if (!navigator.onLine) {
        try {
          const offlineResult = await offlineManager.storeSymptomLogOffline(
            structuredData, 
            session.user.id
          );
          
          if (offlineResult.success) {
            const offlineMessage = {
              type: "bot",
              content: `Connection issue detected. Your symptoms have been saved offline and will sync when connection is restored.\n\n📊 **Symptoms Stored Locally**\n\nDon't worry - your data is safe and will be automatically uploaded when you're back online.`,
              timestamp: new Date()
            };
            
            setMessages(prev => [...prev, offlineMessage]);
          }
        } catch (offlineError) {
          console.error("Failed to save offline:", offlineError);
          const errorMessage = {
            type: "bot",
            content: "❌ Unable to save your symptom log offline. Please check your device storage and try again.",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } else {
        const errorMessage = {
          type: "bot",
          content: "❌ There was an error saving your symptom log. Please check your connection and try again.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
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

  // Audio Functions
  const startListening = () => {
    if (!speechSupported) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (!recognitionRef.current) {
      console.error('Speech recognition not initialized');
      return;
    }

    if (isListening) {
      console.log('Already listening');
      return;
    }

    try {
      console.log('Attempting to start speech recognition...');
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      
      if (error.name === 'InvalidStateError') {
        // Recognition is already running, stop it first
        console.log('Recognition already running, stopping first...');
        recognitionRef.current.stop();
        setTimeout(() => {
          try {
            recognitionRef.current.start();
          } catch (retryError) {
            console.error('Retry error:', retryError);
          }
        }, 100);
      } else {
        alert('Could not start voice recognition. Please check your microphone permissions.');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      console.log('Stopping speech recognition...');
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  };

  const speakText = (text) => {
    console.log('speakText called with:', { text, ttsSupported, audioEnabled, synthRef: !!synthRef.current });
    
    if (!synthRef.current) {
      console.warn('Speech synthesis not available');
      return;
    }
    
    if (!ttsSupported) {
      console.warn('TTS not supported');
      return;
    }
    
    if (!audioEnabled) {
      console.log('Audio not enabled by user');
      return;
    }

    try {
      // Cancel any ongoing speech
      synthRef.current.cancel();
      
      // Clean the text for better speech
      const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/\n/g, ' ').trim();
      console.log('Speaking cleaned text:', cleanText);
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      utterance.lang = 'en-US';
      
      utterance.onstart = () => {
        console.log('TTS started');
        setIsSpeaking(true);
      };
      
      utterance.onend = () => {
        console.log('TTS ended');
        setIsSpeaking(false);
      };
      
      utterance.onerror = (event) => {
        console.error('TTS error:', event);
        setIsSpeaking(false);
      };
      
      utterance.onpause = () => {
        console.log('TTS paused');
      };
      
      utterance.onresume = () => {
        console.log('TTS resumed');
      };
      
      console.log('Starting speech synthesis...');
      synthRef.current.speak(utterance);
      
    } catch (error) {
      console.error('Error in speakText:', error);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (isSpeaking) {
      stopSpeaking();
    }
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 p-6">
      <OfflineStatus />
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                  Symptom Logger
                  {isOffline && (
                    <span className="ml-3 px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full font-medium">
                      📴 Offline Mode
                    </span>
                  )}
                </h1>
                <p className="text-gray-600 text-lg">
                  {isOffline 
                    ? "Offline mode: Your symptoms will be saved locally " 
                    : "Describe your symptoms and I'll help log them "
                  }
                </p>
              </div>
            </div>
            
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Audio Status Bar */}
          {(isListening || isSpeaking) && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-purple-100 p-3">
              <div className="flex items-center justify-center space-x-4">
                {isListening && (
                  <div className="flex items-center space-x-2 text-blue-700">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">🎤 Listening for speech...</span>
                    <span className="text-xs text-blue-600">Speak clearly into your microphone</span>
                    <div className="flex space-x-1">
                      <div className="w-1 h-4 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-1 h-4 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: "0.1s"}}></div>
                      <div className="w-1 h-4 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                    </div>
                  </div>
                )}
                {isSpeaking && (
                  <div className="flex items-center space-x-2 text-purple-700">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">🔊 Speaking response...</span>
                    <div className="flex space-x-1">
                      <div className="w-1 h-4 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-1 h-4 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: "0.1s"}}></div>
                      <div className="w-1 h-4 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Messages */}
          <div className="h-96 p-6 overflow-y-auto bg-gradient-to-b from-pink-25 to-white scrollbar-thin scrollbar-thumb-pink-300 scrollbar-track-pink-100">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-6 py-4 rounded-xl shadow-md ${
                      message.type === "user"
                        ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white"
                        : message.type === "system"
                        ? "bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-2 border-green-300"
                        : "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-200"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      message.type === "user" ? "text-pink-100" : "text-gray-500"
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 px-6 py-4 rounded-xl shadow-md border border-gray-200">
                    <div className="flex space-x-1 items-center">
                      <span className="text-sm mr-2">AI is typing</span>
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: "0.1s"}}></div>
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t-2 border-pink-100 p-6 bg-pink-50">
            {sessionEnded ? (
              <div className="flex justify-center">
                <button
                  onClick={startNewSession}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  🔄 Start New Session
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Audio Controls */}
                <div className="flex items-center justify-between bg-white p-4 rounded-xl border-2 border-pink-200">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Audio Features:</span>
                      <button
                        onClick={toggleAudio}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                          audioEnabled 
                            ? 'bg-green-100 text-green-800 border border-green-300' 
                            : 'bg-gray-100 text-gray-600 border border-gray-300'
                        }`}
                      >
                        {audioEnabled ? '🔊 ON' : '🔇 OFF'}
                      </button>
                    </div>
                    
                    {speechSupported && (
                      <button
                        onClick={isListening ? stopListening : startListening}
                        disabled={isLoading || sessionEnded}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isListening
                            ? 'bg-red-100 text-red-800 border-2 border-red-300 animate-pulse'
                            : 'bg-blue-100 text-blue-800 border-2 border-blue-300 hover:bg-blue-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isListening ? '⏹️ Stop Listening' : '🎤 Start Speaking'}
                      </button>
                    )}
                    
                    {ttsSupported && isSpeaking && (
                      <button
                        onClick={stopSpeaking}
                        className="px-4 py-2 bg-orange-100 text-orange-800 border-2 border-orange-300 rounded-lg text-sm font-medium hover:bg-orange-200 transition-all duration-200"
                      >
                        🔇 Stop Speaking
                      </button>
                    )}
                    
                    {ttsSupported && audioEnabled && !isSpeaking && (
                      <button
                        onClick={() => speakText("This is a test of the text to speech feature. If you can hear this, the audio is working correctly.")}
                        className="px-4 py-2 bg-purple-100 text-purple-800 border-2 border-purple-300 rounded-lg text-sm font-medium hover:bg-purple-200 transition-all duration-200"
                      >
                        🔊 Test TTS
                      </button>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {speechSupported ? '🎤 Available' : '🎤 Not supported'} | 
                    {ttsSupported ? ' 🔊 Available' : ' 🔊 Not supported'}
                  </div>
                </div>

                {/* Text Input */}
                <div className="flex space-x-4">
                  <textarea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`${speechSupported ? 'Type your message or use voice input...' : 'Describe your symptoms in detail...'} (Press Enter to send, Shift+Enter for new line)`}
                    className="flex-1 px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none transition-all duration-200 text-gray-700"
                    rows="3"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !currentMessage.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl hover:from-pink-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      "📤 Send"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center mb-4">
            <span className="bg-blue-100 p-2 rounded-lg mr-3">💡</span>
            <h3 className="font-bold text-blue-800 text-lg">How to use this symptom logger:</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-3 text-sm text-blue-700">
              <div className="flex items-start">
                <span className="mr-2">•</span>
                <span>Describe your symptoms in detail (pain, discomfort, unusual feelings)</span>
              </div>
              <div className="flex items-start">
                <span className="mr-2">•</span>
                <span>I'll ask follow-up questions to understand better</span>
              </div>
            </div>
            <div className="space-y-3 text-sm text-blue-700">
              <div className="flex items-start">
                <span className="mr-2">•</span>
                <span>When you're done, say "stop" or "that's all"</span>
              </div>
              <div className="flex items-start">
                <span className="mr-2">•</span>
                <span>Your symptoms will be automatically logged and prioritized</span>
              </div>
            </div>
            <div className="space-y-3 text-sm text-blue-700">
              <div className="flex items-start">
                <span className="mr-2">🎤</span>
                <span>Click "Start Speaking" to use voice input</span>
              </div>
              <div className="flex items-start">
                <span className="mr-2">🔊</span>
                <span>Enable audio to hear responses aloud</span>
              </div>
            </div>
          </div>
          
          {/* Audio Features Info */}
          {(speechSupported || ttsSupported) && (
            <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <div className="flex items-center text-green-800 mb-2">
                <span className="mr-2">✨</span>
                <span className="font-semibold">Audio Features Available</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-green-700 mb-3">
                {speechSupported && (
                  <div className="flex items-center">
                    <span className="mr-2">🎤</span>
                    <span>Voice input supported - speak your symptoms</span>
                  </div>
                )}
                {ttsSupported && (
                  <div className="flex items-center">
                    <span className="mr-2">🔊</span>
                    <span>Text-to-speech supported - hear responses</span>
                  </div>
                )}
              </div>
              {speechSupported && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                  <div className="font-medium text-blue-800 mb-2">🎤 Voice Input Tips:</div>
                  <div className="text-blue-700 space-y-1">
                    <div>• Allow microphone access when prompted</div>
                    <div>• Speak clearly and at normal pace</div>
                    <div>• Wait for the "Listening..." indicator</div>
                    <div>• Check browser console (F12) for any errors</div>
                    <div>• Try refreshing if voice input stops working</div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {isOffline && (
            <div className="mt-4 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
              <div className="flex items-center text-orange-800">
                <span className="mr-2">📴</span>
                <span className="font-semibold">Offline Mode Active</span>
              </div>
              <p className="text-sm text-orange-700 mt-2">
                Your symptoms are being saved locally on your device. They will automatically sync to the server when your internet connection is restored.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

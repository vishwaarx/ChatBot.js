'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

interface Message {
  type: 'user' | 'bot';
  content: string;
}

const API_URL = 'http://localhost:8000';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAskedFirstQuestion, setHasAskedFirstQuestion] = useState(false);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [serverStatus, setServerStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check server status on component mount
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        setServerStatus('connecting');
        // Make a simple request to the server to check health
        // The FastAPI server doesn't have a /docs endpoint accessible by default
        // So instead we use another endpoint or just base URL
        await axios.get(`${API_URL}/`);
        setServerStatus('connected');
      } catch (error) {
        console.error("Server connection error:", error);
        setServerStatus('disconnected');
      }
    };
    
    checkServerStatus();
    // Set up an interval to check server status periodically
    const intervalId = setInterval(checkServerStatus, 30000); // every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  // Add auto-scroll effect
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]); // Scroll when messages change or loading state changes

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      // Set file state immediately to update UI
      setFile(selectedFile);
      setError(null);
      
      // Reset input value to ensure onChange triggers correctly on the same file
      e.target.value = '';
      
      // Automatically start upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      try {
        setLoading(true);
        setError(null);
        const response = await axios.post(`${API_URL}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setIsFileUploaded(true);
        setServerStatus('connected'); // Update server status on successful upload
      } catch (error: any) {
        setError(error.message || 'Error uploading file');
        alert(`Error uploading file: ${error.message}`);
        if (error.request && !error.response) {
          setServerStatus('disconnected');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const startNewChat = async () => {
    try {
      // Clear backend collections first
      await axios.post(`${API_URL}/clear`);
      
      // Then clear frontend state
      setFile(null);
      setQuestion('');
      setMessages([]);
      setError(null);
      setHasAskedFirstQuestion(false);
      setIsFileUploaded(false);
      
      // Reset file input element
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error: any) {
      console.error("Error clearing chat:", error);
      setError("Failed to clear chat state. Please refresh the page.");
    }
  };

  const askQuestion = async () => {
    if (!question.trim() || loading) return;  // Prevent submitting if already loading
    
    // Prevent asking question if server is disconnected
    if (serverStatus === 'disconnected') {
      setError('Server is not connected. Please check the server status and try again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Add user message
      setMessages(prev => [...prev, { type: 'user', content: question }]);
      
      console.log("Sending request to:", `${API_URL}/ask`);
      console.log("Request payload:", { text: question });
      
      // Store the question to clear the input immediately
      const currentQuestion = question;
      setQuestion(''); // Clear input right away to prevent duplicate submissions
      
      const response = await axios.post(`${API_URL}/ask`, {
        text: currentQuestion,  // Use stored question
      }, {
        // Add timeout to prevent hanging requests
        timeout: 60000,
        // Add additional headers if needed
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log("Response received:", response.data);
      setServerStatus('connected'); // Update server status on successful response
      
      // Add bot message
      setMessages(prev => [...prev, { type: 'bot', content: response.data.answer }]);
      setHasAskedFirstQuestion(true);
    } catch (error: any) {
      console.error("Error details:", error);
      
      // More detailed error handling
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Response error data:", error.response.data);
        console.error("Response error status:", error.response.status);
        console.error("Response error headers:", error.response.headers);
        
        const errorMessage = error.response.data.detail || JSON.stringify(error.response.data);
        setError(`Server error (${error.response.status}): ${errorMessage}`);
        
        // Add error message to chat
        setMessages(prev => [...prev, { 
          type: 'bot', 
          content: `Sorry, I encountered an error: ${errorMessage}. Please try again.` 
        }]);
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
        setError("No response received from server. Please check if the server is running.");
        setServerStatus('disconnected'); // Update server status if no response
        
        // Add error message to chat
        setMessages(prev => [...prev, { 
          type: 'bot', 
          content: "Sorry, I didn't receive a response from the server. Please check if the server is running and try again."
        }]);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Request setup error:", error.message);
        setError(`Error: ${error.message}`);
        
        // Add error message to chat
        setMessages(prev => [...prev, { 
          type: 'bot', 
          content: `Sorry, an error occurred: ${error.message}. Please try again.` 
        }]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      <div className="flex-1 max-w-5xl w-full mx-auto p-2 sm:p-4 md:p-6 lg:p-8 flex flex-col h-[100vh]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 bg-gray-800/30 p-3 sm:p-4 rounded-xl backdrop-blur-sm border border-gray-700/50">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              HR/IT FAQ Chatbot
            </h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">Your AI assistant for HR and IT inquiries</p>
          </div>
          
          {/* Server Status with improved styling */}
          <div className="flex items-center gap-3 bg-gray-900/50 px-3 sm:px-4 py-2 rounded-lg border border-gray-700/50 w-full sm:w-auto">
            <span className="text-sm text-gray-400">Server:</span>
            <div className="flex items-center gap-2">
              <div 
                className={`w-2.5 h-2.5 rounded-full ${
                  serverStatus === 'connected' 
                    ? 'bg-green-500 animate-pulse' 
                    : serverStatus === 'connecting' 
                    ? 'bg-yellow-500 animate-pulse' 
                    : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-gray-300">
                {serverStatus === 'connected' 
                  ? 'Connected' 
                  : serverStatus === 'connecting' 
                  ? 'Connecting...' 
                  : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Server Status Message */}
        {serverStatus === 'disconnected' && (
          <div className="mb-4 bg-red-900/30 backdrop-blur-sm border border-red-700/50 rounded-xl p-3 sm:p-4 text-red-200 text-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs sm:text-sm">
                <strong>Server connection error:</strong> The backend server is not responding. 
                Please make sure the backend server is running before using the chatbot.
              </p>
            </div>
          </div>
        )}

        {/* Main Chat Container */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-xl flex-1 flex flex-col min-h-0">
          {/* Chat Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 sm:p-4 border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-200">Chat Session</h2>
                <p className="text-xs sm:text-sm text-gray-400">Ask any HR or IT related questions</p>
              </div>
            </div>
            <button
              onClick={() => startNewChat().catch(console.error)}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-gray-600/50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              New Chat
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 min-h-0">
            {messages.length === 0 && !hasAskedFirstQuestion && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-200 mb-2">Welcome to HR/IT FAQ Chatbot!</h3>
                  <p className="text-sm sm:text-base text-gray-400 max-w-md">I'm here to help you with any HR or IT related questions. Feel free to ask anything!</p>
                </div>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-4 rounded-xl shadow-lg ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                      : 'bg-gray-700/50 border border-gray-600/50 text-gray-200'
                  }`}
                >
                  <p className="text-sm sm:text-base break-words">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-700/50 p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col w-full gap-3">
                <div className="w-full relative">
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        askQuestion();
                      }
                    }}
                    placeholder="Ask your question..."
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 resize-none text-sm sm:text-base"
                    style={{ minHeight: '2.75rem', maxHeight: '2.75rem' }}
                  />
                  {loading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={askQuestion}
                  disabled={!question.trim() || loading}
                  className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2
                    ${!question.trim() || loading
                      ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg hover:shadow-purple-500/20'
                    }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm sm:text-base">{loading ? 'Processing...' : 'Send'}</span>
                </button>
              </div>

              {/* File Upload and Info Row */}
              <div className="flex items-center gap-3 text-gray-400">
                <button
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="p-1.5 hover:text-purple-400 transition-colors duration-200 rounded-lg hover:bg-gray-600/30 flex items-center gap-2"
                  title="Upload File"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-xs sm:text-sm">Upload File</span>
                </button>

                {/* File name display */}
                {file && (
                  <div className="flex items-center gap-2 bg-gray-700/30 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
                    <span className="text-xs sm:text-sm text-gray-400 truncate max-w-[150px] sm:max-w-[200px]">{file.name}</span>
                    {isFileUploaded ? (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    )}
                    
                    {/* Remove file button */}
                    <button
                      onClick={() => {
                        setFile(null);
                        setIsFileUploaded(false);
                      }}
                      className="p-1 hover:text-red-400 transition-colors duration-200"
                      title="Remove file"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".txt,.pdf,.doc,.docx"
                  key={file ? undefined : "empty-input"}
                />
              </div>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="mt-2 text-red-400 text-sm animate-fade-in">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 
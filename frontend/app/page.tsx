'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

interface Message {
  type: 'user' | 'bot';
  content: string;
}

export default function Home() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAskedFirstQuestion, setHasAskedFirstQuestion] = useState(false);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      setFile(selectedFile);
      setError(null);
      // Automatically start upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      try {
        setLoading(true);
        setError(null);
        const response = await axios.post('http://localhost:8000/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setIsFileUploaded(true);
      } catch (error: any) {
        setError(error.message || 'Error uploading file');
        alert(`Error uploading file: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const startNewChat = () => {
    setFile(null);
    setQuestion('');
    setMessages([]);
    setError(null);
    setHasAskedFirstQuestion(false);
    setIsFileUploaded(false);
  };

  const askQuestion = async () => {
    if (!question.trim()) return;

    try {
      setLoading(true);
      setError(null);
      
      // Add user message
      setMessages(prev => [...prev, { type: 'user', content: question }]);
      
      const response = await axios.post('http://localhost:8000/ask', {
        text: question,
      });
      
      // Add bot message
      setMessages(prev => [...prev, { type: 'bot', content: response.data.answer }]);
      setQuestion(''); // Clear input after sending
      setHasAskedFirstQuestion(true);
    } catch (error: any) {
      setError(error.message || 'Error getting answer');
      alert('Error getting answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          HR/IT FAQ Chatbot
        </h1>

        {!hasAskedFirstQuestion ? (
          // Initial View
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg p-6">
            {/* Welcome Message */}
            <h2 className="text-2xl font-semibold text-gray-200 mb-6 text-center">How can I help you today?</h2>

            {/* Question Input with Upload Button */}
            <div className="relative">
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
                className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 h-40 mb-4 resize-none"
              />
              
              {/* Enhanced Upload Button Inside Textarea */}
              <div className="absolute bottom-8 left-4 flex items-center gap-4">
                <button 
                  className="group px-3 py-1.5 bg-gray-800/80 backdrop-blur-sm text-gray-300 rounded-lg hover:bg-gray-700/80 hover:text-white transition-all duration-200 font-medium flex items-center gap-2 border border-gray-700/50"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {file ? (
                        <>
                          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                          {isFileUploaded && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </>
                      ) : (
                        <>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5" 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm">Upload File</span>
                        </>
                      )}
                    </div>
                  )}
                </button>
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".txt,.pdf,.doc,.docx"
                />
              </div>
            </div>

            <button
              onClick={askQuestion}
              disabled={!question.trim() || loading}
              className="w-full max-w-md mx-auto block px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 transition-all duration-200 font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <span>Processing</span>
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              ) : (
                'Ask Question'
              )}
            </button>
          </div>
        ) : (
          // Chat View
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg p-6">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-700">
              <span className="text-gray-300">Current file: {file?.name}</span>
              <button
                onClick={startNewChat}
                className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all duration-200 font-medium"
              >
                New Chat
              </button>
            </div>

            <div className="flex flex-col h-[600px]">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-700/30 border border-gray-600 text-gray-200'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} /> {/* Scroll anchor */}
              </div>

              {/* Input Area */}
              <div className="flex items-end gap-4">
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
                  className="flex-1 p-4 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 h-16 resize-none"
                />
                <button
                  onClick={askQuestion}
                  disabled={!question.trim() || loading}
                  className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-600 transition-all duration-200 font-medium h-16"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <span>Processing</span>
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  ) : (
                    'Ask'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 
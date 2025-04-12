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
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

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
            {/* File Upload Section */}
            <div className="flex items-center justify-between mb-6">
              {!isFileUploaded ? (
                <>
                  <div className="flex items-center gap-4 flex-1">
                    <button 
                      className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all duration-200 font-medium"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      Choose File
                    </button>
                    <span className="text-gray-400">{file ? file.name : 'No file chosen'}</span>
                    <button
                      onClick={uploadFile}
                      disabled={!file || loading}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-600 disabled:text-gray-400 transition-all duration-200 font-medium ml-auto"
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <span>Uploading</span>
                          <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        </div>
                      ) : (
                        'Upload'
                      )}
                    </button>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".txt,.pdf,.doc,.docx"
                  />
                </>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="text-gray-300">Current file: {file?.name}</span>
                  <button
                    onClick={startNewChat}
                    className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all duration-200 font-medium"
                  >
                    New Chat
                  </button>
                </div>
              )}
            </div>

            {!isFileUploaded && (
              <div className="text-sm text-gray-400 mb-8">
                Supported formats: .txt, .pdf, .doc, .docx (Max size: 10MB)
              </div>
            )}

            {/* Large Question Input - Only show if file is uploaded */}
            {isFileUploaded && (
              <>
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
                  className="w-full p-4 bg-gray-800/50 border-2 border-purple-500 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 h-40 mb-4 resize-none"
                />

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
              </>
            )}
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
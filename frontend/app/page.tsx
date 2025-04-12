'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

interface Message {
  type: 'user' | 'bot';
  content: string;
}

const styles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }
`;

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
    <main className="min-h-screen p-8 professional-bg">
      <style jsx global>{styles}</style>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8 text-center text-white">
          HR/IT FAQ Chatbot
        </h1>

        {!hasAskedFirstQuestion ? (
          // Initial View
          <div className="professional-card rounded-lg p-6">
            {/* File Upload Section */}
            <div className="flex items-center justify-between mb-6">
              {!isFileUploaded ? (
                <>
                  <div className="flex items-center gap-4 flex-1">
                    <button 
                      className="btn-primary"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      Choose File
                    </button>
                    <span className="text-gray-400">{file ? file.name : 'No file chosen'}</span>
                    <button
                      onClick={uploadFile}
                      disabled={!file || loading}
                      className="btn-primary ml-auto"
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
                    className="btn-secondary"
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

            {/* Question Input - Only show if file is uploaded */}
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
                  className="input-primary w-full h-40 mb-4 resize-none"
                />

                <button
                  onClick={askQuestion}
                  disabled={!question.trim() || loading}
                  className="btn-primary w-full max-w-md mx-auto block"
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
          <div className="professional-card rounded-lg p-6">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-700">
              <span className="text-gray-300">Current file: {file?.name}</span>
              <button
                onClick={startNewChat}
                className="btn-secondary"
              >
                New Chat
              </button>
            </div>

            <div className="flex flex-col h-[600px]">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-4 custom-scrollbar">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-md ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white message-out'
                          : 'bg-gray-700 text-gray-200 message-in'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start message-in">
                    <div className="bg-gray-700 rounded-md p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
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
                  className="input-primary flex-1 h-16 resize-none"
                />
                <button
                  onClick={askQuestion}
                  disabled={!question.trim() || loading}
                  className="btn-primary h-16"
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
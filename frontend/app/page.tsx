'use client';

import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFileUploaded, setIsFileUploaded] = useState(false);

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
    setAnswer('');
    setError(null);
    setIsFileUploaded(false);
  };

  const askQuestion = async () => {
    if (!question.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const response = await axios.post('http://localhost:8000/ask', {
        text: question,
      });
      setAnswer(response.data.answer);
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
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg p-6">
          {/* File Upload Section */}
          <div className="mb-6 pb-6 border-b border-gray-700">
            <div className="flex items-center gap-4">
              {!isFileUploaded ? (
                <>
                  <label className="flex-1">
                    <div className="flex items-center gap-4">
                      <button 
                        className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        Choose File
                      </button>
                      <span className="text-gray-400">{file ? file.name : 'No file chosen'}</span>
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".txt,.pdf,.doc,.docx"
                    />
                  </label>
                  <button
                    onClick={uploadFile}
                    disabled={!file || loading}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-600 transition-all duration-200 font-medium"
                  >
                    {loading ? 'Uploading...' : 'Upload'}
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="text-gray-300">Current file: {file?.name}</span>
                  <button
                    onClick={startNewChat}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium"
                  >
                    New Chat
                  </button>
                </div>
              )}
            </div>
            {error && (
              <div className="mt-2 text-red-400">
                Error: {error}
              </div>
            )}
            {!isFileUploaded && (
              <div className="mt-2 text-sm text-gray-400">
                Supported formats: .txt, .pdf, .doc, .docx (Max size: 10MB)
              </div>
            )}
          </div>

          {/* Chat Section */}
          <div>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask your question..."
              className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 h-32 mb-4"
            />
            
            <button
              onClick={askQuestion}
              disabled={!question.trim() || loading || !isFileUploaded}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-600 transition-all duration-200 font-medium"
            >
              {loading ? 'Processing...' : 'Ask Question'}
            </button>

            {loading && (
              <div className="mt-4 text-center text-gray-400">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-400 border-t-purple-500"></div>
              </div>
            )}

            {answer && (
              <div className="mt-6 p-6 bg-gray-700/30 rounded-lg border border-gray-600">
                <h3 className="font-semibold mb-3 text-gray-200">Answer:</h3>
                <p className="whitespace-pre-wrap text-gray-300">{answer}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 
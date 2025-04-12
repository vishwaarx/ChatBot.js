import requests
import json
import time

# API endpoint
API_URL = "http://localhost:8000"

def test_ask_question(question):
    """Test the ask endpoint with a question"""
    print(f"\nQuestion: {question}")
    
    start_time = time.time()
    
    response = requests.post(
        f"{API_URL}/ask",
        json={"text": question}
    )
    
    end_time = time.time()
    response_time = end_time - start_time
    
    if response.status_code == 200:
        result = response.json()
        print(f"Answer: {result['answer']}")
        print(f"Response time: {response_time:.2f} seconds")
        
        if 'sources' in result and result['sources']:
            print("\nSources:")
            for i, source in enumerate(result['sources'], 1):
                print(f"{i}. {source}")
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
    
    print("-" * 80)

def main():
    print("Testing the improved chatbot...")
    
    # Test questions
    questions = [
        "How do I request time off?",
        "What are the company's working hours?",
        "How do I reset my network password?",
        "What is your purpose?",
        "Can you handle confidential information?",
        "How do I report a security incident?",
        "What software is available for employee use?",
        "Are you available 24/7?"
    ]
    
    for question in questions:
        test_ask_question(question)
        time.sleep(1)  # Small delay between requests

if __name__ == "__main__":
    main() 
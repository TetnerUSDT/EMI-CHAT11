#!/usr/bin/env python3
import requests
import json
import time
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://1af7d254-e678-4394-a8c3-43115eddb52c.preview.emergentagent.com/api"

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_test_header(test_name):
    print(f"\n{Colors.HEADER}{Colors.BOLD}===== Testing: {test_name} ====={Colors.ENDC}")

def print_success(message):
    print(f"{Colors.OKGREEN}✓ {message}{Colors.ENDC}")

def print_failure(message):
    print(f"{Colors.FAIL}✗ {message}{Colors.ENDC}")

def print_info(message):
    print(f"{Colors.OKBLUE}ℹ {message}{Colors.ENDC}")

def test_posts_api_with_token(token, channel_id):
    """Test the posts API with a valid JWT token"""
    print_test_header(f"Testing Posts API for Channel {channel_id}")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 1: Get posts without pagination
    try:
        print_info("Test 1: Getting posts without pagination (limit=10)")
        response = requests.get(
            f"{BACKEND_URL}/posts/{channel_id}?limit=10",
            headers=headers
        )
        
        print_info(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Successfully retrieved {len(data)} posts")
            
            if len(data) > 0:
                print_info(f"Sequence numbers: {[post['sequence_number'] for post in data]}")
                
                # Test 2: Get posts with pagination
                oldest_post = data[0]  # First post is the oldest due to reverse order
                before_sequence = oldest_post['sequence_number']
                
                print_info(f"Test 2: Getting posts with pagination (limit=5, before_sequence={before_sequence})")
                response2 = requests.get(
                    f"{BACKEND_URL}/posts/{channel_id}?limit=5&before_sequence={before_sequence}",
                    headers=headers
                )
                
                print_info(f"Response status: {response2.status_code}")
                
                if response2.status_code == 200:
                    data2 = response2.json()
                    print_success(f"Successfully retrieved {len(data2)} posts with pagination")
                    
                    if len(data2) > 0:
                        print_info(f"Sequence numbers: {[post['sequence_number'] for post in data2]}")
                        
                        # Verify all posts in second batch have sequence_number < before_sequence
                        all_valid = all(post['sequence_number'] < before_sequence for post in data2)
                        if all_valid:
                            print_success("All posts in second batch have sequence_number < before_sequence")
                        else:
                            print_failure("Some posts in second batch have invalid sequence_number")
                    else:
                        print_info("No more posts available")
                else:
                    print_failure(f"Failed to get posts with pagination: {response2.status_code} - {response2.text}")
            else:
                print_info("No posts available")
        elif response.status_code == 404:
            print_failure(f"Channel not found: {response.status_code} - {response.text}")
        elif response.status_code == 403:
            print_failure(f"Access denied: {response.status_code} - {response.text}")
        else:
            print_failure(f"Failed to get posts: {response.status_code} - {response.text}")
    except Exception as e:
        print_failure(f"Error testing posts API: {str(e)}")

def test_edge_cases_with_token(token, channel_id):
    """Test edge cases for the posts API with a valid JWT token"""
    print_test_header(f"Testing Edge Cases for Channel {channel_id}")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 1: Invalid before_sequence (non-numeric)
    try:
        print_info("Test 1: Invalid before_sequence (non-numeric)")
        response = requests.get(
            f"{BACKEND_URL}/posts/{channel_id}?before_sequence=invalid",
            headers=headers
        )
        
        print_info(f"Response status: {response.status_code}")
        
        if response.status_code >= 400:
            print_success(f"Correctly rejected invalid before_sequence with status {response.status_code}")
        else:
            print_failure(f"Should have rejected invalid before_sequence, got status: {response.status_code}")
    except Exception as e:
        print_failure(f"Error testing invalid before_sequence: {str(e)}")
    
    # Test 2: Very large limit
    try:
        print_info("Test 2: Very large limit (100)")
        response = requests.get(
            f"{BACKEND_URL}/posts/{channel_id}?limit=100",
            headers=headers
        )
        
        print_info(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Successfully handled large limit, retrieved {len(data)} posts")
        else:
            print_failure(f"Failed to handle large limit: {response.status_code} - {response.text}")
    except Exception as e:
        print_failure(f"Error testing large limit: {str(e)}")
    
    # Test 3: Very small limit
    try:
        print_info("Test 3: Very small limit (1)")
        response = requests.get(
            f"{BACKEND_URL}/posts/{channel_id}?limit=1",
            headers=headers
        )
        
        print_info(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Successfully handled small limit, retrieved {len(data)} posts")
            if len(data) == 1:
                print_success("Correctly limited to 1 post")
            else:
                print_failure(f"Should have returned exactly 1 post, got {len(data)}")
        else:
            print_failure(f"Failed to handle small limit: {response.status_code} - {response.text}")
    except Exception as e:
        print_failure(f"Error testing small limit: {str(e)}")
    
    # Test 4: Non-existent before_sequence (very large number)
    try:
        print_info("Test 4: Non-existent before_sequence (very large number)")
        response = requests.get(
            f"{BACKEND_URL}/posts/{channel_id}?before_sequence=999999",
            headers=headers
        )
        
        print_info(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Successfully handled non-existent before_sequence, retrieved {len(data)} posts")
        else:
            print_failure(f"Failed to handle non-existent before_sequence: {response.status_code} - {response.text}")
    except Exception as e:
        print_failure(f"Error testing non-existent before_sequence: {str(e)}")

def run_tests():
    """Run all tests for the posts API"""
    print(f"\n{Colors.BOLD}======= EMI Backend API Posts Tests ======={Colors.ENDC}")
    print(f"Testing against: {BACKEND_URL}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # Use a valid JWT token and channel ID
    # Replace these with valid values for your environment
    token = input("Enter a valid JWT token: ")
    channel_id = input("Enter a valid channel ID: ")
    
    # Test the posts API
    test_posts_api_with_token(token, channel_id)
    
    # Test edge cases
    test_edge_cases_with_token(token, channel_id)
    
    print("\n" + "=" * 50)
    print(f"{Colors.BOLD}Posts API Tests Completed{Colors.ENDC}")
    print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    run_tests()
#!/usr/bin/env python3
import requests
import json
import time
import logging
import argparse
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

def test_posts_api(token, channel_id):
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

def test_edge_cases(token, channel_id):
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

def test_hasMorePosts_logic(token, channel_id):
    """Test the logic for determining if there are more posts"""
    print_test_header(f"Testing hasMorePosts Logic for Channel {channel_id}")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # First, get all posts to know how many there are
    try:
        print_info("Getting all posts to determine total count")
        response = requests.get(
            f"{BACKEND_URL}/posts/{channel_id}?limit=100",
            headers=headers
        )
        
        print_info(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            all_posts = response.json()
            total_posts = len(all_posts)
            print_info(f"Total posts in channel: {total_posts}")
            
            if total_posts > 0:
                # Test with limit equal to total posts
                print_info(f"Test 1: Getting posts with limit={total_posts}")
                response1 = requests.get(
                    f"{BACKEND_URL}/posts/{channel_id}?limit={total_posts}",
                    headers=headers
                )
                
                print_info(f"Response status: {response1.status_code}")
                
                if response1.status_code == 200:
                    data1 = response1.json()
                    if len(data1) == total_posts:
                        print_success(f"Successfully retrieved all {total_posts} posts")
                        
                        # Now test with limit = total_posts + 1
                        print_info(f"Test 2: Getting posts with limit={total_posts + 1}")
                        response2 = requests.get(
                            f"{BACKEND_URL}/posts/{channel_id}?limit={total_posts + 1}",
                            headers=headers
                        )
                        
                        print_info(f"Response status: {response2.status_code}")
                        
                        if response2.status_code == 200:
                            data2 = response2.json()
                            if len(data2) == total_posts:
                                print_success(f"Correctly returned only {total_posts} posts when requesting {total_posts + 1}")
                                print_info("This confirms hasMorePosts should be false")
                            else:
                                print_failure(f"Expected {total_posts} posts, got {len(data2)}")
                        else:
                            print_failure(f"Failed to get posts with limit={total_posts + 1}: {response2.status_code}")
                    else:
                        print_failure(f"Expected {total_posts} posts, got {len(data1)}")
                else:
                    print_failure(f"Failed to get posts with limit={total_posts}: {response1.status_code}")
                
                # If we have enough posts, test pagination
                if total_posts > 5:
                    # Get first batch
                    print_info("Test 3: Testing pagination with limit=5")
                    response3 = requests.get(
                        f"{BACKEND_URL}/posts/{channel_id}?limit=5",
                        headers=headers
                    )
                    
                    print_info(f"Response status: {response3.status_code}")
                    
                    if response3.status_code == 200:
                        data3 = response3.json()
                        if len(data3) == 5:
                            print_success("Successfully retrieved first 5 posts")
                            
                            # There should be more posts
                            print_info("hasMorePosts should be true (5 < total)")
                            
                            # Get second batch
                            oldest_post = data3[0]
                            before_sequence = oldest_post['sequence_number']
                            
                            print_info(f"Test 4: Getting next batch with before_sequence={before_sequence}")
                            response4 = requests.get(
                                f"{BACKEND_URL}/posts/{channel_id}?limit=5&before_sequence={before_sequence}",
                                headers=headers
                            )
                            
                            print_info(f"Response status: {response4.status_code}")
                            
                            if response4.status_code == 200:
                                data4 = response4.json()
                                print_success(f"Successfully retrieved {len(data4)} posts in second batch")
                                
                                # If we have exactly 10 posts and we've retrieved all of them
                                if total_posts == 10 and len(data3) + len(data4) == 10:
                                    print_info("hasMorePosts should be false (retrieved all posts)")
                                elif len(data4) < 5:
                                    print_info("hasMorePosts should be false (second batch < limit)")
                                else:
                                    print_info("hasMorePosts should be true (second batch = limit)")
                            else:
                                print_failure(f"Failed to get second batch: {response4.status_code}")
                        else:
                            print_failure(f"Expected 5 posts, got {len(data3)}")
                    else:
                        print_failure(f"Failed to get first batch: {response3.status_code}")
            else:
                print_info("No posts in channel, skipping hasMorePosts tests")
        else:
            print_failure(f"Failed to get all posts: {response.status_code}")
    except Exception as e:
        print_failure(f"Error testing hasMorePosts logic: {str(e)}")

def main():
    parser = argparse.ArgumentParser(description='Test the posts API with a valid JWT token and channel ID')
    parser.add_argument('--token', help='JWT token for authentication')
    parser.add_argument('--channel', help='Channel ID to test')
    
    args = parser.parse_args()
    
    token = args.token
    channel_id = args.channel
    
    if not token:
        token = input("Enter a valid JWT token: ")
    
    if not channel_id:
        channel_id = input("Enter a valid channel ID: ")
    
    print(f"\n{Colors.BOLD}======= EMI Backend API Posts Tests ======={Colors.ENDC}")
    print(f"Testing against: {BACKEND_URL}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # Test the posts API
    test_posts_api(token, channel_id)
    
    # Test edge cases
    test_edge_cases(token, channel_id)
    
    # Test hasMorePosts logic
    test_hasMorePosts_logic(token, channel_id)
    
    print("\n" + "=" * 50)
    print(f"{Colors.BOLD}Posts API Tests Completed{Colors.ENDC}")
    print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
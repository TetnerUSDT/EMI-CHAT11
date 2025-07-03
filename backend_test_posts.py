#!/usr/bin/env python3
import requests
import json
import time
import sys
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

# Test wallet addresses and private keys
TEST_WALLETS = {
    "BSC": {
        "address": "0x742d35Cc6634C0532925a3b8D39c6e8f137b7c85",
        "private_key": "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    }
}

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

def generate_auth_message(wallet_address, network):
    """Generate authentication message"""
    print_test_header(f"Generate Auth Message for {network}")
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/auth/generate-message",
            params={"wallet_address": wallet_address, "network": network}
        )
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["message", "timestamp", "wallet_address", "network"]
            
            if all(field in data for field in required_fields):
                print_success(f"Generate message endpoint returned status {response.status_code} with all required fields")
                return data
            else:
                print_failure(f"Generate message endpoint missing required fields. Got: {data}")
                return None
        else:
            print_failure(f"Generate message endpoint returned status {response.status_code}")
            return None
    except Exception as e:
        print_failure(f"Error testing generate message endpoint: {str(e)}")
        return None

def login_test_user(wallet_data, network):
    """Login a test user and return the auth token"""
    print_test_header(f"Login Test User ({network})")
    
    wallet_address = wallet_data["address"]
    
    # Generate message
    message_data = generate_auth_message(wallet_address, network)
    if not message_data:
        print_failure(f"Failed to generate message for test user")
        return None
    
    # For testing purposes, we'll use a simplified approach
    # since the backend is configured to accept any valid-format signature in test mode
    message = message_data["message"]
    signature = "0x" + "a" * 130  # Mock signature that should be accepted in test mode
    
    try:
        login_data = {
            "wallet_address": wallet_address,
            "network": network,
            "signature": signature,
            "message": message
        }
        
        print_info(f"Login data: {login_data}")
        print_info(f"Login URL: {BACKEND_URL}/auth/login")
        
        response = requests.post(
            f"{BACKEND_URL}/auth/login",
            json=login_data
        )
        
        print_info(f"Login response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                print_success(f"Successfully logged in test user")
                print_info(f"Token: {data['access_token'][:20]}...")
                print_info(f"User ID: {data['user']['id']}")
                return {
                    "token": data["access_token"],
                    "user_id": data["user"]["id"],
                    "username": data["user"]["username"],
                    "wallet_address": data["user"]["wallet_address"]
                }
            else:
                print_failure(f"Login response missing access token: {data}")
                return None
        else:
            print_failure(f"Login failed with status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_failure(f"Error during login: {str(e)}")
        return None

def create_test_channel(user_data):
    """Create a test channel for posts testing"""
    print_test_header("Create Test Channel")
    
    headers = {"Authorization": f"Bearer {user_data['token']}"}
    print_info(f"Auth token: {user_data['token'][:20]}...")
    print_info(f"Headers: {headers}")
    
    channel_data = {
        "name": f"Test Channel {int(time.time())}",
        "chat_type": "channel",
        "description": "Test channel for posts pagination testing",
        "is_public": True,
        "channel_username": f"test_channel_{int(time.time())}"
    }
    print_info(f"Channel data: {channel_data}")
    
    try:
        # First, check if the user is authenticated
        print_info("Checking authentication with /auth/me endpoint")
        auth_check = requests.get(
            f"{BACKEND_URL}/auth/me",
            headers=headers
        )
        print_info(f"Auth check response: {auth_check.status_code}")
        if auth_check.status_code == 200:
            print_success("Authentication successful")
            print_info(f"User data: {auth_check.json()}")
        else:
            print_failure(f"Authentication failed: {auth_check.status_code} - {auth_check.text}")
        
        print_info(f"Creating channel with URL: {BACKEND_URL}/chats")
        response = requests.post(
            f"{BACKEND_URL}/chats",
            json=channel_data,
            headers=headers
        )
        
        print_info(f"Create channel response: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print_success(f"Successfully created test channel with ID: {data['id']}")
            return data
        else:
            print_failure(f"Failed to create channel: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print_failure(f"Error creating test channel: {str(e)}")
        return None

def create_test_posts(user_data, channel_id, num_posts=15):
    """Create multiple test posts in a channel"""
    print_test_header(f"Creating {num_posts} Test Posts")
    
    headers = {"Authorization": f"Bearer {user_data['token']}"}
    created_posts = []
    
    for i in range(num_posts):
        post_data = {
            "text": f"Test post #{i+1} - This is a test post for pagination testing. Created at {datetime.now().isoformat()}",
            "media_url": None,
            "media_type": None
        }
        
        try:
            response = requests.post(
                f"{BACKEND_URL}/posts/{channel_id}",
                json=post_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print_success(f"Created post #{i+1} with sequence_number: {data['sequence_number']}")
                created_posts.append(data)
            else:
                print_failure(f"Failed to create post #{i+1}: {response.status_code} - {response.text}")
        except Exception as e:
            print_failure(f"Error creating post #{i+1}: {str(e)}")
    
    return created_posts

def test_get_posts_pagination(user_data, channel_id):
    """Test getting posts with pagination"""
    print_test_header("Testing Posts Pagination")
    
    headers = {"Authorization": f"Bearer {user_data['token']}"}
    
    # Test 1: Get initial posts (no pagination)
    try:
        print_info("Test 1: Getting initial posts (limit=5, no before_sequence)")
        response = requests.get(
            f"{BACKEND_URL}/posts/{channel_id}?limit=5",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print_success(f"Successfully retrieved {len(data)} posts")
                
                if len(data) > 0:
                    print_info(f"First batch sequence numbers: {[post['sequence_number'] for post in data]}")
                    
                    # Test 2: Get older posts using before_sequence
                    oldest_post = data[0]  # First post is the oldest due to reverse order
                    before_sequence = oldest_post['sequence_number']
                    
                    print_info(f"Test 2: Getting older posts (limit=5, before_sequence={before_sequence})")
                    response2 = requests.get(
                        f"{BACKEND_URL}/posts/{channel_id}?limit=5&before_sequence={before_sequence}",
                        headers=headers
                    )
                    
                    if response2.status_code == 200:
                        data2 = response2.json()
                        if isinstance(data2, list):
                            print_success(f"Successfully retrieved {len(data2)} older posts")
                            
                            if len(data2) > 0:
                                print_info(f"Second batch sequence numbers: {[post['sequence_number'] for post in data2]}")
                                
                                # Verify all posts in second batch have sequence_number < before_sequence
                                all_valid = all(post['sequence_number'] < before_sequence for post in data2)
                                if all_valid:
                                    print_success("All posts in second batch have sequence_number < before_sequence")
                                else:
                                    print_failure("Some posts in second batch have invalid sequence_number")
                                
                                # Test 3: Get even older posts
                                if len(data2) > 0:
                                    oldest_post2 = data2[0]
                                    before_sequence2 = oldest_post2['sequence_number']
                                    
                                    print_info(f"Test 3: Getting even older posts (limit=5, before_sequence={before_sequence2})")
                                    response3 = requests.get(
                                        f"{BACKEND_URL}/posts/{channel_id}?limit=5&before_sequence={before_sequence2}",
                                        headers=headers
                                    )
                                    
                                    if response3.status_code == 200:
                                        data3 = response3.json()
                                        if isinstance(data3, list):
                                            print_success(f"Successfully retrieved {len(data3)} even older posts")
                                            
                                            if len(data3) > 0:
                                                print_info(f"Third batch sequence numbers: {[post['sequence_number'] for post in data3]}")
                                                
                                                # Verify all posts in third batch have sequence_number < before_sequence2
                                                all_valid = all(post['sequence_number'] < before_sequence2 for post in data3)
                                                if all_valid:
                                                    print_success("All posts in third batch have sequence_number < before_sequence2")
                                                else:
                                                    print_failure("Some posts in third batch have invalid sequence_number")
                                            else:
                                                print_info("No more older posts available")
                                        else:
                                            print_failure(f"Expected list of posts, got: {data3}")
                                    else:
                                        print_failure(f"Failed to get third batch: {response3.status_code} - {response3.text}")
                            else:
                                print_info("No more older posts available")
                        else:
                            print_failure(f"Expected list of posts, got: {data2}")
                    else:
                        print_failure(f"Failed to get second batch: {response2.status_code} - {response2.text}")
                else:
                    print_info("No posts available")
            else:
                print_failure(f"Expected list of posts, got: {data}")
        else:
            print_failure(f"Failed to get initial posts: {response.status_code} - {response.text}")
    except Exception as e:
        print_failure(f"Error testing posts pagination: {str(e)}")

def test_edge_cases(user_data, channel_id):
    """Test edge cases for posts pagination"""
    print_test_header("Testing Edge Cases")
    
    headers = {"Authorization": f"Bearer {user_data['token']}"}
    
    # Test 1: Invalid before_sequence (non-numeric)
    try:
        print_info("Test 1: Invalid before_sequence (non-numeric)")
        response = requests.get(
            f"{BACKEND_URL}/posts/{channel_id}?before_sequence=invalid",
            headers=headers
        )
        
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
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print_success(f"Successfully handled large limit, retrieved {len(data)} posts")
            else:
                print_failure(f"Expected list of posts, got: {data}")
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
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print_success(f"Successfully handled small limit, retrieved {len(data)} posts")
                if len(data) == 1:
                    print_success("Correctly limited to 1 post")
                else:
                    print_failure(f"Should have returned exactly 1 post, got {len(data)}")
            else:
                print_failure(f"Expected list of posts, got: {data}")
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
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print_success(f"Successfully handled non-existent before_sequence, retrieved {len(data)} posts")
            else:
                print_failure(f"Expected list of posts, got: {data}")
        else:
            print_failure(f"Failed to handle non-existent before_sequence: {response.status_code} - {response.text}")
    except Exception as e:
        print_failure(f"Error testing non-existent before_sequence: {str(e)}")

def test_hasMorePosts_logic(user_data, channel_id):
    """Test the logic for determining if there are more posts"""
    print_test_header("Testing hasMorePosts Logic")
    
    headers = {"Authorization": f"Bearer {user_data['token']}"}
    
    # First, get all posts to know how many there are
    try:
        print_info("Getting all posts to determine total count")
        response = requests.get(
            f"{BACKEND_URL}/posts/{channel_id}?limit=100",
            headers=headers
        )
        
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

def run_posts_tests():
    """Run all tests for posts pagination"""
    print(f"\n{Colors.BOLD}======= EMI Backend API Posts Tests ======={Colors.ENDC}")
    print(f"Testing against: {BACKEND_URL}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # Login a test user
    user = login_test_user(TEST_WALLETS["BSC"], "BSC")
    if not user:
        print_failure("Failed to login test user, aborting tests")
        return False
    
    # Test the auth/me endpoint to verify authentication
    print_test_header("Verifying Authentication")
    headers = {"Authorization": f"Bearer {user['token']}"}
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/auth/me",
            headers=headers
        )
        
        if response.status_code == 200:
            print_success("Authentication successful")
            print_info(f"User data: {response.json()}")
        else:
            print_failure(f"Authentication failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_failure(f"Error verifying authentication: {str(e)}")
        return False
    
    # Try to get user's chats to find a valid channel ID
    print_test_header("Finding Valid Channel ID")
    
    try:
        # First try with /chats endpoint
        print_info("Trying to get user's chats with /chats endpoint")
        response = requests.get(
            f"{BACKEND_URL}/chats",
            headers=headers
        )
        
        print_info(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            chats = response.json()
            print_success(f"Successfully retrieved {len(chats)} chats")
            
            # Find channel-type chats
            channel_ids = []
            for chat in chats:
                if chat.get("chat_type") == "channel":
                    channel_ids.append(chat["id"])
            
            if channel_ids:
                print_success(f"Found {len(channel_ids)} channels")
                channel_id = channel_ids[0]
                print_info(f"Using channel ID: {channel_id}")
            else:
                print_failure("No channels found in user's chats")
                # Try a hardcoded channel ID as fallback
                channel_id = "64f5e8a7b9e5e8a7b9e5e8a7"  # Example channel ID
                print_info(f"Using fallback channel ID: {channel_id}")
        else:
            print_failure(f"Failed to get user's chats: {response.status_code} - {response.text}")
            # Try a hardcoded channel ID as fallback
            channel_id = "64f5e8a7b9e5e8a7b9e5e8a7"  # Example channel ID
            print_info(f"Using fallback channel ID: {channel_id}")
        
        # Test the posts API with the channel ID
        print_test_header("Testing Posts API")
        print_info(f"Testing GET /posts/{channel_id} endpoint")
        
        response = requests.get(
            f"{BACKEND_URL}/posts/{channel_id}?limit=10",
            headers=headers
        )
        
        print_info(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Successfully retrieved {len(data)} posts")
            
            if len(data) > 0:
                print_info(f"First post: {data[0]}")
                print_info(f"Sequence numbers: {[post['sequence_number'] for post in data]}")
                
                # Test pagination with before_sequence
                if len(data) > 0:
                    oldest_post = data[0]
                    before_sequence = oldest_post['sequence_number']
                    
                    print_info(f"Testing pagination with before_sequence={before_sequence}")
                    
                    response2 = requests.get(
                        f"{BACKEND_URL}/posts/{channel_id}?limit=10&before_sequence={before_sequence}",
                        headers=headers
                    )
                    
                    if response2.status_code == 200:
                        data2 = response2.json()
                        print_success(f"Successfully retrieved {len(data2)} older posts")
                        
                        if len(data2) > 0:
                            print_info(f"Older posts sequence numbers: {[post['sequence_number'] for post in data2]}")
                            
                            # Verify all posts in second batch have sequence_number < before_sequence
                            all_valid = all(post['sequence_number'] < before_sequence for post in data2)
                            if all_valid:
                                print_success("All posts in second batch have sequence_number < before_sequence")
                            else:
                                print_failure("Some posts in second batch have invalid sequence_number")
                    else:
                        print_failure(f"Failed to get older posts: {response2.status_code} - {response2.text}")
            else:
                print_info("No posts found in this channel")
        elif response.status_code == 404:
            print_failure(f"Channel not found: {response.status_code} - {response.text}")
            print_info("Try using a different channel ID")
        elif response.status_code == 403:
            print_failure(f"Access denied: {response.status_code} - {response.text}")
            print_info("The user might not be subscribed to this channel")
        else:
            print_failure(f"Failed to get posts: {response.status_code} - {response.text}")
    except Exception as e:
        print_failure(f"Error testing posts API: {str(e)}")
    
    print("\n" + "=" * 50)
    print(f"{Colors.BOLD}Posts Pagination Tests Completed{Colors.ENDC}")
    print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return True

if __name__ == "__main__":
    run_posts_tests()
#!/usr/bin/env python3
import requests
import json
import time
import os
from datetime import datetime
from eth_account import Account
from eth_account.messages import encode_defunct

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://72d55a8e-95d9-4262-ae04-b41bc079404d.preview.emergentagent.com/api"

# Test wallet addresses and private keys for different networks
# WARNING: These are test keys only, never use in production
TEST_WALLETS = {
    "BSC": {
        "address": "0x742d35Cc6634C0532925a3b8D39c6e8f137b7c85",
        "private_key": "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    },
    "ETHEREUM": {
        "address": "0x742d35Cc6634C0532925a3b8D39c6e8f137b7c85",
        "private_key": "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    },
    "TRON": {
        "address": "TJRabPrwbZy45sbavfcjinPJC18kjpRTv8",
        "private_key": "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    },
    "TON": {
        "address": "EQAVMUQnsF8dO1WgQGXK-hwPVnJ72FqA-KAVFyIBZK-Bb2Zl",
        "private_key": "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    }
}

# Second set of test wallets for creating chats between users
TEST_WALLETS_2 = {
    "BSC": {
        "address": "0x8A3B4D178BB4B2BAe86d5e6E5E2d5F3A2cCE416F",
        "private_key": "0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
    },
    "ETHEREUM": {
        "address": "0x8A3B4D178BB4B2BAe86d5e6E5E2d5F3A2cCE416F",
        "private_key": "0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
    },
    "TRON": {
        "address": "TUv37eBB5XD9JxL1e4G5e9YuKSfWHQiJc4",
        "private_key": "0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
    },
    "TON": {
        "address": "EQBl6cNmc6lJDPKAn8cOoFzVmMS4zUTukAK8J0yBV43-Bxjy",
        "private_key": "0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
    }
}

# Third set of test wallets for additional users
TEST_WALLETS_3 = {
    "BSC": {
        "address": "0x9B3C4D178BB4B2BAe86d5e6E5E2d5F3A2cCE789A",
        "private_key": "0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210"
    },
    "ETHEREUM": {
        "address": "0x9B3C4D178BB4B2BAe86d5e6E5E2d5F3A2cCE789A",
        "private_key": "0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210"
    },
    "TRON": {
        "address": "TLryUJJwXUMwBTJxJPRHBRFBvETPxd6gXm",
        "private_key": "0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210"
    },
    "TON": {
        "address": "EQDrjaLahXrGEJA-EFYvqVVGTS_qQzHqcCU5d-jCTQnPf4_K",
        "private_key": "0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210"
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

def test_api_root():
    print_test_header("API Root Endpoint")
    
    try:
        response = requests.get(f"{BACKEND_URL}/")
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data and data["message"] == "EMI API is running":
                print_success(f"API root endpoint returned status {response.status_code} with correct message")
                return True
            else:
                print_failure(f"API root endpoint returned unexpected data: {data}")
                return False
        else:
            print_failure(f"API root endpoint returned status {response.status_code}")
            return False
    except Exception as e:
        print_failure(f"Error testing API root endpoint: {str(e)}")
        return False

def test_status_endpoints():
    print_test_header("Status Endpoints")
    
    # Test POST /api/status
    try:
        client_name = f"test_client_{int(time.time())}"
        response = requests.post(
            f"{BACKEND_URL}/status", 
            json={"client_name": client_name}
        )
        
        if response.status_code == 200:
            data = response.json()
            if "client_name" in data and data["client_name"] == client_name:
                print_success(f"POST /api/status endpoint returned status {response.status_code} with correct data")
                status_check_success = True
            else:
                print_failure(f"POST /api/status endpoint returned unexpected data: {data}")
                status_check_success = False
        else:
            print_failure(f"POST /api/status endpoint returned status {response.status_code}")
            status_check_success = False
    except Exception as e:
        print_failure(f"Error testing POST /api/status endpoint: {str(e)}")
        status_check_success = False
    
    # Test GET /api/status
    try:
        response = requests.get(f"{BACKEND_URL}/status")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print_success(f"GET /api/status endpoint returned status {response.status_code} with list of status checks")
                get_status_success = True
            else:
                print_failure(f"GET /api/status endpoint returned unexpected data: {data}")
                get_status_success = False
        else:
            print_failure(f"GET /api/status endpoint returned status {response.status_code}")
            get_status_success = False
    except Exception as e:
        print_failure(f"Error testing GET /api/status endpoint: {str(e)}")
        get_status_success = False
    
    return status_check_success and get_status_success

def test_generate_message(wallet_address, network):
    print_test_header(f"Generate Message for {network}")
    
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
                print_info(f"Message: {data['message']}")
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

def test_login_with_invalid_signature(message_data):
    print_test_header("Login with Invalid Signature")
    
    if not message_data:
        print_failure("Cannot test login without message data")
        return False
    
    try:
        login_data = {
            "wallet_address": message_data["wallet_address"],
            "network": message_data["network"],
            "signature": "0x" + "a" * 130,  # Invalid signature
            "message": message_data["message"]
        }
        
        response = requests.post(
            f"{BACKEND_URL}/auth/login",
            json=login_data
        )
        
        if response.status_code == 401:
            print_success(f"Login with invalid signature correctly returned status {response.status_code}")
            return True
        else:
            print_failure(f"Login with invalid signature returned unexpected status {response.status_code}")
            print_info(f"Response: {response.text}")
            return False
    except Exception as e:
        print_failure(f"Error testing login with invalid signature: {str(e)}")
        return False

def test_message_validation():
    print_test_header("Message Validation")
    
    wallet_data = TEST_WALLETS["BSC"]
    wallet_address = wallet_data["address"]
    network = "BSC"
    
    # Generate a message
    message_data = test_generate_message(wallet_address, network)
    
    if not message_data:
        print_failure("Cannot test message validation without message data")
        return False
    
    # Modify the message to make it invalid (change timestamp to be too old)
    message_lines = message_data["message"].split('\n')
    for i, line in enumerate(message_lines):
        if line.startswith('Timestamp:'):
            # Set timestamp to 10 minutes ago (should be invalid)
            old_timestamp = int(time.time()) - 600
            message_lines[i] = f"Timestamp: {old_timestamp}"
            break
    
    invalid_message = '\n'.join(message_lines)
    
    try:
        login_data = {
            "wallet_address": wallet_address,
            "network": network,
            "signature": "0x" + "a" * 130,  # Signature doesn't matter for timestamp validation
            "message": invalid_message
        }
        
        response = requests.post(
            f"{BACKEND_URL}/auth/login",
            json=login_data
        )
        
        if response.status_code == 400:
            print_success(f"Login with expired message correctly returned status {response.status_code}")
            return True
        else:
            print_failure(f"Login with expired message returned unexpected status {response.status_code}")
            print_info(f"Response: {response.text}")
            return False
    except Exception as e:
        print_failure(f"Error testing message validation: {str(e)}")
        return False

def test_network_support():
    print_test_header("Network Support")
    
    results = {}
    
    for network, wallet_data in TEST_WALLETS.items():
        print_info(f"Testing network: {network}")
        message_data = test_generate_message(wallet_data["address"], network)
        results[network] = message_data is not None
    
    all_supported = all(results.values())
    
    if all_supported:
        print_success("All networks are supported")
    else:
        unsupported = [network for network, supported in results.items() if not supported]
        print_failure(f"Some networks are not supported: {', '.join(unsupported)}")
    
    return all_supported

def login_test_user(wallet_data, network, user_num=1):
    """Login a test user and return the auth token"""
    print_test_header(f"Login Test User {user_num} ({network})")
    
    wallet_address = wallet_data["address"]
    private_key = wallet_data["private_key"]
    
    # Generate message
    message_data = test_generate_message(wallet_address, network)
    if not message_data:
        print_failure(f"Failed to generate message for test user {user_num}")
        return None
    
    # Sign the message with the private key
    message = message_data["message"]
    
    try:
        # Create an Account object from the private key
        account = Account.from_key(private_key)
        
        # Sign the message
        message_to_sign = encode_defunct(text=message)
        signed_message = account.sign_message(message_to_sign)
        signature = signed_message.signature.hex()
        
        # Verify the address matches
        if account.address.lower() != wallet_address.lower():
            print_failure(f"Address mismatch: {account.address} != {wallet_address}")
            return None
        
        login_data = {
            "wallet_address": wallet_address,
            "network": network,
            "signature": signature,
            "message": message
        }
        
        response = requests.post(
            f"{BACKEND_URL}/auth/login",
            json=login_data
        )
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                print_success(f"Successfully logged in test user {user_num}")
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

def test_unauthorized_access():
    """Test that endpoints require authorization"""
    print_test_header("Authorization Requirements")
    
    endpoints = [
        {"method": "GET", "url": f"{BACKEND_URL}/chats"},
        {"method": "POST", "url": f"{BACKEND_URL}/chats", "data": {"chat_type": "personal", "participant_id": "some_id"}},
        {"method": "GET", "url": f"{BACKEND_URL}/chats/some_id/messages"},
        {"method": "POST", "url": f"{BACKEND_URL}/chats/some_id/messages", "data": {"content": "test"}},
        {"method": "GET", "url": f"{BACKEND_URL}/users/search?query=test"},
        {"method": "GET", "url": f"{BACKEND_URL}/users/some_id"},
        {"method": "PUT", "url": f"{BACKEND_URL}/users/profile", "data": {"username": "test_user"}}
    ]
    
    all_passed = True
    
    for endpoint in endpoints:
        try:
            if endpoint["method"] == "GET":
                response = requests.get(endpoint["url"])
            elif endpoint["method"] == "POST":
                response = requests.post(endpoint["url"], json=endpoint.get("data", {}))
            elif endpoint["method"] == "PUT":
                response = requests.put(endpoint["url"], json=endpoint.get("data", {}))
            
            if response.status_code == 401 or response.status_code == 403:
                print_success(f"{endpoint['method']} {endpoint['url']} correctly requires authorization")
            else:
                print_failure(f"{endpoint['method']} {endpoint['url']} does not require authorization (status: {response.status_code})")
                all_passed = False
                
        except Exception as e:
            print_failure(f"Error testing {endpoint['method']} {endpoint['url']}: {str(e)}")
            all_passed = False
    
    return all_passed

def test_create_personal_chat(user1_data, user2_data):
    """Test creating a personal chat between two users"""
    print_test_header("Create Personal Chat")
    
    headers = {"Authorization": f"Bearer {user1_data['token']}"}
    
    chat_data = {
        "chat_type": "personal",
        "participant_id": user2_data["user_id"]
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/chats",
            json=chat_data,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["id", "chat_type", "participants"]
            
            if all(field in data for field in required_fields):
                print_success(f"Successfully created personal chat")
                
                # Verify participants
                if user1_data["user_id"] in data["participants"] and user2_data["user_id"] in data["participants"]:
                    print_success(f"Chat contains both participants")
                else:
                    print_failure(f"Chat is missing participants: {data['participants']}")
                    return None
                
                return data
            else:
                print_failure(f"Response missing required fields: {data}")
                return None
        else:
            print_failure(f"Create chat failed with status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_failure(f"Error creating chat: {str(e)}")
        return None

def test_send_messages(user_data, chat_id, num_messages=3):
    """Test sending messages to a chat"""
    print_test_header(f"Send Messages (User: {user_data['username']})")
    
    headers = {"Authorization": f"Bearer {user_data['token']}"}
    messages = []
    
    for i in range(num_messages):
        message_data = {
            "content": f"Test message {i+1} from {user_data['username']}",
            "message_type": "text"
        }
        
        try:
            response = requests.post(
                f"{BACKEND_URL}/chats/{chat_id}/messages",
                json=message_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "content", "sender_id", "chat_id"]
                
                if all(field in data for field in required_fields):
                    print_success(f"Successfully sent message {i+1}")
                    messages.append(data)
                else:
                    print_failure(f"Response missing required fields: {data}")
            else:
                print_failure(f"Send message failed with status {response.status_code}: {response.text}")
        except Exception as e:
            print_failure(f"Error sending message: {str(e)}")
    
    return messages

def test_get_user_chats(user_data):
    """Test getting user chats"""
    print_test_header(f"Get User Chats (User: {user_data['username']})")
    
    headers = {"Authorization": f"Bearer {user_data['token']}"}
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/chats",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if isinstance(data, list):
                print_success(f"Successfully retrieved {len(data)} chats")
                return data
            else:
                print_failure(f"Expected list of chats, got: {data}")
                return None
        else:
            print_failure(f"Get chats failed with status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_failure(f"Error getting chats: {str(e)}")
        return None

def test_get_chat_messages(user_data, chat_id):
    """Test getting chat messages"""
    print_test_header(f"Get Chat Messages (User: {user_data['username']})")
    
    headers = {"Authorization": f"Bearer {user_data['token']}"}
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/chats/{chat_id}/messages",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if isinstance(data, list):
                print_success(f"Successfully retrieved {len(data)} messages")
                return data
            else:
                print_failure(f"Expected list of messages, got: {data}")
                return None
        else:
            print_failure(f"Get messages failed with status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_failure(f"Error getting messages: {str(e)}")
        return None

def test_search_chats(user_data, query):
    """Test searching chats"""
    print_test_header(f"Search Chats (Query: {query})")
    
    headers = {"Authorization": f"Bearer {user_data['token']}"}
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/chats/search?query={query}",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if isinstance(data, list):
                print_success(f"Successfully searched chats, found {len(data)} results")
                return data
            else:
                print_failure(f"Expected list of chats, got: {data}")
                return None
        else:
            print_failure(f"Search chats failed with status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_failure(f"Error searching chats: {str(e)}")
        return None

def test_search_users(user_data, query):
    """Test searching users"""
    print_test_header(f"Search Users (Query: {query})")
    
    headers = {"Authorization": f"Bearer {user_data['token']}"}
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/users/search?query={query}",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if isinstance(data, list):
                print_success(f"Successfully searched users, found {len(data)} results")
                return data
            else:
                print_failure(f"Expected list of users, got: {data}")
                return None
        else:
            print_failure(f"Search users failed with status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_failure(f"Error searching users: {str(e)}")
        return None

def test_get_user_profile(user_data, profile_user_id):
    """Test getting a user profile"""
    print_test_header(f"Get User Profile")
    
    headers = {"Authorization": f"Bearer {user_data['token']}"}
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/users/{profile_user_id}",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["id", "username", "wallet_address"]
            
            if all(field in data for field in required_fields):
                print_success(f"Successfully retrieved user profile")
                return data
            else:
                print_failure(f"Response missing required fields: {data}")
                return None
        else:
            print_failure(f"Get profile failed with status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_failure(f"Error getting profile: {str(e)}")
        return None

def test_update_profile(user_data):
    """Test updating user profile"""
    print_test_header(f"Update User Profile")
    
    headers = {"Authorization": f"Bearer {user_data['token']}"}
    new_username = f"updated_user_{int(time.time())}"
    
    profile_data = {
        "username": new_username
    }
    
    try:
        response = requests.put(
            f"{BACKEND_URL}/users/profile",
            json=profile_data,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if "username" in data and data["username"] == new_username:
                print_success(f"Successfully updated profile username to {new_username}")
                return data
            else:
                print_failure(f"Profile update failed or returned unexpected data: {data}")
                return None
        else:
            print_failure(f"Update profile failed with status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_failure(f"Error updating profile: {str(e)}")
        return None

def test_chat_scenario():
    """Test the complete chat scenario"""
    print_test_header("SCENARIO: Personal Chat Creation and Messaging")
    
    # Step 1: Login two test users
    user1 = login_test_user(TEST_WALLETS["BSC"], "BSC", 1)
    if not user1:
        print_failure("Failed to login first test user")
        return False
    
    user2 = login_test_user(TEST_WALLETS_2["BSC"], "BSC", 2)
    if not user2:
        print_failure("Failed to login second test user")
        return False
    
    # Step 2: Create a personal chat between them
    chat = test_create_personal_chat(user1, user2)
    if not chat:
        print_failure("Failed to create personal chat")
        return False
    
    chat_id = chat["id"]
    
    # Step 3: Send messages from both users
    user1_messages = test_send_messages(user1, chat_id, 2)
    user2_messages = test_send_messages(user2, chat_id, 2)
    
    if not user1_messages or not user2_messages:
        print_failure("Failed to send messages")
        return False
    
    # Step 4: Get chat list for both users
    user1_chats = test_get_user_chats(user1)
    user2_chats = test_get_user_chats(user2)
    
    if not user1_chats or not user2_chats:
        print_failure("Failed to get user chats")
        return False
    
    # Verify the chat appears in both users' chat lists
    user1_has_chat = any(c["id"] == chat_id for c in user1_chats)
    user2_has_chat = any(c["id"] == chat_id for c in user2_chats)
    
    if not user1_has_chat or not user2_has_chat:
        print_failure("Chat not found in users' chat lists")
        return False
    
    # Step 5: Get messages for the chat
    messages = test_get_chat_messages(user1, chat_id)
    
    if not messages:
        print_failure("Failed to get chat messages")
        return False
    
    # Verify all messages are present
    if len(messages) < len(user1_messages) + len(user2_messages):
        print_failure(f"Not all messages were retrieved. Expected at least {len(user1_messages) + len(user2_messages)}, got {len(messages)}")
        return False
    
    # Step 6: Test chat search
    search_results = test_search_chats(user1, user2["username"][:5])
    
    # Step 7: Test user search
    user_search_results = test_search_users(user1, user2["wallet_address"][:10])
    
    # Step 8: Test getting user profile
    profile = test_get_user_profile(user1, user2["user_id"])
    if not profile:
        print_failure("Failed to get user profile")
        return False
    
    # Step 9: Test updating profile
    updated_profile = test_update_profile(user1)
    if not updated_profile:
        print_failure("Failed to update user profile")
        return False
    
    print_success("Chat scenario completed successfully!")
    return True

def test_user_search_scenario():
    """Test the user search functionality"""
    print_test_header("SCENARIO: User Search")
    
    # Login a test user
    user = login_test_user(TEST_WALLETS["BSC"], "BSC")
    if not user:
        print_failure("Failed to login test user")
        return False
    
    # Test searching by username
    username_results = test_search_users(user, "user_")
    if username_results is None:
        print_failure("Username search failed")
        return False
    
    # Test searching by wallet address
    wallet_results = test_search_users(user, TEST_WALLETS_2["BSC"]["address"][:10])
    if wallet_results is None:
        print_failure("Wallet address search failed")
        return False
    
    # Test getting user profile
    if len(username_results) > 0:
        profile = test_get_user_profile(user, username_results[0]["id"])
        if not profile:
            print_failure("Failed to get user profile")
            return False
        print_success(f"Successfully retrieved user profile for {profile['username']}")
    
    # Test updating profile
    updated_profile = test_update_profile(user)
    if not updated_profile:
        print_failure("Failed to update user profile")
        return False
    
    # Test getting all users
    all_users = test_get_all_users(user)
    if all_users is None:
        print_failure("Failed to get all users")
        return False
    
    print_success("User search scenario completed successfully!")
    return True

def test_get_all_users(user_data, page=1, limit=10):
    """Test getting all users"""
    print_test_header(f"Get All Users (Page: {page}, Limit: {limit})")
    
    headers = {"Authorization": f"Bearer {user_data['token']}"}
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/users/?page={page}&limit={limit}",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if isinstance(data, list):
                print_success(f"Successfully retrieved {len(data)} users")
                return data
            else:
                print_failure(f"Expected list of users, got: {data}")
                return None
        else:
            print_failure(f"Get all users failed with status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_failure(f"Error getting all users: {str(e)}")
        return None

def test_authorization_scenario():
    """Test authorization requirements"""
    print_test_header("SCENARIO: Authorization Requirements")
    
    # Test that endpoints require authorization
    auth_test = test_unauthorized_access()
    if not auth_test:
        print_failure("Authorization test failed")
        return False
    
    # Login a test user
    user = login_test_user(TEST_WALLETS["BSC"], "BSC")
    if not user:
        print_failure("Failed to login test user")
        return False
    
    # Test with invalid token
    invalid_token = user["token"] + "invalid"
    headers = {"Authorization": f"Bearer {invalid_token}"}
    
    try:
        response = requests.get(f"{BACKEND_URL}/chats", headers=headers)
        
        if response.status_code == 401:
            print_success("Invalid token correctly rejected")
        else:
            print_failure(f"Invalid token not rejected (status: {response.status_code})")
            return False
    except Exception as e:
        print_failure(f"Error testing invalid token: {str(e)}")
        return False
    
    print_success("Authorization scenario completed successfully!")
    return True

def run_all_tests():
    print(f"\n{Colors.BOLD}======= EMI Backend API Tests ======={Colors.ENDC}")
    print(f"Testing against: {BACKEND_URL}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    results = {}
    
    # Basic API tests
    results["API Root"] = test_api_root()
    results["Status Endpoints"] = test_status_endpoints()
    
    # Authentication tests
    message_data = test_generate_message(TEST_WALLETS["BSC"]["address"], "BSC")
    results["Generate Message"] = message_data is not None
    
    if message_data:
        results["Invalid Signature"] = test_login_with_invalid_signature(message_data)
    else:
        results["Invalid Signature"] = False
    
    results["Message Validation"] = test_message_validation()
    results["Network Support"] = test_network_support()
    
    # Scenario tests
    results["Authorization Scenario"] = test_authorization_scenario()
    results["Chat Scenario"] = test_chat_scenario()
    results["User Search Scenario"] = test_user_search_scenario()
    
    # Print summary
    print("\n" + "=" * 50)
    print(f"{Colors.BOLD}Test Results Summary:{Colors.ENDC}")
    
    all_passed = True
    for test_name, passed in results.items():
        if passed:
            print(f"{Colors.OKGREEN}✓ {test_name}: PASSED{Colors.ENDC}")
        else:
            print(f"{Colors.FAIL}✗ {test_name}: FAILED{Colors.ENDC}")
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print(f"{Colors.OKGREEN}{Colors.BOLD}All tests PASSED!{Colors.ENDC}")
    else:
        print(f"{Colors.FAIL}{Colors.BOLD}Some tests FAILED!{Colors.ENDC}")
    
    return all_passed

if __name__ == "__main__":
    run_all_tests()
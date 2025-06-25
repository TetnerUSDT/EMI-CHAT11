#!/usr/bin/env python3
import requests
import json
import time
import os
from datetime import datetime
from eth_account import Account
from eth_account.messages import encode_defunct

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://38411567-d132-46ad-9aef-252881cf0bb3.preview.emergentagent.com/api"

# Test wallet addresses and private keys for different networks
# WARNING: These are test keys only, never use in production
TEST_WALLETS = {
    "BSC": {
        "address": "0x5b63CA776B36A26D10D172982e5a5bfB0397d87C",
        "private_key": "0xb00fa8268f44ca3bc70d39628b3fae846fcacb02855710c1b7117ef3d4695b84"
    },
    "ETHEREUM": {
        "address": "0x5b63CA776B36A26D10D172982e5a5bfB0397d87C",
        "private_key": "0xb00fa8268f44ca3bc70d39628b3fae846fcacb02855710c1b7117ef3d4695b84"
    }
}

# Second set of test wallets for creating chats between users
TEST_WALLETS_2 = {
    "BSC": {
        "address": "0x1133E18F095569F123c9E08c3A06Da4003032162",
        "private_key": "0x212240ec5cf7254bc5b785a09617e0c11c3ca8f8ea6110e6870adf4ac35065cc"
    },
    "ETHEREUM": {
        "address": "0x1133E18F095569F123c9E08c3A06Da4003032162",
        "private_key": "0x212240ec5cf7254bc5b785a09617e0c11c3ca8f8ea6110e6870adf4ac35065cc"
    }
}

# Third set of test wallets for additional users
TEST_WALLETS_3 = {
    "BSC": {
        "address": "0x330C3c1A0161dD3A8245649BEbC6f982925596dC",
        "private_key": "0x4cbcd38538c12db8a269291627aedbb49af925f9104d65648c83d68002e2878c"
    },
    "ETHEREUM": {
        "address": "0x330C3c1A0161dD3A8245649BEbC6f982925596dC",
        "private_key": "0x4cbcd38538c12db8a269291627aedbb49af925f9104d65648c83d68002e2878c"
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
                print_info(f"Token: {data['access_token'][:10]}...")
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

def test_create_public_channel(user_data):
    """Test creating a public channel"""
    print_test_header("Create Public Channel")
    
    headers = {"Authorization": f"Bearer {user_data['token']}"}
    print_info(f"Using auth header: {headers}")
    
    channel_data = {
        "name": "Tech News",
        "chat_type": "channel",
        "description": "Latest technology news and updates",
        "is_public": True,
        "channel_username": "tech_news"
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/chats",
            json=channel_data,
            headers=headers
        )
        
        print_info(f"Response status: {response.status_code}")
        print_info(f"Response body: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["id", "chat_type", "name", "description", "is_public", "channel_username"]
            
            if all(field in data for field in required_fields):
                print_success(f"Successfully created public channel")
                
                # Verify channel properties
                if (data["chat_type"] == "channel" and 
                    data["name"] == channel_data["name"] and
                    data["description"] == channel_data["description"] and
                    data["is_public"] == channel_data["is_public"] and
                    data["channel_username"] == channel_data["channel_username"]):
                    print_success(f"Channel properties are correct")
                else:
                    print_failure(f"Channel properties are incorrect: {data}")
                    return None
                
                return data
            else:
                print_failure(f"Response missing required fields: {data}")
                return None
        else:
            print_failure(f"Create channel failed with status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_failure(f"Error creating channel: {str(e)}")
        return None

def test_create_private_channel(user_data):
    """Test creating a private channel"""
    print_test_header("Create Private Channel")
    
    headers = {"Authorization": f"Bearer {user_data['token']}"}
    
    channel_data = {
        "name": "Private Updates",
        "chat_type": "channel",
        "description": "Private channel for updates",
        "is_public": False
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/chats",
            json=channel_data,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["id", "chat_type", "name", "description", "is_public"]
            
            if all(field in data for field in required_fields):
                print_success(f"Successfully created private channel")
                
                # Verify channel properties
                if (data["chat_type"] == "channel" and 
                    data["name"] == channel_data["name"] and
                    data["description"] == channel_data["description"] and
                    data["is_public"] == channel_data["is_public"]):
                    print_success(f"Channel properties are correct")
                else:
                    print_failure(f"Channel properties are incorrect: {data}")
                    return None
                
                return data
            else:
                print_failure(f"Response missing required fields: {data}")
                return None
        else:
            print_failure(f"Create channel failed with status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_failure(f"Error creating channel: {str(e)}")
        return None

def test_search_public_channels(user_data, search_term):
    """Test searching for public channels"""
    print_test_header(f"Search Public Channels (Query: {search_term})")
    
    headers = {"Authorization": f"Bearer {user_data['token']}"}
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/chats/search?query={search_term}&chat_type=channel",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if isinstance(data, list):
                print_success(f"Successfully searched channels, found {len(data)} results")
                
                # Verify only public channels are returned
                all_public = all(chat.get("is_public", False) for chat in data)
                if all_public:
                    print_success("All returned channels are public")
                else:
                    print_failure("Some non-public channels were returned in search results")
                
                return data
            else:
                print_failure(f"Expected list of channels, got: {data}")
                return None
        else:
            print_failure(f"Search channels failed with status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_failure(f"Error searching channels: {str(e)}")
        return None

def test_subscribe_to_channel(user_data, channel_id):
    """Test subscribing to a channel"""
    print_test_header(f"Subscribe to Channel")
    
    headers = {"Authorization": f"Bearer {user_data['token']}"}
    
    # First, get the current channel data
    try:
        response = requests.get(
            f"{BACKEND_URL}/chats",
            headers=headers
        )
        
        if response.status_code != 200:
            print_failure(f"Failed to get channel data before subscribing: {response.status_code}")
            return False
            
        channels = response.json()
        channel_before = next((c for c in channels if c["id"] == channel_id), None)
        
        if not channel_before:
            print_failure(f"Channel {channel_id} not found before subscribing")
            return False
            
        subscriber_count_before = channel_before.get("subscriber_count", 0)
        participants_before = channel_before.get("participants", [])
        
        # Now subscribe to the channel
        response = requests.post(
            f"{BACKEND_URL}/chats/{channel_id}/subscribe",
            headers=headers
        )
        
        if response.status_code == 200:
            print_success(f"Successfully subscribed to channel")
            
            # Get updated channel data
            response = requests.get(
                f"{BACKEND_URL}/chats",
                headers=headers
            )
            
            if response.status_code != 200:
                print_failure(f"Failed to get channel data after subscribing: {response.status_code}")
                return False
                
            channels = response.json()
            channel_after = next((c for c in channels if c["id"] == channel_id), None)
            
            if not channel_after:
                print_failure(f"Channel {channel_id} not found after subscribing")
                return False
                
            subscriber_count_after = channel_after.get("subscriber_count", 0)
            participants_after = channel_after.get("participants", [])
            
            # Verify subscriber count increased
            if subscriber_count_after > subscriber_count_before:
                print_success(f"Subscriber count increased from {subscriber_count_before} to {subscriber_count_after}")
            else:
                print_failure(f"Subscriber count did not increase: {subscriber_count_before} -> {subscriber_count_after}")
                return False
                
            # Verify user was added to participants
            if user_data["user_id"] in participants_after and user_data["user_id"] not in participants_before:
                print_success(f"User was added to participants")
            else:
                print_failure(f"User was not added to participants")
                return False
                
            return True
        else:
            print_failure(f"Subscribe to channel failed with status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_failure(f"Error subscribing to channel: {str(e)}")
        return False

def test_create_group(user_data, other_users):
    """Test creating a regular group"""
    print_test_header("Create Regular Group")
    
    headers = {"Authorization": f"Bearer {user_data['token']}"}
    
    group_data = {
        "name": "Dev Team",
        "chat_type": "group",
        "description": "Development team discussions",
        "participants": [user["user_id"] for user in other_users]
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/chats",
            json=group_data,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["id", "chat_type", "name", "description", "participants"]
            
            if all(field in data for field in required_fields):
                print_success(f"Successfully created group")
                
                # Verify group properties
                if (data["chat_type"] == "group" and 
                    data["name"] == group_data["name"] and
                    data["description"] == group_data["description"]):
                    print_success(f"Group properties are correct")
                else:
                    print_failure(f"Group properties are incorrect: {data}")
                    return None
                
                # Verify all participants are included
                all_participants_included = all(user["user_id"] in data["participants"] for user in other_users)
                if all_participants_included and user_data["user_id"] in data["participants"]:
                    print_success(f"All participants are included in the group")
                else:
                    print_failure(f"Not all participants are included in the group")
                    return None
                
                return data
            else:
                print_failure(f"Response missing required fields: {data}")
                return None
        else:
            print_failure(f"Create group failed with status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_failure(f"Error creating group: {str(e)}")
        return None

def test_create_secret_group(user_data, other_users):
    """Test creating a secret group"""
    print_test_header("Create Secret Group")
    
    headers = {"Authorization": f"Bearer {user_data['token']}"}
    
    group_data = {
        "name": "Secret Project",
        "chat_type": "secret",
        "is_secret": True,
        "secret_timer": 300,
        "participants": [user["user_id"] for user in other_users]
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/chats",
            json=group_data,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["id", "chat_type", "name", "participants", "is_secret", "secret_timer"]
            
            if all(field in data for field in required_fields):
                print_success(f"Successfully created secret group")
                
                # Verify group properties
                if (data["chat_type"] == "secret" and 
                    data["name"] == group_data["name"] and
                    data["is_secret"] == group_data["is_secret"] and
                    data["secret_timer"] == group_data["secret_timer"]):
                    print_success(f"Secret group properties are correct")
                else:
                    print_failure(f"Secret group properties are incorrect: {data}")
                    return None
                
                # Verify all participants are included
                all_participants_included = all(user["user_id"] in data["participants"] for user in other_users)
                if all_participants_included and user_data["user_id"] in data["participants"]:
                    print_success(f"All participants are included in the secret group")
                else:
                    print_failure(f"Not all participants are included in the secret group")
                    return None
                
                return data
            else:
                print_failure(f"Response missing required fields: {data}")
                return None
        else:
            print_failure(f"Create secret group failed with status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_failure(f"Error creating secret group: {str(e)}")
        return None

def test_get_chats_by_type(user_data, chat_type=None):
    """Test getting chats filtered by type"""
    print_test_header(f"Get Chats by Type: {chat_type if chat_type else 'All'}")
    
    headers = {"Authorization": f"Bearer {user_data['token']}"}
    
    try:
        url = f"{BACKEND_URL}/chats"
        if chat_type:
            url += f"?chat_type={chat_type}"
            
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            
            if isinstance(data, list):
                print_success(f"Successfully retrieved {len(data)} chats")
                
                # Verify chat types
                if chat_type:
                    all_correct_type = all(chat["chat_type"] == chat_type for chat in data)
                    if all_correct_type:
                        print_success(f"All chats are of type '{chat_type}'")
                    else:
                        print_failure(f"Some chats are not of type '{chat_type}'")
                        return None
                
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

def test_channel_username_uniqueness(user_data, username):
    """Test that channel usernames must be unique"""
    print_test_header(f"Test Channel Username Uniqueness")
    
    headers = {"Authorization": f"Bearer {user_data['token']}"}
    
    # Create first channel with the username
    channel_data = {
        "name": "First Channel",
        "chat_type": "channel",
        "description": "First channel with this username",
        "is_public": True,
        "channel_username": username
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/chats",
            json=channel_data,
            headers=headers
        )
        
        if response.status_code != 200:
            print_failure(f"Failed to create first channel: {response.status_code}")
            return False
            
        print_success(f"Successfully created first channel with username '{username}'")
        
        # Try to create second channel with the same username
        channel_data = {
            "name": "Second Channel",
            "chat_type": "channel",
            "description": "Second channel with same username",
            "is_public": True,
            "channel_username": username
        }
        
        response = requests.post(
            f"{BACKEND_URL}/chats",
            json=channel_data,
            headers=headers
        )
        
        if response.status_code == 400:
            print_success(f"Correctly rejected duplicate channel username")
            return True
        else:
            print_failure(f"Failed to reject duplicate channel username: {response.status_code}")
            return False
    except Exception as e:
        print_failure(f"Error testing channel username uniqueness: {str(e)}")
        return False

def test_channel_and_group_scenario():
    """Test the complete channel and group scenarios"""
    print_test_header("SCENARIO: Channel and Group Testing")
    
    # Step 1: Login three test users
    user1 = login_test_user(TEST_WALLETS["BSC"], "BSC", 1)
    if not user1:
        print_failure("Failed to login first test user")
        return False
    
    user2 = login_test_user(TEST_WALLETS_2["BSC"], "BSC", 2)
    if not user2:
        print_failure("Failed to login second test user")
        return False
        
    user3 = login_test_user(TEST_WALLETS_3["BSC"], "BSC", 3)
    if not user3:
        print_failure("Failed to login third test user")
        return False
    
    # Step 2: Test creating a public channel
    public_channel = test_create_public_channel(user1)
    if not public_channel:
        print_failure("Failed to create public channel")
        return False
        
    # Step 3: Test creating a private channel
    private_channel = test_create_private_channel(user1)
    if not private_channel:
        print_failure("Failed to create private channel")
        return False
        
    # Step 4: Test searching for public channels
    search_results = test_search_public_channels(user2, "tech")
    if search_results is None:
        print_failure("Failed to search for public channels")
        return False
        
    # Verify only public channels are in search results
    found_public_channel = any(c["id"] == public_channel["id"] for c in search_results)
    found_private_channel = any(c["id"] == private_channel["id"] for c in search_results)
    
    if found_public_channel and not found_private_channel:
        print_success("Search correctly returned only public channels")
    else:
        print_failure("Search results are incorrect")
        return False
        
    # Step 5: Test subscribing to a channel
    subscription_result = test_subscribe_to_channel(user2, public_channel["id"])
    if not subscription_result:
        print_failure("Failed to subscribe to channel")
        return False
        
    # Step 6: Test creating a regular group
    group = test_create_group(user1, [user2, user3])
    if not group:
        print_failure("Failed to create regular group")
        return False
        
    # Step 7: Test creating a secret group
    secret_group = test_create_secret_group(user1, [user2, user3])
    if not secret_group:
        print_failure("Failed to create secret group")
        return False
        
    # Step 8: Test getting chats by type
    channels = test_get_chats_by_type(user1, "channel")
    if channels is None:
        print_failure("Failed to get channels")
        return False
        
    groups = test_get_chats_by_type(user1, "group")
    if groups is None:
        print_failure("Failed to get groups")
        return False
        
    secret_chats = test_get_chats_by_type(user1, "secret")
    if secret_chats is None:
        print_failure("Failed to get secret chats")
        return False
        
    all_chats = test_get_chats_by_type(user1)
    if all_chats is None:
        print_failure("Failed to get all chats")
        return False
        
    # Verify counts
    if len(channels) >= 2 and len(groups) >= 1 and len(secret_chats) >= 1:
        print_success("Retrieved correct number of chats by type")
    else:
        print_failure(f"Incorrect chat counts: channels={len(channels)}, groups={len(groups)}, secret={len(secret_chats)}")
        return False
        
    # Step 9: Test channel username uniqueness
    username_uniqueness = test_channel_username_uniqueness(user1, f"unique_channel_{int(time.time())}")
    if not username_uniqueness:
        print_failure("Failed channel username uniqueness test")
        return False
    
    print_success("Channel and group scenarios completed successfully!")
    return True

def run_all_tests():
    print(f"\n{Colors.BOLD}======= EMI Backend API Tests ======={Colors.ENDC}")
    print(f"Testing against: {BACKEND_URL}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    results = {}
    
    # Channel and group tests
    results["Channel and Group Scenario"] = test_channel_and_group_scenario()
    
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
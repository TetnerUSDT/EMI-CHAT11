from eth_account import Account
import secrets

# Generate a random private key
def generate_account():
    private_key = "0x" + secrets.token_hex(32)
    account = Account.from_key(private_key)
    return {
        "address": account.address,
        "private_key": private_key
    }

# Generate 3 accounts
for i in range(3):
    account = generate_account()
    print(f"Account {i+1}:")
    print(f"  Address: {account['address']}")
    print(f"  Private Key: {account['private_key']}")
    print()
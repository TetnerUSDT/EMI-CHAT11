import hashlib
import json
import time
from typing import Tuple, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class Web3Auth:
    """Web3 authentication utilities for BSC, TRON, TON networks"""
    
    MESSAGE_EXPIRY_MINUTES = 10
    
    @staticmethod
    def generate_auth_message(wallet_address: str) -> Tuple[str, int]:
        """Generate authentication message for wallet signature"""
        timestamp = int(time.time())
        nonce = hashlib.sha256(f"{wallet_address}{timestamp}".encode()).hexdigest()[:8]
        
        message = (
            f"Welcome to EMI!\n\n"
            f"Please sign this message to authenticate.\n\n"
            f"Wallet: {wallet_address}\n"
            f"Nonce: {nonce}\n"
            f"Timestamp: {timestamp}\n\n"
            f"This request will expire in {Web3Auth.MESSAGE_EXPIRY_MINUTES} minutes."
        )
        
        return message, timestamp
    
    @staticmethod
    def is_message_valid(message: str) -> bool:
        """Check if authentication message is still valid"""
        try:
            # Extract timestamp from message
            lines = message.split('\n')
            timestamp_line = next((line for line in lines if line.startswith('Timestamp:')), None)
            
            if not timestamp_line:
                return False
            
            timestamp = int(timestamp_line.split(': ')[1])
            current_time = int(time.time())
            
            # Check if message is not expired
            expiry_seconds = Web3Auth.MESSAGE_EXPIRY_MINUTES * 60
            return (current_time - timestamp) <= expiry_seconds
            
        except (ValueError, IndexError, StopIteration):
            logger.error("Failed to parse message timestamp")
            return False
    
    @staticmethod
    def verify_signature(message: str, signature: str, wallet_address: str, network: str) -> bool:
        """
        Verify wallet signature for different networks
        
        Note: This is a simplified implementation. In production, you should use
        proper Web3 libraries for each network:
        - BSC/Ethereum: web3.py with eth_account
        - TRON: tronpy
        - TON: pytoniq or similar
        """
        try:
            if not message or not signature or not wallet_address:
                return False
            
            # Basic validation
            if len(signature) < 100:  # Signatures should be longer
                return False
            
            # Network-specific validation
            if network.upper() == "BSC":
                return Web3Auth._verify_bsc_signature(message, signature, wallet_address)
            elif network.upper() == "TRON":
                return Web3Auth._verify_tron_signature(message, signature, wallet_address)
            elif network.upper() == "TON":
                return Web3Auth._verify_ton_signature(message, signature, wallet_address)
            else:
                logger.error(f"Unsupported network: {network}")
                return False
                
        except Exception as e:
            logger.error(f"Signature verification failed: {e}")
            return False
    
    @staticmethod
    def _verify_bsc_signature(message: str, signature: str, wallet_address: str) -> bool:
        """
        Verify BSC (Binance Smart Chain) signature
        
        In production, implement with:
        from eth_account.messages import encode_defunct
        from eth_account import Account
        
        message_encoded = encode_defunct(text=message)
        recovered_address = Account.recover_message(message_encoded, signature=signature)
        return recovered_address.lower() == wallet_address.lower()
        """
        # Simplified validation for now
        if not wallet_address.startswith('0x') or len(wallet_address) != 42:
            return False
        
        # Basic signature format check
        if not signature.startswith('0x') or len(signature) != 132:
            return False
            
        # For now, return True if basic format is correct
        # TODO: Implement proper signature verification with web3.py
        return True
    
    @staticmethod
    def _verify_tron_signature(message: str, signature: str, wallet_address: str) -> bool:
        """
        Verify TRON signature
        
        In production, implement with tronpy:
        from tronpy import Tron
        from tronpy.keys import PrivateKey
        """
        # TRON addresses start with 'T' and are 34 characters
        if not wallet_address.startswith('T') or len(wallet_address) != 34:
            return False
        
        # Basic signature format check
        if len(signature) < 100:
            return False
            
        # For now, return True if basic format is correct
        # TODO: Implement proper TRON signature verification
        return True
    
    @staticmethod
    def _verify_ton_signature(message: str, signature: str, wallet_address: str) -> bool:
        """
        Verify TON signature
        
        In production, implement with TON libraries
        """
        # TON addresses start with 'EQ' or 'UQ' and are base64 encoded
        if not (wallet_address.startswith('EQ') or wallet_address.startswith('UQ')):
            return False
        
        if len(wallet_address) < 40:
            return False
        
        # Basic signature format check
        if len(signature) < 100:
            return False
            
        # For now, return True if basic format is correct
        # TODO: Implement proper TON signature verification
        return True
    
    @staticmethod
    def extract_wallet_from_message(message: str) -> Optional[str]:
        """Extract wallet address from authentication message"""
        try:
            lines = message.split('\n')
            wallet_line = next((line for line in lines if line.startswith('Wallet:')), None)
            
            if wallet_line:
                return wallet_line.split(': ')[1]
            return None
            
        except (IndexError, StopIteration):
            return None
# app/utils/claim_utils.py
"""
Utilities for generating unique claim IDs and QR codes
"""
import random
import string
import qrcode
import io
import base64
from typing import Tuple, Optional
from app.core.config import settings

def generate_unique_claim_id() -> str:
    """
    Generate a unique 8-character alphanumeric claim ID
    Format: AB12CD34 (alternating letters and numbers for better readability)
    """
    letters = string.ascii_uppercase
    digits = string.digits
    
    # Pattern: Letter-Letter-Digit-Digit-Letter-Letter-Digit-Digit
    claim_id = (
        random.choice(letters) + 
        random.choice(letters) + 
        random.choice(digits) + 
        random.choice(digits) + 
        random.choice(letters) + 
        random.choice(letters) + 
        random.choice(digits) + 
        random.choice(digits)
    )
    
    return claim_id

def generate_verification_url(claim_id: str, base_url: Optional[str] = None) -> str:
    """
    Generate the verification URL for a claim
    """
    if not base_url:
        # Use your API base URL - you'll need to update this
        base_url = getattr(settings, 'frontend_url', 'https://yourapp.com')
    
    return f"{base_url}/verify/claim/{claim_id}"

def generate_qr_code(claim_id: str, base_url: Optional[str] = None) -> Tuple[str, str]:
    """
    Generate QR code for a claim ID
    
    Returns:
        Tuple of (qr_code_data_url, verification_url)
    """
    # Generate the verification URL
    verification_url = generate_verification_url(claim_id, base_url)
    
    # Create QR code
    qr = qrcode.QRCode(
        version=1,  # Size of QR code (1 is smallest)
        error_correction=qrcode.constants.ERROR_CORRECT_M,  # Medium error correction
        box_size=10,  # Size of each box in pixels
        border=4,  # Border size
    )
    
    qr.add_data(verification_url)
    qr.make(fit=True)
    
    # Create image
    qr_image = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64 for easy storage/transmission
    buffer = io.BytesIO()
    qr_image.save(buffer, format='PNG')
    buffer.seek(0)
    
    # Create data URL for direct embedding in HTML
    qr_data_url = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode()}"
    
    return qr_data_url, verification_url

def verify_claim_id_format(claim_id: str) -> bool:
    """
    Verify that a claim ID matches the expected format
    """
    if not claim_id or len(claim_id) != 8:
        return False
    
    # Check pattern: Letter-Letter-Digit-Digit-Letter-Letter-Digit-Digit
    pattern_checks = [
        claim_id[0].isalpha() and claim_id[0].isupper(),  # First letter
        claim_id[1].isalpha() and claim_id[1].isupper(),  # Second letter
        claim_id[2].isdigit(),  # First digit
        claim_id[3].isdigit(),  # Second digit
        claim_id[4].isalpha() and claim_id[4].isupper(),  # Third letter
        claim_id[5].isalpha() and claim_id[5].isupper(),  # Fourth letter
        claim_id[6].isdigit(),  # Third digit
        claim_id[7].isdigit(),  # Fourth digit
    ]
    
    return all(pattern_checks)

def ensure_unique_claim_id(supabase_client, max_attempts: int = 10) -> str:
    """
    Generate a unique claim ID that doesn't already exist in the database
    """
    for _ in range(max_attempts):
        claim_id = generate_unique_claim_id()
        
        # Check if this ID already exists
        existing = supabase_client.table("claimed_offers").select("id").eq("unique_claim_id", claim_id).execute()
        
        if not existing.data:
            return claim_id
    
    # If we get here, we've failed to generate a unique ID
    raise Exception("Failed to generate unique claim ID after maximum attempts")

def get_claim_display_info(claim_type: str, unique_claim_id: str, qr_code_url: str) -> dict:
    """
    Get display information for a claim based on its type
    """
    base_info = {
        "claim_id": unique_claim_id,
        "claim_type": claim_type
    }
    
    if claim_type == "in_store":
        base_info.update({
            "qr_code": qr_code_url,
            "verification_url": generate_verification_url(unique_claim_id),
            "instructions": "Show this QR code or claim ID to the merchant for redemption",
            "manual_entry_text": f"If QR code doesn't work, provide this ID: {unique_claim_id}"
        })
    elif claim_type == "online":
        base_info.update({
            "instructions": "You will be redirected to the merchant's website to complete your purchase"
        })
    
    return base_info

# Example usage and testing
if __name__ == "__main__":
    # Test the functions
    print("Testing claim utilities...")
    
    # Generate a claim ID
    claim_id = generate_unique_claim_id()
    print(f"Generated claim ID: {claim_id}")
    
    # Verify format
    is_valid = verify_claim_id_format(claim_id)
    print(f"Claim ID format valid: {is_valid}")
    
    # Generate QR code
    qr_data_url, verification_url = generate_qr_code(claim_id)
    print(f"Verification URL: {verification_url}")
    print(f"QR code data URL length: {len(qr_data_url)} characters")
    
    # Test invalid formats
    invalid_ids = ["abc12345", "ABCD1234", "AB12CD3", "ab12cd34"]
    for invalid_id in invalid_ids:
        print(f"'{invalid_id}' is valid: {verify_claim_id_format(invalid_id)}")
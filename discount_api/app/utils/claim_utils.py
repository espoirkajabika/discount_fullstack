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



# Create this file: discount_api/app/utils/claim_utils.py

import base64
import io
import secrets
import string
from typing import Tuple, Dict, Any
from datetime import datetime


def ensure_unique_claim_id(supabase_client, max_attempts: int = 10) -> str:
    """Generate a unique claim ID that doesn't exist in the database"""
    
    for attempt in range(max_attempts):
        # Generate a random claim ID (8 characters: letters and numbers)
        claim_id = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        
        # Check if it already exists
        existing = supabase_client.table("claimed_offers").select("id").eq("unique_claim_id", claim_id).execute()
        
        if not existing.data:
            return claim_id
    
    # If we couldn't generate a unique ID after max_attempts, use timestamp-based fallback
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    random_suffix = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4))
    return f"{timestamp}{random_suffix}"


def generate_qr_code(claim_id: str, base_url: str = "https://your-domain.com") -> Tuple[str, str]:
    """Generate QR code for a claim ID and return data URL and verification URL"""
    
    try:
        import qrcode
        from PIL import Image
        
        # Create verification URL
        verification_url = f"{base_url}/verify/{claim_id}"
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(verification_url)
        qr.make(fit=True)
        
        # Create QR code image
        qr_image = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64 data URL
        buffered = io.BytesIO()
        qr_image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        data_url = f"data:image/png;base64,{img_str}"
        
        return data_url, verification_url
        
    except ImportError:
        # Fallback if QR code libraries aren't available
        print("QR code libraries not available. Install: pip install qrcode[pil]")
        
        # Return a placeholder data URL and verification URL
        verification_url = f"{base_url}/verify/{claim_id}"
        placeholder_data_url = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2YjcyODAiPlFSIENvZGU8L3RleHQ+PC9zdmc+"
        
        return placeholder_data_url, verification_url
    
    except Exception as e:
        print(f"Error generating QR code: {e}")
        
        # Return error placeholder
        verification_url = f"{base_url}/verify/{claim_id}"
        error_data_url = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZlZjJmMiIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiNkYzI2MjYiPkVycm9yIEdlbmVyYXRpbmc8L3RleHQ+PHRleHQgeD0iMTAwIiB5PSIxMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2RjMjYyNiI+UVIgQ29kZTwvdGV4dD48L3N2Zz4="
        
        return error_data_url, verification_url


def get_claim_display_info(claim_type: str, claim_id: str, qr_code_url: str = None) -> Dict[str, Any]:
    """Generate display information for a claim based on its type"""
    
    base_info = {
        "claim_id": claim_id,
        "claim_type": claim_type
    }
    
    if claim_type == "in_store":
        return {
            **base_info,
            "instructions": "Show this QR code or claim ID to the merchant to redeem your offer",
            "qr_code": qr_code_url,
            "verification_url": f"https://your-domain.com/verify/{claim_id}",
            "manual_entry_text": f"Claim ID: {claim_id}",
            "redemption_method": "Show QR code or provide claim ID to merchant",
            "display_priority": "qr_code"  # Show QR code prominently
        }
    
    elif claim_type == "online":
        return {
            **base_info,
            "instructions": "Click the button below to visit the merchant's website and complete your purchase",
            "redemption_method": "Complete purchase on merchant website",
            "display_priority": "redirect_button",  # Show redirect button prominently
            "cta_text": "Complete Purchase"
        }
    
    else:
        # Fallback for unknown claim types
        return {
            **base_info,
            "instructions": "Contact the merchant to redeem this offer",
            "manual_entry_text": f"Claim ID: {claim_id}",
            "redemption_method": "Contact merchant with claim ID",
            "display_priority": "manual_entry"
        }


def parse_qr_code_content(qr_content: str) -> str:
    """Extract claim ID from various QR code content formats"""
    
    qr_content = qr_content.strip()
    
    # Format 1: Full verification URL
    if "/verify/" in qr_content:
        try:
            claim_id = qr_content.split("/verify/")[1].split("?")[0].split("#")[0]
            return claim_id
        except (IndexError, AttributeError):
            pass
    
    # Format 2: URL with claim_id parameter
    if "claim_id=" in qr_content:
        try:
            claim_id = qr_content.split("claim_id=")[1].split("&")[0].split("#")[0]
            return claim_id
        except (IndexError, AttributeError):
            pass
    
    # Format 3: JSON content
    if qr_content.startswith("{") and qr_content.endswith("}"):
        try:
            import json
            qr_data = json.loads(qr_content)
            if "claim_id" in qr_data:
                return qr_data["claim_id"]
            elif "id" in qr_data:
                return qr_data["id"]
        except (json.JSONDecodeError, KeyError):
            pass
    
    # Format 4: Plain claim ID (alphanumeric, 6-20 characters)
    if qr_content.isalnum() and 6 <= len(qr_content) <= 20:
        return qr_content
    
    # Format 5: Remove common URL prefixes and try again
    prefixes_to_remove = [
        "https://",
        "http://",
        "www.",
        "app://",
        "discount://"
    ]
    
    for prefix in prefixes_to_remove:
        if qr_content.startswith(prefix):
            cleaned_content = qr_content[len(prefix):]
            return parse_qr_code_content(cleaned_content)
    
    # If all else fails, return the original content
    # Let the verification endpoint handle the error
    return qr_content


def validate_claim_id_format(claim_id: str) -> bool:
    """Validate that a claim ID has the expected format"""
    
    if not claim_id:
        return False
    
    # Remove whitespace
    claim_id = claim_id.strip()
    
    # Check length (should be 6-20 characters)
    if not (6 <= len(claim_id) <= 20):
        return False
    
    # Check that it only contains alphanumeric characters
    if not claim_id.isalnum():
        return False
    
    return True


def calculate_savings_amount(discount_type: str, discount_value: float, original_price: float = None) -> float:
    """Calculate the actual savings amount for a discount"""
    
    try:
        if discount_type == "percentage" and original_price:
            return original_price * (discount_value / 100)
        elif discount_type == "fixed":
            return discount_value
        else:
            return 0.0
    except (TypeError, ValueError, ZeroDivisionError):
        return 0.0


def format_discount_display(discount_type: str, discount_value: float, original_price: float = None, discounted_price: float = None) -> Dict[str, Any]:
    """Format discount information for display"""
    
    try:
        savings_amount = calculate_savings_amount(discount_type, discount_value, original_price)
        
        if discount_type == "percentage":
            discount_text = f"{discount_value:.0f}% off"
            if original_price and discounted_price:
                price_text = f"${original_price:.2f} → ${discounted_price:.2f}"
            else:
                price_text = f"{discount_value:.0f}% discount"
        
        elif discount_type == "fixed":
            discount_text = f"${discount_value:.2f} off"
            if original_price and discounted_price:
                price_text = f"${original_price:.2f} → ${discounted_price:.2f}"
            else:
                price_text = f"${discount_value:.2f} discount"
        
        else:
            discount_text = "Special offer"
            price_text = "Discount applied"
            savings_amount = 0
        
        return {
            "discount_type": discount_type,
            "discount_value": discount_value,
            "discount_text": discount_text,
            "price_text": price_text,
            "savings_amount": savings_amount,
            "savings_text": f"Save ${savings_amount:.2f}" if savings_amount > 0 else "Special discount"
        }
    
    except (TypeError, ValueError):
        return {
            "discount_type": discount_type or "unknown",
            "discount_value": 0,
            "discount_text": "Special offer",
            "price_text": "Discount applied",
            "savings_amount": 0,
            "savings_text": "Special discount"
        }


def get_claim_status_info(claimed_offer: Dict[str, Any]) -> Dict[str, Any]:
    """Get comprehensive status information for a claim"""
    
    current_time = datetime.now()
    
    try:
        claimed_at = datetime.fromisoformat(claimed_offer["claimed_at"].replace('Z', '+00:00'))
        is_redeemed = claimed_offer.get("is_redeemed", False)
        redeemed_at = None
        
        if is_redeemed and claimed_offer.get("redeemed_at"):
            redeemed_at = datetime.fromisoformat(claimed_offer["redeemed_at"].replace('Z', '+00:00'))
        
        # Calculate time since claimed
        time_since_claim = current_time - claimed_at.replace(tzinfo=None)
        hours_since_claim = time_since_claim.total_seconds() / 3600
        
        if is_redeemed:
            status = "redeemed"
            status_text = "Redeemed"
            status_color = "green"
            action_available = False
            time_until_expiry = None
        else:
            # Check if offer has expired
            offer = claimed_offer.get("offers", {})
            if offer and offer.get("expiry_date"):
                try:
                    expiry_date = datetime.fromisoformat(offer["expiry_date"].replace('Z', '+00:00'))
                    time_until_expiry = expiry_date.replace(tzinfo=None) - current_time
                    hours_until_expiry = time_until_expiry.total_seconds() / 3600
                    
                    if hours_until_expiry <= 0:
                        status = "expired"
                        status_text = "Expired"
                        status_color = "red"
                        action_available = False
                    elif hours_until_expiry <= 24:
                        status = "expiring_soon"
                        status_text = "Expires Soon"
                        status_color = "orange"
                        action_available = True
                    else:
                        status = "active"
                        status_text = "Ready to Redeem"
                        status_color = "blue"
                        action_available = True
                        
                except (ValueError, TypeError):
                    status = "active"
                    status_text = "Ready to Redeem"
                    status_color = "blue"
                    action_available = True
                    time_until_expiry = None
            else:
                status = "active"
                status_text = "Ready to Redeem"
                status_color = "blue"
                action_available = True
                time_until_expiry = None
        
        return {
            "status": status,
            "status_text": status_text,
            "status_color": status_color,
            "action_available": action_available,
            "is_redeemed": is_redeemed,
            "claimed_at": claimed_at.isoformat(),
            "redeemed_at": redeemed_at.isoformat() if redeemed_at else None,
            "hours_since_claim": round(hours_since_claim, 1),
            "time_until_expiry": time_until_expiry.total_seconds() / 3600 if time_until_expiry else None,
            "redemption_notes": claimed_offer.get("redemption_notes")
        }
        
    except Exception as e:
        print(f"Error getting claim status info: {e}")
        return {
            "status": "unknown",
            "status_text": "Status Unknown",
            "status_color": "gray",
            "action_available": False,
            "is_redeemed": claimed_offer.get("is_redeemed", False),
            "error": str(e)
        }


def generate_redemption_receipt_data(claimed_offer: Dict[str, Any], business_info: Dict[str, Any]) -> Dict[str, Any]:
    """Generate data for a redemption receipt/confirmation"""
    
    try:
        offer = claimed_offer.get("offers", {})
        customer = claimed_offer.get("profiles", {})
        
        # Format customer info
        customer_name = f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip()
        if not customer_name:
            customer_name = "Customer"
        
        # Format discount info
        discount_info = format_discount_display(
            offer.get("discount_type"),
            float(offer.get("discount_value", 0)),
            float(offer.get("original_price", 0)) if offer.get("original_price") else None,
            float(offer.get("discounted_price", 0)) if offer.get("discounted_price") else None
        )
        
        # Generate receipt data
        receipt_data = {
            "receipt_id": f"RCP-{claimed_offer.get('unique_claim_id', 'UNKNOWN')}",
            "redemption_date": claimed_offer.get("redeemed_at") or datetime.now().isoformat(),
            "business": {
                "name": business_info.get("business_name", "Business"),
                "address": business_info.get("business_address"),
                "phone": business_info.get("phone_number"),
                "website": business_info.get("business_website")
            },
            "customer": {
                "name": customer_name,
                "email": customer.get("email")
            },
            "offer": {
                "title": offer.get("title", "Special Offer"),
                "description": offer.get("description"),
                "product_name": offer.get("products", {}).get("name") if offer.get("products") else None
            },
            "discount": discount_info,
            "claim": {
                "claim_id": claimed_offer.get("unique_claim_id"),
                "claim_type": claimed_offer.get("claim_type", "in_store"),
                "claimed_at": claimed_offer.get("claimed_at"),
                "redemption_notes": claimed_offer.get("redemption_notes")
            },
            "generated_at": datetime.now().isoformat()
        }
        
        return receipt_data
        
    except Exception as e:
        print(f"Error generating receipt data: {e}")
        return {
            "error": "Failed to generate receipt data",
            "claim_id": claimed_offer.get("unique_claim_id", "UNKNOWN"),
            "generated_at": datetime.now().isoformat()
        }
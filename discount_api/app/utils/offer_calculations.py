# app/utils/offer_calculations.py - Calculation logic for different offer types
from typing import Dict, Any, Optional, Tuple
from decimal import Decimal
import math

class OfferCalculator:
    """Utility class for calculating discounts based on offer type"""
    
    @staticmethod
    def calculate_discount(
        offer_data: Dict[str, Any],
        quantity: int,
        cart_total: Optional[float] = None,
        item_price: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Calculate discount based on offer type
        
        Args:
            offer_data: Dictionary containing offer information
            quantity: Number of items being purchased
            cart_total: Total cart value (for minimum_purchase offers)
            item_price: Price per item (for calculations)
            
        Returns:
            Dictionary with calculation results
        """
        discount_type = offer_data.get('discount_type')
        
        if discount_type == 'percentage':
            return OfferCalculator._calculate_percentage_discount(offer_data, quantity, item_price)
        elif discount_type == 'fixed':
            return OfferCalculator._calculate_fixed_discount(offer_data, quantity, item_price)
        elif discount_type == 'minimum_purchase':
            return OfferCalculator._calculate_minimum_purchase_discount(offer_data, cart_total, quantity)
        elif discount_type == 'quantity_discount':
            return OfferCalculator._calculate_quantity_discount(offer_data, quantity, item_price)
        elif discount_type == 'bogo':
            return OfferCalculator._calculate_bogo_discount(offer_data, quantity, item_price)
        else:
            return {
                'is_valid': False,
                'error_reason': f'Unknown discount type: {discount_type}',
                'discount_amount': 0,
                'final_price': item_price * quantity if item_price else 0,
                'savings_amount': 0,
                'message': 'Invalid offer type'
            }

    @staticmethod
    def _calculate_percentage_discount(offer_data: Dict[str, Any], quantity: int, item_price: Optional[float]) -> Dict[str, Any]:
        """Calculate percentage discount"""
        if not item_price:
            return {
                'is_valid': False,
                'error_reason': 'Item price required for percentage discount',
                'discount_amount': 0,
                'final_price': 0,
                'savings_amount': 0,
                'message': 'Cannot calculate without item price'
            }
        
        discount_percentage = float(offer_data.get('discount_value', 0))
        total_price = item_price * quantity
        discount_amount = total_price * (discount_percentage / 100)
        final_price = total_price - discount_amount
        
        return {
            'is_valid': True,
            'discount_amount': round(discount_amount, 2),
            'final_price': round(final_price, 2),
            'savings_amount': round(discount_amount, 2),
            'message': f'{discount_percentage}% off - Save ${discount_amount:.2f}'
        }

    @staticmethod
    def _calculate_fixed_discount(offer_data: Dict[str, Any], quantity: int, item_price: Optional[float]) -> Dict[str, Any]:
        """Calculate fixed dollar discount"""
        if not item_price:
            return {
                'is_valid': False,
                'error_reason': 'Item price required for fixed discount',
                'discount_amount': 0,
                'final_price': 0,
                'savings_amount': 0,
                'message': 'Cannot calculate without item price'
            }
        
        discount_amount = float(offer_data.get('discount_value', 0))
        total_price = item_price * quantity
        
        # Don't allow discount to exceed total price
        actual_discount = min(discount_amount, total_price)
        final_price = total_price - actual_discount
        
        return {
            'is_valid': True,
            'discount_amount': round(actual_discount, 2),
            'final_price': round(final_price, 2),
            'savings_amount': round(actual_discount, 2),
            'message': f'${actual_discount:.2f} off'
        }

    @staticmethod
    def _calculate_minimum_purchase_discount(offer_data: Dict[str, Any], cart_total: Optional[float], quantity: int) -> Dict[str, Any]:
        """Calculate minimum purchase discount"""
        minimum_purchase = float(offer_data.get('minimum_purchase_amount', 0))
        discount_value = float(offer_data.get('discount_value', 0))
        
        if cart_total is None:
            return {
                'is_valid': False,
                'error_reason': 'Cart total required for minimum purchase discount',
                'discount_amount': 0,
                'final_price': 0,
                'savings_amount': 0,
                'message': 'Cannot calculate without cart total'
            }
        
        if cart_total < minimum_purchase:
            return {
                'is_valid': False,
                'error_reason': f'Minimum purchase of ${minimum_purchase:.2f} required',
                'discount_amount': 0,
                'final_price': cart_total,
                'savings_amount': 0,
                'message': f'Add ${minimum_purchase - cart_total:.2f} more to qualify'
            }
        
        # Don't allow discount to exceed cart total
        actual_discount = min(discount_value, cart_total)
        final_price = cart_total - actual_discount
        
        return {
            'is_valid': True,
            'discount_amount': round(actual_discount, 2),
            'final_price': round(final_price, 2),
            'savings_amount': round(actual_discount, 2),
            'message': f'${actual_discount:.2f} off orders over ${minimum_purchase:.2f}'
        }

    @staticmethod
    def _calculate_quantity_discount(offer_data: Dict[str, Any], quantity: int, item_price: Optional[float]) -> Dict[str, Any]:
        """Calculate quantity-based discount"""
        if not item_price:
            return {
                'is_valid': False,
                'error_reason': 'Item price required for quantity discount',
                'discount_amount': 0,
                'final_price': 0,
                'savings_amount': 0,
                'message': 'Cannot calculate without item price'
            }
        
        minimum_quantity = int(offer_data.get('minimum_quantity', 1))
        discount_percentage = float(offer_data.get('discount_value', 0))
        
        if quantity < minimum_quantity:
            total_price = item_price * quantity
            return {
                'is_valid': False,
                'error_reason': f'Minimum quantity of {minimum_quantity} required',
                'discount_amount': 0,
                'final_price': total_price,
                'savings_amount': 0,
                'message': f'Add {minimum_quantity - quantity} more to qualify for {discount_percentage}% off'
            }
        
        total_price = item_price * quantity
        discount_amount = total_price * (discount_percentage / 100)
        final_price = total_price - discount_amount
        
        return {
            'is_valid': True,
            'discount_amount': round(discount_amount, 2),
            'final_price': round(final_price, 2),
            'savings_amount': round(discount_amount, 2),
            'message': f'Buy {minimum_quantity}+ get {discount_percentage}% off each - Save ${discount_amount:.2f}'
        }

    @staticmethod
    def _calculate_bogo_discount(offer_data: Dict[str, Any], quantity: int, item_price: Optional[float]) -> Dict[str, Any]:
        """Calculate Buy X Get Y discount"""
        if not item_price:
            return {
                'is_valid': False,
                'error_reason': 'Item price required for BOGO discount',
                'discount_amount': 0,
                'final_price': 0,
                'savings_amount': 0,
                'message': 'Cannot calculate without item price'
            }
        
        buy_quantity = int(offer_data.get('buy_quantity', 1))
        get_quantity = int(offer_data.get('get_quantity', 1))
        get_discount_percentage = float(offer_data.get('get_discount_percentage', 100))
        
        if quantity < buy_quantity:
            total_price = item_price * quantity
            return {
                'is_valid': False,
                'error_reason': f'Need to buy {buy_quantity} items to qualify',
                'discount_amount': 0,
                'final_price': total_price,
                'savings_amount': 0,
                'message': f'Add {buy_quantity - quantity} more to get {get_quantity} free'
            }
        
        # Calculate how many complete BOGO sets the customer qualifies for
        bogo_sets = quantity // buy_quantity
        free_items = min(bogo_sets * get_quantity, quantity - (bogo_sets * buy_quantity))
        
        # Calculate discount
        total_price = item_price * quantity
        discount_per_free_item = item_price * (get_discount_percentage / 100)
        total_discount = free_items * discount_per_free_item
        final_price = total_price - total_discount
        
        # Create descriptive message
        if get_discount_percentage == 100:
            message = f'Buy {buy_quantity} Get {get_quantity} Free - Save ${total_discount:.2f}'
        else:
            message = f'Buy {buy_quantity} Get {get_quantity} at {get_discount_percentage}% off - Save ${total_discount:.2f}'
        
        return {
            'is_valid': True,
            'discount_amount': round(total_discount, 2),
            'final_price': round(final_price, 2),
            'savings_amount': round(total_discount, 2),
            'message': message,
            'bogo_details': {
                'bogo_sets': bogo_sets,
                'free_items': free_items,
                'remaining_items': quantity - (bogo_sets * buy_quantity) - free_items
            }
        }

    @staticmethod
    def get_offer_display_text(offer_data: Dict[str, Any]) -> str:
        """Generate human-readable display text for an offer"""
        discount_type = offer_data.get('discount_type')
        
        if discount_type == 'percentage':
            percentage = offer_data.get('discount_value', 0)
            return f"{percentage}% Off"
        
        elif discount_type == 'fixed':
            amount = offer_data.get('discount_value', 0)
            return f"${amount} Off"
        
        elif discount_type == 'minimum_purchase':
            amount = offer_data.get('discount_value', 0)
            minimum = offer_data.get('minimum_purchase_amount', 0)
            return f"${amount} Off Orders Over ${minimum}"
        
        elif discount_type == 'quantity_discount':
            percentage = offer_data.get('discount_value', 0)
            min_qty = offer_data.get('minimum_quantity', 0)
            return f"Buy {min_qty}+ Get {percentage}% Off Each"
        
        elif discount_type == 'bogo':
            buy_qty = offer_data.get('buy_quantity', 1)
            get_qty = offer_data.get('get_quantity', 1)
            discount_pct = offer_data.get('get_discount_percentage', 100)
            
            if discount_pct == 100:
                return f"Buy {buy_qty} Get {get_qty} Free"
            else:
                return f"Buy {buy_qty} Get {get_qty} at {discount_pct}% Off"
        
        return "Special Offer"

    @staticmethod
    def validate_offer_data(offer_data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """Validate offer data for consistency"""
        discount_type = offer_data.get('discount_type')
        
        if discount_type == 'minimum_purchase':
            if not offer_data.get('minimum_purchase_amount'):
                return False, "Minimum purchase amount is required"
        
        elif discount_type == 'quantity_discount':
            if not offer_data.get('minimum_quantity'):
                return False, "Minimum quantity is required"
        
        elif discount_type == 'bogo':
            if not offer_data.get('buy_quantity'):
                return False, "Buy quantity is required"
            if not offer_data.get('get_quantity'):
                return False, "Get quantity is required"
            if offer_data.get('get_discount_percentage') is None:
                return False, "Get discount percentage is required"
        
        return True, None
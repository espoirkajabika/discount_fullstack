// components/offers/OfferCard.js - Updated to use the claim modal
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/SimpleToast";
import { brandColors } from "@/lib/colors";
import { textStyles } from "@/lib/typography";
import api, { endpoints, apiHelpers, claimUtils } from "@/lib/api";
import SimpleClaimModal from "@/components/claims/SimpleClaimModal";

export default function OfferCard({
  offer,
  showSaveButton = false,
  showClaimButton = false,
  urgent = false,
  compact = false,
}) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [offerStatus, setOfferStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [productImage, setProductImage] = useState(null);
  const [showClaimModal, setShowClaimModal] = useState(false);

  // Fetch product image using the working product search endpoint (RESTORED ORIGINAL LOGIC)
  useEffect(() => {
    const fetchProductImage = async () => {
      if (offer.product_id) {
        try {
          // Use the existing product search endpoint that works
          const response = await api.get(
            `/customer/search/products?page=1&size=50`
          );
          const products = response.data.products || [];

          // Find the product with matching ID
          const product = products.find((p) => p.id === offer.product_id);
          if (product?.image_url) {
            let imageUrl = product.image_url;

            // Ensure we have the full URL
            if (!imageUrl.startsWith("http")) {
              imageUrl = `https://lwwhsiaqvkjtlqaxkads.supabase.co/storage/v1/object/public/product-images/${imageUrl}`;
            }
            setProductImage(imageUrl);
          }
        } catch (error) {
          console.error("Error fetching product image:", error);
        }
      }
    };

    fetchProductImage();
  }, [offer.product_id]);

  // Fetch offer status if authenticated (SEPARATE useEffect)
  useEffect(() => {
    const fetchOfferStatus = async () => {
      if (isAuthenticated) {
        const statusResult = await apiHelpers.getOfferStatus(offer.id);
        if (statusResult.success) {
          setOfferStatus(statusResult.data);
          setIsSaved(statusResult.data.is_saved);
        }
      }
    };

    fetchOfferStatus();
  }, [offer.id, isAuthenticated]);

  // Calculate time remaining using utility function
  const getTimeRemaining = () => {
    return claimUtils.getTimeRemaining(offer.expiry_date);
  };

  // Handle save/unsave with enhanced API and toast
  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.warning("Please log in to save offers");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
      return;
    }

    setLoading(true);
    try {
      const result = isSaved 
        ? await apiHelpers.unsaveOffer(offer.id)
        : await apiHelpers.saveOffer(offer.id);

      if (result.success) {
        setIsSaved(!isSaved);
        toast.success(isSaved 
          ? "❤️ Offer removed from favorites" 
          : "❤️ Offer saved to favorites!");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Error saving offer:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle claim button click - now opens modal instead of direct API call
  const handleClaimClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.warning("Please log in to claim offers");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
      return;
    }

    // Check if already claimed
    if (offerStatus?.is_claimed) {
      toast.info("You have already claimed this offer!");
      setTimeout(() => {
        window.location.href = "/claimed-offers";
      }, 1500);
      return;
    }

    // Check if offer is available
    if (!offerStatus?.can_claim) {
      toast.error(offerStatus?.reason || "This offer cannot be claimed");
      return;
    }

    // Open the claim modal
    setShowClaimModal(true);
  };

  // Handle successful claim from modal
  const handleClaimSuccess = (claimData) => {
    // Update local status
    setOfferStatus(prev => ({
      ...prev,
      is_claimed: true,
      can_claim: false,
      reason: "Already claimed"
    }));
  };

  const timeRemaining = getTimeRemaining();
  const isExpired = timeRemaining === "Expired";
  const isSoldOut = offer.max_claims && offer.current_claims >= offer.max_claims;
  const canClaim = offerStatus?.can_claim !== false && !isExpired && !isSoldOut;

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <>
      <div
        style={{
          backgroundColor: brandColors.white,
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: isHovered
            ? "0 6px 20px rgba(0,0,0,0.12)"
            : "0 2px 8px rgba(0,0,0,0.08)",
          transition: "all 0.3s ease",
          transform: isHovered ? "translateY(-2px)" : "translateY(0)",
          cursor: "pointer",
          border: urgent
            ? `2px solid ${brandColors.orange}`
            : `1px solid ${brandColors.gray[200]}`,
          opacity: isExpired || isSoldOut ? 0.7 : 1,
          position: "relative",
          maxWidth: "320px",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => (window.location.href = `/offers/${offer.id}`)}
      >
        {/* Urgent Badge */}
        {urgent && !isExpired && (
          <div
            style={{
              position: "absolute",
              top: "8px",
              left: "8px",
              backgroundColor: brandColors.orange,
              color: brandColors.white,
              padding: "4px 8px",
              borderRadius: "12px",
              fontSize: "10px",
              fontWeight: "600",
              zIndex: 10,
              textTransform: "uppercase",
            }}
          >
            Expiring Soon
          </div>
        )}

        {/* Claimed Badge */}
        {offerStatus?.is_claimed && (
          <div
            style={{
              position: "absolute",
              top: "8px",
              left: urgent ? "100px" : "8px",
              backgroundColor: brandColors.success || '#10B981',
              color: brandColors.white,
              padding: "4px 8px",
              borderRadius: "12px",
              fontSize: "10px",
              fontWeight: "600",
              zIndex: 10,
              textTransform: "uppercase",
            }}
          >
            ✅ Claimed
          </div>
        )}

        {/* Save Button */}
        {showSaveButton && (
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: isSaved ? brandColors.deepRed : brandColors.white,
              color: isSaved ? brandColors.white : brandColors.gray[600],
              border: `1px solid ${brandColors.gray[300]}`,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              zIndex: 10,
              transition: "all 0.2s ease",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "..." : isSaved ? "❤️" : "🤍"}
          </button>
        )}

        {/* Image Background */}
        <div
          style={{
            height: "140px",
            ...(productImage && !imageError
              ? {
                  backgroundImage: `url(${productImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }
              : {
                  backgroundImage: `linear-gradient(135deg, ${brandColors.deepRed} 0%, ${brandColors.orange} 100%)`,
                }),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/* Hidden image to detect load errors */}
          {productImage && (
            <img
              src={productImage}
              onError={handleImageError}
              onLoad={() =>
                console.log("Image loaded successfully:", productImage)
              }
              style={{ display: "none" }}
              alt=""
            />
          )}

          {/* Discount Badge */}
          <div
            style={{
              backgroundColor: brandColors.white,
              color: brandColors.deepRed,
              padding: "6px 12px",
              borderRadius: "16px",
              fontSize: "18px",
              fontWeight: "700",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {`$${offer.discount_value} OFF`}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "16px" }}>
          {/* Business Name */}
          {(offer.businesses || offer.business) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "6px",
                gap: "6px",
              }}
            >
              <span
                style={{
                  ...textStyles.body,
                  fontSize: "12px",
                  color: brandColors.gray[600],
                }}
              >
                {offer.businesses?.business_name || offer.business?.business_name}
              </span>
              {(offer.businesses?.is_verified || offer.business?.is_verified) && (
                <span
                  style={{
                    backgroundColor: brandColors.success || '#10B981',
                    color: brandColors.white,
                    padding: "1px 4px",
                    borderRadius: "6px",
                    fontSize: "9px",
                    fontWeight: "600",
                  }}
                >
                  ✓
                </span>
              )}
            </div>
          )}

          {/* Offer Title */}
          <h3
            style={{
              ...textStyles.h4,
              fontSize: "16px",
              marginBottom: "6px",
              lineHeight: "1.3",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {offer.title}
          </h3>

          {/* Description */}
          {offer.description && (
            <p
              style={{
                ...textStyles.body,
                fontSize: "13px",
                color: brandColors.gray[600],
                marginBottom: "10px",
                lineHeight: "1.3",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {offer.description}
            </p>
          )}

          {/* Price Information */}
          {offer.original_price && offer.discounted_price && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "10px",
              }}
            >
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: brandColors.deepRed,
                }}
              >
                ${offer.discounted_price}
              </span>
              <span
                style={{
                  fontSize: "13px",
                  color: brandColors.gray[500],
                  textDecoration: "line-through",
                }}
              >
                ${offer.original_price}
              </span>
            </div>
          )}

          {/* Status Row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: showClaimButton ? "12px" : "0",
              gap: "8px",
            }}
          >
            {/* Time Remaining */}
            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                color:
                  urgent || timeRemaining.includes("hour")
                    ? brandColors.orange
                    : brandColors.gray[600],
                backgroundColor:
                  urgent || timeRemaining.includes("hour")
                    ? `${brandColors.orange}10`
                    : brandColors.gray[100],
                padding: "3px 6px",
                borderRadius: "10px",
              }}
            >
              {timeRemaining}
            </span>

            {/* Claims Count */}
            {offer.current_claims > 0 && (
              <span
                style={{
                  fontSize: "11px",
                  color: brandColors.gray[500],
                }}
              >
                {offer.current_claims} claimed
              </span>
            )}
          </div>

          {/* Enhanced Claim Button */}
          {showClaimButton && (
            <>
              {offerStatus?.is_claimed ? (
                // Already claimed - show status button
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = "/claimed-offers";
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    backgroundColor: brandColors.success || '#10B981',
                    color: brandColors.white,
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  ✅ Claimed - View Details
                </button>
              ) : canClaim ? (
                // Can claim - show claim button that opens modal
                <button
                  onClick={handleClaimClick}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "10px",
                    backgroundColor: loading
                      ? brandColors.gray[400]
                      : brandColors.deepRed,
                    color: brandColors.white,
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width: "12px",
                        height: "12px",
                        border: "2px solid transparent",
                        borderTop: "2px solid currentColor",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite"
                      }} />
                      Loading...
                    </>
                  ) : isAuthenticated ? (
                    "🎫 Claim Offer"
                  ) : (
                    "🔑 Login to Claim"
                  )}
                </button>
              ) : (
                // Cannot claim - show reason
                <div
                  style={{
                    width: "100%",
                    padding: "10px",
                    backgroundColor: brandColors.gray[100],
                    color: brandColors.gray[600],
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  {isExpired ? "⏰ Offer Expired" : 
                   isSoldOut ? "🚫 Sold Out" : 
                   offerStatus?.reason || "Not Available"}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Claim Selection Modal */}
      <SimpleClaimModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        offer={offer}
        onClaimSuccess={handleClaimSuccess}
      />
    </>
  );
}
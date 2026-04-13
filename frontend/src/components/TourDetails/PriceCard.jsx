import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import InquiryModal from "./InquiryModal";
import { AuthContext } from "../../context/AuthContext";
import { formatPrice } from "../../utils/tourSchema";

const formatCouponCountdown = (expiryTime, now) => {
  if (!expiryTime || expiryTime <= now) {
    return "";
  }

  const totalSeconds = Math.max(Math.floor((expiryTime - now) / 1000), 0);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m left`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s left`;
  }

  return `${seconds}s left`;
};

export default function PriceCard({
  price = 199,
  discounted = 149,
  title = "",
  tourId = "",
  tourCity = "",
  dateRange = "",
  duration = "",
  pricing = null,
  coupon = null,
  coupons = [],
}) {
  const [open, setOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponMessage, setCouponMessage] = useState({
    tone: "",
    text: "",
  });
  const { user } = useContext(AuthContext);
  const [couponApplied, setCouponApplied] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showBreakup, setShowBreakup] = useState(true);
  const [showFeeInfo, setShowFeeInfo] = useState(false);
  const [travelerCount, setTravelerCount] = useState(1);
  const [travelerMode, setTravelerMode] = useState("adult");
  const [selectedCouponCode, setSelectedCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [now, setNow] = useState(Date.now());

  const normalizedUserEmail = String(user?.email || "")
    .trim()
    .toLowerCase();
  const shouldHideSpecialCouponText = normalizedUserEmail.includes("abhay");

  const safeTravelerCount = Math.max(1, travelerCount);
  const isCoupleMode = travelerMode === "couple";
  const billingUnits = isCoupleMode ? 2 : safeTravelerCount;
  const listPricePerPerson = Number(price || 0);
  const offerPricePerPerson = Number(discounted || price || 0);
  const configuredCouplePrice = Math.max(Number(pricing?.couplePrice || 0), 0);
  const configuredCoupleOfferPrice = Math.max(
    Number(pricing?.coupleDiscountedPrice || 0),
    0,
  );
  const hasCustomCouplePricing =
    configuredCouplePrice > 0 || configuredCoupleOfferPrice > 0;
  const coupleListPrice = configuredCouplePrice || listPricePerPerson * 2;
  const coupleOfferPrice =
    configuredCoupleOfferPrice ||
    configuredCouplePrice ||
    offerPricePerPerson * 2;
  const listPrice = isCoupleMode
    ? coupleListPrice
    : listPricePerPerson * safeTravelerCount;
  const offerPrice = isCoupleMode
    ? coupleOfferPrice
    : offerPricePerPerson * safeTravelerCount;

  const pricingConfig = useMemo(() => {
    const tripLabel = isCoupleMode
      ? "1 Couple x 1 Trip"
      : `${safeTravelerCount} Adult${safeTravelerCount > 1 ? "s" : ""} x 1 Trip`;
    const basePriceNote =
      String(
        isCoupleMode ? "Couple traveller price" : pricing?.priceNote,
      ).trim() || "Per person price";
    const hotelGST = Math.max(Number(pricing?.hotelGST || 0), 0) * billingUnits;
    const serviceFee =
      Math.max(Number(pricing?.serviceFee || 0), 0) * billingUnits;

    return {
      priceNote: `${basePriceNote} • ${tripLabel}`,
      hotelGST,
      serviceFee,
      taxesAndFees: hotelGST + serviceFee,
    };
  }, [billingUnits, isCoupleMode, pricing, safeTravelerCount]);

  const discountPercent = useMemo(() => {
    if (!listPrice || offerPrice >= listPrice) {
      return 0;
    }

    return Math.round(((listPrice - offerPrice) / listPrice) * 100);
  }, [listPrice, offerPrice]);

  const allCouponConfigs = useMemo(() => {
    const sourceCoupons =
      Array.isArray(coupons) && coupons.length
        ? coupons
        : coupon
          ? [coupon]
          : [];

    return sourceCoupons
      .map((item, index) => {
        const code = String(item?.code || "")
          .trim()
          .toUpperCase();
        const type =
          String(item?.type || "flat").toLowerCase() === "percent"
            ? "percent"
            : "flat";
        const value = Number(item?.value || 0);
        const description = String(item?.description || "").trim();
        const active = Boolean(item?.active && code && value > 0);
        const expiresAt = String(
          item?.expiresAt || item?.expiryAt || "",
        ).trim();
        const expiryTime = expiresAt ? new Date(expiresAt).getTime() : 0;
        const expired =
          Number.isFinite(expiryTime) && expiryTime > 0
            ? expiryTime <= now
            : false;
        const targetUserUid = String(
          item?.targetUserUid || item?.eligibleUserUid || "",
        ).trim();
        const targetUserLabel = String(
          item?.targetUserLabel || item?.eligibleUserLabel || "",
        ).trim();
        const isEligibleUser =
          !targetUserUid || String(user?.uid || "").trim() === targetUserUid;

        if (
          !code &&
          !description &&
          value <= 0 &&
          !active &&
          !expiresAt &&
          !targetUserUid
        ) {
          return null;
        }

        const discountValue =
          type === "percent"
            ? Math.min(Math.round((offerPrice * value) / 100), offerPrice)
            : Math.min(value, offerPrice);

        return {
          id: `${code || "coupon"}-${index}`,
          code,
          type,
          value,
          description,
          active,
          expiresAt,
          expiryTime,
          expired,
          targetUserUid,
          targetUserLabel,
          isEligibleUser,
          discountValue,
          summary:
            type === "percent" ? `${value}% OFF` : `${formatPrice(value)} OFF`,
          valueLabel:
            type === "percent"
              ? `${value}%`
              : formatPrice(discountValue || value),
          countdownLabel: formatCouponCountdown(expiryTime, now),
        };
      })
      .filter(Boolean);
  }, [coupon, coupons, now, offerPrice, user?.uid]);

  const availableCoupons = useMemo(
    () =>
      allCouponConfigs.filter(
        (item) => item.active && !item.expired && item.isEligibleUser,
      ),
    [allCouponConfigs],
  );

  useEffect(() => {
    if (!allCouponConfigs.some((item) => item.expiryTime)) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [allCouponConfigs]);

  useEffect(() => {
    if (!availableCoupons.length) {
      setSelectedCouponCode("");
      setAppliedCouponCode("");
      setCouponApplied(false);
      return;
    }

    if (!availableCoupons.some((item) => item.code === selectedCouponCode)) {
      setSelectedCouponCode(availableCoupons[0].code);
    }
  }, [availableCoupons, selectedCouponCode]);

  useEffect(() => {
    if (
      couponApplied &&
      appliedCouponCode &&
      !availableCoupons.some((item) => item.code === appliedCouponCode)
    ) {
      setCouponApplied(false);
      setAppliedCouponCode("");
      setCouponMessage({
        tone: "muted",
        text: "The selected coupon expired or is no longer available.",
      });
    }
  }, [appliedCouponCode, availableCoupons, couponApplied]);

  const selectedCoupon =
    availableCoupons.find((item) => item.code === selectedCouponCode) ||
    availableCoupons[0] ||
    null;
  const appliedCoupon = couponApplied
    ? availableCoupons.find((item) => item.code === appliedCouponCode) || null
    : null;
  const bannerCoupon = appliedCoupon || selectedCoupon;
  const propertyDiscount = Math.max(listPrice - offerPrice, 0);
  const promotionDiscount = appliedCoupon?.discountValue || 0;
  const totalPayable = Math.max(
    offerPrice + pricingConfig.taxesAndFees - promotionDiscount,
    0,
  );
  const availableCouponDiscount = appliedCoupon?.discountValue || 0;
  const couponSummary = bannerCoupon?.summary || "";
  const couponEmptyState = useMemo(() => {
    if (!allCouponConfigs.length) {
      return {
        title: "No coupon available",
        text: "The current offer price already reflects the best available deal.",
      };
    }

    if (
      !availableCoupons.length &&
      allCouponConfigs.some((item) => item.targetUserUid) &&
      !user?.uid
    ) {
      return {
        title: "Log in to unlock offers",
        text: "Some coupons are reserved for selected travellers only.",
      };
    }

    if (!availableCoupons.length) {
      return {
        title: "No active coupon right now",
        text: "The existing coupon offers are expired or not eligible for this account.",
      };
    }

    return null;
  }, [allCouponConfigs, availableCoupons, user?.uid]);

  const handleApplyCoupon = () => {
    setShowBreakup(true);

    if (!availableCoupons.length) {
      setCouponApplied(false);
      setAppliedCouponCode("");
      setCouponMessage({
        tone: "muted",
        text:
          couponEmptyState?.text ||
          "No coupon is available for this tour right now.",
      });
      return;
    }

    const enteredCode = String(couponInput || selectedCouponCode || "")
      .trim()
      .toUpperCase();

    if (!enteredCode) {
      setCouponApplied(false);
      setAppliedCouponCode("");
      setCouponMessage({
        tone: "danger",
        text: "Enter a coupon code before paying.",
      });
      return;
    }

    const matchingCoupon = availableCoupons.find(
      (item) => item.code === enteredCode,
    );

    if (!matchingCoupon) {
      setCouponApplied(false);
      setAppliedCouponCode("");
      setCouponMessage({
        tone: "danger",
        text: "That coupon code is invalid for this offer.",
      });
      return;
    }

    setSelectedCouponCode(matchingCoupon.code);
    setAppliedCouponCode(matchingCoupon.code);
    setCouponApplied(true);
    setCouponMessage({
      tone: "success",
      text: `Coupon applied • ${formatPrice(matchingCoupon.discountValue)} discount given.`,
    });
  };

  const handleTravelerDecrease = () => {
    setTravelerCount((prev) => Math.max(1, prev - 1));
  };

  const handleTravelerIncrease = () => {
    setTravelerCount((prev) => Math.min(10, prev + 1));
  };

  const handlePrimaryAction = () => {
    if (!acceptedTerms) {
      setCouponMessage({
        tone: "danger",
        text: "Please accept the Terms & Conditions and Privacy Policy to continue.",
      });
      return;
    }

    setOpen(true);
  };

  return (
    <motion.aside
      className="td-price-card"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {discountPercent || bannerCoupon ? (
        <div className="price-offer-banner">
          <div>
            <p className="offer-banner-label">Offer available</p>
            <strong>
              {bannerCoupon
                ? `Apply ${bannerCoupon.code} before payment`
                : `Save ${discountPercent}% on this tour`}
            </strong>
            <p className="offer-banner-text">
              {bannerCoupon
                ? bannerCoupon.description ||
                  `Use the coupon to unlock ${couponSummary} on the final amount.`
                : "The discounted offer price is already applied for this departure."}
            </p>
            {bannerCoupon?.countdownLabel ? (
              <p className="offer-banner-timer">
                {bannerCoupon.countdownLabel}
              </p>
            ) : null}
          </div>
          <span className="offer-banner-chip">
            {bannerCoupon ? couponSummary : `${discountPercent}% OFF`}
          </span>
        </div>
      ) : null}

      <div className="price-head">
        <div>
          <p className="price-kicker">
            {isCoupleMode ? "Couple Package" : "Starting From"}
          </p>
          {listPrice && offerPrice < listPrice ? (
            <div className="price-old">{formatPrice(listPrice)}</div>
          ) : null}
        </div>
        {discountPercent ? (
          <span className="discount-badge">{discountPercent}% OFF</span>
        ) : null}
      </div>

      <div className="price-new">
        {formatPrice(totalPayable)}
        <span>
          {pricingConfig.taxesAndFees || couponApplied || safeTravelerCount > 1
            ? "Total to Pay"
            : isCoupleMode
              ? "Per Couple"
              : "Per Person"}
        </span>
      </div>

      <div className="price-trust-row" aria-label="Booking benefits">
        <span>
          <i className="ri-shield-check-line"></i>
          Secure booking
        </span>
        <span>
          <i className="ri-customer-service-2-line"></i>
          Quick support
        </span>
        <span>
          <i className="ri-time-line"></i>
          Fast response
        </span>
      </div>

      <div className="traveler-mode-switch" aria-label="Choose traveller type">
        <button
          type="button"
          className={`traveler-mode-btn ${!isCoupleMode ? "active" : ""}`}
          onClick={() => setTravelerMode("adult")}
        >
          Adult
        </button>
        <button
          type="button"
          className={`traveler-mode-btn ${isCoupleMode ? "active" : ""}`}
          onClick={() => setTravelerMode("couple")}
        >
          Couple
        </button>
      </div>

      <div className="traveler-picker" aria-label="Traveller selection">
        <div className="traveler-picker-copy">
          <strong>{isCoupleMode ? "Couple Travellers" : "Adults"}</strong>
          <span>
            {isCoupleMode
              ? hasCustomCouplePricing
                ? "2 travellers together • special couple price"
                : "2 travellers together • auto-calculated from 2 adults"
              : "Aged 18+ • Max 10 travellers"}
          </span>
        </div>

        {isCoupleMode ? (
          <div className="traveler-static-chip">1 Couple</div>
        ) : (
          <div className="traveler-stepper">
            <button
              type="button"
              className="traveler-stepper-btn"
              onClick={handleTravelerDecrease}
              disabled={safeTravelerCount <= 1}
              aria-label="Decrease adults"
            >
              <i className="ri-subtract-line"></i>
            </button>
            <span className="traveler-stepper-value" aria-live="polite">
              {safeTravelerCount}
            </span>
            <button
              type="button"
              className="traveler-stepper-btn"
              onClick={handleTravelerIncrease}
              disabled={safeTravelerCount >= 10}
              aria-label="Increase adults"
            >
              <i className="ri-add-line"></i>
            </button>
          </div>
        )}
      </div>

      {couponApplied && availableCouponDiscount ? (
        <p className="price-coupon-savings">
          Coupon applied • {formatPrice(availableCouponDiscount)} discount given
        </p>
      ) : null}

      {(title || dateRange || duration) && (
        <div className="price-meta">
          {title ? <p>{title}</p> : null}
          {dateRange ? (
            <p>
              <i className="ri-calendar-line"></i> {dateRange}
            </p>
          ) : null}
          {duration ? (
            <p>
              <i className="ri-time-line"></i> {duration}
            </p>
          ) : null}
        </div>
      )}

      <div className="price-breakup-card">
        <div className="price-breakup-header">
          <h5>Price Breakup</h5>
          <button
            type="button"
            className="price-breakup-toggle"
            onClick={() => setShowBreakup((prev) => !prev)}
          >
            {showBreakup ? "Hide Price Breakup" : "Show Price Breakup"}
            <i
              className={
                showBreakup ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"
              }
            ></i>
          </button>
        </div>

        {showBreakup ? (
          <div className="price-breakup-body">
            <div className="price-row">
              <div className="price-row-main">
                <span className="price-row-label">Base Price</span>
                <span className="price-row-sub">{pricingConfig.priceNote}</span>
              </div>
              <strong className="price-row-value">
                {formatPrice(listPrice || offerPrice)}
              </strong>
            </div>

            {propertyDiscount ? (
              <div className="price-row discount">
                <div className="price-row-main">
                  <span className="price-row-label">Discount Applied</span>
                </div>
                <strong className="price-row-value">
                  - {formatPrice(propertyDiscount)}
                </strong>
              </div>
            ) : null}

            <div className="price-row emphasis">
              <div className="price-row-main">
                <span className="price-row-label">Price after Discount</span>
              </div>
              <strong className="price-row-value">
                {formatPrice(offerPrice)}
              </strong>
            </div>

            <div className="price-row">
              <div className="price-row-main price-row-main-inline">
                <span className="price-row-label">Taxes & Service Fees</span>
                <div
                  className={`fee-info-wrap ${showFeeInfo ? "is-open" : ""}`}
                >
                  <button
                    type="button"
                    className="fee-info-btn"
                    aria-label="View taxes and service fee details"
                    aria-expanded={showFeeInfo}
                    onClick={() => setShowFeeInfo((prev) => !prev)}
                  >
                    <i className="ri-information-line"></i>
                  </button>

                  <div className="fee-info-popover" role="tooltip">
                    <div>
                      <span>GST</span>
                      <strong>{formatPrice(pricingConfig.hotelGST)}</strong>
                    </div>
                    <div>
                      <span>Service Fees</span>
                      <strong>{formatPrice(pricingConfig.serviceFee)}</strong>
                    </div>
                  </div>
                </div>
              </div>
              <strong className="price-row-value">
                {formatPrice(pricingConfig.taxesAndFees)}
              </strong>
            </div>

            {availableCoupons.length ? (
              <div
                className={`price-row promotion ${couponApplied ? "active" : ""}`}
              >
                <div className="price-row-main">
                  <span className="price-row-label">
                    Promotion:{" "}
                    {(appliedCoupon || selectedCoupon)?.code || "Offer"}
                  </span>
                  <span className="price-row-sub">
                    {couponApplied
                      ? "Coupon discount including GST/service fee reversals"
                      : (selectedCoupon || appliedCoupon)?.countdownLabel ||
                        "Apply this code to unlock the extra discount"}
                  </span>
                </div>
                <strong className="price-row-value">
                  {couponApplied
                    ? `- ${formatPrice(availableCouponDiscount)}`
                    : formatPrice(0)}
                </strong>
              </div>
            ) : null}

            <div className="price-row total">
              <div className="price-row-main">
                <span className="price-row-label">Total Amount to be paid</span>
              </div>
              <strong className="price-row-value">
                {formatPrice(totalPayable)}
              </strong>
            </div>
          </div>
        ) : null}
      </div>

      <div className="coupon-box">
        <div className="coupon-box__head">
          <strong>Coupon Codes</strong>
          <span>
            {availableCoupons.length > 1
              ? "Pick the best available offer before payment."
              : "Apply the best available offer before payment."}
          </span>
        </div>

        {availableCoupons.length ? (
          <div className="coupon-option-list">
            {availableCoupons.map((couponItem) => {
              const isSelected = selectedCouponCode === couponItem.code;
              const isApplied =
                couponApplied && appliedCouponCode === couponItem.code;

              return (
                <button
                  key={couponItem.id}
                  type="button"
                  className={`coupon-option ${isSelected || isApplied ? "active" : ""}`}
                  onClick={() => {
                    setSelectedCouponCode(couponItem.code);
                    setCouponInput(couponItem.code);

                    if (
                      couponApplied &&
                      appliedCouponCode !== couponItem.code
                    ) {
                      setCouponApplied(false);
                      setAppliedCouponCode("");
                    }

                    setCouponMessage({
                      tone: "muted",
                      text: `Selected ${couponItem.code}. Tap APPLY to use it.`,
                    });
                  }}
                >
                  <span
                    className={`coupon-radio ${isSelected || isApplied ? "active" : ""}`}
                    aria-hidden="true"
                  />

                  <div className="coupon-option-copy">
                    <div className="coupon-option-top">
                      <strong>{couponItem.code}</strong>
                      {isApplied ? (
                        <span className="coupon-applied-tag">Applied</span>
                      ) : null}
                    </div>
                    <p>
                      {couponItem.description ||
                        `Offer available on this booking. Save ${couponItem.summary}.`}
                    </p>

                    <div className="coupon-meta-tags">
                      {couponItem.targetUserUid &&
                      !shouldHideSpecialCouponText ? (
                        <span className="coupon-meta-chip">
                          {couponItem.targetUserLabel &&
                          !/especially for you/i.test(
                            couponItem.targetUserLabel,
                          )
                            ? `For ${couponItem.targetUserLabel}`
                            : "Especially for you"}
                        </span>
                      ) : null}

                      {couponItem.countdownLabel ? (
                        <span className="coupon-meta-chip expiry">
                          {couponItem.countdownLabel}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <span className="coupon-option-value">
                    {couponItem.valueLabel}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="coupon-empty">
            <strong>{couponEmptyState?.title || "No coupon available"}</strong>
            <p>
              {couponEmptyState?.text ||
                "The current offer price already reflects the best available deal."}
            </p>
          </div>
        )}

        <div className="coupon-footnote">
          {selectedCoupon?.countdownLabel
            ? `Offer ends soon • ${selectedCoupon.countdownLabel}`
            : "Coupon can be applied at payment step"}
        </div>

        <div className="coupon-input-row">
          <input
            type="text"
            value={couponInput}
            onChange={(event) => {
              const nextCode = event.target.value.toUpperCase();
              const matchingCoupon = availableCoupons.find(
                (item) => item.code === nextCode.trim(),
              );

              setCouponInput(nextCode);

              if (matchingCoupon) {
                setSelectedCouponCode(matchingCoupon.code);
              }

              if (couponApplied) {
                setCouponApplied(false);
                setAppliedCouponCode("");
              }

              setCouponMessage({ tone: "", text: "" });
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleApplyCoupon();
              }
            }}
            placeholder={
              availableCoupons.length ? "Have a Coupon Code" : "No coupon"
            }
            disabled={!availableCoupons.length}
          />
          <button
            type="button"
            className={`coupon-apply-btn ${couponApplied ? "applied" : ""}`}
            onClick={handleApplyCoupon}
            disabled={!availableCoupons.length}
            aria-label="Apply coupon"
          >
            <span>{couponApplied ? "Applied" : "Apply Coupon"}</span>
          </button>
        </div>

        {couponMessage.text ? (
          <p className={`coupon-status ${couponMessage.tone}`}>
            {couponMessage.text}
          </p>
        ) : null}
      </div>

      <div className="booking-consent">
        <label className="consent-check">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
          />
          <span>
            I agree to the{" "}
            <Link to="/terms-and-conditions">Terms & Conditions</Link>,{" "}
            <Link to="/privacy-policy">Privacy Policy</Link>, and{" "}
            <Link to="/cancellation-refund-policy">
              Cancellation & Refund Policy
            </Link>
            .
          </span>
        </label>
      </div>

      <div className="price-actions">
        <motion.button
          type="button"
          className="primary__btn"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePrimaryAction}
        >
          Book Now
        </motion.button>
        <motion.button
          type="button"
          className="secondary__btn"
          whileHover={{ scale: 1.02 }}
          onClick={() => setOpen(true)}
        >
          Send Enquiry
        </motion.button>
      </div>

      {open ? (
        <InquiryModal
          onClose={() => setOpen(false)}
          tour={{
            id: tourId,
            title,
            city: tourCity,
            dateRange,
          }}
        />
      ) : null}
    </motion.aside>
  );
}

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import InquiryModal from "./InquiryModal";
import { formatPrice } from "../../utils/tourSchema";

export default function PriceCard({
  price = 199,
  discounted = 149,
  title = "",
  dateRange = "",
  duration = "",
  pricing = null,
  coupon = null,
}) {
  const [open, setOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponMessage, setCouponMessage] = useState({
    tone: "",
    text: "",
  });
  const [couponApplied, setCouponApplied] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showBreakup, setShowBreakup] = useState(true);
  const [travelerCount, setTravelerCount] = useState(1);
  const [travelerMode, setTravelerMode] = useState("adult");

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

  const couponConfig = useMemo(() => {
    const code = String(coupon?.code || "")
      .trim()
      .toUpperCase();
    const type =
      String(coupon?.type || "flat").toLowerCase() === "percent"
        ? "percent"
        : "flat";
    const value = Number(coupon?.value || 0);
    const description = String(coupon?.description || "").trim();
    const active = Boolean(coupon?.active && code && value > 0);

    return { code, type, value, description, active };
  }, [coupon]);

  const availableCouponDiscount = useMemo(() => {
    if (!couponConfig.active || !offerPrice) {
      return 0;
    }

    if (couponConfig.type === "percent") {
      return Math.min(
        Math.round((offerPrice * couponConfig.value) / 100),
        offerPrice,
      );
    }

    return Math.min(couponConfig.value, offerPrice);
  }, [couponConfig, offerPrice]);

  const propertyDiscount = Math.max(listPrice - offerPrice, 0);
  const promotionDiscount = couponApplied ? availableCouponDiscount : 0;
  const totalPayable = Math.max(
    offerPrice + pricingConfig.taxesAndFees - promotionDiscount,
    0,
  );
  const couponSummary =
    couponConfig.type === "percent"
      ? `${couponConfig.value}% OFF`
      : `${formatPrice(couponConfig.value)} OFF`;
  const couponValueLabel =
    couponConfig.type === "percent"
      ? `${couponConfig.value}%`
      : formatPrice(availableCouponDiscount || couponConfig.value);

  const handleApplyCoupon = () => {
    setShowBreakup(true);

    if (!couponConfig.active) {
      setCouponApplied(false);
      setCouponMessage({
        tone: "muted",
        text: "No coupon is available for this tour right now.",
      });
      return;
    }

    const enteredCode = String(couponInput || "")
      .trim()
      .toUpperCase();

    if (!enteredCode) {
      setCouponApplied(false);
      setCouponMessage({
        tone: "danger",
        text: "Enter a coupon code before paying.",
      });
      return;
    }

    if (enteredCode !== couponConfig.code) {
      setCouponApplied(false);
      setCouponMessage({
        tone: "danger",
        text: "That coupon code is invalid for this offer.",
      });
      return;
    }

    setCouponApplied(true);
    setCouponMessage({
      tone: "success",
      text: `Coupon applied • ${formatPrice(availableCouponDiscount)} discount given.`,
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
      {discountPercent || couponConfig.active ? (
        <div className="price-offer-banner">
          <div>
            <p className="offer-banner-label">Offer available</p>
            <strong>
              {couponConfig.active
                ? `Apply ${couponConfig.code} before payment`
                : `Save ${discountPercent}% on this tour`}
            </strong>
            <p className="offer-banner-text">
              {couponConfig.active
                ? couponConfig.description ||
                  `Use the coupon to unlock ${couponSummary} on the final amount.`
                : "The discounted offer price is already applied for this departure."}
            </p>
          </div>
          <span className="offer-banner-chip">
            {couponConfig.active ? couponSummary : `${discountPercent}% OFF`}
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
                  <span className="price-row-label">Discount by Property</span>
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
                <div className="fee-info-wrap">
                  <button
                    type="button"
                    className="fee-info-btn"
                    aria-label="View taxes and service fee details"
                  >
                    <i className="ri-information-line"></i>
                  </button>

                  <div className="fee-info-popover">
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

            {couponConfig.active ? (
              <div
                className={`price-row promotion ${couponApplied ? "active" : ""}`}
              >
                <div className="price-row-main">
                  <span className="price-row-label">
                    Promotion: {couponConfig.code}
                  </span>
                  <span className="price-row-sub">
                    {couponApplied
                      ? "Coupon discount including GST/service fee reversals"
                      : "Apply this code to unlock the extra discount"}
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
          <span>Apply the best available offer before payment.</span>
        </div>

        {couponConfig.active ? (
          <button
            type="button"
            className={`coupon-option ${couponApplied ? "active" : ""}`}
            onClick={() => {
              setCouponInput(couponConfig.code);
              setCouponMessage({
                tone: "muted",
                text: `Selected ${couponConfig.code}. Tap APPLY to use it.`,
              });
            }}
          >
            <span
              className={`coupon-radio ${couponApplied ? "active" : ""}`}
              aria-hidden="true"
            />

            <div className="coupon-option-copy">
              <div className="coupon-option-top">
                <strong>{couponConfig.code}</strong>
                {couponApplied ? (
                  <span className="coupon-applied-tag">Applied</span>
                ) : null}
              </div>
              <p>
                {couponConfig.description ||
                  `Offer available on this booking. Save ${couponSummary}.`}
              </p>
            </div>

            <span className="coupon-option-value">{couponValueLabel}</span>
          </button>
        ) : (
          <div className="coupon-empty">
            <strong>No coupon available</strong>
            <p>
              The current offer price already reflects the best available deal.
            </p>
          </div>
        )}

        <div className="coupon-footnote">
          Coupon can be applied at payment step
        </div>

        <div className="coupon-input-row">
          <input
            type="text"
            value={couponInput}
            onChange={(event) => {
              setCouponInput(event.target.value.toUpperCase());
              if (couponApplied) {
                setCouponApplied(false);
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
              couponConfig.active ? "Have a Coupon Code" : "No coupon"
            }
            disabled={!couponConfig.active}
          />
          <button
            type="button"
            className={`coupon-apply-btn ${couponApplied ? "applied" : ""}`}
            onClick={handleApplyCoupon}
            disabled={!couponConfig.active}
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
            <a href="#terms-and-conditions">Terms & Conditions</a> and{" "}
            <a href="#privacy-policy">Privacy Policy</a>.
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

      {open && <InquiryModal onClose={() => setOpen(false)} />}
    </motion.aside>
  );
}

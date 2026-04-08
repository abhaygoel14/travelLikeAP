import { onValue, ref, remove, set } from "firebase/database";
import fallbackTours from "../assets/data/tours";
import { APP_CONFIG } from "../config/featureFlags";
import { firebaseReady, realtimeDb } from "./firebaseConfig";

const DEFAULT_TOUR_ID = "tour-draft";

const toSlug = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || DEFAULT_TOUR_ID;

const toNumber = (value, fallback = 0) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
};

const splitLines = (value = "") =>
  String(value)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const parseDelimitedRows = (value = "", width = 2) =>
  splitLines(value)
    .map((line) => line.split("|").map((item) => item.trim()))
    .filter((parts) => parts.some(Boolean))
    .map((parts) => {
      const padded = [...parts];
      while (padded.length < width) {
        padded.push("");
      }
      return padded;
    });

const getFallbackGallery = (tour = {}) => {
  const gallery = Array.isArray(tour.gallery) ? tour.gallery : [];
  return [tour.photo, ...gallery].filter(Boolean);
};

const getAverageRating = (reviews = []) => {
  if (!Array.isArray(reviews) || !reviews.length) {
    return 0;
  }

  const validRatings = reviews
    .map((review) => Number(review?.rating || 0))
    .filter((rating) => Number.isFinite(rating) && rating > 0);

  if (!validRatings.length) {
    return 0;
  }

  return Number(
    (
      validRatings.reduce((total, rating) => total + rating, 0) /
      validRatings.length
    ).toFixed(1),
  );
};

export const formatPrice = (value, symbol = APP_CONFIG.currencySymbol) =>
  `${symbol}${toNumber(value, 0).toLocaleString("en-IN")}`;

export const formatTourDateRange = (
  startDate,
  endDate,
  fallbackDateRange = "",
) => {
  const formatSingleDate = (value) => {
    const nextDate = new Date(value);

    if (Number.isNaN(nextDate.getTime())) {
      return "";
    }

    return nextDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formattedStart = formatSingleDate(startDate);
  const formattedEnd = formatSingleDate(endDate);

  if (formattedStart && formattedEnd) {
    return `${formattedStart} - ${formattedEnd}`;
  }

  return (
    formattedStart || formattedEnd || String(fallbackDateRange || "").trim()
  );
};

export const createEmptyTour = () => ({
  id: "",
  _id: "",
  title: "",
  city: "",
  address: "",
  distance: 120,
  price: 4999,
  discountedPrice: 3999,
  maxGroupSize: 8,
  startDate: "",
  endDate: "",
  desc: "",
  photo: "",
  featured: false,
  currencySymbol: APP_CONFIG.currencySymbol,
  pricing: {
    priceNote: "1 Person x 1 Trip",
    hotelGST: 0,
    serviceFee: 0,
  },
  coupon: {
    code: "",
    type: "flat",
    value: 0,
    description: "",
    active: false,
  },
  gallery: [],
  details: {
    pickup: "Hotel pickup available",
    dropoff: "City center dropoff",
    category: "Guided tour",
    duration: "3 Days / 2 Nights",
    dateRange: "",
  },
  inclusions: ["Stay", "Breakfast", "Local guide"],
  highlights: ["Scenic views", "Local food", "Photo stops"],
  itinerary: [
    {
      title: "Arrival and check-in",
      desc: "Reach the destination, settle in, and enjoy the evening.",
    },
  ],
  packing: ["Comfortable shoes", "Water bottle", "Camera"],
  includeEx: {
    include: ["Transfers", "Stay", "Guide"],
    exclude: ["Flights", "Personal expenses"],
  },
  policyRows: [{ days: "7+ days", refund: "100%", notes: "Full refund" }],
  reviews: [],
  avgRating: 0,
  createdAt: "",
  updatedAt: "",
});

export const normalizeTourRecord = (tour = {}, fallbackId = "") => {
  const nextId = String(tour.id || tour._id || fallbackId || "").trim();
  const gallery = getFallbackGallery(tour);
  const reviews = Array.isArray(tour.reviews)
    ? tour.reviews.map((review) => ({
        name: String(review?.name || "Traveler").trim() || "Traveler",
        rating: toNumber(review?.rating, 0),
      }))
    : [];
  const resolvedStartDate = String(
    tour.startDate || tour.details?.startDate || "",
  ).trim();
  const resolvedEndDate = String(
    tour.endDate || tour.details?.endDate || "",
  ).trim();
  const resolvedDateRange =
    [resolvedStartDate, resolvedEndDate].filter(Boolean).join(" to ") ||
    String(tour.details?.dateRange || tour.dateRange || "").trim();
  const resolvedCouponCode = String(tour.coupon?.code || tour.couponCode || "")
    .trim()
    .toUpperCase();
  const resolvedCouponType =
    String(tour.coupon?.type || tour.couponType || "flat").toLowerCase() ===
    "percent"
      ? "percent"
      : "flat";
  const resolvedCouponValue = toNumber(
    tour.coupon?.value ?? tour.couponValue,
    0,
  );
  const resolvedCouponDescription = String(
    tour.coupon?.description || tour.couponDescription || "",
  ).trim();
  const resolvedCouponActive =
    typeof tour.coupon?.active === "boolean"
      ? tour.coupon.active
      : Boolean(
          tour.couponActive ?? (resolvedCouponCode && resolvedCouponValue > 0),
        );
  const resolvedPriceNote = String(
    tour.pricing?.priceNote || tour.priceNote || "1 Person x 1 Trip",
  ).trim();
  const resolvedHotelGST = toNumber(tour.pricing?.hotelGST ?? tour.hotelGST, 0);
  const resolvedServiceFee = toNumber(
    tour.pricing?.serviceFee ?? tour.serviceFee,
    0,
  );

  return {
    ...createEmptyTour(),
    ...tour,
    id: nextId || toSlug(tour.title || DEFAULT_TOUR_ID),
    _id: nextId || toSlug(tour.title || DEFAULT_TOUR_ID),
    title: String(tour.title || "Untitled Tour").trim(),
    city: String(tour.city || "Destination").trim(),
    address: String(tour.address || "").trim(),
    distance: toNumber(tour.distance, 0),
    price: toNumber(tour.price, 0),
    discountedPrice: toNumber(
      tour.discountedPrice || tour.price,
      toNumber(tour.price, 0),
    ),
    maxGroupSize: toNumber(tour.maxGroupSize, 1),
    startDate: resolvedStartDate,
    endDate: resolvedEndDate,
    desc: String(tour.desc || "").trim(),
    photo: String(tour.photo || gallery[0] || "").trim(),
    featured: Boolean(tour.featured),
    currencySymbol: tour.currencySymbol || APP_CONFIG.currencySymbol,
    pricing: {
      priceNote: resolvedPriceNote || "1 Person x 1 Trip",
      hotelGST: resolvedHotelGST,
      serviceFee: resolvedServiceFee,
    },
    coupon: {
      code: resolvedCouponCode,
      type: resolvedCouponType,
      value: resolvedCouponValue,
      description: resolvedCouponDescription,
      active: resolvedCouponActive,
    },
    gallery,
    details: {
      pickup: String(
        tour.details?.pickup || tour.pickup || "Hotel pickup available",
      ).trim(),
      dropoff: String(
        tour.details?.dropoff || tour.dropoff || "City center dropoff",
      ).trim(),
      category: String(
        tour.details?.category || tour.category || "Guided tour",
      ).trim(),
      duration: String(
        tour.details?.duration || tour.duration || "Flexible duration",
      ).trim(),
      dateRange: resolvedDateRange,
    },
    inclusions: Array.isArray(tour.inclusions)
      ? tour.inclusions.filter(Boolean)
      : [],
    highlights: Array.isArray(tour.highlights)
      ? tour.highlights.filter(Boolean)
      : [],
    itinerary: Array.isArray(tour.itinerary)
      ? tour.itinerary
          .map((item, index) => ({
            title: String(item?.title || `Day ${index + 1}`).trim(),
            desc: String(item?.desc || "").trim(),
          }))
          .filter((item) => item.title || item.desc)
      : [],
    packing: Array.isArray(tour.packing) ? tour.packing.filter(Boolean) : [],
    includeEx: {
      include: Array.isArray(tour.includeEx?.include)
        ? tour.includeEx.include.filter(Boolean)
        : [],
      exclude: Array.isArray(tour.includeEx?.exclude)
        ? tour.includeEx.exclude.filter(Boolean)
        : [],
    },
    policyRows: Array.isArray(tour.policyRows)
      ? tour.policyRows
          .map((row) => ({
            days: String(row?.days || "").trim(),
            refund: String(row?.refund || "").trim(),
            notes: String(row?.notes || "").trim(),
          }))
          .filter((row) => row.days || row.refund || row.notes)
      : [],
    reviews,
    avgRating: toNumber(tour.avgRating, getAverageRating(reviews)),
    createdAt: String(tour.createdAt || "").trim(),
    updatedAt: String(tour.updatedAt || "").trim(),
  };
};

export const normalizeToursCollection = (value) => {
  if (Array.isArray(value)) {
    return value.map((tour, index) =>
      normalizeTourRecord(tour, `tour-${index + 1}`),
    );
  }

  if (value && typeof value === "object") {
    return Object.entries(value).map(([id, tour]) =>
      normalizeTourRecord(tour, id),
    );
  }

  return fallbackTours.map((tour, index) =>
    normalizeTourRecord(tour, `tour-${index + 1}`),
  );
};

export const fallbackNormalizedTours = normalizeToursCollection(fallbackTours);

export const subscribeToTours = (onChange) => {
  if (!firebaseReady || !realtimeDb) {
    onChange(fallbackNormalizedTours, { source: "local" });
    return () => {};
  }

  const toursRef = ref(realtimeDb, "tours");

  return onValue(
    toursRef,
    (snapshot) => {
      const tours = snapshot.exists()
        ? normalizeToursCollection(snapshot.val())
        : fallbackNormalizedTours;

      onChange(tours, {
        source: snapshot.exists() ? "firebase" : "local",
      });
    },
    (error) => {
      console.warn("Unable to load tours from Firebase:", error);
      onChange(fallbackNormalizedTours, { source: "local", error });
    },
  );
};

export const tourToFormState = (tour = createEmptyTour()) => {
  const normalizedTour = normalizeTourRecord(tour);

  return {
    id: normalizedTour.id,
    title: normalizedTour.title,
    city: normalizedTour.city,
    address: normalizedTour.address,
    distance: String(normalizedTour.distance || ""),
    price: String(normalizedTour.price || ""),
    discountedPrice: String(
      normalizedTour.discountedPrice || normalizedTour.price || "",
    ),
    priceNote: normalizedTour.pricing.priceNote,
    hotelGST: String(normalizedTour.pricing.hotelGST || ""),
    serviceFee: String(normalizedTour.pricing.serviceFee || ""),
    couponCode: normalizedTour.coupon.code,
    couponType: normalizedTour.coupon.type,
    couponValue: String(normalizedTour.coupon.value || ""),
    couponDescription: normalizedTour.coupon.description,
    couponActive: Boolean(normalizedTour.coupon.active),
    maxGroupSize: String(normalizedTour.maxGroupSize || ""),
    desc: normalizedTour.desc,
    photo: normalizedTour.photo,
    featured: Boolean(normalizedTour.featured),
    startDate: normalizedTour.startDate,
    endDate: normalizedTour.endDate,
    pickup: normalizedTour.details.pickup,
    dropoff: normalizedTour.details.dropoff,
    category: normalizedTour.details.category,
    duration: normalizedTour.details.duration,
    galleryText: normalizedTour.gallery.join("\n"),
    inclusionsText: normalizedTour.inclusions.join("\n"),
    highlightsText: normalizedTour.highlights.join("\n"),
    packingText: normalizedTour.packing.join("\n"),
    includeText: normalizedTour.includeEx.include.join("\n"),
    excludeText: normalizedTour.includeEx.exclude.join("\n"),
    itineraryText: normalizedTour.itinerary
      .map((day) => `${day.title} | ${day.desc}`)
      .join("\n"),
    policyText: normalizedTour.policyRows
      .map((row) => `${row.days} | ${row.refund} | ${row.notes}`)
      .join("\n"),
  };
};

export const formStateToTour = (formState = {}) => {
  const derivedId = String(formState.id || "").trim();

  return normalizeTourRecord({
    id: derivedId || toSlug(formState.title || DEFAULT_TOUR_ID),
    _id: derivedId || toSlug(formState.title || DEFAULT_TOUR_ID),
    title: formState.title,
    city: formState.city,
    address: formState.address,
    distance: toNumber(formState.distance, 0),
    price: toNumber(formState.price, 0),
    discountedPrice: toNumber(formState.discountedPrice || formState.price, 0),
    maxGroupSize: toNumber(formState.maxGroupSize, 1),
    startDate: String(formState.startDate || "").trim(),
    endDate: String(formState.endDate || "").trim(),
    desc: formState.desc,
    photo: formState.photo,
    featured: Boolean(formState.featured),
    currencySymbol: APP_CONFIG.currencySymbol,
    pricing: {
      priceNote: String(formState.priceNote || "1 Person x 1 Trip").trim(),
      hotelGST: toNumber(formState.hotelGST, 0),
      serviceFee: toNumber(formState.serviceFee, 0),
    },
    coupon: {
      code: String(formState.couponCode || "")
        .trim()
        .toUpperCase(),
      type:
        String(formState.couponType || "flat")
          .trim()
          .toLowerCase() === "percent"
          ? "percent"
          : "flat",
      value: toNumber(formState.couponValue, 0),
      description: String(formState.couponDescription || "").trim(),
      active: Boolean(formState.couponActive),
    },
    gallery: splitLines(formState.galleryText),
    details: {
      pickup: formState.pickup,
      dropoff: formState.dropoff,
      category: formState.category,
      duration: formState.duration,
      dateRange: [formState.startDate, formState.endDate]
        .filter(Boolean)
        .join(" to "),
    },
    inclusions: splitLines(formState.inclusionsText),
    highlights: splitLines(formState.highlightsText),
    packing: splitLines(formState.packingText),
    includeEx: {
      include: splitLines(formState.includeText),
      exclude: splitLines(formState.excludeText),
    },
    itinerary: parseDelimitedRows(formState.itineraryText).map(
      ([title, desc]) => ({
        title,
        desc,
      }),
    ),
    policyRows: parseDelimitedRows(formState.policyText, 3).map(
      ([days, refund, notes]) => ({
        days,
        refund,
        notes,
      }),
    ),
  });
};

export const saveTourToFirebase = async (tourInput, options = {}) => {
  if (!firebaseReady || !realtimeDb) {
    throw new Error(
      "Firebase is not configured. Add your Firebase keys to save tours.",
    );
  }

  const nextTour = normalizeTourRecord(tourInput);
  const timestamp = new Date().toISOString();
  const baseId =
    String(nextTour.id || nextTour._id || "").trim() ||
    toSlug(nextTour.title || DEFAULT_TOUR_ID);
  const id = options.forceCreateNew
    ? `${toSlug(nextTour.title || DEFAULT_TOUR_ID)}-${Date.now()}`
    : baseId;

  const payload = {
    ...nextTour,
    id,
    _id: id,
    updatedAt: timestamp,
    createdAt: nextTour.createdAt || timestamp,
    updatedBy: options.editorUid || "admin",
  };

  await set(ref(realtimeDb, `tours/${id}`), payload);
  return payload;
};

export const deleteTourFromFirebase = async (tourId) => {
  if (!firebaseReady || !realtimeDb) {
    throw new Error(
      "Firebase is not configured. Add your Firebase keys to delete tours.",
    );
  }

  await remove(ref(realtimeDb, `tours/${tourId}`));
};

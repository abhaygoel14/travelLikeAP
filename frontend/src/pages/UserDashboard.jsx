import React, { useContext, useEffect, useMemo, useState } from "react";
import { Navigate, Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Popover,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import CollectionsIcon from "@mui/icons-material/Collections";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import SaveIcon from "@mui/icons-material/Save";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import { updateProfile, verifyBeforeUpdateEmail } from "firebase/auth";
import { get, ref, update } from "firebase/database";
import {
  getDownloadURL,
  ref as storageRef,
  uploadString,
} from "firebase/storage";
import { AuthContext } from "../context/AuthContext";
import toursData from "../assets/data/tours";
import galleryImages from "../components/Image-gallery/galleryImage";
import ReceiptPanel from "../components/UserDashboard/ReceiptPanel";
import { TravellerDashboardSkeleton } from "../shared/TravelLoader";
import Logo from "../assets/images/logo.png";
import { FEATURE_FLAGS } from "../config/featureFlags";
import { auth, realtimeDb, storage } from "../utils/firebaseConfig";

const defaultTrips = [
  {
    title: "Kuala Lumpur - Ipoh",
    city: "Malaysia",
    date: "15 Jul 2025",
    status: "5 Days, 4 Nights",
    budget: 1200,
  },
  {
    title: "Sapa - Ninh Binh",
    city: "Vietnam",
    date: "24 Jul 2025",
    status: "4 Days, 3 Nights",
    budget: 890,
  },
  {
    title: "Bangkok Weekend",
    city: "Thailand",
    date: "02 Aug 2025",
    status: "3 Days, 2 Nights",
    budget: 640,
  },
];

const defaultPayments = [
  {
    label: "Visa •••• 4242",
    description: "Primary card for quick checkout",
  },
  {
    label: "UPI / Wallet",
    description: "Fast pay for deposits and activity fees",
  },
];

const defaultReviews = [
  {
    title: "Amazing itinerary support",
    text: "Your future reviews will appear here once trips are completed.",
  },
  {
    title: "Photo-ready moments",
    text: "Save your travel memories and keep everything in one dashboard.",
  },
];

const MAX_AVATAR_FILE_SIZE = 1024 * 1024;
const MAX_FIREBASE_PHOTO_URL_LENGTH = 2048;

const compactPillButtonSx = {
  borderRadius: 1.5,
  textTransform: "none",
  fontSize: "0.8rem",
  fontWeight: 500,
  px: 1.2,
  py: 0.35,
  minHeight: 30,
  boxShadow: "none",
  backgroundImage: "none",
};

const compactNavButtonSx = {
  justifyContent: "flex-start",
  borderRadius: 3,
  px: 1.25,
  py: 0.75,
  minHeight: 36,
  fontSize: "0.8rem",
  fontWeight: 600,
  textTransform: "none",
};

const toolbarIconButtonSx = {
  width: { xs: 34, sm: 38 },
  height: { xs: 34, sm: 38 },
  borderRadius: { xs: 2.25, sm: "50%" },
  border: "1px solid #dbeafe",
  bgcolor: "#f8fbff",
  color: "#2563eb",
  boxShadow: "none",
  "&:hover": {
    bgcolor: "#eef6ff",
    boxShadow: "none",
  },
};

const sectionCardSx = {
  p: { xs: 1.5, sm: 2, md: 2.25 },
  borderRadius: { xs: 3, sm: 4 },
  bgcolor: "#fff",
  border: "1px solid #dbeafe",
  boxShadow: "0 12px 30px rgba(59, 130, 246, 0.08)",
};

const mobileScrollableRowSx = {
  display: "flex",
  flexWrap: { xs: "nowrap", md: "wrap" },
  gap: { xs: 1.25, md: 0 },
  overflowX: { xs: "auto", md: "visible" },
  overflowY: "visible",
  scrollSnapType: { xs: "x mandatory", md: "none" },
  pb: { xs: 0.5, md: 0 },
  pr: { xs: 1.5, sm: 0, md: 0 },
  pl: { xs: 0, md: 0 },
  mx: 0,
  width: "100%",
  "&::-webkit-scrollbar": {
    height: 6,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "rgba(37, 99, 235, 0.28)",
    borderRadius: 999,
  },
  "& > .MuiGrid-item": {
    minWidth: { xs: "82%", sm: "66%", md: "auto" },
    maxWidth: { xs: "82%", sm: "66%", md: "none" },
    scrollSnapAlign: { xs: "start", md: "unset" },
    pl: { xs: "0 !important", md: undefined },
  },
};

const dashboardSectionGridSx = {
  alignItems: "stretch",
  "& > .MuiGrid-item": {
    display: "flex",
    pl: { xs: "0 !important", sm: undefined },
  },
};

const compactTripCardSx = {
  height: "100%",
  width: "100%",
  borderRadius: 3.5,
  boxShadow: "0 18px 36px rgba(37, 99, 235, 0.08)",
  border: "1px solid #dbeafe",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 24px 44px rgba(37, 99, 235, 0.12)",
  },
};

const instagramGalleryGridSx = {
  columnCount: { xs: 2, sm: 3, md: 4 },
  columnGap: "6px",
  bgcolor: "#ffffff",
  borderRadius: 4,
  overflow: "hidden",
  p: "6px",
  border: "1px solid #e2e8f0",
};

const instagramMemoryCardSx = {
  position: "relative",
  width: "100%",
  mb: "6px",
  borderRadius: 0,
  overflow: "hidden",
  display: "block",
  breakInside: "avoid",
  bgcolor: "#ffffff",
  cursor: "default",
  isolation: "isolate",
  border: "1px solid #e5e7eb",
  "& .memory-image": {
    display: "block",
  },
};

const storyScrollableRowSx = {
  mt: 2.5,
  display: "flex",
  alignItems: "center",
  flexWrap: "nowrap",
  gap: 1.25,
  overflowX: "auto",
  overflowY: "hidden",
  scrollBehavior: "smooth",
  scrollbarWidth: "thin",
  pb: 0.5,
  pr: 0.5,
  "&::-webkit-scrollbar": {
    height: 6,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "rgba(37, 99, 235, 0.28)",
    borderRadius: 999,
  },
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const wrapCanvasText = (ctx, text, maxWidth) => {
  const words = String(text || "")
    .split(/\s+/)
    .filter(Boolean);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length ? lines : [""];
};

const drawRoundedRect = (
  ctx,
  x,
  y,
  width,
  height,
  radius,
  fillStyle,
  strokeStyle,
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
};

const loadImageForPdf = (src) =>
  new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });

const dataUrlToUint8Array = (dataUrl = "") => {
  const base64 = String(dataUrl).split(",")[1] || "";
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

const canvasToJpegPage = (canvas) => ({
  data: dataUrlToUint8Array(canvas.toDataURL("image/jpeg", 0.92)),
  width: canvas.width,
  height: canvas.height,
});

const createPdfFromJpegPages = (pages = []) => {
  if (!pages.length) {
    return new Blob([], { type: "application/pdf" });
  }

  const encoder = new TextEncoder();
  const parts = [];
  const offsets = [0];
  let pdfLength = 0;

  const push = (value) => {
    const part =
      typeof value === "string"
        ? encoder.encode(value)
        : value instanceof Uint8Array
          ? value
          : new Uint8Array(value);

    parts.push(part);
    pdfLength += part.byteLength;
  };

  const totalObjects = 2 + pages.length * 3;
  const pageIds = pages.map((_, index) => 3 + index * 3);
  const contentIds = pages.map((_, index) => 4 + index * 3);
  const imageIds = pages.map((_, index) => 5 + index * 3);

  const addObject = (objectNumber, content) => {
    offsets[objectNumber] = pdfLength;
    push(`${objectNumber} 0 obj\n`);

    if (Array.isArray(content)) {
      content.forEach((part) => push(part));
    } else {
      push(content);
    }

    push("\nendobj\n");
  };

  push("%PDF-1.4\n");
  addObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
  addObject(
    2,
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`,
  );

  pages.forEach((page, index) => {
    const pageWidth = 595;
    const pageHeight = Math.max(
      842,
      Math.round((page.height / page.width) * pageWidth),
    );
    const content = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im${index + 1} Do\nQ`;

    addObject(
      pageIds[index],
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im${index + 1} ${imageIds[index]} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`,
    );
    addObject(
      contentIds[index],
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    );
    addObject(imageIds[index], [
      `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.data.byteLength} >>\nstream\n`,
      page.data,
      "\nendstream",
    ]);
  });

  const xrefOffset = pdfLength;
  push(`xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`);

  for (let objectNumber = 1; objectNumber <= totalObjects; objectNumber += 1) {
    push(`${String(offsets[objectNumber] || 0).padStart(10, "0")} 00000 n \n`);
  }

  push(
    `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  );

  return new Blob(parts, { type: "application/pdf" });
};

const normalizeMemoryGallery = (gallery = []) => {
  if (!Array.isArray(gallery)) {
    return [];
  }

  return gallery
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          id: `memory-${index}`,
          src: item,
          title: `Memory ${index + 1}`,
          tripTitle: "",
          visibility: "public",
        };
      }

      return {
        id: item?.id || `memory-${index}`,
        src: item?.src || item?.url || "",
        title: item?.title || item?.name || `Memory ${index + 1}`,
        tripTitle: item?.tripTitle || item?.trip || item?.tripName || "",
        visibility: item?.visibility === "private" ? "private" : "public",
      };
    })
    .filter((item) => item.src);
};

const getSafeFirebasePhotoURL = (value) => {
  const trimmedValue = String(value || "").trim();

  if (
    !trimmedValue ||
    trimmedValue.startsWith("data:") ||
    trimmedValue.length > MAX_FIREBASE_PHOTO_URL_LENGTH
  ) {
    return null;
  }

  return /^https?:\/\//i.test(trimmedValue) ? trimmedValue : null;
};

const uploadAvatarAndGetURL = async (uid, photoDataUrl) => {
  if (!storage || !uid || !String(photoDataUrl || "").startsWith("data:")) {
    return photoDataUrl;
  }

  try {
    const avatarRef = storageRef(
      storage,
      `pictures/${uid}/avatar-${Date.now()}`,
    );
    await uploadString(avatarRef, photoDataUrl, "data_url");
    return await getDownloadURL(avatarRef);
  } catch (error) {
    console.warn("Avatar upload fallback triggered:", error);
    return photoDataUrl;
  }
};

const isPlaceholderName = (value = "") => {
  const normalizedValue = String(value || "")
    .trim()
    .toLowerCase();
  return (
    !normalizedValue || ["traveler", "traveller"].includes(normalizedValue)
  );
};

const normalizeProfile = (user = {}) => {
  const fullName = [user.firstName, user.lastName]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
  const safeDisplayName = isPlaceholderName(user.displayName)
    ? ""
    : String(user.displayName || "").trim();
  const safeUsername = isPlaceholderName(user.username)
    ? ""
    : String(user.username || "").trim();
  const sourceName =
    fullName ||
    safeDisplayName ||
    safeUsername ||
    String(user.email || "")
      .split("@")[0]
      .trim() ||
    "Traveler";

  const cleanSource = String(sourceName).split("@")[0].trim();
  const [derivedFirstName = "Traveler", ...restNames] = cleanSource.split(" ");
  const resolvedLastName = String(user.lastName || restNames.join(" ")).trim();
  const resolvedFullName = [
    user.firstName || derivedFirstName,
    resolvedLastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  const resolvedPhotoURL = String(
    user.profileUrl || user.imageUrl || user.photoURL || "",
  ).trim();

  return {
    ...user,
    firstName: user.firstName || derivedFirstName,
    lastName: resolvedLastName,
    displayName:
      safeDisplayName || resolvedFullName || safeUsername || "Traveler",
    username: safeUsername || resolvedFullName || cleanSource || "Traveler",
    photoURL: resolvedPhotoURL,
    profileUrl: String(user.profileUrl || resolvedPhotoURL || "").trim(),
    imageUrl: String(user.imageUrl || resolvedPhotoURL || "").trim(),
    hobby: user.hobby || "",
    interests: Array.isArray(user.interests)
      ? user.interests
      : String(user.interests || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
    gallery: normalizeMemoryGallery(user.gallery),
    upcomingTrips:
      Array.isArray(user.upcomingTrips) && user.upcomingTrips.length
        ? user.upcomingTrips
        : defaultTrips,
    paymentOptions:
      Array.isArray(user.paymentOptions) && user.paymentOptions.length
        ? user.paymentOptions
        : defaultPayments,
    reviews:
      Array.isArray(user.reviews) && user.reviews.length
        ? user.reviews
        : defaultReviews,
  };
};

const UserDashboard = () => {
  const { user, dispatch } = useContext(AuthContext);
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [status, setStatus] = useState({ severity: "info", message: "" });
  const [profile, setProfile] = useState(normalizeProfile(user || {}));
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    hobby: "",
    interests: "",
    photoURL: "",
  });
  const [memoryUploadOpen, setMemoryUploadOpen] = useState(false);
  const [memoryDrafts, setMemoryDrafts] = useState([]);
  const [savingMemories, setSavingMemories] = useState(false);
  const [memoryEditOpen, setMemoryEditOpen] = useState(false);
  const [editingMemoryIndex, setEditingMemoryIndex] = useState(null);
  const [memoryEditor, setMemoryEditor] = useState({
    title: "",
    tripTitle: "",
    visibility: "private",
  });
  const [viewingMemory, setViewingMemory] = useState(null);
  const [tabLoading, setTabLoading] = useState(true);
  const showNotifications = Boolean(notificationAnchorEl);
  const memoryGalleryEnabled = FEATURE_FLAGS.memoryGallery;
  const travelSnapshotEnabled = FEATURE_FLAGS.travelSnapshotCard;
  const isGalleryView = memoryGalleryEnabled && tab === 1;
  const isItineraryView = tab === 2;
  const isReceiptView = tab === 3;

  const clearStatusMessage = () => {
    setStatus((prev) => ({ ...prev, message: "" }));
  };

  useEffect(() => {
    if (!status.message) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      clearStatusMessage();
    }, 10000);

    return () => window.clearTimeout(timer);
  }, [status.message]);

  useEffect(() => {
    setTabLoading(true);

    const timer = window.setTimeout(() => {
      setTabLoading(false);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [tab]);

  useEffect(() => {
    if (!memoryGalleryEnabled && tab === 1) {
      setTab(0);
    }
  }, [memoryGalleryEnabled, tab]);

  useEffect(() => {
    const nextProfile = normalizeProfile(user || {});
    setProfile(nextProfile);
    setForm({
      firstName: nextProfile.firstName || "",
      lastName: nextProfile.lastName || "",
      email: nextProfile.pendingEmail || nextProfile.email || "",
      phoneNumber: nextProfile.phoneNumber || "",
      hobby: nextProfile.hobby || "",
      interests: (nextProfile.interests || []).join(", "),
      photoURL: nextProfile.photoURL || "",
    });
  }, [user]);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (!user?.uid || !realtimeDb) {
        return;
      }

      try {
        const snapshot = await get(ref(realtimeDb, `users/${user.uid}`));
        if (active && snapshot.exists()) {
          const mergedProfile = normalizeProfile({
            ...user,
            ...snapshot.val(),
          });
          setProfile(mergedProfile);
          dispatch({ type: "SET_USER", payload: mergedProfile });
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, [dispatch, user]);

  const firstName = useMemo(
    () => profile.firstName || profile.displayName || "Traveler",
    [profile],
  );

  const sideTrips = useMemo(
    () => (profile.upcomingTrips || []).slice(0, 4),
    [profile.upcomingTrips],
  );

  const memories = useMemo(() => profile.gallery || [], [profile.gallery]);

  const pastTripChoices = useMemo(() => {
    const source =
      Array.isArray(profile.pastTrips) && profile.pastTrips.length
        ? profile.pastTrips
        : profile.upcomingTrips || [];

    return source
      .map((trip, index) => ({
        label: trip?.title || `${trip?.city || "Trip"} ${index + 1}`,
        helper: [trip?.city, trip?.date].filter(Boolean).join(" • "),
      }))
      .filter((trip) => trip.label);
  }, [profile.pastTrips, profile.upcomingTrips]);

  const galleryStrip = useMemo(() => {
    const publicMemoryImages = memories
      .filter((item) => item.visibility === "public")
      .map((item) => item.src)
      .filter(Boolean);
    const savedMemoryImages = memories.map((item) => item.src).filter(Boolean);

    const source = publicMemoryImages.length
      ? publicMemoryImages
      : savedMemoryImages.length
        ? savedMemoryImages
        : galleryImages;

    return source.slice(0, 6);
  }, [memories]);

  const recommendedPlaces = useMemo(() => toursData.slice(0, 4), []);
  const featuredPlan = recommendedPlaces[0] || null;

  const itineraryTrips = useMemo(
    () =>
      sideTrips.map((trip, index) => {
        const normalizedTitle = String(trip.title || "").toLowerCase();
        const normalizedCity = String(trip.city || "").toLowerCase();

        const relatedTour =
          toursData.find((tour) => {
            const tourTitle = String(tour.title || "").toLowerCase();
            const tourCity = String(tour.city || "").toLowerCase();

            return (
              (normalizedTitle &&
                (tourTitle.includes(normalizedTitle) ||
                  normalizedTitle.includes(tourTitle))) ||
              (normalizedCity &&
                (tourCity.includes(normalizedCity) ||
                  normalizedCity.includes(tourCity)))
            );
          }) ||
          recommendedPlaces[index] ||
          featuredPlan;

        return {
          ...trip,
          relatedTour,
          photo:
            relatedTour?.photo || galleryStrip[index] || featuredPlan?.photo,
          route: relatedTour?.id ? `/tours/${relatedTour.id}` : "/tours",
          description:
            relatedTour?.desc ||
            "Your itinerary includes the main highlights, flexible free time, and easy travel pacing.",
          rating: relatedTour?.avgRating || 4.8,
          price: relatedTour?.price || trip.budget || 99,
        };
      }),
    [featuredPlan, galleryStrip, recommendedPlaces, sideTrips],
  );

  const storyItems = useMemo(
    () =>
      galleryStrip
        .map((image, index) => {
          const place =
            recommendedPlaces[index] || sideTrips[index] || sideTrips[0];

          return {
            image,
            label: place?.city || place?.title?.split(" ")[0] || "Trip",
            to: `/tours/${place?.id || "01"}`,
          };
        })
        .slice(0, 6),
    [galleryStrip, recommendedPlaces, sideTrips],
  );

  const generalItems = useMemo(
    () => [
      {
        label: "Dashboard",
        icon: <EditIcon fontSize="small" />,
        to: "/dashboard",
        tabValue: 0,
      },
      ...(memoryGalleryEnabled
        ? [
            {
              label: "Gallery",
              icon: <CollectionsIcon fontSize="small" />,
              to: "/dashboard",
              tabValue: 1,
            },
          ]
        : []),
      {
        label: "Itinerary",
        icon: <FlightTakeoffIcon fontSize="small" />,
        to: "/dashboard",
        tabValue: 2,
      },
      {
        label: "Receipt",
        icon: <CreditCardIcon fontSize="small" />,
        to: "/dashboard",
        tabValue: 3,
      },
    ],
    [memoryGalleryEnabled],
  );

  const discoverItems = useMemo(
    () => [
      {
        label: "Explore",
        icon: <SearchRoundedIcon fontSize="small" />,
        to: "/tours",
      },
      {
        label: "Guide",
        icon: <CollectionsIcon fontSize="small" />,
        to: "/about",
      },
      {
        label: "Friends",
        icon: <FavoriteBorderIcon fontSize="small" />,
        to: "/users",
      },
    ],
    [],
  );

  const notificationItems = useMemo(
    () => [
      {
        title: `${sideTrips[0]?.title || "Your next trip"} is coming up soon`,
        subtitle: sideTrips[0]?.date || "This week",
      },
      {
        title: `${firstName}, your friends added a new trip plan`,
        subtitle: "Just now",
      },
      {
        title: "New tour ideas are ready to explore",
        subtitle: "Today",
      },
    ],
    [firstName, sideTrips],
  );

  useEffect(() => {
    setNotifications(notificationItems);
  }, [notificationItems]);

  const friendTrips = useMemo(
    () => [
      {
        name: "Riya S.",
        place: sideTrips[0]?.title || "Kuala Lumpur - Ipoh",
        note: "added this to the group plan",
        to: featuredPlan ? `/tours/${featuredPlan.id}` : "/tours",
      },
      {
        name: "Aman K.",
        place: sideTrips[1]?.title || "Sapa - Ninh Binh",
        note: "booked this trip for next month",
        to: recommendedPlaces[1]
          ? `/tours/${recommendedPlaces[1].id}`
          : "/tours",
      },
    ],
    [featuredPlan, recommendedPlaces, sideTrips],
  );

  const persistProfile = async (nextProfile, message) => {
    if (realtimeDb && nextProfile.uid) {
      await update(ref(realtimeDb, `users/${nextProfile.uid}`), nextProfile);
    }

    setProfile(nextProfile);
    dispatch({ type: "SET_USER", payload: nextProfile });
    setStatus({ severity: "success", message });
  };

  const handleFieldChange = (field) => (event) => {
    setIsEditingProfile(true);
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleResetForm = () => {
    const nextProfile = normalizeProfile(profile);
    setForm({
      firstName: nextProfile.firstName || "",
      lastName: nextProfile.lastName || "",
      email: nextProfile.pendingEmail || nextProfile.email || "",
      phoneNumber: nextProfile.phoneNumber || "",
      hobby: nextProfile.hobby || "",
      interests: (nextProfile.interests || []).join(", "),
      photoURL: nextProfile.photoURL || "",
    });
    setIsEditingProfile(false);
    setStatus({ severity: "info", message: "Unsaved changes cleared." });
  };

  const handleDeletePhoto = async () => {
    if (!user?.uid) {
      return;
    }

    setSaving(true);

    try {
      const nextProfile = normalizeProfile({
        ...profile,
        photoURL: "",
        profileUrl: "",
        imageUrl: "",
        updatedAt: new Date().toISOString(),
      });

      if (auth?.currentUser) {
        await updateProfile(auth.currentUser, {
          photoURL: null,
        });
      }

      setForm((prev) => ({ ...prev, photoURL: "" }));
      await persistProfile(nextProfile, "Profile photo removed.");
    } catch (error) {
      console.error("Error deleting photo:", error);
      setStatus({ severity: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCollectionItem = async (key, index, successMessage) => {
    if (!user?.uid) {
      return;
    }

    try {
      const nextProfile = normalizeProfile({
        ...profile,
        [key]: (profile[key] || []).filter(
          (_, itemIndex) => itemIndex !== index,
        ),
        updatedAt: new Date().toISOString(),
      });

      await persistProfile(nextProfile, successMessage);
    } catch (error) {
      console.error(`Error deleting ${key}:`, error);
      setStatus({ severity: "error", message: error.message });
    }
  };

  const handleEditCollectionItem = async (key, index) => {
    const currentItems = [...(profile[key] || [])];
    const currentItem = currentItems[index];

    if (!currentItem) {
      return;
    }

    let nextItem = currentItem;

    if (key === "upcomingTrips") {
      const title = window.prompt("Trip title", currentItem.title || "");
      if (title === null) return;
      const date = window.prompt("Departure date", currentItem.date || "");
      if (date === null) return;
      const statusValue = window.prompt(
        "Trip status",
        currentItem.status || "",
      );
      if (statusValue === null) return;

      nextItem = {
        ...currentItem,
        title: title.trim() || currentItem.title,
        date: date.trim() || currentItem.date,
        status: statusValue.trim() || currentItem.status,
      };
    }

    if (key === "paymentOptions") {
      const label = window.prompt("Payment label", currentItem.label || "");
      if (label === null) return;
      const description = window.prompt(
        "Payment description",
        currentItem.description || "",
      );
      if (description === null) return;

      nextItem = {
        ...currentItem,
        label: label.trim() || currentItem.label,
        description: description.trim() || currentItem.description,
      };
    }

    if (key === "reviews") {
      const title = window.prompt("Review title", currentItem.title || "");
      if (title === null) return;
      const text = window.prompt("Review text", currentItem.text || "");
      if (text === null) return;

      nextItem = {
        ...currentItem,
        title: title.trim() || currentItem.title,
        text: text.trim() || currentItem.text,
      };
    }

    currentItems[index] = nextItem;

    try {
      const nextProfile = normalizeProfile({
        ...profile,
        [key]: currentItems,
        updatedAt: new Date().toISOString(),
      });

      const labels = {
        upcomingTrips: "Trip",
        paymentOptions: "Payment option",
        reviews: "Review",
      };

      await persistProfile(
        nextProfile,
        `${labels[key] || "Item"} updated successfully.`,
      );
    } catch (error) {
      console.error(`Error editing ${key}:`, error);
      setStatus({ severity: "error", message: error.message });
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      setStatus({
        severity: "error",
        message: "Please choose an image smaller than 1 MB.",
      });
      event.target.value = "";
      return;
    }

    try {
      const imageUrl = await fileToDataUrl(file);
      setIsEditingProfile(true);
      setForm((prev) => ({ ...prev, photoURL: imageUrl }));
      setStatus({
        severity: "info",
        message: "Profile image selected. Click Save Profile to keep it.",
      });
    } catch (error) {
      setStatus({ severity: "error", message: "Unable to load that image." });
    }
  };

  const handleGalleryUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    try {
      const uploadedImages = await Promise.all(
        files.slice(0, 6).map(async (file, index) => ({
          id: `memory-${Date.now()}-${index}`,
          src: await fileToDataUrl(file),
          title: "",
          tripTitle: "",
          visibility: "private",
        })),
      );

      setMemoryDrafts(uploadedImages);
      setMemoryUploadOpen(true);
      event.target.value = "";
    } catch (error) {
      setStatus({ severity: "error", message: "Image upload failed." });
    }
  };

  const handleMemoryDraftChange = (index, field, value) => {
    setMemoryDrafts((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleCloseMemoryUploadModal = () => {
    if (savingMemories) {
      return;
    }

    setMemoryUploadOpen(false);
    setMemoryDrafts([]);
  };

  const handleConfirmMemoryUpload = async () => {
    if (!memoryDrafts.length) {
      setMemoryUploadOpen(false);
      return;
    }

    setSavingMemories(true);

    try {
      const nextProfile = {
        ...profile,
        gallery: [...(profile.gallery || []), ...memoryDrafts].slice(0, 8),
        updatedAt: new Date().toISOString(),
      };

      await persistProfile(
        nextProfile,
        "Memories added. Share them publicly whenever you're ready.",
      );
      setMemoryUploadOpen(false);
      setMemoryDrafts([]);
    } catch (error) {
      setStatus({ severity: "error", message: "Unable to save memories." });
    } finally {
      setSavingMemories(false);
    }
  };

  const handleToggleMemoryVisibility = async (index) => {
    if (!user?.uid) {
      return;
    }

    try {
      const nextGallery = (profile.gallery || []).map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              visibility: item.visibility === "public" ? "private" : "public",
            }
          : item,
      );

      const nextProfile = normalizeProfile({
        ...profile,
        gallery: nextGallery,
        updatedAt: new Date().toISOString(),
      });

      await persistProfile(
        nextProfile,
        nextGallery[index]?.visibility === "public"
          ? "Memory shared publicly."
          : "Memory moved to private memories.",
      );
    } catch (error) {
      console.error("Error updating memory visibility:", error);
      setStatus({ severity: "error", message: error.message });
    }
  };

  const handleRenameMemory = (index) => {
    const currentMemory = (profile.gallery || [])[index];

    if (!currentMemory) {
      return;
    }

    setEditingMemoryIndex(index);
    setMemoryEditor({
      title: currentMemory.title || `Memory ${index + 1}`,
      tripTitle: currentMemory.tripTitle || "",
      visibility: currentMemory.visibility === "public" ? "public" : "private",
    });
    setMemoryEditOpen(true);
  };

  const handleCloseMemoryEditModal = () => {
    if (savingMemories) {
      return;
    }

    setMemoryEditOpen(false);
    setEditingMemoryIndex(null);
    setMemoryEditor({
      title: "",
      tripTitle: "",
      visibility: "private",
    });
  };

  const handleSaveMemoryEdit = async () => {
    if (editingMemoryIndex === null || !user?.uid) {
      return;
    }

    setSavingMemories(true);

    try {
      const nextGallery = (profile.gallery || []).map((item, itemIndex) =>
        itemIndex === editingMemoryIndex
          ? {
              ...item,
              title:
                String(memoryEditor.title || "").trim() ||
                `Memory ${editingMemoryIndex + 1}`,
              tripTitle: String(memoryEditor.tripTitle || "").trim(),
              visibility:
                memoryEditor.visibility === "public" ? "public" : "private",
            }
          : item,
      );

      const nextProfile = normalizeProfile({
        ...profile,
        gallery: nextGallery,
        updatedAt: new Date().toISOString(),
      });

      await persistProfile(nextProfile, "Memory updated successfully.");
      handleCloseMemoryEditModal();
    } catch (error) {
      console.error("Error editing memory:", error);
      setStatus({ severity: "error", message: error.message });
    } finally {
      setSavingMemories(false);
    }
  };

  const handleOpenMemoryViewer = (memory) => {
    setViewingMemory(memory || null);
  };

  const handleCloseMemoryViewer = () => {
    setViewingMemory(null);
  };

  const handleDownloadItinerary = async (trip) => {
    const itineraryTitle = trip?.title || "Travel Itinerary";

    try {
      const details = {
        pickup: "Central Station (09:00)",
        category: "Guided - Cultural",
        duration: "1 Day",
      };
      const inclusions = ["Transport", "Lunch", "Local guide", "Entrance fees"];
      const highlights = [
        "Scenic viewpoints",
        "Local market visit",
        "Historic site tour",
        "Sunset on the ridge",
      ];
      const days = [
        {
          day: "Day 1",
          title: "Arrival & Meet",
          desc: "Meet at the station and transfer to the viewpoint. Intro and safety.",
        },
        {
          day: "Day 2",
          title: "Explore & Lunch",
          desc: "Walk through the old town, visit the market and enjoy a local lunch.",
        },
        {
          day: "Day 3",
          title: "Drive & Sunset",
          desc: "Short drive to the ridge, sunset and photos, return to dropoff.",
        },
      ];
      const thingsToPack = [
        "Comfortable shoes",
        "Water bottle",
        "Sunscreen",
        "Camera",
      ];
      const included = ["Transport", "Lunch", "Guide"];
      const excluded = ["Flights", "Personal expenses"];
      const policyRows = [
        { days: "30+ days", refund: "100%", notes: "Full refund" },
        { days: "15-29 days", refund: "50%", notes: "Half refund" },
        { days: "<15 days", refund: "No refund", notes: "No refund" },
      ];

      const detailImages = [
        trip?.photo,
        trip?.relatedTour?.photo,
        ...recommendedPlaces.map((place) => place?.photo),
        ...galleryStrip,
      ]
        .filter(Boolean)
        .filter((src, index, array) => array.indexOf(src) === index)
        .slice(0, 5);

      const loadedImages = (
        await Promise.all(detailImages.map((src) => loadImageForPdf(src)))
      ).filter(Boolean);

      const canvas = document.createElement("canvas");
      canvas.width = 1240;
      canvas.height = 2280;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("PDF export is not supported in this browser.");
      }

      ctx.fillStyle = "#f8fbff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawRoundedRect(
        ctx,
        24,
        24,
        canvas.width - 48,
        canvas.height - 48,
        24,
        "#ffffff",
        "#dbeafe",
      );
      drawRoundedRect(
        ctx,
        56,
        56,
        canvas.width - 112,
        220,
        24,
        "#eff6ff",
        "#dbeafe",
      );

      ctx.fillStyle = "#0f172a";
      ctx.font = "700 44px Arial";
      ctx.fillText(itineraryTitle, 86, 118);

      ctx.font = "22px Arial";
      ctx.fillStyle = "#475569";
      const subtitle = `${trip?.city || trip?.relatedTour?.city || "Travel destination"} • ${trip?.date || "Upcoming"}`;
      ctx.fillText(subtitle, 86, 156);

      ctx.font = "18px Arial";
      wrapCanvasText(
        ctx,
        trip?.description ||
          "A curated one-day trip with scenic stops, market walks and sunset views.",
        canvas.width - 180,
      ).forEach((line, index) => {
        ctx.fillText(line, 86, 198 + index * 28);
      });

      if (loadedImages.length) {
        const heroImage = loadedImages[0];
        ctx.drawImage(heroImage, 86, 310, 690, 360);

        loadedImages.slice(1, 5).forEach((image, index) => {
          const col = index % 2;
          const row = Math.floor(index / 2);
          ctx.drawImage(image, 804 + col * 164, 310 + row * 184, 150, 170);
        });
      } else {
        drawRoundedRect(ctx, 86, 310, 1032, 360, 18, "#eff6ff", "#bfdbfe");
        ctx.fillStyle = "#2563eb";
        ctx.font = "600 22px Arial";
        ctx.fillText("Travel detail images", 470, 500);
      }

      const drawCardTitle = (title, x, y) => {
        ctx.fillStyle = "#0f172a";
        ctx.font = "700 24px Arial";
        ctx.fillText(title, x, y);
      };

      const drawList = (items, x, y, maxWidth = 420, lineHeight = 28) => {
        let currentY = y;
        ctx.fillStyle = "#334155";
        ctx.font = "18px Arial";

        items.forEach((item) => {
          const lines = wrapCanvasText(ctx, item, maxWidth - 26);
          ctx.fillText("•", x, currentY);
          lines.forEach((line, lineIndex) => {
            ctx.fillText(line, x + 18, currentY + lineIndex * lineHeight);
          });
          currentY += lines.length * lineHeight + 4;
        });

        return currentY;
      };

      drawRoundedRect(ctx, 86, 706, 500, 190, 18, "#ffffff", "#dbeafe");
      drawCardTitle("Details", 110, 744);
      drawList(
        [
          `Pickup & Drop: ${details.pickup}`,
          `Category: ${details.category}`,
          `Duration: ${details.duration}`,
        ],
        114,
        786,
        430,
      );

      drawRoundedRect(ctx, 620, 706, 500, 190, 18, "#ffffff", "#dbeafe");
      drawCardTitle("Inclusions", 644, 744);
      drawList(inclusions, 648, 786, 430);

      drawRoundedRect(ctx, 86, 922, 500, 170, 18, "#ffffff", "#dbeafe");
      drawCardTitle("Trip Highlights", 110, 960);
      highlights.forEach((item, index) => {
        const chipX = 114 + (index % 2) * 200;
        const chipY = 992 + Math.floor(index / 2) * 42;
        drawRoundedRect(ctx, chipX, chipY, 178, 32, 16, "#eff6ff", "#bfdbfe");
        ctx.fillStyle = "#1d4ed8";
        ctx.font = "16px Arial";
        ctx.fillText(item, chipX + 12, chipY + 21);
      });

      drawRoundedRect(ctx, 620, 922, 500, 170, 18, "#ffffff", "#dbeafe");
      drawCardTitle("Things to Pack", 644, 960);
      drawList(thingsToPack, 648, 998, 420, 24);

      drawRoundedRect(ctx, 86, 1122, 1034, 430, 18, "#ffffff", "#dbeafe");
      drawCardTitle("Itinerary", 110, 1160);
      let itineraryY = 1198;
      days.forEach((item, index) => {
        const descriptionLines = wrapCanvasText(ctx, item.desc, 930);

        if (index > 0) {
          ctx.strokeStyle = "#cbd5e1";
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.moveTo(114, itineraryY - 24);
          ctx.lineTo(1090, itineraryY - 24);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.fillStyle = "#0f172a";
        ctx.font = "700 20px Arial";
        ctx.fillText(`${item.day}: ${item.title}`, 114, itineraryY);
        ctx.fillStyle = "#475569";
        ctx.font = "18px Arial";
        descriptionLines.forEach((line, lineIndex) => {
          ctx.fillText(line, 114, itineraryY + 34 + lineIndex * 26);
        });

        itineraryY += 74 + descriptionLines.length * 26 + 20;
      });

      drawRoundedRect(ctx, 86, 1540, 500, 150, 18, "#ffffff", "#dbeafe");
      drawCardTitle("Included", 110, 1578);
      drawList(included, 114, 1616, 430, 24);

      drawRoundedRect(ctx, 620, 1540, 500, 150, 18, "#ffffff", "#dbeafe");
      drawCardTitle("Excluded", 644, 1578);
      drawList(excluded, 648, 1616, 430, 24);

      drawRoundedRect(ctx, 86, 1716, 690, 252, 18, "#ffffff", "#dbeafe");
      drawCardTitle("Cancellation & Payment Terms", 110, 1754);
      ctx.fillStyle = "#0f172a";
      ctx.font = "700 16px Arial";
      ctx.fillText("Days Before", 116, 1798);
      ctx.fillText("Refund", 326, 1798);
      ctx.fillText("Notes", 490, 1798);
      ctx.strokeStyle = "#dbeafe";
      ctx.beginPath();
      ctx.moveTo(110, 1814);
      ctx.lineTo(748, 1814);
      ctx.stroke();

      ctx.font = "16px Arial";
      ctx.fillStyle = "#334155";
      policyRows.forEach((row, index) => {
        const rowY = 1844 + index * 42;
        ctx.fillText(row.days, 116, rowY);
        ctx.fillText(row.refund, 326, rowY);
        ctx.fillText(row.notes, 490, rowY);
      });

      drawRoundedRect(ctx, 804, 1716, 316, 252, 18, "#eff6ff", "#bfdbfe");
      ctx.fillStyle = "#64748b";
      ctx.font = "20px Arial";
      ctx.fillText("$299", 832, 1760);
      ctx.beginPath();
      ctx.moveTo(830, 1748);
      ctx.lineTo(890, 1748);
      ctx.strokeStyle = "#64748b";
      ctx.stroke();
      ctx.fillStyle = "#0f172a";
      ctx.font = "700 34px Arial";
      ctx.fillText("$199", 832, 1810);
      ctx.font = "18px Arial";
      ctx.fillStyle = "#64748b";
      ctx.fillText("/ person", 930, 1810);
      drawRoundedRect(ctx, 832, 1840, 120, 40, 18, "#2563eb", "#2563eb");
      drawRoundedRect(ctx, 968, 1840, 124, 40, 18, "#ffffff", "#cbd5e1");
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 15px Arial";
      ctx.fillText("Pay Now", 860, 1866);
      ctx.fillStyle = "#0f172a";
      ctx.fillText("Inquire Here", 985, 1866);

      const pdfBlob = createPdfFromJpegPages([canvasToJpegPage(canvas)]);
      const fileName = itineraryTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const fileUrl = window.URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = fileUrl;
      downloadLink.download = `${fileName || "travel-itinerary"}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(fileUrl), 1000);

      setStatus({
        severity: "success",
        message: `Itinerary PDF downloaded for ${itineraryTitle}.`,
      });
    } catch (error) {
      console.error("Error downloading itinerary PDF:", error);
      setStatus({
        severity: "error",
        message: "Unable to generate the itinerary PDF right now.",
      });
    }
  };

  const handleDownloadReceipt = async (trip, index = 0) => {
    const receiptTitle = trip?.title || "Travel Receipt";

    try {
      const amountSpent = Number(trip?.price || trip?.budget || 199);
      const serviceFee = Math.max(12, Math.round(amountSpent * 0.05));
      const taxes = Math.max(18, Math.round(amountSpent * 0.08));
      const totalPaid = amountSpent + serviceFee + taxes;
      const receiptNumber = `TLA-${String(index + 1).padStart(3, "0")}-${new Date().getFullYear()}`;

      const canvas = document.createElement("canvas");
      canvas.width = 1240;
      canvas.height = 1500;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Receipt export is not supported in this browser.");
      }

      const logoImage = await loadImageForPdf(Logo);

      ctx.fillStyle = "#f8fbff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawRoundedRect(
        ctx,
        34,
        34,
        canvas.width - 68,
        canvas.height - 68,
        24,
        "#ffffff",
        "#dbeafe",
      );
      drawRoundedRect(
        ctx,
        70,
        70,
        canvas.width - 140,
        170,
        24,
        "#eff6ff",
        "#dbeafe",
      );

      if (logoImage) {
        ctx.drawImage(logoImage, 94, 95, 62, 62);
      }

      ctx.fillStyle = "#0f172a";
      ctx.font = "700 36px Arial";
      const receiptBrandPrefix = "Travel Like ";
      ctx.fillText(receiptBrandPrefix, 178, 125);
      ctx.fillStyle = "#ff2a23";
      ctx.fillText("AP", 178 + ctx.measureText(receiptBrandPrefix).width, 125);
      ctx.font = "20px Arial";
      ctx.fillStyle = "#475569";
      ctx.fillText("Trip payment receipt", 178, 158);
      ctx.fillText(`Receipt #: ${receiptNumber}`, 178, 188);

      drawRoundedRect(ctx, 70, 268, 520, 220, 18, "#ffffff", "#dbeafe");
      drawRoundedRect(ctx, 618, 268, 552, 220, 18, "#ffffff", "#dbeafe");

      ctx.fillStyle = "#0f172a";
      ctx.font = "700 24px Arial";
      ctx.fillText("Traveler details", 98, 306);
      ctx.fillText("Trip details", 646, 306);

      ctx.font = "18px Arial";
      ctx.fillStyle = "#334155";
      [
        `Name: ${firstName}`,
        `Trip: ${receiptTitle}`,
        `Date: ${trip?.date || "Upcoming"}`,
      ].forEach((line, lineIndex) => {
        ctx.fillText(line, 102, 346 + lineIndex * 36);
      });

      [
        `Destination: ${trip?.city || trip?.relatedTour?.city || "Travel destination"}`,
        `Duration: ${trip?.status || "Custom plan"}`,
        `Payment status: Paid`,
      ].forEach((line, lineIndex) => {
        ctx.fillText(line, 650, 346 + lineIndex * 36);
      });

      if (trip?.photo) {
        const receiptImage = await loadImageForPdf(trip.photo);
        if (receiptImage) {
          drawRoundedRect(ctx, 70, 516, 1100, 270, 18, "#eff6ff", "#dbeafe");
          ctx.drawImage(receiptImage, 86, 532, 1068, 238);
        }
      }

      drawRoundedRect(ctx, 70, 818, 1100, 430, 18, "#ffffff", "#dbeafe");
      ctx.fillStyle = "#0f172a";
      ctx.font = "700 24px Arial";
      ctx.fillText("Payment summary", 98, 858);

      ctx.font = "18px Arial";
      ctx.fillStyle = "#334155";
      const summaryRows = [
        ["Trip package", `$${amountSpent}`],
        ["Service fee", `$${serviceFee}`],
        ["Taxes & charges", `$${taxes}`],
      ];

      summaryRows.forEach(([label, value], rowIndex) => {
        const rowY = 916 + rowIndex * 58;
        ctx.fillText(label, 104, rowY);
        ctx.fillText(value, 1010, rowY);
        ctx.strokeStyle = "#dbeafe";
        ctx.beginPath();
        ctx.moveTo(98, rowY + 18);
        ctx.lineTo(1142, rowY + 18);
        ctx.stroke();
      });

      ctx.fillStyle = "#0f172a";
      ctx.font = "700 28px Arial";
      ctx.fillText("Total paid", 104, 1126);
      ctx.fillText(`$${totalPaid}`, 986, 1126);

      ctx.fillStyle = "#475569";
      ctx.font = "18px Arial";
      wrapCanvasText(
        ctx,
        "Thank you for booking with Travel like AP. Keep this receipt for your records and trip support.",
        1010,
      ).forEach((line, lineIndex) => {
        ctx.fillText(line, 104, 1180 + lineIndex * 28);
      });

      const pdfBlob = createPdfFromJpegPages([canvasToJpegPage(canvas)]);
      const fileName = receiptTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const fileUrl = window.URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = fileUrl;
      downloadLink.download = `${fileName || "travel-receipt"}-receipt.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(fileUrl), 1000);

      setStatus({
        severity: "success",
        message: `Receipt downloaded for ${receiptTitle}.`,
      });
    } catch (error) {
      console.error("Error downloading receipt:", error);
      setStatus({
        severity: "error",
        message: "Unable to generate the receipt right now.",
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.uid) {
      return;
    }

    setSaving(true);

    try {
      let resolvedPhotoURL = String(form.photoURL || "").trim();
      const saveNotes = [];

      if (resolvedPhotoURL.startsWith("data:")) {
        resolvedPhotoURL = await uploadAvatarAndGetURL(
          user.uid,
          resolvedPhotoURL,
        );

        if (String(resolvedPhotoURL).startsWith("data:")) {
          saveNotes.push(
            "Photo saved in your dashboard profile. Firebase-hosted upload was skipped to avoid a browser CORS issue.",
          );
        }
      }

      const nextProfile = normalizeProfile({
        ...profile,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        displayName: [form.firstName.trim(), form.lastName.trim()]
          .filter(Boolean)
          .join(" "),
        username: [form.firstName.trim(), form.lastName.trim()]
          .filter(Boolean)
          .join(" "),
        phoneNumber: form.phoneNumber.trim(),
        hobby: form.hobby.trim(),
        interests: form.interests
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        photoURL: resolvedPhotoURL,
        profileUrl: resolvedPhotoURL,
        imageUrl: resolvedPhotoURL,
        updatedAt: new Date().toISOString(),
      });

      const safePhotoURL = getSafeFirebasePhotoURL(nextProfile.photoURL);
      let successMessage = "Profile updated successfully.";

      if (auth?.currentUser) {
        try {
          await updateProfile(auth.currentUser, {
            displayName: nextProfile.displayName || nextProfile.firstName,
            photoURL: safePhotoURL,
          });
        } catch (profileError) {
          console.warn(
            "Firebase auth profile photo update skipped:",
            profileError,
          );
          await updateProfile(auth.currentUser, {
            displayName: nextProfile.displayName || nextProfile.firstName,
          });

          if (nextProfile.photoURL) {
            saveNotes.push(
              "Photo saved in your dashboard profile, but Firebase Auth skipped the image URL to avoid a CORS/network issue.",
            );
          }
        }

        if (nextProfile.photoURL && !safePhotoURL) {
          saveNotes.push(
            "Avatar saved in your dashboard only because Firebase Auth requires a shorter hosted image URL.",
          );
        }

        const requestedEmail = form.email.trim();
        if (requestedEmail && requestedEmail !== auth.currentUser.email) {
          try {
            await verifyBeforeUpdateEmail(auth.currentUser, requestedEmail);
            nextProfile.pendingEmail = requestedEmail;
            successMessage = `Verification email sent to ${requestedEmail}. Confirm it to finish updating your email.`;
          } catch (emailError) {
            successMessage = `Profile saved, but email verification could not be sent: ${emailError.message}`;
          }
        } else {
          nextProfile.email = requestedEmail || nextProfile.email || "";
          delete nextProfile.pendingEmail;
        }
      }

      if (saveNotes.length) {
        successMessage = `${successMessage} ${saveNotes.join(" ")}`.trim();
      }

      await persistProfile(nextProfile, successMessage);
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      setStatus({ severity: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: { xs: 2, md: 3 },
        background: "linear-gradient(180deg, #eef6ff 0%, #f8fbff 100%)",
        overflowX: "hidden",
      }}
    >
      <Container
        maxWidth="xl"
        sx={{ pl: { xs: 0, sm: 2 }, pr: { xs: 1.5, sm: 2 } }}
      >
        {status.message && (
          <Alert
            severity={status.severity}
            onClose={clearStatusMessage}
            sx={{ mb: 3, borderRadius: 3 }}
          >
            {status.message}
          </Alert>
        )}

        <Grid container spacing={{ xs: 2, md: 3 }} alignItems="stretch">
          <Grid item xs={12} md={4} lg={3}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: { xs: 4, md: 5 },
                height: "100%",
                bgcolor: "#f4f8ff",
                border: "1px solid #dbeafe",
                boxShadow: "0 12px 24px rgba(59, 130, 246, 0.06)",
              }}
            >
              <Stack spacing={2.5} sx={{ height: "100%" }}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Avatar
                    src={form.photoURL || profile.photoURL || ""}
                    alt={firstName}
                    sx={{ width: 46, height: 46, bgcolor: "#2563eb" }}
                  >
                    {String(firstName).charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={700} color="#1f2937">
                      {profile.displayName || profile.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Part-time traveller
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => setIsEditingProfile((prev) => !prev)}
                  sx={{
                    borderRadius: 999,
                    bgcolor: "#2563eb",
                    textTransform: "none",
                    fontWeight: 700,
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#1d4ed8", boxShadow: "none" },
                  }}
                >
                  {isEditingProfile ? "Close editor" : "+ Edit profile"}
                </Button>
                <Box>
                  <Typography
                    variant="overline"
                    sx={{ color: "#64748b", letterSpacing: ".08em" }}
                  >
                    General
                  </Typography>
                  <Stack spacing={1}>
                    {generalItems.map((item) => (
                      <Button
                        key={item.label}
                        fullWidth
                        size="small"
                        startIcon={item.icon}
                        component={RouterLink}
                        to={item.to}
                        onClick={() => setTab(item.tabValue)}
                        sx={{
                          ...compactNavButtonSx,
                          justifyContent: "flex-start",
                          bgcolor:
                            tab === item.tabValue ? "#fff" : "transparent",
                          color: tab === item.tabValue ? "#2563eb" : "#1f2937",
                          border:
                            tab === item.tabValue
                              ? "1px solid #bfdbfe"
                              : "1px solid transparent",
                        }}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </Stack>
                </Box>

                <Box>
                  <Typography
                    variant="overline"
                    sx={{ color: "#64748b", letterSpacing: ".08em" }}
                  >
                    Discover
                  </Typography>
                  <Stack spacing={1}>
                    {discoverItems.map((item, index) => (
                      <Button
                        key={item.label}
                        fullWidth
                        size="small"
                        startIcon={item.icon}
                        component={RouterLink}
                        to={item.to}
                        onClick={() => setTab(index + 4)}
                        sx={{
                          ...compactNavButtonSx,
                          justifyContent: "flex-start",
                          bgcolor:
                            tab === index + 4 ? "#eff6ff" : "transparent",
                          color: tab === index + 4 ? "#2563eb" : "#1f2937",
                          border:
                            tab === index + 4
                              ? "1px solid #bfdbfe"
                              : "1px solid transparent",
                        }}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </Stack>
                </Box>

                <Divider sx={{ borderColor: "#dbeafe" }} />

                <Button
                  component={RouterLink}
                  to="/tours"
                  fullWidth
                  variant="text"
                  sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                    color: "#2563eb",
                    fontWeight: 700,
                    mt: "auto",
                  }}
                >
                  Explore destinations
                </Button>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8} lg={9}>
            <Stack spacing={2.5}>
              <Paper elevation={0} sx={sectionCardSx}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Box>
                    <Typography
                      variant="h4"
                      fontWeight={800}
                      sx={{
                        color: "#1c1917",
                        fontSize: { xs: "1.8rem", md: "2.25rem" },
                      }}
                    >
                      Good Morning, {firstName} 👋
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                      Plan your itinerary with us.
                    </Typography>
                  </Box>

                  <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    flexWrap="wrap"
                    alignItems="center"
                  >
                    <IconButton aria-label="Search" sx={toolbarIconButtonSx}>
                      <SearchRoundedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      aria-label="Notifications"
                      onClick={(event) =>
                        setNotificationAnchorEl(
                          showNotifications ? null : event.currentTarget,
                        )
                      }
                      sx={{
                        ...toolbarIconButtonSx,
                        bgcolor: showNotifications ? "#dbeafe" : "#f8fbff",
                        color: showNotifications ? "#1d4ed8" : "#2563eb",
                      }}
                    >
                      <Box
                        sx={{ position: "relative", display: "inline-flex" }}
                      >
                        <NotificationsNoneRoundedIcon fontSize="small" />
                        <Box
                          sx={{
                            position: "absolute",
                            top: -2,
                            right: -2,
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: "#ef4444",
                          }}
                        />
                      </Box>
                    </IconButton>
                    <IconButton
                      aria-label="Edit profile"
                      onClick={() => setIsEditingProfile((prev) => !prev)}
                      sx={{
                        ...toolbarIconButtonSx,
                        bgcolor: isEditingProfile ? "#dbeafe" : "#f8fbff",
                        color: isEditingProfile ? "#1d4ed8" : "#2563eb",
                        borderColor: isEditingProfile ? "#93c5fd" : "#dbeafe",
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveProfile}
                      disabled={saving || !isEditingProfile}
                      sx={{
                        ...compactPillButtonSx,
                        px: 1.3,
                        bgcolor: "#2563eb",
                        color: "#fff",
                        boxShadow: "none",
                        "&:hover": { bgcolor: "#1d4ed8", boxShadow: "none" },
                      }}
                    >
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </Stack>
                </Stack>

                <Popover
                  open={showNotifications}
                  anchorEl={notificationAnchorEl}
                  onClose={() => setNotificationAnchorEl(null)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                  disableScrollLock
                  slotProps={{
                    paper: {
                      sx: {
                        mt: 1,
                        width: 360,
                        maxWidth: "calc(100vw - 32px)",
                        p: 1.25,
                        borderRadius: 3,
                        border: "1px solid #dbeafe",
                        bgcolor: "#f8fbff",
                        boxShadow: "0 18px 40px rgba(37, 99, 235, 0.16)",
                        overflow: "visible",
                      },
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography fontWeight={700} sx={{ color: "#1c1917" }}>
                      Notifications
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => setNotifications([])}
                      sx={{
                        ...compactPillButtonSx,
                        color: "#2563eb",
                        minWidth: 0,
                      }}
                    >
                      Clear
                    </Button>
                  </Stack>
                  <Stack spacing={1}>
                    {notifications.length ? (
                      notifications.map((item, index) => (
                        <Box
                          key={`${item.title}-${index}`}
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            bgcolor: "#fff",
                            border: "1px solid #e0ecff",
                          }}
                        >
                          <Typography
                            fontSize="0.86rem"
                            fontWeight={600}
                            color="#1f2937"
                          >
                            {item.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.subtitle}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No new notifications.
                      </Typography>
                    )}
                  </Stack>
                </Popover>

                <Dialog
                  open={memoryUploadOpen}
                  onClose={handleCloseMemoryUploadModal}
                  fullWidth
                  maxWidth="sm"
                  PaperProps={{
                    sx: {
                      borderRadius: 3,
                      border: "1px solid #dbeafe",
                    },
                  }}
                >
                  <DialogTitle sx={{ pb: 1 }}>
                    <Typography variant="h6" fontWeight={800} color="#1c1917">
                      Add memory details
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fill in the memory name and optionally link it to a trip.
                    </Typography>
                  </DialogTitle>
                  <DialogContent dividers sx={{ borderColor: "#dbeafe" }}>
                    <Stack spacing={1.25}>
                      {memoryDrafts.map((memory, index) => (
                        <Paper
                          key={memory.id || `memory-draft-${index}`}
                          elevation={0}
                          sx={{
                            p: 1.25,
                            borderRadius: 3,
                            border: "1px solid #dbeafe",
                            bgcolor: "#f8fbff",
                          }}
                        >
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.25}
                          >
                            <Box
                              component="img"
                              src={memory.src}
                              alt={memory.title || `Memory ${index + 1}`}
                              sx={{
                                width: { xs: "100%", sm: 100 },
                                height: 100,
                                objectFit: "cover",
                                borderRadius: 2.5,
                              }}
                            />
                            <Stack spacing={1} sx={{ flex: 1 }}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Memory name"
                                value={memory.title || ""}
                                onChange={(event) =>
                                  handleMemoryDraftChange(
                                    index,
                                    "title",
                                    event.target.value,
                                  )
                                }
                              />
                              <TextField
                                select
                                fullWidth
                                size="small"
                                label="Past trip (optional)"
                                value={memory.tripTitle || ""}
                                onChange={(event) =>
                                  handleMemoryDraftChange(
                                    index,
                                    "tripTitle",
                                    event.target.value,
                                  )
                                }
                              >
                                <MenuItem value="">None</MenuItem>
                                {pastTripChoices.map((trip, tripIndex) => (
                                  <MenuItem
                                    key={`${trip.label}-${tripIndex}`}
                                    value={trip.label}
                                  >
                                    {trip.label}
                                    {trip.helper ? ` — ${trip.helper}` : ""}
                                  </MenuItem>
                                ))}
                              </TextField>
                              <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                              >
                                <LockOutlinedIcon
                                  sx={{
                                    fontSize: 16,
                                    color:
                                      memory.visibility === "public"
                                        ? "#94a3b8"
                                        : "#2563eb",
                                  }}
                                />
                                <Switch
                                  size="small"
                                  checked={memory.visibility === "public"}
                                  onChange={(event) =>
                                    handleMemoryDraftChange(
                                      index,
                                      "visibility",
                                      event.target.checked
                                        ? "public"
                                        : "private",
                                    )
                                  }
                                />
                                <PublicRoundedIcon
                                  sx={{
                                    fontSize: 16,
                                    color:
                                      memory.visibility === "public"
                                        ? "#2563eb"
                                        : "#94a3b8",
                                  }}
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {memory.visibility === "public"
                                    ? "Public"
                                    : "Private"}
                                </Typography>
                              </Stack>
                            </Stack>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </DialogContent>
                  <DialogActions sx={{ px: 2, py: 1.5 }}>
                    <Button
                      onClick={handleCloseMemoryUploadModal}
                      disabled={savingMemories}
                      sx={{ ...compactPillButtonSx }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleConfirmMemoryUpload}
                      disabled={savingMemories || !memoryDrafts.length}
                      sx={{
                        ...compactPillButtonSx,
                        bgcolor: "#2563eb",
                        color: "#fff",
                        "&:hover": { bgcolor: "#1d4ed8" },
                      }}
                    >
                      {savingMemories ? "Saving..." : "Save memories"}
                    </Button>
                  </DialogActions>
                </Dialog>

                <Dialog
                  open={memoryEditOpen}
                  onClose={handleCloseMemoryEditModal}
                  fullWidth
                  maxWidth="sm"
                  PaperProps={{
                    sx: {
                      borderRadius: 3,
                      border: "1px solid #dbeafe",
                    },
                  }}
                >
                  <DialogTitle sx={{ pb: 1 }}>
                    <Typography variant="h6" fontWeight={800} color="#1c1917">
                      Edit memory
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Update the memory details the way you want.
                    </Typography>
                  </DialogTitle>
                  <DialogContent dividers sx={{ borderColor: "#dbeafe" }}>
                    <Stack spacing={1.25}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Memory name"
                        value={memoryEditor.title}
                        onChange={(event) =>
                          setMemoryEditor((prev) => ({
                            ...prev,
                            title: event.target.value,
                          }))
                        }
                      />
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Past trip (optional)"
                        value={memoryEditor.tripTitle}
                        onChange={(event) =>
                          setMemoryEditor((prev) => ({
                            ...prev,
                            tripTitle: event.target.value,
                          }))
                        }
                      >
                        <MenuItem value="">None</MenuItem>
                        {pastTripChoices.map((trip, tripIndex) => (
                          <MenuItem
                            key={`${trip.label}-${tripIndex}`}
                            value={trip.label}
                          >
                            {trip.label}
                            {trip.helper ? ` — ${trip.helper}` : ""}
                          </MenuItem>
                        ))}
                      </TextField>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <LockOutlinedIcon
                          sx={{
                            fontSize: 16,
                            color:
                              memoryEditor.visibility === "public"
                                ? "#94a3b8"
                                : "#2563eb",
                          }}
                        />
                        <Switch
                          size="small"
                          checked={memoryEditor.visibility === "public"}
                          onChange={(event) =>
                            setMemoryEditor((prev) => ({
                              ...prev,
                              visibility: event.target.checked
                                ? "public"
                                : "private",
                            }))
                          }
                        />
                        <PublicRoundedIcon
                          sx={{
                            fontSize: 16,
                            color:
                              memoryEditor.visibility === "public"
                                ? "#2563eb"
                                : "#94a3b8",
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {memoryEditor.visibility === "public"
                            ? "Public"
                            : "Private"}
                        </Typography>
                      </Stack>
                    </Stack>
                  </DialogContent>
                  <DialogActions sx={{ px: 2, py: 1.5 }}>
                    <Button
                      onClick={handleCloseMemoryEditModal}
                      disabled={savingMemories}
                      sx={{ ...compactPillButtonSx }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSaveMemoryEdit}
                      disabled={savingMemories}
                      sx={{
                        ...compactPillButtonSx,
                        bgcolor: "#2563eb",
                        color: "#fff",
                        "&:hover": { bgcolor: "#1d4ed8" },
                      }}
                    >
                      {savingMemories ? "Saving..." : "Save changes"}
                    </Button>
                  </DialogActions>
                </Dialog>

                <Dialog
                  open={Boolean(viewingMemory)}
                  onClose={handleCloseMemoryViewer}
                  fullWidth
                  maxWidth="md"
                  PaperProps={{
                    sx: {
                      borderRadius: 3,
                      border: "1px solid #dbeafe",
                      overflow: "hidden",
                    },
                  }}
                >
                  <DialogTitle sx={{ pb: 1 }}>
                    <Typography variant="h6" fontWeight={800} color="#1c1917">
                      {viewingMemory?.title || "Memory preview"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {viewingMemory?.tripTitle
                        ? `Trip: ${viewingMemory.tripTitle}`
                        : "Your saved travel memory"}
                    </Typography>
                  </DialogTitle>
                  <DialogContent sx={{ p: 0, bgcolor: "#f8fbff" }}>
                    {viewingMemory ? (
                      <Box
                        component="img"
                        src={viewingMemory.src}
                        alt={viewingMemory.title || "Memory preview"}
                        sx={{
                          width: "100%",
                          maxHeight: "75vh",
                          objectFit: "contain",
                          display: "block",
                          bgcolor: "#ffffff",
                        }}
                      />
                    ) : null}
                  </DialogContent>
                  <DialogActions sx={{ px: 2, py: 1.5 }}>
                    <Button
                      onClick={handleCloseMemoryViewer}
                      sx={{ ...compactPillButtonSx, color: "#2563eb" }}
                    >
                      Close
                    </Button>
                  </DialogActions>
                </Dialog>

                <Box sx={storyScrollableRowSx}>
                  {storyItems.map((item, index) => (
                    <Box
                      key={`story-${index}`}
                      component={RouterLink}
                      to={item.to}
                      sx={{
                        textDecoration: "none",
                        textAlign: "center",
                        flex: "0 0 auto",
                        minWidth: { xs: 72, sm: 76 },
                      }}
                    >
                      <Avatar
                        src={item.image}
                        alt={item.label}
                        sx={{
                          width: 58,
                          height: 58,
                          border: "2px solid #2563eb",
                          bgcolor: "#fff",
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ mt: 0.75, color: "#475569", display: "block" }}
                      >
                        {item.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>

              {tabLoading && (
                <Paper elevation={0} sx={sectionCardSx}>
                  <TravellerDashboardSkeleton
                    embedded
                    variant={
                      isGalleryView
                        ? "gallery"
                        : isItineraryView
                          ? "itinerary"
                          : isReceiptView
                            ? "receipt"
                            : "overview"
                    }
                  />
                </Paper>
              )}

              {!tabLoading && isItineraryView && (
                <Paper
                  elevation={0}
                  sx={{
                    ...sectionCardSx,
                    pt: { xs: 3, md: 4 },
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={1.25}
                    sx={{ mb: 2 }}
                  >
                    <Box>
                      <Typography variant="h5" fontWeight={800} color="#1c1917">
                        Upcoming Trips
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Download your itinerary as a PDF and keep it ready
                        offline.
                      </Typography>
                    </Box>

                    <Button
                      size="small"
                      onClick={() => setTab(0)}
                      sx={{ ...compactPillButtonSx, color: "#2563eb" }}
                    >
                      Back to dashboard
                    </Button>
                  </Stack>

                  <Grid
                    container
                    spacing={{ xs: 1.5, md: 2 }}
                    sx={mobileScrollableRowSx}
                  >
                    {itineraryTrips.map((trip, index) => (
                      <Grid
                        item
                        xs={12}
                        md={6}
                        key={`${trip.title}-${index}-itinerary`}
                        sx={{ display: "flex" }}
                      >
                        <Card sx={compactTripCardSx}>
                          <Box
                            component="img"
                            src={trip.photo}
                            alt={trip.title}
                            sx={{
                              width: "100%",
                              height: { xs: 170, md: 156 },
                              objectFit: "cover",
                              bgcolor: "#dbeafe",
                            }}
                          />
                          <CardContent
                            sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}
                          >
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="flex-start"
                              spacing={1}
                            >
                              <Box>
                                <Typography fontWeight={800} color="#1c1917">
                                  {trip.title}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {trip.city || "Travel destination"} •{" "}
                                  {trip.date || "Coming soon"}
                                </Typography>
                              </Box>
                              <Chip
                                size="small"
                                label={trip.status || "Upcoming"}
                                sx={{ bgcolor: "#eff6ff", color: "#2563eb" }}
                              />
                            </Stack>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 1 }}
                            >
                              {trip.description}
                            </Typography>

                            <Stack
                              direction="row"
                              spacing={0.75}
                              useFlexGap
                              flexWrap="wrap"
                              sx={{ mt: 1.25 }}
                            >
                              <Chip
                                size="small"
                                label={`Budget $${trip.budget || trip.price || 0}`}
                              />
                              <Chip size="small" label={`⭐ ${trip.rating}`} />
                            </Stack>

                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={0.75}
                              useFlexGap
                              flexWrap="wrap"
                              sx={{ mt: 1.5 }}
                            >
                              <Button
                                size="small"
                                component={RouterLink}
                                to={trip.route}
                                sx={{
                                  ...compactPillButtonSx,
                                  color: "#2563eb",
                                }}
                              >
                                View tour
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={
                                  <DownloadRoundedIcon fontSize="small" />
                                }
                                onClick={() => handleDownloadItinerary(trip)}
                                sx={{
                                  ...compactPillButtonSx,
                                  bgcolor: "#2563eb",
                                  color: "#fff",
                                  boxShadow: "none",
                                  "&:hover": {
                                    bgcolor: "#1d4ed8",
                                    boxShadow: "none",
                                  },
                                }}
                              >
                                Download
                              </Button>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              )}

              {!tabLoading && isReceiptView && (
                <Paper elevation={0} sx={sectionCardSx}>
                  <ReceiptPanel
                    trips={itineraryTrips}
                    onBack={() => setTab(0)}
                    onDownloadReceipt={handleDownloadReceipt}
                    brandLogo={Logo}
                    brandName="Travel like AP"
                  />
                </Paper>
              )}

              {!tabLoading && isGalleryView && (
                <Paper elevation={0} sx={sectionCardSx}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={1.25}
                    sx={{ mb: 2 }}
                  >
                    <Box>
                      <Typography variant="h5" fontWeight={800} color="#1c1917">
                        My Travel Gallery
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        See all your memories in one clean full-width view.
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <IconButton
                        component="label"
                        size="small"
                        aria-label="Add memory"
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: 2.5,
                          bgcolor: "#2563eb",
                          color: "#fff",
                          border: "1px solid #bfdbfe",
                          boxShadow: "none",
                          "&:hover": { bgcolor: "#1d4ed8", boxShadow: "none" },
                        }}
                      >
                        <AddRoundedIcon fontSize="small" />
                        <input
                          hidden
                          accept="image/*"
                          multiple
                          type="file"
                          onChange={handleGalleryUpload}
                        />
                      </IconButton>
                      <Button
                        size="small"
                        onClick={() => setTab(0)}
                        sx={{ ...compactPillButtonSx, color: "#2563eb" }}
                      >
                        Back to dashboard
                      </Button>
                    </Stack>
                  </Stack>

                  <Box sx={instagramGalleryGridSx}>
                    {memories.length ? (
                      memories.map((memory, index) => {
                        const desktopHeights = [320, 430, 360, 300, 250, 340];
                        const mobileHeights = [180, 240, 210, 190];

                        return (
                          <Box
                            key={memory.id || `gallery-view-${index}`}
                            sx={instagramMemoryCardSx}
                          >
                            <Box
                              component="img"
                              src={memory.src}
                              alt={memory.title || `Memory ${index + 1}`}
                              className="memory-image"
                              onClick={() => handleOpenMemoryViewer(memory)}
                              sx={{
                                width: "100%",
                                height: {
                                  xs: mobileHeights[
                                    index % mobileHeights.length
                                  ],
                                  md: desktopHeights[
                                    index % desktopHeights.length
                                  ],
                                },
                                objectFit: "cover",
                                cursor: "pointer",
                                transition: "transform 0.35s ease",
                                "&:hover": {
                                  transform: "scale(1.03)",
                                },
                              }}
                            />

                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="flex-start"
                              sx={{
                                position: "absolute",
                                top: 10,
                                left: 10,
                                right: 10,
                                zIndex: 1,
                              }}
                            >
                              <Chip
                                size="small"
                                label={
                                  memory.tripTitle || `Memory ${index + 1}`
                                }
                                sx={{
                                  maxWidth: 150,
                                  bgcolor: "rgba(15, 23, 42, 0.62)",
                                  color: "#fff",
                                  backdropFilter: "blur(6px)",
                                  "& .MuiChip-label": {
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  },
                                }}
                              />
                              <IconButton
                                size="small"
                                aria-label={`Toggle memory ${index + 1} visibility`}
                                onClick={() =>
                                  handleToggleMemoryVisibility(index)
                                }
                                sx={{
                                  width: 30,
                                  height: 30,
                                  bgcolor: "rgba(255,255,255,0.9)",
                                  color:
                                    memory.visibility === "public"
                                      ? "#2563eb"
                                      : "#334155",
                                  "&:hover": {
                                    bgcolor: "#fff",
                                  },
                                }}
                              >
                                {memory.visibility === "public" ? (
                                  <PublicRoundedIcon sx={{ fontSize: 16 }} />
                                ) : (
                                  <LockOutlinedIcon sx={{ fontSize: 16 }} />
                                )}
                              </IconButton>
                            </Stack>

                            <Box
                              sx={{
                                position: "absolute",
                                left: 10,
                                right: 10,
                                bottom: 10,
                                zIndex: 1,
                              }}
                            >
                              <Typography
                                fontSize="0.88rem"
                                fontWeight={800}
                                color="#fff"
                                sx={{
                                  textShadow: "0 2px 10px rgba(15,23,42,0.45)",
                                }}
                              >
                                {memory.title || `Memory ${index + 1}`}
                              </Typography>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{ mt: 0.75 }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{ color: "rgba(255,255,255,0.88)" }}
                                >
                                  {memory.visibility === "public"
                                    ? "Shared"
                                    : "Private"}
                                </Typography>
                                <Stack direction="row" spacing={0.5}>
                                  <IconButton
                                    size="small"
                                    aria-label={`View memory ${index + 1}`}
                                    onClick={() =>
                                      handleOpenMemoryViewer(memory)
                                    }
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      bgcolor: "rgba(255,255,255,0.9)",
                                      color: "#2563eb",
                                      "&:hover": { bgcolor: "#fff" },
                                    }}
                                  >
                                    <VisibilityOutlinedIcon
                                      sx={{ fontSize: 16 }}
                                    />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    aria-label={`Edit memory ${index + 1}`}
                                    onClick={() => handleRenameMemory(index)}
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      bgcolor: "rgba(255,255,255,0.9)",
                                      color: "#2563eb",
                                      "&:hover": { bgcolor: "#fff" },
                                    }}
                                  >
                                    <EditIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    aria-label={`Delete memory ${index + 1}`}
                                    onClick={() =>
                                      handleDeleteCollectionItem(
                                        "gallery",
                                        index,
                                        "Memory removed from your gallery.",
                                      )
                                    }
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      bgcolor: "rgba(255,255,255,0.9)",
                                      color: "#dc2626",
                                      "&:hover": { bgcolor: "#fff" },
                                    }}
                                  >
                                    <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Stack>
                              </Stack>
                            </Box>
                          </Box>
                        );
                      })
                    ) : (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          bgcolor: "#f8fbff",
                          border: "1px dashed #bfdbfe",
                        }}
                      >
                        <Typography fontWeight={700} sx={{ color: "#1c1917" }}>
                          No memories yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Use the `+` button to start your private travel
                          gallery.
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                </Paper>
              )}

              {!tabLoading &&
                !isGalleryView &&
                !isItineraryView &&
                !isReceiptView && (
                  <>
                    {isEditingProfile && (
                      <Paper elevation={0} sx={sectionCardSx}>
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          justifyContent="space-between"
                          alignItems={{ xs: "flex-start", md: "center" }}
                          spacing={1}
                          mb={2}
                        >
                          <Box>
                            <Typography variant="h6" fontWeight={800}>
                              Quick profile edit
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Update only the details that matter right now.
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            onClick={handleResetForm}
                            sx={{ ...compactPillButtonSx }}
                          >
                            Cancel
                          </Button>
                        </Stack>

                        <Grid container spacing={1.5}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="First name"
                              value={form.firstName}
                              onChange={handleFieldChange("firstName")}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Last name"
                              value={form.lastName}
                              onChange={handleFieldChange("lastName")}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Phone number"
                              value={form.phoneNumber}
                              onChange={handleFieldChange("phoneNumber")}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Hobby"
                              value={form.hobby}
                              onChange={handleFieldChange("hobby")}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Interests"
                              value={form.interests}
                              onChange={handleFieldChange("interests")}
                              placeholder="Adventure, food, beaches"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={1}
                            >
                              <Button
                                component="label"
                                size="small"
                                variant="outlined"
                                startIcon={<PhotoCameraIcon />}
                                sx={{
                                  ...compactPillButtonSx,
                                  borderColor: "#ddd1c6",
                                  color: "#1f2937",
                                }}
                              >
                                Upload photo
                                <input
                                  hidden
                                  accept="image/*"
                                  type="file"
                                  onChange={handleAvatarUpload}
                                />
                              </Button>
                              <Button
                                size="small"
                                variant="text"
                                color="error"
                                startIcon={<DeleteOutlineIcon />}
                                onClick={handleDeletePhoto}
                                disabled={!profile.photoURL && !form.photoURL}
                                sx={{ ...compactPillButtonSx }}
                              >
                                Remove photo
                              </Button>
                            </Stack>
                          </Grid>
                        </Grid>
                      </Paper>
                    )}

                    <Grid
                      container
                      spacing={2.5}
                      sx={{
                        "& > .MuiGrid-item": {
                          pl: { xs: "0 !important", sm: undefined },
                        },
                      }}
                    >
                      <Grid item xs={12} lg={travelSnapshotEnabled ? 6 : 12}>
                        <Paper elevation={0} sx={sectionCardSx}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            mb={2}
                          >
                            <Box>
                              <Typography
                                variant="h5"
                                fontWeight={800}
                                color="#1c1917"
                              >
                                Upcoming Trip
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Remember your upcoming trips.
                              </Typography>
                            </Box>
                            <Button
                              size="small"
                              component={RouterLink}
                              to={
                                featuredPlan
                                  ? `/tours/${featuredPlan.id}`
                                  : "/tours"
                              }
                              sx={{ ...compactPillButtonSx, color: "#2563eb" }}
                            >
                              Details
                            </Button>
                          </Stack>

                          <Grid container spacing={1.5}>
                            {sideTrips.slice(0, 2).map((trip, index) => (
                              <Grid
                                item
                                xs={12}
                                sm={6}
                                key={`${trip.title}-${index}`}
                              >
                                <Card sx={compactTripCardSx}>
                                  <Box
                                    component="img"
                                    src={
                                      galleryStrip[index] || featuredPlan?.photo
                                    }
                                    alt={trip.title}
                                    sx={{
                                      width: "100%",
                                      height: { xs: 150, md: 132 },
                                      objectFit: "cover",
                                    }}
                                  />
                                  <CardContent
                                    sx={{ p: 1.4, "&:last-child": { pb: 1.4 } }}
                                  >
                                    <Typography
                                      fontWeight={700}
                                      sx={{ color: "#1c1917" }}
                                    >
                                      {trip.title}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      {trip.city || "Travel destination"}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{ color: "#64748b" }}
                                    >
                                      {trip.date} • {trip.status}
                                    </Typography>

                                    <Stack
                                      direction="row"
                                      justifyContent="space-between"
                                      alignItems="center"
                                      sx={{ mt: 1.5 }}
                                    >
                                      <Typography
                                        fontSize="0.82rem"
                                        fontWeight={700}
                                      >
                                        Budget: ${trip.budget || 990}
                                      </Typography>
                                      <Stack direction="row" spacing={0.5}>
                                        <Button
                                          size="small"
                                          onClick={() =>
                                            handleEditCollectionItem(
                                              "upcomingTrips",
                                              index,
                                            )
                                          }
                                          sx={{
                                            ...compactPillButtonSx,
                                            minWidth: 0,
                                            px: 1,
                                          }}
                                        >
                                          Edit
                                        </Button>
                                        <Button
                                          size="small"
                                          color="error"
                                          onClick={() =>
                                            handleDeleteCollectionItem(
                                              "upcomingTrips",
                                              index,
                                              "Trip removed from your dashboard.",
                                            )
                                          }
                                          sx={{
                                            ...compactPillButtonSx,
                                            minWidth: 0,
                                            px: 1,
                                          }}
                                        >
                                          Delete
                                        </Button>
                                      </Stack>
                                    </Stack>
                                  </CardContent>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>
                        </Paper>
                      </Grid>

                      {travelSnapshotEnabled && (
                        <Grid item xs={12} lg={6}>
                          <Paper elevation={0} sx={sectionCardSx}>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="flex-start"
                              mb={2}
                            >
                              <Box>
                                <Typography
                                  variant="h5"
                                  fontWeight={800}
                                  color="#1c1917"
                                >
                                  Travel Snapshot
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Check in on your next dream locations.
                                </Typography>
                              </Box>
                              <Button
                                size="small"
                                component={RouterLink}
                                to="/tours"
                                sx={{
                                  ...compactPillButtonSx,
                                  color: "#2563eb",
                                }}
                              >
                                Expand
                              </Button>
                            </Stack>

                            <Stack spacing={1.1} sx={{ mt: 0.5 }}>
                              {friendTrips.map((trip) => (
                                <Paper
                                  key={`${trip.name}-${trip.place}`}
                                  elevation={0}
                                  sx={{
                                    p: 1.1,
                                    borderRadius: 3,
                                    border: "1px solid #dbeafe",
                                    bgcolor: "#f8fbff",
                                  }}
                                >
                                  <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    spacing={1}
                                  >
                                    <Box>
                                      <Typography
                                        fontSize="0.88rem"
                                        fontWeight={700}
                                        color="#1c1917"
                                      >
                                        {trip.name}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        display="block"
                                      >
                                        {trip.note}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        sx={{ color: "#2563eb" }}
                                      >
                                        {trip.place}
                                      </Typography>
                                    </Box>
                                    <Button
                                      size="small"
                                      component={RouterLink}
                                      to={trip.to}
                                      variant="contained"
                                      sx={{
                                        ...compactPillButtonSx,
                                        alignSelf: "center",
                                        bgcolor: "#2563eb",
                                        color: "#fff",
                                        boxShadow: "none",
                                        "&:hover": {
                                          bgcolor: "#1d4ed8",
                                          boxShadow: "none",
                                        },
                                      }}
                                    >
                                      Join now
                                    </Button>
                                  </Stack>
                                </Paper>
                              ))}
                            </Stack>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>

                    <Grid
                      container
                      spacing={2.5}
                      sx={{
                        "& > .MuiGrid-item": {
                          pl: { xs: "0 !important", sm: undefined },
                        },
                      }}
                    >
                      <Grid item xs={12} lg={7}>
                        <Paper elevation={0} sx={sectionCardSx}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            mb={2}
                          >
                            <Box>
                              <Typography
                                variant="h5"
                                fontWeight={800}
                                color="#1c1917"
                              >
                                For your next trip
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                These are easy wins you can plan right now.
                              </Typography>
                            </Box>
                            <Button
                              component={RouterLink}
                              to="/tours"
                              size="small"
                              sx={{ ...compactPillButtonSx, color: "#2563eb" }}
                            >
                              View all
                            </Button>
                          </Stack>

                          <Stack spacing={1.2}>
                            {recommendedPlaces.slice(0, 2).map((place) => (
                              <Paper
                                key={place.id}
                                component={RouterLink}
                                to={`/tours/${place.id}`}
                                elevation={0}
                                sx={{
                                  p: 1.2,
                                  borderRadius: 3,
                                  border: "1px solid #dbeafe",
                                  textDecoration: "none",
                                  color: "inherit",
                                  display: "block",
                                }}
                              >
                                <Stack
                                  direction={{ xs: "column", sm: "row" }}
                                  spacing={1.5}
                                >
                                  <Box
                                    component="img"
                                    src={place.photo}
                                    alt={place.title}
                                    sx={{
                                      width: { xs: "100%", sm: 120 },
                                      height: 100,
                                      objectFit: "cover",
                                      borderRadius: 2.5,
                                    }}
                                  />
                                  <Box sx={{ flex: 1 }}>
                                    <Typography
                                      fontWeight={700}
                                      sx={{ color: "#1c1917" }}
                                    >
                                      {place.title}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{ mt: 0.25 }}
                                    >
                                      {place.city} • ⭐ {place.avgRating}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                      sx={{ mt: 0.5 }}
                                    >
                                      Budget-friendly pick for a short escape.
                                    </Typography>
                                    <Stack
                                      direction="row"
                                      spacing={0.75}
                                      useFlexGap
                                      flexWrap="wrap"
                                      sx={{ mt: 1 }}
                                    >
                                      {[place.city, "Culture", "Weekend"].map(
                                        (tag) => (
                                          <Chip
                                            key={`${place.id}-${tag}`}
                                            label={tag}
                                            size="small"
                                            sx={{ bgcolor: "#f7f1eb" }}
                                          />
                                        ),
                                      )}
                                    </Stack>
                                  </Box>
                                  <Typography
                                    fontWeight={700}
                                    sx={{ color: "#2563eb" }}
                                  >
                                    ${place.price}
                                  </Typography>
                                </Stack>
                              </Paper>
                            ))}
                          </Stack>
                        </Paper>
                      </Grid>

                      {memoryGalleryEnabled && (
                        <Grid item xs={12} lg={5}>
                          <Paper elevation={0} sx={sectionCardSx}>
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              justifyContent="space-between"
                              alignItems={{ xs: "flex-start", sm: "center" }}
                              spacing={1.25}
                              sx={{ mb: 1.5 }}
                            >
                              <Box>
                                <Typography
                                  variant="h5"
                                  fontWeight={800}
                                  color="#1c1917"
                                >
                                  Memories Gallery
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Add memories and choose if they stay public or
                                  private.
                                </Typography>
                              </Box>

                              <Stack
                                direction="row"
                                spacing={0.75}
                                alignItems="center"
                              >
                                <IconButton
                                  component="label"
                                  size="small"
                                  aria-label="Add memory"
                                  sx={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: 2.5,
                                    bgcolor: "#2563eb",
                                    color: "#fff",
                                    border: "1px solid #bfdbfe",
                                    boxShadow: "none",
                                    "&:hover": {
                                      bgcolor: "#1d4ed8",
                                      boxShadow: "none",
                                    },
                                  }}
                                >
                                  <AddRoundedIcon fontSize="small" />
                                  <input
                                    hidden
                                    accept="image/*"
                                    multiple
                                    type="file"
                                    onChange={handleGalleryUpload}
                                  />
                                </IconButton>
                                <Button
                                  size="small"
                                  startIcon={
                                    <OpenInFullRoundedIcon fontSize="small" />
                                  }
                                  onClick={() => setTab(1)}
                                  sx={{
                                    ...compactPillButtonSx,
                                    color: "#2563eb",
                                    border: "1px solid #dbeafe",
                                    bgcolor: "#f8fbff",
                                  }}
                                >
                                  Expand
                                </Button>
                              </Stack>
                            </Stack>

                            <Box
                              sx={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(2, minmax(0, 1fr))",
                                gap: 1,
                              }}
                            >
                              {memories.length ? (
                                memories.slice(0, 4).map((memory, index) => (
                                  <Box
                                    key={memory.id || `memory-card-${index}`}
                                    sx={{
                                      position: "relative",
                                      minHeight: index === 0 ? 180 : 130,
                                      borderRadius: 2.5,
                                      overflow: "hidden",
                                      border: "1px solid #dbeafe",
                                      bgcolor: "#ffffff",
                                    }}
                                  >
                                    <Box
                                      component="img"
                                      src={memory.src}
                                      alt={`Memory ${index + 1}`}
                                      onClick={() =>
                                        handleOpenMemoryViewer(memory)
                                      }
                                      sx={{
                                        width: "100%",
                                        height: "100%",
                                        minHeight: index === 0 ? 180 : 130,
                                        objectFit: "cover",
                                        cursor: "pointer",
                                      }}
                                    />
                                    <Box
                                      sx={{
                                        position: "absolute",
                                        inset: 0,
                                        background:
                                          "linear-gradient(180deg, rgba(15,23,42,0.08) 0%, rgba(15,23,42,0.6) 100%)",
                                        p: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                      }}
                                    >
                                      <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="flex-start"
                                      >
                                        <Chip
                                          size="small"
                                          label={
                                            memory.visibility === "public"
                                              ? "Public"
                                              : "Private"
                                          }
                                          sx={{
                                            height: 22,
                                            bgcolor: "rgba(255,255,255,0.88)",
                                          }}
                                        />
                                        <IconButton
                                          size="small"
                                          onClick={() =>
                                            handleToggleMemoryVisibility(index)
                                          }
                                          sx={{
                                            width: 26,
                                            height: 26,
                                            bgcolor: "rgba(255,255,255,0.88)",
                                            color: "#2563eb",
                                          }}
                                        >
                                          {memory.visibility === "public" ? (
                                            <PublicRoundedIcon
                                              sx={{ fontSize: 15 }}
                                            />
                                          ) : (
                                            <LockOutlinedIcon
                                              sx={{ fontSize: 15 }}
                                            />
                                          )}
                                        </IconButton>
                                      </Stack>

                                      <Typography
                                        fontSize="0.78rem"
                                        fontWeight={700}
                                        color="#fff"
                                        sx={{
                                          textShadow:
                                            "0 2px 8px rgba(15,23,42,0.5)",
                                        }}
                                      >
                                        {memory.title || `Memory ${index + 1}`}
                                      </Typography>
                                    </Box>
                                  </Box>
                                ))
                              ) : (
                                <Paper
                                  elevation={0}
                                  sx={{
                                    p: 2,
                                    borderRadius: 3,
                                    bgcolor: "#f8fbff",
                                    border: "1px dashed #bfdbfe",
                                    gridColumn: "1 / -1",
                                  }}
                                >
                                  <Typography
                                    fontWeight={700}
                                    sx={{ color: "#1c1917" }}
                                  >
                                    No memories yet
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 0.5 }}
                                  >
                                    Upload your favorite moments here. Keep them
                                    private or share them publicly later.
                                  </Typography>
                                </Paper>
                              )}
                            </Box>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  </>
                )}
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default UserDashboard;

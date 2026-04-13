import React, { useContext, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Alert,
  Badge,
  Button,
  Col,
  Container,
  Form,
  FormGroup,
  Input,
  Label,
  Row,
  Spinner,
} from "reactstrap";
import {
  get as getDbValue,
  ref as dbRef,
  update as updateDb,
} from "firebase/database";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import CommonSection from "../shared/CommonSection";
import Newsletter from "../shared/Newsletter";
import TourCard from "../shared/TourCard";
import Gallery from "../components/TourDetails/Gallery";
import DetailsCard from "../components/TourDetails/DetailsCard";
import InclusionCard from "../components/TourDetails/InclusionCard";
import Highlights from "../components/TourDetails/Highlights";
import Itinerary from "../components/TourDetails/Itinerary";
import Packing from "../components/TourDetails/Packing";
import InclusionExclusion from "../components/TourDetails/InclusionExclusion";
import PolicyTable from "../components/TourDetails/PolicyTable";
import GuestReviews from "../components/TourDetails/GuestReviews";
import PriceCard from "../components/TourDetails/PriceCard";
import PolicyContentManager from "../components/Admin/PolicyContentManager";
import { AuthContext } from "../context/AuthContext";
import { APP_CONFIG, FEATURE_FLAGS } from "../config/featureFlags";
import useTours from "../hooks/useTours";
import { realtimeDb, storage } from "../utils/firebaseConfig";
import {
  createEmptyTour,
  deleteTourFromFirebase,
  formatPrice,
  formatTourDateRange,
  formStateToTour,
  saveTourToFirebase,
  tourToFormState,
} from "../utils/tourSchema";
import "../styles/admin-portal.css";

const previewModes = [
  { value: "card", label: "Card preview" },
  { value: "details", label: "Details preview" },
];

const MAX_TOUR_IMAGE_SIZE = 5 * 1024 * 1024;
const RESOLVED_INQUIRY_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

const mergeUniqueImageUrls = (...groups) =>
  Array.from(
    new Set(
      groups
        .flat()
        .map((item) => String(item || "").trim())
        .filter(Boolean),
    ),
  );

const createEmptyCouponForm = () => ({
  code: "",
  type: "flat",
  value: "",
  description: "",
  active: false,
  expiresAt: "",
  targetUserUid: "",
  targetUserLabel: "",
});

const createEmptyHomeGalleryForm = () => ({
  image: "",
  location: "",
  caption: "",
  likes: "",
  comments: "",
});

const normalizeHomeGalleryItems = (items = []) => {
  const source = Array.isArray(items) ? items : Object.values(items || {});

  return source
    .map((item, index) => ({
      id: String(item?.id || `gallery-${index}`),
      image: String(item?.image || item?.src || item?.photo || "").trim(),
      location: String(item?.location || item?.place || "").trim(),
      caption: String(item?.caption || item?.comment || "").trim(),
      likes: String(item?.likes || "").trim(),
      comments: String(item?.comments || item?.commentCount || "").trim(),
    }))
    .filter((item) => item.image);
};

const normalizeInquiryItems = (items = {}) =>
  Object.entries(items || {})
    .map(([id, entry]) => ({
      id: String(entry?.id || id),
      name: String(entry?.name || "").trim(),
      email: String(entry?.email || "").trim(),
      phone: String(entry?.phone || "").trim(),
      source: String(entry?.source || "contact-us").trim(),
      tourTitle: String(entry?.tourTitle || "").trim(),
      tourCity: String(entry?.tourCity || "").trim(),
      message: String(entry?.message || "").trim(),
      status:
        String(entry?.status || "new")
          .trim()
          .toLowerCase() === "resolved"
          ? "resolved"
          : "new",
      createdAt: String(entry?.createdAt || "").trim(),
      resolvedAt: String(entry?.resolvedAt || "").trim(),
      deleteAfterAt: String(entry?.deleteAfterAt || "").trim(),
    }))
    .sort((left, right) => {
      const leftTime = Date.parse(left.createdAt || "") || 0;
      const rightTime = Date.parse(right.createdAt || "") || 0;

      return rightTime - leftTime;
    });

const AdminPortal = () => {
  const { user, userRole, dispatch } = useContext(AuthContext);
  const { tours, loading, source } = useTours();
  const [form, setForm] = useState(() => tourToFormState(createEmptyTour()));
  const [selectedTourId, setSelectedTourId] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [status, setStatus] = useState(null);
  const [previewMode, setPreviewMode] = useState("card");
  const [portalUsers, setPortalUsers] = useState([]);
  const [portalUsersLoading, setPortalUsersLoading] = useState(false);
  const [homeGalleryItems, setHomeGalleryItems] = useState([]);
  const [homeGalleryLoading, setHomeGalleryLoading] = useState(false);
  const [savingHomeGallery, setSavingHomeGallery] = useState(false);
  const [uploadingHomeGalleryImage, setUploadingHomeGalleryImage] =
    useState(false);
  const [homeGalleryForm, setHomeGalleryForm] = useState(() =>
    createEmptyHomeGalleryForm(),
  );
  const [inquiries, setInquiries] = useState([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [updatingInquiryId, setUpdatingInquiryId] = useState("");
  const [inquirySourceFilter, setInquirySourceFilter] = useState("all");
  const [inquirySearch, setInquirySearch] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [promotingEmail, setPromotingEmail] = useState("");
  const [adminView, setAdminView] = useState("tours");

  const isAdminUser = String(userRole || "").toLowerCase() === "admin";
  const canOpenPortal =
    Boolean(user) && FEATURE_FLAGS.adminTourPortal && isAdminUser;
  const normalizedAdminEmail = String(adminEmail || "")
    .trim()
    .toLowerCase();
  const selectedAdminTarget = useMemo(
    () =>
      portalUsers.find(
        (entry) =>
          String(entry.email || "")
            .trim()
            .toLowerCase() === normalizedAdminEmail,
      ) || null,
    [normalizedAdminEmail, portalUsers],
  );
  const currentPreviewTour = useMemo(() => formStateToTour(form), [form]);
  const normalizedInquirySearch = String(inquirySearch || "")
    .trim()
    .toLowerCase();
  const filteredInquiries = useMemo(
    () =>
      inquiries.filter((item) => {
        const matchesSource =
          inquirySourceFilter === "all" ||
          String(item.source || "contact-us") === inquirySourceFilter;

        if (!matchesSource) {
          return false;
        }

        if (!normalizedInquirySearch) {
          return true;
        }

        const searchText = [
          item.name,
          item.email,
          item.phone,
          item.message,
          item.tourTitle,
          item.tourCity,
          item.source,
        ]
          .map((value) => String(value || "").toLowerCase())
          .join(" ");

        return searchText.includes(normalizedInquirySearch);
      }),
    [inquiries, inquirySourceFilter, normalizedInquirySearch],
  );
  const unresolvedInquiries = useMemo(
    () => filteredInquiries.filter((item) => item.status !== "resolved"),
    [filteredInquiries],
  );
  const resolvedInquiries = useMemo(
    () => filteredInquiries.filter((item) => item.status === "resolved"),
    [filteredInquiries],
  );
  const previewDateLabel = formatTourDateRange(
    currentPreviewTour.startDate,
    currentPreviewTour.endDate,
    currentPreviewTour.details?.dateRange,
  );
  const couponForms =
    Array.isArray(form.couponList) && form.couponList.length
      ? form.couponList
      : [createEmptyCouponForm()];

  useEffect(() => {
    if (!selectedTourId && !isCreatingNew && tours.length) {
      const firstTour = tours[0];
      setSelectedTourId(firstTour.id || firstTour._id);
      setForm(tourToFormState(firstTour));
    }
  }, [isCreatingNew, selectedTourId, tours]);

  useEffect(() => {
    let active = true;

    const loadPortalUsers = async () => {
      if (active) {
        setPortalUsersLoading(true);
      }

      if (!realtimeDb) {
        if (active) {
          setPortalUsers([]);
          setPortalUsersLoading(false);
        }
        return;
      }

      try {
        const snapshot = await getDbValue(dbRef(realtimeDb, "users"));

        if (!active) {
          return;
        }

        if (!snapshot.exists()) {
          setPortalUsers([]);
          return;
        }

        const nextUsers = Object.entries(snapshot.val())
          .map(([uid, entry]) => {
            const fullName = [entry?.firstName, entry?.lastName]
              .map((item) => String(item || "").trim())
              .filter(Boolean)
              .join(" ");
            const displayName =
              fullName ||
              String(
                entry?.displayName ||
                  entry?.username ||
                  String(entry?.email || "").split("@")[0] ||
                  "Traveler",
              ).trim();
            const email = String(entry?.email || "").trim();
            const role =
              String(entry?.role || "user")
                .trim()
                .toLowerCase() === "admin"
                ? "admin"
                : "user";

            return {
              uid,
              displayName,
              email,
              role,
              label: email ? `${displayName} (${email})` : displayName,
            };
          })
          .sort((left, right) => {
            if (left.role !== right.role) {
              return left.role === "admin" ? -1 : 1;
            }

            return left.label.localeCompare(right.label);
          });

        setPortalUsers(nextUsers);
      } catch (error) {
        console.warn("Unable to load portal users:", error);
        if (active) {
          setPortalUsers([]);
        }
      } finally {
        if (active) {
          setPortalUsersLoading(false);
        }
      }
    };

    loadPortalUsers();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadInquiries = async () => {
      if (active) {
        setInquiriesLoading(true);
      }

      if (!realtimeDb) {
        if (active) {
          setInquiries([]);
          setInquiriesLoading(false);
        }
        return;
      }

      try {
        const snapshot = await getDbValue(dbRef(realtimeDb, "inquiries"));
        const rawInquiries = snapshot.exists() ? snapshot.val() : {};

        if (snapshot.exists()) {
          const cleanupPayload = Object.entries(rawInquiries).reduce(
            (accumulator, [id, entry]) => {
              const status = String(entry?.status || "new")
                .trim()
                .toLowerCase();
              const deleteAfterTime = Date.parse(
                String(entry?.deleteAfterAt || "").trim(),
              );

              if (
                status === "resolved" &&
                Number.isFinite(deleteAfterTime) &&
                deleteAfterTime > 0 &&
                deleteAfterTime <= Date.now()
              ) {
                accumulator[id] = null;
              }

              return accumulator;
            },
            {},
          );

          if (Object.keys(cleanupPayload).length) {
            await updateDb(dbRef(realtimeDb, "inquiries"), cleanupPayload);
            Object.keys(cleanupPayload).forEach((id) => {
              delete rawInquiries[id];
            });
          }
        }

        if (!active) {
          return;
        }

        setInquiries(normalizeInquiryItems(rawInquiries));
      } catch (error) {
        console.warn("Unable to load inquiries:", error);
        if (active) {
          setInquiries([]);
        }
      } finally {
        if (active) {
          setInquiriesLoading(false);
        }
      }
    };

    loadInquiries();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadHomeGallery = async () => {
      if (active) {
        setHomeGalleryLoading(true);
      }

      if (!realtimeDb) {
        if (active) {
          setHomeGalleryItems([]);
          setHomeGalleryLoading(false);
        }
        return;
      }

      try {
        const snapshot = await getDbValue(
          dbRef(realtimeDb, "siteContent/homeGallery"),
        );

        if (!active) {
          return;
        }

        setHomeGalleryItems(
          snapshot.exists() ? normalizeHomeGalleryItems(snapshot.val()) : [],
        );
      } catch (error) {
        console.warn("Unable to load homepage gallery:", error);
        if (active) {
          setHomeGalleryItems([]);
        }
      } finally {
        if (active) {
          setHomeGalleryLoading(false);
        }
      }
    };

    loadHomeGallery();

    return () => {
      active = false;
    };
  }, []);

  const handleFieldChange = ({ target }) => {
    const { name, value, type, checked } = target;

    if (
      name === "couponOneTargetUserUid" ||
      name === "couponTwoTargetUserUid"
    ) {
      const labelField =
        name === "couponOneTargetUserUid"
          ? "couponOneTargetUserLabel"
          : "couponTwoTargetUserLabel";
      const selectedUser = portalUsers.find((entry) => entry.uid === value);

      setForm((prev) => ({
        ...prev,
        [name]: value,
        [labelField]: selectedUser?.label || "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCouponChange = (index, field, value) => {
    setForm((prev) => {
      const nextCouponList =
        Array.isArray(prev.couponList) && prev.couponList.length
          ? [...prev.couponList]
          : [createEmptyCouponForm()];
      const nextCoupon = {
        ...createEmptyCouponForm(),
        ...(nextCouponList[index] || {}),
      };

      nextCoupon[field] =
        field === "code" ? String(value || "").toUpperCase() : value;

      if (field === "targetUserUid") {
        const selectedUser = portalUsers.find((entry) => entry.uid === value);
        nextCoupon.targetUserLabel = selectedUser?.label || "";
      }

      nextCouponList[index] = nextCoupon;

      return {
        ...prev,
        couponList: nextCouponList,
      };
    });
  };

  const handleAddCouponForm = () => {
    setForm((prev) => ({
      ...prev,
      couponList: [
        ...(Array.isArray(prev.couponList) ? prev.couponList : []),
        createEmptyCouponForm(),
      ],
    }));
  };

  const handleRemoveCouponForm = (index) => {
    setForm((prev) => {
      const nextCouponList = (
        Array.isArray(prev.couponList) ? prev.couponList : []
      ).filter((_, couponIndex) => couponIndex !== index);

      return {
        ...prev,
        couponList: nextCouponList.length
          ? nextCouponList
          : [createEmptyCouponForm()],
      };
    });
  };

  const uploadImageToFirebase = async (file, folder) => {
    if (!file) {
      return "";
    }

    if (!storage) {
      throw new Error("Firebase Storage is not configured for image uploads.");
    }

    if (!String(file.type || "").startsWith("image/")) {
      throw new Error("Please choose a valid image file.");
    }

    if (file.size > MAX_TOUR_IMAGE_SIZE) {
      throw new Error("Please upload images smaller than 5MB.");
    }

    const safeTitle =
      String(form.title || "tour")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "tour";
    const extension =
      String(file.name || "jpg")
        .split(".")
        .pop()
        ?.toLowerCase() || "jpg";
    const imageRef = storageRef(
      storage,
      `tours/${user?.uid || "admin"}/${folder}/${safeTitle}-${Date.now()}.${extension}`,
    );

    await uploadBytes(imageRef, file);
    return getDownloadURL(imageRef);
  };

  const handleCoverImageUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUploadingCover(true);
      const imageUrl = await uploadImageToFirebase(file, "cover");

      setForm((prev) => {
        const existingUrls = prev.galleryText
          ? prev.galleryText.split(/\r?\n/).filter(Boolean)
          : [];
        const mergedUrls = mergeUniqueImageUrls(imageUrl, existingUrls);

        return {
          ...prev,
          photo: imageUrl,
          galleryText: mergedUrls.join("\n"),
        };
      });
      setStatus({
        color: "success",
        text: "Cover image uploaded to Firebase Storage.",
      });
    } catch (error) {
      setStatus({
        color: "danger",
        text: error?.message || "Unable to upload the cover image.",
      });
    } finally {
      setUploadingCover(false);
      event.target.value = "";
    }
  };

  const handleGalleryImagesUpload = async (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    try {
      setUploadingGallery(true);
      const uploadedUrls = await Promise.all(
        files.map((file) => uploadImageToFirebase(file, "gallery")),
      );

      setForm((prev) => {
        const existingUrls = prev.galleryText
          ? prev.galleryText.split(/\r?\n/).filter(Boolean)
          : [];
        const mergedUrls = mergeUniqueImageUrls(existingUrls, uploadedUrls);

        return {
          ...prev,
          photo: prev.photo || mergedUrls[0] || "",
          galleryText: mergedUrls.join("\n"),
        };
      });
      setStatus({
        color: "success",
        text: `${uploadedUrls.length} image${uploadedUrls.length > 1 ? "s" : ""} uploaded to Firebase Storage.`,
      });
    } catch (error) {
      setStatus({
        color: "danger",
        text: error?.message || "Unable to upload gallery images.",
      });
    } finally {
      setUploadingGallery(false);
      event.target.value = "";
    }
  };

  const handleHomeGalleryFieldChange = ({ target }) => {
    const { name, value } = target;

    setHomeGalleryForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const syncHomeGalleryItems = async (nextItems, successText) => {
    if (!realtimeDb) {
      throw new Error("Firebase is not configured for homepage gallery.");
    }

    const normalizedItems = normalizeHomeGalleryItems(nextItems);

    await updateDb(dbRef(realtimeDb, "siteContent"), {
      homeGallery: normalizedItems,
      updatedAt: new Date().toISOString(),
    });

    setHomeGalleryItems(normalizedItems);
    setStatus({
      color: "success",
      text: successText,
    });
  };

  const handleHomeGalleryImageUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUploadingHomeGalleryImage(true);
      const imageUrl = await uploadImageToFirebase(file, "home-gallery");

      setHomeGalleryForm((prev) => ({
        ...prev,
        image: imageUrl,
      }));
      setStatus({
        color: "success",
        text: "Gallery image uploaded. Add the place, caption, likes, and comments to publish it.",
      });
    } catch (error) {
      setStatus({
        color: "danger",
        text: error?.message || "Unable to upload that gallery image.",
      });
    } finally {
      setUploadingHomeGalleryImage(false);
      event.target.value = "";
    }
  };

  const handleSaveHomeGalleryItem = async (event) => {
    event.preventDefault();

    if (!canOpenPortal) {
      setStatus({
        color: "warning",
        text: "Only admins can manage the homepage gallery.",
      });
      return;
    }

    const nextItem = {
      id: `gallery-${Date.now()}`,
      image: String(homeGalleryForm.image || "").trim(),
      location: String(homeGalleryForm.location || "").trim(),
      caption: String(homeGalleryForm.caption || "").trim(),
      likes: String(homeGalleryForm.likes || "0").trim(),
      comments: String(homeGalleryForm.comments || "0").trim(),
    };

    if (!nextItem.image || !nextItem.location || !nextItem.caption) {
      setStatus({
        color: "warning",
        text: "Add an image, place name, and caption before saving the gallery card.",
      });
      return;
    }

    try {
      setSavingHomeGallery(true);
      await syncHomeGalleryItems(
        [nextItem, ...homeGalleryItems],
        "Homepage gallery updated successfully.",
      );
      setHomeGalleryForm(createEmptyHomeGalleryForm());
    } catch (error) {
      setStatus({
        color: "danger",
        text: error?.message || "Unable to save that gallery card right now.",
      });
    } finally {
      setSavingHomeGallery(false);
    }
  };

  const handleDeleteHomeGalleryItem = async (itemId) => {
    if (!itemId) {
      return;
    }

    const confirmed = window.confirm(
      "Remove this homepage gallery card from Firebase?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setSavingHomeGallery(true);
      await syncHomeGalleryItems(
        homeGalleryItems.filter((item) => item.id !== itemId),
        "Gallery card removed from the homepage.",
      );
    } catch (error) {
      setStatus({
        color: "danger",
        text: error?.message || "Unable to remove that gallery card right now.",
      });
    } finally {
      setSavingHomeGallery(false);
    }
  };

  const handleUpdateInquiryStatus = async (inquiryId, nextStatus) => {
    if (!inquiryId || !realtimeDb) {
      return;
    }

    const normalizedStatus =
      String(nextStatus || "new")
        .trim()
        .toLowerCase() === "resolved"
        ? "resolved"
        : "new";

    try {
      setUpdatingInquiryId(inquiryId);
      const nowIso = new Date().toISOString();
      const deleteAfterIso = new Date(
        Date.now() + RESOLVED_INQUIRY_RETENTION_MS,
      ).toISOString();
      await updateDb(dbRef(realtimeDb, `inquiries/${inquiryId}`), {
        status: normalizedStatus,
        updatedAt: nowIso,
        resolvedAt: normalizedStatus === "resolved" ? nowIso : null,
        deleteAfterAt: normalizedStatus === "resolved" ? deleteAfterIso : null,
      });

      setInquiries((prev) =>
        prev.map((item) =>
          item.id === inquiryId
            ? {
                ...item,
                status: normalizedStatus,
                resolvedAt: normalizedStatus === "resolved" ? nowIso : "",
                deleteAfterAt:
                  normalizedStatus === "resolved" ? deleteAfterIso : "",
              }
            : item,
        ),
      );
      setStatus({
        color: "success",
        text:
          normalizedStatus === "resolved"
            ? "Inquiry marked as resolved. It will be deleted automatically after 7 days."
            : "Inquiry marked as new.",
      });
    } catch (error) {
      setStatus({
        color: "danger",
        text: error?.message || "Unable to update inquiry status right now.",
      });
    } finally {
      setUpdatingInquiryId("");
    }
  };

  const handleSelectTour = (tour) => {
    const nextForm = tourToFormState(tour);

    setIsCreatingNew(false);
    setSelectedTourId(tour.id || tour._id);
    setForm(nextForm);
    setStatus(null);
  };

  const handleCreateNew = () => {
    const nextForm = tourToFormState(createEmptyTour());

    setIsCreatingNew(true);
    setSelectedTourId("");
    setForm(nextForm);
    setStatus({ color: "info", text: "Started a fresh tour draft." });
  };

  const handleSaveTour = async (event) => {
    event.preventDefault();

    if (!canOpenPortal) {
      setStatus({
        color: "warning",
        text: "Only admins can manage tours in Firebase.",
      });
      return;
    }

    try {
      setSaving(true);
      const savedTour = await saveTourToFirebase(formStateToTour(form), {
        editorUid: user?.uid || "admin-preview",
        forceCreateNew: isCreatingNew || !selectedTourId,
      });
      setIsCreatingNew(false);
      setSelectedTourId(savedTour.id);
      setForm(tourToFormState(savedTour));
      setStatus({
        color: "success",
        text: `${savedTour.title} saved and synced to the user portal.`,
      });
    } catch (error) {
      setStatus({
        color: "danger",
        text: error?.message || "Unable to save the tour right now.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTour = async (tourId) => {
    if (!tourId) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this tour from Firebase and the user portal?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteTourFromFirebase(tourId);
      handleCreateNew();
      setStatus({
        color: "success",
        text: "Tour deleted successfully.",
      });
    } catch (error) {
      setStatus({
        color: "danger",
        text: error?.message || "Unable to delete the tour right now.",
      });
    }
  };

  const handleUpdateUserRole = async (
    emailToUpdate = adminEmail,
    nextRole = "admin",
  ) => {
    if (!isAdminUser) {
      setStatus({
        color: "warning",
        text: "Only admins can update user roles.",
      });
      return;
    }

    if (!realtimeDb) {
      setStatus({
        color: "danger",
        text: "Firebase is not configured for role updates.",
      });
      return;
    }

    const normalizedEmail = String(emailToUpdate || "")
      .trim()
      .toLowerCase();
    const normalizedNextRole =
      String(nextRole || "user")
        .trim()
        .toLowerCase() === "admin"
        ? "admin"
        : "user";

    if (!normalizedEmail) {
      setStatus({
        color: "warning",
        text:
          normalizedNextRole === "admin"
            ? "Enter a user email to grant admin access."
            : "Enter a user email to remove admin access.",
      });
      return;
    }

    const matchingUser = portalUsers.find(
      (entry) =>
        String(entry.email || "")
          .trim()
          .toLowerCase() === normalizedEmail,
    );

    if (!matchingUser?.uid) {
      setStatus({
        color: "danger",
        text: `No registered user found for ${normalizedEmail}.`,
      });
      return;
    }

    if (matchingUser.uid === user?.uid && normalizedNextRole !== "admin") {
      setStatus({
        color: "warning",
        text: "You cannot remove your own admin access.",
      });
      return;
    }

    if (matchingUser.role === normalizedNextRole) {
      setStatus({
        color: "info",
        text:
          normalizedNextRole === "admin"
            ? `${matchingUser.displayName || matchingUser.email} already has admin access.`
            : `${matchingUser.displayName || matchingUser.email} is already a regular user.`,
      });
      return;
    }

    try {
      setPromotingEmail(normalizedEmail);
      await updateDb(dbRef(realtimeDb, `users/${matchingUser.uid}`), {
        role: normalizedNextRole,
        updatedAt: new Date().toISOString(),
      });

      setPortalUsers((prev) =>
        prev
          .map((entry) =>
            entry.uid === matchingUser.uid
              ? { ...entry, role: normalizedNextRole }
              : entry,
          )
          .sort((left, right) => {
            if (left.role !== right.role) {
              return left.role === "admin" ? -1 : 1;
            }

            return left.label.localeCompare(right.label);
          }),
      );

      if (matchingUser.uid === user?.uid) {
        dispatch({
          type: "SET_USER",
          payload: {
            ...user,
            role: normalizedNextRole,
          },
        });
      }

      setAdminEmail("");
      setStatus({
        color: "success",
        text:
          normalizedNextRole === "admin"
            ? `${matchingUser.displayName || matchingUser.email} is now an admin.`
            : `${matchingUser.displayName || matchingUser.email} is now a user.`,
      });
    } catch (error) {
      setStatus({
        color: "danger",
        text: error?.message || "Unable to update that user role right now.",
      });
    } finally {
      setPromotingEmail("");
    }
  };

  if (!FEATURE_FLAGS.adminTourPortal) {
    return <Navigate to="/home" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdminUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <CommonSection title="Admin Tour Portal" />
      <section className="admin-portal-section">
        <Container>
          <Row>
            <Col lg="12">
              <div className="admin-portal-intro">
                <div>
                  <p className="admin-portal-eyebrow">Firebase tour manager</p>
                  <h2>Manage tour cards, details, and preview mode</h2>
                  <p>
                    Tours are stored under <code>tours/&#123;tourId&#125;</code>
                    and the same schema feeds the user-facing cards, detail
                    page, featured list, and traveller dashboard.
                  </p>
                </div>
                <div className="admin-portal-meta">
                  <Badge color={isAdminUser ? "success" : "warning"} pill>
                    {isAdminUser ? "Admin access" : "Preview access"}
                  </Badge>
                  <Badge color="primary" pill>
                    Currency {APP_CONFIG.currencySymbol}
                  </Badge>
                  <Badge color="info" pill>
                    Source: {source}
                  </Badge>
                </div>
              </div>
            </Col>
          </Row>

          {!FEATURE_FLAGS.adminTourPortal && (
            <Alert color="warning">
              The admin portal is currently disabled by feature flag.
            </Alert>
          )}

          {!user && (
            <Alert color="warning">
              Please log in to create or update tours in Firebase.
            </Alert>
          )}

          {status ? <Alert color={status.color}>{status.text}</Alert> : null}

          <Row className="mb-3">
            <Col lg="12">
              <div className="admin-section-nav">
                <button
                  type="button"
                  className={`admin-section-nav__btn ${adminView === "tours" ? "active" : ""}`}
                  onClick={() => setAdminView("tours")}
                >
                  Tour manager
                </button>
                <button
                  type="button"
                  className={`admin-section-nav__btn ${adminView === "policies" ? "active" : ""}`}
                  onClick={() => setAdminView("policies")}
                >
                  Policy pages
                </button>
                <button
                  type="button"
                  className={`admin-section-nav__btn ${adminView === "gallery" ? "active" : ""}`}
                  onClick={() => setAdminView("gallery")}
                >
                  Homepage gallery
                </button>
                <button
                  type="button"
                  className={`admin-section-nav__btn ${adminView === "users" ? "active" : ""}`}
                  onClick={() => setAdminView("users")}
                >
                  Users & roles
                </button>
                <button
                  type="button"
                  className={`admin-section-nav__btn ${adminView === "inquiries" ? "active" : ""}`}
                  onClick={() => setAdminView("inquiries")}
                >
                  Inquiries
                </button>
              </div>
            </Col>
          </Row>

          {adminView === "tours" ? (
            <>
              <Row className="g-4">
                <Col lg="4">
                  <div className="admin-panel-card">
                    <div className="admin-panel-card__header">
                      <div>
                        <h4>Saved tours</h4>
                        <p>
                          {loading
                            ? "Loading from Firebase..."
                            : `${tours.length} tours available`}
                        </p>
                      </div>
                      <Button color="primary" onClick={handleCreateNew}>
                        + New tour
                      </Button>
                    </div>

                    {loading ? (
                      <div className="admin-loader">
                        <Spinner size="sm" /> Loading tours...
                      </div>
                    ) : (
                      <div className="admin-tour-list">
                        {tours.map((tour) => {
                          const tourId = tour.id || tour._id;
                          const isActive = selectedTourId === tourId;

                          return (
                            <button
                              key={tourId}
                              type="button"
                              className={`admin-tour-item ${isActive ? "active" : ""}`}
                              onClick={() => handleSelectTour(tour)}
                            >
                              <div>
                                <strong>{tour.title}</strong>
                                <span>
                                  {tour.city} • {formatPrice(tour.price)}
                                </span>
                              </div>
                              {tour.featured ? (
                                <Badge color="success">Featured</Badge>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Col>

                <Col lg="8">
                  <div className="admin-panel-card">
                    <div className="admin-panel-card__header">
                      <div>
                        <h4>{selectedTourId ? "Edit tour" : "Create tour"}</h4>
                        <p>
                          Fill the fields below. One saved record updates the
                          user portal automatically.
                        </p>
                      </div>
                      {selectedTourId ? (
                        <Button
                          color="danger"
                          outline
                          onClick={() => handleDeleteTour(selectedTourId)}
                        >
                          Delete
                        </Button>
                      ) : null}
                    </div>

                    <Form onSubmit={handleSaveTour}>
                      <Row className="g-3">
                        <Col md="6">
                          <FormGroup>
                            <Label for="title">Tour title</Label>
                            <Input
                              id="title"
                              name="title"
                              value={form.title}
                              onChange={handleFieldChange}
                              required
                            />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label for="city">City / destination</Label>
                            <Input
                              id="city"
                              name="city"
                              value={form.city}
                              onChange={handleFieldChange}
                              required
                            />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label for="price">
                              Price ({APP_CONFIG.currencySymbol})
                            </Label>
                            <Input
                              id="price"
                              name="price"
                              type="number"
                              value={form.price}
                              onChange={handleFieldChange}
                              required
                            />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label for="discountedPrice">
                              Offer price ({APP_CONFIG.currencySymbol})
                            </Label>
                            <Input
                              id="discountedPrice"
                              name="discountedPrice"
                              type="number"
                              value={form.discountedPrice}
                              onChange={handleFieldChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label for="couplePrice">
                              Couple price ({APP_CONFIG.currencySymbol})
                            </Label>
                            <Input
                              id="couplePrice"
                              name="couplePrice"
                              type="number"
                              min="0"
                              value={form.couplePrice}
                              onChange={handleFieldChange}
                              placeholder="Price for 2 travellers"
                            />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label for="coupleDiscountedPrice">
                              Couple offer price ({APP_CONFIG.currencySymbol})
                            </Label>
                            <Input
                              id="coupleDiscountedPrice"
                              name="coupleDiscountedPrice"
                              type="number"
                              min="0"
                              value={form.coupleDiscountedPrice}
                              onChange={handleFieldChange}
                              placeholder="Optional couple deal price"
                            />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label for="priceNote">Price note</Label>
                            <Input
                              id="priceNote"
                              name="priceNote"
                              value={form.priceNote}
                              onChange={handleFieldChange}
                              placeholder="1 Person x 1 Trip"
                            />
                          </FormGroup>
                        </Col>
                        <Col md="3">
                          <FormGroup>
                            <Label for="hotelGST">
                              GST ({APP_CONFIG.currencySymbol})
                            </Label>
                            <Input
                              id="hotelGST"
                              name="hotelGST"
                              type="number"
                              min="0"
                              value={form.hotelGST}
                              onChange={handleFieldChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="3">
                          <FormGroup>
                            <Label for="serviceFee">
                              Service fee ({APP_CONFIG.currencySymbol})
                            </Label>
                            <Input
                              id="serviceFee"
                              name="serviceFee"
                              type="number"
                              min="0"
                              value={form.serviceFee}
                              onChange={handleFieldChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="12">
                          <div className="admin-coupon-toolbar">
                            <div>
                              <h5>Coupon offers</h5>
                              <p>
                                Add as many coupon options as needed, then
                                remove any unused one anytime.
                              </p>
                            </div>
                            <div className="admin-coupon-toolbar__actions">
                              <Button
                                type="button"
                                color="primary"
                                outline
                                className="admin-coupon-add-btn"
                                onClick={handleAddCouponForm}
                              >
                                <i className="ri-add-line" aria-hidden="true" />
                                Add coupon
                              </Button>
                            </div>
                          </div>
                        </Col>

                        {couponForms.map((couponItem, index) => (
                          <React.Fragment key={`coupon-form-${index}`}>
                            <Col md="12">
                              <div className="admin-preview-note admin-coupon-card">
                                <div className="admin-coupon-card__head">
                                  <div>
                                    <h5>{`Coupon option ${index + 1}`}</h5>
                                    <p>
                                      Set eligibility, expiry, and offer value
                                      for this coupon.
                                    </p>
                                  </div>
                                  {couponForms.length > 1 ? (
                                    <Button
                                      type="button"
                                      color="danger"
                                      outline
                                      size="sm"
                                      className="admin-coupon-remove-btn"
                                      onClick={() =>
                                        handleRemoveCouponForm(index)
                                      }
                                    >
                                      <i
                                        className="ri-delete-bin-line"
                                        aria-hidden="true"
                                      />
                                      Remove
                                    </Button>
                                  ) : null}
                                </div>
                              </div>
                            </Col>
                            <Col md="4">
                              <FormGroup>
                                <Label for={`couponCode-${index}`}>
                                  Coupon code
                                </Label>
                                <Input
                                  id={`couponCode-${index}`}
                                  value={couponItem.code || ""}
                                  onChange={(event) =>
                                    handleCouponChange(
                                      index,
                                      "code",
                                      event.target.value,
                                    )
                                  }
                                  placeholder={
                                    index === 0 ? "SAVE500" : "WELCOME10"
                                  }
                                />
                              </FormGroup>
                            </Col>
                            <Col md="4">
                              <FormGroup>
                                <Label for={`couponType-${index}`}>
                                  Coupon type
                                </Label>
                                <Input
                                  id={`couponType-${index}`}
                                  type="select"
                                  value={couponItem.type || "flat"}
                                  onChange={(event) =>
                                    handleCouponChange(
                                      index,
                                      "type",
                                      event.target.value,
                                    )
                                  }
                                >
                                  <option value="flat">Flat amount</option>
                                  <option value="percent">Percentage</option>
                                </Input>
                              </FormGroup>
                            </Col>
                            <Col md="4">
                              <FormGroup>
                                <Label for={`couponValue-${index}`}>
                                  Coupon value
                                  {(couponItem.type || "flat") === "percent"
                                    ? " (%)"
                                    : ` (${APP_CONFIG.currencySymbol})`}
                                </Label>
                                <Input
                                  id={`couponValue-${index}`}
                                  type="number"
                                  min="0"
                                  value={couponItem.value || ""}
                                  onChange={(event) =>
                                    handleCouponChange(
                                      index,
                                      "value",
                                      event.target.value,
                                    )
                                  }
                                />
                              </FormGroup>
                            </Col>
                            <Col md="5">
                              <FormGroup>
                                <Label for={`couponDescription-${index}`}>
                                  Coupon note
                                </Label>
                                <Input
                                  id={`couponDescription-${index}`}
                                  value={couponItem.description || ""}
                                  onChange={(event) =>
                                    handleCouponChange(
                                      index,
                                      "description",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Apply before paying to unlock extra savings"
                                />
                              </FormGroup>
                            </Col>
                            <Col md="3">
                              <FormGroup>
                                <Label for={`couponTargetUser-${index}`}>
                                  Eligible user
                                </Label>
                                <Input
                                  id={`couponTargetUser-${index}`}
                                  type="select"
                                  value={couponItem.targetUserUid || ""}
                                  onChange={(event) =>
                                    handleCouponChange(
                                      index,
                                      "targetUserUid",
                                      event.target.value,
                                    )
                                  }
                                >
                                  <option value="">All users</option>
                                  {portalUsers.map((entry) => (
                                    <option key={entry.uid} value={entry.uid}>
                                      {entry.label}
                                    </option>
                                  ))}
                                </Input>
                              </FormGroup>
                            </Col>
                            <Col md="4">
                              <FormGroup>
                                <Label for={`couponExpiryAt-${index}`}>
                                  Expiry date & time
                                </Label>
                                <Input
                                  id={`couponExpiryAt-${index}`}
                                  type="datetime-local"
                                  value={couponItem.expiresAt || ""}
                                  onChange={(event) =>
                                    handleCouponChange(
                                      index,
                                      "expiresAt",
                                      event.target.value,
                                    )
                                  }
                                />
                              </FormGroup>
                            </Col>
                            <Col md="12" className="d-flex align-items-end">
                              <FormGroup check className="admin-checkbox-group">
                                <Input
                                  id={`couponActive-${index}`}
                                  type="checkbox"
                                  checked={Boolean(couponItem.active)}
                                  onChange={(event) =>
                                    handleCouponChange(
                                      index,
                                      "active",
                                      event.target.checked,
                                    )
                                  }
                                />
                                <Label for={`couponActive-${index}`} check>
                                  {`Enable coupon ${index + 1} on the user portal`}
                                </Label>
                              </FormGroup>
                            </Col>
                          </React.Fragment>
                        ))}
                        <Col md="4">
                          <FormGroup>
                            <Label for="distance">Distance (km)</Label>
                            <Input
                              id="distance"
                              name="distance"
                              type="number"
                              value={form.distance}
                              onChange={handleFieldChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="4">
                          <FormGroup>
                            <Label for="maxGroupSize">Group size</Label>
                            <Input
                              id="maxGroupSize"
                              name="maxGroupSize"
                              type="number"
                              value={form.maxGroupSize}
                              onChange={handleFieldChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="4" className="d-flex align-items-end">
                          <FormGroup check className="admin-checkbox-group">
                            <Input
                              id="featured"
                              name="featured"
                              type="checkbox"
                              checked={form.featured}
                              onChange={handleFieldChange}
                            />
                            <Label for="featured" check>
                              Featured on home page
                            </Label>
                          </FormGroup>
                        </Col>
                        <Col md="12">
                          <FormGroup>
                            <Label for="photo">Cover image URL</Label>
                            <Input
                              id="photo"
                              name="photo"
                              value={form.photo}
                              onChange={handleFieldChange}
                              placeholder="https://..."
                            />
                            <small className="text-muted d-block mt-2">
                              Or upload a cover image directly to Firebase
                              Storage.
                            </small>
                            <Input
                              id="coverUpload"
                              name="coverUpload"
                              type="file"
                              accept="image/*"
                              className="mt-2"
                              onChange={handleCoverImageUpload}
                              disabled={uploadingCover || !user}
                            />
                            <small className="text-muted d-block mt-2">
                              {uploadingCover
                                ? "Uploading cover image..."
                                : "PNG, JPG, or WEBP up to 5MB."}
                            </small>
                          </FormGroup>
                        </Col>
                        <Col md="12">
                          <FormGroup>
                            <Label for="address">Address</Label>
                            <Input
                              id="address"
                              name="address"
                              value={form.address}
                              onChange={handleFieldChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="12">
                          <FormGroup>
                            <Label for="desc">Description</Label>
                            <Input
                              id="desc"
                              name="desc"
                              type="textarea"
                              rows="4"
                              value={form.desc}
                              onChange={handleFieldChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label for="pickup">Pickup</Label>
                            <Input
                              id="pickup"
                              name="pickup"
                              value={form.pickup}
                              onChange={handleFieldChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label for="dropoff">Dropoff</Label>
                            <Input
                              id="dropoff"
                              name="dropoff"
                              value={form.dropoff}
                              onChange={handleFieldChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label for="category">Category</Label>
                            <Input
                              id="category"
                              name="category"
                              value={form.category}
                              onChange={handleFieldChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label for="duration">Duration</Label>
                            <Input
                              id="duration"
                              name="duration"
                              value={form.duration}
                              onChange={handleFieldChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label for="startDate">Start date</Label>
                            <Input
                              id="startDate"
                              name="startDate"
                              type="date"
                              value={form.startDate}
                              onChange={handleFieldChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label for="endDate">End date</Label>
                            <Input
                              id="endDate"
                              name="endDate"
                              type="date"
                              value={form.endDate}
                              onChange={handleFieldChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label for="galleryText">
                              Gallery URLs (one per line)
                            </Label>
                            <Input
                              id="galleryText"
                              name="galleryText"
                              type="textarea"
                              rows="4"
                              value={form.galleryText}
                              onChange={handleFieldChange}
                            />
                            <small className="text-muted d-block mt-2">
                              Or upload one or more gallery images directly to
                              Firebase Storage.
                            </small>
                            <Input
                              id="galleryUpload"
                              name="galleryUpload"
                              type="file"
                              accept="image/*"
                              multiple
                              className="mt-2"
                              onChange={handleGalleryImagesUpload}
                              disabled={uploadingGallery || !user}
                            />
                            <small className="text-muted d-block mt-2">
                              {uploadingGallery
                                ? "Uploading gallery images..."
                                : "You can select multiple images at once."}
                            </small>
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label for="highlightsText">
                              Highlights (one per line)
                            </Label>
                            <Input
                              id="highlightsText"
                              name="highlightsText"
                              type="textarea"
                              rows="4"
                              value={form.highlightsText}
                              onChange={handleFieldChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label for="inclusionsText">
                              Inclusions (one per line)
                            </Label>
                            <Input
                              id="inclusionsText"
                              name="inclusionsText"
                              type="textarea"
                              rows="4"
                              value={form.inclusionsText}
                              onChange={handleFieldChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label for="packingText">
                              Packing list (one per line)
                            </Label>
                            <Input
                              id="packingText"
                              name="packingText"
                              type="textarea"
                              rows="4"
                              value={form.packingText}
                              onChange={handleFieldChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label for="includeText">
                              Include list (one per line)
                            </Label>
                            <Input
                              id="includeText"
                              name="includeText"
                              type="textarea"
                              rows="4"
                              value={form.includeText}
                              onChange={handleFieldChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label for="excludeText">
                              Exclude list (one per line)
                            </Label>
                            <Input
                              id="excludeText"
                              name="excludeText"
                              type="textarea"
                              rows="4"
                              value={form.excludeText}
                              onChange={handleFieldChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label for="itineraryText">
                              Itinerary rows (`Title | Description`)
                            </Label>
                            <Input
                              id="itineraryText"
                              name="itineraryText"
                              type="textarea"
                              rows="5"
                              value={form.itineraryText}
                              onChange={handleFieldChange}
                            />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label for="policyText">
                              Policy rows (`Days | Refund | Notes`)
                            </Label>
                            <Input
                              id="policyText"
                              name="policyText"
                              type="textarea"
                              rows="5"
                              value={form.policyText}
                              onChange={handleFieldChange}
                            />
                          </FormGroup>
                        </Col>
                      </Row>

                      <div className="admin-form-actions">
                        <Button color="primary" type="submit" disabled={saving}>
                          {saving ? "Saving..." : "Save to Firebase"}
                        </Button>
                        <Button
                          color="secondary"
                          outline
                          type="button"
                          onClick={handleCreateNew}
                        >
                          Reset form
                        </Button>
                      </div>
                    </Form>
                  </div>
                </Col>
              </Row>

              {FEATURE_FLAGS.adminTourPreview && (
                <Row className="mt-4">
                  <Col lg="12">
                    <div className="admin-panel-card">
                      <div className="admin-panel-card__header">
                        <div>
                          <h4>User portal preview</h4>
                          <p>
                            See how the current tour draft will appear to
                            travellers.
                          </p>
                        </div>
                        <div className="preview-mode-switcher">
                          {previewModes.map((mode) => (
                            <Button
                              key={mode.value}
                              color={
                                previewMode === mode.value
                                  ? "primary"
                                  : "secondary"
                              }
                              outline={previewMode !== mode.value}
                              onClick={() => setPreviewMode(mode.value)}
                            >
                              {mode.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {previewMode === "card" ? (
                        <Row>
                          <Col md="4">
                            <TourCard tour={currentPreviewTour} />
                          </Col>
                          <Col md="8">
                            <div className="admin-preview-note">
                              <h5>{currentPreviewTour.title}</h5>
                              <p>
                                Featured:{" "}
                                {currentPreviewTour.featured ? "Yes" : "No"} •
                                Price: {formatPrice(currentPreviewTour.price)}
                                {previewDateLabel
                                  ? ` • Date: ${previewDateLabel}`
                                  : ""}
                              </p>
                              <p>
                                {currentPreviewTour.desc ||
                                  "Add a description to preview the tour story here."}
                              </p>
                            </div>
                          </Col>
                        </Row>
                      ) : (
                        <Row>
                          <Col lg="8">
                            <Gallery images={currentPreviewTour.gallery} />
                            <DetailsCard
                              pickup={currentPreviewTour.details.pickup}
                              dropoff={currentPreviewTour.details.dropoff}
                              category={currentPreviewTour.details.category}
                              duration={currentPreviewTour.details.duration}
                              dateRange={previewDateLabel}
                            />
                            <InclusionCard
                              items={currentPreviewTour.inclusions}
                            />
                            <Highlights items={currentPreviewTour.highlights} />
                            <Itinerary days={currentPreviewTour.itinerary} />
                            <Packing items={currentPreviewTour.packing} />
                            <InclusionExclusion
                              include={currentPreviewTour.includeEx.include}
                              exclude={currentPreviewTour.includeEx.exclude}
                            />
                            <PolicyTable rows={currentPreviewTour.policyRows} />
                            <GuestReviews
                              reviews={currentPreviewTour.reviews}
                              avgRating={currentPreviewTour.avgRating}
                              title={currentPreviewTour.title}
                            />
                          </Col>
                          <Col lg="4">
                            <PriceCard
                              price={currentPreviewTour.price}
                              discounted={
                                currentPreviewTour.discountedPrice ||
                                currentPreviewTour.price
                              }
                              title={currentPreviewTour.title}
                              dateRange={previewDateLabel}
                              duration={currentPreviewTour.details.duration}
                              pricing={currentPreviewTour.pricing}
                              coupon={currentPreviewTour.coupon}
                              coupons={currentPreviewTour.coupons}
                            />
                          </Col>
                        </Row>
                      )}
                    </div>
                  </Col>
                </Row>
              )}
            </>
          ) : adminView === "gallery" ? (
            <Row className="g-4">
              <Col lg="4">
                <div className="admin-panel-card">
                  <div className="admin-panel-card__header">
                    <div>
                      <h4>Homepage gallery</h4>
                      <p>
                        Upload homepage gallery cards with place, caption,
                        likes, and comments.
                      </p>
                    </div>
                    <Badge color="info" pill>
                      {homeGalleryItems.length} post
                      {homeGalleryItems.length === 1 ? "" : "s"}
                    </Badge>
                  </div>

                  <Form onSubmit={handleSaveHomeGalleryItem}>
                    <FormGroup>
                      <Label for="homeGalleryImage">Image URL</Label>
                      <Input
                        id="homeGalleryImage"
                        name="image"
                        value={homeGalleryForm.image}
                        onChange={handleHomeGalleryFieldChange}
                        placeholder="https://..."
                        required
                      />
                      <small className="text-muted d-block mt-2">
                        Or upload an image directly to Firebase Storage.
                      </small>
                      <Input
                        id="homeGalleryImageUpload"
                        name="homeGalleryImageUpload"
                        type="file"
                        accept="image/*"
                        className="mt-2"
                        onChange={handleHomeGalleryImageUpload}
                        disabled={uploadingHomeGalleryImage || !user}
                      />
                      <small className="text-muted d-block mt-2">
                        {uploadingHomeGalleryImage
                          ? "Uploading gallery image..."
                          : "PNG, JPG, or WEBP up to 5MB."}
                      </small>
                    </FormGroup>

                    <FormGroup>
                      <Label for="homeGalleryLocation">Place name</Label>
                      <Input
                        id="homeGalleryLocation"
                        name="location"
                        value={homeGalleryForm.location}
                        onChange={handleHomeGalleryFieldChange}
                        placeholder="Goa"
                        required
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label for="homeGalleryCaption">Caption / comment</Label>
                      <Input
                        id="homeGalleryCaption"
                        name="caption"
                        value={homeGalleryForm.caption}
                        onChange={handleHomeGalleryFieldChange}
                        placeholder="Coffee and coast"
                        required
                      />
                    </FormGroup>

                    <Row className="g-3">
                      <Col sm="6">
                        <FormGroup>
                          <Label for="homeGalleryLikes">Likes</Label>
                          <Input
                            id="homeGalleryLikes"
                            name="likes"
                            value={homeGalleryForm.likes}
                            onChange={handleHomeGalleryFieldChange}
                            placeholder="1.8k"
                          />
                        </FormGroup>
                      </Col>
                      <Col sm="6">
                        <FormGroup>
                          <Label for="homeGalleryComments">Comments</Label>
                          <Input
                            id="homeGalleryComments"
                            name="comments"
                            value={homeGalleryForm.comments}
                            onChange={handleHomeGalleryFieldChange}
                            placeholder="44"
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    <div className="admin-form-actions">
                      <Button
                        color="primary"
                        type="submit"
                        disabled={
                          savingHomeGallery || uploadingHomeGalleryImage
                        }
                      >
                        {savingHomeGallery ? "Saving..." : "Add gallery card"}
                      </Button>
                      <Button
                        color="secondary"
                        outline
                        type="button"
                        onClick={() =>
                          setHomeGalleryForm(createEmptyHomeGalleryForm())
                        }
                      >
                        Reset
                      </Button>
                    </div>
                  </Form>
                </div>
              </Col>

              <Col lg="8">
                <div className="admin-panel-card">
                  <div className="admin-panel-card__header">
                    <div>
                      <h4>Homepage gallery preview</h4>
                      <p>
                        These cards appear in the homepage gallery and sync from
                        Firebase.
                      </p>
                    </div>
                  </div>

                  {homeGalleryLoading ? (
                    <div className="admin-loader">
                      <Spinner size="sm" /> Loading gallery...
                    </div>
                  ) : homeGalleryItems.length ? (
                    <div className="admin-gallery-list">
                      {homeGalleryItems.map((item) => (
                        <div key={item.id} className="admin-gallery-item">
                          <img
                            src={item.image}
                            alt={
                              item.caption || item.location || "Gallery card"
                            }
                            className="admin-gallery-thumb"
                          />
                          <div className="admin-gallery-meta">
                            <strong>{item.location || "Destination"}</strong>
                            <span>{item.caption || "No caption added"}</span>
                            <div className="admin-gallery-stats">
                              <Badge color="primary" pill>
                                ❤ {item.likes || "0"}
                              </Badge>
                              <Badge color="secondary" pill>
                                💬 {item.comments || "0"}
                              </Badge>
                            </div>
                          </div>
                          <div className="admin-user-actions">
                            <Button
                              type="button"
                              color="danger"
                              outline
                              size="sm"
                              disabled={savingHomeGallery}
                              onClick={() =>
                                handleDeleteHomeGalleryItem(item.id)
                              }
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="admin-preview-note">
                      <h5>No gallery posts yet</h5>
                      <p>
                        Add your first image here to show it in the homepage
                        gallery.
                      </p>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          ) : adminView === "users" ? (
            <Row className="g-4">
              <Col lg="4">
                <div className="admin-panel-card">
                  <div className="admin-panel-card__header">
                    <div>
                      <h4>User access</h4>
                      <p>Grant or remove admin access for a registered user.</p>
                    </div>
                    <Badge color={isAdminUser ? "success" : "secondary"} pill>
                      {isAdminUser ? "Can edit roles" : "View only"}
                    </Badge>
                  </div>

                  <Form
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleUpdateUserRole(
                        adminEmail,
                        selectedAdminTarget?.role === "admin"
                          ? "user"
                          : "admin",
                      );
                    }}
                  >
                    <FormGroup>
                      <Label for="adminEmail">User email</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        value={adminEmail}
                        onChange={(event) => setAdminEmail(event.target.value)}
                        placeholder="name@example.com"
                        disabled={!isAdminUser}
                      />
                      <small className="text-muted d-block mt-2">
                        Enter a registered email to grant or remove admin
                        access.
                      </small>
                    </FormGroup>

                    <div className="admin-form-actions">
                      {selectedAdminTarget?.uid === user?.uid &&
                      selectedAdminTarget?.role === "admin" ? (
                        <small className="text-muted fw-semibold">
                          Your current admin access cannot be removed here.
                        </small>
                      ) : (
                        <Button
                          color={
                            selectedAdminTarget?.role === "admin"
                              ? "danger"
                              : "primary"
                          }
                          outline={selectedAdminTarget?.role === "admin"}
                          type="submit"
                          disabled={
                            !isAdminUser ||
                            !normalizedAdminEmail ||
                            promotingEmail === normalizedAdminEmail
                          }
                        >
                          {promotingEmail === normalizedAdminEmail
                            ? "Updating..."
                            : selectedAdminTarget?.role === "admin"
                              ? "Remove admin"
                              : "Make admin"}
                        </Button>
                      )}
                    </div>
                  </Form>
                </div>
              </Col>

              <Col lg="8">
                <div className="admin-panel-card">
                  <div className="admin-panel-card__header">
                    <div>
                      <h4>Portal users</h4>
                      <p>
                        {portalUsersLoading
                          ? "Loading users..."
                          : `${portalUsers.length} users found`}
                      </p>
                    </div>
                  </div>

                  {portalUsersLoading ? (
                    <div className="admin-loader">
                      <Spinner size="sm" /> Loading users...
                    </div>
                  ) : portalUsers.length ? (
                    <div className="admin-user-list">
                      {portalUsers.map((entry) => {
                        const normalizedEntryEmail = String(entry.email || "")
                          .trim()
                          .toLowerCase();
                        const isUpdatingThisUser =
                          Boolean(normalizedEntryEmail) &&
                          promotingEmail === normalizedEntryEmail;

                        return (
                          <div key={entry.uid} className="admin-user-item">
                            <div>
                              <strong>
                                {entry.displayName || entry.label}
                              </strong>
                              <span>{entry.email || "No email available"}</span>
                            </div>
                            <div className="admin-user-actions">
                              <Badge
                                color={
                                  entry.role === "admin"
                                    ? "success"
                                    : "secondary"
                                }
                                pill
                              >
                                {entry.role === "admin" ? "Admin" : "User"}
                              </Badge>
                              {entry.email ? (
                                entry.role === "admin" ? (
                                  entry.uid === user?.uid ? (
                                    <small className="text-muted fw-semibold">
                                      Current admin
                                    </small>
                                  ) : (
                                    <Button
                                      type="button"
                                      color="danger"
                                      outline
                                      size="sm"
                                      disabled={
                                        !isAdminUser || isUpdatingThisUser
                                      }
                                      onClick={() =>
                                        handleUpdateUserRole(
                                          entry.email,
                                          "user",
                                        )
                                      }
                                    >
                                      {isUpdatingThisUser
                                        ? "Updating..."
                                        : "Remove admin"}
                                    </Button>
                                  )
                                ) : (
                                  <Button
                                    type="button"
                                    color="primary"
                                    outline
                                    size="sm"
                                    disabled={
                                      !isAdminUser || isUpdatingThisUser
                                    }
                                    onClick={() =>
                                      handleUpdateUserRole(entry.email, "admin")
                                    }
                                  >
                                    {isUpdatingThisUser
                                      ? "Updating..."
                                      : "Make admin"}
                                  </Button>
                                )
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="admin-preview-note">
                      <h5>No users found</h5>
                      <p>User accounts will appear here once people sign in.</p>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          ) : adminView === "inquiries" ? (
            <Row className="g-4">
              <Col lg="12">
                <div className="admin-panel-card">
                  <div className="admin-panel-card__header">
                    <div>
                      <h4>Contact inquiries</h4>
                      <p>
                        {inquiriesLoading
                          ? "Loading inquiries..."
                          : `${filteredInquiries.length} inquiry${filteredInquiries.length === 1 ? "" : "ies"} shown`}
                      </p>
                    </div>
                  </div>

                  {inquiriesLoading ? (
                    <div className="admin-loader">
                      <Spinner size="sm" /> Loading inquiries...
                    </div>
                  ) : inquiries.length ? (
                    <>
                      <div className="admin-preview-note admin-inquiry-note">
                        <h5>Inquiry retention</h5>
                        <p>
                          Resolved inquiries are deleted from Firebase after 7
                          days. Cleanup runs automatically when an admin opens
                          this view.
                        </p>
                      </div>

                      <div className="admin-inquiry-toolbar">
                        <div className="admin-inquiry-filters">
                          <button
                            type="button"
                            className={`admin-section-nav__btn ${inquirySourceFilter === "all" ? "active" : ""}`}
                            onClick={() => setInquirySourceFilter("all")}
                          >
                            All
                          </button>
                          <button
                            type="button"
                            className={`admin-section-nav__btn ${inquirySourceFilter === "contact-us" ? "active" : ""}`}
                            onClick={() => setInquirySourceFilter("contact-us")}
                          >
                            Contact Us
                          </button>
                          <button
                            type="button"
                            className={`admin-section-nav__btn ${inquirySourceFilter === "tour-details" ? "active" : ""}`}
                            onClick={() =>
                              setInquirySourceFilter("tour-details")
                            }
                          >
                            Tour Details
                          </button>
                        </div>

                        <Input
                          type="search"
                          value={inquirySearch}
                          onChange={(event) =>
                            setInquirySearch(event.target.value)
                          }
                          className="admin-inquiry-search"
                          placeholder="Search name, email, phone, or tour"
                        />
                      </div>

                      <div className="admin-inquiry-columns">
                        <div className="admin-inquiry-column">
                          <div className="admin-panel-card__header admin-panel-card__header--compact">
                            <div>
                              <h4>Unresolved</h4>
                              <p>{unresolvedInquiries.length} pending</p>
                            </div>
                          </div>

                          {unresolvedInquiries.length ? (
                            <div className="admin-inquiry-list">
                              {unresolvedInquiries.map((item) => {
                                const isResolved = item.status === "resolved";
                                const isUpdating =
                                  updatingInquiryId === item.id;

                                return (
                                  <div
                                    key={item.id}
                                    className="admin-inquiry-item"
                                  >
                                    <div className="admin-inquiry-head">
                                      <div>
                                        <strong>
                                          {item.name || "Traveler"}
                                        </strong>
                                        <span>{item.email || "No email"}</span>
                                        {item.tourTitle ? (
                                          <span>
                                            Tour: {item.tourTitle}
                                            {item.tourCity
                                              ? ` (${item.tourCity})`
                                              : ""}
                                          </span>
                                        ) : null}
                                      </div>
                                      <Badge
                                        color={
                                          isResolved ? "success" : "warning"
                                        }
                                        pill
                                      >
                                        {isResolved ? "Resolved" : "New"}
                                      </Badge>
                                    </div>

                                    <p className="admin-inquiry-message">
                                      {item.message || "No message shared."}
                                    </p>

                                    <div className="admin-inquiry-footer">
                                      <small>
                                        Phone: {item.phone || "Not provided"}
                                      </small>
                                      <small>
                                        Source: {item.source || "contact-us"}
                                      </small>
                                      <small>
                                        {item.createdAt
                                          ? `Received: ${new Date(item.createdAt).toLocaleString()}`
                                          : "Received date unavailable"}
                                      </small>
                                    </div>

                                    <div className="admin-user-actions">
                                      <Button
                                        type="button"
                                        color="success"
                                        size="sm"
                                        disabled={isUpdating}
                                        onClick={() =>
                                          handleUpdateInquiryStatus(
                                            item.id,
                                            "resolved",
                                          )
                                        }
                                      >
                                        {isUpdating
                                          ? "Updating..."
                                          : "Mark as resolved"}
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="admin-preview-note">
                              <h5>No unresolved inquiries</h5>
                              <p>
                                New inquiries matching the current filter will
                                appear here.
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="admin-inquiry-column">
                          <div className="admin-panel-card__header admin-panel-card__header--compact">
                            <div>
                              <h4>Resolved</h4>
                              <p>{resolvedInquiries.length} completed</p>
                            </div>
                          </div>

                          {resolvedInquiries.length ? (
                            <div className="admin-inquiry-list">
                              {resolvedInquiries.map((item) => {
                                const isResolved = item.status === "resolved";
                                const isUpdating =
                                  updatingInquiryId === item.id;

                                return (
                                  <div
                                    key={item.id}
                                    className="admin-inquiry-item"
                                  >
                                    <div className="admin-inquiry-head">
                                      <div>
                                        <strong>
                                          {item.name || "Traveler"}
                                        </strong>
                                        <span>{item.email || "No email"}</span>
                                        {item.tourTitle ? (
                                          <span>
                                            Tour: {item.tourTitle}
                                            {item.tourCity
                                              ? ` (${item.tourCity})`
                                              : ""}
                                          </span>
                                        ) : null}
                                      </div>
                                      <Badge
                                        color={
                                          isResolved ? "success" : "warning"
                                        }
                                        pill
                                      >
                                        {isResolved ? "Resolved" : "New"}
                                      </Badge>
                                    </div>

                                    <p className="admin-inquiry-message">
                                      {item.message || "No message shared."}
                                    </p>

                                    <div className="admin-inquiry-footer">
                                      <small>
                                        Phone: {item.phone || "Not provided"}
                                      </small>
                                      <small>
                                        Source: {item.source || "contact-us"}
                                      </small>
                                      <small>
                                        {item.deleteAfterAt
                                          ? `Deletes: ${new Date(item.deleteAfterAt).toLocaleString()}`
                                          : "Auto-delete date unavailable"}
                                      </small>
                                      <small>
                                        {item.createdAt
                                          ? `Received: ${new Date(item.createdAt).toLocaleString()}`
                                          : "Received date unavailable"}
                                      </small>
                                    </div>

                                    <div className="admin-user-actions">
                                      <Button
                                        type="button"
                                        color="secondary"
                                        outline
                                        size="sm"
                                        disabled={isUpdating}
                                        onClick={() =>
                                          handleUpdateInquiryStatus(
                                            item.id,
                                            "new",
                                          )
                                        }
                                      >
                                        {isUpdating
                                          ? "Updating..."
                                          : "Mark as new"}
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="admin-preview-note">
                              <h5>No resolved inquiries</h5>
                              <p>
                                Resolved inquiries matching the current filter
                                will appear here.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="admin-preview-note">
                      <h5>No inquiries yet</h5>
                      <p>
                        Contact form submissions will appear here automatically.
                      </p>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          ) : (
            <Row className="g-4">
              <Col lg="12">
                <PolicyContentManager user={user} />
              </Col>
            </Row>
          )}
        </Container>
      </section>
      <Newsletter />
    </>
  );
};

export default AdminPortal;

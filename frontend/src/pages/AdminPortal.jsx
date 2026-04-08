import React, { useContext, useEffect, useMemo, useState } from "react";
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
import { AuthContext } from "../context/AuthContext";
import { APP_CONFIG, FEATURE_FLAGS } from "../config/featureFlags";
import useTours from "../hooks/useTours";
import { storage } from "../utils/firebaseConfig";
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

const AdminPortal = () => {
  const { user, userRole } = useContext(AuthContext);
  const { tours, loading, source } = useTours();
  const [form, setForm] = useState(() => tourToFormState(createEmptyTour()));
  const [selectedTourId, setSelectedTourId] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [status, setStatus] = useState(null);
  const [previewMode, setPreviewMode] = useState("card");

  const canOpenPortal = Boolean(user) && FEATURE_FLAGS.adminTourPortal;
  const isAdminUser = String(userRole || "").toLowerCase() === "admin";
  const currentPreviewTour = useMemo(() => formStateToTour(form), [form]);
  const previewDateLabel = formatTourDateRange(
    currentPreviewTour.startDate,
    currentPreviewTour.endDate,
    currentPreviewTour.details?.dateRange,
  );

  useEffect(() => {
    if (!selectedTourId && !isCreatingNew && tours.length) {
      const firstTour = tours[0];
      setSelectedTourId(firstTour.id || firstTour._id);
      setForm(tourToFormState(firstTour));
    }
  }, [isCreatingNew, selectedTourId, tours]);

  const handleFieldChange = ({ target }) => {
    const { name, value, type, checked } = target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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

      setForm((prev) => ({
        ...prev,
        photo: imageUrl,
        galleryText: prev.galleryText.includes(imageUrl)
          ? prev.galleryText
          : [imageUrl, prev.galleryText].filter(Boolean).join("\n"),
      }));
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
        const mergedUrls = [
          ...existingUrls,
          ...uploadedUrls.filter((url) => !existingUrls.includes(url)),
        ];

        return {
          ...prev,
          photo: prev.photo || uploadedUrls[0] || "",
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

  const handleSelectTour = (tour) => {
    setIsCreatingNew(false);
    setSelectedTourId(tour.id || tour._id);
    setForm(tourToFormState(tour));
    setStatus(null);
  };

  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setSelectedTourId("");
    setForm(tourToFormState(createEmptyTour()));
    setStatus({ color: "info", text: "Started a fresh tour draft." });
  };

  const handleSaveTour = async (event) => {
    event.preventDefault();

    if (!canOpenPortal) {
      setStatus({
        color: "warning",
        text: "Log in to save tours to Firebase.",
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
                      Fill the fields below. One saved record updates the user
                      portal automatically.
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
                          Hotel GST ({APP_CONFIG.currencySymbol})
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
                    <Col md="6">
                      <FormGroup>
                        <Label for="couponCode">Coupon code</Label>
                        <Input
                          id="couponCode"
                          name="couponCode"
                          value={form.couponCode}
                          onChange={handleFieldChange}
                          placeholder="SAVE500"
                        />
                      </FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup>
                        <Label for="couponType">Coupon type</Label>
                        <Input
                          id="couponType"
                          name="couponType"
                          type="select"
                          value={form.couponType}
                          onChange={handleFieldChange}
                        >
                          <option value="flat">Flat amount</option>
                          <option value="percent">Percentage</option>
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col md="3">
                      <FormGroup>
                        <Label for="couponValue">
                          Coupon value
                          {form.couponType === "percent"
                            ? " (%)"
                            : ` (${APP_CONFIG.currencySymbol})`}
                        </Label>
                        <Input
                          id="couponValue"
                          name="couponValue"
                          type="number"
                          min="0"
                          value={form.couponValue}
                          onChange={handleFieldChange}
                        />
                      </FormGroup>
                    </Col>
                    <Col md="6">
                      <FormGroup>
                        <Label for="couponDescription">Coupon note</Label>
                        <Input
                          id="couponDescription"
                          name="couponDescription"
                          value={form.couponDescription}
                          onChange={handleFieldChange}
                          placeholder="Apply before paying to unlock extra savings"
                        />
                      </FormGroup>
                    </Col>
                    <Col md="4" className="d-flex align-items-end">
                      <FormGroup check className="admin-checkbox-group">
                        <Input
                          id="couponActive"
                          name="couponActive"
                          type="checkbox"
                          checked={form.couponActive}
                          onChange={handleFieldChange}
                        />
                        <Label for="couponActive" check>
                          Coupon active on user portal
                        </Label>
                      </FormGroup>
                    </Col>
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
                          Or upload a cover image directly to Firebase Storage.
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
                            previewMode === mode.value ? "primary" : "secondary"
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
                        <InclusionCard items={currentPreviewTour.inclusions} />
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
                        />
                      </Col>
                    </Row>
                  )}
                </div>
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

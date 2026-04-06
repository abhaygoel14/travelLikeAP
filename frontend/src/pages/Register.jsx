import React, { useState, useContext } from "react";
import { Container, Row, Col, Form, FormGroup, Button } from "reactstrap";
import "../styles/login.css";
import { Link, useNavigate } from "react-router-dom";
import registerImg from "../assets/images/login.png";
import userIcon from "../assets/images/user.png";
import { AuthContext } from "../context/AuthContext";
import {
  auth,
  firebaseConfigError,
  firebaseReady,
  realtimeDb,
  storage,
} from "../utils/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  linkWithCredential,
  sendEmailVerification,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { ref, set } from "firebase/database";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

const MAX_PROFILE_PHOTO_SIZE = 2 * 1024 * 1024;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatNameValue = (value = "") =>
  String(value)
    .replace(/\s+/g, " ")
    .replace(/(^\w)|\s+(\w)/g, (match) => match.toUpperCase())
    .trimStart();

const getPasswordValidationMessage = (password = "") => {
  if (!password) return "Please enter a password.";
  if (password.length < 8)
    return "Password must be at least 8 characters long.";
  if (!/[A-Z]/.test(password))
    return "Password must include at least one uppercase letter.";
  if (!/[a-z]/.test(password))
    return "Password must include at least one lowercase letter.";
  if (!/\d/.test(password)) return "Password must include at least one number.";
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include at least one special character.";
  }

  return "";
};

const getFriendlyRegisterError = (error) => {
  switch (error?.code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please log in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Please choose a stronger password with uppercase, lowercase, number, and symbol.";
    case "auth/account-exists-with-different-credential":
      return "This email already uses another sign-in method. Use that method once to add a password.";
    case "auth/provider-already-linked":
    case "auth/credential-already-in-use":
      return "This account already has a password. Please log in.";
    default:
      return error?.message || "Unable to create your account right now.";
  }
};

const validateField = (field, value, credentials) => {
  switch (field) {
    case "firstName":
      return String(value || "").trim() ? "" : "First name is required.";
    case "lastName":
      return String(value || "").trim() ? "" : "Last name is required.";
    case "email":
      if (!String(value || "").trim()) return "Email is required.";
      return emailPattern.test(String(value || "").trim())
        ? ""
        : "Please enter a valid email address.";
    case "password":
      return getPasswordValidationMessage(value);
    case "confirmPassword":
      if (!String(value || "").trim()) return "Please confirm your password.";
      return value === credentials.password
        ? ""
        : "Password and confirm password do not match.";
    default:
      return "";
  }
};

const Register = () => {
  const [credentials, setCredentials] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(userIcon);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [existingEmailProvider, setExistingEmailProvider] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { dispatch, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    const nextValue =
      id === "firstName" || id === "lastName" ? formatNameValue(value) : value;
    const nextCredentials = { ...credentials, [id]: nextValue };

    setCredentials(nextCredentials);
    setFieldErrors((prev) => ({
      ...prev,
      [id]: validateField(id, nextValue, nextCredentials),
      ...(id === "password" || id === "confirmPassword"
        ? {
            password: validateField(
              "password",
              nextCredentials.password,
              nextCredentials,
            ),
            confirmPassword: validateField(
              "confirmPassword",
              nextCredentials.confirmPassword,
              nextCredentials,
            ),
          }
        : {}),
    }));

    if (id === "email") {
      setShowLoginPrompt(false);
      setExistingEmailProvider("");
    }

    if (message.text && message.type !== "success") {
      setMessage({ type: "", text: "" });
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setProfilePhoto(null);
      setPhotoPreview(userIcon);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: "Please upload a valid image file for your profile photo.",
      });
      e.target.value = "";
      return;
    }

    if (file.size > MAX_PROFILE_PHOTO_SIZE) {
      setMessage({
        type: "error",
        text: "Profile photo must be smaller than 2 MB.",
      });
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result || userIcon);
    reader.readAsDataURL(file);
    setProfilePhoto(file);
    setMessage({ type: "", text: "" });
  };

  const uploadProfilePhoto = async (userId) => {
    if (!profilePhoto || !storage) {
      return "";
    }

    try {
      const photoFileRef = storageRef(
        storage,
        `pictures/${userId}/profile-${Date.now()}-${profilePhoto.name}`,
      );
      await uploadBytes(photoFileRef, profilePhoto);
      return await getDownloadURL(photoFileRef);
    } catch (uploadError) {
      console.error("Profile photo upload failed:", uploadError);
      return String(photoPreview || "").startsWith("data:") ? photoPreview : "";
    }
  };

  const resolveProfilePhotoUrl = (firebaseUser, uploadedPhotoURL = "") => {
    const providerPhotoURL = Array.isArray(firebaseUser?.providerData)
      ? firebaseUser.providerData
          .map((item) => String(item?.photoURL || "").trim())
          .find(Boolean) || ""
      : "";

    return String(
      uploadedPhotoURL || firebaseUser?.photoURL || providerPhotoURL || "",
    ).trim();
  };

  const savePasswordForExistingGoogleAccount = async (nextCredentials) => {
    const shouldContinue = window.confirm(
      "This email already exists with Google. Do you want to save the password you entered for future login?",
    );

    if (!shouldContinue) {
      return;
    }

    dispatch({ type: "REGISTER_START" });

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
        login_hint: nextCredentials.email,
      });

      const result = await signInWithPopup(auth, provider);
      const signedInEmail = String(result.user.email || "")
        .trim()
        .toLowerCase();

      if (signedInEmail !== nextCredentials.email.toLowerCase()) {
        await signOut(auth);
        throw new Error(
          "Please continue with the same Google account to save this password.",
        );
      }

      const passwordCredential = EmailAuthProvider.credential(
        nextCredentials.email,
        nextCredentials.password,
      );

      try {
        await linkWithCredential(result.user, passwordCredential);
      } catch (linkError) {
        if (
          linkError?.code !== "auth/provider-already-linked" &&
          linkError?.code !== "auth/credential-already-in-use"
        ) {
          throw linkError;
        }
      }

      const displayName = [nextCredentials.firstName, nextCredentials.lastName]
        .filter(Boolean)
        .join(" ");
      const resolvedDisplayName =
        displayName || result.user.displayName || "Traveler";
      const uploadedPhotoURL = await uploadProfilePhoto(result.user.uid);
      const resolvedProfilePhotoURL = resolveProfilePhotoUrl(
        result.user,
        uploadedPhotoURL,
      );

      await updateProfile(result.user, {
        displayName: resolvedDisplayName,
        photoURL: /^https?:\/\//i.test(String(resolvedProfilePhotoURL || ""))
          ? resolvedProfilePhotoURL
          : result.user.photoURL || null,
      });

      const userData = {
        uid: result.user.uid,
        firstName: nextCredentials.firstName,
        lastName: nextCredentials.lastName,
        username: resolvedDisplayName,
        displayName: resolvedDisplayName,
        email: result.user.email || nextCredentials.email,
        emailVerified: result.user.emailVerified,
        photoURL: resolvedProfilePhotoURL,
        profileUrl: resolvedProfilePhotoURL,
        imageUrl: result.user.photoURL || resolvedProfilePhotoURL || "",
        role: "user",
        provider: "google.com,password",
        hasPassword: true,
        createdAt: new Date().toISOString(),
      };

      if (realtimeDb) {
        await set(ref(realtimeDb, `users/${result.user.uid}`), userData);
      }

      dispatch({ type: "REGISTER_SUCCESS", payload: userData });
      setExistingEmailProvider("");
      setShowLoginPrompt(false);
      setMessage({
        type: "success",
        text: "Password saved successfully. You can now log in with email and password.",
      });
      window.setTimeout(() => navigate("/dashboard"), 1200);
    } catch (error) {
      const errorMessage = getFriendlyRegisterError(error);
      dispatch({ type: "REGISTER_FAILURE", payload: errorMessage });
      setShowLoginPrompt(true);
      setMessage({ type: "error", text: errorMessage });
    }
  };

  const handleClick = async (e) => {
    e.preventDefault();

    if (!firebaseReady || !auth) {
      setMessage({
        type: "error",
        text: firebaseConfigError || "Firebase is not configured correctly.",
      });
      return;
    }

    const nextCredentials = {
      ...credentials,
      firstName: formatNameValue(credentials.firstName),
      lastName: formatNameValue(credentials.lastName),
      email: credentials.email.trim().toLowerCase(),
    };

    const validationErrors = {
      firstName: validateField(
        "firstName",
        nextCredentials.firstName,
        nextCredentials,
      ),
      lastName: validateField(
        "lastName",
        nextCredentials.lastName,
        nextCredentials,
      ),
      email: validateField("email", nextCredentials.email, nextCredentials),
      password: validateField(
        "password",
        nextCredentials.password,
        nextCredentials,
      ),
      confirmPassword: validateField(
        "confirmPassword",
        nextCredentials.confirmPassword,
        nextCredentials,
      ),
    };

    setFieldErrors(validationErrors);

    const firstError = Object.values(validationErrors).find(Boolean);
    if (firstError) {
      setShowLoginPrompt(false);
      setMessage({ type: "error", text: firstError });
      return;
    }

    try {
      const signInMethods = await fetchSignInMethodsForEmail(
        auth,
        nextCredentials.email,
      );

      if (signInMethods.length > 0) {
        const hasPasswordMethod = signInMethods.includes("password");
        const canAddPasswordNow =
          !hasPasswordMethod && signInMethods.includes("google.com");
        const existingUserMessage = canAddPasswordNow
          ? "This email already exists with Google. Click below to save the password you entered for future login."
          : "An account with this email already exists. Please log in.";

        setFieldErrors((prev) => ({
          ...prev,
          email: existingUserMessage,
        }));
        setExistingEmailProvider(canAddPasswordNow ? "google.com" : "");
        setShowLoginPrompt(true);
        setMessage({ type: "error", text: existingUserMessage });
        return;
      }
    } catch (lookupError) {
      console.error("Could not check existing email:", lookupError);
    }

    dispatch({ type: "REGISTER_START" });

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        nextCredentials.email,
        nextCredentials.password,
      );
      const displayName = [nextCredentials.firstName, nextCredentials.lastName]
        .filter(Boolean)
        .join(" ");

      const uploadedPhotoURL = await uploadProfilePhoto(
        userCredential.user.uid,
      );
      const resolvedProfilePhotoURL = resolveProfilePhotoUrl(
        userCredential.user,
        uploadedPhotoURL,
      );

      await updateProfile(userCredential.user, {
        displayName,
        photoURL: /^https?:\/\//i.test(String(resolvedProfilePhotoURL || ""))
          ? resolvedProfilePhotoURL
          : null,
      });

      let successText = "Account created successfully.";

      try {
        await sendEmailVerification(userCredential.user);
        successText = `Account created successfully. Verification email sent to ${userCredential.user.email}.`;
      } catch (verificationError) {
        console.error("Email verification failed:", verificationError);
        successText =
          "Account created, but the verification email could not be sent right now.";
      }

      const userData = {
        uid: userCredential.user.uid,
        firstName: nextCredentials.firstName,
        lastName: nextCredentials.lastName,
        username: displayName,
        displayName,
        email: userCredential.user.email,
        emailVerified: userCredential.user.emailVerified,
        photoURL: resolvedProfilePhotoURL,
        profileUrl: resolvedProfilePhotoURL,
        imageUrl: resolvedProfilePhotoURL,
        role: "user",
        provider: "password",
        hasPassword: true,
        createdAt: new Date().toISOString(),
      };

      if (realtimeDb) {
        await set(
          ref(realtimeDb, `users/${userCredential.user.uid}`),
          userData,
        );
      }

      dispatch({ type: "REGISTER_SUCCESS", payload: userData });
      setShowLoginPrompt(false);
      setMessage({ type: "success", text: successText });
      window.setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      let canAddPasswordNow = false;

      if (err?.code === "auth/email-already-in-use") {
        try {
          const signInMethods = await fetchSignInMethodsForEmail(
            auth,
            nextCredentials.email,
          );
          canAddPasswordNow =
            signInMethods.includes("google.com") &&
            !signInMethods.includes("password");
          setExistingEmailProvider(canAddPasswordNow ? "google.com" : "");
        } catch (lookupError) {
          console.error("Could not re-check existing email:", lookupError);
          setExistingEmailProvider("");
        }
      } else {
        setExistingEmailProvider("");
      }

      const errorMessage =
        err?.code === "auth/email-already-in-use" && canAddPasswordNow
          ? "This email already exists with Google. Click below to save the password you entered for future login."
          : getFriendlyRegisterError(err);

      dispatch({ type: "REGISTER_FAILURE", payload: errorMessage });
      setShowLoginPrompt(err?.code === "auth/email-already-in-use");
      setMessage({ type: "error", text: errorMessage });
    }
  };

  return (
    <section>
      <Container>
        <Row>
          <Col lg="8" className="m-auto">
            <div className="login__container d-flex justify-content-between">
              <div className="login__img">
                <img src={registerImg} alt="Register" />
              </div>

              <div className="login__form">
                <label htmlFor="profilePhoto" className="user user--clickable">
                  <img src={photoPreview || userIcon} alt="Profile preview" />
                </label>
                <h2>Create Account</h2>
                <p className="profile__upload__note">
                  Click the profile icon to upload your image.
                </p>

                {!firebaseReady && (
                  <p className="text-danger small mb-3 auth__message">
                    {firebaseConfigError}
                  </p>
                )}

                {message.text && (
                  <p
                    className={`${message.type === "error" ? "text-danger" : "text-success"} small mb-3 auth__message`}
                  >
                    {message.text}
                  </p>
                )}

                {showLoginPrompt && (
                  <div className="small mb-3 auth__message">
                    <p className="mb-2">
                      Already registered? <Link to="/login">Login here</Link>
                    </p>
                    {existingEmailProvider === "google.com" && (
                      <Button
                        type="button"
                        color="light"
                        className="w-100"
                        onClick={() =>
                          savePasswordForExistingGoogleAccount({
                            ...credentials,
                            firstName: formatNameValue(credentials.firstName),
                            lastName: formatNameValue(credentials.lastName),
                            email: credentials.email.trim(),
                          })
                        }
                        disabled={loading}
                      >
                        {loading
                          ? "Saving password..."
                          : "Save password for login"}
                      </Button>
                    )}
                  </div>
                )}

                <Form onSubmit={handleClick} autoComplete="off">
                  <FormGroup className="profile__upload__group">
                    <label
                      htmlFor="profilePhoto"
                      className="profile__upload__label"
                    >
                      Upload profile photo
                    </label>
                    <input
                      className="profile__upload__input"
                      type="file"
                      id="profilePhoto"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      autoComplete="off"
                    />
                  </FormGroup>

                  <FormGroup>
                    <input
                      type="text"
                      placeholder="First name"
                      id="firstName"
                      value={credentials.firstName}
                      onChange={handleChange}
                      autoComplete="off"
                      required
                    />
                    {fieldErrors.firstName && (
                      <small className="auth__error">
                        {fieldErrors.firstName}
                      </small>
                    )}
                  </FormGroup>
                  <FormGroup>
                    <input
                      type="text"
                      placeholder="Last name"
                      id="lastName"
                      value={credentials.lastName}
                      onChange={handleChange}
                      autoComplete="off"
                      required
                    />
                    {fieldErrors.lastName && (
                      <small className="auth__error">
                        {fieldErrors.lastName}
                      </small>
                    )}
                  </FormGroup>
                  <FormGroup>
                    <input
                      type="email"
                      placeholder="Email"
                      id="email"
                      value={credentials.email}
                      onChange={handleChange}
                      autoComplete="off"
                      required
                    />
                    {fieldErrors.email && (
                      <small className="auth__error">{fieldErrors.email}</small>
                    )}
                  </FormGroup>
                  <FormGroup>
                    <div className="password__input__group">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create password"
                        id="password"
                        value={credentials.password}
                        onChange={handleChange}
                        autoComplete="off"
                        required
                      />
                      <button
                        type="button"
                        className="password__toggle"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <VisibilityOffOutlinedIcon fontSize="small" />
                        ) : (
                          <VisibilityOutlinedIcon fontSize="small" />
                        )}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <small className="auth__error">
                        {fieldErrors.password}
                      </small>
                    )}
                  </FormGroup>
                  <FormGroup>
                    <div className="password__input__group">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        id="confirmPassword"
                        value={credentials.confirmPassword}
                        onChange={handleChange}
                        autoComplete="off"
                        required
                      />
                      <button
                        type="button"
                        className="password__toggle"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                      >
                        {showConfirmPassword ? (
                          <VisibilityOffOutlinedIcon fontSize="small" />
                        ) : (
                          <VisibilityOutlinedIcon fontSize="small" />
                        )}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <small className="auth__error">
                        {fieldErrors.confirmPassword}
                      </small>
                    )}
                  </FormGroup>

                  <p className="password__rules">
                    Use 8+ characters with uppercase, lowercase, number, and
                    special character.
                  </p>

                  <Button
                    className="btn secondary__btn auth__btn"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                </Form>
                <p>
                  Already have an account? <Link to="/login">Login</Link>
                </p>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Register;

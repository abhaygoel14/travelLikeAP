import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  FormGroup,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  Spinner,
} from "reactstrap";
import "../styles/login.css";
import { Link, useNavigate } from "react-router-dom";
import loginImg from "../assets/images/login.png";
import userIcon from "../assets/images/user.png";
import { AuthContext } from "../context/AuthContext";

// Firebase imports
import {
  auth,
  firebaseConfigError,
  firebaseReady,
  realtimeDb,
} from "../utils/firebaseConfig";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  // signInWithPhoneNumber,
  // RecaptchaVerifier,
  fetchSignInMethodsForEmail,
  EmailAuthProvider,
  linkWithCredential,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import {
  get,
  ref,
  set,
  update,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeEmail = (value = "") => String(value).trim().toLowerCase();
const isPlaceholderName = (value = "") => {
  const normalizedValue = String(value || "")
    .trim()
    .toLowerCase();
  return (
    !normalizedValue || ["traveler", "traveller"].includes(normalizedValue)
  );
};
const buildFullName = (...parts) =>
  parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
const resolveProfileName = (...sources) => {
  for (const source of sources) {
    const fullName = buildFullName(source?.firstName, source?.lastName);
    if (fullName) {
      return fullName;
    }

    const displayName = String(source?.displayName || "").trim();
    if (!isPlaceholderName(displayName)) {
      return displayName;
    }

    const username = String(source?.username || "").trim();
    if (!isPlaceholderName(username)) {
      return username;
    }
  }

  return "";
};

const isUploadedProfilePhoto = (value = "") => {
  const trimmedValue = String(value || "").trim();

  if (!trimmedValue) {
    return false;
  }

  return (
    trimmedValue.startsWith("data:") ||
    /firebasestorage\.googleapis\.com|storage\.googleapis\.com/i.test(
      trimmedValue,
    )
  );
};

const resolveUploadedProfilePhoto = (...values) =>
  values
    .map((value) => String(value || "").trim())
    .find((value) => isUploadedProfilePhoto(value)) || "";

const getPasswordValidationMessage = (password = "") => {
  if (!password) return "Please enter your password.";
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must include at least one lowercase letter.";
  }
  if (!/\d/.test(password)) {
    return "Password must include at least one number.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include at least one special character.";
  }

  return "";
};

const getGreetingName = (profile) => {
  return resolveProfileName(profile) || "there";
};

const GOOGLE_SERVICE_DOWN_MESSAGE =
  "Currently our service is down. Please come back after 1-2 hours. Thanks for your patience.";

const isServiceOutageError = (error) => {
  const details = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();

  return [
    "500",
    "internal-error",
    "network-request-failed",
    "failed to fetch",
    "service unavailable",
  ].some((keyword) => details.includes(keyword));
};

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    canAddPasswordInstead: false,
  });

  // const [phoneNumber, setPhoneNumber] = useState("");
  // const [otp, setOtp] = useState("");
  // const [showOtpInput, setShowOtpInput] = useState(false);
  const [authMethod, setAuthMethod] = useState("email"); // 'email', 'google'
  // const [verificationId, setVerificationId] = useState(null);
  // const [recaptchaSetup, setRecaptchaSetup] = useState(false);
  const [emailStep, setEmailStep] = useState("identify");
  const [emailStatus, setEmailStatus] = useState({ type: "", text: "" });
  const [matchedUserName, setMatchedUserName] = useState("there");
  const [emailProviderHint, setEmailProviderHint] = useState("");
  const [emailFlowLoading, setEmailFlowLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [showGoogleRetryCta, setShowGoogleRetryCta] = useState(false);
  const [serviceModal, setServiceModal] = useState({
    open: false,
    title: "Service is down",
    message: GOOGLE_SERVICE_DOWN_MESSAGE,
    showSignupAction: true,
  });

  const googleTimeoutRef = useRef(null);
  const googleRetryTimeoutRef = useRef(null);
  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (googleTimeoutRef.current) {
        window.clearTimeout(googleTimeoutRef.current);
      }

      if (googleRetryTimeoutRef.current) {
        window.clearTimeout(googleRetryTimeoutRef.current);
      }
    };
  }, []);

  const closeServiceModal = () => {
    setServiceModal((prev) => ({ ...prev, open: false }));
  };

  const openServiceDownModal = (
    message = GOOGLE_SERVICE_DOWN_MESSAGE,
    options = {},
  ) => {
    setServiceModal({
      open: true,
      title: options.title || "Service is down",
      message,
      showSignupAction: options.showSignupAction ?? true,
    });
  };

  const beginGoogleLoading = () => {
    setGoogleLoading(true);
    setShowGoogleRetryCta(false);

    if (googleRetryTimeoutRef.current) {
      window.clearTimeout(googleRetryTimeoutRef.current);
      googleRetryTimeoutRef.current = null;
    }

    if (googleTimeoutRef.current) {
      window.clearTimeout(googleTimeoutRef.current);
    }

    googleTimeoutRef.current = window.setTimeout(() => {
      setGoogleLoading(false);
      dispatch({
        type: "LOGIN_FAILURE",
        payload: GOOGLE_SERVICE_DOWN_MESSAGE,
      });
      openServiceDownModal(
        "Google login is taking longer than usual. Service is down right now. Try with Sign up user.",
      );
    }, 12000);
  };

  const finishGoogleLoading = () => {
    if (googleTimeoutRef.current) {
      window.clearTimeout(googleTimeoutRef.current);
      googleTimeoutRef.current = null;
    }

    setGoogleLoading(false);
  };

  const scheduleGoogleRetryPrompt = (
    message = "Login with Google failed. Try again.",
  ) => {
    setShowGoogleRetryCta(false);

    if (googleRetryTimeoutRef.current) {
      window.clearTimeout(googleRetryTimeoutRef.current);
    }

    googleRetryTimeoutRef.current = window.setTimeout(() => {
      setEmailStatus({ type: "error", text: message });
      setShowGoogleRetryCta(true);
    }, 10000);
  };

  const ensureFirebaseReady = () => {
    if (firebaseReady && auth) {
      return true;
    }

    const message =
      firebaseConfigError ||
      "Firebase is not configured. Please add your Firebase web app credentials.";

    dispatch({ type: "LOGIN_FAILURE", payload: message });
    alert(message);
    return false;
  };

  const syncUserProfile = async (firebaseUser, extraData = {}) => {
    const providerIds = Array.isArray(firebaseUser.providerData)
      ? firebaseUser.providerData.map((item) => item.providerId).filter(Boolean)
      : [];
    const requestedProviders = String(extraData.provider || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const hasPasswordProvider =
      providerIds.includes("password") ||
      requestedProviders.includes("password") ||
      Boolean(extraData.hasPassword);

    const fallbackDisplayName =
      resolveProfileName(extraData, firebaseUser) || "Traveler";
    const resolvedFallbackPhoto = resolveUploadedProfilePhoto(
      extraData.uploadedProfilePhoto,
      extraData.profileUrl,
      extraData.imageUrl,
    );
    const fallbackProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || "",
      firstName: extraData.firstName || "",
      lastName: extraData.lastName || "",
      displayName: fallbackDisplayName,
      username: extraData.username || fallbackDisplayName,
      photoURL: resolvedFallbackPhoto,
      uploadedProfilePhoto: resolvedFallbackPhoto,
      profileUrl: resolvedFallbackPhoto,
      imageUrl: resolvedFallbackPhoto,
      phoneNumber: firebaseUser.phoneNumber || "",
      role: "user",
      provider:
        extraData.provider ||
        firebaseUser.providerData?.[0]?.providerId ||
        "firebase",
      authProviders: [...new Set([...providerIds, ...requestedProviders])],
      hasPassword: hasPasswordProvider,
      lastLoginAt: new Date().toISOString(),
    };

    if (!realtimeDb) {
      return fallbackProfile;
    }

    const userRef = ref(realtimeDb, `users/${firebaseUser.uid}`);
    const snapshot = await get(userRef);
    const existingProfile = snapshot.exists() ? snapshot.val() || {} : {};
    const mergedProviders = [
      ...new Set([
        ...(Array.isArray(existingProfile.authProviders)
          ? existingProfile.authProviders
          : []),
        ...providerIds,
        ...requestedProviders,
      ]),
    ];
    const resolvedHasPassword = Boolean(
      existingProfile.hasPassword ||
      hasPasswordProvider ||
      mergedProviders.includes("password"),
    );

    const resolvedDisplayName =
      resolveProfileName(existingProfile, extraData, firebaseUser) ||
      "Traveler";
    const derivedFirstName = String(
      existingProfile.firstName || extraData.firstName || resolvedDisplayName,
    )
      .trim()
      .split(" ")[0];
    const derivedLastName = String(
      existingProfile.lastName || extraData.lastName || "",
    ).trim();
    const resolvedProfilePhoto = resolveUploadedProfilePhoto(
      existingProfile.uploadedProfilePhoto,
      existingProfile.profileUrl,
      existingProfile.imageUrl,
      extraData.uploadedProfilePhoto,
      extraData.profileUrl,
      extraData.imageUrl,
    );

    const baseProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || "",
      firstName: derivedFirstName || existingProfile.firstName || "",
      lastName: derivedLastName,
      displayName: resolvedDisplayName,
      username:
        existingProfile.username || extraData.username || resolvedDisplayName,
      photoURL: resolvedProfilePhoto,
      uploadedProfilePhoto: resolvedProfilePhoto,
      profileUrl: resolvedProfilePhoto,
      imageUrl: resolvedProfilePhoto,
      phoneNumber:
        firebaseUser.phoneNumber || existingProfile.phoneNumber || "",
      role: existingProfile.role || "user",
      provider:
        requestedProviders.length > 0
          ? requestedProviders.join(",")
          : existingProfile.provider ||
            firebaseUser.providerData?.[0]?.providerId ||
            "firebase",
      authProviders: mergedProviders,
      hasPassword: resolvedHasPassword,
      lastLoginAt: new Date().toISOString(),
    };

    if (snapshot.exists()) {
      const mergedProfile = {
        ...existingProfile,
        ...baseProfile,
      };
      await update(userRef, mergedProfile);
      return mergedProfile;
    }

    const newProfile = {
      ...baseProfile,
      createdAt: new Date().toISOString(),
    };
    await set(userRef, newProfile);
    return newProfile;
  };

  // useEffect(() => {
  //   // Check if reCAPTCHA script is loaded
  //   if (
  //     firebaseReady &&
  //     auth &&
  //     window.grecaptcha &&
  //     !recaptchaSetup &&
  //     authMethod === "phone"
  //   ) {
  //     try {
  //       // Initialize reCAPTCHA for phone sign-in
  //       window.recaptchaVerifier = new RecaptchaVerifier(
  //         auth,
  //         "recaptcha-container",
  //         {
  //           size: "normal",
  //           callback: () => {
  //             console.log("reCAPTCHA verified");
  //           },
  //           "expired-callback": () => {
  //             console.log("reCAPTCHA expired");
  //           },
  //         },
  //       );
  //
  //       setRecaptchaSetup(true);
  //     } catch (err) {
  //       console.error("Error setting up reCAPTCHA:", err);
  //     }
  //   }
  // }, [authMethod, recaptchaSetup]);

  const findUserByEmail = async (email) => {
    const normalizedEmail = normalizeEmail(email);

    if (!realtimeDb || !normalizedEmail) {
      return null;
    }

    try {
      const userQuery = query(
        ref(realtimeDb, "users"),
        orderByChild("email"),
        equalTo(normalizedEmail),
      );
      const snapshot = await get(userQuery);

      if (snapshot.exists()) {
        return Object.values(snapshot.val() || {})[0] || null;
      }

      const fallbackSnapshot = await get(ref(realtimeDb, "users"));
      if (!fallbackSnapshot.exists()) {
        return null;
      }

      const matchedUser = Object.values(fallbackSnapshot.val() || {}).find(
        (user) => normalizeEmail(user?.email) === normalizedEmail,
      );

      return matchedUser || null;
    } catch (error) {
      console.error("Error fetching user profile by email:", error);
      return null;
    }
  };

  const resetEmailFlow = () => {
    setEmailStep("identify");
    setEmailProviderHint("");
    setMatchedUserName("there");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setEmailStatus({ type: "", text: "" });
    setCredentials((prev) => ({
      ...prev,
      password: "",
      confirmPassword: "",
      canAddPasswordInstead: false,
    }));
  };

  const openCreatePasswordFlow = (name = matchedUserName) => {
    setEmailStep("create-password");
    setEmailProviderHint("google.com");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setEmailStatus({
      type: "success",
      text: `Hello ${name}, add a password now so you can log in without Google next time.`,
    });
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setCredentials((prev) => ({ ...prev, [id]: value }));

    if (id === "email") {
      setEmailStep("identify");
      setEmailProviderHint("");
      setMatchedUserName("there");
      setCredentials((prev) => ({ ...prev, canAddPasswordInstead: false }));
    }

    if (emailStatus.text) {
      setEmailStatus({ type: "", text: "" });
    }
  };

  const handleEmailLookup = async (e) => {
    e.preventDefault();

    if (!ensureFirebaseReady()) return;

    const normalizedEmail = normalizeEmail(credentials.email);

    if (!normalizedEmail) {
      setEmailStatus({ type: "error", text: "Please enter your email id." });
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setEmailStatus({
        type: "error",
        text: "Please enter a valid email address.",
      });
      return;
    }

    setEmailFlowLoading(true);
    setEmailStatus({ type: "", text: "" });

    try {
      const profile = await findUserByEmail(normalizedEmail);
      let signInMethods = [];

      try {
        signInMethods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
      } catch (signInMethodError) {
        console.warn(
          "Could not fetch sign-in methods for email:",
          signInMethodError,
        );
      }

      const firstName = getGreetingName(profile, normalizedEmail);
      const profileProviders = [
        ...(Array.isArray(profile?.authProviders) ? profile.authProviders : []),
        ...String(profile?.provider || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      ];
      const availableMethods = [
        ...new Set([
          ...(Array.isArray(signInMethods) ? signInMethods : []),
          ...profileProviders,
          ...(profile?.hasPassword ? ["password"] : []),
        ]),
      ];
      const hasPasswordAvailable =
        availableMethods.includes("password") || profile?.hasPassword === true;
      const canAddPasswordInstead =
        !hasPasswordAvailable &&
        (profileProviders.includes("google.com") ||
          availableMethods.includes("google.com") ||
          Boolean(profile));
      const matchedProvider = profileProviders.includes("google.com")
        ? "google.com"
        : profileProviders[0] || "unknown";
      const knownUserWithoutPassword =
        Boolean(profile) && !hasPasswordAvailable;

      setMatchedUserName(firstName);
      setCredentials((prev) => ({
        ...prev,
        email: normalizedEmail,
        canAddPasswordInstead,
      }));

      if (knownUserWithoutPassword) {
        setEmailStep("create-password");
        setEmailProviderHint(matchedProvider);
        setEmailStatus({
          type: matchedProvider === "phone" ? "error" : "success",
          text:
            matchedProvider === "phone"
              ? `Hello ${firstName}, this account uses phone sign-in. Use that method to continue first.`
              : `Hello ${firstName}, add a password now for faster future login.`,
        });
        return;
      }

      if (!availableMethods.length) {
        setEmailStep("password");
        setEmailProviderHint("unknown");
        setEmailStatus({
          type: "success",
          text: `Hello ${firstName}, enter your password to continue. If you used Google before, choose Google above instead.`,
        });
        return;
      }

      if (hasPasswordAvailable) {
        setEmailStep("password");
        setEmailProviderHint("password");
        setEmailStatus({
          type: "success",
          text: `Hello ${firstName}, enter your password to continue.`,
        });
        return;
      }

      const primaryProvider = availableMethods[0] || "";
      setEmailStep("create-password");
      setEmailProviderHint(primaryProvider);

      if (primaryProvider === "google.com") {
        setEmailStatus({
          type: "success",
          text: `Hello ${firstName}, add a password now for faster future login.`,
        });
        return;
      }

      const providerLabel =
        primaryProvider === "phone"
          ? "phone sign-in"
          : "your existing sign-in method";
      setEmailStatus({
        type: "error",
        text: `Hello ${firstName}, this account uses ${providerLabel}. Use that method to continue.`,
      });
    } catch (err) {
      console.error("Email lookup error:", err);
      setEmailStep("identify");
      setEmailProviderHint("");

      const lookupMessage = isServiceOutageError(err)
        ? GOOGLE_SERVICE_DOWN_MESSAGE
        : err.message || "Could not check this email right now.";

      setEmailStatus({
        type: "error",
        text: lookupMessage,
      });

      if (isServiceOutageError(err)) {
        openServiceDownModal(lookupMessage);
      }
    } finally {
      setEmailFlowLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!ensureFirebaseReady()) return;

    const normalizedEmail = normalizeEmail(credentials.email);

    if (!normalizedEmail) {
      setEmailStatus({
        type: "error",
        text: "Please enter your email first so we can send a reset link.",
      });
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setEmailStatus({
        type: "error",
        text: "Please enter a valid email address to reset your password.",
      });
      return;
    }

    setCredentials((prev) => ({
      ...prev,
      password: "",
      confirmPassword: "",
      canAddPasswordInstead: false,
    }));
    setEmailStep("identify");
    setEmailProviderHint("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setResetPasswordLoading(true);

    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
      const resetSuccessMessage = `Password reset link sent to ${normalizedEmail}. Please check your inbox or spam folder.`;

      setEmailStatus({
        type: "success",
        text: resetSuccessMessage,
      });
      openServiceDownModal(resetSuccessMessage, {
        title: "Reset link sent",
        showSignupAction: false,
      });
    } catch (err) {
      console.error("Reset password error:", err);

      const resetMessage = isServiceOutageError(err)
        ? GOOGLE_SERVICE_DOWN_MESSAGE
        : err?.code === "auth/user-not-found"
          ? `We could not find an account for ${normalizedEmail}.`
          : err.message || "Unable to send the reset password link right now.";

      setEmailStatus({ type: "error", text: resetMessage });

      if (isServiceOutageError(err)) {
        openServiceDownModal(resetMessage);
      }
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    if (!ensureFirebaseReady()) return;

    if (!String(credentials.password || "").trim()) {
      setEmailStatus({ type: "error", text: "Please enter your password." });
      return;
    }

    dispatch({ type: "LOGIN_START" });

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        String(credentials.email || "").trim(),
        credentials.password,
      );

      const userData = await syncUserProfile(userCredential.user, {
        provider: "password",
        hasPassword: true,
      });

      dispatch({ type: "LOGIN_SUCCESS", payload: userData });
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);

      const isWrongPasswordError =
        err?.code === "auth/wrong-password" ||
        err?.code === "auth/invalid-credential";
      const shouldOfferPasswordCreation = err?.code === "auth/user-not-found";
      const detectedUserName =
        matchedUserName && matchedUserName !== "there" ? matchedUserName : "";

      if (isServiceOutageError(err)) {
        dispatch({
          type: "LOGIN_FAILURE",
          payload: GOOGLE_SERVICE_DOWN_MESSAGE,
        });
        setEmailStatus({
          type: "error",
          text: GOOGLE_SERVICE_DOWN_MESSAGE,
        });
        openServiceDownModal(GOOGLE_SERVICE_DOWN_MESSAGE);
        return;
      }

      if (isWrongPasswordError) {
        const wrongPasswordMessage = detectedUserName
          ? `Hello ${detectedUserName}, please enter the right password to continue.`
          : "Please enter the right password to continue.";

        dispatch({
          type: "LOGIN_FAILURE",
          payload: wrongPasswordMessage,
        });
        setEmailStatus({ type: "error", text: wrongPasswordMessage });
        return;
      }

      if (shouldOfferPasswordCreation && emailProviderHint !== "password") {
        dispatch({
          type: "LOGIN_FAILURE",
          payload:
            err.message || "Password login was not available for this account.",
        });
        openCreatePasswordFlow(matchedUserName);
        return;
      }

      const loginMessage =
        err?.code === "auth/user-not-found"
          ? `Hello ${matchedUserName}, we could not find this account for password login.`
          : err.message || "An error occurred during login";

      dispatch({
        type: "LOGIN_FAILURE",
        payload: loginMessage,
      });
      setEmailStatus({ type: "error", text: loginMessage });
    }
  };

  const handleCreatePassword = async (e) => {
    e.preventDefault();

    if (!ensureFirebaseReady()) return;

    const passwordMessage = getPasswordValidationMessage(credentials.password);
    if (passwordMessage) {
      setEmailStatus({ type: "error", text: passwordMessage });
      return;
    }

    if (credentials.password !== credentials.confirmPassword) {
      setEmailStatus({
        type: "error",
        text: "Password and confirm password do not match.",
      });
      return;
    }

    const canUseGooglePasswordSetup =
      !emailProviderHint ||
      emailProviderHint === "google.com" ||
      emailProviderHint === "unknown";

    if (!canUseGooglePasswordSetup) {
      const providerLabel =
        emailProviderHint === "phone" ? "Phone" : "your current sign-in method";
      setEmailStatus({
        type: "error",
        text: `Hello ${matchedUserName}, please continue with ${providerLabel} first to add a password.`,
      });
      return;
    }

    beginGoogleLoading();
    dispatch({ type: "LOGIN_START" });

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
        login_hint: String(credentials.email || "").trim(),
      });

      const result = await signInWithPopup(auth, provider);
      const signedInEmail = String(result.user.email || "")
        .trim()
        .toLowerCase();

      if (
        signedInEmail !==
        String(credentials.email || "")
          .trim()
          .toLowerCase()
      ) {
        await signOut(auth);
        throw new Error(
          "Please continue with the same Google account to save your password.",
        );
      }

      const passwordCredential = EmailAuthProvider.credential(
        String(credentials.email || "").trim(),
        credentials.password,
      );

      await linkWithCredential(result.user, passwordCredential);

      const userData = await syncUserProfile(result.user, {
        provider: "google.com,password",
        hasPassword: true,
      });

      dispatch({ type: "LOGIN_SUCCESS", payload: userData });
      setEmailStatus({
        type: "success",
        text: `Hello ${matchedUserName}, your password is saved and you're ready to go.`,
      });
      navigate("/dashboard");
    } catch (err) {
      console.error("Create password error:", err);

      const helperMessage = isServiceOutageError(err)
        ? GOOGLE_SERVICE_DOWN_MESSAGE
        : err?.code === "auth/provider-already-linked" ||
            err?.code === "auth/credential-already-in-use"
          ? `Hello ${matchedUserName}, this account already has a password. Please enter the right password to continue.`
          : err.message || "Unable to save your password right now.";

      if (
        err?.code === "auth/provider-already-linked" ||
        err?.code === "auth/credential-already-in-use"
      ) {
        setEmailStep("password");
        setEmailProviderHint("password");
      }

      dispatch({
        type: "LOGIN_FAILURE",
        payload: helperMessage,
      });
      setEmailStatus({ type: "error", text: helperMessage });

      if (
        err?.code !== "auth/provider-already-linked" &&
        err?.code !== "auth/credential-already-in-use"
      ) {
        openServiceDownModal(helperMessage || GOOGLE_SERVICE_DOWN_MESSAGE);
      }
    } finally {
      finishGoogleLoading();
    }
  };

  // Google Sign-In
  const handleGoogleSignIn = async (e) => {
    e.preventDefault();

    if (!ensureFirebaseReady()) return;

    beginGoogleLoading();
    dispatch({ type: "LOGIN_START" });

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);
      const userData = await syncUserProfile(result.user, {
        provider: "google.com",
        hasPassword: result.user.providerData?.some(
          (item) => item.providerId === "password",
        ),
      });

      dispatch({ type: "LOGIN_SUCCESS", payload: userData });
      navigate("/dashboard");
    } catch (err) {
      console.error("Google sign-in error:", err);

      const helperMessage =
        err?.code === "auth/popup-closed-by-user"
          ? "Login with Google failed. Try again."
          : err?.code === "auth/popup-blocked"
            ? "Popup was blocked. Please allow popups or try with Sign up user."
            : isServiceOutageError(err)
              ? GOOGLE_SERVICE_DOWN_MESSAGE
              : GOOGLE_SERVICE_DOWN_MESSAGE;

      dispatch({
        type: "LOGIN_FAILURE",
        payload: helperMessage,
      });

      if (err?.code === "auth/popup-closed-by-user") {
        scheduleGoogleRetryPrompt(helperMessage);
      } else {
        setEmailStatus({ type: "error", text: helperMessage });
        openServiceDownModal(helperMessage);
      }
    } finally {
      finishGoogleLoading();
    }
  };

  // Phone Number Sign-In temporarily disabled
  // const handleSendOtp = async (e) => {
  //   e.preventDefault();
  //
  //   if (!phoneNumber.trim()) {
  //     alert("Please enter a phone number");
  //     return;
  //   }
  //
  //   const formattedPhone = phoneNumber.startsWith("+")
  //     ? phoneNumber
  //     : "+1" + phoneNumber.replace(/\D/g, "");
  //
  //   if (!ensureFirebaseReady()) return;
  //
  //   try {
  //     dispatch({ type: "LOGIN_START" });
  //     const appVerifier = window.recaptchaVerifier;
  //     const confirmationResult = await signInWithPhoneNumber(
  //       auth,
  //       formattedPhone,
  //       appVerifier,
  //     );
  //
  //     setVerificationId(confirmationResult);
  //     setShowOtpInput(true);
  //     alert("OTP sent to your phone number");
  //     dispatch({ type: "LOGOUT" });
  //   } catch (err) {
  //     console.error("Phone sign-in error:", err);
  //     alert("Error sending OTP: " + err.message);
  //     dispatch({ type: "LOGIN_FAILURE", payload: err.message });
  //   }
  // };

  // const handleVerifyOtp = async (e) => {
  //   e.preventDefault();
  //
  //   if (!otp.trim()) {
  //     alert("Please enter the OTP");
  //     return;
  //   }
  //
  //   if (!verificationId) {
  //     alert("Please request an OTP first");
  //     return;
  //   }
  //
  //   if (!ensureFirebaseReady()) return;
  //
  //   dispatch({ type: "LOGIN_START" });
  //
  //   try {
  //     const result = await verificationId.confirm(otp);
  //     const userData = await syncUserProfile(result.user, {
  //       provider: "phone",
  //       hasPassword: false,
  //     });
  //
  //     dispatch({ type: "LOGIN_SUCCESS", payload: userData });
  //     navigate("/dashboard");
  //   } catch (err) {
  //     console.error("OTP verification error:", err);
  //     alert("Invalid OTP: " + err.message);
  //     dispatch({ type: "LOGIN_FAILURE", payload: err.message });
  //   }
  // };

  return (
    <section>
      <Container>
        <Row>
          <Col lg="8" className="m-auto">
            <div className="login__container d-flex justify-content-between">
              <div className="login__img">
                <img src={loginImg} alt="Login" />
              </div>

              <div className="login__form">
                <div className="user">
                  <img src={userIcon} alt="User" />
                </div>
                <h2>Login</h2>

                {!firebaseReady && (
                  <p className="text-danger small mb-3">
                    {firebaseConfigError}
                  </p>
                )}

                {/* Auth Method Selector */}
                <div className="auth__method__selector">
                  <Button
                    color={authMethod === "email" ? "primary" : "light"}
                    onClick={() => {
                      setAuthMethod("email");
                      resetEmailFlow();
                    }}
                    size="sm"
                    className="me-2"
                  >
                    Email
                  </Button>
                  <Button
                    color={authMethod === "google" ? "primary" : "light"}
                    onClick={() => {
                      setAuthMethod("google");
                      resetEmailFlow();
                    }}
                    size="sm"
                  >
                    Google
                  </Button>
                  {/*
                  <Button
                    color={authMethod === "phone" ? "primary" : "light"}
                    onClick={() => {
                      setAuthMethod("phone");
                      resetEmailFlow();
                    }}
                    size="sm"
                  >
                    Phone
                  </Button>
                  */}
                </div>

                {/* Email Login */}
                {authMethod === "email" && (
                  <Form
                    onSubmit={
                      emailStep === "identify"
                        ? handleEmailLookup
                        : emailStep === "password"
                          ? handleEmailLogin
                          : handleCreatePassword
                    }
                  >
                    <FormGroup>
                      <input
                        type="email"
                        placeholder="Email"
                        id="email"
                        value={credentials.email}
                        onChange={handleChange}
                        required
                      />
                    </FormGroup>

                    {emailStatus.text && (
                      <p
                        className={`auth__status ${emailStatus.type === "error" ? "auth__status--error" : "auth__status--success"}`}
                      >
                        {emailStatus.text}
                      </p>
                    )}

                    {emailStep !== "identify" && (
                      <div className="auth__email__summary">
                        <span>{`Hello ${matchedUserName}`}</span>
                        <button
                          type="button"
                          className="auth__text__btn"
                          onClick={resetEmailFlow}
                        >
                          Change email
                        </button>
                      </div>
                    )}

                    {emailStep === "identify" && (
                      <Button
                        className="btn secondary__btn auth__btn"
                        type="submit"
                        disabled={emailFlowLoading}
                      >
                        {emailFlowLoading ? "Checking..." : "Continue"}
                      </Button>
                    )}

                    {emailStep === "password" && (
                      <>
                        <FormGroup>
                          <div className="password__input__group">
                            <input
                              type={showPassword ? "text" : "password"}
                              placeholder="Password"
                              id="password"
                              value={credentials.password}
                              onChange={handleChange}
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
                        </FormGroup>
                        <Button
                          className="btn secondary__btn auth__btn"
                          type="submit"
                        >
                          Login
                        </Button>
                        <button
                          type="button"
                          className="auth__text__btn auth__text__btn--center"
                          onClick={handleResetPassword}
                          disabled={resetPasswordLoading}
                        >
                          {resetPasswordLoading
                            ? "Sending reset link..."
                            : "Forgot password? Send reset link"}
                        </button>
                        {credentials.canAddPasswordInstead && (
                          <>
                            <Button
                              className="btn btn-light w-100 mt-2"
                              type="button"
                              onClick={() =>
                                openCreatePasswordFlow(matchedUserName)
                              }
                            >
                              Add password instead
                            </Button>
                            <Button
                              className="btn btn-light w-100 mt-2"
                              type="button"
                              onClick={() => setAuthMethod("google")}
                            >
                              Continue with Google
                            </Button>
                          </>
                        )}
                      </>
                    )}

                    {emailStep === "create-password" && (
                      <>
                        {emailProviderHint === "google.com" ||
                        emailProviderHint === "unknown" ? (
                          <>
                            <FormGroup>
                              <div className="password__input__group">
                                <input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Create password"
                                  id="password"
                                  value={credentials.password}
                                  onChange={handleChange}
                                  required
                                />
                                <button
                                  type="button"
                                  className="password__toggle"
                                  onClick={() =>
                                    setShowPassword((prev) => !prev)
                                  }
                                  aria-label={
                                    showPassword
                                      ? "Hide password"
                                      : "Show password"
                                  }
                                >
                                  {showPassword ? (
                                    <VisibilityOffOutlinedIcon fontSize="small" />
                                  ) : (
                                    <VisibilityOutlinedIcon fontSize="small" />
                                  )}
                                </button>
                              </div>
                            </FormGroup>
                            <FormGroup>
                              <div className="password__input__group">
                                <input
                                  type={
                                    showConfirmPassword ? "text" : "password"
                                  }
                                  placeholder="Confirm password"
                                  id="confirmPassword"
                                  value={credentials.confirmPassword}
                                  onChange={handleChange}
                                  required
                                />
                                <button
                                  type="button"
                                  className="password__toggle"
                                  onClick={() =>
                                    setShowConfirmPassword((prev) => !prev)
                                  }
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
                            </FormGroup>
                            <p className="password__rules">
                              Use 8+ characters with uppercase, lowercase,
                              number, and special character.
                            </p>
                            <Button
                              className="btn secondary__btn auth__btn"
                              type="submit"
                              disabled={googleLoading}
                            >
                              {googleLoading
                                ? "Connecting to Google..."
                                : "Save password & continue"}
                            </Button>
                          </>
                        ) : (
                          <Button
                            className="btn secondary__btn auth__btn"
                            type="button"
                            onClick={() =>
                              setAuthMethod(
                                emailProviderHint === "phone"
                                  ? "phone"
                                  : "google",
                              )
                            }
                          >
                            Use existing sign-in method
                          </Button>
                        )}
                      </>
                    )}
                  </Form>
                )}

                {/* Google Login */}
                {authMethod === "google" && (
                  <Form onSubmit={handleGoogleSignIn}>
                    {emailStatus.text && (
                      <p
                        className={`auth__status ${emailStatus.type === "error" ? "auth__status--error" : "auth__status--success"}`}
                      >
                        {emailStatus.text}
                      </p>
                    )}
                    <Button
                      className="btn secondary__btn auth__btn w-100"
                      type="submit"
                      disabled={googleLoading}
                    >
                      {googleLoading ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Signing in with Google...
                        </>
                      ) : showGoogleRetryCta ? (
                        "Try Again with Google"
                      ) : (
                        "Sign In with Google"
                      )}
                    </Button>
                  </Form>
                )}

                {/* Phone Login temporarily disabled */}
                {/*
                {authMethod === "phone" && (
                  <>
                    <div id="recaptcha-container" className="mb-3"></div>
                    <Form
                      onSubmit={showOtpInput ? handleVerifyOtp : handleSendOtp}
                    >
                      {!showOtpInput ? (
                        <>
                          <FormGroup>
                            <input
                              type="tel"
                              placeholder="Phone (e.g., +1234567890)"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              required
                            />
                          </FormGroup>
                          <Button
                            className="btn secondary__btn auth__btn"
                            type="submit"
                          >
                            Send OTP
                          </Button>
                        </>
                      ) : (
                        <>
                          <FormGroup>
                            <input
                              type="text"
                              placeholder="Enter OTP"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value)}
                              required
                              maxLength="6"
                            />
                          </FormGroup>
                          <Button
                            className="btn secondary__btn auth__btn"
                            type="submit"
                          >
                            Verify OTP
                          </Button>
                          <Button
                            className="btn btn-outline-secondary mt-2"
                            onClick={() => {
                              setShowOtpInput(false);
                              setPhoneNumber("");
                              setOtp("");
                              setVerificationId(null);
                            }}
                          >
                            Back
                          </Button>
                        </>
                      )}
                    </Form>
                  </>
                )}
                */}

                <p>
                  Don't have an account? <Link to="/register">Create</Link>
                </p>

                <Modal
                  isOpen={serviceModal.open}
                  toggle={closeServiceModal}
                  centered
                  className="service__down__modal"
                >
                  <ModalBody>
                    <h4>{serviceModal.title}</h4>
                    <p>{serviceModal.message}</p>
                  </ModalBody>
                  <ModalFooter>
                    <Button color="light" onClick={closeServiceModal}>
                      Okay
                    </Button>
                    {serviceModal.showSignupAction && (
                      <Button
                        className="btn primary__btn"
                        onClick={() => {
                          closeServiceModal();
                          navigate("/register");
                        }}
                      >
                        Sign up
                      </Button>
                    )}
                  </ModalFooter>
                </Modal>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Login;

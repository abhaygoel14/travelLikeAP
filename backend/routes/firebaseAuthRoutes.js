/**
 * Firebase Authentication Routes Example
 * Add these routes to backend/routes/auth.js
 */

import express from 'express';
import {
  firebaseEmailLogin,
  googleSignIn,
  phoneSignIn,
  logout,
  getCurrentUser,
  verifyFirebaseToken,
} from '../Controllers/firebaseAuthController.js';

const router = express.Router();

/**
 * POST /auth/firebase/email-login
 * Login with email and password (Firebase)
 */
router.post('/firebase/email-login', firebaseEmailLogin);

/**
 * POST /auth/firebase/google-login
 * Login with Google
 */
router.post('/firebase/google-login', googleSignIn);

/**
 * POST /auth/firebase/phone-login
 * Login with phone number OTP
 */
router.post('/firebase/phone-login', phoneSignIn);

/**
 * POST /auth/firebase/logout
 * Logout user
 */
router.post('/firebase/logout', logout);

/**
 * GET /auth/firebase/me
 * Get current user (requires token)
 */
router.get('/firebase/me', verifyFirebaseToken, getCurrentUser);

// For backward compatibility with existing routes
router.post('/google-login', googleSignIn);
router.post('/phone-login', phoneSignIn);

export default router;

/**
 * Firebase Authentication Backend Controller Examples
 * These are example implementations for handling Firebase authentication
 * Add these to your backend/Controllers/authController.js
 */

// NOTE: You need to initialize Firebase Admin SDK in your backend:
// npm install firebase-admin
// Then in your server setup:
// const admin = require('firebase-admin');
// const serviceAccount = require('./path/to/serviceAccountKey.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

/**
 * Email/Password Login
 * Verifies Firebase token and finds/creates user
 */
export const firebaseEmailLogin = async (req, res) => {
  try {
    const { email, uid } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify Firebase ID token
    // const decodedToken = await admin.auth().verifyIdToken(idToken);

    // if (decodedToken.uid !== uid) {
    //   return res.status(401).json({ message: 'Token UID mismatch' });
    // }

    // Find user in database
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        email,
        uid,
        displayName: email.split('@')[0],
        username: email.split('@')[0],
        provider: 'email',
        createdAt: new Date(),
      });
      await user.save();
    }

    // Set secure session cookie if needed
    // res.cookie('sessionToken', idToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   sameSite: 'strict',
    //   maxAge: 3600000,
    // });

    return res.status(200).json({
      message: 'Email login successful',
      data: {
        id: user._id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        uid,
      },
    });
  } catch (err) {
    console.error('Email login error:', err);
    return res.status(500).json({
      message: 'Email login failed',
      error: err.message,
    });
  }
};

/**
 * Google Sign-In
 * Verifies Firebase Google token and handles user
 */
export const googleSignIn = async (req, res) => {
  try {
    const { uid, email, displayName, photoURL } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify Firebase token
    // const decodedToken = await admin.auth().verifyIdToken(idToken);
    // if (decodedToken.uid !== uid) {
    //   return res.status(401).json({ message: 'Token UID mismatch' });
    // }

    let user = await User.findOne({ $or: [{ email }, { uid }] });

    if (!user) {
      // Create new user from Google
      user = new User({
        uid,
        email,
        displayName,
        photoURL,
        username: displayName?.toLowerCase().replace(/\s+/g, '_') || email.split('@')[0],
        provider: 'google',
        createdAt: new Date(),
      });
      await user.save();
    } else {
      // Update existing user with Google data
      user.displayName = displayName || user.displayName;
      user.photoURL = photoURL || user.photoURL;
      user.provider = 'google';
      await user.save();
    }

    return res.status(200).json({
      message: 'Google login successful',
      data: {
        id: user._id,
        uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: user.provider,
      },
    });
  } catch (err) {
    console.error('Google sign-in error:', err);
    return res.status(500).json({
      message: 'Google sign-in failed',
      error: err.message,
    });
  }
};

/**
 * Phone Number Authentication
 * Verifies Firebase phone auth token
 */
export const phoneSignIn = async (req, res) => {
  try {
    const { uid, phoneNumber } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify Firebase token
    // const decodedToken = await admin.auth().verifyIdToken(idToken);
    // if (decodedToken.uid !== uid) {
    //   return res.status(401).json({ message: 'Token UID mismatch' });
    // }

    let user = await User.findOne({ $or: [{ phoneNumber }, { uid }] });

    if (!user) {
      // Create new user from phone
      user = new User({
        uid,
        phoneNumber,
        displayName: `User_${phoneNumber.slice(-4)}`,
        username: `user_${uid.slice(0, 8)}`,
        provider: 'phone',
        createdAt: new Date(),
      });
      await user.save();
    } else {
      // Update existing user
      user.phoneNumber = phoneNumber;
      user.provider = 'phone';
      await user.save();
    }

    return res.status(200).json({
      message: 'Phone login successful',
      data: {
        id: user._id,
        uid,
        phoneNumber: user.phoneNumber,
        displayName: user.displayName,
        provider: user.provider,
      },
    });
  } catch (err) {
    console.error('Phone sign-in error:', err);
    return res.status(500).json({
      message: 'Phone sign-in failed',
      error: err.message,
    });
  }
};

/**
 * Logout
 * Clears session and returns success
 */
export const logout = async (req, res) => {
  try {
    // Clear any session/cookies if implemented
    // res.clearCookie('sessionToken');

    return res.status(200).json({
      message: 'Logout successful',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Logout failed',
      error: err.message,
    });
  }
};

/**
 * Get Current User
 * Verifies token and returns current user data
 */
export const getCurrentUser = async (req, res) => {
  try {
    const uid = req.user?.uid; // Set by auth middleware

    if (!uid) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'User fetched successfully',
      data: user,
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Failed to fetch user',
      error: err.message,
    });
  }
};

/**
 * Example Middleware for Token Verification
 * Use this to protect routes
 */
export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Uncomment when Firebase Admin SDK is set up:
    // const decodedToken = await admin.auth().verifyIdToken(idToken);
    // req.user = decodedToken;

    next();
  } catch (err) {
    return res.status(401).json({
      message: 'Invalid token',
      error: err.message,
    });
  }
};

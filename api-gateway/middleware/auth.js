const admin = require('firebase-admin');

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else if (!admin.apps.length) {
    // For local dev without a service account, we initialize empty app
    // Note: auth().verifyIdToken() will fail without valid credentials.
    admin.initializeApp();
  }
} catch (error) {
  console.warn("Firebase Admin Initialization Warning:", error.message);
}

const requireAuth = async (req, res, next) => {
  // In development, if FIREBASE_SERVICE_ACCOUNT isn't set, we bypass for testing
  if (!process.env.FIREBASE_SERVICE_ACCOUNT && process.env.NODE_ENV !== 'production') {
    req.user = { uid: 'dev-user', email: 'dev@quantumedge.local' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = { requireAuth };

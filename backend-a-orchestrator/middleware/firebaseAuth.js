const { getFirebaseAuthClient } = require('../lib/firebaseAdmin');

const DEFAULT_MANAGER_ROLE_CLAIMS = ['admin', 'projectManager', 'manager'];
const DEFAULT_MANAGER_ROLE_VALUES = ['admin', 'project_manager', 'manager'];

const MANAGER_ROLE_CLAIMS = (
  process.env.FIREBASE_MANAGER_ROLE_CLAIMS ||
  DEFAULT_MANAGER_ROLE_CLAIMS.join(',')
)
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

const MANAGER_ROLE_VALUES = new Set(
  (process.env.FIREBASE_MANAGER_ROLE_VALUES ||
    DEFAULT_MANAGER_ROLE_VALUES.join(','))
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
);

const MANAGER_EMAILS = new Set(
  (process.env.FIREBASE_MANAGER_EMAILS || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
);

function extractBearerToken(authorizationHeader) {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') {
    return '';
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
    return '';
  }

  return token.trim();
}

function claimHasManagerRole(value) {
  if (value === true) {
    return true;
  }

  if (typeof value === 'string') {
    return MANAGER_ROLE_VALUES.has(value.trim().toLowerCase());
  }

  if (Array.isArray(value)) {
    return value.some(
      (entry) =>
        typeof entry === 'string' &&
        MANAGER_ROLE_VALUES.has(entry.trim().toLowerCase())
    );
  }

  return false;
}

function decodedTokenHasManagerAccess(decodedToken) {
  for (const claim of MANAGER_ROLE_CLAIMS) {
    if (claimHasManagerRole(decodedToken[claim])) {
      return true;
    }
  }

  if (claimHasManagerRole(decodedToken.role)) {
    return true;
  }

  if (claimHasManagerRole(decodedToken.roles)) {
    return true;
  }

  const email =
    typeof decodedToken.email === 'string'
      ? decodedToken.email.toLowerCase()
      : '';
  if (email && MANAGER_EMAILS.has(email)) {
    return true;
  }

  return false;
}

async function requireFirebaseManager(req, res, next) {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({
      success: false,
      errorCode: 'UNAUTHORIZED',
      message: 'Missing Firebase bearer token.',
    });
  }

  let authClient;

  try {
    authClient = getFirebaseAuthClient();
  } catch (err) {
    if (err && err.code === 'FIREBASE_NOT_CONFIGURED') {
      return res.status(503).json({
        success: false,
        errorCode: 'FIREBASE_NOT_CONFIGURED',
        message:
          'Firebase role auth is unavailable because admin credentials are not configured.',
      });
    }

    console.error('Failed to initialize Firebase admin SDK', err);
    return res.status(500).json({
      success: false,
      errorCode: 'FIREBASE_INIT_FAILED',
      message: 'Unable to initialize Firebase role authentication.',
    });
  }

  try {
    const decodedToken = await authClient.verifyIdToken(token, true);

    if (!decodedTokenHasManagerAccess(decodedToken)) {
      return res.status(403).json({
        success: false,
        errorCode: 'FORBIDDEN',
        message:
          'User lacks required manager role claim to review or close project intake.',
      });
    }

    req.authUser = {
      uid: decodedToken.uid,
      email:
        typeof decodedToken.email === 'string' ? decodedToken.email : undefined,
    };

    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      errorCode: 'UNAUTHORIZED',
      message: 'Invalid or expired Firebase token.',
    });
  }
}

module.exports = {
  requireFirebaseManager,
};

const admin = require('firebase-admin');

let cachedAuthClient = null;

function parseServiceAccount() {
  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonEnv) {
    return JSON.parse(jsonEnv);
  }

  const base64Env = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (base64Env) {
    return JSON.parse(Buffer.from(base64Env, 'base64').toString('utf8'));
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKeyRaw.replace(/\\n/g, '\n'),
  };
}

function shouldUseApplicationDefaultCredentials() {
  if ((process.env.FIREBASE_USE_APPLICATION_DEFAULT || '').toLowerCase() === 'true') {
    return true;
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return true;
  }

  return false;
}

function initializeFirebaseApp() {
  if (admin.apps.length > 0) {
    return;
  }

  const serviceAccount = parseServiceAccount();
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.projectId || process.env.FIREBASE_PROJECT_ID,
    });
    return;
  }

  if (shouldUseApplicationDefaultCredentials()) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    return;
  }

  const error = new Error(
    'Firebase Admin credentials are not configured on orchestrator.'
  );
  error.code = 'FIREBASE_NOT_CONFIGURED';
  throw error;
}

function getFirebaseAuthClient() {
  if (cachedAuthClient) {
    return cachedAuthClient;
  }

  initializeFirebaseApp();
  cachedAuthClient = admin.auth();
  return cachedAuthClient;
}

module.exports = {
  getFirebaseAuthClient,
};

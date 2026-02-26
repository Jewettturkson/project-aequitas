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

function requireAdminKey({
  envVar = 'PROJECT_ADMIN_KEY',
  headerName = 'x-admin-key',
  errorCode = 'UNAUTHORIZED',
  message = 'Missing or invalid admin key.',
} = {}) {
  return (req, res, next) => {
    const expectedKey = process.env[envVar] || '';
    if (!expectedKey) {
      return next();
    }

    const headerValue = req.headers[headerName] || '';
    const bearerToken = extractBearerToken(req.headers.authorization);

    if (headerValue === expectedKey || bearerToken === expectedKey) {
      return next();
    }

    return res.status(401).json({
      success: false,
      errorCode,
      message,
    });
  };
}

module.exports = {
  requireAdminKey,
};

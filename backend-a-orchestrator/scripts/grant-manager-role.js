const { getFirebaseAuthClient } = require('../lib/firebaseAdmin');

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (!current.startsWith('--')) {
      continue;
    }

    const key = current.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = 'true';
      continue;
    }

    args[key] = next;
    i += 1;
  }

  return args;
}

function parseClaimValue(raw) {
  if (raw === undefined) {
    return true;
  }

  const normalized = String(raw).trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }
  if (normalized === 'false') {
    return false;
  }

  return raw;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const uid = args.uid;
  const email = args.email;
  const claimName = (args.claim || 'projectManager').trim();
  const claimValue = parseClaimValue(args.value);

  if (!uid && !email) {
    throw new Error('Provide either --uid <firebase-uid> or --email <user-email>.');
  }

  const authClient = getFirebaseAuthClient();
  const userRecord = uid
    ? await authClient.getUser(uid)
    : await authClient.getUserByEmail(String(email).trim().toLowerCase());
  const existingClaims = userRecord.customClaims || {};

  await authClient.setCustomUserClaims(userRecord.uid, {
    ...existingClaims,
    [claimName]: claimValue,
  });

  console.log(
    `Set custom claim "${claimName}"=${JSON.stringify(claimValue)} for uid=${userRecord.uid} email=${userRecord.email || 'n/a'}`
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

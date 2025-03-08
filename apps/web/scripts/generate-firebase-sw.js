const fs = require('fs');
const path = require('path');

// Read environment variables
const {
  NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID,
} = process.env;

// Check if necessary environment variables exist
if (
  !NEXT_PUBLIC_FIREBASE_API_KEY ||
  !NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
  !NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  !NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  !NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
  !NEXT_PUBLIC_FIREBASE_APP_ID
) {
  console.error('Error: Missing necessary Firebase environment variables');
  process.exit(1);
}

// Read the original service worker file
const swPath = path.join(__dirname, '../public/firebase-messaging-sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');

// Replace self with actual environment variable values
swContent = swContent.replace(
  'self.FIREBASE_API_KEY',
  `'${NEXT_PUBLIC_FIREBASE_API_KEY}'`,
);
swContent = swContent.replace(
  'self.FIREBASE_AUTH_DOMAIN',
  `'${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}'`,
);
swContent = swContent.replace(
  'self.FIREBASE_PROJECT_ID',
  `'${NEXT_PUBLIC_FIREBASE_PROJECT_ID}'`,
);
swContent = swContent.replace(
  'self.FIREBASE_STORAGE_BUCKET',
  `'${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}'`,
);
swContent = swContent.replace(
  'self.FIREBASE_MESSAGING_SENDER_ID',
  `'${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}'`,
);
swContent = swContent.replace(
  'self.FIREBASE_APP_ID',
  `'${NEXT_PUBLIC_FIREBASE_APP_ID}'`,
);

// Output to build directory (ensure directory exists)
const buildDir = path.join(__dirname, '../.next/static');

if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

const outputPath = path.join(buildDir, 'firebase-messaging-sw.js');

fs.writeFileSync(outputPath, swContent);

console.log(`Firebase Messaging Service Worker generated: ${outputPath}`);

// Copy to public directory
const publicOutputPath = path.join(
  __dirname,
  '../public/generated-firebase-messaging-sw.js',
);

fs.writeFileSync(publicOutputPath, swContent);
console.log(
  `Firebase Messaging Service Worker copied to public directory: ${publicOutputPath}`,
);

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Firebase Admin SDK configuration
export function initializeFirebaseAdmin() {
  // Check if Firebase Admin is already initialized
  if (getApps().length > 0) {
    return getApps()[0];
  }

  try {
    // Get ES module equivalent of __dirname
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    // Path to service account key file
    const serviceAccountPath = resolve(__dirname, 'serviceAccountKey.json');
    
    // Check if service account key file exists
    if (existsSync(serviceAccountPath)) {
      console.log('🔑 Using Service Account Key for Firebase Admin SDK');
      
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      
      const app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });

      console.log('🔥 Firebase Admin SDK initialized with Service Account Key');
      return app;
    } else {
      console.log('⚠️ Service Account Key not found, using project ID only');
      
      // Fallback to using project ID only (for development)
      const app = initializeApp({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'bibleverseapp-d43ac',
      });

      console.log('🔥 Firebase Admin SDK initialized with Project ID');
      return app;
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error);
    throw error;
  }
}

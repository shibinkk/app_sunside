# Firebase Integration Guide for Sunside

Integrating Firebase into your project involves a few key steps across the frontend (React Native/Expo) and the backend (Node.js).

## 1. Firebase Console Setup
1. **Create a Project**: Go to [Firebase Console](https://console.firebase.google.com/) and click "Add Project".
2. **Add a Web App**: Click the web icon (</>) to register a new web app. You'll get a configuration object.
3. **Enable Authentication**: Go to "Authentication" -> "Sign-in method" -> Enable "Email/Password".
4. **Enable Firestore**: Go to "Firestore Database" -> "Create database" -> Start in "Test Mode".
5. **Enable Storage (Optional)**: ONLY if you need users to upload images/videos.

## 2. Frontend Configuration (sunside)
We have updated `sunside/config/firebase.ts` with your keys.

### Authentication
The `AuthContext` uses Firebase Auth directly.
- **Login**: Use `signIn` from `config/authHelper.ts`.
- **Signup**: Use `signUp` from `config/authHelper.ts`.
- **State**: Access current user via `useAuth()` hook.

## 3. Firestore Database vs. Storage (Pricing & Usage)

Both services have generous **Free Tiers (Spark Plan)**:

| Service | Best For | Free Monthly Limits |
| :--- | :--- | :--- |
| **Firestore** (Database) | Text data, User profiles, Trip details, Chat messages. | 1GB total data, 50k reads/day, 20k writes/day. |
| **Storage** (Files) | Images, Profile pictures, PDFs, Videos. | 5GB total data, 1GB download/day, 20k uploads. |

**Recommendation**: 
- Use **Firestore** for almost all application data (users, trips, routes).
- Use **Storage** ONLY if you need to store actual image files. 

### Firestore Usage Examples
```typescript
import { addData, getDocument } from '../config/databaseHelper';

// Save a trip
const saveTrip = async (tripData) => {
  const docId = await addData('trips', tripData);
  console.log("Trip saved with ID:", docId);
};
```

## 4. Backend Integration (backend)

### Step 1: Install Firebase Admin SDK
In your backend directory:
```bash
npm install firebase-admin
```

### Step 2: Initialize Firebase Admin
Create `backend/config/firebase-admin.js` and add your service account key:
```javascript
const admin = require('firebase-admin');
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
```

### Step 3: Create Auth Middleware
Use this in your Express routes to verify users:
```javascript
const admin = require('../config/firebase-admin');

const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};
```

## 5. Transitioning from Custom OTP/JWT
- **Registration**: Use `signUp` from `authHelper.ts`. Firebase handles verification emails automatically.
- **Security**: You no longer need to manage passwords or JWT salt/secret on your server. Firebase handles the security.

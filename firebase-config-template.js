// Firebase Configuration Template
// Copy this to app.js and replace with your actual Firebase project credentials

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
// How to get your Firebase config:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (or use existing)
// 3. Click on "Web" icon to add a web app
// 4. Register your app
// 5. Copy the firebaseConfig object
// 6. In Firebase Console, go to "Realtime Database" and create a database
// 7. Set rules to allow read/write (for development):
/*
{
  "rules": {
    "events": {
      "$eventCode": {
        ".read": true,
        ".write": true
      }
    }
  }
}
*/

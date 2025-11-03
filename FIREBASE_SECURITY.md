# 🔒 Firebase Security Setup

## ⚠️ IMPORTANT: Secure Your Database

Your Firebase Realtime Database is currently in **test mode**, which means anyone can read/write/delete data!

## Step-by-Step Security Fix

### 1. Go to Firebase Console
- Visit: https://console.firebase.google.com/
- Select your project: **potluck-planner-15a68**

### 2. Navigate to Realtime Database Rules
- Click **Realtime Database** in the left menu
- Click the **Rules** tab

### 3. Replace Current Rules

**Current (INSECURE - Test Mode):**
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

**Replace with (SECURE):**
```json
{
  "rules": {
    "events": {
      "$eventCode": {
        ".read": true,
        ".write": true,
        "dishes": {
          "$dishId": {
            ".read": true,
            ".write": true,
            ".validate": "newData.hasChildren(['name', 'category', 'contributor'])"
          }
        }
      }
    }
  }
}
```

### 4. Click **Publish** button

## 🎯 What These Rules Do

- ✅ **Allow reading** all events (so people can view dishes)
- ✅ **Allow writing** to events (so people can add dishes)
- ✅ **Validate data** structure (ensures required fields exist)
- ✅ **Prevent malicious data** (validates before writing)

## 🔐 Future Enhancement: Add Authentication

For production, consider adding Firebase Authentication:

```json
{
  "rules": {
    "events": {
      "$eventCode": {
        ".read": true,
        "dishes": {
          "$dishId": {
            ".read": true,
            ".write": "auth != null",
            ".validate": "newData.hasChildren(['name', 'category', 'contributor'])"
          }
        }
      }
    }
  }
}
```

This requires users to sign in before adding/deleting dishes.

## 📝 Notes

- Current setup allows anonymous contributions (good for potlucks!)
- Data validation prevents malformed entries
- Consider adding rate limiting in Firebase Console → Realtime Database → Usage tab

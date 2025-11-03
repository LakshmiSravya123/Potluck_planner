# ⚡ Quick Start - Get Live in 10 Minutes!

## 🔥 Step 1: Firebase (5 min)

1. **Go to** https://console.firebase.google.com/
2. **Click** "Add project" → Name it → Disable Analytics → Create
3. **Click** "Realtime Database" → Create Database → Test mode → Enable
4. **Click** "Rules" tab → Paste this:
   ```json
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
   ```
5. **Click** Publish
6. **Click** Gear icon ⚙️ → Project settings → Scroll down → Click `</>` web icon
7. **Register** app → Copy the `firebaseConfig` object
8. **Open** `app.js` → Replace lines 3-11 with your config → Save

## 🐙 Step 2: GitHub (3 min)

1. **Go to** https://github.com/new
2. **Name:** `potluckplanner` → Public → Create
3. **In terminal:**
   ```bash
   cd potluckplanner
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/potluckplanner.git
   git push -u origin main
   ```
4. **On GitHub:** Settings → Pages → Source: main branch → Save
5. **Wait 2 minutes** → Your app is live! 🎉

## 🌐 Your URL

```
https://YOUR_USERNAME.github.io/potluckplanner/
```

## ✅ Test It

1. Open your URL
2. Enter your name
3. Click "Join Event" (creates new event)
4. Add a test dish
5. Open in incognito/another browser
6. Join with same event code
7. See real-time updates! 🚀

## 🆘 Troubleshooting

**"Please configure Firebase"**
→ Check you saved app.js with your Firebase config

**"Event not found"**
→ Event codes are case-sensitive, try again

**GitHub Pages 404**
→ Wait 2-3 minutes, check Settings → Pages is enabled

## 📱 Share It

Share your URL with friends:
```
"Plan our potluck at https://YOUR_USERNAME.github.io/potluckplanner/"
```

They just need the event code to join!

---

**Need detailed help?** See SETUP_GUIDE.md or README.md

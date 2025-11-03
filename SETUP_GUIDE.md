# 🚀 Quick Setup Guide

Follow these steps to get your Potluck Planner live in under 10 minutes!

## Step 1: Firebase Setup (5 minutes)

### 1.1 Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click **"Add project"**
3. Name it: `potluck-planner` (or any name)
4. Disable Google Analytics (optional)
5. Click **"Create project"**

### 1.2 Create Realtime Database
1. In left sidebar, click **"Realtime Database"**
2. Click **"Create Database"**
3. Choose your location (e.g., `us-central1`)
4. Select **"Start in test mode"**
5. Click **"Enable"**

### 1.3 Set Database Rules
1. Click the **"Rules"** tab
2. Replace the rules with:
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
3. Click **"Publish"**

### 1.4 Get Your Config
1. Click the gear icon ⚙️ → **"Project settings"**
2. Scroll to **"Your apps"**
3. Click the web icon **`</>`**
4. Register app: nickname = `Potluck Planner`
5. **Copy** the `firebaseConfig` object

### 1.5 Update app.js
1. Open `app.js` in your editor
2. Find lines 3-11 (the `firebaseConfig` object)
3. Replace with your config from Firebase
4. Save the file

## Step 2: GitHub Setup (3 minutes)

### 2.1 Create Repository
1. Go to https://github.com/new
2. Repository name: `potluckplanner`
3. Description: `A real-time potluck planning app`
4. Make it **Public**
5. Don't initialize with README (we have one)
6. Click **"Create repository"**

### 2.2 Push Your Code
```bash
# In your potluckplanner directory
git init
git add .
git commit -m "Initial commit: Potluck Planner app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/potluckplanner.git
git push -u origin main
```

### 2.3 Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **"Settings"** tab
3. Click **"Pages"** in left sidebar
4. Under "Source":
   - Branch: `main`
   - Folder: `/ (root)`
5. Click **"Save"**
6. Wait 1-2 minutes for deployment

### 2.4 Get Your URL
Your app will be live at:
```
https://YOUR_USERNAME.github.io/potluckplanner/
```

## Step 3: Test It! (2 minutes)

1. **Open your app** in a browser
2. **Enter your name**
3. **Leave event code blank**
4. **Click "Join Event"**
5. **Add a test dish**
6. **Open in another browser/tab** (incognito mode)
7. **Join with the same event code**
8. **Watch real-time updates!** 🎉

## Troubleshooting

### "Please configure Firebase in app.js"
- ✅ Check you copied the ENTIRE firebaseConfig object
- ✅ Make sure you saved app.js
- ✅ Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

### "Event not found"
- ✅ Event codes are case-sensitive
- ✅ Make sure the first person created the event successfully
- ✅ Check browser console for errors (F12)

### GitHub Pages shows 404
- ✅ Wait 2-3 minutes after enabling Pages
- ✅ Check Settings → Pages shows "Your site is live at..."
- ✅ Make sure branch is set to `main` and folder is `/ (root)`

### Dishes not appearing
- ✅ Check Firebase Database rules are published
- ✅ Look at Firebase Console → Realtime Database → Data tab
- ✅ You should see `events/YOURCODE/dishes` when you add a dish

## Next Steps

### Share Your App
1. Copy your GitHub Pages URL
2. Share with friends: "Plan our potluck at [URL]"
3. They just need the event code to join!

### Customize
- Edit colors in `styles.css`
- Add more categories in `index.html`
- Modify the UI to match your style

### Make It Better
- Star the repo if you like it! ⭐
- Report bugs via GitHub Issues
- Submit improvements via Pull Requests

## Security Note

The current setup is great for:
- ✅ Private events with trusted friends
- ✅ Small gatherings
- ✅ Testing and development

For public/large events, consider:
- 🔒 Adding Firebase Authentication
- 🔒 Implementing stricter database rules
- 🔒 Rate limiting

See README.md for production security guidelines.

## Need Help?

- 📖 Check the main README.md
- 🐛 Open an issue on GitHub
- 💬 Ask in GitHub Discussions

---

**Congratulations!** 🎉 Your Potluck Planner is now live and ready to use!

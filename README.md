# 🍽️ Potluck Planner

A beautiful, real-time web app to coordinate potluck events. Share a code, add dishes, and avoid duplicates—all for free!

![Potluck Planner](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

### 🤖 AI-Powered
- ✨ **AI Image Search** - Type a dish name, AI finds beautiful food images automatically
- 🎯 **Smart Suggestions** - Get theme-based dish recommendations (Birthday, Christmas, etc.)
- 🖼️ **Visual Menu** - Dishes display with gorgeous AI-generated images

### 🎉 Event Management
- 📝 **Event Creation Page** - Dedicated page to create events with QR codes
- 🎨 **10 Beautiful Themes** - Birthday, Christmas, Thanksgiving, Halloween, Summer, and more
- 📊 **Live Stats** - Real-time dish count and contributor tracking
- 🎭 **Animated Decorations** - Theme-specific animations (balloons, snowflakes, etc.)

### 🍽️ Dish Coordination
- ✏️ **Edit Dishes** - Fix typos or update your contributions
- ⚠️ **Duplicate Detection** - Warns you if someone already brought that dish
- 🏷️ **Category Filtering** - Filter by appetizers, mains, sides, desserts, beverages
- 📋 **Complete Menu Card** - Beautiful printable menu organized by category

### 📱 Sharing & Collaboration
- 📱 **QR Code Generation** - Instant QR codes for easy event sharing
- ✉️ **Email Reminders** - Send invites via EmailJS (free tier: 200/month)
- 👥 **Real-time Sync** - See updates instantly across all devices
- 📲 **PWA Support** - Install as an app on your phone!

### 🎨 Design & UX
- 🌈 **Animated Gradient Background** - Smooth, modern color-shifting design
- 💎 **Glassmorphism UI** - Frosted glass cards with backdrop blur
- 📱 **Fully Responsive** - Perfect on mobile, tablet, and desktop
- ⚡ **Lightning Fast** - Optimized performance and smooth animations
- 💯 **100% Free** - No sign-up, no cost, just share and plan!

## 🚀 Quick Start

### Option 1: Use GitHub Pages (Recommended)

1. **Fork this repository**
2. **Set up Firebase** (see Firebase Setup below)
3. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` (or `master`), folder: `/ (root)`
   - Save
4. **Access your app** at `https://yourusername.github.io/potluckplanner/`

### Option 2: Run Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/potluckplanner.git
   cd potluckplanner
   ```

2. **Set up Firebase** (see Firebase Setup below)

3. **Serve the files**
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Or using Node.js
   npx serve
   ```

4. **Open** `http://localhost:8000` in your browser

## 🔥 Firebase Setup

This app uses Firebase Realtime Database for free, real-time data sync.

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "potluck-planner")
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Create Realtime Database

1. In Firebase Console, click "Realtime Database" in the left menu
2. Click "Create Database"
3. Choose location (closest to your users)
4. Start in **test mode** (we'll set rules next)
5. Click "Enable"

### Step 3: Set Database Rules

1. Go to "Realtime Database" → "Rules" tab
2. Replace with these rules:

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

3. Click "Publish"

> ⚠️ **Note**: These rules allow anyone to read/write. For production, implement proper authentication and security rules.

### Step 4: Get Your Config

1. In Firebase Console, click the gear icon → "Project settings"
2. Scroll down to "Your apps" section
3. Click the web icon `</>` to add a web app
4. Register app (nickname: "Potluck Planner")
5. Copy the `firebaseConfig` object

### Step 5: Update app.js

1. Open `app.js`
2. Find the `firebaseConfig` object at the top
3. Replace with your config from Firebase:

```javascript
const firebaseConfig = {
    apiKey: "AIza...",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};
```

4. Save the file

## 📖 How to Use

1. **Create an Event**
   - Enter your name
   - Leave event code blank
   - Click "Join Event"
   - Share the generated code with others!

2. **Join an Event**
   - Enter your name
   - Enter the event code you received
   - Click "Join Event"

3. **Add Dishes**
   - Fill in dish name and category
   - Add optional notes (e.g., "Vegetarian", "Serves 8")
   - Click "Add Dish"

4. **Filter Dishes**
   - Click category buttons to filter the menu
   - See what everyone is bringing in real-time!

5. **Delete Your Dishes**
   - Only dishes you added have a delete button
   - Click to remove if plans change

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase Realtime Database
- **Hosting**: GitHub Pages
- **Fonts**: Google Fonts (Inter)
- **Icons**: Custom SVG icons (Lucide-inspired)

## 📁 Project Structure

```
potluckplanner/
├── index.html              # Main app - join/manage events
├── create.html             # Event creation page with QR codes
├── styles.css              # All styling with animations
├── app.js                  # JavaScript logic + Firebase + AI
├── manifest.json           # PWA manifest for installable app
├── firebase-config-template.js  # Config template
├── DEMO_VIDEO_SCRIPTS.md   # Video marketing scripts
├── README.md               # This file
└── .gitignore             # Git ignore rules
```

## 🎨 Customization

### Change Colors

Edit CSS variables in `styles.css`:

```css
:root {
    --primary: #6366f1;      /* Main brand color */
    --primary-dark: #4f46e5; /* Hover states */
    --success: #10b981;      /* Success messages */
    /* ... more colors */
}
```

### Change Categories

Edit the category options in `index.html`:

```html
<select id="dishCategory">
    <option value="appetizer">Appetizer</option>
    <!-- Add your categories -->
</select>
```

And update colors in `styles.css`:

```css
.dish-category.yourcategory { background: #yourcolor; }
```

## 🔒 Security Considerations

**Current Setup (Development)**:
- Database rules allow public read/write
- No authentication required
- Suitable for private events with trusted participants

**For Production**:
1. Implement Firebase Authentication
2. Add user-based security rules
3. Validate data on the server side
4. Rate limit writes to prevent abuse
5. Consider using Firebase Security Rules for event-based access

Example production rules:
```json
{
  "rules": {
    "events": {
      "$eventCode": {
        ".read": "auth != null",
        ".write": "auth != null",
        "dishes": {
          "$dishId": {
            ".write": "!data.exists() || data.child('contributor').val() === auth.token.name"
          }
        }
      }
    }
  }
}
```

## 🐛 Troubleshooting

**"Please configure Firebase in app.js"**
- Make sure you've replaced the Firebase config in `app.js`
- Check that your Firebase project is active
- Verify the Realtime Database is created

**Dishes not appearing**
- Check browser console for errors
- Verify Firebase Database rules allow read/write
- Ensure you're connected to the internet

**Event code not working**
- Event codes are case-sensitive
- Make sure the event was created successfully
- Check that both users are using the same Firebase database

## 📝 License

MIT License - feel free to use this for any purpose!

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 💡 Completed Features

- [x] ✨ AI-powered image search
- [x] 🎯 Smart dish suggestions
- [x] ✏️ Edit dishes
- [x] ⚠️ Duplicate detection
- [x] 📱 QR code generation
- [x] ✉️ Email reminders (EmailJS)
- [x] 📋 Print-friendly menu view
- [x] 📊 Live statistics
- [x] 🎨 Multiple themes
- [x] 📲 PWA support (installable)
- [x] 📝 Event creation page

## 💡 Future Ideas

- [ ] Event details (date, time, location)
- [ ] Dietary restriction tags (vegan, gluten-free, etc.)
- [ ] Serving size tracking
- [ ] Recipe links
- [ ] Photo uploads for custom dish images
- [ ] SMS notifications
- [ ] Export to PDF
- [ ] Multiple events per user dashboard
- [ ] Event templates (save favorites)
- [ ] Ingredient list aggregation
- [ ] Shopping list generator

## 🙏 Acknowledgments

- Icons inspired by [Lucide](https://lucide.dev/)
- Fonts from [Google Fonts](https://fonts.google.com/)
- Gradient inspiration from [UI Gradients](https://uigradients.com/)

## 📧 Support

Have questions? Open an issue on GitHub!

---

Made with ❤️ for potluck lovers everywhere

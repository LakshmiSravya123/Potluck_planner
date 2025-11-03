// ============================================
// UTILITY FUNCTIONS - Input Validation & Sanitization
// ============================================

// Sanitize user input to prevent XSS attacks
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
        .substring(0, 200); // Limit length
}

// Validate event code format
function validateEventCode(code) {
    return /^[A-Z0-9]{6,10}$/i.test(code);
}

// Validate email format
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate URL format
function validateURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Validate dish input
function validateDish(name, category, contributor) {
    const errors = [];
    
    if (!name || name.trim().length < 2) {
        errors.push('Dish name must be at least 2 characters');
    }
    if (name.length > 100) {
        errors.push('Dish name too long (max 100 characters)');
    }
    if (!category || !['appetizer', 'main', 'side', 'dessert', 'beverage', 'other'].includes(category)) {
        errors.push('Invalid category');
    }
    if (!contributor || contributor.trim().length < 2) {
        errors.push('Contributor name must be at least 2 characters');
    }
    if (contributor.length > 50) {
        errors.push('Contributor name too long (max 50 characters)');
    }
    
    return errors;
}

// Rate limiting helper
const rateLimiter = {
    actions: {},
    check: function(action, limit = 5, windowMs = 60000) {
        const now = Date.now();
        if (!this.actions[action]) {
            this.actions[action] = [];
        }
        
        // Remove old timestamps
        this.actions[action] = this.actions[action].filter(time => now - time < windowMs);
        
        if (this.actions[action].length >= limit) {
            return false; // Rate limit exceeded
        }
        
        this.actions[action].push(now);
        return true;
    }
};

// ============================================
// FIREBASE CONFIGURATION
// ============================================

// Firebase Configuration
// IMPORTANT: Replace this with your own Firebase config
// Get it from: Firebase Console > Project Settings > Your apps > Web app
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCzvH64kpIcpgUrjxVsJBhF9SxME7pVCyQ",
  authDomain: "potluck-planner-15a68.firebaseapp.com",
  databaseURL: "https://potluck-planner-15a68-default-rtdb.firebaseio.com",
  projectId: "potluck-planner-15a68",
  storageBucket: "potluck-planner-15a68.firebasestorage.app",
  messagingSenderId: "209595251975",
  appId: "1:209595251975:web:961acb493b364e9fedd9a2",
  measurementId: "G-VQKX9HP4SM"
};

// Initialize Firebase
let app, database, db;
let firebaseInitialized = false;

function initializeFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK not loaded yet');
            return false;
        }
        
        app = firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        db = database; // Alias for compatibility
        firebaseInitialized = true;
        console.log('✅ Firebase initialized successfully');
        
        // Test Firebase connection with timeout
        let connectionTimeout = setTimeout(() => {
            console.warn('⚠️ Firebase connection taking longer than expected...');
            showToast('Connecting to Firebase...', 'info');
        }, 3000);
        
        database.ref('.info/connected').on('value', (snap) => {
            clearTimeout(connectionTimeout);
            if (snap.val() === true) {
                console.log('✅ Connected to Firebase!');
                showToast('Connected to Firebase!', 'success');
            } else {
                console.log('❌ Not connected to Firebase');
                showToast('Reconnecting to Firebase...', 'error');
            }
        });
        
        return true;
    } catch (error) {
        console.error("❌ Firebase initialization error:", error);
        showToast("Firebase connection error: " + error.message, "error");
        return false;
    }
}

// Try to initialize immediately
if (!initializeFirebase()) {
    // If failed, retry after a delay
    console.log('Retrying Firebase initialization in 2 seconds...');
    setTimeout(() => {
        if (!firebaseInitialized) {
            initializeFirebase();
        }
    }, 2000);
}

// Photo Storage: Using base64 data URLs stored directly in Firebase
// No external service needed - unlimited, instant, free forever!

// App State
let currentEventCode = null;
let currentUserName = null;
let currentFilter = 'all';
let currentTheme = 'default';
let dishesListener = null;
let themeListener = null;
let currentDishImage = null;
let imageSearchTimeout = null;

// DOM Elements
const eventCodeInput = document.getElementById('eventCode');
const eventThemeInput = document.getElementById('eventTheme');
const userNameInput = document.getElementById('userName');
const joinEventBtn = document.getElementById('joinEventBtn');
const eventInfo = document.getElementById('eventInfo');
const currentEventCodeDisplay = document.getElementById('currentEventCode');
const currentEventThemeDisplay = document.getElementById('currentEventTheme');
const copyCodeBtn = document.getElementById('copyCodeBtn');
const addDishSection = document.getElementById('addDishSection');
const dishesSection = document.getElementById('dishesSection');
const addDishForm = document.getElementById('addDishForm');
const dishNameInput = document.getElementById('dishName');
const dishCategoryInput = document.getElementById('dishCategory');
const dishNotesInput = document.getElementById('dishNotes');
const dishesList = document.getElementById('dishesList');
const emptyState = document.getElementById('emptyState');
const filterButtons = document.querySelectorAll('.filter-btn');
const toast = document.getElementById('toast');
const dishImagePreview = document.getElementById('dishImagePreview');
let aiSuggestionsBtn = null;
let viewMenuCardBtn = null;
let generateQRBtn = null;
let sendReminderBtn = null;
let allDishes = [];

// Initialize EmailJS (Free tier - sign up at https://www.emailjs.com/)
// Replace with your own keys after signing up
(function() {
    if (typeof emailjs !== 'undefined') {
        emailjs.init("YOUR_PUBLIC_KEY"); // Replace with your EmailJS public key
    }
})();

// Check URL for event code parameter (from QR code or shared link)
function checkUrlParameters() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const codeFromUrl = urlParams.get('code');
        
        // Get elements fresh each time to ensure they exist
        const codeInput = document.getElementById('eventCode');
        const nameInput = document.getElementById('userName');
        
        console.log('🔍 URL Check:', { 
            url: window.location.href,
            codeFromUrl, 
            hasInput: !!codeInput,
            inputValue: codeInput?.value 
        });
        
        if (codeFromUrl) {
            const codeLower = codeFromUrl.toLowerCase();
            
            if (codeInput) {
                codeInput.value = codeLower;
                console.log('✅ Event code auto-filled:', codeLower);
                
                // Focus on name input
                if (nameInput) {
                    nameInput.focus();
                }
                
                // Show toast notification
                setTimeout(() => {
                    try {
                        showToast('🎉 Event code loaded! Enter your name to join.', 'success');
                    } catch (e) {
                        console.log('Toast not ready yet');
                    }
                }, 1000);
            } else {
                console.error('❌ Event code input not found! DOM not ready yet.');
            }
        } else {
            console.log('ℹ️ No code parameter in URL');
        }
    } catch (error) {
        console.error('Error checking URL parameters:', error);
    }
}

// Run on page load with multiple fallbacks
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkUrlParameters);
} else {
    checkUrlParameters();
}

// Also try after a short delay to ensure DOM is ready
setTimeout(checkUrlParameters, 100);
setTimeout(checkUrlParameters, 500);

// Event Listeners
joinEventBtn.addEventListener('click', handleJoinEvent);
copyCodeBtn.addEventListener('click', copyEventCode);
addDishForm.addEventListener('submit', handleAddDish);
eventThemeInput.addEventListener('change', handleThemePreview);
dishNameInput.addEventListener('input', handleDishNameInput);
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => handleFilterChange(btn.dataset.category));
});

// Handle Theme Preview
function handleThemePreview() {
    const theme = eventThemeInput.value;
    applyTheme(theme);
}

// Theme Names
const themeNames = {
    'default': '🎉 Default Party',
    'birthday': '🎂 Birthday',
    'christmas': '🎄 Christmas',
    'thanksgiving': '🦃 Thanksgiving',
    'halloween': '🎃 Halloween',
    'newyear': '🎆 New Year',
    'summer': '☀️ Summer BBQ',
    'spring': '🌸 Spring Garden',
    'wedding': '💒 Wedding',
    'graduation': '🎓 Graduation'
};

// Apply Theme
function applyTheme(theme) {
    // Set data-theme attribute for background images
    document.body.setAttribute('data-theme', theme);
    // Also keep theme class for other styling
    document.body.className = `theme-${theme}`;
    currentTheme = theme;
    // Update theme display if visible
    if (currentEventThemeDisplay) {
        currentEventThemeDisplay.textContent = themeNames[theme] || theme;
    }
    // Create decorations for the theme
    createDecorations(theme);
}

// Handle Join Event (creation moved to create.html)
function handleJoinEvent() {
    const userName = userNameInput.value.trim();
    const eventCode = eventCodeInput.value.trim().toLowerCase();
    
    if (!userName) {
        showToast('Please enter your name', 'error');
        return;
    }
    
    if (!eventCode) {
        showToast('Please enter an event code. To create a new event, visit create.html', 'error');
        return;
    }
    
    // Show loading state
    joinEventBtn.disabled = true;
    const originalText = joinEventBtn.innerHTML;
    joinEventBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10"></circle></svg> Joining...';
    
    currentUserName = userName;
    // Join existing event
    joinEvent(eventCode);
}

// Generate Random Event Code
function generateEventCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Create New Event
function createEvent(eventCode, theme) {
    // ALWAYS store with lowercase for consistency
    const eventCodeLower = eventCode.toLowerCase();
    const eventRef = database.ref(`events/${eventCodeLower}`);
    
    eventRef.set({
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        createdBy: currentUserName,
        theme: theme || 'default'
    })
    .then(() => {
        currentEventCode = eventCodeLower;
        applyTheme(theme);
        showEventInterface();
        listenToDishes();
        listenToTheme();
        showToast('Event created successfully!', 'success');
    })
    .catch(error => {
        console.error('Error creating event:', error);
        showToast('Failed to create event', 'error');
    });
}

// Join Existing Event
function joinEvent(eventCode) {
    // ALWAYS use lowercase for Firebase queries (case-insensitive)
    const eventCodeLower = eventCode.toLowerCase();
    console.log('🔍 Attempting to join event:', eventCode, '(stored as:', eventCodeLower + ')');
    const eventRef = database.ref(`events/${eventCodeLower}`);
    
    eventRef.once('value')
        .then(snapshot => {
            console.log('📊 Firebase response:', {
                exists: snapshot.exists(),
                data: snapshot.val(),
                queriedCode: eventCodeLower
            });
            
            if (snapshot.exists()) {
                currentEventCode = eventCodeLower;
                const eventData = snapshot.val();
                const theme = eventData.theme || 'default';
                console.log('✅ Event found! Theme:', theme);
                
                currentTheme = theme;
                eventThemeInput.value = theme;
                applyTheme(theme);
                showEventInterface();
                
                // Populate event metadata
                populateEventMetadata(eventData);
                
                listenToDishes();
                listenToTheme();
                showToast('Joined event successfully!', 'success');
            } else {
                console.error('❌ Event not found in Firebase:', eventCode);
                showToast('Event not found. Check the code or create a new event.', 'error');
            }
        })
        .catch(error => {
            console.error(' Firebase error:', error);
            showToast('Failed to join event: ' + error.message, 'error');
        });
}

// Check if event should be auto-deleted (2 days after event date)
function checkEventExpiration(eventData) {
    if (!eventData.date) return false; // No date set, don't delete
    
    const eventDate = new Date(eventData.date);
    const now = new Date();
    const twoDaysAfterEvent = new Date(eventDate);
    twoDaysAfterEvent.setDate(twoDaysAfterEvent.getDate() + 2);
    
    // If current time is more than 2 days after event
    if (now > twoDaysAfterEvent) {
        console.log('🗑️ Event expired (2 days past event date). Deleting...');
        
        // Delete the event
        database.ref(`events/${currentEventCode}`).remove()
            .then(() => {
                console.log('✅ Expired event deleted successfully');
                showToast('⚠️ This event has expired and been archived (2 days past event date)', 'error');
                
                // Redirect to home after 3 seconds
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 3000);
            })
            .catch(error => {
                console.error('Error deleting expired event:', error);
            });
        
        return true; // Event is expired
    }
    
    return false; // Event is still valid
}

// Populate Event Metadata
function populateEventMetadata(eventData) {
    const eventDetailsCard = document.getElementById('eventDetailsCard');
    if (!eventDetailsCard) return;
    
    // Check if event has expired (2 days after event date)
    if (checkEventExpiration(eventData)) {
        return; // Don't show event details if expired
    }
    
    // Show the card
    eventDetailsCard.classList.remove('hidden');
    
    // Event name
    const eventNameEl = document.getElementById('eventName');
    if (eventNameEl && eventData.name) {
        eventNameEl.textContent = eventData.name;
    }
    
    // Date with expiration warning
    if (eventData.date) {
        const dateSection = document.getElementById('eventDateSection');
        const dateEl = document.getElementById('eventDate');
        if (dateSection && dateEl) {
            const date = new Date(eventData.date);
            const now = new Date();
            const oneDayAfterEvent = new Date(date);
            oneDayAfterEvent.setDate(oneDayAfterEvent.getDate() + 1);
            
            let dateText = date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            // Add warning if event will expire soon (within 1 day after event)
            if (now > date && now <= oneDayAfterEvent) {
                dateText += ' ⚠️';
                dateEl.innerHTML = dateText + '<br><span style="color: #f59e0b; font-size: 0.75rem; font-weight: 600;">Event expires in 1 day</span>';
            } else {
                dateEl.textContent = dateText;
            }
            
            dateSection.style.display = 'block';
        }
    }
    
    // Time
    if (eventData.time) {
        const timeSection = document.getElementById('eventTimeSection');
        const timeEl = document.getElementById('eventTime');
        if (timeSection && timeEl) {
            timeEl.textContent = eventData.time;
            timeSection.style.display = 'block';
        }
    }
    
    // Host
    if (eventData.host && eventData.host.name) {
        const hostSection = document.getElementById('eventHostSection');
        const hostEl = document.getElementById('eventHost');
        if (hostSection && hostEl) {
            hostEl.textContent = eventData.host.name;
            if (eventData.host.email) {
                hostEl.innerHTML = `${eventData.host.name}<br><a href="mailto:${eventData.host.email}" style="font-size: 0.8125rem; color: var(--primary);">${eventData.host.email}</a>`;
            }
            hostSection.style.display = 'block';
        }
    }
    
    // Location with map
    if (eventData.location) {
        const locationSection = document.getElementById('eventLocationSection');
        const locationEl = document.getElementById('eventLocation');
        const mapLink = document.getElementById('mapLink');
        
        if (locationSection && locationEl) {
            locationEl.textContent = eventData.location;
            
            // Create Google Maps link
            if (mapLink) {
                const encodedLocation = encodeURIComponent(eventData.location);
                mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
            }
            
            locationSection.style.display = 'block';
        }
    }
}

// Show Event Interface
function showEventInterface() {
    // Display uppercase for readability, but store lowercase
    currentEventCodeDisplay.textContent = currentEventCode.toUpperCase();
    currentEventThemeDisplay.textContent = themeNames[currentTheme] || currentTheme;
    eventInfo.classList.remove('hidden');
    addDishSection.classList.remove('hidden');
    dishesSection.classList.remove('hidden');
    
    // Disable event code input after joining
    eventCodeInput.disabled = true;
    eventThemeInput.disabled = true;
    userNameInput.disabled = true;
    joinEventBtn.disabled = true;
    
    // Attach AI suggestions button listener
    aiSuggestionsBtn = document.getElementById('aiSuggestionsBtn');
    if (aiSuggestionsBtn) {
        aiSuggestionsBtn.addEventListener('click', showAISuggestions);
    }
    
    // Attach menu card button listener
    viewMenuCardBtn = document.getElementById('viewMenuCardBtn');
    if (viewMenuCardBtn) {
        viewMenuCardBtn.addEventListener('click', showMenuCard);
    }
    
    // Attach QR code button listener
    generateQRBtn = document.getElementById('generateQRBtn');
    if (generateQRBtn) {
        generateQRBtn.addEventListener('click', generateQRCode);
    }
    
    // Attach email reminder button listener
    sendReminderBtn = document.getElementById('sendReminderBtn');
    if (sendReminderBtn) {
        sendReminderBtn.addEventListener('click', sendEmailReminder);
    }
    
    // Initialize photo gallery
    initializePhotoGallery();
    
    // Attach viral share and export listeners
    const shareWhatsAppBtn = document.getElementById('shareWhatsAppBtn');
    const shareTwitterBtn = document.getElementById('shareTwitterBtn');
    const exportMenuBtn = document.getElementById('exportMenuBtn');
    const voiceInputBtn = document.getElementById('voiceInputBtn');
    
    if (shareWhatsAppBtn) {
        shareWhatsAppBtn.addEventListener('click', shareOnWhatsApp);
    }
    if (shareTwitterBtn) {
        shareTwitterBtn.addEventListener('click', shareOnTwitter);
    }
    if (exportMenuBtn) {
        exportMenuBtn.addEventListener('click', exportMenu);
    }
    if (voiceInputBtn) {
        voiceInputBtn.addEventListener('click', voiceInputDish);
    }
}

// Copy Event Code
function copyEventCode() {
    // Copy uppercase for sharing (more readable)
    navigator.clipboard.writeText(currentEventCode.toUpperCase())
        .then(() => {
            showToast('Event code copied!', 'success');
        })
        .catch(() => {
            showToast('Failed to copy code', 'error');
        });
}

// Handle Dish Name Input - Search for images as user types
function handleDishNameInput() {
    const dishName = dishNameInput.value.trim();
    
    // Clear previous timeout
    if (imageSearchTimeout) {
        clearTimeout(imageSearchTimeout);
    }
    
    // Hide preview if empty
    if (!dishName) {
        if (dishImagePreview) {
            dishImagePreview.style.display = 'none';
        }
        currentDishImage = null;
        return;
    }
    
    // Debounce image search
    imageSearchTimeout = setTimeout(() => {
        searchDishImage(dishName);
    }, 500);
}

// Search for dish image using Unsplash API
async function searchDishImage(dishName) {
    try {
        // Using Unsplash Source API (no key needed for basic use)
        const query = encodeURIComponent(dishName + ' food');
        const imageUrl = `https://source.unsplash.com/400x300/?${query}`;
        
        currentDishImage = imageUrl;
        
        if (dishImagePreview) {
            dishImagePreview.innerHTML = `
                <img src="${imageUrl}" alt="${dishName}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 0.5rem;">
                <p style="font-size: 0.75rem; color: var(--gray-500); margin-top: 0.5rem; text-align: center;">✨ AI-generated preview</p>
            `;
            dishImagePreview.style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching image:', error);
        currentDishImage = null;
    }
}

// Handle Add Dish
function handleAddDish(e) {
    e.preventDefault();
    
    // Rate limiting - max 5 dishes per minute
    if (!rateLimiter.check('addDish', 5, 60000)) {
        showToast('⏱️ Slow down! You can only add 5 dishes per minute', 'error');
        return;
    }
    
    // Get and sanitize inputs
    const dishName = sanitizeInput(dishNameInput.value);
    const dishCategory = dishCategoryInput.value;
    const dishNotes = sanitizeInput(dishNotesInput.value);
    
    // Validate inputs
    const validationErrors = validateDish(dishName, dishCategory, currentUserName);
    if (validationErrors.length > 0) {
        showToast('❌ ' + validationErrors[0], 'error');
        return;
    }
    
    // Check for duplicate dishes
    const duplicate = allDishes.find(dish => 
        dish.name.toLowerCase() === dishName.toLowerCase()
    );
    
    if (duplicate) {
        const confirmAdd = confirm(
            `⚠️ "${duplicate.name}" is already on the menu (brought by ${duplicate.contributor}).\n\nDo you still want to add "${dishName}"?`
        );
        if (!confirmAdd) {
            showToast('Dish not added - duplicate avoided! ✅', 'success');
            return;
        }
    }
    
    const dishesRef = database.ref(`events/${currentEventCode}/dishes`);
    const newDishRef = dishesRef.push();
    
    // Sanitized data object
    const dishData = {
        name: dishName,
        category: dishCategory,
        notes: dishNotes,
        contributor: sanitizeInput(currentUserName),
        imageUrl: currentDishImage || null,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        // New fields for enhanced features
        dietaryInfo: {
            vegetarian: false,
            vegan: false,
            glutenFree: false,
            dairyFree: false,
            nutFree: false
        },
        servings: null,
        claimed: false
    };
    
    newDishRef.set(dishData)
    .then(() => {
        showToast('✅ Dish added successfully!', 'success');
        addDishForm.reset();
        if (dishImagePreview) {
            dishImagePreview.style.display = 'none';
        }
        currentDishImage = null;
    })
    .catch(error => {
        console.error('Error adding dish:', error);
        showToast('❌ Failed to add dish. Please try again.', 'error');
    });
}

// Listen to Theme Updates
function listenToTheme() {
    if (themeListener) {
        themeListener.off();
    }
    
    const themeRef = database.ref(`events/${currentEventCode}/theme`);
    
    themeListener = themeRef.on('value', snapshot => {
        const theme = snapshot.val() || 'default';
        if (theme !== currentTheme) {
            currentTheme = theme;
            eventThemeInput.value = theme;
            applyTheme(theme);
        }
    });
}

// Listen to Dishes Updates
function listenToDishes() {
    if (dishesListener) {
        dishesListener.off();
    }
    
    const dishesRef = database.ref(`events/${currentEventCode}/dishes`);
    
    dishesListener = dishesRef.on('value', snapshot => {
        const dishes = [];
        
        snapshot.forEach(childSnapshot => {
            dishes.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        
        renderDishes(dishes);
    });
}

// Render Dishes
function renderDishes(dishes) {
    allDishes = dishes; // Store globally for menu card
    
    // Update stats
    const dishCountEl = document.getElementById('dishCount');
    const contributorCountEl = document.getElementById('contributorCount');
    if (dishCountEl) dishCountEl.textContent = dishes.length;
    if (contributorCountEl) {
        const uniqueContributors = new Set(dishes.map(d => d.contributor));
        contributorCountEl.textContent = uniqueContributors.size;
    }
    
    if (dishes.length === 0) {
        dishesList.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    // Sort dishes by category and then by creation time
    const categoryOrder = { appetizer: 1, main: 2, side: 3, dessert: 4, beverage: 5, other: 6 };
    dishes.sort((a, b) => {
        const catDiff = categoryOrder[a.category] - categoryOrder[b.category];
        if (catDiff !== 0) return catDiff;
        return (a.createdAt || 0) - (b.createdAt || 0);
    });
    
    dishesList.innerHTML = dishes.map(dish => createDishCard(dish)).join('');
    
    // Apply current filter
    applyFilter();
}

// Show Complete Menu Card
function showMenuCard() {
    if (allDishes.length === 0) {
        showToast('No dishes to display yet!', 'error');
        return;
    }
    
    // Group dishes by category
    const grouped = {
        appetizer: [],
        main: [],
        side: [],
        dessert: [],
        beverage: [],
        other: []
    };
    
    allDishes.forEach(dish => {
        if (grouped[dish.category]) {
            grouped[dish.category].push(dish);
        }
    });
    
    const categoryNames = {
        appetizer: '🥗 Appetizers',
        main: '🍽️ Main Courses',
        side: '🥘 Side Dishes',
        dessert: '🍰 Desserts',
        beverage: '🥤 Beverages',
        other: '🍴 Other'
    };
    
    let menuHTML = '<div style="max-height: 70vh; overflow-y: auto;">';
    
    Object.keys(grouped).forEach(category => {
        if (grouped[category].length > 0) {
            menuHTML += `
                <div style="margin-bottom: 2rem;">
                    <h3 style="font-size: 1.5rem; font-weight: 700; color: var(--gray-900); margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 3px solid var(--primary);">
                        ${categoryNames[category]}
                    </h3>
                    <div style="display: grid; gap: 0.75rem;">
                        ${grouped[category].map(dish => `
                            <div style="padding: 1rem; background: var(--gray-50); border-radius: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; font-size: 1.125rem; color: var(--gray-900);">${escapeHtml(dish.name)}</div>
                                    <div style="font-size: 0.875rem; color: var(--gray-600); margin-top: 0.25rem;">
                                        👤 ${escapeHtml(dish.contributor)}
                                        ${dish.notes ? ` • 📝 ${escapeHtml(dish.notes)}` : ''}
                                    </div>
                                </div>
                                ${dish.imageUrl ? `
                                    <img src="${dish.imageUrl}" alt="${escapeHtml(dish.name)}" 
                                         style="width: 80px; height: 80px; object-fit: cover; border-radius: 0.5rem; margin-left: 1rem;"
                                         onerror="this.style.display='none'">
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    });
    
    menuHTML += '</div>';
    
    const modalHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1rem; backdrop-filter: blur(5px);" onclick="this.remove()">
            <div style="background: white; border-radius: 1.5rem; padding: 2.5rem; max-width: 900px; width: 100%; box-shadow: 0 25px 50px rgba(0,0,0,0.3);" onclick="event.stopPropagation()">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <div>
                        <h2 style="font-size: 2rem; font-weight: 800; color: var(--gray-900); margin: 0;">📋 Complete Menu Card</h2>
                        <p style="color: var(--gray-600); margin-top: 0.5rem;">${themeNames[currentTheme] || currentTheme} • ${allDishes.length} dishes</p>
                    </div>
                    <button onclick="this.closest('div[style*=fixed]').remove()" 
                            style="background: var(--gray-100); border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 1.5rem; cursor: pointer; color: var(--gray-600); transition: all 0.2s;"
                            onmouseover="this.style.background='var(--gray-200)'"
                            onmouseout="this.style.background='var(--gray-100)'">&times;</button>
                </div>
                ${menuHTML}
                <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 2px dashed var(--gray-200); text-align: center;">
                    <button onclick="window.print()" 
                            style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: white; border: none; border-radius: 0.75rem; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
                        🖨️ Print Menu
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Create Dish Card HTML
function createDishCard(dish) {
    const isOwner = dish.contributor === currentUserName;
    
    // Category emoji mapping
    const categoryEmojis = {
        'appetizer': '🥗',
        'main': '🍽️',
        'side': '🥘',
        'dessert': '🍰',
        'beverage': '🥤',
        'other': '🍴'
    };
    
    const emoji = categoryEmojis[dish.category] || '🍴';
    
    return `
        <div class="dish-card" data-category="${dish.category}">
            ${dish.imageUrl ? `
                <div class="dish-image" style="width: 100%; height: 200px; overflow: hidden;">
                    <img src="${dish.imageUrl}" alt="${escapeHtml(dish.name)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.style.display='none'">
                </div>
            ` : ''}
            <div class="dish-card-content">
                <div class="dish-header">
                    <h3 class="dish-name">${escapeHtml(dish.name)}</h3>
                    <span class="dish-category ${dish.category}">${emoji} ${dish.category}</span>
                </div>
                <div class="dish-contributor">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>Brought by ${escapeHtml(dish.contributor)}</span>
                </div>
                ${dish.notes ? `<p class="dish-notes">📝 ${escapeHtml(dish.notes)}</p>` : ''}
                ${isOwner ? `
                    <div class="dish-actions">
                        <button class="btn-edit" onclick="editDish('${dish.id}', '${escapeHtml(dish.name).replace(/'/g, "\\'")}', '${escapeHtml(dish.notes || '').replace(/'/g, "\\'")}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit
                        </button>
                        <button class="btn-delete" onclick="deleteDish('${dish.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            Delete
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Edit Dish
function editDish(dishId, currentName, currentNotes) {
    const newName = prompt('Edit dish name:', currentName);
    if (!newName || newName.trim() === '') return;
    
    const newNotes = prompt('Edit notes (optional):', currentNotes || '');
    
    const dishRef = database.ref(`events/${currentEventCode}/dishes/${dishId}`);
    
    dishRef.update({
        name: newName.trim(),
        notes: newNotes ? newNotes.trim() : ''
    })
    .then(() => {
        showToast('Dish updated successfully! ✨', 'success');
    })
    .catch(error => {
        console.error('Error updating dish:', error);
        showToast('Failed to update dish', 'error');
    });
}

// Delete Dish
function deleteDish(dishId) {
    if (!confirm('Are you sure you want to delete this dish?')) {
        return;
    }
    
    const dishRef = database.ref(`events/${currentEventCode}/dishes/${dishId}`);
    
    dishRef.remove()
        .then(() => {
            showToast('Dish deleted successfully', 'success');
        })
        .catch(error => {
            console.error('Error deleting dish:', error);
            showToast('Failed to delete dish', 'error');
        });
}

// Handle Filter Change
function handleFilterChange(category) {
    currentFilter = category;
    
    // Update active button
    filterButtons.forEach(btn => {
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    applyFilter();
}

// Apply Filter
function applyFilter() {
    const dishCards = document.querySelectorAll('.dish-card');
    
    dishCards.forEach(card => {
        if (currentFilter === 'all' || card.dataset.category === currentFilter) {
            card.classList.remove('hidden-filter');
        } else {
            card.classList.add('hidden-filter');
        }
    });
}

// Show Toast Notification
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// AI Dish Suggestions based on theme
function showAISuggestions() {
    const suggestions = getThemeSuggestions(currentTheme);
    
    const suggestionHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1rem;" onclick="this.remove()">
            <div style="background: white; border-radius: 1rem; padding: 2rem; max-width: 600px; max-height: 80vh; overflow-y: auto;" onclick="event.stopPropagation()">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="font-size: 1.5rem; font-weight: 700; color: var(--gray-900); margin: 0;">✨ AI Dish Suggestions</h3>
                    <button onclick="this.closest('div[style*=fixed]').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--gray-400);">&times;</button>
                </div>
                <p style="color: var(--gray-600); margin-bottom: 1.5rem;">Based on your ${themeNames[currentTheme] || currentTheme} theme:</p>
                <div style="display: grid; gap: 0.75rem;">
                    ${suggestions.map(dish => `
                        <div style="padding: 1rem; background: var(--gray-50); border-radius: 0.75rem; cursor: pointer; transition: all 0.2s;" 
                             onmouseover="this.style.background='var(--primary-light)'; this.style.color='white';" 
                             onmouseout="this.style.background='var(--gray-50)'; this.style.color='inherit';"
                             onclick="useSuggestion('${dish.name}', '${dish.category}'); this.closest('div[style*=fixed]').remove();">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <span style="font-size: 2rem;">${dish.emoji}</span>
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; font-size: 1rem;">${dish.name}</div>
                                    <div style="font-size: 0.875rem; opacity: 0.8;">${dish.category} • ${dish.description}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', suggestionHTML);
}

function useSuggestion(name, category) {
    dishNameInput.value = name;
    dishCategoryInput.value = category;
    handleDishNameInput(); // Trigger image search
    showToast('Suggestion applied! ✨', 'success');
}

function getThemeSuggestions(theme) {
    const suggestions = {
        'default': [
            { name: 'Caprese Skewers', category: 'appetizer', emoji: '🍅', description: 'Fresh and colorful' },
            { name: 'BBQ Pulled Pork Sliders', category: 'main', emoji: '🍔', description: 'Crowd favorite' },
            { name: 'Greek Salad', category: 'side', emoji: '🥗', description: 'Light and healthy' },
            { name: 'Chocolate Brownies', category: 'dessert', emoji: '🍫', description: 'Classic sweet treat' },
            { name: 'Fruit Punch', category: 'beverage', emoji: '🍹', description: 'Refreshing drink' }
        ],
        'birthday': [
            { name: 'Mini Cupcakes', category: 'dessert', emoji: '🧁', description: 'Perfect party size' },
            { name: 'Pizza Rolls', category: 'appetizer', emoji: '🍕', description: 'Kid-friendly' },
            { name: 'Birthday Cake', category: 'dessert', emoji: '🎂', description: 'The star of the show' },
            { name: 'Chicken Nuggets', category: 'main', emoji: '🍗', description: 'Always a hit' },
            { name: 'Lemonade', category: 'beverage', emoji: '🍋', description: 'Sweet and tangy' }
        ],
        'christmas': [
            { name: 'Honey Glazed Ham', category: 'main', emoji: '🍖', description: 'Holiday classic' },
            { name: 'Gingerbread Cookies', category: 'dessert', emoji: '🍪', description: 'Festive favorite' },
            { name: 'Roasted Vegetables', category: 'side', emoji: '🥕', description: 'Seasonal veggies' },
            { name: 'Eggnog', category: 'beverage', emoji: '🥛', description: 'Traditional drink' },
            { name: 'Cheese Board', category: 'appetizer', emoji: '🧀', description: 'Elegant starter' }
        ],
        'thanksgiving': [
            { name: 'Roast Turkey', category: 'main', emoji: '🦃', description: 'Traditional centerpiece' },
            { name: 'Pumpkin Pie', category: 'dessert', emoji: '🥧', description: 'Fall favorite' },
            { name: 'Mashed Potatoes', category: 'side', emoji: '🥔', description: 'Comfort food' },
            { name: 'Cranberry Sauce', category: 'side', emoji: '🍒', description: 'Sweet and tart' },
            { name: 'Apple Cider', category: 'beverage', emoji: '🍎', description: 'Warm and cozy' }
        ],
        'halloween': [
            { name: 'Mummy Hot Dogs', category: 'appetizer', emoji: '🌭', description: 'Spooky fun' },
            { name: 'Witch Finger Cookies', category: 'dessert', emoji: '🍪', description: 'Creepy treats' },
            { name: 'Pumpkin Soup', category: 'main', emoji: '🎃', description: 'Seasonal favorite' },
            { name: 'Monster Cupcakes', category: 'dessert', emoji: '👻', description: 'Decorated delights' },
            { name: 'Blood Orange Punch', category: 'beverage', emoji: '🍊', description: 'Eerie drink' }
        ],
        'summer': [
            { name: 'Grilled Burgers', category: 'main', emoji: '🍔', description: 'BBQ essential' },
            { name: 'Watermelon Salad', category: 'side', emoji: '🍉', description: 'Refreshing' },
            { name: 'Ice Cream Sundaes', category: 'dessert', emoji: '🍨', description: 'Cool treat' },
            { name: 'Corn on the Cob', category: 'side', emoji: '🌽', description: 'Summer staple' },
            { name: 'Iced Tea', category: 'beverage', emoji: '🧊', description: 'Chilled drink' }
        ],
        'wedding': [
            { name: 'Champagne Toast', category: 'beverage', emoji: '🥂', description: 'Celebration drink' },
            { name: 'Wedding Cake', category: 'dessert', emoji: '🎂', description: 'Elegant centerpiece' },
            { name: 'Salmon Filet', category: 'main', emoji: '🐟', description: 'Sophisticated choice' },
            { name: 'Bruschetta', category: 'appetizer', emoji: '🍞', description: 'Classy starter' },
            { name: 'Chocolate Truffles', category: 'dessert', emoji: '🍫', description: 'Decadent bites' }
        ]
    };
    
    return suggestions[theme] || suggestions['default'];
}

// Generate QR Code for Event
function generateQRCode() {
    const eventUrl = `${window.location.origin}${window.location.pathname}?code=${currentEventCode}`;
    
    const modalHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1rem; backdrop-filter: blur(5px);" onclick="this.remove()">
            <div style="background: white; border-radius: 1.5rem; padding: 2.5rem; max-width: 500px; width: 100%; box-shadow: 0 25px 50px rgba(0,0,0,0.3); text-align: center;" onclick="event.stopPropagation()">
                <h2 style="font-size: 1.75rem; font-weight: 800; color: var(--gray-900); margin: 0 0 1rem 0;">📱 Scan to Join Event</h2>
                <p style="color: var(--gray-600); margin-bottom: 1.5rem;">Share this QR code with guests!</p>
                
                <div id="qrcode" style="display: flex; justify-content: center; margin: 2rem 0; padding: 1.5rem; background: white; border-radius: 1rem;"></div>
                
                <div style="background: var(--gray-50); padding: 1rem; border-radius: 0.75rem; margin-bottom: 1.5rem;">
                    <p style="font-size: 0.875rem; color: var(--gray-600); margin: 0 0 0.5rem 0;">Event Code:</p>
                    <p style="font-size: 1.25rem; font-weight: 700; color: var(--primary); margin: 0; font-family: monospace;">${currentEventCode}</p>
                </div>
                
                <div style="display: flex; gap: 0.75rem;">
                    <button onclick="this.closest('div[style*=fixed]').remove()" 
                            style="flex: 1; padding: 0.75rem; background: var(--gray-200); border: none; border-radius: 0.75rem; font-weight: 600; cursor: pointer;">
                        Close
                    </button>
                    <button onclick="window.print()" 
                            style="flex: 1; padding: 0.75rem; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: white; border: none; border-radius: 0.75rem; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
                        🖨️ Print QR Code
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Generate QR code
    setTimeout(() => {
        const qrContainer = document.getElementById('qrcode');
        if (qrContainer && typeof QRCode !== 'undefined') {
            new QRCode(qrContainer, {
                text: eventUrl,
                width: 256,
                height: 256,
                colorDark: '#6366f1',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }, 100);
    
    showToast('QR Code generated! 📱', 'success');
}

// Send Email Reminder
function sendEmailReminder() {
    const email = prompt('Enter email address to send reminder:');
    if (!email || !email.includes('@')) {
        if (email !== null) showToast('Please enter a valid email', 'error');
        return;
    }
    
    // Check if EmailJS is configured
    if (typeof emailjs === 'undefined' || !emailjs) {
        showToast('⚠️ EmailJS not configured. See setup instructions!', 'error');
        showEmailJSSetup();
        return;
    }
    
    const eventUrl = `${window.location.origin}${window.location.pathname}?code=${currentEventCode}`;
    const themeName = themeNames[currentTheme] || currentTheme;
    
    // EmailJS template parameters
    const templateParams = {
        to_email: email,
        event_code: currentEventCode,
        event_theme: themeName,
        event_url: eventUrl,
        dish_count: allDishes.length,
        from_name: currentUserName
    };
    
    // Send email using EmailJS
    // You need to replace 'YOUR_SERVICE_ID' and 'YOUR_TEMPLATE_ID' with your own
    emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
        .then(() => {
            showToast(`✉️ Reminder sent to ${email}!`, 'success');
        })
        .catch((error) => {
            console.error('EmailJS error:', error);
            showToast('Failed to send email. Check EmailJS setup.', 'error');
            showEmailJSSetup();
        });
}

// Show EmailJS Setup Instructions
function showEmailJSSetup() {
    const setupHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1rem; backdrop-filter: blur(5px);" onclick="this.remove()">
            <div style="background: white; border-radius: 1.5rem; padding: 2.5rem; max-width: 600px; width: 100%; box-shadow: 0 25px 50px rgba(0,0,0,0.3); max-height: 80vh; overflow-y: auto;" onclick="event.stopPropagation()">
                <h2 style="font-size: 1.75rem; font-weight: 800; color: var(--gray-900); margin: 0 0 1rem 0;">📧 EmailJS Setup (Free!)</h2>
                
                <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1)); padding: 1.5rem; border-radius: 1rem; margin-bottom: 1.5rem;">
                    <h3 style="margin: 0 0 1rem 0; font-size: 1.125rem;">Quick Setup (5 minutes):</h3>
                    <ol style="margin: 0; padding-left: 1.5rem; line-height: 1.8;">
                        <li>Go to <a href="https://www.emailjs.com/" target="_blank" style="color: var(--primary); font-weight: 600;">emailjs.com</a></li>
                        <li>Sign up for FREE (200 emails/month)</li>
                        <li>Create an Email Service (Gmail, Outlook, etc.)</li>
                        <li>Create an Email Template with these variables:
                            <ul style="margin-top: 0.5rem;">
                                <li><code>{{to_email}}</code></li>
                                <li><code>{{event_code}}</code></li>
                                <li><code>{{event_theme}}</code></li>
                                <li><code>{{event_url}}</code></li>
                                <li><code>{{dish_count}}</code></li>
                                <li><code>{{from_name}}</code></li>
                            </ul>
                        </li>
                        <li>Copy your Public Key, Service ID, and Template ID</li>
                        <li>Update <code>app.js</code> lines 66, 725, 726</li>
                    </ol>
                </div>
                
                <div style="background: var(--gray-50); padding: 1rem; border-radius: 0.75rem; margin-bottom: 1.5rem;">
                    <p style="margin: 0; font-size: 0.875rem; color: var(--gray-700);">
                        <strong>Sample Email Template:</strong><br>
                        Subject: You're invited to {{event_theme}}!<br><br>
                        Hi! {{from_name}} invited you to join their potluck event.<br>
                        Event Code: {{event_code}}<br>
                        Current dishes: {{dish_count}}<br>
                        Join here: {{event_url}}
                    </p>
                </div>
                
                <button onclick="this.closest('div[style*=fixed]').remove()" 
                        style="width: 100%; padding: 0.75rem; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: white; border: none; border-radius: 0.75rem; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
                    Got it!
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', setupHTML);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Photo Gallery Functions
let uploadPhotoBtn = null;
let photoListener = null;

function initializePhotoGallery() {
    const photoSection = document.getElementById('photoSection');
    if (photoSection) {
        photoSection.classList.remove('hidden');
    }
    
    uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
    if (uploadPhotoBtn) {
        uploadPhotoBtn.addEventListener('click', uploadPhoto);
    }
    
    listenToPhotos();
}

// Upload Photo - Store as base64 in Firebase
function uploadPhoto() {
    const fileInput = document.getElementById('photoInput');
    fileInput.click();
    
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file
        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file', 'error');
            return;
        }
        
        // Limit to 2MB for Firebase performance
        if (file.size > 2 * 1024 * 1024) {
            showToast('Image must be less than 2MB', 'error');
            return;
        }
        
        // Show uploading state
        uploadPhotoBtn.disabled = true;
        uploadPhotoBtn.innerHTML = '⏳ Processing...';
        
        try {
            // Convert to base64 data URL
            const reader = new FileReader();
            reader.readAsDataURL(file);
            
            reader.onload = async () => {
                try {
                    const dataUrl = reader.result;
                    
                    // Find user's dish name
                    const userDish = allDishes.find(d => d.contributor === currentUserName);
                    const dishName = userDish ? userDish.name : 'My Dish';
                    
                    // Save to Firebase (base64 data URL stored directly)
                    await database.ref(`events/${currentEventCode}/photos`).push({
                        url: dataUrl, // Store base64 data URL
                        contributor: currentUserName,
                        dishName: dishName,
                        uploadedAt: firebase.database.ServerValue.TIMESTAMP
                    });
                    
                    showToast('Photo uploaded successfully! 📸', 'success');
                    fileInput.value = '';
                    
                } catch (error) {
                    console.error('Upload error:', error);
                    showToast('Failed to save photo. Please try again.', 'error');
                }
            };
            
            reader.onerror = () => {
                showToast('Failed to read file', 'error');
            };
            
        } catch (error) {
            console.error('Upload error:', error);
            showToast('Failed to upload photo. Please try again.', 'error');
        } finally {
            uploadPhotoBtn.disabled = false;
            uploadPhotoBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg> 📸 Upload Dish Photo';
        }
    };
}

// Listen to Photos
function listenToPhotos() {
    if (photoListener) {
        photoListener.off();
    }
    
    const photosRef = database.ref(`events/${currentEventCode}/photos`);
    
    photoListener = photosRef.on('value', (snapshot) => {
        const photos = [];
        snapshot.forEach((childSnapshot) => {
            photos.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        
        renderPhotos(photos);
    });
}

// Render Photos
function renderPhotos(photos) {
    const photoGallery = document.getElementById('photoGallery');
    const emptyPhotos = document.getElementById('emptyPhotos');
    
    if (photos.length === 0) {
        photoGallery.innerHTML = '';
        if (emptyPhotos) emptyPhotos.classList.remove('hidden');
        return;
    }
    
    if (emptyPhotos) emptyPhotos.classList.add('hidden');
    
    // Sort by upload time (newest first)
    photos.sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0));
    
    photoGallery.innerHTML = photos.map(photo => {
        const isOwner = photo.contributor === currentUserName;
        return `
            <div class="photo-card">
                <img src="${photo.url}" alt="${escapeHtml(photo.dishName)}" loading="lazy">
                <div class="photo-info">
                    <div class="photo-dish-name">${escapeHtml(photo.dishName)}</div>
                    <div class="photo-contributor">
                        👤 ${escapeHtml(photo.contributor)}
                    </div>
                    ${isOwner ? `
                        <button class="photo-delete-btn" onclick="deletePhoto('${photo.id}')">
                            🗑️ Delete Photo
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Delete Photo
function deletePhoto(photoId) {
    if (!confirm('Are you sure you want to delete this photo?')) {
        return;
    }
    
    // Delete from database (Cloudinary URL stays active but won't show in gallery)
    database.ref(`events/${currentEventCode}/photos/${photoId}`).remove()
        .then(() => {
            showToast('Photo deleted successfully', 'success');
        })
        .catch(error => {
            console.error('Error deleting photo:', error);
            showToast('Failed to delete photo', 'error');
        });
}

// Voice Input for Dish Name
function voiceInputDish() {
    const voiceBtn = document.getElementById('voiceInputBtn');
    const dishNameInput = document.getElementById('dishName');
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('Voice input not supported in this browser', 'error');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    voiceBtn.innerHTML = '🎤 Listening...';
    voiceBtn.disabled = true;
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        dishNameInput.value = transcript;
        showToast(`Heard: "${transcript}"`, 'success');
        // Trigger AI image search
        dishNameInput.dispatchEvent(new Event('input'));
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        showToast('Voice input failed. Please try again.', 'error');
    };
    
    recognition.onend = () => {
        voiceBtn.innerHTML = '🎤 Voice';
        voiceBtn.disabled = false;
    };
    
    recognition.start();
}

// Share on WhatsApp
function shareOnWhatsApp() {
    const eventUrl = window.location.href;
    const eventTitle = document.getElementById('eventTitle')?.textContent || 'Potluck Event';
    const dishCount = allDishes.length;
    
    const message = `🍽️ Join my ${eventTitle}!\n\n${dishCount} dishes already signed up!\n\nAdd yours here: ${eventUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    showToast('Opening WhatsApp...', 'success');
}

// Share on Twitter/X
function shareOnTwitter() {
    const eventUrl = window.location.href;
    const eventTitle = document.getElementById('eventTitle')?.textContent || 'Potluck Event';
    
    const message = `🍽️ Join my ${eventTitle}! Bring a dish and let's feast together! 🎉`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(eventUrl)}`;
    
    window.open(twitterUrl, '_blank');
    showToast('Opening X (Twitter)...', 'success');
}

// Export Menu as Text File
function exportMenu() {
    if (allDishes.length === 0) {
        showToast('No dishes to export yet!', 'error');
        return;
    }
    
    const eventTitle = document.getElementById('eventTitle')?.textContent || 'Potluck Event';
    let menuText = `🍽️ ${eventTitle.toUpperCase()}\n`;
    menuText += `${'='.repeat(50)}\n\n`;
    
    // Group by category
    const categories = {
        'appetizer': '🥗 APPETIZERS',
        'main': '🍖 MAIN COURSES',
        'side': '🥔 SIDE DISHES',
        'dessert': '🍰 DESSERTS',
        'beverage': '🥤 BEVERAGES',
        'other': '🍴 OTHER'
    };
    
    Object.entries(categories).forEach(([key, title]) => {
        const categoryDishes = allDishes.filter(d => d.category === key);
        if (categoryDishes.length > 0) {
            menuText += `${title}\n${'-'.repeat(50)}\n`;
            categoryDishes.forEach(dish => {
                menuText += `• ${dish.name}`;
                if (dish.notes) menuText += ` (${dish.notes})`;
                menuText += ` - by ${dish.contributor}\n`;
            });
            menuText += '\n';
        }
    });
    
    menuText += `\n${'='.repeat(50)}\n`;
    menuText += `Total Dishes: ${allDishes.length}\n`;
    menuText += `Contributors: ${new Set(allDishes.map(d => d.contributor)).size}\n`;
    menuText += `\nGenerated from: ${window.location.href}\n`;
    
    // Create and download file
    const blob = new Blob([menuText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentEventCode}-menu.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Menu exported! 📄', 'success');
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (dishesListener) {
        dishesListener.off();
    }
    if (themeListener) {
        themeListener.off();
    }
    if (photoListener) {
        photoListener.off();
    }
});

// Decorations Management
const decorationsContainer = document.getElementById('decorations');

function clearDecorations() {
    decorationsContainer.innerHTML = '';
}

function createDecorations(theme) {
    clearDecorations();
    
    switch(theme) {
        case 'birthday':
            createBirthdayDecorations();
            break;
        case 'christmas':
            createChristmasDecorations();
            break;
        case 'halloween':
            createHalloweenDecorations();
            break;
        case 'thanksgiving':
            createThanksgivingDecorations();
            break;
        case 'newyear':
            createNewYearDecorations();
            break;
        case 'wedding':
            createWeddingDecorations();
            break;
        case 'spring':
            createSpringDecorations();
            break;
        case 'summer':
            createSummerDecorations();
            break;
        case 'graduation':
            createGraduationDecorations();
            break;
        case 'default':
            createDefaultDecorations();
            break;
    }
}

function createBirthdayDecorations() {
    const balloons = ['🎈', '🎉', '🎊', '🎁', '🎂'];
    for (let i = 0; i < 15; i++) {
        const balloon = document.createElement('div');
        balloon.textContent = balloons[Math.floor(Math.random() * balloons.length)];
        balloon.style.position = 'absolute';
        balloon.style.left = Math.random() * 100 + '%';
        balloon.style.fontSize = (Math.random() * 2 + 1.5) + 'rem';
        balloon.style.animation = `floatBalloon ${Math.random() * 4 + 5}s ease-in-out infinite`;
        balloon.style.animationDelay = Math.random() * 5 + 's';
        decorationsContainer.appendChild(balloon);
    }
}

function createChristmasDecorations() {
    const snowflakes = ['❄️', '⛄', '🎄', '⭐', '🎅'];
    for (let i = 0; i < 30; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.textContent = snowflakes[Math.floor(Math.random() * snowflakes.length)];
        snowflake.style.left = Math.random() * 100 + '%';
        snowflake.style.fontSize = (Math.random() * 1 + 1) + 'rem';
        snowflake.style.animationDuration = (Math.random() * 5 + 8) + 's';
        snowflake.style.animationDelay = Math.random() * 5 + 's';
        decorationsContainer.appendChild(snowflake);
    }
}

function createHalloweenDecorations() {
    const items = ['🎃', '👻', '🦇', '🕷️', '🕸️', '💀'];
    for (let i = 0; i < 20; i++) {
        const item = document.createElement('div');
        item.className = 'pumpkin';
        item.textContent = items[Math.floor(Math.random() * items.length)];
        item.style.left = Math.random() * 100 + '%';
        item.style.top = Math.random() * 80 + '%';
        item.style.animationDelay = Math.random() * 3 + 's';
        decorationsContainer.appendChild(item);
    }
}

function createThanksgivingDecorations() {
    const leaves = ['🍂', '🍁', '🌾', '🦃', '🌽'];
    for (let i = 0; i < 25; i++) {
        const leaf = document.createElement('div');
        leaf.className = 'leaf';
        leaf.textContent = leaves[Math.floor(Math.random() * leaves.length)];
        leaf.style.left = Math.random() * 100 + '%';
        leaf.style.fontSize = (Math.random() * 1.5 + 1) + 'rem';
        leaf.style.animationDuration = (Math.random() * 4 + 6) + 's';
        leaf.style.animationDelay = Math.random() * 5 + 's';
        decorationsContainer.appendChild(leaf);
    }
}

function createNewYearDecorations() {
    const items = ['✨', '🎆', '🎇', '💫', '⭐'];
    // Confetti
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        decorationsContainer.appendChild(confetti);
    }
    // Sparkles
    for (let i = 0; i < 30; i++) {
        const sparkle = document.createElement('div');
        sparkle.textContent = items[Math.floor(Math.random() * items.length)];
        sparkle.style.position = 'absolute';
        sparkle.style.left = Math.random() * 100 + '%';
        sparkle.style.top = Math.random() * 100 + '%';
        sparkle.style.fontSize = (Math.random() * 1.5 + 1) + 'rem';
        sparkle.style.animation = `sparkleAnimation ${Math.random() * 2 + 1}s ease-in-out infinite`;
        sparkle.style.animationDelay = Math.random() * 2 + 's';
        decorationsContainer.appendChild(sparkle);
    }
}

function createWeddingDecorations() {
    const hearts = ['💕', '💖', '💗', '💝', '💞', '💓', '❤️', '🌹'];
    for (let i = 0; i < 20; i++) {
        const heart = document.createElement('div');
        heart.className = 'heart';
        heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        heart.style.left = Math.random() * 100 + '%';
        heart.style.fontSize = (Math.random() * 1.5 + 1.5) + 'rem';
        heart.style.animationDuration = (Math.random() * 4 + 6) + 's';
        heart.style.animationDelay = Math.random() * 5 + 's';
        decorationsContainer.appendChild(heart);
    }
}

function createSpringDecorations() {
    const flowers = ['🌸', '🌺', '🌼', '🌻', '🌷', '🦋', '🐝'];
    for (let i = 0; i < 25; i++) {
        const flower = document.createElement('div');
        flower.className = 'flower';
        flower.textContent = flowers[Math.floor(Math.random() * flowers.length)];
        flower.style.left = Math.random() * 100 + '%';
        flower.style.top = Math.random() * 80 + '%';
        flower.style.animationDelay = Math.random() * 4 + 's';
        decorationsContainer.appendChild(flower);
    }
}

function createSummerDecorations() {
    const items = ['☀️', '🌊', '🏖️', '🍉', '🍹', '🌴', '🐚'];
    for (let i = 0; i < 15; i++) {
        const item = document.createElement('div');
        item.textContent = items[Math.floor(Math.random() * items.length)];
        item.style.position = 'absolute';
        item.style.left = Math.random() * 100 + '%';
        item.style.top = Math.random() * 80 + '%';
        item.style.fontSize = (Math.random() * 2 + 1.5) + 'rem';
        item.style.animation = `flowerGrow ${Math.random() * 3 + 3}s ease-in-out infinite`;
        item.style.animationDelay = Math.random() * 3 + 's';
        item.style.opacity = '0.7';
        decorationsContainer.appendChild(item);
    }
}

function createGraduationDecorations() {
    const items = ['🎓', '📚', '🎉', '⭐', '🏆'];
    for (let i = 0; i < 20; i++) {
        const cap = document.createElement('div');
        cap.className = 'grad-cap';
        cap.textContent = items[Math.floor(Math.random() * items.length)];
        cap.style.left = Math.random() * 100 + '%';
        cap.style.fontSize = (Math.random() * 1.5 + 1.5) + 'rem';
        cap.style.animationDuration = (Math.random() * 3 + 3) + 's';
        cap.style.animationDelay = Math.random() * 4 + 's';
        decorationsContainer.appendChild(cap);
    }
}

function createDefaultDecorations() {
    const items = ['🎉', '🎊', '✨', '🎈'];
    for (let i = 0; i < 15; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
        confetti.style.animationDuration = (Math.random() * 2 + 3) + 's';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        decorationsContainer.appendChild(confetti);
    }
}

// Initialize default theme
applyTheme('default');
createDecorations('default');

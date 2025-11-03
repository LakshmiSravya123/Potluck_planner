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
let app, database;
try {
    app = firebase.initializeApp(firebaseConfig);
    database = firebase.database();
} catch (error) {
    console.error("Firebase initialization error:", error);
    showToast("Please configure Firebase in app.js", "error");
}

// App State
let currentEventCode = null;
let currentUserName = null;
let currentFilter = 'all';
let currentTheme = 'default';
let dishesListener = null;
let themeListener = null;

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

// Event Listeners
joinEventBtn.addEventListener('click', handleJoinEvent);
copyCodeBtn.addEventListener('click', copyEventCode);
addDishForm.addEventListener('submit', handleAddDish);
eventThemeInput.addEventListener('change', handleThemePreview);
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
    // Remove all theme classes
    document.body.className = '';
    // Add new theme class
    document.body.classList.add(`theme-${theme}`);
    currentTheme = theme;
    // Update theme display if visible
    if (currentEventThemeDisplay) {
        currentEventThemeDisplay.textContent = themeNames[theme] || theme;
    }
    // Create decorations for the theme
    createDecorations(theme);
}

// Handle Join/Create Event
function handleJoinEvent() {
    const userName = userNameInput.value.trim();
    const theme = eventThemeInput.value;
    
    if (!userName) {
        showToast('Please enter your name', 'error');
        return;
    }
    
    currentUserName = userName;
    currentTheme = theme;
    let eventCode = eventCodeInput.value.trim().toUpperCase();
    
    if (!eventCode) {
        // Create new event
        eventCode = generateEventCode();
        createEvent(eventCode, theme);
    } else {
        // Join existing event
        joinEvent(eventCode);
    }
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
    const eventRef = database.ref(`events/${eventCode}`);
    
    eventRef.set({
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        createdBy: currentUserName,
        theme: theme || 'default'
    })
    .then(() => {
        currentEventCode = eventCode;
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
    const eventRef = database.ref(`events/${eventCode}`);
    
    eventRef.once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                currentEventCode = eventCode;
                const eventData = snapshot.val();
                const theme = eventData.theme || 'default';
                currentTheme = theme;
                eventThemeInput.value = theme;
                applyTheme(theme);
                showEventInterface();
                listenToDishes();
                listenToTheme();
                showToast('Joined event successfully!', 'success');
            } else {
                showToast('Event not found. Check the code or create a new event.', 'error');
            }
        })
        .catch(error => {
            console.error('Error joining event:', error);
            showToast('Failed to join event', 'error');
        });
}

// Show Event Interface
function showEventInterface() {
    currentEventCodeDisplay.textContent = currentEventCode;
    currentEventThemeDisplay.textContent = themeNames[currentTheme] || currentTheme;
    eventInfo.classList.remove('hidden');
    addDishSection.classList.remove('hidden');
    dishesSection.classList.remove('hidden');
    
    // Disable event code input after joining
    eventCodeInput.disabled = true;
    eventThemeInput.disabled = true;
    userNameInput.disabled = true;
    joinEventBtn.disabled = true;
}

// Copy Event Code
function copyEventCode() {
    navigator.clipboard.writeText(currentEventCode)
        .then(() => {
            showToast('Event code copied!', 'success');
        })
        .catch(() => {
            showToast('Failed to copy code', 'error');
        });
}

// Handle Add Dish
function handleAddDish(e) {
    e.preventDefault();
    
    const dishName = dishNameInput.value.trim();
    const dishCategory = dishCategoryInput.value;
    const dishNotes = dishNotesInput.value.trim();
    
    if (!dishName || !dishCategory) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    const dishesRef = database.ref(`events/${currentEventCode}/dishes`);
    const newDishRef = dishesRef.push();
    
    newDishRef.set({
        name: dishName,
        category: dishCategory,
        notes: dishNotes,
        contributor: currentUserName,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    })
    .then(() => {
        showToast('Dish added successfully!', 'success');
        addDishForm.reset();
    })
    .catch(error => {
        console.error('Error adding dish:', error);
        showToast('Failed to add dish', 'error');
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

// Create Dish Card HTML
function createDishCard(dish) {
    const isOwner = dish.contributor === currentUserName;
    
    return `
        <div class="dish-card" data-category="${dish.category}">
            <div class="dish-header">
                <h3 class="dish-name">${escapeHtml(dish.name)}</h3>
                <span class="dish-category ${dish.category}">${dish.category}</span>
            </div>
            <div class="dish-contributor">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>${escapeHtml(dish.contributor)}</span>
            </div>
            ${dish.notes ? `<p class="dish-notes">${escapeHtml(dish.notes)}</p>` : ''}
            ${isOwner ? `
                <div class="dish-actions">
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
    `;
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

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (dishesListener) {
        dishesListener.off();
    }
    if (themeListener) {
        themeListener.off();
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

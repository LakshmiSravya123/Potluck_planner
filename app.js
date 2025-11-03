// Firebase Configuration
// IMPORTANT: Replace this with your own Firebase config
// Get it from: Firebase Console > Project Settings > Your apps > Web app
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCzvH64kpIcpgUrjxVsJBhF9SxME7pVCyQ",
  authDomain: "potluck-planner-15a68.firebaseapp.com",
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
let dishesListener = null;

// DOM Elements
const eventCodeInput = document.getElementById('eventCode');
const userNameInput = document.getElementById('userName');
const joinEventBtn = document.getElementById('joinEventBtn');
const eventInfo = document.getElementById('eventInfo');
const currentEventCodeDisplay = document.getElementById('currentEventCode');
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
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => handleFilterChange(btn.dataset.category));
});

// Handle Join/Create Event
function handleJoinEvent() {
    const userName = userNameInput.value.trim();
    
    if (!userName) {
        showToast('Please enter your name', 'error');
        return;
    }
    
    currentUserName = userName;
    let eventCode = eventCodeInput.value.trim().toUpperCase();
    
    if (!eventCode) {
        // Create new event
        eventCode = generateEventCode();
        createEvent(eventCode);
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
function createEvent(eventCode) {
    const eventRef = database.ref(`events/${eventCode}`);
    
    eventRef.set({
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        createdBy: currentUserName
    })
    .then(() => {
        currentEventCode = eventCode;
        showEventInterface();
        listenToDishes();
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
                showEventInterface();
                listenToDishes();
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
    eventInfo.classList.remove('hidden');
    addDishSection.classList.remove('hidden');
    dishesSection.classList.remove('hidden');
    
    // Disable event code input after joining
    eventCodeInput.disabled = true;
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
});

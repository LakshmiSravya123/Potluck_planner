// firebase.js - Firebase Realtime Database Integration
// TODO: Replace config values with your Firebase project's credentials

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, onValue, set, update, remove, get, child } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Firebase configuration - REPLACE WITH YOUR CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDemoKeyReplaceWithActualKey",
  authDomain: "potluck-planner-demo.firebaseapp.com",
  databaseURL: "https://potluck-planner-demo-default-rtdb.firebaseio.com",
  projectId: "potluck-planner-demo",
  storageBucket: "potluck-planner-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012345678"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Firebase helper functions
export const firebaseHelpers = {
  // Create a new event
  async createEvent(eventData) {
    try {
      const eventsRef = ref(db, 'events');
      const newEventRef = push(eventsRef);
      await set(newEventRef, {
        ...eventData,
        createdAt: new Date().toISOString(),
        status: 'active'
      });
      return newEventRef.key;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  // Get event by ID
  async getEvent(eventId) {
    try {
      const eventRef = ref(db, `events/${eventId}`);
      const snapshot = await get(eventRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Error getting event:', error);
      throw error;
    }
  },

  // Update event details
  async updateEvent(eventId, updates) {
    try {
      const eventRef = ref(db, `events/${eventId}`);
      await update(eventRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  // Submit RSVP for an event
  async submitRSVP(eventId, guestData) {
    try {
      // Check for duplicate email
      const existingGuest = await this.checkDuplicateEmail(eventId, guestData.email);
      if (existingGuest) {
        throw new Error('An RSVP with this email already exists for this event');
      }

      const guestsRef = ref(db, `events/${eventId}/guests`);
      const newGuestRef = push(guestsRef);
      const sanitizedData = this.sanitizeGuestData(guestData);
      
      await set(newGuestRef, {
        ...sanitizedData,
        createdAt: new Date().toISOString(),
        status: 'confirmed'
      });

      // Update event stats
      await this.updateEventStats(eventId);
      
      return newGuestRef.key;
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      throw error;
    }
  },

  // Check for duplicate email
  async checkDuplicateEmail(eventId, email) {
    if (!email) return null;
    
    try {
      const guestsRef = ref(db, `events/${eventId}/guests`);
      const snapshot = await get(guestsRef);
      
      if (snapshot.exists()) {
        const guests = snapshot.val();
        return Object.values(guests).find(guest => 
          guest.email && guest.email.toLowerCase() === email.toLowerCase()
        );
      }
      return null;
    } catch (error) {
      console.error('Error checking duplicate email:', error);
      return null;
    }
  },

  // Update RSVP
  async updateRSVP(eventId, guestId, updates) {
    try {
      const guestRef = ref(db, `events/${eventId}/guests/${guestId}`);
      const sanitizedData = this.sanitizeGuestData(updates);
      await update(guestRef, {
        ...sanitizedData,
        updatedAt: new Date().toISOString()
      });

      // Update event stats
      await this.updateEventStats(eventId);
    } catch (error) {
      console.error('Error updating RSVP:', error);
      throw error;
    }
  },

  // Delete RSVP
  async deleteRSVP(eventId, guestId) {
    try {
      const guestRef = ref(db, `events/${eventId}/guests/${guestId}`);
      await remove(guestRef);

      // Update event stats
      await this.updateEventStats(eventId);
    } catch (error) {
      console.error('Error deleting RSVP:', error);
      throw error;
    }
  },

  // Listen to real-time updates for an event
  listenToEvent(eventId, callback) {
    const eventRef = ref(db, `events/${eventId}`);
    return onValue(eventRef, (snapshot) => {
      const data = snapshot.exists() ? snapshot.val() : null;
      callback(data);
    });
  },

  // Listen to guests for an event
  listenToGuests(eventId, callback) {
    const guestsRef = ref(db, `events/${eventId}/guests`);
    return onValue(guestsRef, (snapshot) => {
      const guests = snapshot.exists() ? snapshot.val() : {};
      callback(guests);
    });
  },

  // Get all events for dashboard
  async getAllEvents() {
    try {
      const eventsRef = ref(db, 'events');
      const snapshot = await get(eventsRef);
      return snapshot.exists() ? snapshot.val() : {};
    } catch (error) {
      console.error('Error getting all events:', error);
      throw error;
    }
  },

  // Update event statistics
  async updateEventStats(eventId) {
    try {
      const guestsRef = ref(db, `events/${eventId}/guests`);
      const snapshot = await get(guestsRef);
      
      let stats = {
        total: 0,
        confirmed: 0,
        maybe: 0,
        declined: 0,
        pending: 0
      };

      if (snapshot.exists()) {
        const guests = snapshot.val();
        stats.total = Object.keys(guests).length;
        
        Object.values(guests).forEach(guest => {
          switch (guest.status) {
            case 'confirmed':
              stats.confirmed++;
              break;
            case 'maybe':
              stats.maybe++;
              break;
            case 'declined':
              stats.declined++;
              break;
            default:
              stats.pending++;
          }
        });
      }

      await update(ref(db, `events/${eventId}`), {
        stats: stats,
        lastUpdated: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error updating event stats:', error);
    }
  },

  // Sanitize guest data before saving to Firebase
  sanitizeGuestData(data) {
    const sanitized = {};
    
    if (data.name) {
      sanitized.name = data.name.trim().substring(0, 100);
    }
    
    if (data.email) {
      sanitized.email = data.email.trim().toLowerCase().substring(0, 255);
    }
    
    if (data.phone) {
      sanitized.phone = data.phone.trim().substring(0, 20);
    }
    
    if (data.status) {
      sanitized.status = data.status;
    }
    
    if (data.bringing) {
      sanitized.bringing = data.bringing.trim().substring(0, 100);
    }
    
    if (data.notes) {
      sanitized.notes = data.notes.trim().substring(0, 500);
    }
    
    if (data.dietaryRestrictions) {
      sanitized.dietaryRestrictions = data.dietaryRestrictions.trim().substring(0, 200);
    }
    
    return sanitized;
  },

  // Validate email format
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // Get event analytics
  async getEventAnalytics(eventId) {
    try {
      const eventRef = ref(db, `events/${eventId}`);
      const snapshot = await get(eventRef);
      
      if (!snapshot.exists()) return null;
      
      const event = snapshot.val();
      const analytics = {
        ...event.stats,
        eventName: event.eventName,
        date: event.date,
        location: event.location,
        slots: event.slots || {},
        slotDistribution: {}
      };

      // Calculate slot distribution
      if (event.guests) {
        Object.values(event.guests).forEach(guest => {
          if (guest.bringing) {
            analytics.slotDistribution[guest.bringing] = 
              (analytics.slotDistribution[guest.bringing] || 0) + 1;
          }
        });
      }

      return analytics;
    } catch (error) {
      console.error('Error getting event analytics:', error);
      throw error;
    }
  }
};

// Export for use in other modules
export default firebaseHelpers;

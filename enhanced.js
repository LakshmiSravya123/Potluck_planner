// EventLink Enhanced - Beautiful, Free RSVP Tool
// Made with ❤️ by EventLink

class EventLink {
    constructor() {
        this.events = [];
        this.currentEvent = null;
        this.currentView = 'dashboard';
        this.storageKey = 'eventlink_events';
        this.init();
    }
    
    async init() {
        await this.loadEvents();
        this.bindEvents();
        this.render();
        this.handleRouting();
    }
    
    // Storage: localStorage for free persistence
    async loadEvents() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                this.events = JSON.parse(stored);
            } catch (e) {
                console.error('Failed to load events:', e);
                this.events = [];
            }
        }
    }
    
    saveEvents() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.events));
    }
    
    // Routing: Handle #event-id URLs
    handleRouting() {
        const hash = window.location.hash.slice(1);
        if (hash && hash.startsWith('event-')) {
            const eventId = hash.replace('event-', '');
            this.showEvent(eventId);
        } else {
            this.showDashboard();
        }
    }
    
    // View Management
    showDashboard() {
        this.currentView = 'dashboard';
        document.getElementById('dashboardView').classList.remove('hidden');
        document.getElementById('eventView').classList.add('hidden');
        window.location.hash = '';
        this.renderDashboard();
    }
    
    showEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) {
            this.showToast('Event not found!', 'error');
            this.showDashboard();
            return;
        }
        
        this.currentEvent = event;
        this.currentView = 'event';
        document.getElementById('dashboardView').classList.add('hidden');
        document.getElementById('eventView').classList.remove('hidden');
        window.location.hash = `event-${eventId}`;
        this.renderEvent();
    }
    
    // Event Creation
    showCreateEvent() {
        document.getElementById('createEventModal').classList.add('modal-open');
        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('eventDate').value = tomorrow.toISOString().split('T')[0];
    }
    
    hideCreateEvent() {
        document.getElementById('createEventModal').classList.remove('modal-open');
        document.getElementById('eventTitle').value = '';
        document.getElementById('eventLocation').value = '';
        document.getElementById('eventDescription').value = '';
    }
    
    createEvent(event) {
        event.preventDefault();
        
        const theme = document.querySelector('input[name="eventTheme"]:checked').value;
        
        const newEvent = {
            id: this.generateId(),
            title: document.getElementById('eventTitle').value,
            date: document.getElementById('eventDate').value,
            time: document.getElementById('eventTime').value,
            location: document.getElementById('eventLocation').value || 'Location TBD',
            description: document.getElementById('eventDescription').value,
            theme: theme,
            rsvps: [],
            createdAt: new Date().toISOString(),
            createdBy: 'EventLink User'
        };
        
        this.events.push(newEvent);
        this.saveEvents();
        this.hideCreateEvent();
        this.showEvent(newEvent.id);
        this.showToast('Event created successfully! 🎉');
        this.confetti();
    }
    
    // RSVP Management with Confetti! 🎊
    submitRSVP(event) {
        event.preventDefault();
        
        const name = document.getElementById('rsvpName').value.trim();
        const email = document.getElementById('rsvpEmail').value.trim();
        const status = document.querySelector('input[name="rsvpStatus"]:checked').value;
        const notes = document.getElementById('rsvpNotes').value.trim();
        
        if (!name) {
            this.showToast('Please enter your name', 'error');
            return;
        }
        
        // Check if already RSVP'd
        const existingRSVP = this.currentEvent.rsvps.find(r => r.name.toLowerCase() === name.toLowerCase());
        if (existingRSVP) {
            existingRSVP.email = email;
            existingRSVP.status = status;
            existingRSVP.notes = notes;
            existingRSVP.updatedAt = new Date().toISOString();
        } else {
            const rsvp = {
                id: this.generateId(),
                name,
                email,
                status,
                notes,
                createdAt: new Date().toISOString()
            };
            this.currentEvent.rsvps.push(rsvp);
        }
        
        this.saveEvents();
        this.renderEvent();
        this.showToast(`${name}, your RSVP has been received! ${status === 'yes' ? '🎉' : ''}`);
        
        // Reset form
        document.getElementById('rsvpName').value = '';
        document.getElementById('rsvpEmail').value = '';
        document.getElementById('rsvpNotes').value = '';
        document.querySelector('input[name="rsvpStatus"][value="yes"]').checked = true;
        
        // Confetti on add! 🎊
        if (status === 'yes') {
            this.confetti();
        }
    }
    
    // Rendering with Prettier Table
    render() {
        this.updateStats();
        if (this.currentView === 'dashboard') {
            this.renderDashboard();
        } else if (this.currentView === 'event') {
            this.renderEvent();
        }
    }
    
    renderDashboard() {
        const eventsList = document.getElementById('eventsList');
        const noEvents = document.getElementById('noEvents');
        
        if (this.events.length === 0) {
            eventsList.innerHTML = '';
            noEvents.style.display = 'block';
            return;
        }
        
        noEvents.style.display = 'none';
        
        eventsList.innerHTML = this.events.map(event => {
            const themeEmoji = { potluck: '🍕', meeting: '📅', party: '🎉' }[event.theme] || '📅';
            const rsvpCount = event.rsvps.filter(r => r.status === 'yes').length;
            const eventDate = new Date(`${event.date}T${event.time}`);
            const isPast = eventDate < new Date();
            
            return `
                <div class="card bg-base-100 shadow-xl card-hover ${isPast ? 'opacity-60' : ''}">
                    <div class="card-body">
                        <div class="flex justify-between items-start mb-4">
                            <div class="text-3xl">${themeEmoji}</div>
                            <div class="dropdown dropdown-end">
                                <button tabindex="0" class="btn btn-ghost btn-circle btn-sm">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                                    <li><a onclick="eventLink.shareEvent('${event.id}')"><i class="fas fa-share mr-2"></i>Share</a></li>
                                    <li><a onclick="eventLink.duplicateEvent('${event.id}')"><i class="fas fa-copy mr-2"></i>Duplicate</a></li>
                                    <li><a onclick="eventLink.deleteEvent('${event.id}')" class="text-error"><i class="fas fa-trash mr-2"></i>Delete</a></li>
                                </ul>
                            </div>
                        </div>
                        
                        <h2 class="card-title text-lg">${event.title}</h2>
                        <p class="text-sm text-gray-600 mb-2">
                            <i class="fas fa-calendar mr-1"></i>${this.formatDate(event.date)} at ${event.time}
                        </p>
                        <p class="text-sm text-gray-600 mb-4">
                            <i class="fas fa-map-marker-alt mr-1"></i>${event.location}
                        </p>
                        
                        <div class="flex justify-between items-center">
                            <div class="flex gap-2">
                                <span class="badge badge-primary">${rsvpCount} going</span>
                                <span class="badge badge-ghost">${event.rsvps.length} total</span>
                            </div>
                            <button onclick="eventLink.showEvent('${event.id}')" 
                                class="btn btn-primary btn-sm">
                                View
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    renderEvent() {
        if (!this.currentEvent) return;
        
        // Render header with theme colors
        const header = document.getElementById('eventHeader');
        const themeClass = `gradient-${this.currentEvent.theme}`;
        header.className = `${themeClass} text-white rounded-2xl p-8 mb-8 text-center`;
        
        header.innerHTML = `
            <div class="text-5xl mb-4">
                ${this.currentEvent.theme === 'potluck' ? '🍕' : this.currentEvent.theme === 'meeting' ? '📅' : '🎉'}
            </div>
            <h1 class="text-3xl md:text-4xl font-black mb-4">${this.currentEvent.title}</h1>
            <p class="text-lg mb-2">
                <i class="fas fa-calendar mr-2"></i>${this.formatDate(this.currentEvent.date)} at ${this.currentEvent.time}
            </p>
            <p class="text-lg mb-4">
                <i class="fas fa-map-marker-alt mr-2"></i>${this.currentEvent.location}
            </p>
            ${this.currentEvent.description ? `<p class="text-base opacity-90">${this.currentEvent.description}</p>` : ''}
        `;
        
        // Render guests with prettier table
        this.renderGuests();
        
        // Update page title
        document.title = `${this.currentEvent.title} - EventLink`;
        document.getElementById('pageTitle').textContent = document.title;
    }
    
    renderGuests() {
        const guestsTableBody = document.getElementById('guestsTableBody');
        const guestsMobileList = document.getElementById('guestsMobileList');
        const noGuests = document.getElementById('noGuests');
        const goingCount = document.getElementById('goingCount');
        const maybeCount = document.getElementById('maybeCount');
        const notGoingCount = document.getElementById('notGoingCount');
        
        const rsvps = this.currentEvent.rsvps;
        const going = rsvps.filter(r => r.status === 'yes');
        const maybe = rsvps.filter(r => r.status === 'maybe');
        const notGoing = rsvps.filter(r => r.status === 'no');
        
        goingCount.textContent = going.length;
        maybeCount.textContent = maybe.length;
        notGoingCount.textContent = notGoing.length;
        
        if (rsvps.length === 0) {
            guestsTableBody.innerHTML = '';
            guestsMobileList.innerHTML = '';
            noGuests.style.display = 'block';
            return;
        }
        
        noGuests.style.display = 'none';
        
        // Desktop table view with avatars
        guestsTableBody.innerHTML = rsvps.map(rsvp => {
            const statusColor = {
                yes: 'success',
                maybe: 'warning', 
                no: 'error'
            }[rsvp.status];
            
            const statusIcon = {
                yes: '✅',
                maybe: '🤔',
                no: '❌'
            }[rsvp.status];
            
            const avatar = this.getAvatar(rsvp.name);
            
            return `
                <tr class="animate-slide-in">
                    <td>
                        <div class="flex items-center gap-3">
                            <div class="avatar" style="background: ${avatar.color}">
                                ${avatar.initials}
                            </div>
                            <div class="font-semibold">${rsvp.name}</div>
                        </div>
                    </td>
                    <td class="text-gray-600">${rsvp.email || '-'}</td>
                    <td>
                        <span class="badge badge-${statusColor} badge-sm">${statusIcon} ${rsvp.status}</span>
                    </td>
                    <td class="text-gray-600 text-sm">${rsvp.notes || '-'}</td>
                    <td class="text-gray-500 text-sm">${this.formatDate(rsvp.createdAt.split('T')[0])}</td>
                </tr>
            `;
        }).join('');
        
        // Mobile cards view
        guestsMobileList.innerHTML = rsvps.map(rsvp => {
            const statusColor = {
                yes: 'success',
                maybe: 'warning',
                no: 'error'
            }[rsvp.status];
            
            const statusIcon = {
                yes: '✅',
                maybe: '🤔',
                no: '❌'
            }[rsvp.status];
            
            const avatar = this.getAvatar(rsvp.name);
            
            return `
                <div class="table-row animate-slide-in">
                    <td data-label="Guest">
                        <div class="flex items-center gap-3">
                            <div class="avatar" style="background: ${avatar.color}">
                                ${avatar.initials}
                            </div>
                            <div class="font-semibold">${rsvp.name}</div>
                        </div>
                    </td>
                    <td data-label="Email">${rsvp.email || '-'}</td>
                    <td data-label="Status">
                        <span class="badge badge-${statusColor} badge-sm">${statusIcon} ${rsvp.status}</span>
                    </td>
                    <td data-label="Notes">${rsvp.notes || '-'}</td>
                    <td data-label="Added">${this.formatDate(rsvp.createdAt.split('T')[0])}</td>
                </div>
            `;
        }).join('');
    }
    
    // Utility Functions
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }
    
    getAvatar(name) {
        const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const color = colors[name.length % colors.length];
        return { initials, color };
    }
    
    updateStats() {
        const totalEvents = this.events.length;
        const totalRSVPs = this.events.reduce((sum, event) => sum + event.rsvps.length, 0);
        
        document.getElementById('totalEvents').textContent = totalEvents;
        document.getElementById('totalRSVPs').textContent = totalRSVPs;
    }
    
    // Sharing Functions
    shareEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;
        
        const url = `${window.location.origin}${window.location.pathname}#event-${eventId}`;
        navigator.clipboard.writeText(url);
        this.showToast('Event link copied! 📋');
    }
    
    copyEventLink() {
        const url = `${window.location.origin}${window.location.pathname}#event-${this.currentEvent.id}`;
        navigator.clipboard.writeText(url);
        this.showToast('Event link copied! 📋');
    }
    
    shareOnWhatsApp() {
        const url = `${window.location.origin}${window.location.pathname}#event-${this.currentEvent.id}`;
        const text = `Join ${this.currentEvent.title}! ${url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
    
    shareOnTwitter() {
        const url = `${window.location.origin}${window.location.pathname}#event-${this.currentEvent.id}`;
        const text = `Join ${this.currentEvent.title}! 🎉`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    }
    
    showQRCode() {
        const url = `${window.location.origin}${window.location.pathname}#event-${this.currentEvent.id}`;
        const qrDisplay = document.getElementById('qrCodeDisplay');
        const qrContainer = document.getElementById('qrcode');
        
        qrDisplay.classList.remove('hidden');
        qrContainer.innerHTML = '';
        
        new QRCode(qrContainer, {
            text: url,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
    }
    
    downloadQR() {
        const canvas = document.querySelector('#qrcode canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = `${this.currentEvent.title}-qrcode.png`;
            link.href = canvas.toDataURL();
            link.click();
            this.showToast('QR code downloaded! 📱');
        }
    }
    
    // Export Functions
    exportGuests() {
        const csv = [
            ['Name', 'Email', 'Status', 'Notes', 'RSVP Date'],
            ...this.currentEvent.rsvps.map(r => [
                r.name,
                r.email || '',
                r.status,
                r.notes || '',
                new Date(r.createdAt).toLocaleDateString()
            ])
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentEvent.title}-guests.csv`;
        a.click();
        
        this.showToast('Guest list exported! 📄');
    }
    
    // Event Management
    duplicateEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;
        
        const duplicated = {
            ...event,
            id: this.generateId(),
            title: `${event.title} (Copy)`,
            rsvps: [],
            createdAt: new Date().toISOString()
        };
        
        delete duplicated.createdBy;
        
        this.events.push(duplicated);
        this.saveEvents();
        this.render();
        this.showToast('Event duplicated! 📋');
    }
    
    deleteEvent(eventId) {
        if (!confirm('Are you sure you want to delete this event?')) return;
        
        this.events = this.events.filter(e => e.id !== eventId);
        this.saveEvents();
        this.render();
        this.showToast('Event deleted! 🗑️');
    }
    
    // UI Functions
    filterEvents(theme) {
        const allCards = document.querySelectorAll('#eventsList .card');
        allCards.forEach(card => {
            if (theme === 'all') {
                card.style.display = 'block';
            } else {
                const event = this.events.find(e => e.title === card.querySelector('.card-title').textContent);
                if (event && event.theme === theme) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            }
        });
    }
    
    showDemo() {
        // Create a demo event
        const demoEvent = {
            id: 'demo-event',
            title: 'Summer Potluck Demo',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: '18:00',
            location: 'Central Park, NYC',
            description: 'Join us for an amazing summer potluck party! Bring your favorite dish and enjoy good company.',
            theme: 'potluck',
            rsvps: [
                { id: '1', name: 'John Doe', status: 'yes', notes: 'Bringing burgers!', createdAt: new Date().toISOString() },
                { id: '2', name: 'Jane Smith', status: 'yes', notes: 'I\'ll bring dessert', createdAt: new Date().toISOString() },
                { id: '3', name: 'Mike Johnson', status: 'maybe', notes: 'Will try to make it', createdAt: new Date().toISOString() }
            ],
            createdAt: new Date().toISOString(),
            createdBy: 'EventLink Demo'
        };
        
        // Add to events if not exists
        if (!this.events.find(e => e.id === 'demo-event')) {
            this.events.push(demoEvent);
            this.saveEvents();
        }
        
        this.showEvent('demo-event');
        this.showToast('Demo event loaded! 🎉');
    }
    
    toggleDarkMode() {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        document.getElementById('darkModeIcon').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        this.showToast(isDark ? 'Dark mode on! 🌙' : 'Light mode on! ☀️');
    }
    
    showToast(message, type = 'success') {
        const toastAlert = document.getElementById('toastAlert');
        const toastMessage = document.getElementById('toastMessage');
        
        toastAlert.className = `alert alert-${type}`;
        toastMessage.textContent = message;
        
        const toast = document.getElementById('toast');
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
    
    // Confetti on add! 🎊
    confetti() {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
        
        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }
        
        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();
            
            if (timeLeft <= 0) {
                return clearInterval(interval);
            }
            
            const particleCount = 50 * (timeLeft / duration);
            
            // Create particles in theme colors
            confetti(Object.assign({}, defaults, {
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#f97316']
            }));
            
            confetti(Object.assign({}, defaults, {
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#f97316']
            }));
        }, 250);
    }
    
    // Event Binding
    bindEvents() {
        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.handleRouting();
        });
        
        // Handle hash changes
        window.addEventListener('hashchange', () => {
            this.handleRouting();
        });
        
        // Auto-save on page unload
        window.addEventListener('beforeunload', () => {
            this.saveEvents();
        });
    }
}

// Initialize EventLink
const eventLink = new EventLink();

// Global functions for onclick handlers
window.showCreateEvent = () => eventLink.showCreateEvent();
window.hideCreateEvent = () => eventLink.hideCreateEvent();
window.createEvent = (e) => eventLink.createEvent(e);
window.submitRSVP = (e) => eventLink.submitRSVP(e);
window.showDashboard = () => eventLink.showDashboard();
window.copyEventLink = () => eventLink.copyEventLink();
window.shareOnWhatsApp = () => eventLink.shareOnWhatsApp();
window.shareOnTwitter = () => eventLink.shareOnTwitter();
window.showQRCode = () => eventLink.showQRCode();
window.downloadQR = () => eventLink.downloadQR();
window.exportGuests = () => eventLink.exportGuests();
window.filterEvents = (theme) => eventLink.filterEvents(theme);
window.showDemo = () => eventLink.showDemo();
window.toggleDarkMode = () => eventLink.toggleDarkMode();

// Make eventLink globally available for share/delete functions
window.eventLink = eventLink;

// PWA Service Worker (optional)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('data:text/javascript,self.addEventListener%28%27fetch%27%2C%20event%20%3D%3E%20event.respondWith%28fetch%28event.request%29%29%29%3B')
        .then(() => console.log('PWA ready'))
        .catch(() => console.log('PWA not available'));
}

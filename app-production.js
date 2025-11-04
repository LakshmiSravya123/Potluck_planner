// app-production.js - Production-ready app with local storage fallback
// This version works without Firebase for demo purposes

class PotluckPlanner {
    constructor() {
        this.currentEvent = null;
        this.currentView = 'dashboard';
        this.events = {};
        this.guests = {};
        this.rsvpChart = null;
        
        this.init();
    }
    
    async init() {
        this.bindEvents();
        this.setupFormValidation();
        await this.loadDashboard();
        this.handleRouting();
        
        // Show onboarding for first-time users
        if (!localStorage.getItem('potluckOnboardingShown')) {
            setTimeout(() => this.showHowItWorks(), 1000);
            localStorage.setItem('potluckOnboardingShown', 'true');
        }
    }
    
    // View Management
    showDashboard() {
        this.currentView = 'dashboard';
        document.getElementById('dashboardView').classList.remove('hidden');
        document.getElementById('eventView').classList.add('hidden');
        window.location.hash = '';
        this.loadDashboard();
    }
    
    async showEvent(eventId) {
        this.showLoading(true);
        this.currentView = 'event';
        
        try {
            const eventData = window.db.getEvent(eventId);
            if (!eventData) {
                this.showToast('Event not found', 'error', 'The event you\'re looking for doesn\'t exist or has been removed.');
                this.showDashboard();
                return;
            }
            
            this.currentEvent = { ...eventData, id: eventId };
            document.getElementById('dashboardView').classList.add('hidden');
            document.getElementById('eventView').classList.remove('hidden');
            window.location.hash = eventId;
            
            this.renderEvent();
            this.loadGuests();
            
        } catch (error) {
            console.error('Error loading event:', error);
            this.showToast('Error loading event', 'error', 'Please try again later.');
            this.showDashboard();
        } finally {
            this.showLoading(false);
        }
    }
    
    // Event Creation
    showCreateEventModal() {
        document.getElementById('createEventModal').classList.remove('hidden');
        document.getElementById('createEventModal').classList.add('flex');
        
        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('eventDate').value = tomorrow.toISOString().split('T')[0];
        
        // Focus first input
        setTimeout(() => {
            document.getElementById('eventName').focus();
        }, 100);
    }
    
    hideCreateEventModal() {
        document.getElementById('createEventModal').classList.add('hidden');
        document.getElementById('createEventModal').classList.remove('flex');
        document.getElementById('createEventForm').reset();
        this.clearValidationErrors('createEventForm');
    }
    
    async handleCreateEvent(event) {
        event.preventDefault();
        
        if (!this.validateCreateEventForm()) {
            return;
        }
        
        this.showLoading(true);
        const submitBtn = event.target.querySelector('button[type="submit"]');
        this.setButtonLoading(submitBtn, true);
        
        try {
            const formData = new FormData(event.target);
            const slotsText = formData.get('eventSlots').trim();
            const slots = slotsText ? slotsText.split('\n').filter(s => s.trim()) : ['Appetizers', 'Main Dish', 'Side Dish', 'Dessert', 'Drinks'];
            
            const eventData = {
                eventName: formData.get('eventName').trim(),
                hostName: formData.get('hostName').trim(),
                date: formData.get('eventDate'),
                time: formData.get('eventTime'),
                location: formData.get('eventLocation').trim(),
                theme: formData.get('eventTheme').trim() || 'Community Gathering',
                slots: slots,
                stats: {
                    total: 0,
                    confirmed: 0,
                    maybe: 0,
                    declined: 0,
                    pending: 0
                }
            };
            
            const eventId = window.db.createEvent(eventData);
            
            this.hideCreateEventModal();
            this.showToast('Event created successfully!', 'success', `${eventData.eventName} is ready for guests.`);
            
            // Show the event
            await this.showEvent(eventId);
            
        } catch (error) {
            console.error('Error creating event:', error);
            this.showToast('Error creating event', 'error', error.message || 'Please try again.');
        } finally {
            this.showLoading(false);
            this.setButtonLoading(submitBtn, false);
        }
    }
    
    // RSVP Handling
    async handleRSVPSubmit(event) {
        event.preventDefault();
        
        if (!this.validateRSVPForm()) {
            return;
        }
        
        const submitBtn = document.getElementById('submitRSVPBtn');
        this.setButtonLoading(submitBtn, true);
        
        try {
            const formData = new FormData(event.target);
            const rsvpData = {
                name: formData.get('guestName').trim(),
                email: formData.get('guestEmail').trim(),
                phone: formData.get('guestPhone').trim(),
                status: formData.get('rsvpStatus'),
                bringing: formData.get('bringingSlot'),
                dietaryRestrictions: formData.get('dietaryRestrictions').trim(),
                notes: formData.get('guestNotes').trim()
            };
            
            // Check for duplicate email
            if (rsvpData.email) {
                const existingGuest = this.checkDuplicateEmail(rsvpData.email);
                if (existingGuest) {
                    throw new Error('An RSVP with this email already exists for this event');
                }
            }
            
            window.db.addGuest(this.currentEvent.id, rsvpData);
            
            // Show success message
            this.showToast('🎉 RSVP received! Thank you!', 'success', 
                `Your response for ${this.currentEvent.eventName} has been recorded.`);
            
            // Reset form with visual confirmation
            this.resetRSVPForm();
            
            // Update the guest list
            await this.loadGuests();
            
        } catch (error) {
            console.error('Error submitting RSVP:', error);
            this.showToast('RSVP submission failed', 'error', error.message || 'Please try again.');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }
    
    checkDuplicateEmail(email) {
        if (!email || !this.currentEvent || !this.currentEvent.guests) return null;
        
        return Object.values(this.currentEvent.guests).find(guest => 
            guest.email && guest.email.toLowerCase() === email.toLowerCase()
        );
    }
    
    resetRSVPForm() {
        const form = document.getElementById('rsvpForm');
        form.reset();
        this.clearValidationErrors('rsvpForm');
        
        // Visual confirmation that form was reset
        form.classList.add('animate-pulse');
        setTimeout(() => {
            form.classList.remove('animate-pulse');
        }, 1000);
        
        // Focus first input
        document.getElementById('guestName').focus();
    }
    
    // Rendering Functions
    async loadDashboard() {
        try {
            this.showLoading(true);
            this.events = window.db.getEvents();
            this.renderEventsList();
            this.updateDashboardStats();
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showToast('Error loading dashboard', 'error', 'Please refresh the page.');
        } finally {
            this.showLoading(false);
        }
    }
    
    renderEventsList() {
        const eventsList = document.getElementById('eventsList');
        const noEvents = document.getElementById('noEvents');
        
        const eventArray = Object.entries(this.events).map(([id, event]) => ({ id, ...event }));
        
        if (eventArray.length === 0) {
            eventsList.innerHTML = '';
            noEvents.style.display = 'block';
            return;
        }
        
        noEvents.style.display = 'none';
        
        eventsList.innerHTML = eventArray.map(event => {
            const eventDate = new Date(`${event.date}T${event.time}`);
            const isPast = eventDate < new Date();
            const isToday = this.isToday(eventDate);
            
            return `
                <div class="bg-white border border-gray-200 rounded-xl p-6 card-hover ${isPast ? 'opacity-60' : ''}">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-800 mb-2">${event.eventName}</h4>
                            <p class="text-sm text-gray-600 mb-1">
                                📅 ${this.formatDate(event.date)} at ${event.time}
                            </p>
                            <p class="text-sm text-gray-600 mb-1">
                                📍 ${event.location}
                            </p>
                            <p class="text-sm text-gray-600">
                                👤 Hosted by ${event.hostName}
                            </p>
                        </div>
                        ${isToday ? '<span class="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">Today</span>' : ''}
                        ${isPast ? '<span class="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">Past</span>' : ''}
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <div class="flex gap-2 text-sm">
                            <span class="text-green-600">
                                ✅ ${event.stats?.confirmed || 0} going
                            </span>
                            <span class="text-gray-500">
                                👥 ${event.stats?.total || 0} total
                            </span>
                        </div>
                        <button 
                            onclick="potluckPlanner.showEvent('${event.id}')"
                            class="text-orange-500 hover:text-orange-600 font-medium text-sm">
                            View Event →
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    renderEvent() {
        this.renderEventHeader();
        this.populateSlotOptions();
        this.loadGuests();
    }
    
    renderEventHeader() {
        const header = document.getElementById('eventHeader');
        const eventDate = new Date(`${this.currentEvent.date}T${this.currentEvent.time}`);
        
        header.innerHTML = `
            <div class="text-center">
                <h2 class="text-3xl font-bold text-gray-800 mb-4">${this.currentEvent.eventName}</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-600">
                    <div>
                        📅 <span class="font-medium">${this.formatDate(this.currentEvent.date)}</span>
                    </div>
                    <div>
                        🕐 <span class="font-medium">${this.currentEvent.time}</span>
                    </div>
                    <div>
                        📍 <span class="font-medium">${this.currentEvent.location}</span>
                    </div>
                </div>
                ${this.currentEvent.theme ? `
                    <div class="mt-4">
                        <span class="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm">
                            🎨 ${this.currentEvent.theme}
                        </span>
                    </div>
                ` : ''}
                <div class="mt-6">
                    <p class="text-gray-600">
                        👤 Hosted by <span class="font-medium">${this.currentEvent.hostName}</span>
                    </p>
                </div>
            </div>
        `;
    }
    
    populateSlotOptions() {
        const slotSelect = document.getElementById('bringingSlot');
        const slots = this.currentEvent.slots || [];
        
        slotSelect.innerHTML = '<option value="">Select an item</option>' + 
            slots.map(slot => `<option value="${slot}">${slot}</option>`).join('');
    }
    
    async loadGuests() {
        try {
            const event = window.db.getEvent(this.currentEvent.id);
            this.guests = event.guests || {};
            this.renderGuests();
            this.updateGuestCounts();
            this.updateRSVPChart();
        } catch (error) {
            console.error('Error loading guests:', error);
        }
    }
    
    renderGuests() {
        const guestsList = document.getElementById('guestsList');
        const noGuests = document.getElementById('noGuests');
        
        const guestArray = Object.entries(this.guests).map(([id, guest]) => ({ id, ...guest }));
        
        if (guestArray.length === 0) {
            guestsList.innerHTML = '';
            noGuests.style.display = 'block';
            return;
        }
        
        noGuests.style.display = 'none';
        
        guestsList.innerHTML = guestArray.map(guest => {
            const statusConfig = {
                confirmed: { color: 'green', icon: '✅', text: 'Going' },
                maybe: { color: 'yellow', icon: '🤔', text: 'Maybe' },
                declined: { color: 'red', icon: '❌', text: 'Not Going' }
            };
            
            const status = statusConfig[guest.status] || statusConfig.pending;
            const avatar = this.getAvatar(guest.name);
            
            return `
                <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg animate-slide-up">
                    <div class="avatar" style="background: ${avatar.color}">
                        ${avatar.initials}
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-semibold text-gray-800">${guest.name}</span>
                            <span class="badge badge-${status.color}">
                                ${status.icon} ${status.text}
                            </span>
                        </div>
                        ${guest.email ? `<p class="text-sm text-gray-600">${guest.email}</p>` : ''}
                        ${guest.bringing ? `<p class="text-sm text-gray-600">🍴 Bringing: ${guest.bringing}</p>` : ''}
                        ${guest.dietaryRestrictions ? `<p class="text-sm text-orange-600">⚠️ ${guest.dietaryRestrictions}</p>` : ''}
                        ${guest.notes ? `<p class="text-sm text-gray-500 italic">${guest.notes}</p>` : ''}
                    </div>
                    <div class="text-xs text-gray-400">
                        ${this.formatDate(guest.createdAt)}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    updateGuestCounts() {
        const counts = {
            confirmed: 0,
            maybe: 0,
            declined: 0
        };
        
        Object.values(this.guests).forEach(guest => {
            if (counts.hasOwnProperty(guest.status)) {
                counts[guest.status]++;
            }
        });
        
        document.getElementById('confirmedCount').textContent = counts.confirmed;
        document.getElementById('maybeCount').textContent = counts.maybe;
        document.getElementById('declinedCount').textContent = counts.declined;
        
        // Update event stats
        if (this.currentEvent) {
            this.currentEvent.stats = {
                total: Object.keys(this.guests).length,
                confirmed: counts.confirmed,
                maybe: counts.maybe,
                declined: counts.declined,
                pending: 0
            };
            window.db.updateEvent(this.currentEvent.id, { stats: this.currentEvent.stats });
        }
    }
    
    updateRSVPChart() {
        const ctx = document.getElementById('rsvpChart').getContext('2d');
        
        const counts = {
            confirmed: 0,
            maybe: 0,
            declined: 0
        };
        
        Object.values(this.guests).forEach(guest => {
            if (counts.hasOwnProperty(guest.status)) {
                counts[guest.status]++;
            }
        });
        
        if (this.rsvpChart) {
            this.rsvpChart.destroy();
        }
        
        this.rsvpChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Going', 'Maybe', 'Not Going'],
                datasets: [{
                    data: [counts.confirmed, counts.maybe, counts.declined],
                    backgroundColor: [
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(250, 204, 21, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderColor: [
                        'rgba(34, 197, 94, 1)',
                        'rgba(250, 204, 21, 1)',
                        'rgba(239, 68, 68, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    title: {
                        display: true,
                        text: 'RSVP Breakdown'
                    }
                }
            }
        });
    }
    
    updateDashboardStats() {
        const stats = {
            totalEvents: Object.keys(this.events).length,
            totalGuests: 0,
            confirmedRSVPs: 0,
            activeEvents: 0
        };
        
        Object.values(this.events).forEach(event => {
            if (event.stats) {
                stats.totalGuests += event.stats.total || 0;
                stats.confirmedRSVPs += event.stats.confirmed || 0;
            }
            
            const eventDate = new Date(`${event.date}T${event.time}`);
            if (eventDate >= new Date()) {
                stats.activeEvents++;
            }
        });
        
        document.getElementById('totalEvents').textContent = stats.totalEvents;
        document.getElementById('totalGuests').textContent = stats.totalGuests;
        document.getElementById('confirmedRSVPs').textContent = stats.confirmedRSVPs;
        document.getElementById('activeEvents').textContent = stats.activeEvents;
    }
    
    // Form Validation
    setupFormValidation() {
        // Real-time validation
        const inputs = document.querySelectorAll('input[required], select[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }
    
    validateField(field) {
        const value = field.value.trim();
        const errorElement = document.getElementById(`${field.name}Error`);
        
        if (!value && field.hasAttribute('required')) {
            this.showFieldError(field, 'This field is required');
            return false;
        }
        
        if (field.type === 'email' && value && !this.validateEmail(value)) {
            this.showFieldError(field, 'Please enter a valid email address');
            return false;
        }
        
        this.clearFieldError(field);
        return true;
    }
    
    showFieldError(field, message) {
        const errorElement = document.getElementById(`${field.name}Error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
        field.classList.add('error');
        field.setAttribute('aria-invalid', 'true');
    }
    
    clearFieldError(field) {
        const errorElement = document.getElementById(`${field.name}Error`);
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
        field.classList.remove('error');
        field.setAttribute('aria-invalid', 'false');
    }
    
    clearValidationErrors(formId) {
        const form = document.getElementById(formId);
        const errors = form.querySelectorAll('[id$="Error"]');
        const fields = form.querySelectorAll('.error');
        
        errors.forEach(error => error.classList.add('hidden'));
        fields.forEach(field => field.classList.remove('error'));
    }
    
    validateCreateEventForm() {
        const form = document.getElementById('createEventForm');
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        if (!isValid) {
            this.showToast('Please fill in all required fields', 'error', 'Check the form for errors.');
        }
        
        return isValid;
    }
    
    validateRSVPForm() {
        const form = document.getElementById('rsvpForm');
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        if (!isValid) {
            this.showToast('Please fill in all required fields', 'error', 'Check the form for errors.');
            return false;
        }
        
        // Additional validation
        const email = document.getElementById('guestEmail').value.trim();
        const status = document.getElementById('rsvpStatus').value;
        
        if (!this.validateEmail(email)) {
            this.showToast('Invalid email', 'error', 'Please enter a valid email address.');
            return false;
        }
        
        if (!status) {
            this.showToast('RSVP status required', 'error', 'Please select your RSVP status.');
            return false;
        }
        
        return true;
    }
    
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Sharing Functions
    copyEventLink() {
        const url = `${window.location.origin}${window.location.pathname}#${this.currentEvent.id}`;
        navigator.clipboard.writeText(url).then(() => {
            this.showToast('Link copied!', 'success', 'Event link has been copied to your clipboard.');
        }).catch(() => {
            this.showToast('Copy failed', 'error', 'Could not copy link. Please copy manually.');
        });
    }
    
    shareOnWhatsApp() {
        const url = `${window.location.origin}${window.location.pathname}#${this.currentEvent.id}`;
        const text = `Join ${this.currentEvent.eventName}! 🎉\n\n📅 ${this.formatDate(this.currentEvent.date)} at ${this.currentEvent.time}\n📍 ${this.currentEvent.location}\n\nRSVP here: ${url}`;
        
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
    
    shareOnTwitter() {
        const url = `${window.location.origin}${window.location.pathname}#${this.currentEvent.id}`;
        const text = `Join ${this.currentEvent.eventName}! 🎉 ${this.formatDate(this.currentEvent.date)} at ${this.currentEvent.time}`;
        
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    }
    
    generateQRCode() {
        // For demo purposes, show the URL
        const url = `${window.location.origin}${window.location.pathname}#${this.currentEvent.id}`;
        this.showToast('QR Code URL', 'info', `QR Code URL: ${url}`);
    }
    
    exportGuestList() {
        const guests = Object.entries(this.guests).map(([id, guest]) => ({
            Name: guest.name,
            Email: guest.email || '',
            Phone: guest.phone || '',
            Status: guest.status,
            Bringing: guest.bringing || '',
            'Dietary Restrictions': guest.dietaryRestrictions || '',
            Notes: guest.notes || '',
            'RSVP Date': this.formatDate(guest.createdAt)
        }));
        
        const csv = this.convertToCSV(guests);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentEvent.eventName.replace(/[^a-z0-9]/gi, '_')}_guests.csv`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showToast('Guest list exported!', 'success', 'CSV file has been downloaded.');
    }
    
    convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');
        const csvRows = data.map(row => 
            headers.map(header => `"${row[header] || ''}"`).join(',')
        );
        
        return [csvHeaders, ...csvRows].join('\n');
    }
    
    // UI Helper Functions
    showHowItWorks() {
        document.getElementById('howItWorksModal').classList.remove('hidden');
        document.getElementById('howItWorksModal').classList.add('flex');
    }
    
    hideHowItWorks() {
        document.getElementById('howItWorksModal').classList.add('hidden');
        document.getElementById('howItWorksModal').classList.remove('flex');
    }
    
    showToast(message, type = 'info', description = '') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        const toastDescription = document.getElementById('toastDescription');
        const toastIcon = document.getElementById('toastIcon');
        
        const icons = {
            success: '<span class="text-green-500 text-xl">✅</span>',
            error: '<span class="text-red-500 text-xl">❌</span>',
            info: '<span class="text-blue-500 text-xl">ℹ️</span>'
        };
        
        toastIcon.innerHTML = icons[type] || icons.info;
        toastMessage.textContent = message;
        toastDescription.textContent = description;
        
        toast.classList.remove('hidden');
        toast.classList.add('animate-slide-up');
        
        setTimeout(() => {
            toast.classList.add('hidden');
            toast.classList.remove('animate-slide-up');
        }, 5000);
    }
    
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
    
    setButtonLoading(button, loading) {
        if (loading) {
            button.disabled = true;
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = '<span class="icon-spinner animate-spin"></span>Loading...';
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText || button.innerHTML;
        }
    }
    
    // Utility Functions
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }
    
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }
    
    getAvatar(name) {
        const colors = ['#f97316', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const color = colors[name.length % colors.length];
        return { initials, color };
    }
    
    handleRouting() {
        const hash = window.location.hash.slice(1);
        if (hash) {
            this.showEvent(hash);
        } else {
            this.showDashboard();
        }
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
        
        // Close modals on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideCreateEventModal();
                this.hideHowItWorks();
            }
        });
        
        // Close modals on background click
        document.getElementById('createEventModal').addEventListener('click', (e) => {
            if (e.target.id === 'createEventModal') {
                this.hideCreateEventModal();
            }
        });
        
        document.getElementById('howItWorksModal').addEventListener('click', (e) => {
            if (e.target.id === 'howItWorksModal') {
                this.hideHowItWorks();
            }
        });
    }
}

// Initialize the application
const potluckPlanner = new PotluckPlanner();

// Global functions for onclick handlers
window.showDashboard = () => potluckPlanner.showDashboard();
window.showCreateEventModal = () => potluckPlanner.showCreateEventModal();
window.hideCreateEventModal = () => potluckPlanner.hideCreateEventModal();
window.handleCreateEvent = (e) => potluckPlanner.handleCreateEvent(e);
window.handleRSVPSubmit = (e) => potluckPlanner.handleRSVPSubmit(e);
window.resetRSVPForm = () => potluckPlanner.resetRSVPForm();
window.copyEventLink = () => potluckPlanner.copyEventLink();
window.shareOnWhatsApp = () => potluckPlanner.shareOnWhatsApp();
window.shareOnTwitter = () => potluckPlanner.shareOnTwitter();
window.generateQRCode = () => potluckPlanner.generateQRCode();
window.exportGuestList = () => potluckPlanner.exportGuestList();
window.showHowItWorks = () => potluckPlanner.showHowItWorks();
window.hideHowItWorks = () => potluckPlanner.hideHowItWorks();

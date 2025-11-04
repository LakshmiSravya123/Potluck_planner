# 🦃 Thanksgiving Potluck Planner - Implementation Plan

## Status: Ready for Implementation

This document outlines the step-by-step implementation of all requested features for the enhanced Thanksgiving Potluck Planner.

## ✅ HIGH PRIORITY FEATURES (Implement First)

### 1. Add "Serves" Column
**Location**: Add to table and modal form
```html
<!-- In modal form -->
<div>
    <label>Serves (people)</label>
    <input type="number" id="guestServes" min="1" placeholder="How many people?">
</div>

<!-- In table -->
<th>Serves</th>
<td>${guest.serves || 'Not specified'}</td>
```

**Data Model Update**:
```javascript
{
    id, name, dish, category,
    serves: number | null,  // NEW
    notes, confirmed, createdAt, updatedAt
}
```

### 2. Add Notes/Dietary Info Column
**Implementation**: Tooltip icon approach
```html
<!-- In table -->
<td>
    ${guest.notes ? `
        <div class="tooltip">
            <span class="cursor-help">ℹ️</span>
            <span class="tooltiptext">${guest.notes}</span>
        </div>
    ` : '-'}
</td>
```

**CSS for Tooltip**:
```css
.tooltip { position: relative; }
.tooltip .tooltiptext {
    visibility: hidden;
    width: 200px;
    background: #1f2937;
    color: white;
    padding: 8px;
    border-radius: 8px;
    position: absolute;
    z-index: 1000;
    bottom: 125%;
    left: 50%;
    margin-left: -100px;
}
.tooltip:hover .tooltiptext { visibility: visible; }
```

### 3. Search/Filter Bar
**Implementation**:
```javascript
function filterGuests() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const filtered = guests.filter(g => 
        g.name.toLowerCase().includes(search) ||
        g.dish.toLowerCase().includes(search) ||
        (g.notes && g.notes.toLowerCase().includes(search))
    );
    
    // Show results count
    document.getElementById('searchResults').textContent = 
        `${filtered.length} result${filtered.length !== 1 ? 's' : ''} found`;
    
    renderGuests(filtered);
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    filterGuests();
}
```

### 4. Inline Editing
**Implementation**:
```javascript
function makeEditable(id, field, value) {
    const cell = event.target;
    const originalValue = value;
    
    cell.innerHTML = `
        <input type="text" value="${value}" 
            class="px-2 py-1 border rounded"
            onblur="saveInlineEdit(${id}, '${field}', this.value, '${originalValue}')"
            onkeydown="if(event.key==='Enter') this.blur(); if(event.key==='Escape') cancelInlineEdit(this, '${originalValue}')">
    `;
    cell.querySelector('input').focus();
}

function saveInlineEdit(id, field, newValue, oldValue) {
    if (newValue === oldValue) return;
    
    const guest = guests.find(g => g.id === id);
    guest[field] = newValue;
    guest.updatedAt = Date.now();
    saveData();
    render();
    showToast(`${field} updated!`, 'success');
}
```

**HTML for Editable Cells**:
```html
<td class="editable" onclick="makeEditable(${guest.id}, 'name', '${guest.name}')">
    ${guest.name}
</td>
```

### 5. Category Selector
**Already Implemented** - Just needs integration with:
- Category-based pill colors
- Dashboard category breakdown

```javascript
function getCategoryClass(category) {
    return `category-${category}`;
}

// In render:
<span class="category-badge ${getCategoryClass(guest.category)}">
    ${categoryIcons[guest.category]} ${guest.category}
</span>
```

## ⚙️ MEDIUM PRIORITY FEATURES

### 6. Keyboard Shortcuts
```javascript
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + N: New guest
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            showAddModal();
        }
        
        // Escape: Close modal
        if (e.key === 'Escape') {
            closeModal();
            closeQRModal();
            closeShortcutsModal();
        }
        
        // Ctrl/Cmd + K: Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
        
        // Ctrl/Cmd + Z: Undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            undoDelete();
        }
    });
}
```

### 7. Dark Mode Toggle
**Implementation**:
```javascript
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDarkMode);
    document.getElementById('darkModeIcon').textContent = isDarkMode ? '☀️' : '🌙';
}
```

**Tailwind Config**:
```javascript
tailwind.config = {
    darkMode: 'class',
    // ... rest of config
}
```

### 8. Improved QR Code
**Implementation**:
```html
<!-- Add CDN -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
```

```javascript
function showQRModal() {
    document.getElementById('qrModal').classList.remove('hidden');
    
    // Clear previous QR
    const qrDiv = document.getElementById('qrcode');
    qrDiv.innerHTML = '';
    
    // Generate new QR
    qrCodeInstance = new QRCode(qrDiv, {
        text: window.location.href,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
}

function downloadQR() {
    const canvas = document.querySelector('#qrcode canvas');
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'thanksgiving-potluck-qr.png';
    a.click();
}
```

### 9. Print-Friendly View
**CSS**:
```css
@media print {
    .no-print { display: none !important; }
    body { background: white !important; }
    .bg-theme::before { display: none; }
    table { page-break-inside: avoid; }
    tr { page-break-inside: avoid; }
    
    /* Add print header */
    @page {
        margin: 1cm;
    }
    
    thead { display: table-header-group; }
}
```

**Print Header**:
```html
<div class="print-only hidden">
    <h1>Thanksgiving Potluck 2025</h1>
    <p>Total Guests: <span id="printGuestCount"></span></p>
    <p>Date: <span id="printDate"></span></p>
</div>
```

### 10. Enhanced Dashboard Stats
```javascript
function updateDashboard() {
    const total = guests.length;
    const confirmed = guests.filter(g => g.confirmed).length;
    const categories = {};
    
    guests.forEach(g => {
        categories[g.category] = (categories[g.category] || 0) + 1;
    });
    
    // Render dashboard cards
    document.getElementById('dashboard').innerHTML = `
        <div class="stat-card">
            <span class="text-5xl">👥</span>
            <p class="text-4xl font-bold">${total}</p>
            <p class="text-sm">Total Guests</p>
        </div>
        <div class="stat-card">
            <span class="text-5xl">✅</span>
            <p class="text-4xl font-bold">${confirmed}</p>
            <p class="text-sm">Confirmed</p>
        </div>
        <!-- More stats -->
    `;
    
    // Category breakdown
    renderCategoryBreakdown(categories);
    
    // Missing categories alert
    checkMissingCategories(categories);
}

function checkMissingCategories(categories) {
    const required = ['mains', 'sides', 'desserts'];
    const missing = required.filter(cat => !categories[cat]);
    
    if (missing.length > 0) {
        document.getElementById('missingAlert').classList.remove('hidden');
        document.getElementById('missingText').textContent = 
            `We're missing: ${missing.map(c => categoryIcons[c] + ' ' + c).join(', ')}`;
    } else {
        document.getElementById('missingAlert').classList.add('hidden');
    }
}
```

## 🎨 NICE TO HAVE FEATURES

### 11. Auto-complete Suggestions
**Already Implemented** via `<datalist>`:
```html
<input list="suggestedDishes">
<datalist id="suggestedDishes">
    <option value="🦃 Turkey">
    <option value="🥔 Mashed Potatoes">
    <!-- etc -->
</datalist>
```

### 12. Undo Functionality
```javascript
let deletedGuests = [];

function deleteGuest(id) {
    const guest = guests.find(g => g.id === id);
    if (!confirm(`Remove ${guest.name}?`)) return;
    
    // Store for undo
    deletedGuests.push({guest, timestamp: Date.now()});
    
    guests = guests.filter(g => g.id !== id);
    saveData();
    render();
    showToast('Guest removed. Press Ctrl+Z to undo', 'info');
}

function undoDelete() {
    if (deletedGuests.length === 0) {
        showToast('Nothing to undo', 'info');
        return;
    }
    
    const {guest} = deletedGuests.pop();
    guests.push(guest);
    saveData();
    render();
    showToast('Undo successful!', 'success');
}
```

### 13. Confirmed Status
```javascript
function toggleConfirmed(id) {
    const guest = guests.find(g => g.id === id);
    guest.confirmed = !guest.confirmed;
    saveData();
    render();
    showToast(guest.confirmed ? 'Confirmed!' : 'Unconfirmed', 'success');
}
```

**In Table**:
```html
<td>
    <input type="checkbox" 
        ${guest.confirmed ? 'checked' : ''}
        onchange="toggleConfirmed(${guest.id})"
        class="w-5 h-5 cursor-pointer">
</td>
```

## 📦 COMPLETE DATA MODEL

```javascript
{
    id: "timestamp-string",
    name: "John Doe",
    dish: "Pumpkin Pie",
    category: "desserts",  // appetizers|mains|sides|desserts|drinks|other
    serves: 8,             // number or null
    notes: "Gluten-free",  // string or null
    confirmed: true,       // boolean
    createdAt: 1699000000,
    updatedAt: 1699000000
}
```

## 🚀 DEPLOYMENT CHECKLIST

- [ ] All features implemented
- [ ] Mobile responsive tested
- [ ] Dark mode works with all themes
- [ ] Print view tested
- [ ] Keyboard shortcuts working
- [ ] localStorage persistence verified
- [ ] QR code generation working
- [ ] Search/filter functional
- [ ] Inline editing smooth
- [ ] Toast notifications clear
- [ ] Accessibility (ARIA labels) added
- [ ] Code commented
- [ ] Git committed and pushed

## 📝 TESTING CHECKLIST

- [ ] Add guest with all fields
- [ ] Edit guest inline
- [ ] Delete and undo
- [ ] Search guests
- [ ] Toggle dark mode
- [ ] Switch themes
- [ ] Generate QR code
- [ ] Export CSV
- [ ] Print view
- [ ] Keyboard shortcuts
- [ ] Mobile view
- [ ] Data persistence (refresh page)

---

**Next Steps**: Implement features in priority order, test thoroughly, then deploy to GitHub Pages.

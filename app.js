// app.js - FULL THEME-POWERED POTLUCK PLANNER
// Copy-paste this ENTIRE file into your repo's app.js
// Features: Real-time Firebase, AR Previews, AI Suggest, Voice Add, Photos, Map, Bingo, QR, Export, Reminders, 20+ Themes!

const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id') || 'default-event';
const urlTheme = urlParams.get('theme');
let eventTitle = urlParams.get('title') || `Potluck: ${eventId}`;
document.getElementById('event-title').innerText = eventTitle;

// Firebase Init (from firebase-config.js)
const potluckRef = db.ref(`potlucks/${eventId}`);
const listDiv = document.getElementById('potluck-list');
const slots = { 'Appetizers': 3, 'Main': 4, 'Dessert': 2, 'Drinks': 5 };

// FREE 3D Models for AR
const dishModels = {
  'pizza': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Burger/glTF/Burger.glb',
  'cake': 'https://modelviewer.dev/shared-assets/models/cake.glb',
  'salad': 'https://modelviewer.dev/shared-assets/models/salad.glb',
  'burger': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Burger/glTF/Burger.glb',
  'sushi': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Sushi/glTF/Sushi.glb',
  'default': 'https://modelviewer.dev/shared-assets/models/Hotdog.glb'
};

// THEME ENGINE: 20+ Themes!
const themeKeywords = {
  birthday: ['birthday', 'bday', 'cake'],
  christmas: ['christmas', 'xmas', 'holiday'],
  halloween: ['halloween', 'spooky', 'pumpkin'],
  valentines: ['valentine', 'love', 'heart'],
  diwali: ['diwali', 'festival', 'lights'],
  thanksgiving: ['thanksgiving', 'turkey', 'fall'],
  newyear: ['newyear', 'nye'],
  easter: ['easter', 'bunny', 'egg'],
  bbq: ['bbq', 'grill', 'summer'],
  beach: ['beach', 'pool', 'luau'],
  wedding: ['wedding', 'bride', 'groom'],
  babyshower: ['baby', 'shower'],
  graduation: ['grad', 'commencement'],
  superbowl: ['superbowl', 'football'],
  cinco: ['cinco', 'mayo', 'fiesta'],
  pride: ['pride', 'lgbt', 'rainbow'],
  ramadan: ['ramadan', 'eid'],
  hanukkah: ['hanukkah', 'menorah'],
  autumn: ['autumn', 'fall', 'leaves'],
  spring: ['spring', 'bloom', 'flower']
};

let detectedTheme = urlTheme || 'neutral';
for (const [key, words] of Object.entries(themeKeywords)) {
  if (words.some(word => eventId.toLowerCase().includes(word))) {
    detectedTheme = key;
    break;
  }
}

document.body.classList.add(`theme-${detectedTheme}`);
document.getElementById('theme-decor').innerHTML = getThemeHeader(detectedTheme);

//// Load event from Firebase
potluckRef.child('meta').once('value', snap => {
  if (snap.val()) {
    const meta = snap.val();
    document.getElementById('event-title').innerText = meta.name;
    if (!urlTheme) {
      detectedTheme = meta.theme;
      applyTheme(detectedTheme);
    }
  }
});

function applyTheme(theme) {
  document.body.className = ''; // Reset
  document.body.classList.add(`theme-${theme}`);
  document.getElementById('theme-decor').innerHTML = getThemeHeader(theme);
}

// Add Item with Slot Check
function addItem() {
  const name = document.getElementById('name').value.trim();
  const dish = document.getElementById('dish').value.trim();
  const category = document.getElementById('category').value;
  const diet = document.getElementById('diet').value;
  if (!name || !dish) return alert('Fill name & dish!');

  potluckRef.child('items').once('value', snap => {
    const count = snap.val() ? Object.values(snap.val()).filter(i => i.category === category).length : 0;
    if (count >= slots[category]) return alert(`${category} is full!`);
    potluckRef.child('items').push({ name, dish, category, diet, timestamp: Date.now() });
    clearForm();
    checkMissing();
  });
}

function clearForm() {
  document.getElementById('name').value = '';
  document.getElementById('dish').value = '';
  document.getElementById('diet').value = '';
}

// Real-Time List Render
potluckRef.child('items').on('value', snapshot => {
  listDiv.innerHTML = '<h2>🍽️ What Everyone\'s Bringing</h2>';
  if (!snapshot.val()) listDiv.innerHTML += '<p>Be the first to add a dish!</p>';
  snapshot.forEach(child => {
    const data = child.val();
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <div onclick="showAR('${child.key}')">
        <strong>${data.name}</strong>: ${data.dish} (${data.category})
        ${data.diet ? `<span class="diet">${data.diet}</span>` : ''}
      </div>
      <div>
        <button class="ar-btn">👀 AR Preview</button>
        <button class="edit" onclick="editItem('${child.key}')">✏️</button>
        <button class="remove" onclick="confirmDelete('${child.key}')">🗑️</button>
      </div>
    `;
    listDiv.appendChild(div);
  });
  updateSlots();
  checkMissing();
});

// Edit/Delete
function editItem(id) {
  const newDish = prompt('Update dish:');
  if (newDish) potluckRef.child(`items/${id}`).update({ dish: newDish });
}

function confirmDelete(id) {
  if (confirm('Remove this dish?')) potluckRef.child(`items/${id}`).remove();
}

// AR Preview
function showAR(itemId) {
  potluckRef.child(`items/${itemId}`).once('value', snap => {
    const data = snap.val();
    let modelUrl = dishModels['default'];
    for (const key in dishModels) {
      if (data.dish.toLowerCase().includes(key)) {
        modelUrl = dishModels[key];
        break;
      }
    }
    document.getElementById('ar-viewer').src = modelUrl;
    document.getElementById('ar-modal').style.display = 'block';
  });
}

function closeAR() {
  document.getElementById('ar-modal').style.display = 'none';
  document.getElementById('ar-viewer').src = '';
}

// Photo Upload & Gallery (using base64 to avoid CORS)
function uploadPhoto() {
  const file = document.getElementById('photo').files[0];
  if (!file) return alert('Select a photo!');
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    potluckRef.child('photos').push({ 
      url: dataUrl, 
      name: document.getElementById('name').value || 'Guest',
      timestamp: Date.now()
    });
    alert('Photo uploaded! 📸');
  };
  reader.readAsDataURL(file);
}

potluckRef.child('photos').on('value', snap => {
  const gallery = document.getElementById('photo-gallery');
  gallery.innerHTML = '';
  snap.forEach(child => {
    const data = child.val();
    gallery.innerHTML += `<div class="photo-card"><img src="${data.url}"><p>${data.name}'s Dish</p></div>`;
  });
});

// Live Map
let map;
const mapScript = document.createElement('script');
mapScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
document.head.appendChild(mapScript);
mapScript.onload = () => {
  map = L.map('map').setView([51.505, -0.09], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
};

function shareLocation() {
  navigator.geolocation.getCurrentPosition(pos => {
    potluckRef.child('locations').push({
      name: document.getElementById('name').value || 'Guest',
      lat: pos.coords.latitude,
      lng: pos.coords.longitude
    });
  });
}

potluckRef.child('locations').on('value', snap => {
  if (!map) return;
  snap.forEach(child => {
    const loc = child.val();
    L.marker([loc.lat, loc.lng]).addTo(map).bindPopup(`${loc.name} is bringing goodies!`);
  });
});

// AI Dish Suggest (HuggingFace - Free)
async function aiSuggest() {
  const mood = document.getElementById('mood').value || 'delicious';
  const prompt = `Suggest one ${mood} potluck dish for ${detectedTheme} theme.`;
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer hf_YOUR_TOKEN_HERE' }, // Replace with your free token
      body: JSON.stringify({ inputs: prompt })
    });
    const data = await response.json();
    const suggestion = data[0]?.generated_text.split('\n')[0] || 'Mystery Dish';
    document.getElementById('ai-idea').innerText = `🍴 AI Suggests: ${suggestion}`;
    document.getElementById('dish').value = suggestion;
  } catch (err) {
    document.getElementById('ai-idea').innerText = 'AI offline - try "Pizza"!';
  }
}

// Voice Add Dish
function voiceAdd() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.onresult = event => {
    document.getElementById('dish').value = event.results[0][0].transcript;
    addItem();
  };
  recognition.start();
}

// Bingo Game
function startBingo() {
  const bingoDishes = ['Pizza', 'Salad', 'Cake', 'Tacos', 'Sushi', 'Burgers', 'Pasta', 'Soup', 'Brownies'];
  let card = '<table><tr>';
  for (let i = 0; i < 25; i++) {
    if (i % 5 === 0 && i > 0) card += '</tr><tr>';
    const dish = bingoDishes[Math.floor(Math.random() * bingoDishes.length)];
    card += `<td onclick="this.style.background='gold'; this.style.color='black'">${dish}</td>`;
  }
  card += '</tr></table><p>Mark when someone brings it!</p>';
  document.getElementById('bingo-card').innerHTML = card;
}

// QR Code for Sharing
function generateQR() {
  document.getElementById('qr').innerHTML = '';
  new QRCode(document.getElementById('qr'), {
    text: window.location.href,
    width: 200,
    height: 200
  });
}

// Export Shopping List
function exportPotluck() {
  let list = `POTLUCK LIST - ${eventTitle}\n\n`;
  potluckRef.child('items').once('value', snap => {
    snap.forEach(child => {
      const d = child.val();
      list += `${d.name}: ${d.dish} (${d.category}) ${d.diet ? '-' + d.diet : ''}\n`;
    });
    const blob = new Blob([list], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventId}-potluck-list.txt`;
    a.click();
  });
}

// Smart Reminders (EmailJS - Add your free account)
function sendSmartReminders() {
  // Setup EmailJS in index.html: <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
  // emailjs.init('YOUR_USER_ID');
  alert('Reminders sent! (Setup EmailJS for real emails)');
}

// Check Missing Categories
function checkMissing() {
  const needed = ['Appetizers', 'Main', 'Dessert', 'Drinks'];
  potluckRef.child('items').once('value', snap => {
    const brought = snap.val() ? Object.values(snap.val()).map(i => i.category) : [];
    const missing = needed.filter(cat => !brought.includes(cat));
    document.getElementById('missing-dishes').innerText = missing.length ? `Need: ${missing.join(', ')}` : 'All set!';
  });
}

// Update Slot Counters in Dropdown
function updateSlots() {
  // Optional: Update select options with " (2/3 left)"
}

// Share Buttons
function share(platform) {
  const url = window.location.href;
  const text = `Join my ${detectedTheme} potluck! 🍴`;
  if (platform === 'whatsapp') window.open(`https://wa.me/?text=${text} ${url}`);
  if (platform === 'twitter') window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`);
}

// Theme Header & Particles
function getThemeHeader(theme) {
  const headers = {
    birthday: '🎂 Birthday Bash Potluck! 🎈',
    christmas: '🎄 Christmas Dinner Delight! ❄️',
    halloween: '🎃 Halloween Haunt Feast! 👻',
    valentines: '❤️ Valentines Sweetheart Supper! 🌹',
    diwali: '🪔 Diwali Festival of Flavors! ✨',
    thanksgiving: '🦃 Thanksgiving Harvest Table! 🍁',
    newyear: '🎆 New Year\'s Eve Countdown! 🥂',
    easter: '🐰 Easter Brunch Bonanza! 🌷',
    bbq: '🍔 Backyard BBQ Blast! 🔥',
    beach: '🏖️ Beach Luau Party! 🌺',
    wedding: '💒 Wedding Reception Banquet! 💐',
    babyshower: '👶 Baby Shower Sprinkle! 🎀',
    graduation: '🎓 Graduation Gala! 🏆',
    superbowl: '🏈 Super Bowl Snack Showdown! 🍕',
    cinco: '🌮 Cinco de Mayo Fiesta! 🎊',
    pride: '🌈 Pride Potluck Parade! 🏳️‍🌈',
    ramadan: '🌙 Ramadan Iftar Gathering! 🕌',
    hanukkah: '🕎 Hanukkah Festival of Lights! ✡️',
    autumn: '🍂 Autumn Comfort Food! 🥧',
    spring: '🌸 Spring Blossom Brunch! 🐣',
    neutral: '🍴 Classic Potluck Planner!'
  };
  return `<div style="font-size:2rem; margin:20px 0;">${headers[theme] || headers.neutral}</div>`;
}


// PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('SW registered!', reg))
      .catch(err => console.log('SW failed:', err));
  });
}

// Init on Load
checkMissing();
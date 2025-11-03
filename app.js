const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id') || 'default';
document.getElementById('event-title').innerText = `Event: ${eventId} - Share this link!`;
const potluckRef = db.ref(`potlucks/${eventId}`);
const listDiv = document.getElementById('potluck-list');

function addItem() {
  const name = document.getElementById('name').value.trim();
  const dish = document.getElementById('dish').value.trim();
  if (!name || !dish) return;
  potluckRef.child('items').push({ name, dish });
  document.getElementById('name').value = '';
  document.getElementById('dish').value = '';
}

potluckRef.child('items').on('value', snap => {
  listDiv.innerHTML = '<h2>🍽️ Bringing</h2>';
  snap.forEach(child => {
    const data = child.val();
    listDiv.innerHTML += `<div class="item"><strong>${data.name}</strong>: ${data.dish} <button class="ar-btn" onclick="showAR('${data.dish}')">AR</button></div>`;
  });
});

// AR Functions
function showAR(dish) {
  let model = 'https://modelviewer.dev/shared-assets/models/Hotdog.glb';
  if (dish.toLowerCase().includes('pizza')) model = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Burger/glTF/Burger.glb';
  if (dish.toLowerCase().includes('cake')) model = 'https://modelviewer.dev/shared-assets/models/cake.glb';
  document.getElementById('ar-viewer').src = model;
  document.getElementById('ar-modal').style.display = 'block';
}
function closeAR() { document.getElementById('ar-modal').style.display = 'none'; }

// Voice Input
function voiceAdd() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.onresult = e => {
    document.getElementById('dish').value = e.results[0][0].transcript;
    addItem();
  };
  recognition.start();
}

// AI Suggestion
async function aiSuggest() {
  const mood = document.getElementById('mood').value || 'easy';
  document.getElementById('ai-idea').innerText = '🤖 Thinking...';
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer hf_YOUR_TOKEN' },
      body: JSON.stringify({ inputs: `Suggest a ${mood} potluck dish:` })
    });
    const data = await response.json();
    const suggestion = data[0]?.generated_text?.split('\n')[0] || 'Pasta Salad';
    document.getElementById('ai-idea').innerText = `💡 Try: ${suggestion}`;
    document.getElementById('dish').value = suggestion;
  } catch (e) {
    document.getElementById('ai-idea').innerText = '💡 Try: Pasta Salad';
  }
}

// Photo Upload
function uploadPhoto() {
  const file = document.getElementById('photo').files[0];
  if (!file) return alert('Select a photo first!');
  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;
    potluckRef.child('photos').push({ url: dataUrl, timestamp: Date.now() });
    alert('Photo uploaded! 📸');
  };
  reader.readAsDataURL(file);
}

// Listen for photos
potluckRef.child('photos').on('value', snap => {
  const gallery = document.getElementById('photo-gallery');
  gallery.innerHTML = '';
  snap.forEach(child => {
    const img = document.createElement('img');
    img.src = child.val().url;
    img.style.width = '100px';
    img.style.margin = '5px';
    img.style.borderRadius = '10px';
    gallery.appendChild(img);
  });
});

// QR Code
function generateQR() {
  const qrDiv = document.getElementById('qr');
  qrDiv.innerHTML = '';
  new QRCode(qrDiv, { text: window.location.href, width: 200, height: 200 });
}

// Bingo
function startBingo() {
  const bingoDiv = document.getElementById('bingo-card');
  bingoDiv.innerHTML = '<h3>🎰 Potluck Bingo</h3>';
  const items = ['Pasta', 'Salad', 'Dessert', 'Drinks', 'Appetizer', 'Main', 'Vegan', 'Gluten-Free', 'Spicy'];
  items.forEach(item => {
    bingoDiv.innerHTML += `<span style="display:inline-block; padding:10px; margin:5px; background:#f0f8ff; border-radius:8px;">${item}</span>`;
  });
}

// Share Location
function shareLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      alert(`📍 Location: ${latitude}, ${longitude}\nShare this link!`);
      // You can add Leaflet map here if needed
    });
  } else {
    alert('Geolocation not supported');
  }
}

// Export/Print
function exportPotluck() {
  let text = `🍽️ POTLUCK MENU - Event: ${eventId}\n${'='.repeat(40)}\n\n`;
  potluckRef.child('items').once('value', snap => {
    snap.forEach(child => {
      const data = child.val();
      text += `• ${data.name}: ${data.dish}\n`;
    });
    text += `\n${'='.repeat(40)}\nTotal Dishes: ${snap.numChildren()}\n`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `potluck-${eventId}.txt`;
    a.click();
  });
}

// PWA
if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js');
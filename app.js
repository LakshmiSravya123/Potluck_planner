const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id') || 'default';
document.getElementById('event-title').innerText = urlParams.get('title') || `Event ${eventId}`;
const potluckRef = db.ref(`potlucks/${eventId}`);
const listDiv = document.getElementById('potluck-list');

function addItem() {
  const name = document.getElementById('name').value.trim();
  const dish = document.getElementById('dish').value.trim();
  const category = document.getElementById('category').value;
  const diet = document.getElementById('diet').value;
  if (!name || !dish) return alert('Please enter name and dish!');
  potluckRef.child('items').push({ name, dish, category, diet });
  document.getElementById('name').value = '';
  document.getElementById('dish').value = '';
}

potluckRef.child('items').on('value', snap => {
  listDiv.innerHTML = '<h2>🍽️ Dishes</h2>';
  snap.forEach(child => {
    const data = child.val();
    const dietTag = data.diet ? `<span class="diet">${data.diet}</span>` : '';
    listDiv.innerHTML += `<div class="item">
      <div><strong>${data.name}</strong>: ${data.dish} (${data.category}) ${dietTag}</div>
      <button onclick="showAR('${data.dish}')">👀 AR</button>
    </div>`;
  });
});

// AI
async function aiSuggest() {
  const mood = document.getElementById('mood').value || 'easy';
  const res = await fetch('https://api-inference.huggingface.co/models/gpt2', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer hf_YOUR_TOKEN' },
    body: JSON.stringify({ inputs: `Suggest a ${mood} dish.` })
  });
  const data = await res.json();
  const suggestion = data[0].generated_text.split('\n')[0];
  document.getElementById('ai-idea').innerText = `AI: ${suggestion}`;
  document.getElementById('dish').value = suggestion;
}

// AR
function showAR(dish) {
  const model = dish.includes('pizza') ? 'https://modelviewer.dev/shared-assets/models/pizza.glb' : 'https://modelviewer.dev/shared-assets/models/Hotdog.glb';
  document.getElementById('ar-viewer').src = model;
  document.getElementById('ar-modal').style.display = 'flex';
}
function closeAR() { document.getElementById('ar-modal').style.display = 'none'; }

// Voice
function voiceAdd() {
  const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  rec.onresult = e => {
    document.getElementById('dish').value = e.results[0][0].transcript;
    addItem();
  };
  rec.start();
}

// PWA
if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js');
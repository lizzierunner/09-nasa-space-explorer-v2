// ====== CONFIG ======
// Using the class-provided JSON feed as specified in project requirements
const APOD_DATA_URL = "https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json";

// ====== AUDIO SYSTEM ======
class SpaceAudio {
  constructor() {
    this.enabled = false;
    this.audioContext = null;
    this.sounds = {};
    this.initAudio();
  }

  async initAudio() {
    try {
      // Create Web Audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Generate space-themed sound effects using Web Audio API
      this.sounds = {
        hover: this.createSpaceBeep(220, 0.1),
        click: this.createSpaceBeep(440, 0.2),
        woosh: this.createWooshSound(),
        success: this.createSuccessChime(),
        modal: this.createModalOpen()
      };
    } catch (error) {
      console.log('Audio not available:', error);
    }
  }

  createSpaceBeep(frequency, duration) {
    return () => {
      if (!this.enabled || !this.audioContext) return;
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    };
  }

  createWooshSound() {
    return () => {
      if (!this.enabled || !this.audioContext) return;
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);
      oscillator.type = 'sawtooth';
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
      filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.05, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);
    };
  }

  createSuccessChime() {
    return () => {
      if (!this.enabled || !this.audioContext) return;
      
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        const startTime = this.audioContext.currentTime + (i * 0.1);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.08, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.3);
      });
    };
  }

  createModalOpen() {
    return () => {
      if (!this.enabled || !this.audioContext) return;
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
      oscillator.frequency.linearRampToValueAtTime(300, this.audioContext.currentTime + 0.2);
      oscillator.type = 'triangle';
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.06, this.audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.4);
    };
  }

  play(soundName) {
    if (this.sounds[soundName]) {
      this.sounds[soundName]();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

const spaceAudio = new SpaceAudio();

// ====== PARTICLE SYSTEM ======
class ParticleSystem {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: 0, y: 0 };
    this.setupCanvas();
    this.bindEvents();
    this.animate();
  }

  setupCanvas() {
    this.canvas.id = 'particle-canvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '1';
    this.canvas.style.opacity = '0.7';
    document.body.appendChild(this.canvas);
    this.resize();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());
    
    document.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      
      // Create particles on mouse move
      if (Math.random() < 0.3) {
        this.createParticle(e.clientX, e.clientY);
      }
    });

    // Create burst on click
    document.addEventListener('click', (e) => {
      for (let i = 0; i < 8; i++) {
        this.createParticle(e.clientX, e.clientY, true);
      }
    });
  }

  createParticle(x, y, burst = false) {
    const particle = {
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * (burst ? 8 : 2),
      vy: (Math.random() - 0.5) * (burst ? 8 : 2),
      life: 1,
      decay: Math.random() * 0.02 + 0.01,
      size: Math.random() * 3 + 1,
      color: burst ? 
        `hsl(${Math.random() * 60 + 200}, 70%, 60%)` : // Blue spectrum for burst
        `hsl(${Math.random() * 360}, 50%, 70%)` // Random colors for trail
    };
    
    this.particles.push(particle);
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= particle.decay;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.particles.forEach(particle => {
      this.ctx.save();
      this.ctx.globalAlpha = particle.life;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }

  animate() {
    this.updateParticles();
    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}

const particleSystem = new ParticleSystem();

// ====== KEYBOARD NAVIGATION ======
class KeyboardNav {
  constructor() {
    this.currentCard = 0;
    this.cards = [];
    this.shortcuts = {};
    this.setupShortcuts();
    this.bindEvents();
    this.showHelp = false;
  }

  setupShortcuts() {
    this.shortcuts = {
      'ArrowRight': () => this.navigateCards(1),
      'ArrowLeft': () => this.navigateCards(-1),
      'ArrowDown': () => this.navigateCards(3),
      'ArrowUp': () => this.navigateCards(-3),
      'Enter': () => this.openCurrentCard(),
      ' ': () => this.getRandomFact(),
      'f': () => this.toggleFullscreen(),
      's': () => this.toggleSound(),
      'h': () => this.toggleHelpOverlay(),
      '?': () => this.toggleHelpOverlay(),
      'r': () => this.reloadGallery()
    };
  }

  bindEvents() {
    document.addEventListener('keydown', (e) => {
      // Don't interfere with form inputs
      if (e.target.tagName === 'INPUT') return;
      
      const action = this.shortcuts[e.key];
      if (action) {
        e.preventDefault();
        action();
        spaceAudio.play('click');
      }
    });
  }

  updateCards() {
    this.cards = Array.from(document.querySelectorAll('.card'));
    this.currentCard = 0;
    this.highlightCurrentCard();
  }

  navigateCards(direction) {
    if (this.cards.length === 0) return;
    
    this.cards[this.currentCard]?.classList.remove('keyboard-focused');
    this.currentCard = Math.max(0, Math.min(this.cards.length - 1, this.currentCard + direction));
    this.highlightCurrentCard();
  }

  highlightCurrentCard() {
    if (this.cards[this.currentCard]) {
      this.cards[this.currentCard].classList.add('keyboard-focused');
      this.cards[this.currentCard].scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }

  openCurrentCard() {
    if (this.cards[this.currentCard]) {
      this.cards[this.currentCard].click();
    }
  }

  getRandomFact() {
    currentFact = setRandomFact(currentFact);
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  toggleSound() {
    const enabled = spaceAudio.toggle();
    this.showNotification(`Sound ${enabled ? 'enabled' : 'disabled'}`);
  }

  reloadGallery() {
    runQuery();
  }

  toggleHelpOverlay() {
    this.showHelp = !this.showHelp;
    
    let helpOverlay = document.getElementById('keyboard-help');
    if (this.showHelp && !helpOverlay) {
      this.createHelpOverlay();
    } else if (helpOverlay) {
      helpOverlay.remove();
      this.showHelp = false;
    }
  }

  createHelpOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'keyboard-help';
    overlay.innerHTML = `
      <div class="help-content">
        <h3>🚀 Keyboard Shortcuts</h3>
        <div class="shortcut-grid">
          <div><kbd>← → ↑ ↓</kbd> Navigate gallery</div>
          <div><kbd>Enter</kbd> Open image</div>
          <div><kbd>Space</kbd> Random fact</div>
          <div><kbd>S</kbd> Toggle sound</div>
          <div><kbd>F</kbd> Fullscreen</div>
          <div><kbd>R</kbd> Reload gallery</div>
          <div><kbd>H</kbd> or <kbd>?</kbd> Toggle help</div>
        </div>
        <p>Press <kbd>Esc</kbd> or <kbd>H</kbd> to close</p>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'space-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 2000);
  }
}

const keyboardNav = new KeyboardNav();

// ====== FAVORITES SYSTEM ======
class FavoritesManager {
  constructor() {
    this.favorites = this.loadFavorites();
    this.createFavoritesUI();
  }

  loadFavorites() {
    try {
      return JSON.parse(localStorage.getItem('nasa-favorites') || '[]');
    } catch {
      return [];
    }
  }

  saveFavorites() {
    localStorage.setItem('nasa-favorites', JSON.stringify(this.favorites));
  }

  createFavoritesUI() {
    // Add favorites button to toolbar
    const toolbar = document.querySelector('.toolbar');
    const favButton = document.createElement('button');
    favButton.id = 'favorites-btn';
    favButton.innerHTML = `⭐ Favorites <span class="fav-count">(${this.favorites.length})</span>`;
    favButton.className = 'favorites-button';
    toolbar.querySelector('.controls').appendChild(favButton);

    favButton.addEventListener('click', () => this.showFavoritesModal());
  }

  toggleFavorite(item) {
    const index = this.favorites.findIndex(fav => fav.date === item.date);
    
    if (index === -1) {
      this.favorites.push(item);
      spaceAudio.play('success');
      this.showNotification('Added to favorites! ⭐');
    } else {
      this.favorites.splice(index, 1);
      spaceAudio.play('click');
      this.showNotification('Removed from favorites');
    }
    
    this.saveFavorites();
    this.updateFavoritesCount();
    this.updateFavoriteButtons();
  }

  isFavorite(item) {
    return this.favorites.some(fav => fav.date === item.date);
  }

  updateFavoritesCount() {
    const countElement = document.querySelector('.fav-count');
    if (countElement) {
      countElement.textContent = `(${this.favorites.length})`;
    }
  }

  updateFavoriteButtons() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
      const date = btn.dataset.date;
      const isFav = this.favorites.some(fav => fav.date === date);
      btn.innerHTML = isFav ? '⭐' : '☆';
      btn.classList.toggle('favorited', isFav);
    });
  }

  showFavoritesModal() {
    const modal = document.createElement('div');
    modal.className = 'favorites-modal';
    modal.innerHTML = `
      <div class="favorites-dialog">
        <div class="favorites-header">
          <h2>⭐ Your Favorite Space Images</h2>
          <button class="close-favorites">✕</button>
        </div>
        <div class="favorites-content">
          ${this.favorites.length === 0 ? 
            '<p class="no-favorites">No favorites yet! Click the ⭐ on any image to add it.</p>' :
            this.favorites.map(item => `
              <div class="favorite-item" data-date="${item.date}">
                <img src="${item.url}" alt="${item.title}" class="favorite-thumb">
                <div class="favorite-info">
                  <h4>${item.title}</h4>
                  <p class="favorite-date">${new Date(item.date).toLocaleDateString()}</p>
                  <button class="view-favorite" data-item='${JSON.stringify(item)}'>View</button>
                  <button class="remove-favorite" data-date="${item.date}">Remove</button>
                </div>
              </div>
            `).join('')
          }
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    modal.querySelector('.close-favorites').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
    
    modal.querySelectorAll('.view-favorite').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const item = JSON.parse(e.target.dataset.item);
        modal.remove();
        openModal(item);
      });
    });
    
    modal.querySelectorAll('.remove-favorite').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const date = e.target.dataset.date;
        const item = this.favorites.find(fav => fav.date === date);
        if (item) this.toggleFavorite(item);
        modal.remove();
        this.showFavoritesModal(); // Refresh modal
      });
    });
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'space-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 2000);
  }
}

const favoritesManager = new FavoritesManager();

// ====== UTILITIES ======
const $ = sel => document.querySelector(sel);

const fmt = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (d, n) => { 
  const x = new Date(d); 
  x.setDate(x.getDate() + n); 
  return x; 
};

const diffDays = (a, b) => Math.round((b - a) / 86400000);

const clampDate = (d) => {
  // For the class JSON feed, use a reasonable date range
  const min = new Date("2020-01-01");
  const max = new Date(); // Current date
  max.setHours(0,0,0,0);
  if(d < min) return min;
  if(d > max) return max;
  return d;
};

// ====== RANDOM FACTS ======
const FACTS = [
  "Neutron stars can spin hundreds of times per second after a supernova.",
  "Jupiter's Great Red Spot is a storm larger than Earth that's raged for centuries.",
  "On Mars, sunsets appear blue due to fine dust scattering sunlight.",
  "Some galaxies have supermassive black holes billions of times the Sun's mass.",
  "The Sun makes up 99.86% of the solar system's mass.",
  "Saturn's rings are mostly water ice—from pebble to boulder size.",
  "There are more stars in the universe than grains of sand on Earth's beaches.",
  "In space, astronauts grow ~2 inches taller—spines decompress in microgravity.",
  "The ISS orbits Earth about every 90 minutes—~16 sunrises/sunsets daily."
];

function setRandomFact(previousFact){
  let fact;
  do {
    fact = FACTS[Math.floor(Math.random()*FACTS.length)];
  } while (fact === previousFact && FACTS.length > 1); // Avoid same fact twice in a row if possible
  
  const factBox = $("#factBox");
  factBox.innerHTML = `<b>Did You Know?</b> ${fact}`;
  
  // Add hover hint if not mobile
  if (window.matchMedia("(hover: hover)").matches) {
    factBox.title = "Click for another fact!";
  }
  
  return fact;
}

// Rotate facts periodically and handle click for new fact
let currentFact = null;
let factRotationInterval = null;

function setupFactBox(){
  const factBox = $("#factBox");
  
  // Initial fact
  currentFact = setRandomFact();
  
  // Click for new fact
  factBox.addEventListener("click", () => {
    currentFact = setRandomFact(currentFact);
  });
  
  // Auto-rotate facts every 45 seconds
  factRotationInterval = setInterval(() => {
    currentFact = setRandomFact(currentFact);
  }, 45000);
  
  // Clean up interval if page is hidden
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && factRotationInterval) {
      clearInterval(factRotationInterval);
      factRotationInterval = null;
    } else if (!document.hidden && !factRotationInterval) {
      factRotationInterval = setInterval(() => {
        currentFact = setRandomFact(currentFact);
      }, 45000);
    }
  });
}

// ====== DOM HOOKS ======
const startInp = $("#start");
const endInp   = $("#end");
const goBtn    = $("#go");
const gallery  = $("#gallery");
const loading  = $("#loading");
const statusTx = $("#statusText");

// Modal
const modal        = $("#modal");
const modalTitle   = $("#modalTitle");
const modalMedia   = $("#modalMedia");
const modalDate    = $("#modalDate");
const modalExpl    = $("#modalExplanation");
const modalClose   = $("#modalClose");

// Initialize date inputs for the class JSON feed data
function initDates(){
  // Set dates for a recent period that should have data in the JSON feed
  const endDate = new Date(2025, 9, 1); // October 1, 2025
  const startDate = new Date(2025, 8, 24); // September 24, 2025 (about a week before)
  
  // Set the input values
  startInp.value = fmt(startDate);
  endInp.value = fmt(endDate);
  
  console.log('Date inputs initialized for JSON feed data:', {
    start: startInp.value,
    end: endInp.value
  });
}

function openModal(item){
  console.log('Debug - Opening modal for:', item);
  spaceAudio.play('modal');
  
  const formattedDate = new Date(item.date).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  modalTitle.textContent = item.title || "Astronomy Picture of the Day";
  modalDate.textContent = formattedDate;
  modalExpl.textContent = item.explanation || "No explanation available.";

  modalMedia.innerHTML = "";

  // Add sharing buttons
  const shareContainer = document.createElement('div');
  shareContainer.className = 'share-container';
  shareContainer.innerHTML = `
    <div class="share-buttons">
      <button class="share-btn twitter" data-platform="twitter">
        🐦 Tweet
      </button>
      <button class="share-btn facebook" data-platform="facebook">
        📘 Share
      </button>
      <button class="share-btn copy" data-platform="copy">
        📋 Copy Link
      </button>
      <button class="share-btn download" data-platform="download">
        💾 Download
      </button>
    </div>
  `;

  if(item.media_type === "image"){
    const src = item.hdurl || item.url;
    console.log('Debug - Loading full-size image:', src);

    const img = new Image();
    img.alt = item.title || "APOD image";
    img.src = src;
    img.loading = "eager";
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    modalMedia.appendChild(img);
  } else if(item.media_type === "video"){
    const url = item.url;
    let iframeSrc = "";
    let provider = "";
    
    // Detect video provider and format
    if(/youtube\.com|youtu\.be/.test(url)){
      const idMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
      const vid = idMatch ? idMatch[1] : "";
      iframeSrc = `https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1`;
      provider = "YouTube";
    }else if(/vimeo\.com/.test(url)){
      const idMatch = url.match(/vimeo\.com\/(\d+)/);
      const vid = idMatch ? idMatch[1] : "";
      iframeSrc = `https://player.vimeo.com/video/${vid}?title=0&byline=0&portrait=0`;
      provider = "Vimeo";
    }else if(/dailymotion\.com/.test(url)){
      const idMatch = url.match(/dailymotion\.com(?:\/video)?\/([a-zA-Z0-9]+)/);
      const vid = idMatch ? idMatch[1] : "";
      iframeSrc = `https://www.dailymotion.com/embed/video/${vid}`;
      provider = "Dailymotion";
    }
    
    if(iframeSrc){
      const container = document.createElement("div");
      container.className = "video-container";
      container.style.position = "relative";
      container.style.width = "100%";
      container.style.paddingTop = "56.25%"; // 16:9 aspect ratio
      
      const ifr = document.createElement("iframe");
      ifr.style.position = "absolute";
      ifr.style.top = "0";
      ifr.style.left = "0";
      ifr.style.width = "100%";
      ifr.style.height = "100%";
      ifr.src = iframeSrc;
      ifr.title = `${item.title || "APOD video"} (${provider})`;
      ifr.frameBorder = "0";
      ifr.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      ifr.allowFullscreen = true;
      
      container.appendChild(ifr);
      modalMedia.appendChild(container);
    }else{
      const container = document.createElement("div");
      container.className = "video-fallback";
      container.style.padding = "2rem";
      container.style.textAlign = "center";
      container.style.background = "#0d1429";
      
      const icon = document.createElement("div");
      icon.innerHTML = "🎥";
      icon.style.fontSize = "2.5rem";
      icon.style.marginBottom = "1rem";
      
      const p = document.createElement("p");
      p.style.margin = "0 0 1rem";
      p.textContent = "This entry contains a video that cannot be embedded directly.";
      
      const btn = document.createElement("a");
      btn.href = url;
      btn.target = "_blank";
      btn.rel = "noopener noreferrer";
      btn.className = "video-link";
      btn.innerHTML = `Watch Video <span class="kbd">↗</span>`;
      btn.style.display = "inline-block";
      btn.style.padding = "0.8rem 1.2rem";
      btn.style.background = "var(--nasa-red)";
      btn.style.color = "white";
      btn.style.textDecoration = "none";
      btn.style.borderRadius = "4px";
      btn.style.fontWeight = "600";
      
      container.appendChild(icon);
      container.appendChild(p);
      container.appendChild(btn);
      modalMedia.appendChild(container);
    }
  }

  // Add sharing functionality after media
  modalMedia.appendChild(shareContainer);
  setupSharingButtons(item);

  modal.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
  modalClose.focus();
}

function setupSharingButtons(item) {
  const shareButtons = document.querySelectorAll('.share-btn');
  
  shareButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const platform = btn.dataset.platform;
      shareContent(item, platform);
      spaceAudio.play('click');
    });
  });
}

function shareContent(item, platform) {
  const url = window.location.href;
  const text = `Check out this amazing space image: "${item.title}" from NASA's Astronomy Picture of the Day!`;
  const imageUrl = item.hdurl || item.url;
  
  switch(platform) {
    case 'twitter':
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
      break;
    case 'facebook':
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
      break;
    case 'copy':
      navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
        showNotification('Link copied to clipboard! 📋');
      });
      break;
    case 'download':
      if (item.media_type === 'image') {
        downloadImage(imageUrl, `NASA_APOD_${item.date}.jpg`);
      } else {
        showNotification('Video download not available, but you can visit the source!');
      }
      break;
  }
}

function downloadImage(url, filename) {
  fetch(url)
    .then(response => response.blob())
    .then(blob => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      showNotification('Image downloaded! 💾');
    })
    .catch(() => {
      showNotification('Download failed - you can save the image manually!');
    });
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'space-notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 3000);
}

function closeModal(){
  modal.setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
}

modal.addEventListener("click", (e)=> { if(e.target === modal) closeModal(); });
modalClose.addEventListener("click", closeModal);
window.addEventListener("keydown", (e)=> { 
  if(e.key === "Escape" && modal.getAttribute("aria-hidden")==="false") closeModal(); 
});

async function fetchAPODRange(startDate, endDate){
  console.log('Fetching APOD data from class-provided JSON feed for:', {
    start: fmt(startDate),
    end: fmt(endDate)
  });

  // Fetch all data from the class-provided JSON feed
  const res = await fetch(APOD_DATA_URL);
  if(!res.ok){
    const text = await res.text();
    throw new Error(`APOD data fetch failed (${res.status}): ${text || res.statusText}`);
  }
  
  const allData = await res.json();
  console.log('Fetched', allData.length, 'total entries from JSON feed');
  
  // Filter data based on date range
  const startStr = fmt(startDate);
  const endStr = fmt(endDate);
  
  const filteredData = allData.filter(item => {
    return item.date >= startStr && item.date <= endStr;
  });
  
  console.log('Filtered to', filteredData.length, 'entries in date range');
  
  // Sort by date (newest first) and return the filtered data
  const sortedData = filteredData.sort((a,b)=> b.date.localeCompare(a.date));
  
  // Take up to 9 items for display
  return sortedData.slice(0, 9);
}

function setStatus(msg=""){ statusTx.textContent = msg; }
function setLoading(on){ loading.style.display = on ? "inline-flex" : "none"; }

function buildCard(item){
  const card = document.createElement("article");
  card.className = "card";
  card.tabIndex = 0;
  card.setAttribute("role","button");
  card.setAttribute("aria-label", `${item.title} (${item.date})`);

  const wrap = document.createElement("div");
  wrap.className = "thumb-wrap";

  const img = new Image();
  const thumbSrc = item.media_type === "video" ? (item.thumbnail_url || item.url) : (item.url);
  img.src = thumbSrc;
  img.alt = item.title || (item.media_type === "video" ? "Video thumbnail" : "APOD image");
  img.className = "thumb";
  wrap.appendChild(img);

  // Add favorite button
  const favoriteBtn = document.createElement("button");
  favoriteBtn.className = "favorite-btn";
  favoriteBtn.dataset.date = item.date;
  favoriteBtn.innerHTML = favoritesManager.isFavorite(item) ? '⭐' : '☆';
  favoriteBtn.classList.toggle('favorited', favoritesManager.isFavorite(item));
  favoriteBtn.setAttribute('aria-label', 'Toggle favorite');
  favoriteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    favoritesManager.toggleFavorite(item);
  });
  wrap.appendChild(favoriteBtn);

  if(item.media_type === "video"){
    const badge = document.createElement("div");
    badge.className = "badge";
    badge.textContent = "VIDEO";
    wrap.appendChild(badge);
  }

  const meta = document.createElement("div");
  meta.className = "meta";
  const h3 = document.createElement("h3");
  h3.className = "title";
  h3.textContent = item.title || "Untitled";
  const date = document.createElement("div");
  date.className = "date";
  date.textContent = new Date(item.date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  meta.appendChild(h3);
  meta.appendChild(date);
  card.appendChild(wrap);
  card.appendChild(meta);

  // Enhanced event listeners with audio
  card.addEventListener("click", () => {
    spaceAudio.play('woosh');
    openModal(item);
  });
  
  card.addEventListener("keydown", (e) => { 
    if(e.key === "Enter" || e.key === " ") {
      spaceAudio.play('woosh');
      openModal(item);
    }
  });

  // Hover sound effects
  card.addEventListener("mouseenter", () => {
    spaceAudio.play('hover');
  });

  return card;
}

async function runQuery(){
  try{
    setLoading(true);
    setStatus("Preparing your space gallery…");
    gallery.innerHTML = "";
    spaceAudio.play('woosh');

    let s = startInp.value ? new Date(startInp.value) : null;
    let e = endInp.value ? new Date(endInp.value) : null;

    // Ensure we get data from the selected date range
    if(!s && !e){
      // Default: use 9 consecutive days that should have data in the JSON feed
      e = new Date(2025, 9, 2); // October 2, 2025
      s = new Date(2025, 8, 24); // September 24, 2025 (9 consecutive days)
    }else if(s && !e){
      // Start date provided: calculate end date (9 consecutive days)
      s = clampDate(s);
      e = new Date(s);
      e.setDate(e.getDate() + 8); // 9 consecutive days (start day + 8 more)
      e = clampDate(e);
    }else if(!s && e){
      // End date provided: calculate start date (9 consecutive days)
      e = clampDate(e);
      s = new Date(e);
      s.setDate(s.getDate() - 8); // 9 consecutive days (8 days before + end day)
      s = clampDate(s);
    }else{
      // Both dates provided: use as-is with clamping
      s = clampDate(s); 
      e = clampDate(e);
    }

    // Update the input fields to reflect the actual date range
    startInp.value = fmt(s);
    endInp.value = fmt(e);

    const dayCount = Math.min(diffDays(s, e) + 1, 9); // Limit to 9 items max
    setStatus(`Fetching space images from ${fmt(s)} to ${fmt(e)}…`);
    
    const items = await fetchAPODRange(s, e);

    if(items.length === 0){
      setStatus(`No APOD data available for the selected date range.`);
    } else {
      setStatus(`Successfully loaded ${items.length} space image(s).`);
      spaceAudio.play('success');
    }

    const frag = document.createDocumentFragment();
    items.forEach(it => frag.appendChild(buildCard(it)));
    gallery.appendChild(frag);

    // Update keyboard navigation and favorites
    keyboardNav.updateCards();
    favoritesManager.updateFavoriteButtons();

  }catch(err){
    console.error('APOD fetch error:', err);
    setStatus(`Error: ${err.message}`);
  }finally{
    setLoading(false);
  }
}

// ====== ANIMATIONS ======
function initStarField() {
  const starField = document.createElement('div');
  starField.className = 'star-field';
  document.body.prepend(starField);

  // Create stars
  const numStars = 200;
  for (let i = 0; i < numStars; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.width = Math.random() * 2 + 'px';
    star.style.height = star.style.width;
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.setProperty('--twinkle-duration', (Math.random() * 3 + 2) + 's');
    star.style.setProperty('--twinkle-delay', (Math.random() * 3) + 's');
    starField.appendChild(star);
  }

  // Create shooting stars
  const numShootingStars = 5;
  for (let i = 0; i < numShootingStars; i++) {
    const star = document.createElement('div');
    star.className = 'shooting-star';
    star.style.top = Math.random() * 50 + '%';
    star.style.left = '100%';
    star.style.setProperty('--shooting-delay', (Math.random() * 15) + 's');
    starField.appendChild(star);
  }
}

function initImageReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0) scale(1)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px) scale(0.95)';
    card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    observer.observe(card);
  });
}

function enhanceModalTransitions() {
  document.documentElement.style.setProperty('--modal-transition', '0.5s');
  const modal = $('#modal');
  modal.style.transition = 'backdrop-filter var(--modal-transition), background-color var(--modal-transition)';
  
  const dialog = modal.querySelector('.modal-dialog');
  if (dialog) {
    dialog.style.transition = 'transform var(--modal-transition), opacity var(--modal-transition)';
    dialog.style.transform = 'scale(0.95)';
    dialog.style.opacity = '0';
  }
}

// Enhanced modal open/close animations
const originalOpenModal = openModal;
openModal = function(item) {
  originalOpenModal(item);
  requestAnimationFrame(() => {
    const dialog = modal.querySelector('.modal-dialog');
    if (dialog) {
      dialog.style.transform = 'scale(1)';
      dialog.style.opacity = '1';
    }
  });
};

const originalCloseModal = closeModal;
closeModal = function() {
  const dialog = modal.querySelector('.modal-dialog');
  if (dialog) {
    dialog.style.transform = 'scale(0.95)';
    dialog.style.opacity = '0';
    setTimeout(() => {
      originalCloseModal();
    }, 500);
  } else {
    originalCloseModal();
  }
};

// ====== INIT ======
setupFactBox();
initDates();
initStarField();
enhanceModalTransitions();

goBtn.addEventListener("click", runQuery);

// Enhance gallery after each query
const originalRunQuery = runQuery;
runQuery = async function() {
  await originalRunQuery();
  initImageReveal();
};

// Enhanced button event listeners
goBtn.addEventListener("click", runQuery);

// Sound toggle button
const soundToggle = $("#sound-toggle");
soundToggle.addEventListener("click", () => {
  const enabled = spaceAudio.toggle();
  soundToggle.innerHTML = enabled ? '🔊' : '🔇';
  soundToggle.classList.toggle('disabled', !enabled);
  spaceAudio.play('click');
  showNotification(`Sound effects ${enabled ? 'enabled' : 'disabled'}`);
});

// Help toggle button
const helpToggle = $("#help-toggle");
helpToggle.addEventListener("click", () => {
  keyboardNav.toggleHelpOverlay();
  spaceAudio.play('click');
});

// Pressing Enter in date inputs triggers fetch
[startInp, endInp].forEach(inp => {
  inp.addEventListener("keydown", e => { if(e.key === "Enter") runQuery(); });
});

// ====== MUSIC RECOMMENDATION SYSTEM ======
class MusicRecommendation {
  constructor() {
    this.musicSection = $("#musicRecommendation");
    this.closeButton = $("#musicClose");
    this.spotifyLink = document.querySelector('.spotify-link');
    this.init();
  }

  init() {
    // Handle close button
    this.closeButton?.addEventListener('click', () => {
      this.hide();
      spaceAudio.sounds.click?.();
    });

    // Handle Spotify link clicks
    this.spotifyLink?.addEventListener('click', () => {
      spaceAudio.sounds.success?.();
      showNotification('🎵 Opening cosmic soundtrack in Spotify...');
    });

    // Auto-hide after 10 seconds if user doesn't interact
    setTimeout(() => {
      if (this.musicSection && !this.musicSection.classList.contains('hidden')) {
        this.autoHide();
      }
    }, 10000);

    // Show with animation
    this.show();
  }

  show() {
    if (this.musicSection) {
      this.musicSection.classList.remove('hidden');
      this.musicSection.style.animation = 'musicSlideIn 0.8s ease-out';
    }
  }

  hide() {
    if (this.musicSection) {
      this.musicSection.style.animation = 'musicSlideIn 0.3s ease-out reverse';
      setTimeout(() => {
        this.musicSection.classList.add('hidden');
      }, 300);
    }
  }

  autoHide() {
    if (this.musicSection) {
      this.musicSection.style.opacity = '0.7';
      setTimeout(() => this.hide(), 2000);
    }
  }
}

// Auto-load on start with spectacular entrance
window.addEventListener('load', () => {
  console.log('🚀 NASA Space Explorer loaded - prepare for liftoff!');
  
  // Enable audio after user interaction
  document.addEventListener('click', () => {
    spaceAudio.enabled = true;
  }, { once: true });
  
  runQuery();
  
  // Initialize music recommendation system
  setTimeout(() => {
    new MusicRecommendation();
  }, 2000);
  
  // Show welcome message
  setTimeout(() => {
    showNotification('🚀 Welcome to NASA Space Explorer! Press H for keyboard shortcuts.');
  }, 1000);
});

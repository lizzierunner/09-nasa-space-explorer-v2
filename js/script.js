// ====== CONFIG ======
// Using the class-provided JSON feed as specified in project requirements
const APOD_DATA_URL = "https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json";

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

  modal.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
  modalClose.focus();
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

  card.addEventListener("click", ()=> openModal(item));
  card.addEventListener("keydown", (e)=> { 
    if(e.key === "Enter" || e.key === " ") openModal(item); 
  });

  return card;
}

async function runQuery(){
  try{
    setLoading(true);
    setStatus("Preparing your 9-day APOD window…");
    gallery.innerHTML = "";

    let s = startInp.value ? new Date(startInp.value) : null;
    let e = endInp.value ? new Date(endInp.value) : null;

    // Ensure we get data from the selected date range
    if(!s && !e){
      // Default: use dates that should have data in the JSON feed
      e = new Date(2025, 9, 1); // October 1, 2025
      s = new Date(2025, 8, 24); // September 24, 2025
    }else if(s && !e){
      // Start date provided: calculate end date (about a week later)
      s = clampDate(s);
      e = new Date(s);
      e.setDate(e.getDate() + 7); // About a week of data
      e = clampDate(e);
    }else if(!s && e){
      // End date provided: calculate start date (about a week before)
      e = clampDate(e);
      s = new Date(e);
      s.setDate(s.getDate() - 7); // About a week of data
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
    }

    const frag = document.createDocumentFragment();
    items.forEach(it => frag.appendChild(buildCard(it)));
    gallery.appendChild(frag);

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

// Pressing Enter in date inputs triggers fetch
[startInp, endInp].forEach(inp => {
  inp.addEventListener("keydown", e => { if(e.key === "Enter") runQuery(); });
});

// Auto-load on start
window.addEventListener('load', () => {
  console.log('Page loaded, running initial query...');
  runQuery();
});

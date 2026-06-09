/* ── DOM refs ─────────────────────────── */
const $prompt      = document.querySelector("#prompt");
const $modelSelect = document.querySelector("#model-select");
const $cameraIn    = document.querySelector("#camera-input");
const $galleryIn   = document.querySelector("#gallery-input");
const $cameraBtn   = document.querySelector("#camera-btn");
const $galleryBtn  = document.querySelector("#gallery-btn");
const $delay       = document.querySelector("#delay");
const $outTimeout  = document.querySelector("#output-timeout");
const $start       = document.querySelector("#start");
const $pause       = document.querySelector("#pause");
const $clear       = document.querySelector("#clear");
const $status      = document.querySelector("#status");
const $queue       = document.querySelector("#queue");
const $queueCount  = document.querySelector("#queue-count");
const $outputCount = document.querySelector("#output-count");
const $outputs     = document.querySelector("#outputs");
const $noOutputs   = document.querySelector("#no-outputs");

/* ── State ────────────────────────────── */
let state = {
  model: "gpt",
  prompt: "",
  delaySeconds: 10,
  outputTimeoutSeconds: 240,
  status: "idle",
  cursor: 0,
  items: []
};

/* ── Utilities ────────────────────────── */

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const b = new Uint8Array(16);
  (crypto || window.crypto).getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map(x => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}

function setStatus(msg, type) {
  $status.textContent = msg;
  $status.className = type || "";
}

/* ── Render ───────────────────────────── */

function render() {
  // Keep form values if user is editing
  if (document.activeElement !== $prompt) $prompt.value = state.prompt || "";
  if (document.activeElement !== $delay) $delay.value = state.delaySeconds || 10;
  if (document.activeElement !== $outTimeout) $outTimeout.value = state.outputTimeoutSeconds || 240;
  if (document.activeElement !== $modelSelect && $modelSelect) $modelSelect.value = state.model || "gpt";

  const total = state.items.length;
  const completed = state.items.filter(i => i.status === "completed").length;
  $queueCount.textContent = `${total} image${total === 1 ? "" : "s"}`;
  $outputCount.textContent = `${completed} ready`;

  // ── Queue list ──
  $queue.innerHTML = "";
  state.items.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "queue-item";

    const img = document.createElement("img");
    img.src = item.dataUrl || item.storageUrl || "";
    img.alt = item.name;

    const info = document.createElement("div");
    info.className = "queue-item-info";

    const name = document.createElement("strong");
    name.textContent = item.name;

    const badge = document.createElement("span");
    const statusKey = (item.status || "queued").split(":")[0].trim().replace(/\s/g, "-");
    badge.className = `s-${statusKey}`;
    badge.textContent = `#${idx + 1} · ${item.status}`;

    info.append(name, badge);

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "✕";
    removeBtn.title = "Remove";
    removeBtn.addEventListener("click", () => removeItem(item.id));

    div.append(img, info, removeBtn);
    $queue.append(div);
  });

  // ── Outputs ──
  const outputItems = state.items.filter(i => i.output && (i.output.url || (i.output.urls && i.output.urls.length)));
  const inProgressItems = state.items.filter(i => ["submitting", "waiting", "generating"].includes(i.status));
  $noOutputs.style.display = (outputItems.length || inProgressItems.length) ? "none" : "block";

  $outputs.innerHTML = "";

  // Show in-progress items with loading spinners first
  inProgressItems.forEach(item => {
    const card = document.createElement("div");
    card.className = "output-card loading-card";

    const head = document.createElement("div");
    head.className = "output-card-head";
    const title = document.createElement("span");
    title.textContent = item.name;
    const statusEl = document.createElement("small");
    statusEl.className = "loading-status-badge";
    if (item.status === "submitting") {
      statusEl.textContent = "⏳ Sending…";
    } else if (item.status === "generating") {
      statusEl.textContent = "⏳ Generating…";
    } else {
      statusEl.textContent = "⏳ Waiting…";
    }
    head.append(title, statusEl);
    card.append(head);

    const grid = document.createElement("div");
    grid.className = "output-images";

    const wrap = document.createElement("div");
    wrap.className = "output-img-wrap loading-placeholder";

    // Show faded input thumbnail
    const thumb = document.createElement("img");
    thumb.src = item.dataUrl || item.storageUrl || "";
    thumb.alt = item.name;
    thumb.className = "loading-thumb";

    const spinner = document.createElement("div");
    spinner.className = "output-spinner";

    const spinnerText = document.createElement("div");
    spinnerText.className = "output-spinner-text";
    if (item.status === "submitting") {
      spinnerText.textContent = "Sending…";
    } else if (item.status === "generating") {
      spinnerText.textContent = "Generating…";
    } else {
      spinnerText.textContent = "Waiting…";
    }

    wrap.append(thumb, spinner, spinnerText);
    grid.append(wrap);
    card.append(grid);
    $outputs.append(card);
  });

  // Show completed output items
  outputItems.forEach(item => {
    const card = document.createElement("div");
    card.className = "output-card";

    const head = document.createElement("div");
    head.className = "output-card-head";
    const title = document.createElement("span");
    title.textContent = item.name;
    const check = document.createElement("small");
    check.textContent = "✓ done";
    head.append(title, check);
    card.append(head);

    const allUrls = (item.output.urls && item.output.urls.length)
      ? item.output.urls
      : [item.output.url];

    const grid = document.createElement("div");
    grid.className = "output-images";

    allUrls.forEach((url, idx) => {
      const wrap = document.createElement("div");
      wrap.className = "output-img-wrap";

      const img = document.createElement("img");
      img.className = "loading";
      img.alt = `Output ${idx + 1}`;
      img.loading = "lazy";
      img.style.cursor = "pointer";

      // Load output image directly
      img.src = url;

      img.onload = function () { this.className = ""; };
      img.addEventListener("click", () => openImageModal(url, item.name));
      img.onerror = function () {
        this.className = "error";
        const lbl = document.createElement("div");
        lbl.className = "img-error-label";
        lbl.textContent = "Image expired or unavailable";
        wrap.append(lbl);
      };

      const link = document.createElement("a");
      link.href = url;
      link.download = `output-${idx + 1}-${item.name}`;
      link.textContent = "⬇ Download";

      wrap.append(img, link);
      grid.append(wrap);
    });

    card.append(grid);
    $outputs.append(card);
  });
}

/* ── State sync ───────────────────────── */

function normalizeState(s) {
  if (!s) return {
    model: "gpt",
    prompt: "",
    delaySeconds: 10,
    outputTimeoutSeconds: 240,
    status: "idle",
    cursor: 0,
    items: []
  };
  return {
    model: s.model || "gpt",
    prompt: s.prompt || "",
    delaySeconds: Number(s.delaySeconds) || 10,
    outputTimeoutSeconds: Number(s.outputTimeoutSeconds) || 240,
    status: s.status || "idle",
    cursor: Number(s.cursor) || 0,
    items: Array.isArray(s.items) ? s.items : []
  };
}

async function loadState() {
  try {
    if (!firebaseClient.isConfigured()) {
      setStatus("Firebase not configured in firebase-config.js", "error");
      return;
    }
    const remote = await firebaseClient.getDbData("");
    state = normalizeState(remote?.state);
    render();
    const c = state.items.filter(i => i.status === "completed").length;
    setStatus(`${c}/${state.items.length} done · ${state.status}`, "ok");
  } catch (err) {
    setStatus(`Sync error: ${err.message}`, "error");
  }
}

async function pushState(nextStatus) {
  state = {
    ...state,
    model: $modelSelect ? $modelSelect.value : (state.model || "gpt"),
    prompt: $prompt.value.trim(),
    delaySeconds: Number($delay.value) || 10,
    outputTimeoutSeconds: Number($outTimeout.value) || 240,
    status: nextStatus != null ? nextStatus : state.status
  };
  try {
    if (!firebaseClient.isConfigured()) throw new Error("Firebase is not configured");
    const current = await firebaseClient.getDbData("");
    const revision = ((current && current.revision) || 0) + 1;
    await firebaseClient.putDbData("", { revision, state });
    render();
    setStatus(`Saved · ${state.status}`, "ok");
  } catch (err) {
    setStatus(`Save failed: ${err.message}`, "error");
  }
}

/* ── Queue management ─────────────────── */

async function removeItem(id) {
  state = { ...state, items: state.items.filter(i => i.id !== id) };
  render();
  await pushState();
}

/* ── File handling ────────────────────── */

async function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxWidth || h > maxWidth) {
        if (w > h) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        } else {
          w = Math.round((w * maxWidth) / h);
          h = maxWidth;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/webp", quality));
    };
    img.onerror = reject;
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result; };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handleFiles(fileList) {
  const IMAGE_EXTS = /\.(jpe?g|png|gif|webp|avif|bmp|heic|heif|tiff?)$/i;
  const accepted = [...fileList].filter(
    f => f.type.startsWith("image/") || IMAGE_EXTS.test(f.name) || !f.type
  );
  if (!accepted.length) {
    if (fileList.length) setStatus("No image files found – try again", "error");
    return;
  }

  setStatus(`Compressing & queuing ${accepted.length} image${accepted.length === 1 ? "" : "s"}...`);

  try {
    if (!firebaseClient.isConfigured()) throw new Error("Firebase is not configured in firebase-config.js");

    const newItems = [];
    for (let i = 0; i < accepted.length; i++) {
      const f = accepted[i];
      setStatus(`Compressing image ${i + 1}/${accepted.length}...`);
      const compressedDataUrl = await compressImage(f);
      newItems.push({
        id: generateId(),
        name: f.name || `camera-${Date.now()}.jpg`,
        type: "image/webp",
        dataUrl: compressedDataUrl,
        status: "queued",
        output: null
      });
    }

    state = { ...state, items: [...state.items, ...newItems] };
    await pushState();
    setStatus(`${newItems.length} image${newItems.length === 1 ? "" : "s"} added ✓`, "ok");
  } catch (err) {
    setStatus(`Queue failed: ${err.message}`, "error");
  }
}

/* ── Event listeners ──────────────────── */

$cameraBtn.addEventListener("click", () => { $cameraIn.value = ""; $cameraIn.click(); });
$galleryBtn.addEventListener("click", () => { $galleryIn.value = ""; $galleryIn.click(); });

$cameraIn.addEventListener("change", () => { if ($cameraIn.files.length) handleFiles($cameraIn.files); });
$galleryIn.addEventListener("change", () => { if ($galleryIn.files.length) handleFiles($galleryIn.files); });

$prompt.addEventListener("change", () => pushState());
$delay.addEventListener("change", () => pushState());
$outTimeout.addEventListener("change", () => pushState());
$modelSelect.addEventListener("change", () => pushState());

$start.addEventListener("click", () => pushState("running"));
$pause.addEventListener("click", () => pushState("paused"));
$clear.addEventListener("click", async () => {
  if (!state.items.length && !$prompt.value.trim()) return;
  state = {
    model: $modelSelect ? $modelSelect.value : (state.model || "gpt"),
    prompt: $prompt.value.trim(),
    delaySeconds: Number($delay.value) || 10,
    outputTimeoutSeconds: Number($outTimeout.value) || 240,
    status: "idle",
    cursor: 0,
    items: []
  };
  await pushState("idle");
});

/* ── Boot ─────────────────────────────── */
let dbStream = null;
function initFirebaseSync() {
  if (!firebaseClient.isConfigured()) {
    setStatus("Firebase not configured in firebase-config.js", "error");
    return;
  }
  
  setStatus("Connecting to Firebase...", "info");
  loadState();

  dbStream = firebaseClient.streamDbData("", () => {
    loadState();
  });
}
initFirebaseSync();

/* ── Image Modal with Text Overlay ────── */

const modalOverlay = document.querySelector("#image-modal");
const modalCanvas = document.querySelector("#modal-canvas");
const modalCtx = modalCanvas.getContext("2d");
const modalCloseBtn = document.querySelector("#modal-close");
const modalTextInput = document.querySelector("#modal-text-input");
const modalFontSize = document.querySelector("#modal-font-size");
const modalSizeLabel = document.querySelector("#modal-size-label");
const modalTextColor = document.querySelector("#modal-text-color");
const modalTextBold = document.querySelector("#modal-text-bold");
const modalDownload = document.querySelector("#modal-download");
const modalDownloadPlain = document.querySelector("#modal-download-plain");
const modalCanvasWrap = document.querySelector(".modal-canvas-wrap");

let modalImage = null;
let modalImageName = "";
let modalOriginalUrl = "";
let textPosX = 0.5;
let textPosY = 0.85;
let isDraggingText = false;

function openImageModal(imgSrc, name) {
  modalImageName = name || "output.png";
  modalOriginalUrl = imgSrc;
  modalTextInput.value = "";
  modalFontSize.value = 32;
  modalSizeLabel.textContent = "32px";
  modalTextColor.value = "#ffffff";
  modalTextBold.checked = false;
  textPosX = 0.5;
  textPosY = 0.85;
  modalOverlay.style.display = "flex";
  document.body.style.overflow = "hidden";

  modalImage = new Image();
  modalImage.crossOrigin = "anonymous";
  modalImage.onload = () => {
    renderModalCanvas();
  };
  modalImage.onerror = () => {
    const img2 = new Image();
    img2.onload = () => {
      modalImage = img2;
      renderModalCanvas();
    };
    img2.src = imgSrc;
  };
  modalImage.src = imgSrc;
}

function closeImageModal() {
  modalOverlay.style.display = "none";
  document.body.style.overflow = "";
  modalImage = null;
}

function renderModalCanvas() {
  if (!modalImage) return;

  const maxW = modalCanvasWrap.clientWidth - 16;
  const maxH = window.innerHeight * 0.45;
  const scale = Math.min(maxW / modalImage.naturalWidth, maxH / modalImage.naturalHeight, 1);

  const w = Math.round(modalImage.naturalWidth * scale);
  const h = Math.round(modalImage.naturalHeight * scale);

  modalCanvas.width = w;
  modalCanvas.height = h;
  modalCanvas.style.width = w + "px";
  modalCanvas.style.height = h + "px";

  modalCtx.clearRect(0, 0, w, h);
  modalCtx.drawImage(modalImage, 0, 0, w, h);

  let text = modalTextInput.value.trim();
  if (!text) {
    text = "Tap to position";
    modalCtx.globalAlpha = 0.5;
  }

  const size = Number(modalFontSize.value) || 32;
  const displaySize = size;
  const bold = modalTextBold.checked ? "bold " : "";
  modalCtx.font = `${bold}${displaySize}px -apple-system, BlinkMacSystemFont, Inter, sans-serif`;
  modalCtx.textAlign = "center";
  modalCtx.textBaseline = "middle";

  const x = textPosX * w;
  const y = textPosY * h;

  modalCtx.fillStyle = modalTextColor.value;
  modalCtx.fillText(text, x, y);
  
  modalCtx.globalAlpha = 1.0;
}

// Touch/mouse drag for text positioning
modalCanvasWrap.addEventListener("touchstart", (e) => {
  if (!modalImage) return;
  isDraggingText = true;
  updateModalTextPos(e.touches[0]);
  e.preventDefault();
}, { passive: false });

// Touchmove event for positioning
modalCanvasWrap.addEventListener("touchmove", (e) => {
  if (!isDraggingText) return;
  updateModalTextPos(e.touches[0]);
  e.preventDefault();
}, { passive: false });

window.addEventListener("touchend", () => { isDraggingText = false; });

modalCanvasWrap.addEventListener("mousedown", (e) => {
  if (!modalImage) return;
  isDraggingText = true;
  updateModalTextPos(e);
});
modalCanvasWrap.addEventListener("mousemove", (e) => {
  if (!isDraggingText) return;
  updateModalTextPos(e);
});
window.addEventListener("mouseup", () => { isDraggingText = false; });

function updateModalTextPos(e) {
  const rect = modalCanvasWrap.getBoundingClientRect();
  textPosX = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
  textPosY = Math.max(0.05, Math.min(0.95, (e.clientY - rect.top) / rect.height));
  renderModalCanvas();
}

// Controls
modalTextInput.addEventListener("input", () => { renderModalCanvas(); });
modalFontSize.addEventListener("input", () => {
  modalSizeLabel.textContent = modalFontSize.value + "px";
  renderModalCanvas();
});
modalTextColor.addEventListener("input", () => { renderModalCanvas(); });
modalTextBold.addEventListener("change", () => { renderModalCanvas(); });

// Download with text
modalDownload.addEventListener("click", () => {
  if (!modalImage) return;
  const c = document.createElement("canvas");
  c.width = modalImage.naturalWidth;
  c.height = modalImage.naturalHeight;
  const ctx = c.getContext("2d");
  ctx.drawImage(modalImage, 0, 0);

  const text = modalTextInput.value.trim();
  if (text) {
    const size = Number(modalFontSize.value) || 32;
    const fullSize = Math.round(size * (modalImage.naturalWidth / modalCanvas.width));
    const bold = modalTextBold.checked ? "bold " : "";
    ctx.font = `${bold}${fullSize}px -apple-system, BlinkMacSystemFont, Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const x = textPosX * c.width;
    const y = textPosY * c.height;
    ctx.fillStyle = modalTextColor.value;
    ctx.fillText(text, x, y);
  }

  const link = document.createElement("a");
  link.download = `edited-${modalImageName.replace(/\.[^.]+$/, '')}.webp`;
  link.href = c.toDataURL("image/webp", 0.85);
  link.click();
});

// Download original
modalDownloadPlain.addEventListener("click", async () => {
  if (!modalOriginalUrl) return;

  modalDownloadPlain.disabled = true;
  modalDownloadPlain.textContent = "⏳ Compressing...";

  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => {
        img.removeAttribute("crossOrigin");
        img.onload = resolve;
        img.onerror = reject;
      };
      img.src = modalOriginalUrl;
    });

    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const compressedDataUrl = c.toDataURL("image/webp", 0.85);

    const link = document.createElement("a");
    link.download = `compressed-${modalImageName.replace(/\.[^.]+$/, '')}.webp`;
    link.href = compressedDataUrl;
    link.click();
  } catch (e) {
    const link = document.createElement("a");
    link.download = modalImageName;
    link.href = modalOriginalUrl;
    link.click();
  } finally {
    modalDownloadPlain.disabled = false;
    modalDownloadPlain.textContent = "⬇ Download Original";
  }
});

// Close
modalCloseBtn.addEventListener("click", closeImageModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeImageModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalOverlay.style.display !== "none") closeImageModal();
});

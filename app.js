const $ = (s) => document.querySelector(s);
const configInput = $("#configInput");
const results = $("#results");
const status = $("#status");
const shareBox = $("#shareBox");
const shareLink = $("#shareLink");

function base64Decode(value){
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const bytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function base64Encode(value){
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function parseConfig(raw){
  let value = raw.trim();
  if(!value) throw new Error("Configuration is empty.");

  // Accept the exact style used by the reference: Base64(MERGED:::[...])
  try {
    const decoded = base64Decode(value);
    if(decoded.startsWith("MERGED:::")) value = decoded;
    else if(decoded.trim().startsWith("[")) value = decoded;
  } catch (_) {}

  if(value.startsWith("MERGED:::")) value = value.slice("MERGED:::".length);

  const parsed = JSON.parse(value);
  if(!Array.isArray(parsed)) throw new Error("Configuration must be an array.");
  return parsed.map((item, i) => {
    if(!item || typeof item.url !== "string") throw new Error(`Item ${i+1}: url is required.`);
    return {url:item.url.replace(/\/+$/,""), key:item.key ?? String(i+1)};
  });
}
function showStatus(msg, error=false){
  status.textContent = msg;
  status.style.color = error ? "#ff9c9c" : "";
}
function safeJson(data){
  try { return JSON.stringify(data, null, 2); } catch { return String(data); }
}
async function loadData(){
  results.innerHTML = "";
  let configs;
  try { configs = parseConfig(configInput.value); }
  catch(e){ showStatus(e.message, true); return; }

  showStatus(`Loading ${configs.length} endpoint${configs.length===1?"":"s"}…`);
  let ok = 0;

  for(const item of configs){
    const box = document.createElement("article");
    box.className = "result";
    box.innerHTML = `<div class="result-head"><div><div class="key"></div><div class="url"></div></div></div><pre>Loading…</pre>`;
    box.querySelector(".key").textContent = `KEY: ${item.key}`;
    box.querySelector(".url").textContent = item.url;
    results.appendChild(box);

    const pre = box.querySelector("pre");
    try{
      // Firebase RTDB REST endpoint. This works only when the supplied
      // database/rules permit the browser to read the requested path.
      const response = await fetch(item.url + "/.json", {headers:{Accept:"application/json"}});
      const text = await response.text();
      if(!response.ok) throw new Error(`HTTP ${response.status}: ${text.slice(0,250)}`);
      let data;
      try { data = JSON.parse(text); } catch { data = text; }
      pre.textContent = safeJson(data);
      ok++;
    }catch(e){
      pre.className = "error";
      pre.textContent = `Could not read this endpoint.\n\n${e.message}\n\nCheck the Firebase Realtime Database URL, CORS, and database security rules.`;
    }
  }
  showStatus(`Finished: ${ok}/${configs.length} endpoint${configs.length===1?"":"s"} loaded.`);
}

function createShareLink(){
  let configs;
  try { configs = parseConfig(configInput.value); }
  catch(e){ showStatus(e.message, true); return; }
  const payload = "MERGED:::" + JSON.stringify(configs);
  const encoded = base64Encode(payload);
  const url = `${location.origin}${location.pathname}?s=${encodeURIComponent(encoded)}`;
  shareLink.value = url;
  shareBox.classList.remove("hidden");
  history.replaceState(null,"",`?s=${encodeURIComponent(encoded)}`);
  showStatus("Share link created.");
}
$("#loadBtn").addEventListener("click", loadData);
$("#encodeBtn").addEventListener("click", createShareLink);
$("#clearBtn").addEventListener("click", () => {
  configInput.value=""; results.innerHTML=""; shareBox.classList.add("hidden"); showStatus("");
});
$("#copyBtn").addEventListener("click", async () => {
  await navigator.clipboard.writeText(shareLink.value);
  $("#copyBtn").textContent = "Copied";
  setTimeout(() => $("#copyBtn").textContent="Copy",1200);
});

const params = new URLSearchParams(location.search);
const shared = params.get("s");
if(shared){
  configInput.value = shared;
  loadData();
}

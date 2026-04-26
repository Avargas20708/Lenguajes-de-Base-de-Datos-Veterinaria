function getApiBaseUrl() {
  const configured = globalThis.API_BASE_URL || document.querySelector('meta[name="api-base-url"]')?.content;
  if (configured) return configured.replace(/\/$/, "");

  if (location.protocol === "file:") return "http://localhost:3001";

  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return `${location.protocol}//${location.hostname}:3001`;
  }

  return "";
}

function getApiUrlCandidates(url) {
  if (/^https?:\/\//i.test(url)) return [url];

  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  const candidates = [normalizedPath];

  const configuredBase = getApiBaseUrl();
  if (configuredBase) candidates.push(`${configuredBase}${normalizedPath}`);

  const localhostBase = `${location.protocol}//localhost:3001`;
  if (!candidates.includes(`${localhostBase}${normalizedPath}`)) {
    candidates.push(`${localhostBase}${normalizedPath}`);
  }

  const hostBase = `${location.protocol}//127.0.0.1:3001`;
  if (!candidates.includes(`${hostBase}${normalizedPath}`)) {
    candidates.push(`${hostBase}${normalizedPath}`);
  }

  return candidates;
}

async function apiRequest(url, options) {
  const requestOptions = options || undefined;
  const requestHeaders = { "Content-Type": "application/json" };
  if (requestOptions?.headers) Object.assign(requestHeaders, requestOptions.headers);
  const candidates = getApiUrlCandidates(url);

  let lastError = null;

  for (const resolvedUrl of candidates) {
    try {
      const response = await fetch(resolvedUrl, {
        headers: requestHeaders,
        ...requestOptions
      });

      const raw = await response.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : { ok: true };
      } catch {
        // Si devolvió HTML u otro formato, probamos la siguiente URL candidata.
        lastError = new Error(`La API en ${resolvedUrl} no devolvió JSON.`);
        continue;
      }

      if (!response.ok || data.ok === false) throw new Error(data.error || "Error en la solicitud.");
      return data;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(lastError?.message || "No fue posible conectar con la API. Verifique que el backend esté ejecutándose.");
}

function showMessage(element, text, type = "success") {
  if (!element) return;
  element.textContent = text;
  element.className = `alert show ${type}`;
  setTimeout(() => { element.className = "alert"; }, 4500);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return date.toLocaleString("es-CR");
}

function toInputDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function setActiveNav() {
  const current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("nav a").forEach(a => {
    if (a.getAttribute("href") === current) a.classList.add("active");
  });
}

document.addEventListener("DOMContentLoaded", setActiveNav);

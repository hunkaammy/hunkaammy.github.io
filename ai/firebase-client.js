// firebase-client.js
// A pure browser-native Firebase client using REST APIs (no external SDK dependencies).

class FirebaseRESTClient {
  constructor(config) {
    this.config = config;
    this.dbUrl = (config?.databaseURL || "").replace(/\/$/, "");
    this.storageBucket = config?.storageBucket || "";
    this.projectId = config?.projectId || "";
  }

  /**
   * Checks if the user has replaced placeholder values with a real configuration.
   */
  isConfigured() {
    return (
      this.config &&
      this.projectId &&
      this.projectId !== "YOUR_PROJECT_ID" &&
      this.dbUrl &&
      !this.dbUrl.includes("YOUR_PROJECT_ID")
    );
  }

  /**
   * Fetches data from the Realtime Database at the specified path.
   */
  async getDbData(path) {
    if (!this.isConfigured()) throw new Error("Firebase is not configured in firebase-config.js");
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const url = `${this.dbUrl}/${cleanPath}.json`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Firebase DB GET failed: ${resp.statusText}`);
    return resp.json();
  }

  /**
   * Overwrites data in the Realtime Database at the specified path.
   */
  async putDbData(path, data) {
    if (!this.isConfigured()) throw new Error("Firebase is not configured in firebase-config.js");
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const url = `${this.dbUrl}/${cleanPath}.json`;
    const resp = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!resp.ok) throw new Error(`Firebase DB PUT failed: ${resp.statusText}`);
    return resp.json();
  }

  /**
   * Uploads a Blob/File to Firebase Storage and returns its public download URL.
   */
  async uploadFile(blob, fileName) {
    if (!this.isConfigured()) throw new Error("Firebase is not configured in firebase-config.js");
    const encodedName = encodeURIComponent(fileName);
    const url = `https://firebasestorage.googleapis.com/v0/b/${this.storageBucket}/o?name=${encodedName}`;
    
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": blob.type || "application/octet-stream"
      },
      body: blob
    });
    if (!resp.ok) throw new Error(`Firebase Storage upload failed: ${resp.statusText}`);
    const result = await resp.json();

    // Construct public read URL (accessible if storage rules are public read)
    let downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${this.storageBucket}/o/${encodedName}?alt=media`;
    if (result.downloadTokens) {
      downloadUrl += `&token=${result.downloadTokens}`;
    }
    return downloadUrl;
  }

  /**
   * Subscribes to Realtime Database updates via Server-Sent Events (EventSource).
   */
  streamDbData(path, onUpdate) {
    if (!this.isConfigured()) {
      console.log("[firebase] Client not configured. Streaming disabled.");
      return null;
    }
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const url = `${this.dbUrl}/${cleanPath}.json`;
    
    const eventSource = new EventSource(url);

    eventSource.addEventListener("put", (e) => {
      try {
        const payload = JSON.parse(e.data);
        onUpdate({ type: "put", path: payload.path, data: payload.data });
      } catch (err) {
        console.error("Error parsing DB stream put event:", err);
      }
    });

    eventSource.addEventListener("patch", (e) => {
      try {
        const payload = JSON.parse(e.data);
        onUpdate({ type: "patch", path: payload.path, data: payload.data });
      } catch (err) {
        console.error("Error parsing DB stream patch event:", err);
      }
    });

    eventSource.addEventListener("error", (e) => {
      console.log("[firebase] DB stream connection status updated (EventSource closed or retrying).");
    });

    return eventSource;
  }
}

// Global client instance
const firebaseClient = new FirebaseRESTClient(typeof firebaseConfig !== "undefined" ? firebaseConfig : null);

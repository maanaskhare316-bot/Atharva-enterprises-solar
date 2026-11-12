// CNG Navigator Admin & Station Operator Portal
class AdminPortal {
  constructor() {
    this.adminKey = localStorage.getItem("cng_admin_key") || "cng-admin-secret-2026";
    this.verified = false;
  }

  openPortal() {
    const modal = document.getElementById("adminModal");
    modal.classList.add("open");
    document.getElementById("adminKeyInput").value = this.adminKey;
    this.populateStationDropdown();
  }

  closePortal() {
    document.getElementById("adminModal").classList.remove("open");
  }

  async verifyKey() {
    const key = document.getElementById("adminKeyInput").value.trim();
    const statusDiv = document.getElementById("adminAuthStatus");

    try {
      const resp = await fetch("/api/admin/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": key
        }
      });

      const data = await resp.json();
      if (resp.ok && data.authorized) {
        this.adminKey = key;
        localStorage.setItem("cng_admin_key", key);
        this.verified = true;
        statusDiv.innerHTML = `<span style="color:#059669; font-weight:bold;">&check; Authenticated as Authorized Station Operator</span>`;
        document.getElementById("adminOperationsForm").style.display = "block";
      } else {
        this.verified = false;
        statusDiv.innerHTML = `<span style="color:#ef4444; font-weight:bold;">&cross; Invalid Admin Secret Key</span>`;
      }
    } catch (e) {
      statusDiv.innerHTML = `<span style="color:#ef4444;">Server error during verification</span>`;
    }
  }

  populateStationDropdown() {
    const select = document.getElementById("adminStationSelect");
    select.innerHTML = '<option value="">-- Choose CNG Station --</option>';
    
    if (window.cngApp && window.cngApp.allStations) {
      window.cngApp.allStations.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = `${s.name} (${s.city}) [ID: ${s.id}]`;
        select.appendChild(opt);
      });
    }
  }

  async submitQueueTelemetry() {
    const stationId = document.getElementById("adminStationSelect").value;
    const count = parseInt(document.getElementById("adminQueueCount").value, 10);
    const source = document.getElementById("adminQueueSource").value;
    const msgDiv = document.getElementById("adminFeedbackMsg");

    if (!stationId) {
      alert("Please select a station first.");
      return;
    }

    try {
      const resp = await fetch("/api/admin/queue-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": this.adminKey
        },
        body: JSON.stringify({
          stationId: parseInt(stationId, 10),
          vehiclesWaiting: count,
          dataSource: source,
          reportedBy: "Authorized Admin Portal",
          isLiveSensor: true
        })
      });

      const data = await resp.json();
      if (resp.ok) {
        msgDiv.innerHTML = `<div style="background:#ecfdf5; color:#065f46; padding:8px; border-radius:6px; font-size:12px;">&check; Queue updated: ${count} vehicles waiting (~${data.estimatedWaitMinutes} min wait). Source: ${source}.</div>`;
        if (window.cngApp) window.cngApp.refreshCurrentView();
      } else {
        msgDiv.innerHTML = `<div style="background:#fee2e2; color:#991b1b; padding:8px; border-radius:6px; font-size:12px;">Error: ${data.error}</div>`;
      }
    } catch (e) {
      msgDiv.innerHTML = `<div style="color:#ef4444;">Failed to submit queue telemetry.</div>`;
    }
  }

  async submitPressureTelemetry() {
    const stationId = document.getElementById("adminStationSelect").value;
    const pressure = parseFloat(document.getElementById("adminPressureBar").value);
    const status = document.getElementById("adminSensorStatus").value;
    const source = document.getElementById("adminPressureSource").value;
    const msgDiv = document.getElementById("adminFeedbackMsg");

    if (!stationId || isNaN(pressure)) {
      alert("Please select a station and enter a valid pressure in bar.");
      return;
    }

    try {
      const resp = await fetch("/api/admin/pressure-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": this.adminKey
        },
        body: JSON.stringify({
          stationId: parseInt(stationId, 10),
          pressureBar: pressure,
          sensorStatus: status,
          dataSource: source,
          isLiveSensor: true
        })
      });

      const data = await resp.json();
      if (resp.ok) {
        msgDiv.innerHTML = `<div style="background:#ecfdf5; color:#065f46; padding:8px; border-radius:6px; font-size:12px;">&check; Pressure updated: ${pressure} bar (Status: ${status}). Source: ${source}.</div>`;
        if (window.cngApp) window.cngApp.refreshCurrentView();
      } else {
        msgDiv.innerHTML = `<div style="background:#fee2e2; color:#991b1b; padding:8px; border-radius:6px; font-size:12px;">Error: ${data.error}</div>`;
      }
    } catch (e) {
      msgDiv.innerHTML = `<div style="color:#ef4444;">Failed to submit pressure telemetry.</div>`;
    }
  }
}

window.adminPortal = new AdminPortal();

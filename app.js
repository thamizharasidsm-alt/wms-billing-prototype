/* Weighbridge Management System (WMS) Prototype Logic Engine */

// ========================================================
// 1. STATE & DATABASE SIMULATION
// ========================================================

const DEFAULT_MAIN_DB = {
  name: "MainDB",
  path: "C:\\WMS\\WMS.db",
  displayName: "Main Account DB",
  rate: 3.50,
  users: [
    { username: "admin", role: "Senior Operator / Admin", dbPath: "C:\\WMS\\WMS.db", securityLevel: "Level 3 (Read/Write/Rate Edit)", password: "main" }
  ],
  transactions: [
    {
      id: "RCT-MAIN-0001",
      vehNo: "TN-37-BY-1234",
      driverName: "Karthik Kumar",
      tareWeight: 8400,
      grossWeight: 22400,
      netWeight: 14000,
      rate: 3.50,
      amount: 49000.00,
      paymentMethod: "UPI",
      materialType: "Iron Ore",
      transportCompany: "VRL Logistics",
      timestamp: "2026-06-07 08:30:15",
      operator: "admin"
    },
    {
      id: "RCT-MAIN-0002",
      vehNo: "KA-51-MJ-6789",
      driverName: "Gurpreet Singh",
      tareWeight: 9100,
      grossWeight: 31200,
      netWeight: 22100,
      rate: 3.50,
      amount: 77350.00,
      paymentMethod: "Card",
      materialType: "Coal",
      transportCompany: "Deccan Carrier",
      timestamp: "2026-06-07 09:12:44",
      operator: "admin"
    }
  ],
  drafts: [
    {
      id: "DFT-MAIN-0001",
      vehNo: "MH-12-PQ-8888",
      driverName: "Rahul Sharma",
      tareWeight: 8500,
      timestamp: "2026-06-07 09:40:00",
      status: "LOADING"
    }
  ],
  suggestions: {
    vehicles: ["TN-37-BY-1234", "KA-51-MJ-6789", "MH-12-PQ-8888", "AP-03-XX-5555"],
    drivers: ["Karthik Kumar", "Gurpreet Singh", "Rahul Sharma", "M. K. Swamy"],
    materials: ["Coal", "Iron Ore", "Bauxite", "Sand", "Cement"],
    transports: ["VRL Logistics", "Deccan Carrier", "South Roadways", "Global Cargo"]
  },
  auditLogs: [
    { timestamp: "2026-06-07 08:00:00", user: "admin", action: "Database initialized", db: "C:\\WMS\\WMS.db" },
    { timestamp: "2026-06-07 08:02:10", user: "admin", action: "Operator Login", db: "C:\\WMS\\WMS.db" },
    { timestamp: "2026-06-07 08:30:15", user: "admin", action: "Transaction Created: RCT-MAIN-0001", db: "C:\\WMS\\WMS.db" },
    { timestamp: "2026-06-07 09:12:44", user: "admin", action: "Transaction Created: RCT-MAIN-0002", db: "C:\\WMS\\WMS.db" }
  ]
};

const DEFAULT_TEMP_DB = {
  name: "TempDB",
  path: "C:\\Temp\\TempWMS.db",
  displayName: "Temporary Cash DB",
  rate: 3.50,
  users: [
    { username: "cashier", role: "Cash Weighment Operator", dbPath: "C:\\Temp\\TempWMS.db", securityLevel: "Level 1 (Weighment & Collections)", password: "temp" }
  ],
  transactions: [
    {
      id: "RCT-TEMP-0001",
      vehNo: "KL-07-AA-9999",
      driverName: "Joseph George",
      tareWeight: 7800,
      grossWeight: 18200,
      netWeight: 10400,
      rate: 3.50,
      amount: 36400.00,
      paymentMethod: "Cash",
      materialType: "Sand",
      transportCompany: "Local Operator",
      timestamp: "2026-06-07 08:45:10",
      operator: "cashier"
    }
  ],
  drafts: [
    {
      id: "DFT-TEMP-0001",
      vehNo: "KA-04-BB-2222",
      driverName: "Siddharth",
      tareWeight: 8200,
      timestamp: "2026-06-07 09:20:00",
      status: "LOADING"
    }
  ],
  suggestions: {
    vehicles: ["KL-07-AA-9999", "KA-04-BB-2222", "DL-01-CZ-3333"],
    drivers: ["Joseph George", "Siddharth", "Vijay Nair"],
    materials: ["Sand", "Bricks", "Stone Chips"],
    transports: ["Local Operator", "Karnat Roadways"]
  },
  auditLogs: [
    { timestamp: "2026-06-07 08:00:00", user: "cashier", action: "Database initialized", db: "C:\\Temp\\TempWMS.db" },
    { timestamp: "2026-06-07 08:45:10", user: "cashier", action: "Transaction Created: RCT-TEMP-0001", db: "C:\\Temp\\TempWMS.db" }
  ]
};

// State variables
let activeDBName = "MainDB"; // Tracks whether connected to MainDB or TempDB
let db = null; // References current active DB state object
let loggedInUser = null; // Tracks current session user
let activeDevice = "android-view"; // Current main viewing tab

// Scale Simulation
let currentScaleWeight = 0;

// Auto-suggest context
let activeSuggestionInputId = null;

// ========================================================
// 2. INITIALIZATION
// ========================================================

document.addEventListener("DOMContentLoaded", () => {
  initDatabase();
  initViewSwitcher();
  initScaleSimulator();
  initAndroidUi();
  initWindowsUi();
  initWebUi();
  initOcrCamera();
  initUserAdmin();
  
  // Start simulated time
  setInterval(updateAndroidClock, 1000);
  updateAndroidClock();
  
  // Trigger UI display updates
  refreshConnectedUI();
  
  // Show welcome toast
  showToast("Welcome to WMS Interactive Design Prototype", "info");
});

function initDatabase() {
  // Load from local storage or reset to default
  if (!localStorage.getItem("wms_main_db")) {
    localStorage.setItem("wms_main_db", JSON.stringify(DEFAULT_MAIN_DB));
  }
  if (!localStorage.getItem("wms_temp_db")) {
    localStorage.setItem("wms_temp_db", JSON.stringify(DEFAULT_TEMP_DB));
  }

  // Ensure users list exists in both databases for backward compatibility
  let mainDbState = JSON.parse(localStorage.getItem("wms_main_db"));
  if (mainDbState && !mainDbState.users) {
    mainDbState.users = [
      { username: "admin", role: "Senior Operator / Admin", dbPath: "C:\\WMS\\WMS.db", securityLevel: "Level 3 (Read/Write/Rate Edit)", password: "main" }
    ];
    localStorage.setItem("wms_main_db", JSON.stringify(mainDbState));
  }
  let tempDbState = JSON.parse(localStorage.getItem("wms_temp_db"));
  if (tempDbState && !tempDbState.users) {
    tempDbState.users = [
      { username: "cashier", role: "Cash Weighment Operator", dbPath: "C:\\Temp\\TempWMS.db", securityLevel: "Level 1 (Weighment & Collections)", password: "temp" }
    ];
    localStorage.setItem("wms_temp_db", JSON.stringify(tempDbState));
  }

  // Load current active state
  activeDBName = localStorage.getItem("wms_active_db_name") || "MainDB";
  loadActiveDB();
  
  // Clean up any corrupted suggestions from previous runs
  if (db && db.suggestions && db.suggestions.transports && db.suggestions.drivers) {
    db.suggestions.transports = db.suggestions.transports.filter(t => !db.suggestions.drivers.includes(t));
    saveActiveDB();
  }
  
  // SOW UX: Always launch on login screens by default
  loggedInUser = null;
  localStorage.removeItem("wms_logged_in_user");
}

function loadActiveDB() {
  const raw = localStorage.getItem(activeDBName === "MainDB" ? "wms_main_db" : "wms_temp_db");
  db = JSON.parse(raw);
}

function saveActiveDB() {
  localStorage.setItem(activeDBName === "MainDB" ? "wms_main_db" : "wms_temp_db", JSON.stringify(db));
  
  // Mirror temporary collections analytics
  syncWebReports();
}

function switchDatabaseEnvironment(targetDBName, preserveSession = false) {
  activeDBName = targetDBName;
  localStorage.setItem("wms_active_db_name", activeDBName);
  loadActiveDB();
  
  // Update Header Elements
  document.getElementById("active-db-label").textContent = `DB: ${db.path}`;
  
  if (!preserveSession) {
    loggedInUser = null;
    localStorage.removeItem("wms_logged_in_user");
    logAuditEvent("Switched Database environment to " + db.path);
    showToast(`Switched environment to ${db.displayName}. Please sign in.`, "info");
  } else {
    logAuditEvent("Logged in to Database environment " + db.path);
    showToast(`Connected to ${db.displayName}`, "success");
  }
  
  refreshConnectedUI();
}

function refreshConnectedUI() {
  // Update Daily Rates on UI
  document.getElementById("mob-rate-display").textContent = `₹ ${db.rate.toFixed(2)} / KG`;
  document.getElementById("win-rate-display").textContent = `₹ ${db.rate.toFixed(2)} / KG`;
  document.getElementById("win-rate-large").textContent = `₹ ${db.rate.toFixed(2)}`;
  document.getElementById("win-rate-input").value = db.rate;
  document.getElementById("mob-rate-input-field").value = db.rate;
  
  // Update active database indicator paths
  document.getElementById("win-db-path-display").textContent = `Connected: ${db.path}`;
  document.getElementById("win-stat-active-db").textContent = activeDBName === "MainDB" ? "WMS.db" : "TempWMS.db";
  const webDbPathDisplay = document.getElementById("web-db-path-display");
  if (webDbPathDisplay) {
    webDbPathDisplay.textContent = `DB: ${db.path}`;
  }
  
  // User name updates
  const labelMobUser = document.getElementById("mob-user-display");
  const labelWinUser = document.getElementById("win-user-display");
  
  const winLoginLayout = document.getElementById("win-login-layout");
  const winMainLayout = document.getElementById("win-main-layout");

  if (loggedInUser) {
    const userDetail = getUserDetails(loggedInUser);
    const displayName = userDetail ? userDetail.username : loggedInUser;
    const designation = userDetail ? userDetail.role : "Operator";
    
    if (labelMobUser) labelMobUser.textContent = `${displayName} (${activeDBName === "MainDB" ? "Main" : "Temp"})`;
    if (labelWinUser) labelWinUser.textContent = designation;
    
    // Ensure screen layouts show logged-in states
    document.getElementById("android-screen-login").classList.remove("active");
    document.getElementById("android-screen-main").classList.add("active");
    
    if (winLoginLayout) winLoginLayout.classList.add("hidden");
    if (winMainLayout) winMainLayout.classList.remove("hidden");
  } else {
    // If no session, reset to login screens
    document.getElementById("android-screen-login").classList.add("active");
    document.getElementById("android-screen-main").classList.remove("active");
    
    if (winLoginLayout) winLoginLayout.classList.remove("hidden");
    if (winMainLayout) winMainLayout.classList.add("hidden");
  }

  // Populate Draft selectors
  populateDraftDropdowns();
  
  // Update stats counters
  updateStatsCounters();
  
  // Reload Table Reports
  refreshReportsTables();
  refreshAuditLogsTable();
  
  // Sync cross database lists
  syncWebReports();

  // Reload User Table reports
  refreshUserTable();
}

function logAuditEvent(action) {
  const timestamp = getFormattedTimestamp();
  db.auditLogs.unshift({
    timestamp: timestamp,
    user: loggedInUser || "System",
    action: action,
    db: db.path,
    ip: "127.0.0.1 (Local)"
  });
  saveActiveDB();
  refreshAuditLogsTable();
}

// ========================================================
// 3. UI VIEW & TABS CONFIGURATION
// ========================================================

function initViewSwitcher() {
  document.body.className = "active-view-android-view";
  const switchBtns = document.querySelectorAll(".switch-btn");
  const panels = document.querySelectorAll(".view-panel");

  switchBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      
      switchBtns.forEach(b => b.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));
      
      btn.classList.add("active");
      
      // Delay display slightly for smooth translate animation
      const activePanel = document.getElementById(target);
      activePanel.classList.add("active");
      
      activeDevice = target;
      document.body.className = `active-view-${target}`;
      
      // If Web View, redraw charts
      if (target === "web-view") {
        syncWebReports();
      }
      
      showToast(`Switched view to ${btn.innerText.trim()}`, "info");
    });
  });
  
  // DB toggle button on shell header
  document.getElementById("btn-toggle-account").addEventListener("click", () => {
    const nextDB = activeDBName === "MainDB" ? "TempDB" : "MainDB";
    switchDatabaseEnvironment(nextDB, false);
  });

  // Hamburger Menu toggle for Mobile viewports
  const hamburgerBtn = document.getElementById("shell-hamburger");
  const deviceSwitcher = document.querySelector(".device-switcher");

  if (hamburgerBtn && deviceSwitcher) {
    hamburgerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deviceSwitcher.classList.toggle("show");
    });

    // Close menu when clicking switcher links
    const switcherBtns = deviceSwitcher.querySelectorAll(".switch-btn");
    switcherBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        deviceSwitcher.classList.remove("show");
      });
    });

    // Close menu when clicking anywhere else
    document.addEventListener("click", () => {
      deviceSwitcher.classList.remove("show");
    });
  }
}

function updateAndroidClock() {
  const timeLabel = document.getElementById("android-time");
  if (timeLabel) {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    timeLabel.textContent = `${hours}:${minutes}`;
  }
}

// ========================================================
// 4. WEIGHBRIDGE SCALE SIMULATOR
// ========================================================

function initScaleSimulator() {
  const scaleSlider = document.getElementById("win-scale-sim-range");
  const scaleLcd = document.getElementById("win-scale-lcd");

  scaleSlider.addEventListener("input", (e) => {
    currentScaleWeight = parseInt(e.target.value);
    
    // Update digital LCD indicator
    scaleLcd.textContent = String(currentScaleWeight).padStart(5, '0');
    
    // Update active calculations dynamically if gross or tare weight is being filled
    updateWeightsOnActiveForms();
  });
}

// Helper to set scale weight from presets
window.setSimScale = function(val) {
  const scaleSlider = document.getElementById("win-scale-sim-range");
  const scaleLcd = document.getElementById("win-scale-lcd");
  
  scaleSlider.value = val;
  currentScaleWeight = val;
  scaleLcd.textContent = String(val).padStart(5, '0');
  
  updateWeightsOnActiveForms();
  showToast(`Simulated weight scale set to ${val} KG`, "info");
};

function updateWeightsOnActiveForms() {
  // Update preview panel scale readouts
}

// ========================================================
// 5. ANDROID APP ACTIONS & WORKFLOWS
// ========================================================

function initAndroidUi() {
  // Login Handler
  document.getElementById("btn-mob-login").addEventListener("click", () => {
    const user = document.getElementById("mob-username").value.trim();
    const pass = document.getElementById("mob-password").value.trim();
    
    // Get account selection
    const mobMainSelected = document.getElementById("mob-radio-main").checked;
    const targetEnv = mobMainSelected ? "MainDB" : "TempDB";
    
    // Validate credentials mockup using dynamic list
    const isUserValid = validateLoginCredentials(user, pass, targetEnv);
    if (isUserValid) {
      loggedInUser = user;
    } else {
      showToast("Invalid Credentials. Check the hints or database environment!", "danger");
      return;
    }
    
    localStorage.setItem("wms_logged_in_user", loggedInUser);
    switchDatabaseEnvironment(targetEnv, true);
  });

  // Logout Handler
  document.getElementById("btn-mob-logout").addEventListener("click", () => {
    logAuditEvent("Operator Logged Out");
    loggedInUser = null;
    localStorage.removeItem("wms_logged_in_user");
    refreshConnectedUI();
    showToast("Logged out successfully", "info");
  });

  // Navigation menu tabs switching
  const mobNavItems = document.querySelectorAll(".android-navigation .nav-item");
  mobNavItems.forEach(item => {
    item.addEventListener("click", () => {
      const tabTarget = item.getAttribute("data-tab");
      switchAndroidTab(tabTarget);
    });
  });

  // Quick Action triggers
  document.getElementById("btn-action-arrival").addEventListener("click", () => {
    switchAndroidTab("mob-tab-arrival");
  });
  document.getElementById("btn-action-return").addEventListener("click", () => {
    switchAndroidTab("mob-tab-return");
  });
  document.getElementById("btn-action-drafts").addEventListener("click", () => {
    switchAndroidTab("mob-tab-drafts");
    renderMobileDraftsList();
  });
  document.getElementById("btn-action-reports").addEventListener("click", () => {
    switchAndroidTab("mob-tab-reports");
  });

  // Back button event links
  document.querySelectorAll(".back-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const backTarget = btn.getAttribute("data-back");
      switchAndroidTab(backTarget);
    });
  });

  // Autocomplete bindings for Stage 1 Arrival
  setupAutocomplete("mob-arr-veh", "mob-arr-veh-suggestions", "vehicles", (val) => {
    // Check if we have a known driver for this vehicle
    const match = db.transactions.find(tx => tx.vehNo === val);
    if (match) {
      document.getElementById("mob-arr-driver").value = match.driverName;
      showToast(`Auto-filled known driver: ${match.driverName}`, "info");
    }
  });
  setupAutocomplete("mob-arr-driver", "mob-arr-driver-suggestions", "drivers");

  // Read scale triggers (Mobile gets simulated scale directly)
  document.getElementById("btn-mob-read-tare").addEventListener("click", () => {
    document.getElementById("mob-arr-tare").value = currentScaleWeight;
    showToast(`Read tare weight from scale: ${currentScaleWeight} KG`, "success");
  });
  
  document.getElementById("btn-mob-read-gross").addEventListener("click", () => {
    document.getElementById("mob-ret-gross").value = currentScaleWeight;
    calculateMobileNetWeight();
    showToast(`Read gross weight from scale: ${currentScaleWeight} KG`, "success");
  });

  // Input listener on gross weight to calculate live net/billing
  document.getElementById("mob-ret-gross").addEventListener("input", calculateMobileNetWeight);

  // Stage 1 Save Draft
  document.getElementById("btn-mob-save-draft").addEventListener("click", () => {
    const vehNo = document.getElementById("mob-arr-veh").value.trim().toUpperCase();
    const driverName = document.getElementById("mob-arr-driver").value.trim();
    const tareWeight = parseInt(document.getElementById("mob-arr-tare").value);

    if (!vehNo || isNaN(tareWeight)) {
      showToast("Please enter Vehicle Number and Tare Weight", "danger");
      return;
    }

    // Save as draft
    const prefix = activeDBName === "MainDB" ? "DFT-MAIN" : "DFT-TEMP";
    const draftId = `${prefix}-${String(db.drafts.length + 1).padStart(4, '0')}`;
    
    const newDraft = {
      id: draftId,
      vehNo: vehNo,
      driverName: driverName || "Unknown",
      tareWeight: tareWeight,
      timestamp: getFormattedTimestamp(),
      status: "LOADING"
    };

    db.drafts.push(newDraft);
    
    // Add vehicle/driver to suggestions if not exists
    appendSuggestions(vehNo, driverName);
    
    logAuditEvent(`Draft created: ${draftId} for Vehicle ${vehNo}`);
    saveActiveDB();
    refreshConnectedUI();
    
    // Reset inputs
    document.getElementById("mob-arr-veh").value = "";
    document.getElementById("mob-arr-driver").value = "";
    document.getElementById("mob-arr-tare").value = "";
    
    showToast("Weighment draft saved successfully", "success");
    switchAndroidTab("mob-tab-dashboard");
  });

  // Stage 2: Selection of active draft
  document.getElementById("mob-ret-draft-select").addEventListener("change", (e) => {
    const draftId = e.target.value;
    const formFields = document.getElementById("mob-ret-form-fields");
    
    if (!draftId) {
      formFields.classList.add("disabled-opacity");
      return;
    }

    const draft = db.drafts.find(d => d.id === draftId);
    if (!draft) return;

    formFields.classList.remove("disabled-opacity");

    // Populate static fields
    document.getElementById("lbl-mob-ret-veh").textContent = draft.vehNo;
    document.getElementById("lbl-mob-ret-driver").textContent = draft.driverName;
    document.getElementById("lbl-mob-ret-tare").textContent = `${draft.tareWeight} KG`;
    
    // Reset return fields
    document.getElementById("mob-ret-transport").value = "";
    document.getElementById("mob-ret-material").value = "";
    document.getElementById("mob-ret-gross").value = "";
    document.getElementById("mob-lbl-net").textContent = "-";
    document.getElementById("mob-lbl-rate").textContent = `₹ ${db.rate.toFixed(2)}`;
    document.getElementById("mob-lbl-amount").textContent = "₹ 0.00";
  });

  // Autocomplete bindings for Stage 2 Return
  setupAutocomplete("mob-ret-transport", "mob-ret-transport-suggestions", "transports");
  setupAutocomplete("mob-ret-material", "mob-ret-material-suggestions", "materials");

  // Payment option switches
  const payOpts = document.querySelectorAll(".payment-method-selector .pay-opt");
  payOpts.forEach(btn => {
    btn.addEventListener("click", () => {
      payOpts.forEach(o => o.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // Save transaction handler
  document.getElementById("btn-mob-complete-transaction").addEventListener("click", () => {
    const draftId = document.getElementById("mob-ret-draft-select").value;
    if (!draftId) return;

    const draft = db.drafts.find(d => d.id === draftId);
    if (!draft) return;

    const transport = document.getElementById("mob-ret-transport").value.trim();
    const material = document.getElementById("mob-ret-material").value.trim();
    const gross = parseInt(document.getElementById("mob-ret-gross").value);

    if (!material || isNaN(gross)) {
      showToast("Please enter Material Type and Gross Weight", "danger");
      return;
    }

    if (gross <= draft.tareWeight) {
      showToast("Gross Weight must be greater than Tare Weight", "danger");
      return;
    }

    const net = gross - draft.tareWeight;
    const amt = net * db.rate;
    const payMethod = document.querySelector(".payment-method-selector .pay-opt.active").getAttribute("data-method");

    // Add to suggestions
    appendSuggestions(null, null, material, transport);

    // Create completed transaction
    const prefix = activeDBName === "MainDB" ? "RCT-MAIN" : "RCT-TEMP";
    const txId = `${prefix}-${String(db.transactions.length + 1).padStart(4, '0')}`;
    
    const newTx = {
      id: txId,
      vehNo: draft.vehNo,
      driverName: draft.driverName,
      tareWeight: draft.tareWeight,
      grossWeight: gross,
      netWeight: net,
      rate: db.rate,
      amount: amt,
      paymentMethod: payMethod,
      materialType: material,
      transportCompany: transport || "Self Transport",
      timestamp: getFormattedTimestamp(),
      operator: loggedInUser
    };

    // Remove draft
    db.drafts = db.drafts.filter(d => d.id !== draftId);
    db.transactions.push(newTx);
    
    logAuditEvent(`Transaction completed: ${txId} for Vehicle ${draft.vehNo}`);
    saveActiveDB();
    refreshConnectedUI();

    // Trigger Print Receipt Preview
    showThermalReceipt(newTx);
    
    // Close forms
    document.getElementById("mob-ret-draft-select").value = "";
    document.getElementById("mob-ret-form-fields").classList.add("disabled-opacity");
    switchAndroidTab("mob-tab-dashboard");
  });

  // Mobile Rate configuration button
  document.getElementById("btn-mob-edit-rate").addEventListener("click", () => {
    document.getElementById("mob-rate-input-field").value = db.rate;
    document.getElementById("rate-modal").classList.add("active");
  });

  document.getElementById("btn-mob-save-rate-modal").addEventListener("click", () => {
    const val = parseFloat(document.getElementById("mob-rate-input-field").value);
    if (!isNaN(val) && val > 0) {
      db.rate = val;
      logAuditEvent(`Daily rate updated to ₹${val.toFixed(2)} / KG`);
      saveActiveDB();
      refreshConnectedUI();
      document.getElementById("rate-modal").classList.remove("active");
      showToast(`Daily Billing Rate set to ₹${val.toFixed(2)}/KG`, "success");
    }
  });

  document.getElementById("btn-close-rate-modal").addEventListener("click", () => {
    document.getElementById("rate-modal").classList.remove("active");
  });

  // Mobile reports page switching
  document.getElementById("btn-mob-rep-ops").addEventListener("click", (e) => {
    setMobileReportActiveBtn(e.target);
    renderMobileReportsTable("weighments");
  });
  document.getElementById("btn-mob-rep-fin").addEventListener("click", (e) => {
    setMobileReportActiveBtn(e.target);
    renderMobileReportsTable("collections");
  });
  document.getElementById("btn-mob-rep-audit").addEventListener("click", (e) => {
    setMobileReportActiveBtn(e.target);
    renderMobileReportsTable("audit");
  });
}

function switchAndroidTab(tabId) {
  // Hide active tabs
  const tabs = document.querySelectorAll(".mob-tab-panel");
  tabs.forEach(t => t.classList.remove("active"));
  
  // Show target tab
  const targetTab = document.getElementById(tabId);
  if (targetTab) targetTab.classList.add("active");
  
  // Update nav item highlighting
  const navItems = document.querySelectorAll(".android-navigation .nav-item");
  navItems.forEach(item => {
    const tabName = item.getAttribute("data-tab");
    if (tabName === tabId || (tabId === "mob-tab-dashboard" && tabName === "mob-tab-dashboard")) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  if (tabId === "mob-tab-reports") {
    // Default to weighment table
    setMobileReportActiveBtn(document.getElementById("btn-mob-rep-ops"));
    renderMobileReportsTable("weighments");
  }
}

function calculateMobileNetWeight() {
  const tareText = document.getElementById("lbl-mob-ret-tare").textContent;
  const tare = parseInt(tareText) || 0;
  const gross = parseInt(document.getElementById("mob-ret-gross").value) || 0;
  const lblNet = document.getElementById("mob-lbl-net");
  const lblAmount = document.getElementById("mob-lbl-amount");

  if (gross > tare) {
    const net = gross - tare;
    const amount = net * db.rate;
    lblNet.textContent = net;
    lblAmount.textContent = `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    lblNet.textContent = "-";
    lblAmount.textContent = "₹ 0.00";
  }
}

function renderMobileDraftsList() {
  const container = document.getElementById("mob-drafts-list-container");
  container.innerHTML = "";
  
  if (db.drafts.length === 0) {
    container.innerHTML = `<div class="neu-card text-center"><p class="text-muted">No pending drafts found.</p></div>`;
    return;
  }

  db.drafts.forEach(draft => {
    const card = document.createElement("div");
    card.className = "neu-card draft-card-mob";
    card.innerHTML = `
      <div class="draft-info">
        <span class="draft-veh">${draft.vehNo}</span>
        <span class="draft-driver">👤 ${draft.driverName} &bull; Tare: ${draft.tareWeight} kg</span>
      </div>
      <div class="draft-meta">
        <span>LOADING</span>
      </div>
    `;
    card.addEventListener("click", () => {
      // Direct navigate to return stage
      switchAndroidTab("mob-tab-return");
      document.getElementById("mob-ret-draft-select").value = draft.id;
      // Trigger change event to populate
      document.getElementById("mob-ret-draft-select").dispatchEvent(new Event("change"));
    });
    container.appendChild(card);
  });
}

function setMobileReportActiveBtn(activeBtn) {
  const parent = activeBtn.parentElement;
  parent.querySelectorAll("button").forEach(b => b.classList.remove("active"));
  activeBtn.classList.add("active");
}

function renderMobileReportsTable(type) {
  const table = document.getElementById("mob-table-data");
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");
  
  thead.innerHTML = "";
  tbody.innerHTML = "";

  if (type === "weighments") {
    thead.innerHTML = `
      <tr>
        <th>Vehicle</th>
        <th>Material</th>
        <th>Net (kg)</th>
        <th>Billing</th>
      </tr>
    `;
    if (db.transactions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No records</td></tr>`;
      return;
    }
    db.transactions.forEach(tx => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="font-mono"><b>${tx.vehNo}</b></td>
        <td>${tx.materialType}</td>
        <td class="font-mono">${tx.netWeight}</td>
        <td class="font-mono">₹${tx.amount.toFixed(0)}</td>
      `;
      tbody.appendChild(row);
    });
  } else if (type === "collections") {
    thead.innerHTML = `
      <tr>
        <th>Receipt</th>
        <th>Pay Mode</th>
        <th>Amount</th>
      </tr>
    `;
    if (db.transactions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No collections</td></tr>`;
      return;
    }
    db.transactions.forEach(tx => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="font-mono">${tx.id.substring(9)}</td>
        <td>${tx.paymentMethod}</td>
        <td class="font-mono">₹${tx.amount.toFixed(2)}</td>
      `;
      tbody.appendChild(row);
    });
  } else if (type === "audit") {
    thead.innerHTML = `
      <tr>
        <th>Time</th>
        <th>Action</th>
      </tr>
    `;
    if (db.auditLogs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="2" class="text-center text-muted">No logs</td></tr>`;
      return;
    }
    // Limit to 5 logs on mobile
    db.auditLogs.slice(0, 8).forEach(log => {
      const row = document.createElement("tr");
      // Extract time only
      const time = log.timestamp.split(" ")[1];
      row.innerHTML = `
        <td class="font-mono text-muted">${time}</td>
        <td>${log.action}</td>
      `;
      tbody.appendChild(row);
    });
  }
}

// ========================================================
// 6. WINDOWS APP ACTIONS & WORKFLOWS
// ========================================================

function initWindowsUi() {
  // Windows Login Handler
  const winLoginBtn = document.getElementById("btn-win-login");
  if (winLoginBtn) {
    winLoginBtn.addEventListener("click", () => {
      const user = document.getElementById("win-username").value.trim();
      const pass = document.getElementById("win-password").value.trim();
      const winMainSelected = document.getElementById("win-radio-main").checked;
      const targetEnv = winMainSelected ? "MainDB" : "TempDB";
      
      const isUserValid = validateLoginCredentials(user, pass, targetEnv);
      if (isUserValid) {
        loggedInUser = user;
      } else {
        showToast("Invalid credentials. Enter registered user for this database environment.", "danger");
        return;
      }
      
      localStorage.setItem("wms_logged_in_user", loggedInUser);
      switchDatabaseEnvironment(targetEnv, true);
    });
  }

  // Sidebar navigation panel loader
  const winNavItems = document.querySelectorAll(".win-nav-item");
  const winPanes = document.querySelectorAll(".win-pane");

  winNavItems.forEach(item => {
    item.addEventListener("click", () => {
      const targetPane = item.getAttribute("data-win-pane");
      
      winNavItems.forEach(i => i.classList.remove("active"));
      winPanes.forEach(p => p.classList.remove("active"));
      
      item.classList.add("active");
      document.getElementById(targetPane).classList.add("active");
      
      showToast(`Navigated to ${item.innerText.trim()}`, "info");
    });
  });

  // Windows Logout button
  document.getElementById("btn-win-logout").addEventListener("click", () => {
    logAuditEvent("Operator Logged Out (Windows)");
    loggedInUser = null;
    localStorage.removeItem("wms_logged_in_user");
    refreshConnectedUI();
    showToast("Logged out successfully", "info");
  });

  // Windows Daily Rate Save
  document.getElementById("btn-win-save-rate").addEventListener("click", () => {
    const val = parseFloat(document.getElementById("win-rate-input").value);
    if (!isNaN(val) && val > 0) {
      db.rate = val;
      logAuditEvent(`Daily rate updated to ₹${val.toFixed(2)} / KG (Windows)`);
      saveActiveDB();
      refreshConnectedUI();
      showToast(`Daily Rate updated to ₹${val.toFixed(2)}/KG`, "success");
    } else {
      showToast("Please enter a valid rate amount", "danger");
    }
  });

  // Stage 1 Auto-suggestions bindings for Windows
  setupAutocomplete("win-arr-veh", "win-arr-veh-suggestions", "vehicles", (val) => {
    const match = db.transactions.find(tx => tx.vehNo === val);
    if (match) {
      document.getElementById("win-arr-driver").value = match.driverName;
      showToast(`Auto-filled known driver: ${match.driverName}`, "info");
    }
  });
  setupAutocomplete("win-arr-driver", "win-arr-driver-suggestions", "drivers");

  // Read scale bindings (Windows gets simulated slider value)
  document.getElementById("btn-win-read-tare").addEventListener("click", () => {
    document.getElementById("win-arr-tare").value = currentScaleWeight;
    showToast(`Scale reading acquired: ${currentScaleWeight} KG`, "success");
  });

  document.getElementById("btn-win-read-gross").addEventListener("click", () => {
    document.getElementById("win-ret-gross").value = currentScaleWeight;
    calculateWindowsNetWeight();
    showToast(`Scale reading acquired: ${currentScaleWeight} KG`, "success");
  });

  document.getElementById("win-ret-gross").addEventListener("input", calculateWindowsNetWeight);

  // Stage 1 Save Draft (Windows)
  document.getElementById("btn-win-save-draft").addEventListener("click", () => {
    const vehNo = document.getElementById("win-arr-veh").value.trim().toUpperCase();
    const driverName = document.getElementById("win-arr-driver").value.trim();
    const tareWeight = parseInt(document.getElementById("win-arr-tare").value);

    if (!vehNo || isNaN(tareWeight)) {
      showToast("Please enter Vehicle Number and Tare Weight", "danger");
      return;
    }

    const prefix = activeDBName === "MainDB" ? "DFT-MAIN" : "DFT-TEMP";
    const draftId = `${prefix}-${String(db.drafts.length + 1).padStart(4, '0')}`;
    
    const newDraft = {
      id: draftId,
      vehNo: vehNo,
      driverName: driverName || "Unknown",
      tareWeight: tareWeight,
      timestamp: getFormattedTimestamp(),
      status: "LOADING"
    };

    db.drafts.push(newDraft);
    
    appendSuggestions(vehNo, driverName);
    
    logAuditEvent(`Draft created: ${draftId} for Vehicle ${vehNo} (Windows)`);
    saveActiveDB();
    refreshConnectedUI();

    // Reset Inputs
    document.getElementById("win-arr-veh").value = "";
    document.getElementById("win-arr-driver").value = "";
    document.getElementById("win-arr-tare").value = "";

    showToast(`Draft transaction ${draftId} created`, "success");
  });

  // Stage 2 Return Selection dropdown
  document.getElementById("win-ret-draft-select").addEventListener("change", (e) => {
    const draftId = e.target.value;
    const fieldsContainer = document.getElementById("win-ret-fields-container");

    if (!draftId) {
      fieldsContainer.classList.add("disabled-opacity");
      return;
    }

    const draft = db.drafts.find(d => d.id === draftId);
    if (!draft) return;

    fieldsContainer.classList.remove("disabled-opacity");

    // Populate metadata
    document.getElementById("lbl-win-ret-veh").textContent = draft.vehNo;
    document.getElementById("lbl-win-ret-driver").textContent = draft.driverName;
    document.getElementById("lbl-win-ret-tare").textContent = draft.tareWeight;

    // Reset weights
    document.getElementById("win-ret-transport").value = "";
    document.getElementById("win-ret-material").value = "";
    document.getElementById("win-ret-gross").value = "";
    document.getElementById("win-lbl-net").textContent = "-";
    document.getElementById("win-lbl-rate").textContent = `₹ ${db.rate.toFixed(2)}`;
    document.getElementById("win-lbl-amount").textContent = "₹ 0.00";
  });

  // Stage 2 Auto-suggestions
  setupAutocomplete("win-ret-transport", "win-ret-transport-suggestions", "transports");
  setupAutocomplete("win-ret-material", "win-ret-material-suggestions", "materials");

  // Stage 2 Completion (Windows)
  document.getElementById("btn-win-complete").addEventListener("click", () => {
    const draftId = document.getElementById("win-ret-draft-select").value;
    if (!draftId) return;

    const draft = db.drafts.find(d => d.id === draftId);
    if (!draft) return;

    const transport = document.getElementById("win-ret-transport").value.trim();
    const material = document.getElementById("win-ret-material").value.trim();
    const gross = parseInt(document.getElementById("win-ret-gross").value);

    if (!material || isNaN(gross)) {
      showToast("Please enter Material Type and Gross Weight", "danger");
      return;
    }

    if (gross <= draft.tareWeight) {
      showToast("Gross Weight must exceed Tare Weight", "danger");
      return;
    }

    const net = gross - draft.tareWeight;
    const amt = net * db.rate;
    
    // Get radio button value
    const payMethod = document.querySelector('input[name="win-pay-method"]:checked').value;

    appendSuggestions(null, null, material, transport);

    const prefix = activeDBName === "MainDB" ? "RCT-MAIN" : "RCT-TEMP";
    const txId = `${prefix}-${String(db.transactions.length + 1).padStart(4, '0')}`;

    const newTx = {
      id: txId,
      vehNo: draft.vehNo,
      driverName: draft.driverName,
      tareWeight: draft.tareWeight,
      grossWeight: gross,
      netWeight: net,
      rate: db.rate,
      amount: amt,
      paymentMethod: payMethod,
      materialType: material,
      transportCompany: transport || "Self Transport",
      timestamp: getFormattedTimestamp(),
      operator: loggedInUser
    };

    db.drafts = db.drafts.filter(d => d.id !== draftId);
    db.transactions.push(newTx);

    logAuditEvent(`Transaction completed: ${txId} for Vehicle ${draft.vehNo} (Windows)`);
    saveActiveDB();
    refreshConnectedUI();

    showThermalReceipt(newTx);

    // Reset dropdown and layout
    document.getElementById("win-ret-draft-select").value = "";
    document.getElementById("win-ret-fields-container").classList.add("disabled-opacity");
  });

  // Windows Search Engine
  document.getElementById("btn-win-search").addEventListener("click", executeWindowsSearch);
  document.getElementById("win-search-query").addEventListener("keyup", (e) => {
    if (e.key === "Enter") executeWindowsSearch();
  });
  
  // Windows Report Tabs togglers
  const reportTabs = document.querySelectorAll(".win-tab-btn");
  reportTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      reportTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      const text = tab.textContent;
      if (text.includes("Weighment")) {
        renderWindowsReportsTable("weighments");
      } else if (text.includes("Financial")) {
        renderWindowsReportsTable("collections");
      } else {
        renderWindowsReportsTable("drafts");
      }
    });
  });

  // Export handlers
  document.getElementById("btn-win-export-csv").addEventListener("click", triggerCsvExport);
  document.getElementById("btn-win-export-pdf").addEventListener("click", () => {
    showToast("PDF report generated and ready for thermal printer", "success");
    // Trigger window printing simulation
    alert("System Print Dialog simulated: PDF compiled for thermal or A4 page width.");
  });
}

function calculateWindowsNetWeight() {
  const tare = parseInt(document.getElementById("lbl-win-ret-tare").textContent) || 0;
  const gross = parseInt(document.getElementById("win-ret-gross").value) || 0;
  
  const lblNet = document.getElementById("win-lbl-net");
  const lblAmount = document.getElementById("win-lbl-amount");

  if (gross > tare) {
    const net = gross - tare;
    const amount = net * db.rate;
    lblNet.textContent = net;
    lblAmount.textContent = `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    lblNet.textContent = "-";
    lblAmount.textContent = "₹ 0.00";
  }
}

function executeWindowsSearch() {
  const query = document.getElementById("win-search-query").value.trim().toLowerCase();
  const materialFilter = document.getElementById("win-search-filter-material").value;
  const startDate = document.getElementById("win-search-date-start").value;
  const endDate = document.getElementById("win-search-date-end").value;

  const resultsBody = document.getElementById("win-search-results-body");
  resultsBody.innerHTML = "";

  const filtered = db.transactions.filter(tx => {
    // Query search
    const matchQuery = !query || 
      tx.id.toLowerCase().includes(query) ||
      tx.vehNo.toLowerCase().includes(query) ||
      tx.driverName.toLowerCase().includes(query) ||
      tx.materialType.toLowerCase().includes(query) ||
      tx.transportCompany.toLowerCase().includes(query);

    // Material Filter
    const matchMaterial = !materialFilter || tx.materialType === materialFilter;

    // Date range
    let matchDate = true;
    if (startDate || endDate) {
      const txDate = new Date(tx.timestamp.split(" ")[0]);
      if (startDate) {
        matchDate = matchDate && txDate >= new Date(startDate);
      }
      if (endDate) {
        matchDate = matchDate && txDate <= new Date(endDate);
      }
    }

    return matchQuery && matchMaterial && matchDate;
  });

  if (filtered.length === 0) {
    resultsBody.innerHTML = `<tr><td colspan="11" class="text-center text-muted">No matching transactions found.</td></tr>`;
    return;
  }

  filtered.forEach(tx => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${tx.id.split("-")[2]}</td>
      <td class="font-mono">${tx.id}</td>
      <td class="font-mono"><b>${tx.vehNo}</b></td>
      <td>${tx.driverName}</td>
      <td>
        <span class="material-val">${tx.materialType}</span>
      </td>
      <td class="font-mono">${tx.netWeight} kg</td>
      <td class="font-mono">₹${tx.rate.toFixed(2)}</td>
      <td class="font-mono">₹${tx.amount.toFixed(2)}</td>
      <td><span class="win-badge green-pulse">${tx.paymentMethod}</span></td>
      <td class="text-muted">${tx.timestamp}</td>
      <td>
        <button class="win-btn win-btn-sm" onclick="editTransactionMaterial('${tx.id}')">✏️ Edit</button>
        <button class="win-btn win-btn-sm" onclick="reprintReceipt('${tx.id}')">🖨️ Print</button>
      </td>
    `;
    resultsBody.appendChild(row);
  });
  
  showToast(`Found ${filtered.length} matching transactions`, "success");
}

// Global scope window methods for row-level edits and prints
window.editTransactionMaterial = function(txId) {
  const transaction = db.transactions.find(t => t.id === txId);
  if (!transaction) return;

  // SOW Rule 19: Only Material Type is editable.
  // Prompt user for new material type
  const currentMaterial = transaction.materialType;
  const newMaterial = prompt(`SOW Rules: Fields Locked!\nOnly Material Type is editable.\n\nEdit Material Type for Vehicle ${transaction.vehNo}:\nOriginal: ${currentMaterial}`, currentMaterial);
  
  if (newMaterial !== null && newMaterial.trim() !== "" && newMaterial.trim() !== currentMaterial) {
    transaction.materialType = newMaterial.trim();
    logAuditEvent(`Edited Material Type from "${currentMaterial}" to "${newMaterial.trim()}" on Transaction ${txId}`);
    saveActiveDB();
    refreshConnectedUI();
    executeWindowsSearch();
    showToast(`Material updated to ${newMaterial.trim()}`, "success");
  }
};

window.reprintReceipt = function(txId) {
  const transaction = db.transactions.find(t => t.id === txId);
  if (transaction) {
    logAuditEvent(`Receipt Reprinted: ${txId}`);
    showThermalReceipt(transaction);
    showToast("Receipt preview opened", "info");
  }
};

// ========================================================
// 7. WEB ADMIN CONSOLE AND ANALYTICS
// ========================================================

function initWebUi() {
  // Handles syncing records from localStorage to web isolation grids
  syncWebReports();

  // Tab switcher for Web Admin Console
  const webLinks = document.querySelectorAll(".web-links a");
  const webPanes = document.querySelectorAll(".web-pane-content");

  webLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      
      // Remove active from links
      webLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      
      // Hide all panes
      webPanes.forEach(p => p.classList.add("hidden"));
      
      // Show clicked pane
      const href = link.getAttribute("href");
      if (href === "#web-dash") {
        document.getElementById("web-pane-dash").classList.remove("hidden");
        syncWebReports(); // redraw charts
      } else if (href === "#web-users") {
        document.getElementById("web-pane-users").classList.remove("hidden");
      } else if (href === "#web-audit") {
        document.getElementById("web-pane-audit").classList.remove("hidden");
        renderCombinedAuditLogs();
      }
    });
  });

  const exportAuditBtn = document.getElementById("btn-web-export-audit");
  if (exportAuditBtn) {
    exportAuditBtn.addEventListener("click", () => {
      showToast("Combined audit logs exported to admin reports folder", "success");
    });
  }
}

function renderCombinedAuditLogs() {
  const mainRaw = JSON.parse(localStorage.getItem("wms_main_db") || JSON.stringify(DEFAULT_MAIN_DB));
  const tempRaw = JSON.parse(localStorage.getItem("wms_temp_db") || JSON.stringify(DEFAULT_TEMP_DB));
  const tbody = document.getElementById("web-table-combined-audit");
  
  if (!tbody) return;
  tbody.innerHTML = "";

  // Combine both logs and sort by timestamp descending
  const combined = [];
  mainRaw.auditLogs.forEach(l => combined.push({...l, dbLabel: "Main DB"}));
  tempRaw.auditLogs.forEach(l => combined.push({...l, dbLabel: "Temp DB"}));
  
  combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (combined.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No logs recorded.</td></tr>`;
    return;
  }

  combined.forEach(log => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="font-mono text-muted">${log.timestamp}</td>
      <td><b>${log.user}</b></td>
      <td class="font-mono font-sm" style="font-size: 0.72rem; color: ${log.dbLabel === 'Main DB' ? 'var(--color-primary)' : 'var(--color-warning)'}">${log.db}</td>
      <td><code>${log.action}</code></td>
      <td><span class="win-badge green-pulse">Verified</span></td>
    `;
    tbody.appendChild(row);
  });
}

function syncWebReports() {
  const mainRaw = JSON.parse(localStorage.getItem("wms_main_db") || JSON.stringify(DEFAULT_MAIN_DB));
  const tempRaw = JSON.parse(localStorage.getItem("wms_temp_db") || JSON.stringify(DEFAULT_TEMP_DB));

  const mainTable = document.getElementById("web-table-main-db");
  const tempTable = document.getElementById("web-table-temp-db");

  if (!mainTable || !tempTable) return;

  mainTable.innerHTML = "";
  tempTable.innerHTML = "";

  // Main collections calculate
  let mainTotal = 0;
  mainRaw.transactions.forEach(tx => {
    mainTotal += tx.amount;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="font-mono">${tx.id}</td>
      <td class="font-mono"><b>${tx.vehNo}</b></td>
      <td class="font-mono">${tx.netWeight} kg</td>
      <td class="font-mono">₹${tx.amount.toFixed(2)}</td>
      <td><span class="win-badge green-pulse">${tx.paymentMethod}</span></td>
    `;
    mainTable.appendChild(row);
  });

  // Temp collections calculate
  let tempTotal = 0;
  tempRaw.transactions.forEach(tx => {
    tempTotal += tx.amount;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="font-mono">${tx.id}</td>
      <td class="font-mono"><b>${tx.vehNo}</b></td>
      <td class="font-mono">${tx.netWeight} kg</td>
      <td class="font-mono">₹${tx.amount.toFixed(2)}</td>
      <td><span class="win-badge green-pulse">${tx.paymentMethod}</span></td>
    `;
    tempTable.appendChild(row);
  });

  // Render totals
  document.getElementById("web-stat-main-collections").textContent = `₹ ${mainTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  document.getElementById("web-stat-temp-collections").textContent = `₹ ${tempTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  
  const totalCount = mainRaw.transactions.length + tempRaw.transactions.length;
  document.getElementById("web-stat-total-weighments").textContent = totalCount;

  // Redraw SVG Bar chart based on current db
  drawWebAnalyticalCharts(mainRaw.transactions);
}

function drawWebAnalyticalCharts(transactions) {
  const barsContainer = document.getElementById("web-chart-bars");
  if (!barsContainer) return;
  barsContainer.innerHTML = "";

  // Aggregate values by material type
  const summary = {};
  transactions.forEach(tx => {
    if (!summary[tx.materialType]) {
      summary[tx.materialType] = 0;
    }
    summary[tx.materialType] += tx.amount;
  });

  const materials = Object.keys(summary);
  if (materials.length === 0) {
    barsContainer.innerHTML = `<text x="400" y="100" fill="#888" text-anchor="middle">No transaction data available to draw chart.</text>`;
    return;
  }

  // Find max value to scale chart
  const maxVal = Math.max(...Object.values(summary), 1000); // minimum scale limit
  const chartHeight = 120; // max px height of bar
  const startX = 100;
  const spacing = 150;

  materials.forEach((mat, idx) => {
    const val = summary[mat];
    const barHeight = (val / maxVal) * chartHeight;
    const x = startX + (idx * spacing);
    const y = 150 - barHeight;

    // Create SVG elements
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", "60");
    rect.setAttribute("height", barHeight);
    rect.setAttribute("fill", "url(#barGradient)");
    rect.setAttribute("rx", "4");
    
    // Add glowing stroke hover
    rect.style.cursor = "pointer";
    rect.style.transition = "all 0.3s ease";
    rect.addEventListener("mouseover", () => {
      rect.setAttribute("stroke", "#2D7FF9");
      rect.setAttribute("stroke-width", "2");
    });
    rect.addEventListener("mouseout", () => {
      rect.removeAttribute("stroke");
    });

    const textVal = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textVal.setAttribute("x", x + 30);
    textVal.setAttribute("y", y - 8);
    textVal.setAttribute("fill", "#39FF14");
    textVal.setAttribute("font-size", "10");
    textVal.setAttribute("font-family", "JetBrains Mono");
    textVal.setAttribute("text-anchor", "middle");
    textVal.textContent = `₹${val.toFixed(0)}`;

    const textLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textLabel.setAttribute("x", x + 30);
    textLabel.setAttribute("y", "172");
    textLabel.setAttribute("fill", "#ccc");
    textLabel.setAttribute("font-size", "11");
    textLabel.setAttribute("font-family", "Outfit");
    textLabel.setAttribute("text-anchor", "middle");
    textLabel.textContent = mat;

    barsContainer.appendChild(rect);
    barsContainer.appendChild(textVal);
    barsContainer.appendChild(textLabel);
  });

  // Inject gradient definition if not exists
  let defs = document.querySelector("svg.web-svg-chart defs");
  if (!defs) {
    defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2D7FF9" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#7c3aed" stop-opacity="0.3"/>
      </linearGradient>
    `;
    document.querySelector("svg.web-svg-chart").prepend(defs);
  }
}

// ========================================================
// 8. OCR CAMERAS VIEWPORT SIMULATION
// ========================================================

const OCR_DOCS = {
  plate: {
    title: "Capture License Plate OCR",
    feedHtml: `
      <div style="text-align: center; margin: auto;">
        <div style="background: #ffcc00; color: #000; border: 4px solid #111; padding: 12px 28px; border-radius: 6px; font-weight: 800; font-size: 1.8rem; font-family: var(--font-mono); letter-spacing: 3px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
          TN-37-BY-1234
        </div>
        <p style="margin-top: 15px; color: #fff; font-size: 0.8rem;">REAR LICENSE PLATE DETECTED</p>
      </div>
    `,
    extract: "TN-37-BY-1234"
  },
  rc: {
    title: "Capture Registration Certificate (RC)",
    feedHtml: `
      <div style="padding: 10px; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 4px;">
          <b>REGISTRATION CERTIFICATE</b>
          <span style="color: var(--color-success);">INDIA</span>
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.65rem; display: grid; grid-template-columns: auto 1fr; gap: 4px 10px; margin-top: 10px;">
          <span>Reg No:</span><b>TN-37-BY-1234</b>
          <span>Chassis:</span><b>M34A5199201XX</b>
          <span>Owner:</span><b>KARTHIK KUMAR</b>
          <span>Class:</span><b>HEAVY GOODS VEHICLE (HGV)</b>
        </div>
        <div style="text-align: right; font-size: 0.55rem; color: #888;">FORM 23 [Rule 48]</div>
      </div>
    `,
    extract: "TN-37-BY-1234"
  },
  dl: {
    title: "Capture Driver License (DL)",
    feedHtml: `
      <div style="padding: 10px; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 4px;">
          <b>DRIVING LICENSE</b>
          <span style="color: var(--color-info);">TAMIL NADU</span>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 10px; align-items: center;">
          <div style="width: 40px; height: 50px; background: #334155; border: 1px solid #475569; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">👤</div>
          <div style="font-family: var(--font-mono); font-size: 0.65rem; display: grid; grid-template-columns: auto 1fr; gap: 2px 8px;">
            <span>Lic No:</span><b>DL-3720182449</b>
            <span>Name:</span><b>KARTHIK KUMAR</b>
            <span>COV:</span><b>TRANS/HGV</b>
          </div>
        </div>
        <div style="font-size: 0.55rem; color: #888;">Valid Till: 2038-12-31</div>
      </div>
    `,
    extract: "Karthik Kumar"
  }
};

let activeOcrTarget = null; // 'plate', 'rc', 'dl'
let activeOcrFieldId = null; // HTML field ID to fill

function initOcrCamera() {
  const modal = document.getElementById("ocr-camera-modal");
  const closeBtn = document.getElementById("btn-close-ocr");
  const captureBtn = document.getElementById("btn-trigger-capture");

  closeBtn.addEventListener("click", () => {
    modal.classList.remove("active");
  });

  captureBtn.addEventListener("click", () => {
    const progressContainer = document.getElementById("ocr-progress-container");
    const progressFill = document.getElementById("ocr-progress-fill");
    const progressLabel = document.getElementById("ocr-progress-label");
    
    captureBtn.classList.add("hidden");
    progressContainer.classList.remove("hidden");
    
    // Animate progress bar simulation
    let width = 0;
    const interval = setInterval(() => {
      width += 8;
      progressFill.style.width = width + "%";
      
      if (width >= 30 && width < 60) {
        progressLabel.textContent = "Analyzing document text structure...";
      } else if (width >= 60 && width < 90) {
        progressLabel.textContent = "Extracting SOW fields...";
      } else if (width >= 100) {
        clearInterval(interval);
        
        // Extraction complete
        const ocrData = OCR_DOCS[activeOcrTarget];
        const extractedText = ocrData.extract;
        
        // Fill target input field
        const input = document.getElementById(activeOcrFieldId);
        if (input) {
          input.value = extractedText;
          // Trigger change/input events
          input.dispatchEvent(new Event("input"));
          input.dispatchEvent(new Event("change"));
        }
        
        logAuditEvent(`OCR processed for ${activeOcrTarget}: extracted "${extractedText}"`);
        showToast(`OCR Extracted: ${extractedText}`, "success");
        
        // Reset modal state
        modal.classList.remove("active");
        captureBtn.classList.remove("hidden");
        progressContainer.classList.add("hidden");
        progressFill.style.width = "0%";
      }
    }, 100);
  });

  // Mobile camera links
  document.getElementById("btn-mob-ocr-rc").addEventListener("click", () => {
    triggerCameraSimulator("rc", "mob-arr-veh");
  });
  document.getElementById("btn-mob-ocr-dl").addEventListener("click", () => {
    triggerCameraSimulator("dl", "mob-arr-driver");
  });

  // Windows desktop camera links
  document.getElementById("btn-win-ocr-rc").addEventListener("click", () => {
    triggerCameraSimulator("rc", "win-arr-veh");
  });
  document.getElementById("btn-win-ocr-dl").addEventListener("click", () => {
    triggerCameraSimulator("dl", "win-arr-driver");
  });
}

function triggerCameraSimulator(type, targetFieldId) {
  activeOcrTarget = type;
  activeOcrFieldId = targetFieldId;

  const ocrData = OCR_DOCS[type];
  document.getElementById("ocr-modal-title").textContent = ocrData.title;
  document.getElementById("mock-doc-feed-container").innerHTML = ocrData.feedHtml;

  // Open modal
  document.getElementById("ocr-camera-modal").classList.add("active");
  showToast("Camera Viewfinder Active. Click Capture.", "info");
}

// ========================================================
// 9. THERMAL RECEIPT DISPLAY
// ========================================================

function showThermalReceipt(tx) {
  const modal = document.getElementById("thermal-print-modal");
  const paper = document.getElementById("receipt-paper-content");

  // Format thermal text alignment
  const printText = `
     ================================
      WEIGHBRIDGE MANAGEMENT SYSTEM  
       OFFICIAL TRANSACTION SLIP     
     ================================
  Receipt No : ${tx.id}
  Date/Time  : ${tx.timestamp}
  Operator   : ${tx.operator}
  Database   : ${db.path}
  --------------------------------
  Vehicle Reg: ${tx.vehNo}
  Driver Name: ${tx.driverName}
  Material   : ${tx.materialType}
  Transport  : ${tx.transportCompany}
  --------------------------------
  Tare Weight: ${tx.tareWeight.toLocaleString()} KG
  Gross Wt   : ${tx.grossWeight.toLocaleString()} KG
  --------------------------------
  NET WEIGHT : ${tx.netWeight.toLocaleString()} KG
  Rate / KG  : ₹ ${tx.rate.toFixed(2)}
  --------------------------------
  TOTAL AMT  : ₹ ${tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
  Pay Method : ${tx.paymentMethod}
  ================================
      THANK YOU - DRIVE SAFELY       
  `;

  paper.textContent = printText;
  modal.classList.add("active");

  // Reprinter button handler
  document.getElementById("btn-reprint-receipt").onclick = () => {
    logAuditEvent(`Receipt printed: ${tx.id}`);
    showToast("Print Job successfully sent to Thermal Printer!", "success");
  };

  document.getElementById("btn-close-thermal").onclick = () => {
    modal.classList.remove("active");
  };

  document.getElementById("btn-close-receipt-done").onclick = () => {
    modal.classList.remove("active");
  };
}

// ========================================================
// 10. SYSTEM REPORTS TABLES
// ========================================================

function refreshReportsTables() {
  // Desktop Reports View
  const tabActive = document.querySelector(".win-tab-btn.active");
  if (tabActive) {
    const text = tabActive.textContent;
    if (text.includes("Weighment")) {
      renderWindowsReportsTable("weighments");
    } else if (text.includes("Financial")) {
      renderWindowsReportsTable("collections");
    } else {
      renderWindowsReportsTable("drafts");
    }
  }

  // Populate material search filter dropdown in Search Pane
  const matDropdown = document.getElementById("win-search-filter-material");
  if (matDropdown) {
    matDropdown.innerHTML = `<option value="">-- All Materials --</option>`;
    db.suggestions.materials.forEach(m => {
      matDropdown.innerHTML += `<option value="${m}">${m}</option>`;
    });
  }
}

function renderWindowsReportsTable(type) {
  const table = document.getElementById("win-reports-table");
  const thead = table.querySelector("thead");
  const tbody = document.getElementById("win-reports-table-body");

  thead.innerHTML = "";
  tbody.innerHTML = "";

  if (type === "weighments") {
    thead.innerHTML = `
      <tr>
        <th>Tx ID</th>
        <th>Vehicle #</th>
        <th>Driver Name</th>
        <th>Material Type</th>
        <th>Tare Wt</th>
        <th>Gross Wt</th>
        <th>Net Wt</th>
        <th>Rate</th>
        <th>Billing</th>
        <th>Date & Time</th>
      </tr>
    `;
    if (db.transactions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted">No transactions recorded in this environment yet.</td></tr>`;
      return;
    }
    db.transactions.forEach(tx => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="font-mono">${tx.id}</td>
        <td class="font-mono"><b>${tx.vehNo}</b></td>
        <td>${tx.driverName}</td>
        <td>${tx.materialType}</td>
        <td class="font-mono">${tx.tareWeight} kg</td>
        <td class="font-mono">${tx.grossWeight} kg</td>
        <td class="font-mono"><b>${tx.netWeight} kg</b></td>
        <td class="font-mono">₹${tx.rate.toFixed(2)}</td>
        <td class="font-mono"><b>₹${tx.amount.toFixed(2)}</b></td>
        <td class="text-muted">${tx.timestamp}</td>
      `;
      tbody.appendChild(row);
    });
  } else if (type === "collections") {
    thead.innerHTML = `
      <tr>
        <th>Receipt No</th>
        <th>Vehicle #</th>
        <th>Billing Amount</th>
        <th>Payment Mode</th>
        <th>Timestamp</th>
        <th>Account</th>
      </tr>
    `;
    if (db.transactions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No billing collections recorded.</td></tr>`;
      return;
    }
    db.transactions.forEach(tx => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="font-mono">${tx.id}</td>
        <td class="font-mono"><b>${tx.vehNo}</b></td>
        <td class="font-mono"><b>₹${tx.amount.toFixed(2)}</b></td>
        <td><span class="win-badge green-pulse">${tx.paymentMethod}</span></td>
        <td class="text-muted">${tx.timestamp}</td>
        <td class="text-info">${activeDBName === "MainDB" ? "Main" : "Temporary"}</td>
      `;
      tbody.appendChild(row);
    });
  } else if (type === "drafts") {
    thead.innerHTML = `
      <tr>
        <th>Draft ID</th>
        <th>Vehicle #</th>
        <th>Driver Name</th>
        <th>Tare Weight</th>
        <th>Stage Created</th>
        <th>Flow Status</th>
      </tr>
    `;
    if (db.drafts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No vehicles in loading stage (all completed).</td></tr>`;
      return;
    }
    db.drafts.forEach(d => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="font-mono">${d.id}</td>
        <td class="font-mono"><b>${d.vehNo}</b></td>
        <td>${d.driverName}</td>
        <td class="font-mono">${d.tareWeight} kg</td>
        <td class="text-muted">${d.timestamp}</td>
        <td><span class="win-badge text-warning" style="background: rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.2);">${d.status}</span></td>
      `;
      tbody.appendChild(row);
    });
  }
}

function refreshAuditLogsTable() {
  const tbody = document.getElementById("win-audit-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (db.auditLogs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No audit trails found.</td></tr>`;
    return;
  }

  db.auditLogs.forEach(log => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="font-mono font-sm text-muted">${log.timestamp}</td>
      <td><b>${log.user}</b></td>
      <td><code>${log.action}</code></td>
      <td class="font-mono font-sm" style="font-size: 0.7rem; color: var(--color-info);">${log.db}</td>
      <td class="text-muted font-sm">${log.ip || 'Local Client'}</td>
    `;
    tbody.appendChild(row);
  });
}

// ========================================================
// 11. DYNAMIC AUTO-SUGGEST & SUGGESTION MANAGER
// ========================================================

function setupAutocomplete(inputId, listId, category, onSelectCallback = null) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);

  if (!input || !list) return;

  // Bind input listeners
  input.addEventListener("input", (e) => {
    const val = e.target.value.trim().toLowerCase();
    list.innerHTML = "";
    
    if (!val) {
      list.classList.remove("show");
      return;
    }

    // Filter dynamic SOW suggestions
    const suggestions = db.suggestions[category] || [];
    const filtered = suggestions.filter(item => item.toLowerCase().includes(val));

    if (filtered.length === 0) {
      list.classList.remove("show");
      return;
    }

    filtered.forEach(item => {
      const div = document.createElement("div");
      div.className = "autocomplete-item";
      div.textContent = item;
      div.addEventListener("click", () => {
        input.value = item;
        list.classList.remove("show");
        
        // Execute callback if provided (e.g. autofill driver based on vehicle)
        if (onSelectCallback) {
          onSelectCallback(item);
        }
      });
      list.appendChild(div);
    });

    list.classList.add("show");
  });

  // Close list on body click
  document.addEventListener("click", (e) => {
    if (e.target !== input && e.target !== list) {
      list.classList.remove("show");
    }
  });
}

function appendSuggestions(veh, driver, mat, transport) {
  let updated = false;
  
  if (veh && !db.suggestions.vehicles.includes(veh)) {
    db.suggestions.vehicles.push(veh);
    updated = true;
  }
  if (driver && !db.suggestions.drivers.includes(driver)) {
    db.suggestions.drivers.push(driver);
    updated = true;
  }
  if (mat && !db.suggestions.materials.includes(mat)) {
    db.suggestions.materials.push(mat);
    updated = true;
  }
  if (transport && !db.suggestions.transports.includes(transport)) {
    db.suggestions.transports.push(transport);
    updated = true;
  }

  if (updated) {
    saveActiveDB();
  }
}

// ========================================================
// 12. UTILITY & EXPORTS HELPERS
// ========================================================

function populateDraftDropdowns() {
  const mobSelect = document.getElementById("mob-ret-draft-select");
  const winSelect = document.getElementById("win-ret-draft-select");

  if (mobSelect) {
    mobSelect.innerHTML = `<option value="">-- Choose active vehicle --</option>`;
    db.drafts.forEach(d => {
      mobSelect.innerHTML += `<option value="${d.id}">${d.vehNo} (${d.driverName})</option>`;
    });
  }

  if (winSelect) {
    winSelect.innerHTML = `<option value="">-- Choose active draft --</option>`;
    db.drafts.forEach(d => {
      winSelect.innerHTML += `<option value="${d.id}">${d.vehNo} &bull; Driver: ${d.driverName} &bull; Tare: ${d.tareWeight} kg</option>`;
    });
  }
}

function updateStatsCounters() {
  const count = db.transactions.length;
  let collectionsSum = 0;
  db.transactions.forEach(t => collectionsSum += t.amount);

  const draftsCount = db.drafts.length;

  // Mobile Stats widgets
  document.getElementById("mob-stat-count").textContent = count;
  document.getElementById("mob-stat-cash").textContent = `₹ ${collectionsSum.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  document.getElementById("mob-stat-drafts").textContent = draftsCount;
  document.getElementById("mob-stat-db").textContent = activeDBName === "MainDB" ? "Main DB" : "Temp DB";

  // Windows Stats widgets
  document.getElementById("win-stat-drafts").textContent = draftsCount;
  document.getElementById("win-stat-draft-count").textContent = draftsCount;
  document.getElementById("win-stat-total-count").textContent = count;
  document.getElementById("win-stat-total-collections").textContent = `₹ ${collectionsSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function triggerCsvExport() {
  if (db.transactions.length === 0) {
    showToast("No records to export!", "warning");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Transaction ID,Vehicle No,Driver Name,Material Type,Transport Company,Tare Weight (KG),Gross Weight (KG),Net Weight (KG),Rate (₹),Amount (₹),Payment Method,Timestamp\n";

  db.transactions.forEach(tx => {
    const row = [
      tx.id,
      tx.vehNo,
      `"${tx.driverName}"`,
      `"${tx.materialType}"`,
      `"${tx.transportCompany}"`,
      tx.tareWeight,
      tx.grossWeight,
      tx.netWeight,
      tx.rate,
      tx.amount,
      tx.paymentMethod,
      tx.timestamp
    ].join(",");
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `WMS_Export_${activeDBName}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  
  link.click();
  document.body.removeChild(link);
  
  logAuditEvent("Exported operational report to CSV");
  showToast("CSV report downloaded successfully", "success");
}

function getFormattedTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  let month = now.getMonth() + 1;
  let day = now.getDate();
  let hour = now.getHours();
  let min = now.getMinutes();
  let sec = now.getSeconds();

  month = month < 10 ? '0' + month : month;
  day = day < 10 ? '0' + day : day;
  hour = hour < 10 ? '0' + hour : hour;
  min = min < 10 ? '0' + min : min;
  sec = sec < 10 ? '0' + sec : sec;

  return `${year}-${month}-${day} ${hour}:${min}:${sec}`;
}

// ========================================================
// 13. TOAST NOTIFICATION HELPERS
// ========================================================

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let icon = "🔔";
  if (type === "success") icon = "✅";
  if (type === "warning") icon = "⚠️";
  if (type === "danger") icon = "❌";
  if (type === "info") icon = "ℹ️";

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-text">${message}</span>
  `;

  container.appendChild(toast);

  // Auto-remove toast after 4 seconds
  setTimeout(() => {
    toast.classList.add("fade-out");
    toast.addEventListener("animationend", () => {
      toast.remove();
    });
  }, 4000);
}

// ========================================================
// 14. USER ADMINISTRATION & SECURITY CREATION PROTOTYPE
// ========================================================

function getUserDetails(username) {
  if (!username) return null;
  const mainDbData = JSON.parse(localStorage.getItem("wms_main_db")) || DEFAULT_MAIN_DB;
  const tempDbData = JSON.parse(localStorage.getItem("wms_temp_db")) || DEFAULT_TEMP_DB;
  const allUsers = [...(mainDbData.users || []), ...(tempDbData.users || [])];
  return allUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
}

function validateLoginCredentials(username, password, dbEnvName) {
  const targetKey = dbEnvName === "MainDB" ? "wms_main_db" : "wms_temp_db";
  const rawDb = localStorage.getItem(targetKey);
  if (!rawDb) return false;
  const parsed = JSON.parse(rawDb);
  if (!parsed.users) return false;
  return parsed.users.some(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
}

function initUserAdmin() {
  const addUserModal = document.getElementById("add-user-modal");
  const closeUserModalBtn = document.getElementById("btn-close-user-modal");
  const addUserForm = document.getElementById("add-user-form");
  const addUserTriggerBtn = document.getElementById("btn-add-user-trigger");

  if (addUserTriggerBtn) {
    addUserTriggerBtn.addEventListener("click", () => {
      addUserModal.classList.add("active");
    });
  }

  if (closeUserModalBtn) {
    closeUserModalBtn.addEventListener("click", () => {
      addUserModal.classList.remove("active");
    });
  }

  if (addUserForm) {
    addUserForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const newUsername = document.getElementById("new-username").value.trim();
      const newPassword = document.getElementById("new-password").value.trim();
      const newRole = document.getElementById("new-role").value.trim();
      const newDbEnv = document.getElementById("new-db-env").value;
      const newSecLevel = document.getElementById("new-sec-level").value;

      if (!newUsername || !newPassword || !newRole) {
        showToast("Please fill all required fields", "danger");
        return;
      }

      // Load target DB data
      const dbKey = newDbEnv === "MainDB" ? "wms_main_db" : "wms_temp_db";
      const targetDb = JSON.parse(localStorage.getItem(dbKey));

      if (!targetDb) {
        showToast("Database error", "danger");
        return;
      }

      // Check if user already exists
      if (!targetDb.users) targetDb.users = [];
      const userExists = targetDb.users.some(u => u.username.toLowerCase() === newUsername.toLowerCase());
      if (userExists) {
        showToast(`Username '${newUsername}' already exists in this database environment!`, "danger");
        return;
      }

      // Add new user
      const dbPath = newDbEnv === "MainDB" ? "C:\\WMS\\WMS.db" : "C:\\Temp\\TempWMS.db";
      const newUser = {
        username: newUsername,
        password: newPassword,
        role: newRole,
        dbPath: dbPath,
        securityLevel: newSecLevel
      };

      targetDb.users.push(newUser);
      localStorage.setItem(dbKey, JSON.stringify(targetDb));

      // Log audit event to the target database
      const timestamp = getFormattedTimestamp();
      targetDb.auditLogs.unshift({
        timestamp: timestamp,
        user: loggedInUser || "System Admin",
        action: `Created new user profile: ${newUsername} (${newRole})`,
        db: dbPath,
        ip: "127.0.0.1 (Local)"
      });
      localStorage.setItem(dbKey, JSON.stringify(targetDb));

      // If we are currently connected to this database, update the runtime db object
      if (newDbEnv === activeDBName) {
        db = targetDb;
      }

      // Close modal and reset form
      addUserModal.classList.remove("active");
      addUserForm.reset();

      // Show success toast
      showToast(`User '${newUsername}' created successfully on ${newDbEnv}!`, "success");

      // Refresh UI displays
      refreshConnectedUI();
    });
  }
}

function refreshUserTable() {
  const tbody = document.querySelector("#web-pane-users tbody");
  if (!tbody) return;

  const mainDbData = JSON.parse(localStorage.getItem("wms_main_db")) || DEFAULT_MAIN_DB;
  const tempDbData = JSON.parse(localStorage.getItem("wms_temp_db")) || DEFAULT_TEMP_DB;

  const mainUsers = mainDbData.users || [];
  const tempUsers = tempDbData.users || [];

  tbody.innerHTML = "";

  const allUsers = [...mainUsers, ...tempUsers];

  allUsers.forEach(u => {
    let isActiveSession = false;
    if (loggedInUser && loggedInUser.toLowerCase() === u.username.toLowerCase()) {
      if (u.dbPath === db.path) {
        isActiveSession = true;
      }
    }

    const badgeClass = isActiveSession ? "green-pulse" : "text-muted";
    const badgeBg = isActiveSession ? "" : "style='background:rgba(255,255,255,0.05);'";
    const badgeText = isActiveSession ? "Active Session" : "Offline";
    const isMainDB = u.dbPath.includes("WMS.db");
    const dbCodeClass = isMainDB ? "text-primary" : "text-warning";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><b>${u.username}</b></td>
      <td>${u.role}</td>
      <td><code class="${dbCodeClass}">${u.dbPath}</code></td>
      <td>${u.securityLevel}</td>
      <td><span class="win-badge ${badgeClass}" ${badgeBg}>${badgeText}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

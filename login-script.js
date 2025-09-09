// Global variables for login management
let loginAttempts = 0;
const maxAttempts = 3;

// Initialize login system
document.addEventListener("DOMContentLoaded", function() {
    initializeLoginSystem();
});

// Initialize the login system
function initializeLoginSystem() {
    checkExistingLogin();
    loadRememberedData();
    setupEventListeners();
    initializeDefaultAdmins();
}

// Setup event listeners
function setupEventListeners() {
    // Credentials login form
    const credentialsForm = document.getElementById("credentials-login-form");
    if (credentialsForm) {
        credentialsForm.addEventListener("submit", handleCredentialsLogin);
    }
}

// Initialize default admins or ensure correct admin data
function initializeDefaultAdmins() {
    let adminsList = JSON.parse(localStorage.getItem("adminsList") || "[]");
    
    // Ensure the 'counta' admin is present and correct
    let countaAdminIndex = adminsList.findIndex(a => a.username === "counta");
    if (countaAdminIndex === -1) {
        // Add if not found
        adminsList.push({
            id: "ADM001",
            name: "أدمن النظام",
            username: "counta",
            password: "ta221070",
            status: "active",
            role: "admin",
            createdAt: new Date().toISOString()
        });
        addSystemLog("تم إضافة حساب الأدمن الافتراضي (counta)");
    } else {
        // Update if found but incorrect password/role
        if (adminsList[countaAdminIndex].password !== "ta221070" || adminsList[countaAdminIndex].role !== "admin") {
            adminsList[countaAdminIndex].password = "ta221070";
            adminsList[countaAdminIndex].role = "admin";
            adminsList[countaAdminIndex].status = "active";
            addSystemLog("تم تحديث حساب الأدمن الافتراضي (counta)");
        }
    }

    // إضافة أدمن عادي جديد
    let mahmoudAdminIndex = adminsList.findIndex(a => a.username === "mahmoud");
    if (mahmoudAdminIndex === -1) {
        // Add if not found
        adminsList.push({
            id: "ADM002",
            name: "محمود عبدالحميد",
            username: "mahmoud",
            password: "123456",
            status: "active",
            role: "admin",
            createdAt: new Date().toISOString()
        });
        addSystemLog("تم إضافة حساب الأدمن العادي (محمود عبدالحميد)");
    } else {
        // Update if found but incorrect password/role
        if (adminsList[mahmoudAdminIndex].password !== "123456" || adminsList[mahmoudAdminIndex].role !== "admin") {
            adminsList[mahmoudAdminIndex].password = "123456";
            adminsList[mahmoudAdminIndex].role = "admin";
            adminsList[mahmoudAdminIndex].status = "active";
            adminsList[mahmoudAdminIndex].name = "محمود عبدالحميد";
            addSystemLog("تم تحديث حساب الأدمن العادي (محمود عبدالحميد)");
        }
    }

    localStorage.setItem("adminsList", JSON.stringify(adminsList));
}

// Handle credentials login
function handleCredentialsLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const rememberMe = document.getElementById("remember-me").checked;
    
    if (!username || !password) {
        showMessage("error", "❌ يرجى إدخال جميع البيانات المطلوبة");
        return;
    }
    
    // Check credentials against stored admins
    const adminsList = JSON.parse(localStorage.getItem("adminsList") || "[]");
    const admin = adminsList.find(a => 
        a.username === username && 
        a.password === password && 
        a.status === "active"
    );
    
    if (admin) {
        loginSuccess(admin, rememberMe, "credentials");
    } else {
        handleLoginFailure();
    }
}

// Handle successful login
function loginSuccess(admin, remember, loginType) {
    // Save session data
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("loginTime", Date.now());
    localStorage.setItem("currentAdmin", JSON.stringify(admin));
    localStorage.setItem("loginType", loginType);
    
    // Save remembered data
    if (remember) {
        localStorage.setItem("rememberedUsername", admin.username);
    } else {
        localStorage.removeItem("rememberedUsername");
    }
    
    // Add system log
    addSystemLog(`تسجيل دخول ناجح (${loginType})`, admin.id);
    
    // Show success message
    showMessage("success", `مرحباً ${admin.name}! تم تسجيل الدخول بنجاح`);
    
    // Reset login attempts
    loginAttempts = 0;
    
    // Redirect after 2 seconds
    setTimeout(() => {
        window.location.href = "index.html";
    }, 2000);
}

// Handle login failure
function handleLoginFailure() {
    loginAttempts++;
    
    if (loginAttempts >= maxAttempts) {
        showMessage("error", "❌ تم تجاوز عدد المحاولات المسموحة! يرجى المحاولة لاحقاً.");
        disableLoginForms();
        
        // Block attempts for 5 minutes
        setTimeout(() => {
            loginAttempts = 0;
            enableLoginForms();
            hideMessage("error");
            hideMessage("attempts-warning");
        }, 300000); // 5 minutes
    } else {
        const remainingAttempts = maxAttempts - loginAttempts;
        showMessage("error", "❌ بيانات خاطئة!");
        showMessage("attempts-warning", `⚠️ متبقي ${remainingAttempts} محاولة`);
    }
    
    // Clear form fields
    clearLoginForms();
    
    // Add failed login log
    addSystemLog("محاولة تسجيل دخول فاشلة");
    
    setTimeout(() => {
        hideMessage("error");
    }, 3000);
}

// Disable login forms
function disableLoginForms() {
    const loginTabs = document.getElementById("login-tabs");
    const tabContents = document.querySelectorAll(".tab-content");
    
    if (loginTabs) loginTabs.style.display = "none";
    tabContents.forEach(tab => {
        tab.style.display = "none";
    });
}

// Enable login forms
function enableLoginForms() {
    const loginTabs = document.getElementById("login-tabs");
    const tabContents = document.querySelectorAll(".tab-content");
    
    if (loginTabs) loginTabs.style.display = "flex";
    tabContents.forEach(tab => {
        tab.style.display = "block";
    });
    
    // Restore active tab
    const activeTab = document.querySelector(".tab-content.active");
    if (activeTab) {
        activeTab.style.display = "block";
    }
}

// Clear login form fields
function clearLoginForms() {
    const fields = ["username", "password"];
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.value = "";
    });
}

// Check existing login session
function checkExistingLogin() {
    if (localStorage.getItem("isLoggedIn") === "true") {
        const loginTime = localStorage.getItem("loginTime");
        const currentTime = Date.now();
        const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
        
        if (currentTime - loginTime < sessionDuration) {
            const currentAdmin = JSON.parse(localStorage.getItem("currentAdmin") || "{}");
            if (currentAdmin.id) {
                showLoggedInInfo(currentAdmin);
                return true;
            }
        } else {
            logout();
        }
    }
    return false;
}

// Show logged in user info
function showLoggedInInfo(admin) {
    const loggedInInfo = document.getElementById("logged-in-info");
    const loggedUserInfo = document.getElementById("logged-user-info");
    const logoutBtn = document.getElementById("logout-btn");
    const mainSystemBtn = document.getElementById("main-system-btn");
    
    if (loggedInInfo && loggedUserInfo && logoutBtn) {
        loggedInInfo.style.display = "block";
        loggedUserInfo.textContent = `أنت مسجل دخول باسم: ${admin.name} (${admin.id})`;
        logoutBtn.style.display = "block";
        if (mainSystemBtn) mainSystemBtn.style.display = "block";
        
        disableLoginForms();
    }
}

// Load remembered data
function loadRememberedData() {
    const rememberedUsername = localStorage.getItem("rememberedUsername");
    
    if (rememberedUsername) {
        const usernameField = document.getElementById("username");
        const rememberMeCheckbox = document.getElementById("remember-me");
        
        if (usernameField && rememberMeCheckbox) {
            usernameField.value = rememberedUsername;
            rememberMeCheckbox.checked = true;
        }
    }
}

// Logout function
function logout() {
    const currentAdmin = JSON.parse(localStorage.getItem("currentAdmin") || "{}");
    
    // Clear session data
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("loginTime");
    localStorage.removeItem("currentAdmin");
    localStorage.removeItem("loginType");
    
    // Add logout log
    addSystemLog("تسجيل خروج", currentAdmin.id);
    
    showMessage("success", "تم تسجيل الخروج بنجاح");
    
    // Reset UI
    const loggedInInfo = document.getElementById("logged-in-info");
    const logoutBtn = document.getElementById("logout-btn");
    
    if (loggedInInfo) loggedInInfo.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";
    
    enableLoginForms();
    clearLoginForms();
    
    setTimeout(() => {
        hideMessage("success");
    }, 3000);
}

// Switch between login tabs (no longer needed, but keeping for now)
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll(".tab-content").forEach(tab => {
        tab.classList.remove("active");
    });
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    // Show selected tab
    const selectedTab = document.getElementById(tabName + "-tab");
    const selectedBtn = event.target;
    
    if (selectedTab && selectedBtn) {
        selectedTab.classList.add("active");
        selectedBtn.classList.add("active");
    }
}

// Show message
function showMessage(type, message) {
    const messageElement = document.getElementById(type + "-message");
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.display = "block";
    }
}

// Hide message
function hideMessage(type) {
    const messageElement = document.getElementById(type + "-message");
    if (messageElement) {
        messageElement.style.display = "none";
    }
}

// Navigate to admin login
function showAdminLogin() {
    window.location.href = "admin-login.html";
}

// Add system log
function addSystemLog(action, adminId = null) {
    let logs = JSON.parse(localStorage.getItem("systemLogs") || "[]");
    const timestamp = new Date().toLocaleString('ar-EG');
    const adminPart = adminId ? ` [${adminId}]` : '';
    const logEntry = `${timestamp}${adminPart} - ${action}`;

    logs.unshift(logEntry);
    if (logs.length > 100) {
        logs = logs.slice(0, 100);
    }
    localStorage.setItem("systemLogs", JSON.stringify(logs));
}

// Validate admin credentials
function validateAdminCredentials(username, password) {
    const adminsList = JSON.parse(localStorage.getItem("adminsList") || "[]");
    return adminsList.find(admin => 
        admin.username === username && 
        admin.password === password && 
        admin.status === "active"
    );
}

// Get current logged admin
function getCurrentAdmin() {
    if (localStorage.getItem("isLoggedIn") === "true") {
        return JSON.parse(localStorage.getItem("currentAdmin") || "{}");
    }
    return null;
}

// Check if user is logged in
function isLoggedIn() {
    if (localStorage.getItem("isLoggedIn") === "true") {
        const loginTime = localStorage.getItem("loginTime");
        const currentTime = Date.now();
        const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
        
        return currentTime - loginTime < sessionDuration;
    }
    return false;
}

// Export functions for global use
window.switchTab = switchTab;
window.logout = logout;
window.showAdminLogin = showAdminLogin;
window.getCurrentAdmin = getCurrentAdmin;
window.isLoggedIn = isLoggedIn;










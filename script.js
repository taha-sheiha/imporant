// Global variables
// يمكنك وضع رابط ثابت هنا ليتم توليد باركود له دائماً
const FIXED_QR_LINK = ""; // مثال: "https://example.com/my-batch-groups"

// التحقق من تسجيل الدخول
function checkAuthentication() {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const loginTime = localStorage.getItem("loginTime");
    const currentTime = Date.now();
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 ساعة
    
    if (!isLoggedIn || !loginTime || (currentTime - loginTime > sessionDuration)) {
        // إزالة بيانات الجلسة المنتهية الصلاحية
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("loginTime");
        localStorage.removeItem("currentAdmin");
        localStorage.removeItem("loginType");
        // إعادة توجيه لصفحة تسجيل الدخول
        window.location.href = "login.html";
        return false;
    }
    return true;
}

// إضافة لوج للعمليات (تنسيق نصي موحد مع لوحة الأدمن)
function addSystemLog(action, adminId = null) {
    let logs = JSON.parse(localStorage.getItem("systemLogs") || "[]");
    const timestamp = new Date().toLocaleString('ar-EG');
    const adminPart = adminId ? ` [${adminId}]` : '';
    const logEntry = `${timestamp}${adminPart} - ${action}`;

    logs.unshift(logEntry);

    // الاحتفاظ بآخر 100 لوج فقط
    if (logs.length > 100) {
        logs = logs.slice(0, 100);
    }

    localStorage.setItem("systemLogs", JSON.stringify(logs));
}

// Initialize the application
document.addEventListener("DOMContentLoaded", function() {
    // التحقق من تسجيل الدخول أولاً
    if (!checkAuthentication()) {
        return;
    }
    
    setupGradeSelection();
    setupAutoSignature(); // لا يزال مطلوبًا لتعيين التوقيع من الأدمن الحالي
    addInputAnimations(document.body); // Apply animations to all inputs
    
    // إضافة لوج دخول النظام
    addSystemLog("دخول نظام الإعلان الهام");
});

// Update current date (kept for export view, but not called on DOMContentLoaded)
function updateCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: "long", 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
    };
    const arabicDate = now.toLocaleDateString("ar-EG", options);
    return arabicDate;
}

// Generate unique system code (kept for export view, but not called on DOMContentLoaded)
function generateCode() {
    const prefix = "AN-";
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const timestamp = `${year}${month}${day}-${hours}${minutes}${seconds}`;
    const randomNum = String(Math.floor(Math.random() * 1000)).padStart(3, "0"); // 3 أرقام عشوائية
    
    const uniqueCode = `${prefix}${timestamp}-${randomNum}`;
    addSystemLog(`تم توليد كود نظام فريد: ${uniqueCode}`);
    return uniqueCode; // Return the generated code
}

// تم إزالة رفع الشعار غير المستخدم لتبسيط الكود

// Setup grade selection functionality
function setupGradeSelection() {
    const gradeSelect = document.getElementById("grade-select");
    const specializationRow = document.getElementById("specialization-row");
    
    gradeSelect.addEventListener("change", function() {
        if (this.value === "الفرقة الرابعة") {
            specializationRow.style.display = "block";
        } else {
            specializationRow.style.display = "none";
        }
    });
}

// Add input animations
function addInputAnimations(container) {
    const inputs = container.querySelectorAll("input, textarea, select");
    inputs.forEach(input => {
        input.addEventListener("focus", function() {
            this.style.transform = "scale(1.02)";
            this.style.transition = "transform 0.2s ease";
        });
        
        input.addEventListener("blur", function() {
            this.style.transform = "scale(1)";
        });
        
        input.addEventListener("input", function() {
            if (this.value) {
                this.style.borderColor = "#27ae60";
            } else {
                this.style.borderColor = "#ecf0f1";
            }
        });
    });
}

// Export as image function
function exportAsImage() {
    const exportBtn = document.querySelector(".export-btn");
    const originalText = exportBtn.innerHTML;
    const gradeSelect = document.getElementById("grade-select");
    const announcementTextarea = document.getElementById("announcement-text");

    // Validate required fields
    if (!gradeSelect || !announcementTextarea) {
        alert("حدث خطأ: عناصر الواجهة غير متوفرة.");
        return;
    }
    if (!gradeSelect.value) {
        alert("يرجى اختيار الفرقة قبل التصدير.");
        return;
    }
    if (!announcementTextarea.value.trim()) {
        alert("يرجى كتابة نص الإعلان قبل التصدير.");
        return;
    }
    
    // Show loading state
    exportBtn.innerHTML = "<div class=\"loading\"></div> جاري التصدير...";
    exportBtn.disabled = true;
    
    // Prepare export view
    prepareExportView();
    sanitizeExportAssets();
    
    // Show export view temporarily
    const exportView = document.getElementById("export-view");
    exportView.style.display = "block";
    exportView.classList.add("fixed-export-view");
    window.scrollTo(0, 0); // مهم جدًا للموبايل
    document.body.style.zoom = "1"; // تأمين أي زووم حصل

    // ضبط شكل التصدير يدوياً
    exportView.style.width = "1080px";
    exportView.style.height = "auto";
    exportView.style.fontSize = "16px";
    exportView.style.padding = "40px";
    exportView.style.transform = "scale(1)";
    exportView.style.zoom = "1";
    exportView.style.overflow = "hidden";
    exportView.style.position = "relative";
    exportView.style.margin = "0 auto";
    exportView.style.boxSizing = "border-box";

    // Wait a moment for the DOM to update and for html2canvas to render
    setTimeout(() => {
        const safeScale = Math.min(2, Math.max(1.5, (window.devicePixelRatio || 1)));
        if (!exportView) {
            alert("تعذر العثور على منطقة التصدير.");
            exportBtn.innerHTML = originalText;
            exportBtn.disabled = false;
            return;
        }
        // حضّر الصور للتصدير (تحويل الشعار إلى Data URL لتجنب CORS)
        prepareImagesForExport(exportView).finally(() => {
        html2canvas(exportView, {
            scale: safeScale,
            useCORS: true,
            allowTaint: false,
            backgroundColor: "#ffffff",
            scrollX: 0,
            scrollY: 0,
            width: exportView.scrollWidth || exportView.offsetWidth,
            height: exportView.scrollHeight || exportView.offsetHeight,
            logging: false,
            imageTimeout: 15000,
            removeContainer: true
        }).then(canvas => {
            try {
                const imgData = canvas.toDataURL("image/png", 1.0);
                const link = document.createElement("a");
                link.download = `إعلان_هام_${new Date().toISOString().split("T")[0]}.png`;
                link.href = imgData;
                
                // Force download
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // إضافة لوج مفصل لنجاح التصدير
                const exportDetails = {
                    grade: document.getElementById("grade-select").value,
                    language: document.getElementById("language-select").value,
                    specialization: document.getElementById("specialization-select").value
                };
                
                addSystemLog(`تم تصدير الإعلان بنجاح (${exportDetails.grade} - ${exportDetails.language} - ${exportDetails.specialization})`);
                
            } catch (error) {
                console.error("Error creating image:", error);
                alert("حدث خطأ أثناء إنشاء الصورة: " + error.message);
                addSystemLog(`فشل في تصدير الصورة: ${error.message}`);
            } finally {
                // Hide export view
                exportView.style.display = "none";
                exportView.classList.remove("fixed-export-view");

                // Restore button state
                exportBtn.innerHTML = originalText;
                exportBtn.disabled = false;
            }

        }).catch(async error => {
            console.error("Error with html2canvas:", error);
            addSystemLog(`خطأ في html2canvas: ${error.message}`);
            // Retry once with images hidden if tainted canvas
            const isTainted = /Tainted canvases may not be exported/i.test(error && (error.message || ''));
            if (isTainted) {
                // حاول أولاً تحويل الصور إلى Data URL ثم إعادة المحاولة
                try {
                    await prepareImagesForExport(exportView);
                } catch(_e){}
                const hidden = hideImagesTemporarily(exportView, /*skipIds*/['export-logo-image']);
                try {
                    const retryCanvas = await html2canvas(exportView, {
                        scale: safeScale,
                        useCORS: true,
                        allowTaint: false,
                        backgroundColor: "#ffffff",
                        scrollX: 0,
                        scrollY: 0,
                        width: exportView.scrollWidth || exportView.offsetWidth,
                        height: exportView.scrollHeight || exportView.offsetHeight,
                        logging: false,
                        imageTimeout: 15000,
                        removeContainer: true
                    });
                    const imgData = retryCanvas.toDataURL("image/png", 1.0);
                    const link = document.createElement("a");
                    link.download = `إعلان_هام_${new Date().toISOString().split("T")[0]}.png`;
                    link.href = imgData;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    addSystemLog(`تم تصدير الإعلان بعد إزالة الصور مؤقتاً`);
                } catch (e2) {
                    const isFileProto = location.protocol === 'file:';
                    const hint = isFileProto ? "\nملاحظة: تشغيل الملف مباشرة باستخدام file:// يسبب مشكلة الحماية. شغل الموقع عبر خادم محلي (مثل Live Server)." : "";
                    alert("حدث خطأ أثناء التصدير: " + (e2.message || 'غير معروف') + hint);
                } finally {
                    hidden.restore();
                }
            } else {
                alert("حدث خطأ أثناء التصدير: " + (error.message || 'غير معروف'));
            }
            
            // Hide export view
            exportView.style.display = "none";
            exportView.classList.remove("fixed-export-view");

            // Restore button state
            exportBtn.innerHTML = originalText;
            exportBtn.disabled = false;
        });
        });
    }, 500);
}

// Prepare export view with current data
function prepareExportView() {
    const gradeSelect = document.getElementById("grade-select");
    const languageSelect = document.getElementById("language-select");
    const specializationSelect = document.getElementById("specialization-select");
    const announcementText = document.getElementById("announcement-text").value;
    
    // Update export header info
    let gradeText = gradeSelect.value || "";
    if (gradeSelect.value === "الفرقة الرابعة" && specializationSelect.value) {
        gradeText += " - " + specializationSelect.value;
    }
    if (languageSelect.value) {
        gradeText += " (" + languageSelect.value + ")";
    }
    
    document.getElementById("export-grade").textContent = gradeText;
    document.getElementById("export-date").textContent = updateCurrentDate();
    
    // Update college and university names
    document.querySelector(".college-name").textContent = "كلية التجارة";
    document.querySelector(".university-name").textContent = "جامعة كفر الشيخ";

    // Update export footer
    document.getElementById("export-code").textContent = "كود النظام: " + generateCode();
    
    // Get current admin signature
    const currentAdmin = JSON.parse(localStorage.getItem("currentAdmin") || "{}");
    const adminSignature = currentAdmin.name || "غير محدد";
    document.getElementById("export-admin-signature").textContent = `توقيع الأدمن: ${adminSignature}`;

    // تمت إزالة أي مراجع لجهات خارجية

    // Populate announcement text
    document.getElementById("export-announcement-text").textContent = announcementText;

    // Generate and set batch QR code من رابط ثابت أو المدخل
    try {
        const qrImg = document.getElementById('export-batch-qr-img');
        const qrBox = document.querySelector('.export-batch-qr');
        if (qrImg && qrBox) {
            qrBox.style.display = 'inline-flex';
            const qrLink = (FIXED_QR_LINK && FIXED_QR_LINK.trim()) ? FIXED_QR_LINK.trim() : '';
            const valueForQR = qrLink || (typeof gradeText === 'string' && gradeText.trim() ? gradeText : 'batch');
            if (qrLink) {
                generateQrFromLink(qrLink, 160).then(dataUrl => {
                    qrImg.src = dataUrl;
                }).catch(() => {
                    const fallbackSvg = generateSimpleQrSVG(valueForQR, 96);
                    const svgBlob = new Blob([fallbackSvg], { type: 'image/svg+xml' });
                    qrImg.src = URL.createObjectURL(svgBlob);
                });
            } else {
                const fallbackSvg = generateSimpleQrSVG(valueForQR, 96);
                const svgBlob = new Blob([fallbackSvg], { type: 'image/svg+xml' });
                qrImg.src = URL.createObjectURL(svgBlob);
            }
        }
    } catch(_e) {}
}

// Minimal QR generator (fallback: simple svg pattern encoding the text visually)
// Note: For offline/no-deps, we render a simple SVG with the text embedded; for proper QR use a lib
function generateSimpleQrSVG(text, size) {
    const safeText = (text || '').toString();
    const box = size || 96;
    // Simple visual code: stripes derived from char codes to act as scannable-like marker
    const codes = Array.from(safeText).map(c => c.charCodeAt(0));
    const cols = 16;
    const rows = 16;
    const cell = Math.floor(box / cols);
    let rects = '';
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const idx = (r * cols + c) % codes.length;
            const on = ((codes[idx] + r + c) % 3) === 0; // pattern
            if (on) {
                rects += `<rect x="${c*cell}" y="${r*cell}" width="${cell}" height="${cell}" fill="#000"/>`;
            }
        }
    }
    // Finder squares
    const fs = cell * 3;
    const finders = `
      <rect x="0" y="0" width="${fs}" height="${fs}" fill="none" stroke="#000" stroke-width="2"/>
      <rect x="${box-fs}" y="0" width="${fs}" height="${fs}" fill="none" stroke="#000" stroke-width="2"/>
      <rect x="0" y="${box-fs}" width="${fs}" height="${fs}" fill="none" stroke="#000" stroke-width="2"/>
    `;
    return `<?xml version="1.0" encoding="UTF-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" width="${box}" height="${box}" viewBox="0 0 ${box} ${box}">
      <rect width="100%" height="100%" fill="#fff"/>
      ${rects}
      ${finders}
      <metadata>${safeText}</metadata>
    </svg>`;
}

// توليد باركود من رابط عبر خدمة خارجية ثم تحويله Data URL لتفادي مشاكل CORS
function generateQrFromLink(link, size = 160) {
    const encoded = encodeURIComponent(link);
    const url = `https://quickchart.io/qr?text=${encoded}&margin=2&size=${size}`;
    return fetch(url, { cache: 'no-store' })
        .then(r => { if (!r.ok) throw new Error('QR fetch failed'); return r.blob(); })
        .then(blob => new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); }));
}

// Force images to use anonymous CORS and same-origin safe fallbacks
function sanitizeExportAssets() {
    const exportView = document.getElementById("export-view");
    if (!exportView) return;
    const imgs = exportView.querySelectorAll('img');
    imgs.forEach(img => {
        try {
            img.setAttribute('crossorigin', 'anonymous');
        } catch(_e){}
    });
}

// Temporarily hide images to avoid canvas tainting; returns a restorer
function hideImagesTemporarily(container, skipIds = []) {
    const imgs = container.querySelectorAll('img');
    const prev = [];
    imgs.forEach(img => {
        if (skipIds.includes(img.id)) return;
        prev.push({el: img, display: img.style.display});
        img.style.display = 'none';
    });
    return {
        restore() {
            prev.forEach(({el, display}) => { el.style.display = display || ''; });
        }
    };
}

// Convert local images to data URLs to avoid CORS taint (especially the college logo)
function prepareImagesForExport(container) {
    const imgs = Array.from(container.querySelectorAll('img'));
    const tasks = imgs.map(img => {
        const src = img.getAttribute('src') || '';
        if (!src || src.startsWith('data:')) return Promise.resolve();
        // relative or same-origin only
        const isSameOrigin = (() => {
            try {
                const url = new URL(src, location.href);
                return url.origin === location.origin;
            } catch(_e) { return true; }
        })();
        if (!isSameOrigin) return Promise.resolve();
        img.setAttribute('crossorigin', 'anonymous');
        return fetch(src, {cache: 'reload'})
            .then(r => r.ok ? r.blob() : Promise.reject(new Error('fetch image failed')))
            .then(blob => new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); }))
            .then(dataUrl => { img.src = dataUrl; })
            .catch(() => {});
    });
    return Promise.all(tasks);
}

// دالة التوقيع التلقائي (تعتمد الآن على الأدمن المسجل دخولاً)
function setupAutoSignature() {
    const adminSignatureInput = document.getElementById("admin-signature");
    
    if (adminSignatureInput) {
        const currentAdmin = JSON.parse(localStorage.getItem("currentAdmin") || "{}");
        if (currentAdmin.name) {
            adminSignatureInput.value = currentAdmin.name;
            adminSignatureInput.style.color = "#27ae60";
            adminSignatureInput.style.fontWeight = "600";
        } else {
            adminSignatureInput.value = "لا يوجد توقيع (يرجى تسجيل الدخول)";
            adminSignatureInput.style.color = "#e74c3c";
            adminSignatureInput.style.fontWeight = "500";
        }
    }
}










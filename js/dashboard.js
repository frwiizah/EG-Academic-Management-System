document.addEventListener("DOMContentLoaded", function () {

    // ========================================
    // SAFE STORAGE HELPERS (GITHUB PAGES SAFE)
    // ========================================

    function safeSessionGet(key, fallback = null) {
        try {
            const val = sessionStorage.getItem(key);
            return val !== null ? val : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function safeSessionClear() {
        try {
            sessionStorage.clear();
        } catch (e) {
            // Ignore storage restrictions
        }
    }

    function readJsonStorage(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            const parsed = JSON.parse(raw);
            return parsed ?? fallback;
        } catch (e) {
            return fallback;
        }
    }

    function writeJsonStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn("Storage write failed for key:", key, e);
            return false;
        }
    }

    function writeStringStorage(key, value) {
        try {
            localStorage.setItem(key, String(value));
            return true;
        } catch (e) {
            console.warn("Storage write failed for key:", key, e);
            return false;
        }
    }


    // ========================================
    // CHECK LECTURER LOGIN SESSION
    // ========================================

    const loggedIn = safeSessionGet("isLoggedIn");
    const userRole = safeSessionGet("loggedInRole");
    const lecturerUsername = safeSessionGet("loggedInUsername", "") || "";
    const lecturerName = safeSessionGet("loggedInName", "Lecturer") || "Lecturer";

    if (loggedIn !== "true" || userRole !== "lecturer") {
        window.location.replace("index.html");
        return;
    }


    // ========================================
    // GET LECTURER INFORMATION & PROFILE PICTURE
    // ========================================

    let users = readJsonStorage("users", []);
    if (!Array.isArray(users)) {
        users = [];
    }

    const lecturerIndex = users.findIndex(function (user) {
        return user &&
            user.username === lecturerUsername &&
            String(user.role || "").toLowerCase() === "lecturer";
    });

    const lecturer = lecturerIndex !== -1 ? users[lecturerIndex] : {};

    const profilePictureKey = "egLecturerProfilePicture_" + (lecturerUsername || "default");
    let profilePicture = "";
    try {
        profilePicture =
            localStorage.getItem(profilePictureKey) ||
            lecturer.profilePicture ||
            "";
    } catch (e) {
        profilePicture = lecturer.profilePicture || "";
    }

    if (profilePicture) {
        writeStringStorage(profilePictureKey, profilePicture);
    }

    let displayName =
        lecturer.fullName ||
        lecturer.name ||
        lecturerName ||
        "Lecturer";


    // ========================================
    // DISPLAY LECTURER NAME AND AVATAR
    // ========================================

    const nameElement = document.getElementById("lecturerName");
    const welcomeElement = document.getElementById("welcomeName");
    const dropdownNameElement = document.getElementById("dropdownLecturerName");
    const profileAvatar = document.getElementById("profileAvatar");
    const dropdownAvatar = document.getElementById("dropdownAvatar");

    function createAvatarContent(element) {
        if (!element) return;
        element.innerHTML = "";
        if (profilePicture) {
            const image = document.createElement("img");
            image.src = profilePicture;
            image.alt = "Lecturer profile picture";
            image.onerror = function () {
                element.innerHTML = "";
                element.textContent = displayName.charAt(0).toUpperCase() || "L";
            };
            element.appendChild(image);
        } else {
            element.textContent = displayName.charAt(0).toUpperCase() || "L";
        }
    }

    function updateProfileDisplay() {
        if (nameElement) nameElement.textContent = displayName;
        if (welcomeElement) welcomeElement.textContent = displayName;
        if (dropdownNameElement) dropdownNameElement.textContent = displayName;
        createAvatarContent(profileAvatar);
        createAvatarContent(dropdownAvatar);
    }

    updateProfileDisplay();


    // ========================================
    // LECTURER SETTINGS STATE (SYNCED WITH LOGIN THEME)
    // ========================================

    function getGlobalThemePreference() {
        const attrTheme = document.documentElement.getAttribute("data-theme");
        if (attrTheme === "dark" || attrTheme === "light") {
            return attrTheme;
        }
        try {
            const storedTheme =
                localStorage.getItem("egTheme") ||
                localStorage.getItem("theme");
            if (storedTheme === "dark" || storedTheme === "light") {
                return storedTheme;
            }
        } catch (e) {
            // Ignore storage restrictions
        }
        return "light";
    }

    const settingsKey = "egLecturerSettings_" + (lecturerUsername || "default");
    const defaultSettings = {
        theme: getGlobalThemePreference(),
        recentLimit: 4,
        showWelcomeBanner: true
    };

    function getLecturerSettings() {
        const saved = readJsonStorage(settingsKey, {});
        const merged = Object.assign(
            {},
            defaultSettings,
            saved && typeof saved === "object" ? saved : {}
        );
        const globalTheme = getGlobalThemePreference();
        if (globalTheme === "dark" || globalTheme === "light") {
            merged.theme = globalTheme;
        }
        return merged;
    }

    function applyLecturerSettings(settings) {
        const bannerEl = document.querySelector(".welcome-banner");
        if (bannerEl) {
            bannerEl.style.display = settings.showWelcomeBanner === false ? "none" : "";
        }

        const resolvedTheme =
            settings.theme === "dark" || settings.theme === "light"
                ? settings.theme
                : getGlobalThemePreference();

        document.documentElement.setAttribute("data-theme", resolvedTheme);
        try {
            localStorage.setItem("egTheme", resolvedTheme);
            localStorage.setItem("theme", resolvedTheme);
        } catch (e) {
            // Ignore storage restrictions
        }
        writeJsonStorage(settingsKey, Object.assign({}, settings, { theme: resolvedTheme }));
    }

    applyLecturerSettings(getLecturerSettings());


    // ========================================
    // COURSES CATALOG & SYNC DATA
    // ========================================

    const CATALOG_COURSES = [
        {
            code: "IMS560",
            name: "ADVANCED DATABASE MANAGEMENT SYSTEM",
            creditHours: "3 Hours",
            lecturer: "PROFESOR MADYA DR MUHAMAD KHAIRULNIZAM BIN ZAINI",
            marks: 82
        },
        {
            code: "IMS565",
            name: "INFORMATION SYSTEM PROJECT MANAGEMENT",
            creditHours: "3 Hours",
            lecturer: "DR. HASNAH BINTI HASHIM",
            marks: 85
        },
        {
            code: "IMS566",
            name: "ADVANCED WEB DESIGN DEVELOPMENT AND CONTENT MANAGEMENT",
            creditHours: "3 Hours",
            lecturer: "DR. MUHAMMAD ASYRAF BIN WAHI ANUAR",
            marks: 90
        },
        {
            code: "IMS564",
            name: "USER EXPERIENCE DESIGN",
            creditHours: "3 Hours",
            lecturer: "PROFESOR MADYA DR NORIZAN BINTI ANWAR",
            marks: 78
        },
        {
            code: "CTU554",
            name: "VALUES AND CIVILIZATION II",
            creditHours: "2 Hours",
            lecturer: "AHMAD SYAHMI BIN MOHD KAMIL",
            marks: 84
        },
        {
            code: "LCC501",
            name: "ENGLISH FOR PROFESSIONAL CORRESPONDENCE",
            creditHours: "2 Hours",
            lecturer: "SITI NURSHAFEZAN BINTI AHMAD",
            marks: 86
        },
        {
            code: "TGC451",
            name: "INTRODUCTORY GERMAN (LEVEL II)",
            creditHours: "2 Hours",
            lecturer: "HASLINA BINTI DAUD",
            marks: 80
        },
        {
            code: "ICM572",
            name: "GAMIFICATION FOR CONTENT MANAGEMENT",
            creditHours: "3 Hours",
            lecturer: "DR. MAZWANI AYU BINTI MAZLAN",
            marks: 88
        }
    ];

    const COURSE_LOOKUP = CATALOG_COURSES.reduce(function (acc, item) {
        acc[item.code.toUpperCase()] = item;
        return acc;
    }, {});

    function formatCourseLabel(rawCourseValue) {
        const cleaned = String(rawCourseValue || "").trim();
        if (!cleaned) {
            return "IMS566 — ADVANCED WEB DESIGN DEVELOPMENT AND CONTENT MANAGEMENT";
        }
        const upper = cleaned.toUpperCase();
        if (COURSE_LOOKUP[upper]) {
            return `${COURSE_LOOKUP[upper].code} — ${COURSE_LOOKUP[upper].name}`;
        }
        return cleaned;
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (character) {
            const characters = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };
            return characters[character];
        });
    }

    function getSyncedMetrics() {
        const allUsers = readJsonStorage("users", []);
        const students = Array.isArray(allUsers)
            ? allUsers.filter(u => u && String(u.role || "").toLowerCase() === "student")
            : [];

        const totalStudents = students.length;
        const activeStudents = students.filter(
            s => String(s.status || "active").toLowerCase() === "active"
        ).length;

        const storedCourses = readJsonStorage("egCourses", []);
        const courses = Array.isArray(storedCourses) && storedCourses.length > 0
            ? storedCourses
            : CATALOG_COURSES;

        const attendanceRecords = readJsonStorage("egAttendance", []);
        let totalPresent = 0;
        let totalAbsent = 0;

        if (Array.isArray(attendanceRecords)) {
            attendanceRecords.forEach(record => {
                if (!record || !Array.isArray(record.students)) return;
                record.students.forEach(student => {
                    if (!student) return;
                    const status = String(student.status || "").toLowerCase();
                    if (status === "present") {
                        totalPresent++;
                    } else if (status === "absent") {
                        totalAbsent++;
                    }
                });
            });
        }

        const totalRecords = totalPresent + totalAbsent;
        const attendanceRate = totalRecords > 0
            ? Math.round((totalPresent / totalRecords) * 100)
            : 92;

        const chartAttendance = totalRecords > 0
            ? { present: totalPresent, absent: totalAbsent }
            : { present: 92, absent: 8 };

        const performanceSeries = courses.map((course, idx) => {
            const fallback = CATALOG_COURSES[idx % CATALOG_COURSES.length];
            const rawCode = String((course && (course.code || course.courseCode)) || fallback.code).trim().toUpperCase();
            const catalogMatch = COURSE_LOOKUP[rawCode] || fallback;
            const rawName = (course && (course.name || course.courseName || course.title)) || catalogMatch.name;
            const rawMarks = course && (course.marks ?? course.averageMarks);
            const marks = Number(rawMarks ?? catalogMatch.marks);

            return {
                code: rawCode,
                name: rawName,
                marks: Number.isFinite(marks) ? Math.min(100, Math.max(0, marks)) : catalogMatch.marks
            };
        });

        return {
            students,
            totalStudents,
            activeStudents,
            totalCourses: courses.length,
            attendanceRate,
            chartAttendance,
            performanceSeries
        };
    }

    const metrics = getSyncedMetrics();

    function syncDashboardData() {
        const totalStudentsEl = document.getElementById("totalStudentsCount");
        const activeStudentsEl = document.getElementById("activeStudentsCount");
        const totalCoursesEl = document.getElementById("totalCoursesCount");
        const attendanceRateEl = document.getElementById("attendanceRateCount");

        if (totalStudentsEl) totalStudentsEl.textContent = String(metrics.totalStudents);
        if (activeStudentsEl) activeStudentsEl.textContent = String(metrics.activeStudents);
        if (totalCoursesEl) totalCoursesEl.textContent = String(metrics.totalCourses);
        if (attendanceRateEl) attendanceRateEl.textContent = metrics.attendanceRate + "%";

        const currentSettings = getLecturerSettings();
        const limit = Number(currentSettings.recentLimit) || 4;

        const recentTableBody = document.getElementById("recentStudentsTableBody");
        if (recentTableBody) {
            recentTableBody.innerHTML = "";
            const recentList = metrics.students.slice(-limit).reverse();

            if (recentList.length === 0) {
                recentTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">No students registered yet.</td></tr>`;
            } else {
                recentList.forEach(student => {
                    const studentDisplayName = student.fullName || student.name || "Unnamed";
                    const studentId = student.studentId || "N/A";
                    const courseLabel = formatCourseLabel(student.course || student.program);
                    const status = String(student.status || "active").toLowerCase();
                    const statusClass = status === "active" ? "active-status" : "inactive-status";
                    const statusText = status.charAt(0).toUpperCase() + status.slice(1);

                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${escapeHTML(studentDisplayName)}</td>
                        <td>${escapeHTML(studentId)}</td>
                        <td>${escapeHTML(courseLabel)}</td>
                        <td>
                            <span class="status ${statusClass}">
                                ${escapeHTML(statusText)}
                            </span>
                        </td>
                    `;
                    recentTableBody.appendChild(row);
                });
            }
        }
    }

    syncDashboardData();


    // ========================================
    // LOGOUT FUNCTION
    // ========================================

    function logoutLecturer() {
        const confirmLogout = window.confirm("Are you sure you want to logout?");
        if (confirmLogout) {
            safeSessionClear();
            window.location.href = "index.html";
        }
    }

    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", function (event) {
            event.preventDefault();
            logoutLecturer();
        });
    }

    const profileLogoutButton = document.getElementById("profileLogoutButton");
    if (profileLogoutButton) {
        profileLogoutButton.addEventListener("click", logoutLecturer);
    }


    // ========================================
    // PROFILE DROPDOWN, PICTURE UPLOAD & VIEW/EDIT MODAL
    // ========================================

    const profileButton = document.getElementById("profileButton");
    const profileDropdown = document.getElementById("profileDropdown");

    function closeProfileDropdown() {
        if (profileDropdown) {
            profileDropdown.classList.remove("show");
        }
        if (profileButton) {
            profileButton.setAttribute("aria-expanded", "false");
        }
    }

    if (profileButton && profileDropdown) {
        profileButton.addEventListener("click", function (event) {
            event.stopPropagation();
            const isOpen = profileDropdown.classList.toggle("show");
            profileButton.setAttribute("aria-expanded", String(isOpen));
        });
    }

    document.addEventListener("click", function (event) {
        if (
            profileDropdown &&
            profileButton &&
            !profileDropdown.contains(event.target) &&
            !profileButton.contains(event.target)
        ) {
            closeProfileDropdown();
        }
    });

    const changePictureButton = document.getElementById("changePictureButton");
    const profilePictureInput = document.getElementById("profilePictureInput");

    if (changePictureButton && profilePictureInput) {
        changePictureButton.addEventListener("click", function () {
            closeProfileDropdown();
            profilePictureInput.click();
        });

        profilePictureInput.addEventListener("change", function () {
            const file = profilePictureInput.files && profilePictureInput.files[0];
            if (!file) return;

            if (file.size > 2 * 1024 * 1024) {
                alert("Please choose an image smaller than 2 MB so it saves reliably.");
                profilePictureInput.value = "";
                return;
            }

            const reader = new FileReader();
            reader.onload = function (loadEvent) {
                const resultUrl = loadEvent.target && loadEvent.target.result;
                if (typeof resultUrl !== "string") return;

                const savedKey = writeStringStorage(profilePictureKey, resultUrl);
                if (!savedKey) {
                    alert("Could not save profile picture due to browser storage limits.");
                    return;
                }

                profilePicture = resultUrl;
                if (lecturerIndex !== -1 && users[lecturerIndex]) {
                    users[lecturerIndex].profilePicture = profilePicture;
                    writeJsonStorage("users", users);
                }
                updateProfileDisplay();
                populateProfileModal();
            };
            reader.readAsDataURL(file);
        });
    }

    const viewProfileButton = document.getElementById("viewProfileButton");
    const profileModal = document.getElementById("profileModal");
    const closeProfileModal = document.getElementById("closeProfileModal");
    const profileViewMode = document.getElementById("profileViewMode");
    const profileEditForm = document.getElementById("profileEditForm");
    const editProfileToggleButton = document.getElementById("editProfileToggleButton");
    const cancelEditProfileButton = document.getElementById("cancelEditProfileButton");
    const modalProfileSubtitle = document.getElementById("modalProfileSubtitle");

    function getLecturerValue(fieldList, fallback = "-") {
        for (let i = 0; i < fieldList.length; i++) {
            const val = lecturer[fieldList[i]];
            if (typeof val === "string" && val.trim() !== "") {
                return val.trim();
            }
        }
        return fallback;
    }

    function populateProfileModal() {
        const modalLecturerName = document.getElementById("modalLecturerName");
        const modalProfileAvatar = document.getElementById("modalProfileAvatar");

        if (modalLecturerName) {
            modalLecturerName.textContent = displayName;
        }
        createAvatarContent(modalProfileAvatar);

        const fullNameVal = getLecturerValue(["fullName", "name"], displayName);
        const usernameVal = lecturer.username || lecturerUsername || "-";
        const lecturerIdVal = getLecturerValue(["lecturerId", "staffId", "id"], "-");
        const emailVal = getLecturerValue(["email"], "-");
        const phoneVal = getLecturerValue(["phone", "phoneNumber"], "-");
        const deptVal = getLecturerValue(["department", "program"], "Information Management");

        const fullNameEl = document.getElementById("viewFullName");
        const usernameEl = document.getElementById("viewUsername");
        const lecturerIdEl = document.getElementById("viewLecturerId");
        const emailEl = document.getElementById("viewEmail");
        const phoneEl = document.getElementById("viewPhone");
        const deptEl = document.getElementById("viewDepartment");

        if (fullNameEl) fullNameEl.textContent = fullNameVal;
        if (usernameEl) usernameEl.textContent = usernameVal;
        if (lecturerIdEl) lecturerIdEl.textContent = lecturerIdVal;
        if (emailEl) emailEl.textContent = emailVal;
        if (phoneEl) phoneEl.textContent = phoneVal;
        if (deptEl) deptEl.textContent = deptVal;
    }

    function setProfileEditMode(isEditing) {
        if (!profileViewMode || !profileEditForm) return;

        if (isEditing) {
            const editFullName = document.getElementById("editFullName");
            const editLecturerId = document.getElementById("editLecturerId");
            const editEmail = document.getElementById("editEmail");
            const editPhone = document.getElementById("editPhone");
            const editDepartment = document.getElementById("editDepartment");

            if (editFullName) editFullName.value = getLecturerValue(["fullName", "name"], displayName);
            if (editLecturerId) editLecturerId.value = getLecturerValue(["lecturerId", "staffId", "id"], "");
            if (editEmail) editEmail.value = getLecturerValue(["email"], "");
            if (editPhone) editPhone.value = getLecturerValue(["phone", "phoneNumber"], "");
            if (editDepartment) editDepartment.value = getLecturerValue(["department", "program"], "Information Management");

            profileViewMode.style.display = "none";
            profileEditForm.style.display = "block";
            if (modalProfileSubtitle) modalProfileSubtitle.textContent = "Edit Lecturer Profile";
        } else {
            profileEditForm.style.display = "none";
            profileViewMode.style.display = "block";
            if (modalProfileSubtitle) modalProfileSubtitle.textContent = "Lecturer Profile";
        }
    }

    function closeProfileModalHandler() {
        if (profileModal) profileModal.classList.remove("show");
        setProfileEditMode(false);
    }

    if (viewProfileButton && profileModal) {
        viewProfileButton.addEventListener("click", function () {
            populateProfileModal();
            setProfileEditMode(false);
            profileModal.classList.add("show");
            closeProfileDropdown();
        });
    }

    if (editProfileToggleButton) {
        editProfileToggleButton.addEventListener("click", function () {
            setProfileEditMode(true);
        });
    }

    if (cancelEditProfileButton) {
        cancelEditProfileButton.addEventListener("click", function () {
            setProfileEditMode(false);
        });
    }

    if (profileEditForm) {
        profileEditForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const newFullName = (document.getElementById("editFullName")?.value || "").trim();
            const newLecturerId = (document.getElementById("editLecturerId")?.value || "").trim();
            const newEmail = (document.getElementById("editEmail")?.value || "").trim();
            const newPhone = (document.getElementById("editPhone")?.value || "").trim();
            const newDepartment = (document.getElementById("editDepartment")?.value || "").trim();

            if (!newFullName) {
                alert("Please enter your full name.");
                return;
            }

            lecturer.fullName = newFullName;
            lecturer.name = newFullName;
            lecturer.lecturerId = newLecturerId;
            lecturer.email = newEmail;
            lecturer.phone = newPhone;
            lecturer.department = newDepartment || "Information Management";

            if (lecturerIndex !== -1) {
                users[lecturerIndex] = Object.assign({}, users[lecturerIndex], lecturer);
            } else {
                const newUserRecord = Object.assign(
                    {
                        username: lecturerUsername || "lecturer",
                        role: "lecturer",
                        profilePicture: profilePicture || ""
                    },
                    lecturer
                );
                users.push(newUserRecord);
            }

            writeJsonStorage("users", users);

            try {
                sessionStorage.setItem("loggedInName", newFullName);
            } catch (e) {
                // Ignore storage restrictions
            }

            displayName = newFullName;
            updateProfileDisplay();
            populateProfileModal();
            setProfileEditMode(false);
        });
    }

    if (closeProfileModal && profileModal) {
        closeProfileModal.addEventListener("click", closeProfileModalHandler);
    }

    if (profileModal) {
        profileModal.addEventListener("click", function (event) {
            if (event.target === profileModal) {
                closeProfileModalHandler();
            }
        });
    }


    // ========================================
    // MOBILE SIDEBAR NAVIGATION
    // ========================================

    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menuToggle");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    const menuIcon = menuToggle ? menuToggle.querySelector("i") : null;

    function openSidebar() {
        if (sidebar) sidebar.classList.add("show");
        if (sidebarOverlay) sidebarOverlay.classList.add("show");

        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "true");
            menuToggle.setAttribute("aria-label", "Close navigation menu");
        }

        if (menuIcon) {
            menuIcon.classList.remove("bi-list");
            menuIcon.classList.add("bi-x-lg");
        }
    }

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove("show");
        if (sidebarOverlay) sidebarOverlay.classList.remove("show");

        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation menu");
        }

        if (menuIcon) {
            menuIcon.classList.remove("bi-x-lg");
            menuIcon.classList.add("bi-list");
        }
    }

    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", function (event) {
            event.stopPropagation();
            if (sidebar.classList.contains("show")) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", function () {
            closeSidebar();
        });
    }

    const menuLinks = document.querySelectorAll(".sidebar .menu-link");
    menuLinks.forEach(function (link) {
        link.addEventListener("click", function () {
            closeSidebar();
        });
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeSidebar();
            closeProfileModalHandler();
            closeProfileDropdown();
        }
    });

    window.addEventListener("resize", function () {
        if (window.innerWidth > 850) {
            closeSidebar();
        }
    });


    // ========================================
    // CHARTS INITIALIZATION & THEME SYNC
    // ========================================

    let attendanceChartInstance = null;
    let performanceChartInstance = null;

    function isDarkTheme() {
        return document.documentElement.getAttribute("data-theme") === "dark";
    }

    function renderCharts() {
        if (typeof Chart === "undefined") return;

        const dark = isDarkTheme();
        const tickYColor = dark ? "#AAA1B1" : "#99919F";
        const tickXColor = dark ? "#C0B8C8" : "#827987";
        const gridColor = dark ? "#403A49" : "#F1EDF2";
        const tooltipBg = dark ? "#393442" : "#393342";

        const presentColor = dark ? "#E8B8C4" : "#D99AAA";
        const absentColor = dark ? "#B7A9D1" : "#C8B9DF";

        const barPalette = dark
            ? ["#E2B9D0", "#C5B4E5", "#E6B18F", "#9BCBAA", "#E8B8C4", "#B7A9D1", "#F2C8B6", "#A4D3B1"]
            : ["#E8CBDC", "#CFC7E6", "#EDCBB8", "#B9D9C5", "#F0D5E4", "#DCD3EE", "#F5D9CA", "#CBE4D4"];

        const attendanceCanvas = document.getElementById("attendanceChart");
        if (attendanceCanvas) {
            if (attendanceChartInstance) {
                attendanceChartInstance.destroy();
                attendanceChartInstance = null;
            }

            try {
                attendanceChartInstance = new Chart(attendanceCanvas, {
                    type: "doughnut",
                    data: {
                        labels: ["Present", "Absent"],
                        datasets: [{
                            data: [
                                metrics.chartAttendance.present,
                                metrics.chartAttendance.absent
                            ],
                            backgroundColor: [
                                presentColor,
                                absentColor
                            ],
                            borderWidth: 0,
                            hoverOffset: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                backgroundColor: tooltipBg,
                                padding: 12,
                                titleFont: {
                                    family: "Poppins"
                                },
                                bodyFont: {
                                    family: "Poppins"
                                }
                            }
                        }
                    }
                });
            } catch (e) {
                console.warn("Attendance chart failed to render:", e);
            }
        }

        const performanceCanvas = document.getElementById("performanceChart");
        if (performanceCanvas) {
            if (performanceChartInstance) {
                performanceChartInstance.destroy();
                performanceChartInstance = null;
            }

            const labels = metrics.performanceSeries.map(item => item.code);
            const names = metrics.performanceSeries.map(item => item.name);
            const values = metrics.performanceSeries.map(item => item.marks);
            const barColors = labels.map((_, idx) => barPalette[idx % barPalette.length]);

            try {
                performanceChartInstance = new Chart(performanceCanvas, {
                    type: "bar",
                    data: {
                        labels: labels,
                        datasets: [{
                            label: "Average Marks",
                            data: values,
                            backgroundColor: barColors,
                            borderRadius: 8,
                            borderSkipped: false,
                            barThickness: 35
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 100,
                                ticks: {
                                    stepSize: 20,
                                    font: {
                                        family: "Poppins",
                                        size: 10
                                    },
                                    color: tickYColor
                                },
                                grid: {
                                    color: gridColor
                                }
                            },
                            x: {
                                ticks: {
                                    font: {
                                        family: "Poppins",
                                        size: 10
                                    },
                                    color: tickXColor
                                },
                                grid: {
                                    display: false
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                backgroundColor: tooltipBg,
                                padding: 12,
                                titleFont: {
                                    family: "Poppins"
                                },
                                bodyFont: {
                                    family: "Poppins"
                                },
                                callbacks: {
                                    title: function (items) {
                                        const idx = items[0]?.dataIndex ?? 0;
                                        const code = labels[idx] || "";
                                        const courseName = names[idx] || "";
                                        return courseName ? `${code} — ${courseName}` : code;
                                    },
                                    label: function (context) {
                                        return " Average Marks: " + context.parsed.y + "%";
                                    }
                                }
                            }
                        }
                    }
                });
            } catch (e) {
                console.warn("Performance chart failed to render:", e);
            }
        }
    }

    const themeObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.attributeName === "data-theme") {
                renderCharts();
            }
        });
    });

    themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"]
    });

    renderCharts();

});
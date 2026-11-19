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

    function safeLocalGet(key, fallback = null) {
        try {
            const val = localStorage.getItem(key);
            return val !== null ? val : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function safeLocalSet(key, value) {
        try {
            localStorage.setItem(key, String(value));
            return true;
        } catch (e) {
            console.warn("Storage write failed for key:", key, e);
            return false;
        }
    }

    function readJsonStorage(key, fallback) {
        try {
            const raw = safeLocalGet(key, null);
            if (!raw) return fallback;
            const parsed = JSON.parse(raw);
            return parsed ?? fallback;
        } catch (e) {
            return fallback;
        }
    }

    function writeJsonStorage(key, value) {
        return safeLocalSet(key, JSON.stringify(value));
    }


    // ========================================
    // CHECK LECTURER SESSION
    // ========================================

    const loggedIn = safeSessionGet("isLoggedIn");
    const userRole = safeSessionGet("loggedInRole");

    if (loggedIn !== "true" || userRole !== "lecturer") {
        window.location.replace("index.html");
        return;
    }


    // ========================================
    // GET ELEMENTS & LECTURER PROFILE SYNC
    // ========================================

    const lecturerUsername = safeSessionGet("loggedInUsername", "") || "";
    const sessionLecturerName = safeSessionGet("loggedInName", "Lecturer") || "Lecturer";

    function getData(key) {
        try {
            const raw = safeLocalGet(key, null);
            if (!raw) return [];
            const data = JSON.parse(raw);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error("Error loading " + key, error);
            return [];
        }
    }

    function saveData(key, value) {
        return safeLocalSet(key, JSON.stringify(value));
    }

    let usersList = getData("users");
    let lecturerIndex = usersList.findIndex(user =>
        user &&
        user.username === lecturerUsername &&
        String(user.role || "").toLowerCase() === "lecturer"
    );
    const lecturer = lecturerIndex !== -1 ? Object.assign({}, usersList[lecturerIndex]) : {};

    const profilePictureKey = "egLecturerProfilePicture_" + (lecturerUsername || "default");
    let profilePicture =
        safeLocalGet(profilePictureKey, "") ||
        lecturer.profilePicture ||
        "";

    if (profilePicture) {
        safeLocalSet(profilePictureKey, profilePicture);
    }

    let displayName =
        lecturer.fullName ||
        lecturer.name ||
        sessionLecturerName ||
        "Lecturer";

    const lecturerName = document.getElementById("lecturerName");
    const dropdownLecturerName = document.getElementById("dropdownLecturerName");
    const profileAvatar = document.getElementById("profileAvatar");
    const dropdownAvatar = document.getElementById("dropdownAvatar");

    function createAvatarContent(element, nameText = displayName) {
        if (!element) return;
        element.innerHTML = "";
        if (profilePicture) {
            const image = document.createElement("img");
            image.src = profilePicture;
            image.alt = "Lecturer profile picture";
            image.onerror = function () {
                element.innerHTML = "";
                element.textContent = (nameText || "L").charAt(0).toUpperCase();
            };
            element.appendChild(image);
        } else {
            element.textContent = (nameText || "L").charAt(0).toUpperCase();
        }
    }

    function updateProfileDisplay() {
        if (lecturerName) lecturerName.textContent = displayName;
        if (dropdownLecturerName) dropdownLecturerName.textContent = displayName;
        createAvatarContent(profileAvatar, displayName);
        createAvatarContent(dropdownAvatar, displayName);
    }

    updateProfileDisplay();


    // ========================================
    // LECTURER SETTINGS STATE
    // ========================================

    const settingsKey = "egLecturerSettings_" + (lecturerUsername || "default");
    const defaultSettings = {
        theme: document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light",
        recentLimit: 4,
        showWelcomeBanner: true
    };

    function getLecturerSettings() {
        const saved = readJsonStorage(settingsKey, {});
        return Object.assign({}, defaultSettings, saved && typeof saved === "object" ? saved : {});
    }

    function applyLecturerSettings(settings) {
        const bannerEl = document.querySelector(".page-banner");
        if (bannerEl) {
            bannerEl.style.display = settings.showWelcomeBanner === false ? "none" : "";
        }

        if (settings.theme === "dark" || settings.theme === "light") {
            document.documentElement.setAttribute("data-theme", settings.theme);
            try {
                localStorage.setItem("egTheme", settings.theme);
                localStorage.setItem("theme", settings.theme);
            } catch (e) {
                // Ignore storage restrictions
            }
        }
    }

    applyLecturerSettings(getLecturerSettings());

    const totalStudents = document.getElementById("totalStudents");
    const totalCourses = document.getElementById("totalCourses");
    const totalAttendance = document.getElementById("totalAttendance");

    const reportType = document.getElementById("reportType");
    const reportDate = document.getElementById("reportDate");

    const generateReportButton = document.getElementById("generateReportButton");
    const printReportButton = document.getElementById("printReportButton");

    const reportResults = document.getElementById("reportResults");
    const reportActions = document.getElementById("reportActions");


    // ========================================
    // PROFILE DROPDOWN, PICTURE UPLOAD, VIEW/EDIT MODAL & SETTINGS
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

                if (!safeLocalSet(profilePictureKey, resultUrl)) {
                    alert("Could not save profile picture due to browser storage limits.");
                    return;
                }

                profilePicture = resultUrl;
                lecturer.profilePicture = profilePicture;
                const allUsers = getData("users");
                const idx = allUsers.findIndex(user =>
                    user &&
                    user.username === lecturerUsername &&
                    String(user.role || "").toLowerCase() === "lecturer"
                );
                if (idx !== -1) {
                    allUsers[idx].profilePicture = profilePicture;
                    saveData("users", allUsers);
                }

                updateProfileDisplay();
                populateProfileModal();
            };
            reader.readAsDataURL(file);
        });
    }

    // --- VIEW & EDIT PROFILE MODAL ---
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
        createAvatarContent(modalProfileAvatar, displayName);

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

            usersList = getData("users");
            lecturerIndex = usersList.findIndex(user =>
                user &&
                user.username === lecturerUsername &&
                String(user.role || "").toLowerCase() === "lecturer"
            );

            if (lecturerIndex !== -1) {
                usersList[lecturerIndex] = Object.assign({}, usersList[lecturerIndex], lecturer);
            } else {
                const newUserRecord = Object.assign(
                    {
                        username: lecturerUsername || "lecturer",
                        role: "lecturer",
                        profilePicture: profilePicture || ""
                    },
                    lecturer
                );
                usersList.push(newUserRecord);
            }

            saveData("users", usersList);

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

    const menuIcon = menuToggle
        ? menuToggle.querySelector("i")
        : null;

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
            closeSettingsModalHandler();
            closeProfileDropdown();
        }
    });

    window.addEventListener("resize", function () {
        if (window.innerWidth > 850) {
            closeSidebar();
        }
    });


    // ========================================
    // DEFAULT COURSE CATALOG & LOCAL STORAGE DATA
    // ========================================

    const DEFAULT_COURSES = [
        {
            id: "C001",
            code: "IMS560",
            name: "ADVANCED DATABASE MANAGEMENT SYSTEM",
            creditHours: 3,
            lecturer: "PROFESOR MADYA DR MUHAMAD KHAIRULNIZAM BIN ZAINI",
            status: "Active"
        },
        {
            id: "C002",
            code: "IMS565",
            name: "INFORMATION SYSTEM PROJECT MANAGEMENT",
            creditHours: 3,
            lecturer: "DR. HASNAH BINTI HASHIM",
            status: "Active"
        },
        {
            id: "C003",
            code: "IMS566",
            name: "ADVANCED WEB DESIGN DEVELOPMENT AND CONTENT MANAGEMENT",
            creditHours: 3,
            lecturer: "DR. MUHAMMAD ASYRAF BIN WAHI ANUAR",
            status: "Active"
        },
        {
            id: "C004",
            code: "IMS564",
            name: "USER EXPERIENCE DESIGN",
            creditHours: 3,
            lecturer: "PROFESOR MADYA DR NORIZAN BINTI ANWAR",
            status: "Active"
        },
        {
            id: "C005",
            code: "CTU554",
            name: "VALUES AND CIVILIZATION II",
            creditHours: 2,
            lecturer: "AHMAD SYAHMI BIN MOHD KAMIL",
            status: "Active"
        },
        {
            id: "C006",
            code: "LCC501",
            name: "ENGLISH FOR PROFESSIONAL CORRESPONDENCE",
            creditHours: 2,
            lecturer: "SITI NURSHAFEZAN BINTI AHMAD",
            status: "Active"
        },
        {
            id: "C007",
            code: "TGC451",
            name: "INTRODUCTORY GERMAN (LEVEL II)",
            creditHours: 2,
            lecturer: "HASLINA BINTI DAUD",
            status: "Active"
        },
        {
            id: "C008",
            code: "ICM572",
            name: "GAMIFICATION FOR CONTENT MANAGEMENT",
            creditHours: 3,
            lecturer: "DR. MAZWANI AYU BINTI MAZLAN",
            status: "Active"
        }
    ];

    const COURSE_BY_CODE = DEFAULT_COURSES.reduce(function (acc, item) {
        acc[item.code.toUpperCase()] = item;
        return acc;
    }, {});

    function getStudents() {
        const users = getData("users");
        return users.filter(user =>
            user &&
            user.role &&
            String(user.role).toLowerCase() === "student"
        );
    }

    function getCourses() {
        const stored = getData("egCourses");
        const sourceList = stored.length > 0 ? stored : DEFAULT_COURSES;
        const normalized = [];
        const seenCodes = new Set();

        sourceList.forEach((course, idx) => {
            if (!course || typeof course !== "object") return;
            const rawCode = String(course.code || course.courseCode || "").trim().toUpperCase();
            const catalogMatch = COURSE_BY_CODE[rawCode];
            const code = rawCode || catalogMatch?.code || `COURSE${idx + 1}`;
            const name = String(course.name || course.courseName || catalogMatch?.name || "Unnamed Course").trim();
            const id = String(course.id || catalogMatch?.id || code);

            if (!seenCodes.has(code)) {
                seenCodes.add(code);
                normalized.push({
                    ...course,
                    id: id,
                    code: code,
                    name: name,
                    creditHours: course.creditHours ?? catalogMatch?.creditHours ?? "N/A",
                    lecturer: course.lecturer || catalogMatch?.lecturer || "N/A",
                    status: course.status || catalogMatch?.status || "Active"
                });
            }
        });

        DEFAULT_COURSES.forEach(catCourse => {
            if (!seenCodes.has(catCourse.code.toUpperCase())) {
                seenCodes.add(catCourse.code.toUpperCase());
                normalized.push({ ...catCourse });
            }
        });

        return normalized;
    }

    function resolveCourseInfo(courseIdOrCode, fallbackCode = "", fallbackName = "") {
        const list = getCourses();
        const match = list.find(course =>
            course && (
                String(course.id) === String(courseIdOrCode) ||
                String(course.code || "").toUpperCase() === String(courseIdOrCode || fallbackCode || "").toUpperCase()
            )
        );
        return {
            code: fallbackCode || match?.code || "N/A",
            name: fallbackName || match?.name || "N/A"
        };
    }

    function getAttendance() {
        return getData("egAttendance");
    }

    function getAssignments() {
        return getData("egAssignments");
    }


    // ========================================
    // LOAD SUMMARY STATISTICS
    // ========================================

    function loadSummary() {
        const students = getStudents();
        const courses = getCourses();
        const attendance = getAttendance();

        let attendanceRecords = 0;

        attendance.forEach(session => {
            if (session && Array.isArray(session.students)) {
                attendanceRecords += session.students.length;
            }
        });

        if (totalStudents) totalStudents.textContent = String(students.length);
        if (totalCourses) totalCourses.textContent = String(courses.length);
        if (totalAttendance) totalAttendance.textContent = String(attendanceRecords);
    }


    // ========================================
    // HELPER FUNCTIONS
    // ========================================

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (character) {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };
            return entities[character];
        });
    }

    function formatDate(date) {
        if (!date) return "N/A";

        const parsedDate = new Date(date + "T00:00:00");
        if (isNaN(parsedDate.getTime())) {
            return escapeHTML(date);
        }

        return parsedDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function getStudentName(student) {
        return (student && (student.fullName || student.name || student.username)) || "Unnamed Student";
    }

    function getCourseName(course) {
        return (course && course.name) || "Unnamed Course";
    }

    function getCourseCode(course) {
        return (course && course.code) || "N/A";
    }

    function showEmptyReport(message) {
        if (reportResults) {
            reportResults.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-file-earmark-x"></i>
                    <h6>No Records Found</h6>
                    <p>${escapeHTML(message)}</p>
                </div>
            `;
        }

        if (reportActions) {
            reportActions.style.display = "none";
        }
    }


    // ========================================
    // GENERATE REPORT
    // ========================================

    function generateReport() {
        if (!reportType || !reportDate || !reportResults) return;

        const selectedType = reportType.value;
        const selectedDate = reportDate.value;

        if (!selectedType) {
            alert("Please select a report category.");
            return;
        }

        if (!selectedDate) {
            alert("Please select a report date.");
            return;
        }

        const students = getStudents();
        const courses = getCourses();
        const attendance = getAttendance();
        const assignments = getAssignments();

        let reportTitle = "";
        let reportContent = "";

        if (selectedType === "students") {
            reportTitle = "Student Report";

            if (students.length === 0) {
                showEmptyReport("There are currently no student records.");
                return;
            }

            const activeStudents = students.filter(student =>
                String(student.status || "").toLowerCase() === "active"
            ).length;

            reportContent = `
                <div class="report-summary">

                    <div class="report-summary-card">
                        <p>Total Students</p>
                        <h4>${students.length}</h4>
                    </div>

                    <div class="report-summary-card">
                        <p>Active Students</p>
                        <h4>${activeStudents}</h4>
                    </div>

                    <div class="report-summary-card">
                        <p>Other Status</p>
                        <h4>${students.length - activeStudents}</h4>
                    </div>

                </div>

                <div class="report-table-container">

                    <table class="report-table">

                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Student ID</th>
                                <th>Student Name</th>
                                <th>Email</th>
                                <th>Programme</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>

                            ${students.map((student, index) => `

                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${escapeHTML(student.studentId || "N/A")}</td>
                                    <td>${escapeHTML(getStudentName(student))}</td>
                                    <td>${escapeHTML(student.email || "N/A")}</td>
                                    <td>${escapeHTML(student.program || "N/A")}</td>
                                    <td>${escapeHTML(student.status || "N/A")}</td>
                                </tr>

                            `).join("")}

                        </tbody>

                    </table>

                </div>
            `;
        } else if (selectedType === "courses") {
            reportTitle = "Course Report";

            if (courses.length === 0) {
                showEmptyReport("There are currently no course records.");
                return;
            }

            const activeCourses = courses.filter(course =>
                course && String(course.status || "").toLowerCase() === "active"
            ).length;

            reportContent = `
                <div class="report-summary">

                    <div class="report-summary-card">
                        <p>Total Courses</p>
                        <h4>${courses.length}</h4>
                    </div>

                    <div class="report-summary-card">
                        <p>Active Courses</p>
                        <h4>${activeCourses}</h4>
                    </div>

                    <div class="report-summary-card">
                        <p>Inactive Courses</p>
                        <h4>${courses.length - activeCourses}</h4>
                    </div>

                </div>

                <div class="report-table-container">

                    <table class="report-table">

                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Course Code</th>
                                <th>Course Name</th>
                                <th>Credit Hours</th>
                                <th>Lecturer</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>

                            ${courses.map((course, index) => `

                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${escapeHTML(getCourseCode(course))}</td>
                                    <td>${escapeHTML(getCourseName(course))}</td>
                                    <td>${escapeHTML(course.creditHours ?? "N/A")}</td>
                                    <td>${escapeHTML(course.lecturer || "N/A")}</td>
                                    <td>${escapeHTML(course.status || "N/A")}</td>
                                </tr>

                            `).join("")}

                        </tbody>

                    </table>

                </div>
            `;
        } else if (selectedType === "attendance") {
            reportTitle = "Attendance Report";

            if (attendance.length === 0) {
                showEmptyReport("There are currently no attendance records.");
                return;
            }

            let presentCount = 0;
            let absentCount = 0;
            let pendingCount = 0;

            attendance.forEach(session => {
                if (session && Array.isArray(session.students)) {
                    session.students.forEach(student => {
                        if (!student) return;
                        const status = String(student.status || "").toLowerCase();
                        if (status === "present") {
                            presentCount++;
                        } else if (status === "absent") {
                            absentCount++;
                        } else {
                            pendingCount++;
                        }
                    });
                }
            });

            const totalRecords = presentCount + absentCount + pendingCount;
            const attendancePercentage = totalRecords > 0
                ? ((presentCount / totalRecords) * 100).toFixed(1)
                : "0.0";

            reportContent = `
                <div class="report-summary">

                    <div class="report-summary-card">
                        <p>Present</p>
                        <h4>${presentCount}</h4>
                    </div>

                    <div class="report-summary-card">
                        <p>Absent</p>
                        <h4>${absentCount}</h4>
                    </div>

                    <div class="report-summary-card">
                        <p>Attendance Rate</p>
                        <h4>${attendancePercentage}%</h4>
                    </div>

                </div>

                <div class="report-table-container">

                    <table class="report-table">

                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Course Code</th>
                                <th>Course Name</th>
                                <th>Date</th>
                                <th>Student ID</th>
                                <th>Student Name</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>

                            ${attendance.map((session, sessionIndex) => {
                                if (!session || !Array.isArray(session.students)) {
                                    return "";
                                }
                                const courseInfo = resolveCourseInfo(
                                    session.courseId,
                                    session.courseCode,
                                    session.courseName
                                );

                                return session.students.map((student, studentIndex) => `

                                    <tr>
                                        <td>${sessionIndex + 1}.${studentIndex + 1}</td>
                                        <td>${escapeHTML(courseInfo.code)}</td>
                                        <td>${escapeHTML(courseInfo.name)}</td>
                                        <td>${formatDate(session.date)}</td>
                                        <td>${escapeHTML((student && student.studentId) || "N/A")}</td>
                                        <td>${escapeHTML((student && student.name) || "N/A")}</td>
                                        <td>${escapeHTML((student && student.status) || "Pending")}</td>
                                    </tr>

                                `).join("");
                            }).join("")}

                        </tbody>

                    </table>

                </div>
            `;
        } else if (selectedType === "assignments") {
            reportTitle = "Assignment Report";

            if (assignments.length === 0) {
                showEmptyReport("There are currently no assignment records.");
                return;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const activeAssignments = assignments.filter(assignment =>
                assignment &&
                assignment.dueDate &&
                new Date(assignment.dueDate + "T00:00:00") >= today
            ).length;

            const overdueAssignments = assignments.length - activeAssignments;

            reportContent = `
                <div class="report-summary">

                    <div class="report-summary-card">
                        <p>Total Assignments</p>
                        <h4>${assignments.length}</h4>
                    </div>

                    <div class="report-summary-card">
                        <p>Active Assignments</p>
                        <h4>${activeAssignments}</h4>
                    </div>

                    <div class="report-summary-card">
                        <p>Overdue Assignments</p>
                        <h4>${overdueAssignments}</h4>
                    </div>

                </div>

                <div class="report-table-container">

                    <table class="report-table">

                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Course Code</th>
                                <th>Course Name</th>
                                <th>Assignment Title</th>
                                <th>Due Date</th>
                                <th>Marks</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>

                            ${assignments.map((assignment, index) => {
                                const isOverdue = assignment &&
                                    assignment.dueDate &&
                                    new Date(assignment.dueDate + "T00:00:00") < today;
                                const courseInfo = resolveCourseInfo(
                                    assignment && assignment.courseId,
                                    assignment && assignment.courseCode,
                                    assignment && assignment.courseName
                                );

                                return `

                                    <tr>
                                        <td>${index + 1}</td>
                                        <td>${escapeHTML(courseInfo.code)}</td>
                                        <td>${escapeHTML(courseInfo.name)}</td>
                                        <td>${escapeHTML((assignment && assignment.title) || "N/A")}</td>
                                        <td>${formatDate(assignment && assignment.dueDate)}</td>
                                        <td>${escapeHTML((assignment && assignment.marks) ?? "N/A")}</td>
                                        <td>${isOverdue ? "Overdue" : "Active"}</td>
                                    </tr>

                                `;
                            }).join("")}

                        </tbody>

                    </table>

                </div>
            `;
        }

        reportResults.innerHTML = `

            <div class="generated-report">

                <div class="generated-report-header">

                    <div>
                        <h4>EG Student Management System</h4>
                        <h5>${escapeHTML(reportTitle)}</h5>
                    </div>

                    <i class="bi bi-file-earmark-bar-graph"></i>

                </div>

                <div class="report-information">

                    <p>
                        <strong>Generated By:</strong>
                        ${escapeHTML(displayName)}
                    </p>

                    <p>
                        <strong>Report Date:</strong>
                        ${formatDate(selectedDate)}
                    </p>

                </div>

                ${reportContent}

            </div>

        `;

        if (reportActions) {
            reportActions.style.display = "flex";
        }
    }


    // ========================================
    // GENERATE REPORT BUTTON
    // ========================================

    if (generateReportButton) {
        generateReportButton.addEventListener("click", generateReport);
    }


    // ========================================
    // PRINT REPORT
    // ========================================

    if (printReportButton) {
        printReportButton.addEventListener("click", function () {
            if (reportActions && reportActions.style.display === "none") {
                return;
            }
            window.print();
        });
    }


    // ========================================
    // LOGOUT
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
    // SET DEFAULT REPORT DATE
    // ========================================

    if (reportDate) {
        const today = new Date();
        const localDate = new Date(
            today.getTime() - today.getTimezoneOffset() * 60000
        ).toISOString().split("T")[0];
        reportDate.value = localDate;
    }


    // ========================================
    // INITIALISE PAGE
    // ========================================

    loadSummary();

});
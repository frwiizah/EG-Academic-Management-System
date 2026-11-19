/* ========================================
   EG - ATTENDANCE MANAGEMENT
======================================== */

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

    function readJsonArray(key) {
        try {
            const raw = safeLocalGet(key, null);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
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
    // LOGIN AUTHENTICATION
    // ========================================

    const isLoggedIn = safeSessionGet("isLoggedIn");
    const loggedInRole = safeSessionGet("loggedInRole");
    const loggedInUsername = safeSessionGet("loggedInUsername", "") || "";
    const loggedInName = safeSessionGet("loggedInName", "Lecturer") || "Lecturer";

    if (isLoggedIn !== "true" || loggedInRole !== "lecturer") {
        window.location.replace("index.html");
        return;
    }


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

    let users = readJsonArray("users");
    let courses = readJsonArray("egCourses");
    let attendanceRecords = readJsonArray("egAttendance");

    function getAvailableCourses() {
        const sourceList = Array.isArray(courses) && courses.length > 0 ? courses : DEFAULT_COURSES;
        const normalized = [];
        const seenCodes = new Set();

        sourceList.forEach((course, idx) => {
            if (!course || typeof course !== "object") return;
            const rawCode = String(course.code || course.courseCode || "").trim().toUpperCase();
            const catalogMatch = COURSE_BY_CODE[rawCode];
            const code = rawCode || catalogMatch?.code || `COURSE${idx + 1}`;
            const name = String(course.name || course.courseName || catalogMatch?.name || "Untitled Course").trim();
            const id = String(course.id || catalogMatch?.id || code);

            if (!seenCodes.has(code)) {
                seenCodes.add(code);
                normalized.push({
                    ...course,
                    id: id,
                    code: code,
                    name: name
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


    // ========================================
    // DOM ELEMENTS
    // ========================================

    const lecturerName = document.getElementById("lecturerName");
    const dropdownLecturerName = document.getElementById("dropdownLecturerName");
    const profileAvatar = document.getElementById("profileAvatar");
    const dropdownAvatar = document.getElementById("dropdownAvatar");

    const attendanceCourse = document.getElementById("attendanceCourse");
    const attendanceDate = document.getElementById("attendanceDate");

    const loadAttendanceButton = document.getElementById("loadAttendanceButton");

    const attendanceTableBody = document.getElementById("attendanceTableBody");
    const attendanceEmptyState = document.getElementById("attendanceEmptyState");

    const attendanceActions = document.getElementById("attendanceActions");
    const saveAttendanceButton = document.getElementById("saveAttendanceButton");

    const historySearch = document.getElementById("historySearch");
    const historyStatusFilter = document.getElementById("historyStatusFilter");

    const historyTableBody = document.getElementById("historyTableBody");
    const historyEmptyState = document.getElementById("historyEmptyState");

    const totalSessions = document.getElementById("totalSessions");
    const totalPresent = document.getElementById("totalPresent");
    const totalAbsent = document.getElementById("totalAbsent");


    // ========================================
    // LECTURER PROFILE & DROPDOWN SYNC
    // ========================================

    let lecturerIndex = users.findIndex(user =>
        user &&
        user.username === loggedInUsername &&
        String(user.role || "").toLowerCase() === "lecturer"
    );
    const lecturer = lecturerIndex !== -1 ? Object.assign({}, users[lecturerIndex]) : {};

    const profilePictureKey = "egLecturerProfilePicture_" + (loggedInUsername || "default");
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
        loggedInName ||
        "Lecturer";

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


    // ========================================
    // LECTURER SETTINGS STATE
    // ========================================

    const settingsKey = "egLecturerSettings_" + (loggedInUsername || "default");
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


    // ========================================
    // HELPER FUNCTIONS
    // ========================================

    function saveUsersData() {
        return safeLocalSet("users", JSON.stringify(users));
    }

    function saveAttendanceRecords() {
        return safeLocalSet("egAttendance", JSON.stringify(attendanceRecords));
    }

    function getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function getStudentName(student) {
        return student.fullName || student.name || student.username || "Unknown Student";
    }

    function getStudentId(student) {
        return student.studentId || student.username || student.id || "";
    }

    function getStudentAvatarSrc(student) {
        const username = student.username || "";
        const storedPic = username
            ? (safeLocalGet("egStudentProfilePicture_" + username, "") ||
               safeLocalGet("egProfilePicture_" + username, "") || "")
            : "";

        return storedPic || student.profilePicture || "";
    }

    function getInitials(name) {
        return String(name || "S")
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(word => word.charAt(0).toUpperCase())
            .join("");
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => {
            const characters = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };
            return characters[character];
        });
    }

    function findCourse(courseId) {
        const list = getAvailableCourses();
        return list.find(course =>
            course && (
                String(course.id) === String(courseId) ||
                String(course.code || "").toUpperCase() === String(courseId || "").toUpperCase()
            )
        );
    }

    function getStudents() {
        return users.filter(user =>
            user && String(user.role || "").toLowerCase() === "student"
        );
    }


    // ========================================
    // LOAD COURSES
    // ========================================

    function loadCourses() {
        if (!attendanceCourse) return;

        const courseList = getAvailableCourses();

        attendanceCourse.innerHTML = `
            <option value="">Select a course</option>
        `;

        courseList.forEach(course => {
            if (!course) return;
            const option = document.createElement("option");
            option.value = course.id;
            option.textContent = `${course.code || ""} - ${course.name || "Untitled Course"}`;
            attendanceCourse.appendChild(option);
        });
    }


    // ========================================
    // SHOW / HIDE ATTENDANCE BUTTON
    // ========================================

    function showAttendanceActions(show) {
        if (!attendanceActions) return;
        attendanceActions.style.display = show ? "flex" : "none";
        attendanceActions.hidden = !show;
    }


    // ========================================
    // LOAD ATTENDANCE LIST
    // ========================================

    function loadAttendanceList() {
        if (!attendanceCourse || !attendanceDate || !attendanceTableBody) return;

        const courseId = attendanceCourse.value;
        const selectedDate = attendanceDate.value;

        if (!courseId) {
            alert("Please select a course first.");
            return;
        }

        if (!selectedDate) {
            alert("Please select an attendance date.");
            return;
        }

        const students = getStudents();

        if (students.length === 0) {
            attendanceTableBody.innerHTML = "";
            if (attendanceEmptyState) {
                attendanceEmptyState.style.display = "block";
                attendanceEmptyState.innerHTML = `
                    <i class="bi bi-people"></i>
                    <h6>No Students Found</h6>
                    <p>There are currently no registered students in the system.</p>
                `;
            }
            showAttendanceActions(false);
            return;
        }

        const existingRecord = attendanceRecords.find(record =>
            record &&
            String(record.courseId) === String(courseId) &&
            record.date === selectedDate
        );

        attendanceTableBody.innerHTML = "";

        students.forEach((student, index) => {
            const studentName = getStudentName(student);
            const studentId = getStudentId(student);
            const email = student.email || "";
            const avatarSrc = getStudentAvatarSrc(student);

            const avatarContent = avatarSrc
                ? `<img src="${escapeHTML(avatarSrc)}" alt="${escapeHTML(studentName)}">`
                : escapeHTML(getInitials(studentName));

            const savedStudent = (existingRecord && Array.isArray(existingRecord.students))
                ? existingRecord.students.find(item =>
                    item && String(item.studentId) === String(studentId)
                )
                : null;

            const currentStatus = savedStudent ? savedStudent.status : "pending";

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${index + 1}</td>

                <td>
                    <div class="student-name">
                        <div class="student-avatar">
                            ${avatarContent}
                        </div>

                        <div>
                            <strong>${escapeHTML(studentName)}</strong>
                            <small>${escapeHTML(email)}</small>
                        </div>
                    </div>
                </td>

                <td>${escapeHTML(studentId)}</td>

                <td>
                    <select
                        class="form-select form-select-sm attendance-status ${escapeHTML(currentStatus)}"
                        data-student-id="${escapeHTML(studentId)}">

                        <option value="pending"
                            ${currentStatus === "pending" ? "selected" : ""}>
                            Select Status
                        </option>

                        <option value="present"
                            ${currentStatus === "present" ? "selected" : ""}>
                            Present
                        </option>

                        <option value="absent"
                            ${currentStatus === "absent" ? "selected" : ""}>
                            Absent
                        </option>

                    </select>
                </td>
            `;

            attendanceTableBody.appendChild(row);
        });

        if (attendanceEmptyState) {
            attendanceEmptyState.style.display = "none";
        }

        showAttendanceActions(true);
    }

    if (loadAttendanceButton) {
        loadAttendanceButton.addEventListener("click", loadAttendanceList);
    }


    // ========================================
    // UPDATE ATTENDANCE STATUS STYLE
    // ========================================

    if (attendanceTableBody) {
        attendanceTableBody.addEventListener("change", function (event) {
            if (event.target && event.target.classList.contains("attendance-status")) {
                const statusSelect = event.target;
                statusSelect.classList.remove("pending", "present", "absent");
                statusSelect.classList.add(statusSelect.value);
            }
        });
    }


    // ========================================
    // SAVE ATTENDANCE
    // ========================================

    function saveAttendance() {
        if (!attendanceCourse || !attendanceDate || !attendanceTableBody) return;

        const courseId = attendanceCourse.value;
        const selectedDate = attendanceDate.value;

        const course = findCourse(courseId);

        if (!course) {
            alert("Please select a valid course.");
            return;
        }

        const attendanceRows = attendanceTableBody.querySelectorAll("tr");

        if (attendanceRows.length === 0) {
            alert("Please load the student list first.");
            return;
        }

        const studentAttendance = [];
        let incompleteAttendance = false;

        attendanceRows.forEach(row => {
            const statusSelect = row.querySelector(".attendance-status");
            if (!statusSelect) {
                incompleteAttendance = true;
                return;
            }

            const studentId = statusSelect.dataset.studentId;
            const student = getStudents().find(item =>
                String(getStudentId(item)) === String(studentId)
            );

            if (!student) {
                incompleteAttendance = true;
                return;
            }

            const status = statusSelect.value;
            if (status === "pending") {
                incompleteAttendance = true;
                return;
            }

            studentAttendance.push({
                studentId: getStudentId(student),
                name: getStudentName(student),
                email: student.email || "",
                status: status
            });
        });

        if (incompleteAttendance || studentAttendance.length !== attendanceRows.length) {
            alert("Please mark every student's attendance before saving.");
            return;
        }

        const attendanceData = {
            id: `${courseId}_${selectedDate}`,
            courseId: course.id,
            courseCode: course.code || "",
            courseName: course.name || "",
            date: selectedDate,
            students: studentAttendance,
            updatedAt: new Date().toISOString()
        };

        const existingIndex = attendanceRecords.findIndex(record =>
            record &&
            String(record.courseId) === String(courseId) &&
            record.date === selectedDate
        );

        if (existingIndex !== -1) {
            attendanceRecords[existingIndex] = attendanceData;
        } else {
            attendanceRecords.push(attendanceData);
        }

        if (!saveAttendanceRecords()) {
            alert("Could not save attendance due to browser storage limits.");
            return;
        }

        updateSummaryCards();
        displayAttendanceHistory();

        alert("Attendance has been saved successfully!");
    }

    if (saveAttendanceButton) {
        saveAttendanceButton.addEventListener("click", saveAttendance);
    }


    // ========================================
    // UPDATE SUMMARY CARDS
    // ========================================

    function updateSummaryCards() {
        let presentCount = 0;
        let absentCount = 0;

        attendanceRecords.forEach(record => {
            if (!record || !Array.isArray(record.students)) return;
            record.students.forEach(student => {
                if (!student) return;
                if (student.status === "present") {
                    presentCount++;
                }
                if (student.status === "absent") {
                    absentCount++;
                }
            });
        });

        if (totalSessions) {
            totalSessions.textContent = String(attendanceRecords.length);
        }

        if (totalPresent) {
            totalPresent.textContent = String(presentCount);
        }

        if (totalAbsent) {
            totalAbsent.textContent = String(absentCount);
        }
    }


    // ========================================
    // DISPLAY ATTENDANCE HISTORY
    // ========================================

    function displayAttendanceHistory() {
        if (!historyTableBody) return;

        historyTableBody.innerHTML = "";

        const searchValue = historySearch
            ? historySearch.value.toLowerCase().trim()
            : "";

        const selectedStatus = historyStatusFilter
            ? historyStatusFilter.value.toLowerCase()
            : "all";

        let historyList = [];

        attendanceRecords.forEach(record => {
            if (!record || !Array.isArray(record.students)) return;
            const matchedCourse = findCourse(record.courseId || record.courseCode);
            const resolvedCode = String(record.courseCode || matchedCourse?.code || "").trim();
            const resolvedName = String(record.courseName || matchedCourse?.name || "").trim();

            record.students.forEach(student => {
                if (!student) return;
                historyList.push({
                    date: record.date || "",
                    courseCode: resolvedCode,
                    courseName: resolvedName,
                    studentName: student.name || "",
                    studentId: student.studentId || "",
                    status: student.status || ""
                });
            });
        });

        historyList = historyList.filter(record => {
            const searchText = `
                ${record.date}
                ${record.courseCode}
                ${record.courseName}
                ${record.studentName}
                ${record.studentId}
            `.toLowerCase();

            const matchesSearch = searchText.includes(searchValue);
            const matchesStatus =
                selectedStatus === "all" ||
                record.status === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        historyList.sort((a, b) => String(b.date).localeCompare(String(a.date)));

        if (historyList.length === 0) {
            if (historyEmptyState) {
                historyEmptyState.style.display = "block";
                historyEmptyState.innerHTML = `
                    <i class="bi bi-calendar-x"></i>
                    <h6>No Attendance Records Found</h6>
                    <p>Attendance records will appear here after they are saved.</p>
                `;
            }
            return;
        }

        if (historyEmptyState) {
            historyEmptyState.style.display = "none";
        }

        historyList.forEach(record => {
            const row = document.createElement("tr");
            const statusLabel = record.status
                ? record.status.charAt(0).toUpperCase() + record.status.slice(1)
                : "Pending";

            row.innerHTML = `
                <td>${escapeHTML(record.date)}</td>

                <td>
                    <strong>${escapeHTML(record.studentName)}</strong>
                    <small class="d-block text-muted">
                        ${escapeHTML(record.studentId)}
                    </small>
                </td>

                <td>
                    <strong>${escapeHTML(record.courseCode)}</strong>
                    <small class="d-block text-muted">
                        ${escapeHTML(record.courseName)}
                    </small>
                </td>

                <td>
                    <span class="attendance-status ${escapeHTML(record.status)}">
                        ${escapeHTML(statusLabel)}
                    </span>
                </td>
            `;

            historyTableBody.appendChild(row);
        });
    }


    // ========================================
    // HISTORY SEARCH & FILTER
    // ========================================

    if (historySearch) {
        historySearch.addEventListener("input", displayAttendanceHistory);
    }

    if (historyStatusFilter) {
        historyStatusFilter.addEventListener("change", displayAttendanceHistory);
    }


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
                const idx = users.findIndex(user =>
                    user &&
                    user.username === loggedInUsername &&
                    String(user.role || "").toLowerCase() === "lecturer"
                );
                if (idx !== -1) {
                    users[idx].profilePicture = profilePicture;
                    saveUsersData();
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
        const usernameVal = lecturer.username || loggedInUsername || "-";
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

            users = readJsonArray("users");
            lecturerIndex = users.findIndex(user =>
                user &&
                user.username === loggedInUsername &&
                String(user.role || "").toLowerCase() === "lecturer"
            );

            if (lecturerIndex !== -1) {
                users[lecturerIndex] = Object.assign({}, users[lecturerIndex], lecturer);
            } else {
                const newUserRecord = Object.assign(
                    {
                        username: loggedInUsername || "lecturer",
                        role: "lecturer",
                        profilePicture: profilePicture || ""
                    },
                    lecturer
                );
                users.push(newUserRecord);
            }

            saveUsersData();

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
    // LOGOUT
    // ========================================

    function logoutLecturer() {
        const confirmLogout = window.confirm("Are you sure you want to logout?");
        if (confirmLogout) {
            safeSessionClear();
            window.location.href = "index.html";
        }
    }

    const profileLogoutButton = document.getElementById("profileLogoutButton");
    if (profileLogoutButton) {
        profileLogoutButton.addEventListener("click", logoutLecturer);
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

    if (menuToggle && sidebar && sidebarOverlay) {
        menuToggle.addEventListener("click", function () {
            if (sidebar.classList.contains("show")) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", closeSidebar);
    }

    document.querySelectorAll(".sidebar .menu-link").forEach(link => {
        link.addEventListener("click", closeSidebar);
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
    // INITIAL PAGE SETUP
    // ========================================

    function initializeAttendancePage() {
        updateProfileDisplay();

        if (attendanceDate) {
            attendanceDate.value = getTodayDate();
        }

        loadCourses();
        updateSummaryCards();
        displayAttendanceHistory();
    }

    initializeAttendancePage();

});
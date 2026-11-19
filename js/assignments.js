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
    // GET LECTURER INFORMATION & PROFILE SYNC
    // ========================================

    const lecturerUsername = safeSessionGet("loggedInUsername", "") || "";
    const sessionLecturerName = safeSessionGet("loggedInName", "Lecturer") || "Lecturer";

    function getUsers() {
        try {
            const raw = safeLocalGet("users", null);
            if (!raw) return [];
            const users = JSON.parse(raw);
            return Array.isArray(users) ? users : [];
        } catch (error) {
            return [];
        }
    }

    function saveUsers(users) {
        return safeLocalSet("users", JSON.stringify(users));
    }

    let usersList = getUsers();
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

    const lecturerNameElement = document.getElementById("lecturerName");
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
        if (lecturerNameElement) lecturerNameElement.textContent = displayName;
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


    // ========================================
    // GET HTML ELEMENTS
    // ========================================

    const assignmentForm = document.getElementById("assignmentForm");
    const assignmentFormTitle = document.getElementById("assignmentFormTitle");

    const assignmentCourse = document.getElementById("assignmentCourse");
    const assignmentTitle = document.getElementById("assignmentTitle");
    const assignmentDescription = document.getElementById("assignmentDescription");
    const assignmentDueDate = document.getElementById("assignmentDueDate");
    const assignmentMarks = document.getElementById("assignmentMarks");

    const editingAssignmentId = document.getElementById("editingAssignmentId");

    const saveAssignmentButton = document.getElementById("saveAssignmentButton");
    const cancelEditButton = document.getElementById("cancelEditButton");

    const assignmentSearch = document.getElementById("assignmentSearch");
    const assignmentStatusFilter = document.getElementById("assignmentStatusFilter");

    const assignmentsTableBody = document.getElementById("assignmentsTableBody");
    const assignmentsEmptyState = document.getElementById("assignmentsEmptyState");

    const totalAssignments = document.getElementById("totalAssignments");
    const activeAssignments = document.getElementById("activeAssignments");
    const overdueAssignments = document.getElementById("overdueAssignments");


    // ========================================
    // DEFAULT COURSE CATALOG & LOCAL STORAGE KEYS
    // ========================================

    const ASSIGNMENTS_KEY = "egAssignments";
    const COURSES_KEY = "egCourses";

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


    // ========================================
    // GET ASSIGNMENTS
    // ========================================

    function getAssignments() {
        try {
            const raw = safeLocalGet(ASSIGNMENTS_KEY, null);
            if (!raw) return [];
            const assignments = JSON.parse(raw);
            return Array.isArray(assignments) ? assignments : [];
        } catch (error) {
            console.error("Unable to load assignments:", error);
            return [];
        }
    }


    // ========================================
    // SAVE ASSIGNMENTS
    // ========================================

    function saveAssignments(assignments) {
        return safeLocalSet(ASSIGNMENTS_KEY, JSON.stringify(assignments));
    }


    // ========================================
    // GET COURSES
    // ========================================

    function getCourses() {
        let stored = [];
        try {
            const raw = safeLocalGet(COURSES_KEY, null);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) stored = parsed;
            }
        } catch (error) {
            console.error("Unable to load courses:", error);
        }

        const sourceList = stored.length > 0 ? stored : DEFAULT_COURSES;
        const normalized = [];
        const seenCodes = new Set();

        sourceList.forEach(function (course, idx) {
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
                    name: name
                });
            }
        });

        DEFAULT_COURSES.forEach(function (catCourse) {
            if (!seenCodes.has(catCourse.code.toUpperCase())) {
                seenCodes.add(catCourse.code.toUpperCase());
                normalized.push({ ...catCourse });
            }
        });

        return normalized;
    }


    // ========================================
    // ESCAPE HTML
    // ========================================

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


    // ========================================
    // FORMAT DATE
    // ========================================

    function formatDate(dateValue) {
        if (!dateValue) return "-";

        const date = new Date(dateValue + "T00:00:00");
        if (isNaN(date.getTime())) return "-";

        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }


    // ========================================
    // GET TODAY'S DATE
    // ========================================

    function getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }


    // ========================================
    // GET ASSIGNMENT STATUS
    // ========================================

    function getAssignmentStatus(assignment) {
        if (assignment && assignment.dueDate && assignment.dueDate < getTodayDate()) {
            return "overdue";
        }
        return "active";
    }


    // ========================================
    // LOAD COURSES INTO DROPDOWN
    // ========================================

    function loadCourses() {
        if (!assignmentCourse) return;

        const courses = getCourses();

        assignmentCourse.innerHTML = `
            <option value="">Select Course</option>
        `;

        courses.forEach(function (course) {
            if (!course) return;
            const courseId = String(course.id || course.code || "");
            const courseCode = course.code || "";
            const courseName = course.name || "Unnamed Course";

            if (!courseId) return;

            const option = document.createElement("option");
            option.value = courseId;
            option.textContent = courseCode
                ? `${courseCode} - ${courseName}`
                : courseName;

            assignmentCourse.appendChild(option);
        });
    }


    // ========================================
    // UPDATE SUMMARY CARDS
    // ========================================

    function updateStatistics() {
        const assignments = getAssignments();

        const activeCount = assignments.filter(function (assignment) {
            return getAssignmentStatus(assignment) === "active";
        }).length;

        const overdueCount = assignments.filter(function (assignment) {
            return getAssignmentStatus(assignment) === "overdue";
        }).length;

        if (totalAssignments) totalAssignments.textContent = String(assignments.length);
        if (activeAssignments) activeAssignments.textContent = String(activeCount);
        if (overdueAssignments) overdueAssignments.textContent = String(overdueCount);
    }


    // ========================================
    // DISPLAY ASSIGNMENTS
    // ========================================

    function displayAssignments() {
        if (!assignmentsTableBody) return;

        const assignments = getAssignments();
        const searchValue = assignmentSearch ? assignmentSearch.value.trim().toLowerCase() : "";
        const selectedStatus = assignmentStatusFilter ? assignmentStatusFilter.value : "all";

        const filteredAssignments = assignments.filter(function (assignment) {
            if (!assignment) return false;
            const title = String(assignment.title || "").toLowerCase();
            const courseName = String(assignment.courseName || "").toLowerCase();
            const courseCode = String(assignment.courseCode || "").toLowerCase();

            const matchesSearch =
                title.includes(searchValue) ||
                courseName.includes(searchValue) ||
                courseCode.includes(searchValue);

            const status = getAssignmentStatus(assignment);
            const matchesStatus =
                selectedStatus === "all" ||
                status === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        assignmentsTableBody.innerHTML = "";

        if (filteredAssignments.length === 0) {
            if (assignmentsEmptyState) {
                assignmentsEmptyState.style.display = "block";
                const headingEl = assignmentsEmptyState.querySelector("h6");
                const descEl = assignmentsEmptyState.querySelector("p");

                if (assignments.length === 0) {
                    if (headingEl) headingEl.textContent = "No Assignments Found";
                    if (descEl) {
                        descEl.textContent =
                            "You have not created any assignments yet. Start by creating your first assignment above.";
                    }
                } else {
                    if (headingEl) headingEl.textContent = "No Matching Assignments";
                    if (descEl) {
                        descEl.textContent = "Try changing your search or status filter.";
                    }
                }
            }
            return;
        }

        if (assignmentsEmptyState) {
            assignmentsEmptyState.style.display = "none";
        }

        filteredAssignments.forEach(function (assignment, index) {
            const status = getAssignmentStatus(assignment);
            const statusClass = status === "active" ? "status-active" : "status-overdue";
            const statusText = status === "active" ? "Active" : "Overdue";

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${index + 1}</td>

                <td>
                    <strong>${escapeHTML(assignment.title)}</strong>
                </td>

                <td>
                    ${escapeHTML(assignment.courseCode || assignment.courseName || "-")}
                </td>

                <td>
                    ${formatDate(assignment.dueDate)}
                </td>

                <td>
                    ${escapeHTML(assignment.marks)} marks
                </td>

                <td>
                    <span class="status-badge ${statusClass}">
                        ${statusText}
                    </span>
                </td>

                <td>
                    <div class="action-buttons">

                        <button
                            type="button"
                            class="action-btn edit-btn"
                            data-action="edit"
                            data-id="${escapeHTML(assignment.id)}"
                            title="Edit Assignment"
                        >
                            <i class="bi bi-pencil"></i>
                        </button>

                        <button
                            type="button"
                            class="action-btn delete-btn"
                            data-action="delete"
                            data-id="${escapeHTML(assignment.id)}"
                            title="Delete Assignment"
                        >
                            <i class="bi bi-trash"></i>
                        </button>

                    </div>
                </td>
            `;

            assignmentsTableBody.appendChild(row);
        });
    }


    // ========================================
    // RESET ASSIGNMENT FORM
    // ========================================

    function resetAssignmentForm() {
        if (assignmentForm) assignmentForm.reset();
        if (editingAssignmentId) editingAssignmentId.value = "";

        if (assignmentFormTitle) {
            assignmentFormTitle.textContent = "Create New Assignment";
        }

        if (saveAssignmentButton) {
            saveAssignmentButton.innerHTML = `
                <i class="bi bi-plus-lg"></i>
                Create Assignment
            `;
        }

        if (cancelEditButton) {
            cancelEditButton.style.display = "none";
        }
    }


    // ========================================
    // CREATE / UPDATE ASSIGNMENT
    // ========================================

    if (assignmentForm) {
        assignmentForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const courseId = assignmentCourse ? assignmentCourse.value : "";
            const title = assignmentTitle ? assignmentTitle.value.trim() : "";
            const description = assignmentDescription ? assignmentDescription.value.trim() : "";
            const dueDate = assignmentDueDate ? assignmentDueDate.value : "";
            const marks = assignmentMarks ? Number(assignmentMarks.value) : 0;

            if (!courseId || !title || !dueDate || !marks) {
                alert("Please complete all required fields.");
                return;
            }

            if (marks <= 0 || !Number.isFinite(marks)) {
                alert("Please enter a valid total mark.");
                return;
            }

            const courses = getCourses();
            const selectedCourse = courses.find(function (course) {
                return course && (
                    String(course.id || "") === String(courseId) ||
                    String(course.code || "").toUpperCase() === String(courseId).toUpperCase()
                );
            });

            if (!selectedCourse) {
                alert("Selected course could not be found. Please select another course.");
                loadCourses();
                return;
            }

            const assignments = getAssignments();
            const currentId = editingAssignmentId ? editingAssignmentId.value : "";

            const assignmentData = {
                courseId: String(selectedCourse.id || courseId),
                courseCode: selectedCourse.code || "",
                courseName: selectedCourse.name || "Unnamed Course",
                title: title,
                description: description,
                dueDate: dueDate,
                marks: marks,
                lecturer: displayName
            };

            let savedOk = false;
            if (currentId) {
                const assignmentIndex = assignments.findIndex(function (assignment) {
                    return assignment && String(assignment.id) === String(currentId);
                });

                if (assignmentIndex === -1) {
                    alert("Assignment could not be found.");
                    resetAssignmentForm();
                    return;
                }

                assignments[assignmentIndex] = {
                    ...assignments[assignmentIndex],
                    ...assignmentData
                };

                savedOk = saveAssignments(assignments);
                if (savedOk) alert("Assignment updated successfully!");
            } else {
                const newAssignment = {
                    id: "A" + Date.now(),
                    ...assignmentData,
                    createdAt: new Date().toISOString()
                };

                assignments.push(newAssignment);
                savedOk = saveAssignments(assignments);
                if (savedOk) alert("Assignment created successfully!");
            }

            if (!savedOk) {
                alert("Could not save assignment due to browser storage limits.");
                return;
            }

            resetAssignmentForm();
            updateStatistics();
            displayAssignments();
        });
    }


    // ========================================
    // EDIT / DELETE ASSIGNMENTS
    // ========================================

    if (assignmentsTableBody) {
        assignmentsTableBody.addEventListener("click", function (event) {
            const button = event.target.closest("button[data-action]");
            if (!button) return;

            const action = button.dataset.action;
            const assignmentId = button.dataset.id;

            const assignments = getAssignments();
            const selectedAssignment = assignments.find(function (assignment) {
                return assignment && String(assignment.id) === String(assignmentId);
            });

            if (!selectedAssignment) {
                alert("Assignment could not be found.");
                return;
            }

            if (action === "edit") {
                if (editingAssignmentId) editingAssignmentId.value = selectedAssignment.id;
                if (assignmentCourse) assignmentCourse.value = String(selectedAssignment.courseId || "");
                if (assignmentTitle) assignmentTitle.value = selectedAssignment.title || "";
                if (assignmentDescription) assignmentDescription.value = selectedAssignment.description || "";
                if (assignmentDueDate) assignmentDueDate.value = selectedAssignment.dueDate || "";
                if (assignmentMarks) assignmentMarks.value = selectedAssignment.marks || "";

                if (assignmentFormTitle) {
                    assignmentFormTitle.textContent = "Edit Assignment";
                }

                if (saveAssignmentButton) {
                    saveAssignmentButton.innerHTML = `
                        <i class="bi bi-check-lg"></i>
                        Update Assignment
                    `;
                }

                if (cancelEditButton) {
                    cancelEditButton.style.display = "inline-block";
                }

                if (assignmentForm) {
                    assignmentForm.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            } else if (action === "delete") {
                const confirmDelete = window.confirm(
                    `Are you sure you want to delete "${selectedAssignment.title}"?`
                );

                if (!confirmDelete) return;

                const updatedAssignments = assignments.filter(function (assignment) {
                    return assignment && String(assignment.id) !== String(assignmentId);
                });

                saveAssignments(updatedAssignments);

                if (editingAssignmentId && String(editingAssignmentId.value) === String(assignmentId)) {
                    resetAssignmentForm();
                }

                updateStatistics();
                displayAssignments();

                alert("Assignment deleted successfully!");
            }
        });
    }


    // ========================================
    // CANCEL EDITING
    // ========================================

    if (cancelEditButton) {
        cancelEditButton.addEventListener("click", function () {
            resetAssignmentForm();
        });
    }


    // ========================================
    // SEARCH & FILTER ASSIGNMENTS
    // ========================================

    if (assignmentSearch) {
        assignmentSearch.addEventListener("input", function () {
            displayAssignments();
        });
    }

    if (assignmentStatusFilter) {
        assignmentStatusFilter.addEventListener("change", function () {
            displayAssignments();
        });
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
                const allUsers = getUsers();
                const idx = allUsers.findIndex(user =>
                    user &&
                    user.username === lecturerUsername &&
                    String(user.role || "").toLowerCase() === "lecturer"
                );
                if (idx !== -1) {
                    allUsers[idx].profilePicture = profilePicture;
                    saveUsers(allUsers);
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

            usersList = getUsers();
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

            saveUsers(usersList);

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
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    const menuToggle = document.getElementById("menuToggle");
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

    if (sidebar) {
        sidebar.querySelectorAll(".menu-link").forEach(function (link) {
            link.addEventListener("click", function () {
                closeSidebar();
            });
        });
    }

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
    // INITIALISE ASSIGNMENTS PAGE
    // ========================================

    loadCourses();
    updateStatistics();
    displayAssignments();

});
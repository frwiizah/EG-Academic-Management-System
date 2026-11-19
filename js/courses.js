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

    if (
        safeSessionGet("isLoggedIn") !== "true" ||
        safeSessionGet("loggedInRole") !== "lecturer"
    ) {
        window.location.replace("index.html");
        return;
    }

    const lecturerUsername = safeSessionGet("loggedInUsername", "") || "";
    const sessionLecturerName = safeSessionGet("loggedInName", "Lecturer") || "Lecturer";


    // ========================================
    // HTML ELEMENTS & SAFE BOOTSTRAP MODALS
    // ========================================

    const totalCourses = document.getElementById("totalCourses");
    const activeCourses = document.getElementById("activeCourses");
    const inactiveCourses = document.getElementById("inactiveCourses");

    const courseSearch = document.getElementById("courseSearch");
    const statusFilter = document.getElementById("statusFilter");

    const coursesTableBody = document.getElementById("coursesTableBody");
    const emptyState = document.getElementById("emptyState");

    const addCourseButton = document.getElementById("addCourseButton");
    const courseForm = document.getElementById("courseForm");

    const editCourseId = document.getElementById("editCourseId");

    const courseCode = document.getElementById("courseCode");
    const courseName = document.getElementById("courseName");
    const creditHours = document.getElementById("creditHours");
    const courseLecturer = document.getElementById("courseLecturer");
    const courseDescription = document.getElementById("courseDescription");
    const courseStatus = document.getElementById("courseStatus");

    const modalTitle = document.getElementById("modalTitle");
    const saveCourseButton = document.getElementById("saveCourseButton");
    const formMessage = document.getElementById("formMessage");

    const courseDetails = document.getElementById("courseDetails");

    const courseModalElement = document.getElementById("courseModal");
    const viewCourseModalElement = document.getElementById("viewCourseModal");

    const hasBootstrapModal = typeof bootstrap !== "undefined" && typeof bootstrap.Modal === "function";

    const courseModal = (hasBootstrapModal && courseModalElement)
        ? bootstrap.Modal.getOrCreateInstance(courseModalElement)
        : null;

    const viewCourseModal = (hasBootstrapModal && viewCourseModalElement)
        ? bootstrap.Modal.getOrCreateInstance(viewCourseModalElement)
        : null;


    // ========================================
    // USERS & LECTURER PROFILE SYNC
    // ========================================

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


    // ========================================
    // COURSE DATA
    // ========================================

    const STORAGE_KEY = "egCourses";

    const defaultCourses = [
        {
            id: "C001",
            code: "IMS560",
            name: "ADVANCED DATABASE MANAGEMENT SYSTEM",
            creditHours: 3,
            lecturer: "PROFESOR MADYA DR MUHAMAD KHAIRULNIZAM BIN ZAINI",
            description: "Advanced concepts and administration of database management systems.",
            status: "Active"
        },
        {
            id: "C002",
            code: "IMS565",
            name: "INFORMATION SYSTEM PROJECT MANAGEMENT",
            creditHours: 3,
            lecturer: "DR. HASNAH BINTI HASHIM",
            description: "Planning, execution, and control of information system projects.",
            status: "Active"
        },
        {
            id: "C003",
            code: "IMS566",
            name: "ADVANCED WEB DESIGN DEVELOPMENT AND CONTENT MANAGEMENT",
            creditHours: 3,
            lecturer: "DR. MUHAMMAD ASYRAF BIN WAHI ANUAR",
            description: "Modern web design, development practices, and content management systems.",
            status: "Active"
        },
        {
            id: "C004",
            code: "IMS564",
            name: "USER EXPERIENCE DESIGN",
            creditHours: 3,
            lecturer: "PROFESOR MADYA DR NORIZAN BINTI ANWAR",
            description: "Principles, research, and prototyping for user-centered digital experiences.",
            status: "Active"
        },
        {
            id: "C005",
            code: "CTU554",
            name: "VALUES AND CIVILIZATION II",
            creditHours: 2,
            lecturer: "AHMAD SYAHMI BIN MOHD KAMIL",
            description: "Study of core values, ethics, and civilization perspectives.",
            status: "Active"
        },
        {
            id: "C006",
            code: "LCC501",
            name: "ENGLISH FOR PROFESSIONAL CORRESPONDENCE",
            creditHours: 2,
            lecturer: "SITI NURSHAFEZAN BINTI AHMAD",
            description: "Professional writing and communication skills for workplace correspondence.",
            status: "Active"
        },
        {
            id: "C007",
            code: "TGC451",
            name: "INTRODUCTORY GERMAN (LEVEL II)",
            creditHours: 2,
            lecturer: "HASLINA BINTI DAUD",
            description: "Continuation of introductory German language proficiency and usage.",
            status: "Active"
        },
        {
            id: "C008",
            code: "ICM572",
            name: "GAMIFICATION FOR CONTENT MANAGEMENT",
            creditHours: 3,
            lecturer: "DR. MAZWANI AYU BINTI MAZLAN",
            description: "Applying game mechanics and engagement strategies to content management.",
            status: "Active"
        }
    ];

    const CATALOG_BY_CODE = defaultCourses.reduce(function (acc, item) {
        acc[item.code.toUpperCase()] = item;
        return acc;
    }, {});


    // ========================================
    // SAVE COURSES
    // ========================================

    function saveCourses(courses) {
        return safeLocalSet(STORAGE_KEY, JSON.stringify(courses));
    }


    // ========================================
    // GET COURSES
    // ========================================

    function getCourses() {
        const savedCourses = safeLocalGet(STORAGE_KEY, null);

        if (savedCourses === null) {
            saveCourses(defaultCourses);
            return [...defaultCourses];
        }

        try {
            const parsedCourses = JSON.parse(savedCourses);

            if (!Array.isArray(parsedCourses)) {
                saveCourses(defaultCourses);
                return [...defaultCourses];
            }

            const placeholderNames = new Set([
                "database management",
                "information technology",
                "information systems",
                "student project"
            ]);

            const repairedCourses = parsedCourses.map((course, index) => {
                const safeCourse = course && typeof course === "object" ? course : {};
                const code = String(safeCourse.code || safeCourse.courseCode || "").trim().toUpperCase();
                const catalogMatch = CATALOG_BY_CODE[code];

                const rawName = String(safeCourse.name || safeCourse.courseName || "").trim();
                const rawLecturer = String(safeCourse.lecturer || safeCourse.lecturerName || "").trim();
                const rawCredits = Number(safeCourse.creditHours || safeCourse.credits || 0);

                const resolvedName = (
                    catalogMatch &&
                    (!rawName || placeholderNames.has(rawName.toLowerCase()))
                ) ? catalogMatch.name : rawName;

                const resolvedLecturer = (
                    catalogMatch &&
                    (!rawLecturer || rawLecturer.toLowerCase() === "lecturer name")
                ) ? catalogMatch.lecturer : rawLecturer;

                const resolvedCredits = (
                    catalogMatch &&
                    (!Number.isFinite(rawCredits) || rawCredits <= 0)
                ) ? catalogMatch.creditHours : rawCredits;

                return {
                    ...safeCourse,
                    id: String(safeCourse.id || catalogMatch?.id || `C-LEGACY-${index + 1}`),
                    code: code,
                    name: resolvedName,
                    creditHours: resolvedCredits,
                    lecturer: resolvedLecturer,
                    description: String(
                        safeCourse.description || safeCourse.courseDescription || catalogMatch?.description || ""
                    ),
                    status: safeCourse.status || "Active"
                };
            });

            const existingCodes = new Set(repairedCourses.map(c => String(c.code || "").toUpperCase()));
            defaultCourses.forEach(catCourse => {
                if (!existingCodes.has(catCourse.code.toUpperCase())) {
                    repairedCourses.push({ ...catCourse });
                }
            });

            saveCourses(repairedCourses);
            return repairedCourses;
        } catch (error) {
            console.error("Unable to read courses:", error);
            return [...defaultCourses];
        }
    }


    // ========================================
    // HTML ESCAPE
    // ========================================

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }


    // ========================================
    // UPDATE SUMMARY CARDS
    // ========================================

    function updateStatistics(courses) {
        if (totalCourses) totalCourses.textContent = String(courses.length);

        if (activeCourses) {
            activeCourses.textContent = String(courses.filter(course =>
                course.status === "Active"
            ).length);
        }

        if (inactiveCourses) {
            inactiveCourses.textContent = String(courses.filter(course =>
                course.status === "Inactive"
            ).length);
        }
    }


    // ========================================
    // DISPLAY COURSES
    // ========================================

    function displayCourses() {
        const courses = getCourses();

        const searchValue = courseSearch ? courseSearch.value.toLowerCase().trim() : "";
        const selectedStatus = statusFilter ? statusFilter.value : "all";

        const filteredCourses = courses.filter(course => {
            const matchesSearch =
                String(course.code || "").toLowerCase().includes(searchValue) ||
                String(course.name || "").toLowerCase().includes(searchValue) ||
                String(course.lecturer || "").toLowerCase().includes(searchValue);

            const matchesStatus =
                selectedStatus === "all" ||
                course.status === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        if (coursesTableBody) {
            coursesTableBody.innerHTML = "";

            filteredCourses.forEach(course => {
                const row = document.createElement("tr");
                const statusClass = course.status === "Active" ? "active" : "inactive";

                row.innerHTML = `
                    <td>
                        <span class="course-code">
                            ${escapeHTML(course.code)}
                        </span>
                    </td>

                    <td>
                        <span class="course-name">
                            ${escapeHTML(course.name)}
                        </span>
                    </td>

                    <td>
                        ${escapeHTML(String(course.creditHours))} Hours
                    </td>

                    <td>
                        <span class="course-lecturer">
                            ${escapeHTML(course.lecturer)}
                        </span>
                    </td>

                    <td>
                        <span class="course-status ${statusClass}">
                            ${escapeHTML(course.status)}
                        </span>
                    </td>

                    <td>
                        <div class="action-buttons">
                            <button type="button"
                                class="action-btn view-btn"
                                data-action="view"
                                data-id="${escapeHTML(course.id)}"
                                title="View Course">
                                <i class="bi bi-eye"></i>
                            </button>

                            <button type="button"
                                class="action-btn edit-btn"
                                data-action="edit"
                                data-id="${escapeHTML(course.id)}"
                                title="Edit Course">
                                <i class="bi bi-pencil"></i>
                            </button>

                            <button type="button"
                                class="action-btn delete-btn"
                                data-action="delete"
                                data-id="${escapeHTML(course.id)}"
                                title="Delete Course">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                `;

                coursesTableBody.appendChild(row);
            });
        }

        if (emptyState) {
            emptyState.style.display = filteredCourses.length === 0 ? "block" : "none";
        }

        updateStatistics(courses);
    }


    // ========================================
    // RESET FORM
    // ========================================

    function resetForm() {
        if (courseForm) courseForm.reset();
        if (editCourseId) editCourseId.value = "";
        if (modalTitle) modalTitle.textContent = "Add New Course";
        if (saveCourseButton) {
            saveCourseButton.innerHTML = '<i class="bi bi-check-lg"></i> Save Course';
        }
        if (formMessage) {
            formMessage.textContent = "";
            formMessage.className = "form-message";
        }
        if (courseStatus) courseStatus.value = "Active";
    }


    // ========================================
    // ADD COURSE
    // ========================================

    if (addCourseButton) {
        addCourseButton.addEventListener("click", function () {
            resetForm();
            if (courseModal) courseModal.show();
        });
    }


    // ========================================
    // SAVE / UPDATE COURSE
    // ========================================

    if (courseForm) {
        courseForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const courses = getCourses();
            const editingId = editCourseId ? editCourseId.value : "";
            const newCode = courseCode ? courseCode.value.trim().toUpperCase() : "";

            const duplicateCode = courses.some(course =>
                String(course.code || "").toUpperCase() === newCode &&
                String(course.id) !== String(editingId)
            );

            if (duplicateCode) {
                if (formMessage) {
                    formMessage.textContent =
                        "This course code already exists. Please use another code.";
                    formMessage.className = "form-message error";
                }
                return;
            }

            const courseData = {
                id: editingId || "C" + Date.now(),
                code: newCode,
                name: courseName ? courseName.value.trim() : "",
                creditHours: creditHours ? Number(creditHours.value) : 0,
                lecturer: courseLecturer ? courseLecturer.value.trim() : "",
                description: courseDescription ? courseDescription.value.trim() : "",
                status: courseStatus ? courseStatus.value : "Active"
            };

            let updatedList;
            if (editingId) {
                updatedList = courses.map(course =>
                    String(course.id) === String(editingId) ? courseData : course
                );
            } else {
                updatedList = [...courses, courseData];
            }

            if (!saveCourses(updatedList)) {
                if (formMessage) {
                    formMessage.textContent =
                        "Could not save course due to browser storage limits.";
                    formMessage.className = "form-message error";
                }
                return;
            }

            if (courseModal) courseModal.hide();
            displayCourses();
        });
    }


    // ========================================
    // VIEW, EDIT AND DELETE COURSES
    // ========================================

    if (coursesTableBody) {
        coursesTableBody.addEventListener("click", function (event) {
            const button = event.target.closest("button[data-action]");
            if (!button) return;

            const action = button.dataset.action;
            const id = button.dataset.id;

            const courses = getCourses();
            const course = courses.find(item => String(item.id) === String(id));

            if (!course) {
                alert("Course not found. Please refresh the page and try again.");
                return;
            }

            if (action === "view") {
                if (courseDetails) {
                    courseDetails.innerHTML = `
                        <div class="detail-row">
                            <small>Course Code</small>
                            <strong>${escapeHTML(course.code)}</strong>
                        </div>

                        <div class="detail-row">
                            <small>Course Name</small>
                            <strong>${escapeHTML(course.name)}</strong>
                        </div>

                        <div class="detail-row">
                            <small>Credit Hours</small>
                            <strong>${escapeHTML(String(course.creditHours))} Hours</strong>
                        </div>

                        <div class="detail-row">
                            <small>Lecturer</small>
                            <strong>${escapeHTML(course.lecturer)}</strong>
                        </div>

                        <div class="detail-row">
                            <small>Status</small>
                            <strong>${escapeHTML(course.status)}</strong>
                        </div>

                        <div class="detail-row">
                            <small>Course Description</small>
                            <strong>${escapeHTML(course.description || "No description provided.")}</strong>
                        </div>
                    `;
                }

                if (viewCourseModal) viewCourseModal.show();
            }

            if (action === "edit") {
                resetForm();

                if (editCourseId) editCourseId.value = String(course.id);
                if (courseCode) courseCode.value = course.code;
                if (courseName) courseName.value = course.name;
                if (creditHours) creditHours.value = course.creditHours;
                if (courseLecturer) courseLecturer.value = course.lecturer;
                if (courseDescription) courseDescription.value = course.description || "";
                if (courseStatus) courseStatus.value = course.status;

                if (modalTitle) modalTitle.textContent = "Edit Course";
                if (saveCourseButton) {
                    saveCourseButton.innerHTML = '<i class="bi bi-check-lg"></i> Update Course';
                }

                if (courseModal) courseModal.show();
            }

            if (action === "delete") {
                const confirmDelete = window.confirm(
                    `Are you sure you want to delete ${course.code} - ${course.name}?`
                );

                if (!confirmDelete) return;

                const updatedCourses = courses.filter(item =>
                    String(item.id) !== String(id)
                );

                saveCourses(updatedCourses);
                displayCourses();

                alert("Course deleted successfully!");
            }
        });
    }


    // ========================================
    // SEARCH AND FILTER
    // ========================================

    if (courseSearch) courseSearch.addEventListener("input", displayCourses);
    if (statusFilter) statusFilter.addEventListener("change", displayCourses);


    // ========================================
    // RESET FORM WHEN MODAL CLOSES
    // ========================================

    if (courseModalElement) {
        courseModalElement.addEventListener("hidden.bs.modal", resetForm);
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
    // INITIAL DISPLAY
    // ========================================

    displayCourses();

});
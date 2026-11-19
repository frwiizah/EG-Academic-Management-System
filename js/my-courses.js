document.addEventListener("DOMContentLoaded", function () {

    // =====================================
    // SAFE STORAGE HELPERS (GITHUB PAGES SAFE)
    // =====================================

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


    // =====================================
    // CHECK LOGIN SESSION
    // =====================================

    const isLoggedIn = safeSessionGet("isLoggedIn");
    const loggedInRole = safeSessionGet("loggedInRole");

    if (isLoggedIn !== "true" || loggedInRole !== "student") {
        window.location.replace("index.html");
        return;
    }

    const sessionStudentName = safeSessionGet("loggedInName", "Student") || "Student";
    const loggedInUsername = safeSessionGet("loggedInUsername", "student") || "student";


    // =====================================
    // STUDENT PROFILE INFORMATION
    // =====================================

    let users = [];

    try {
        const rawUsers = safeLocalGet("users", null);
        users = rawUsers ? JSON.parse(rawUsers) : [];
        if (!Array.isArray(users)) {
            users = [];
        }
    } catch (error) {
        users = [];
    }

    const studentIndex = users.findIndex(function (user) {
        return user && user.username === loggedInUsername && user.role === "student";
    });

    let studentAccount = studentIndex !== -1 ? users[studentIndex] : {};

    const displayName =
        studentAccount.fullName ||
        studentAccount.name ||
        safeSessionGet("loggedInName", sessionStudentName) ||
        sessionStudentName;


    // =====================================
    // SHARED PROFILE PICTURE STORAGE
    // =====================================

    const profilePictureKey = "egStudentProfilePicture_" + loggedInUsername;
    const oldProfilePictureKey = "egProfilePicture_" + loggedInUsername;

    let profilePicture =
        safeLocalGet(profilePictureKey, "") ||
        studentAccount.profilePicture ||
        safeLocalGet(oldProfilePictureKey, "") ||
        "";

    if (profilePicture) {
        safeLocalSet(profilePictureKey, profilePicture);
    }


    const studentNameElement = document.getElementById("studentName");
    const dropdownStudentName = document.getElementById("dropdownStudentName");
    const profileAvatar = document.getElementById("profileAvatar");
    const dropdownAvatar = document.getElementById("dropdownAvatar");

    function createAvatarContent(element) {
        if (!element) return;

        element.innerHTML = "";

        if (profilePicture) {
            const image = document.createElement("img");
            image.src = profilePicture;
            image.alt = "Student profile picture";
            image.onerror = function () {
                element.innerHTML = "";
                element.textContent = displayName.charAt(0).toUpperCase();
            };
            element.appendChild(image);
        } else {
            element.textContent = displayName.charAt(0).toUpperCase();
        }
    }

    function updateStudentProfileDisplay() {
        if (studentNameElement) {
            studentNameElement.textContent = displayName;
        }

        if (dropdownStudentName) {
            dropdownStudentName.textContent = displayName;
        }

        createAvatarContent(profileAvatar);
        createAvatarContent(dropdownAvatar);
    }

    updateStudentProfileDisplay();


    // =====================================
    // PROFILE DROPDOWN
    // =====================================

    const profileButton = document.getElementById("profileButton");
    const profileDropdown = document.getElementById("profileDropdown");

    if (profileButton && profileDropdown) {
        profileButton.addEventListener("click", function (event) {
            event.stopPropagation();
            const isOpen = profileDropdown.classList.contains("show");
            closeNotificationPanel();
            profileDropdown.classList.toggle("show", !isOpen);
            profileButton.setAttribute("aria-expanded", String(!isOpen));
        });
    }

    function closeProfileDropdown() {
        if (profileDropdown) {
            profileDropdown.classList.remove("show");
        }
        if (profileButton) {
            profileButton.setAttribute("aria-expanded", "false");
        }
    }


    // =====================================
    // VIEW STUDENT PROFILE MODAL
    // =====================================

    const viewProfileButton = document.getElementById("viewProfileButton");
    const profileModal = document.getElementById("profileModal");
    const closeProfileModal = document.getElementById("closeProfileModal");

    function displayProfileDetails() {
        const profileFields = {
            viewFullName: studentAccount.fullName || studentAccount.name || sessionStudentName,
            viewUsername: studentAccount.username || loggedInUsername || "-",
            viewStudentId: studentAccount.studentId || studentAccount.id || "-",
            viewEmail: studentAccount.email || "-",
            viewPhone: studentAccount.phone || studentAccount.phoneNumber || "-",
            viewProgram: studentAccount.program || studentAccount.course || "-"
        };

        Object.keys(profileFields).forEach(function (id) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = profileFields[id];
            }
        });

        const modalStudentName = document.getElementById("modalStudentName");
        const modalProfileAvatar = document.getElementById("modalProfileAvatar");

        if (modalStudentName) {
            modalStudentName.textContent = displayName;
        }

        if (modalProfileAvatar) {
            modalProfileAvatar.innerHTML = "";
            if (profilePicture) {
                const image = document.createElement("img");
                image.src = profilePicture;
                image.alt = "Student profile picture";
                image.onerror = function () {
                    modalProfileAvatar.innerHTML = "";
                    modalProfileAvatar.textContent = displayName.charAt(0).toUpperCase();
                };
                modalProfileAvatar.appendChild(image);
            } else {
                modalProfileAvatar.textContent = displayName.charAt(0).toUpperCase();
            }
        }
    }

    if (viewProfileButton && profileModal) {
        viewProfileButton.addEventListener("click", function () {
            closeProfileDropdown();
            displayProfileDetails();
            profileModal.classList.add("show");
        });
    }

    if (closeProfileModal && profileModal) {
        closeProfileModal.addEventListener("click", function () {
            profileModal.classList.remove("show");
        });
    }

    if (profileModal) {
        profileModal.addEventListener("click", function (event) {
            if (event.target === profileModal) {
                profileModal.classList.remove("show");
            }
        });
    }


    // =====================================
    // UPLOAD PROFILE PICTURE
    // =====================================

    const uploadPictureButton = document.getElementById("uploadPictureButton");
    const profilePictureInput = document.getElementById("profilePictureInput");

    if (uploadPictureButton && profilePictureInput) {
        uploadPictureButton.addEventListener("click", function () {
            closeProfileDropdown();
            profilePictureInput.click();
        });

        profilePictureInput.addEventListener("change", function () {
            const file = profilePictureInput.files && profilePictureInput.files[0];
            if (!file) return;

            const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
            if (!allowedTypes.includes(file.type)) {
                alert("Please upload a JPG, PNG or WEBP image.");
                profilePictureInput.value = "";
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                alert("Profile picture must not exceed 2MB.");
                profilePictureInput.value = "";
                return;
            }

            const reader = new FileReader();
            reader.onload = function (event) {
                const resultUrl = event.target && event.target.result;
                if (typeof resultUrl !== "string") return;

                if (!safeLocalSet(profilePictureKey, resultUrl)) {
                    alert("Unable to save the picture. Please try a smaller image.");
                    return;
                }

                profilePicture = resultUrl;
                if (studentIndex !== -1 && users[studentIndex]) {
                    users[studentIndex].profilePicture = profilePicture;
                    safeLocalSet("users", JSON.stringify(users));
                    studentAccount = users[studentIndex];
                }

                updateStudentProfileDisplay();
                displayProfileDetails();
                alert("Your profile picture has been updated successfully!");
            };

            reader.onerror = function () {
                alert("Unable to read the selected image.");
            };

            reader.readAsDataURL(file);
            profilePictureInput.value = "";
        });
    }


    // =====================================
    // NOTIFICATION SYSTEM
    // =====================================

    const notificationButton = document.getElementById("notificationButton");
    const notificationPanel = document.getElementById("notificationPanel");
    const notificationBadge = document.getElementById("notificationBadge");
    const notificationList = document.getElementById("notificationList");
    const notificationCount = document.getElementById("notificationCount");
    const notificationEmpty = document.getElementById("notificationEmpty");
    const markAllReadButton = document.getElementById("markAllReadButton");

    const notificationStorageKey = "egNotifications_" + loggedInUsername;

    const defaultNotifications = [
        {
            id: "notice001",
            title: "Assignment Reminder",
            message: "Your Individual Project for IMS566 (Advanced Web Design Development and Content Management) is due soon.",
            type: "assignment",
            date: "14 November 2026",
            read: false
        }
    ];

    let notifications = [];

    try {
        const savedNotifications = safeLocalGet(notificationStorageKey, null);
        notifications = savedNotifications ? JSON.parse(savedNotifications) : defaultNotifications;
        if (!Array.isArray(notifications)) {
            notifications = defaultNotifications;
        }
    } catch (error) {
        notifications = defaultNotifications;
    }

    function saveNotifications() {
        safeLocalSet(notificationStorageKey, JSON.stringify(notifications));
    }

    function renderNotifications() {
        if (!notificationList) return;
        notificationList.innerHTML = "";

        const unread = notifications.filter(item => item && !item.read);

        if (notificationBadge) {
            if (unread.length > 0) {
                notificationBadge.classList.add("show");
            } else {
                notificationBadge.classList.remove("show");
            }
        }

        if (notificationCount) {
            notificationCount.textContent = unread.length === 0
                ? "You have no new notifications"
                : `You have ${unread.length} unread notification(s)`;
        }

        if (notificationEmpty) {
            notificationEmpty.hidden = notifications.length > 0;
        }

        notifications.forEach(function (item, index) {
            if (!item) return;
            const div = document.createElement("div");
            div.className = "notification-item" + (!item.read ? " unread" : "");
            div.innerHTML = `
                <div class="notification-item-icon" style="background:#f7e5ef; color:#b67c9e;"><i class="bi bi-bell"></i></div>
                <div class="notification-item-content">
                    <h6>${escapeHTML(item.title)}</h6>
                    <p>${escapeHTML(item.message)}</p>
                    <small>${escapeHTML(item.date || item.time || "")}</small>
                </div>
            `;
            div.addEventListener("click", function () {
                notifications[index].read = true;
                saveNotifications();
                renderNotifications();
            });
            notificationList.appendChild(div);
        });
    }

    function closeNotificationPanel() {
        if (notificationPanel) {
            notificationPanel.classList.remove("show");
        }
        if (notificationButton) {
            notificationButton.setAttribute("aria-expanded", "false");
        }
    }

    if (notificationButton && notificationPanel) {
        notificationButton.addEventListener("click", function (event) {
            event.stopPropagation();
            const isOpen = notificationPanel.classList.contains("show");
            closeProfileDropdown();
            notificationPanel.classList.toggle("show", !isOpen);
            notificationButton.setAttribute("aria-expanded", String(!isOpen));
        });
    }

    if (markAllReadButton) {
        markAllReadButton.addEventListener("click", function () {
            notifications.forEach(n => { if (n) n.read = true; });
            saveNotifications();
            renderNotifications();
        });
    }

    renderNotifications();


    // =====================================
    // CLOSE DROPDOWNS WHEN CLICKING OUTSIDE
    // =====================================

    document.addEventListener("click", function (event) {
        if (
            profileDropdown &&
            !profileDropdown.contains(event.target) &&
            profileButton &&
            !profileButton.contains(event.target)
        ) {
            closeProfileDropdown();
        }

        if (
            notificationPanel &&
            !notificationPanel.contains(event.target) &&
            notificationButton &&
            !notificationButton.contains(event.target)
        ) {
            closeNotificationPanel();
        }
    });


    // =====================================
    // LOGOUT FUNCTION
    // =====================================

    function logoutStudent() {
        const confirmLogout = window.confirm("Are you sure you want to log out?");
        if (confirmLogout) {
            safeSessionClear();
            window.location.href = "index.html";
        }
    }

    const profileLogoutButton = document.getElementById("profileLogoutButton");
    if (profileLogoutButton) {
        profileLogoutButton.addEventListener("click", logoutStudent);
    }


    // =====================================
    // MOBILE SIDEBAR
    // =====================================

    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menuToggle");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    function openSidebar() {
        if (sidebar) sidebar.classList.add("show");
        if (sidebarOverlay) sidebarOverlay.classList.add("show");
    }

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove("show");
        if (sidebarOverlay) sidebarOverlay.classList.remove("show");
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
        sidebarOverlay.addEventListener("click", closeSidebar);
    }

    document.querySelectorAll(".menu-link").forEach(function (link) {
        link.addEventListener("click", closeSidebar);
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeSidebar();
            closeProfileDropdown();
            closeNotificationPanel();
            if (profileModal) profileModal.classList.remove("show");
        }
    });


    // =====================================
    // COURSE DATA & DISPLAY (ACTIVE ONLY)
    // =====================================

    const defaultCourses = [
        {
            id: "C001",
            code: "IMS560",
            name: "Advanced Database Management System",
            category: "3 Hours · Profesor Madya Dr Muhamad Khairulnizam Bin Zaini",
            creditHours: 3,
            lecturer: "PROFESOR MADYA DR MUHAMAD KHAIRULNIZAM BIN ZAINI",
            progress: 80,
            description: "Advanced concepts in database architecture, relational modeling, query optimization, and transaction management.",
            status: "Active",
            materials: []
        },
        {
            id: "C002",
            code: "IMS565",
            name: "Information System Project Management",
            category: "3 Hours · Dr. Hasnah Binti Hashim",
            creditHours: 3,
            lecturer: "DR. HASNAH BINTI HASHIM",
            progress: 65,
            description: "Planning, scheduling, risk management, and delivery of information system projects.",
            status: "Active",
            materials: []
        },
        {
            id: "C003",
            code: "IMS566",
            name: "Advanced Web Design Development and Content Management",
            category: "3 Hours · Dr. Muhammad Asyraf Bin Wahi Anuar",
            creditHours: 3,
            lecturer: "DR. MUHAMMAD ASYRAF BIN WAHI ANUAR",
            progress: 90,
            description: "Modern responsive web engineering, front-end interfaces, and content management workflows.",
            status: "Active",
            materials: []
        },
        {
            id: "C004",
            code: "IMS564",
            name: "User Experience Design",
            category: "3 Hours · Profesor Madya Dr Norizan Binti Anwar",
            creditHours: 3,
            lecturer: "PROFESOR MADYA DR NORIZAN BINTI ANWAR",
            progress: 75,
            description: "User-centered research, interaction design, prototyping, and usability evaluation.",
            status: "Active",
            materials: []
        },
        {
            id: "C005",
            code: "CTU554",
            name: "Values and Civilization II",
            category: "2 Hours · Ahmad Syahmi Bin Mohd Kamil",
            creditHours: 2,
            lecturer: "AHMAD SYAHMI BIN MOHD KAMIL",
            progress: 85,
            description: "Foundational values, ethics, and civilizational perspectives in contemporary society.",
            status: "Active",
            materials: []
        },
        {
            id: "C006",
            code: "LCC501",
            name: "English for Professional Correspondence",
            category: "2 Hours · Siti Nurshafezan Binti Ahmad",
            creditHours: 2,
            lecturer: "SITI NURSHAFEZAN BINTI AHMAD",
            progress: 82,
            description: "Effective business writing, reports, proposals, and formal workplace communication.",
            status: "Active",
            materials: []
        },
        {
            id: "C007",
            code: "TGC451",
            name: "Introductory German (Level II)",
            category: "2 Hours · Haslina Binti Daud",
            creditHours: 2,
            lecturer: "HASLINA BINTI DAUD",
            progress: 70,
            description: "Intermediate vocabulary, grammar structures, and everyday conversational German.",
            status: "Active",
            materials: []
        },
        {
            id: "C008",
            code: "ICM572",
            name: "Gamification for Content Management",
            category: "3 Hours · Dr. Mazwani Ayu Binti Mazlan",
            creditHours: 3,
            lecturer: "DR. MAZWANI AYU BINTI MAZLAN",
            progress: 88,
            description: "Applying game mechanics, engagement loops, and interactive design to digital content systems.",
            status: "Active",
            materials: []
        }
    ];

    const COURSE_BY_CODE = defaultCourses.reduce(function (acc, item) {
        acc[item.code.toUpperCase()] = item;
        return acc;
    }, {});

    let courses;
    try {
        const savedCourses = safeLocalGet("egCourses", null);
        courses = savedCourses ? JSON.parse(savedCourses) : defaultCourses;
        if (!Array.isArray(courses) || courses.length === 0) {
            courses = defaultCourses;
        }
    } catch (error) {
        console.error("Failed to parse egCourses from localStorage:", error);
        courses = defaultCourses;
    }

    const normalizedCourses = [];
    const seenCourseCodes = new Set();

    courses.forEach(function (course, idx) {
        if (!course || typeof course !== "object") return;
        const codeKey = String(course.code || course.courseCode || "").trim().toUpperCase();
        const catalogMatch = COURSE_BY_CODE[codeKey];
        const code = codeKey || catalogMatch?.code || `COURSE${idx + 1}`;
        const name = String(course.name || course.courseName || catalogMatch?.name || "Untitled Course").trim();
        const creditHours = course.creditHours ?? catalogMatch?.creditHours ?? 3;
        const lecturer = course.lecturer || catalogMatch?.lecturer || "Lecturer Name";

        if (!seenCourseCodes.has(code)) {
            seenCourseCodes.add(code);
            normalizedCourses.push(Object.assign({}, catalogMatch, course, {
                id: course.id || catalogMatch?.id || code,
                code: code,
                name: name,
                creditHours: creditHours,
                lecturer: lecturer,
                category: course.category || `${creditHours} Hours · ${lecturer}`,
                description: course.description || catalogMatch?.description || "No description available.",
                status: course.status || catalogMatch?.status || "Active"
            }));
        }
    });

    defaultCourses.forEach(function (catCourse) {
        if (!seenCourseCodes.has(catCourse.code.toUpperCase())) {
            seenCourseCodes.add(catCourse.code.toUpperCase());
            normalizedCourses.push(Object.assign({}, catCourse));
        }
    });

    const activeCourses = normalizedCourses
        .filter(function (course) {
            return String(course && course.status ? course.status : "Active").toLowerCase() === "active";
        })
        .map(function (course, idx) {
            const hasId = course && course.id !== undefined && course.id !== null && String(course.id).trim() !== "";
            return {
                ...course,
                _lookupKey: hasId ? String(course.id) + "_" + idx : "idx_" + idx
            };
        });

    const coursesGrid = document.getElementById("coursesGrid");
    const courseCount = document.getElementById("courseCount");
    const searchInput = document.getElementById("courseSearch");
    const mobileSearchInput = document.getElementById("mobileCourseSearch");
    const emptyState = document.getElementById("emptyState");

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (character) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[character];
        });
    }

    function sanitizeUrl(rawUrl) {
        const trimmed = String(rawUrl || "").trim();
        if (!trimmed) return "#";
        const lower = trimmed.toLowerCase();
        if (lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("./") || lower.startsWith("../") || (!lower.includes(":"))) {
            return trimmed;
        }
        return "#";
    }

    function displayCourses(search = "") {
        if (!coursesGrid || !courseCount || !emptyState) return;
        coursesGrid.innerHTML = "";

        const searchValue = search.toLowerCase();
        const filteredCourses = activeCourses.filter(function (course) {
            const courseName = String(course.name || "").toLowerCase();
            const courseCode = String(course.code || "").toLowerCase();
            const courseLecturer = String(course.lecturer || "").toLowerCase();
            return courseName.includes(searchValue) || courseCode.includes(searchValue) || courseLecturer.includes(searchValue);
        });

        courseCount.textContent = String(activeCourses.length).padStart(2, "0");
        emptyState.hidden = filteredCourses.length !== 0;

        const colors = ["course-pink", "course-purple", "course-peach", "course-blue"];
        const barColors = ["pink-bar", "purple-bar", "peach-bar", "pink-bar"];

        filteredCourses.forEach(function (course, index) {
            const card = document.createElement("div");
            card.className = "course-card";
            const courseProgress = Math.min(100, Math.max(0, Number(course.progress) || 0));

            card.innerHTML = `
                <div class="course-top ${colors[index % colors.length]}">
                    <i class="bi bi-book-half"></i>
                    <span class="course-code">${escapeHTML(course.code)}</span>
                </div>
                <div class="course-body">
                    <h5>${escapeHTML(course.name)}</h5>
                    <p>${escapeHTML(course.category || "Information Management")}</p>
                    <div class="course-progress">
                        <span>Course Progress</span>
                        <strong>${courseProgress}%</strong>
                    </div>
                    <div class="progress">
                        <div class="progress-bar ${barColors[index % barColors.length]}" style="width: ${courseProgress}%"></div>
                    </div>
                    <button type="button" class="details-btn" data-course-key="${escapeHTML(course._lookupKey)}">
                        View Details <i class="bi bi-arrow-right"></i>
                    </button>
                </div>
            `;
            coursesGrid.appendChild(card);
        });

        document.querySelectorAll(".details-btn").forEach(function (button) {
            button.addEventListener("click", function () {
                showCourseDetails(button.dataset.courseKey);
            });
        });
    }

    function showCourseDetails(courseKey) {
        const course = activeCourses.find(item => item._lookupKey === String(courseKey));
        const courseDetails = document.getElementById("courseDetails");
        const modalElement = document.getElementById("courseModal");

        if (!courseDetails || !modalElement) return;

        if (!course) {
            courseDetails.innerHTML = "<p>Course details could not be found.</p>";
        } else {
            const materials = Array.isArray(course.materials) ? course.materials : [];
            const materialsHTML = materials.length
                ? materials.map(m => {
                    const safeHref = escapeHTML(sanitizeUrl(m && m.url));
                    const label = escapeHTML((m && m.name) || "Material");
                    return `<li><a href="${safeHref}" target="_blank" rel="noopener noreferrer">${label}</a></li>`;
                }).join("")
                : "<li>No learning materials have been added yet.</li>";

            courseDetails.innerHTML = `
                <p><strong>Course Code:</strong> ${escapeHTML(course.code || "-")}</p>
                <p><strong>Course Name:</strong> ${escapeHTML(course.name || "-")}</p>
                <p><strong>Credit Hours:</strong> ${escapeHTML(course.creditHours ?? "-")} Hours</p>
                <p><strong>Lecturer:</strong> ${escapeHTML(course.lecturer || "-")}</p>
                <p><strong>Progress:</strong> ${Math.min(100, Math.max(0, Number(course.progress) || 0))}%</p>
                <h6>Course Description</h6>
                <p>${escapeHTML(course.description || "No description available.")}</p>
                <h6>Learning Materials</h6>
                <ul>${materialsHTML}</ul>
            `;
        }

        if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
            bootstrap.Modal.getOrCreateInstance(modalElement).show();
        } else {
            modalElement.classList.add("show");
            modalElement.style.display = "block";
        }
    }

    if (searchInput) {
        searchInput.addEventListener("input", function () {
            if (mobileSearchInput) mobileSearchInput.value = searchInput.value;
            displayCourses(searchInput.value.trim());
        });
    }

    if (mobileSearchInput) {
        mobileSearchInput.addEventListener("input", function () {
            if (searchInput) searchInput.value = mobileSearchInput.value;
            displayCourses(mobileSearchInput.value.trim());
        });
    }

    displayCourses();

});
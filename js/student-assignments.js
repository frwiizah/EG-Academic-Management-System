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


    // Student Authentication //

    if (
        safeSessionGet("isLoggedIn") !== "true" ||
        safeSessionGet("loggedInRole") !== "student"
    ) {
        window.location.replace("index.html");
        return;
    }

    const studentName =
        safeSessionGet("loggedInName", "Student") || "Student";

    const username =
        safeSessionGet("loggedInUsername", "student") || "student";

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
        return user && user.username === username && user.role === "student";
    });

    let student = studentIndex !== -1 ? users[studentIndex] : {};

    // SHARED PROFILE PICTURE STORAGE KEY //
    const profilePictureKey = "egStudentProfilePicture_" + username;
    const oldProfilePictureKey = "egProfilePicture_" + username;

    let profilePicture =
        safeLocalGet(profilePictureKey, "") ||
        student.profilePicture ||
        safeLocalGet(oldProfilePictureKey, "") ||
        "";

    if (profilePicture) {
        safeLocalSet(profilePictureKey, profilePicture);
    }

    const displayName =
        student.fullName ||
        student.name ||
        studentName ||
        "Student";


    // Display Student Name and Profile Picture //

    const studentNameElement = document.getElementById("studentName");
    const profileAvatar = document.getElementById("profileAvatar");
    const dropdownAvatar = document.getElementById("dropdownAvatar");
    const dropdownStudentName = document.getElementById("dropdownStudentName");

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

    function updateProfileDisplay() {
        if (studentNameElement) {
            studentNameElement.textContent = displayName;
        }

        if (dropdownStudentName) {
            dropdownStudentName.textContent = displayName;
        }

        createAvatarContent(profileAvatar);
        createAvatarContent(dropdownAvatar);
    }

    updateProfileDisplay();


    // =====================================
    // NOTIFICATION SYSTEM
    // =====================================

    const notificationButton = document.getElementById("notificationButton");
    const notificationPanel = document.getElementById("notificationPanel");
    const notificationList = document.getElementById("notificationList");
    const notificationBadge = document.getElementById("notificationBadge");
    const notificationCount = document.getElementById("notificationCount");
    const notificationEmpty = document.getElementById("notificationEmpty");
    const markAllReadButton = document.getElementById("markAllRead");

    const notificationStorageKey = "egNotifications_" + username;

    const defaultNotifications = [
        {
            id: "notice001",
            title: "Assignment Reminder",
            message: "Your Individual Project for IMS566 (Advanced Web Design Development and Content Management) is due on 15 November 2026.",
            type: "assignment",
            date: "14 November 2026",
            read: false
        },
        {
            id: "notice002",
            title: "Upcoming Assignment",
            message: "Your Group Assignment for IMS565 (Information System Project Management) is due on 20 November 2026.",
            type: "assignment",
            date: "14 November 2026",
            read: false
        },
        {
            id: "notice003",
            title: "Exercise Reminder",
            message: "Remember to complete your Chapter 4 Exercise for IMS560 (Advanced Database Management System) before 25 November 2026.",
            type: "assignment",
            date: "14 November 2026",
            read: false
        },
        {
            id: "notice004",
            title: "Welcome to EG Student Portal",
            message: "Stay updated with your assignments, academic activities and learning progress.",
            type: "announcement",
            date: "14 November 2026",
            read: false
        }
    ];

    let notifications = [];

    try {
        const savedNotifications = safeLocalGet(notificationStorageKey, null);

        if (savedNotifications) {
            notifications = JSON.parse(savedNotifications);
            if (!Array.isArray(notifications)) {
                notifications = defaultNotifications;
                saveNotifications();
            }
        } else {
            notifications = defaultNotifications;
            saveNotifications();
        }
    } catch (error) {
        notifications = defaultNotifications;
        saveNotifications();
    }

    function saveNotifications() {
        safeLocalSet(notificationStorageKey, JSON.stringify(notifications));
    }

    function getNotificationIcon(type) {
        if (type === "assignment") {
            return {
                icon: "bi-file-earmark-text",
                background: "#f7e5ef",
                color: "#b67c9e"
            };
        }
        if (type === "feedback") {
            return {
                icon: "bi-chat-left-text",
                background: "#ece7f8",
                color: "#8f7bbd"
            };
        }
        return {
            icon: "bi-megaphone",
            background: "#fbe9df",
            color: "#d69a78"
        };
    }

    function renderNotifications() {
        if (!notificationList) return;

        notificationList.innerHTML = "";

        const unreadNotifications = notifications.filter(function (item) {
            return item && !item.read;
        });

        if (notificationBadge) {
            if (unreadNotifications.length > 0) {
                notificationBadge.classList.add("show");
                notificationBadge.textContent =
                    unreadNotifications.length > 9 ? "9+" : unreadNotifications.length;
            } else {
                notificationBadge.classList.remove("show");
                notificationBadge.textContent = "";
            }
        }

        if (notificationCount) {
            if (unreadNotifications.length === 0) {
                notificationCount.textContent = "You have no new notifications";
            } else {
                notificationCount.textContent =
                    "You have " + unreadNotifications.length + " unread notification(s)";
            }
        }

        if (notifications.length === 0) {
            if (notificationEmpty) {
                notificationEmpty.hidden = false;
            }
            return;
        }

        if (notificationEmpty) {
            notificationEmpty.hidden = true;
        }

        notifications.forEach(function (item, index) {
            if (!item) return;
            const iconData = getNotificationIcon(item.type);

            const notificationItem = document.createElement("div");
            notificationItem.className = "notification-item";

            if (!item.read) {
                notificationItem.classList.add("unread");
            }

            const icon = document.createElement("div");
            icon.className = "notification-item-icon";
            icon.style.background = iconData.background;
            icon.style.color = iconData.color;

            const iconElement = document.createElement("i");
            iconElement.className = "bi " + iconData.icon;
            icon.appendChild(iconElement);

            const content = document.createElement("div");
            content.className = "notification-item-content";

            const title = document.createElement("h6");
            title.textContent = item.title;

            const message = document.createElement("p");
            message.textContent = item.message;

            const date = document.createElement("small");
            date.textContent = item.date || "";

            content.appendChild(title);
            content.appendChild(message);
            content.appendChild(date);

            notificationItem.appendChild(icon);
            notificationItem.appendChild(content);

            if (!item.read) {
                const unreadDot = document.createElement("span");
                unreadDot.className = "notification-unread-dot";
                notificationItem.appendChild(unreadDot);
            }

            notificationItem.addEventListener("click", function () {
                notifications[index].read = true;
                saveNotifications();
                renderNotifications();
            });

            notificationList.appendChild(notificationItem);
        });
    }

    renderNotifications();

    if (notificationButton && notificationPanel) {
        notificationButton.addEventListener("click", function (event) {
            event.stopPropagation();
            notificationPanel.classList.toggle("show");

            const profileDropdown = document.getElementById("profileDropdown");
            if (profileDropdown) {
                profileDropdown.classList.remove("show");
            }
        });
    }

    if (markAllReadButton) {
        markAllReadButton.addEventListener("click", function () {
            notifications.forEach(function (item) {
                if (item) item.read = true;
            });
            saveNotifications();
            renderNotifications();
        });
    }


    // Logout with Confirmation //

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

    // Student Profile Dropdown //

    const profileButton = document.getElementById("profileButton");
    const profileDropdown = document.getElementById("profileDropdown");

    if (profileButton && profileDropdown) {
        profileButton.addEventListener("click", function (event) {
            event.stopPropagation();
            profileDropdown.classList.toggle("show");

            if (notificationPanel) {
                notificationPanel.classList.remove("show");
            }
        });
    }


    // View Student Profile Modal //

    const viewProfileButton = document.getElementById("viewProfileButton");
    const profileModal = document.getElementById("profileModal");
    const closeProfileModal = document.getElementById("closeProfileModal");

    function displayProfileDetails() {
        const profileFields = {
            viewFullName: student.fullName || student.name || studentName,
            viewUsername: student.username || username || "-",
            viewStudentId: student.studentId || student.id || "-",
            viewEmail: student.email || "-",
            viewPhone: student.phone || student.phoneNumber || "-",
            viewProgram: student.program || student.course || "-"
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
            displayProfileDetails();
            profileModal.classList.add("show");
            if (profileDropdown) {
                profileDropdown.classList.remove("show");
            }
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


    // Change Profile Picture //

    const changePictureButton = document.getElementById("changePictureButton");
    const profilePictureInput = document.getElementById("profilePictureInput");

    if (changePictureButton && profilePictureInput) {
        changePictureButton.addEventListener("click", function () {
            if (profileDropdown) {
                profileDropdown.classList.remove("show");
            }
            profilePictureInput.click();
        });
    }

    if (profilePictureInput) {
        profilePictureInput.addEventListener("change", function () {
            const file = profilePictureInput.files && profilePictureInput.files[0];

            if (!file) return;

            if (!file.type.startsWith("image/")) {
                alert("Please select a valid image file.");
                profilePictureInput.value = "";
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                alert("Your profile picture must be smaller than 2 MB.");
                profilePictureInput.value = "";
                return;
            }

            const reader = new FileReader();

            reader.onload = function (event) {
                const resultUrl = event.target && event.target.result;
                if (typeof resultUrl !== "string") return;

                if (!safeLocalSet(profilePictureKey, resultUrl)) {
                    alert("Unable to save your picture. Please try a smaller image.");
                    return;
                }

                profilePicture = resultUrl;
                if (studentIndex !== -1 && users[studentIndex]) {
                    users[studentIndex].profilePicture = profilePicture;
                    safeLocalSet("users", JSON.stringify(users));
                    student = users[studentIndex];
                }

                updateProfileDisplay();
                displayProfileDetails();

                alert("Your profile picture has been updated successfully.");
            };

            reader.onerror = function () {
                alert("Unable to upload your picture. Please try again.");
            };

            reader.readAsDataURL(file);
            profilePictureInput.value = "";
        });
    }


    // Close Dropdowns When Clicking Outside //

    document.addEventListener("click", function (event) {
        if (
            notificationPanel &&
            notificationButton &&
            !notificationPanel.contains(event.target) &&
            !notificationButton.contains(event.target)
        ) {
            notificationPanel.classList.remove("show");
        }

        if (
            profileDropdown &&
            profileButton &&
            !profileDropdown.contains(event.target) &&
            !profileButton.contains(event.target)
        ) {
            profileDropdown.classList.remove("show");
        }
    });


    // Mobile Sidebar //

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

    function toggleSidebar() {
        if (!sidebar) return;
        if (sidebar.classList.contains("show")) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }

    if (menuToggle) {
        menuToggle.addEventListener("click", function (event) {
            event.stopPropagation();
            toggleSidebar();
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", function () {
            closeSidebar();
        });
    }

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeSidebar();
            if (notificationPanel) {
                notificationPanel.classList.remove("show");
            }
            if (profileDropdown) {
                profileDropdown.classList.remove("show");
            }
            if (profileModal) {
                profileModal.classList.remove("show");
            }
        }
    });

    if (sidebar) {
        sidebar.querySelectorAll(".menu-link").forEach(function (link) {
            link.addEventListener("click", function () {
                closeSidebar();
            });
        });
    }

    // Course Reference & Sample Assignments Data //

    const COURSE_BY_CODE = {
        IMS560: {
            code: "IMS560",
            name: "Advanced Database Management System",
            creditHours: 3,
            lecturer: "PROFESOR MADYA DR MUHAMAD KHAIRULNIZAM BIN ZAINI"
        },
        IMS565: {
            code: "IMS565",
            name: "Information System Project Management",
            creditHours: 3,
            lecturer: "DR. HASNAH BINTI HASHIM"
        },
        IMS566: {
            code: "IMS566",
            name: "Advanced Web Design Development and Content Management",
            creditHours: 3,
            lecturer: "DR. MUHAMMAD ASYRAF BIN WAHI ANUAR"
        },
        IMS564: {
            code: "IMS564",
            name: "User Experience Design",
            creditHours: 3,
            lecturer: "PROFESOR MADYA DR NORIZAN BINTI ANWAR"
        },
        CTU554: {
            code: "CTU554",
            name: "Values and Civilization II",
            creditHours: 2,
            lecturer: "AHMAD SYAHMI BIN MOHD KAMIL"
        },
        LCC501: {
            code: "LCC501",
            name: "English for Professional Correspondence",
            creditHours: 2,
            lecturer: "SITI NURSHAFEZAN BINTI AHMAD"
        },
        TGC451: {
            code: "TGC451",
            name: "Introductory German (Level II)",
            creditHours: 2,
            lecturer: "HASLINA BINTI DAUD"
        },
        ICM572: {
            code: "ICM572",
            name: "Gamification for Content Management",
            creditHours: 3,
            lecturer: "DR. MAZWANI AYU BINTI MAZLAN"
        }
    };

    const sampleAssignments = [

        {
            id: "A001",
            title: "Individual Project",
            courseCode: "IMS566",
            courseName: "Advanced Web Design Development and Content Management",
            lecturer: "DR. MUHAMMAD ASYRAF BIN WAHI ANUAR",
            category: "Individual",
            dueDate: "2026-11-15",
            description: "Complete your individual project based on the requirements provided by your lecturer. Prepare your project report and submit it before the deadline."
        },

        {
            id: "A002",
            title: "Group Assignment",
            courseCode: "IMS565",
            courseName: "Information System Project Management",
            lecturer: "DR. HASNAH BINTI HASHIM",
            category: "Group",
            dueDate: "2026-11-20",
            description: "Work together with your group members to complete the assigned task. Make sure all required sections are included in your final submission."
        },

        {
            id: "A003",
            title: "Chapter 4 Exercise",
            courseCode: "IMS560",
            courseName: "Advanced Database Management System",
            lecturer: "PROFESOR MADYA DR MUHAMAD KHAIRULNIZAM BIN ZAINI",
            category: "Exercise",
            dueDate: "2026-11-25",
            description: "Complete all exercises from Chapter 4. Review your answers before submitting your completed work."
        },

        {
            id: "A004",
            title: "UX Usability Evaluation Task",
            courseCode: "IMS564",
            courseName: "User Experience Design",
            lecturer: "PROFESOR MADYA DR NORIZAN BINTI ANWAR",
            category: "Quiz",
            dueDate: "2026-11-05",
            description: "Complete the usability evaluation questions based on the topics covered in class."
        }

    ];


    // Load Assignments //

    function loadAssignments() {

        try {

            const saved = safeLocalGet("egAssignments", null);

            if (saved === null) {

                safeLocalSet(
                    "egAssignments",
                    JSON.stringify(sampleAssignments)
                );

                return sampleAssignments;

            }

            const parsed = JSON.parse(saved);

            if (!Array.isArray(parsed)) return [];

            return parsed.map(function (item) {
                if (!item || typeof item !== "object") return item;
                const codeKey = String(item.courseCode || "").trim().toUpperCase();
                const refCourse = COURSE_BY_CODE[codeKey];
                if (!refCourse) return item;
                return Object.assign({}, item, {
                    courseCode: refCourse.code,
                    courseName: item.courseName || refCourse.name,
                    lecturer: item.lecturer || refCourse.lecturer
                });
            });

        } catch (error) {

            console.error("Unable to load assignments:", error);

            return [];

        }

    }


    let assignments = loadAssignments();


    // Each student has separate submission records //
    const submissionKey = "egSubmissions_" + username;


    // Load Submissions //

    function loadSubmissions() {

        try {

            const rawSaved = safeLocalGet(submissionKey, null);
            const saved = rawSaved ? JSON.parse(rawSaved) : null;

            return saved && typeof saved === "object" && !Array.isArray(saved)
                ? saved
                : {};

        } catch (error) {

            console.error("Unable to load submissions:", error);

            return {};

        }

    }


    let submissions = loadSubmissions();


    function saveSubmissions() {

        if (!safeLocalSet(submissionKey, JSON.stringify(submissions))) {

            alert(
                "Unable to save your file. Please try a smaller file or remove old browser data."
            );

            return false;

        }

        return true;

    }


    // Date Functions //

    function getToday() {

        const date = new Date();

        const year = date.getFullYear();

        const month = String(date.getMonth() + 1).padStart(2, "0");

        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;

    }


    function formatDate(dateString) {

        if (typeof dateString !== "string") return dateString || "-";

        const parts = dateString.split("-");
        if (parts.length !== 3) return dateString;

        const year = Number(parts[0]);
        const month = Number(parts[1]);
        const day = Number(parts[2]);

        if (!year || month < 1 || month > 12 || day < 1 || day > 31) {
            return dateString;
        }

        const date = new Date(year, month - 1, day);

        return date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

    }


    // Helper Functions //

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


    function getAssignmentStatus(assignment) {

        if (submissions[assignment.id]) {

            return "submitted";

        }


        if (assignment.dueDate && assignment.dueDate < getToday()) {

            return "overdue";

        }


        return "pending";

    }


    function getStatusLabel(status) {

        const labels = {
            pending: "Pending",
            submitted: "Submitted",
            overdue: "Overdue"
        };

        return labels[status] || "Pending";

    }


    // Summary Cards //

    function updateSummary() {

        let pending = 0;

        let submitted = 0;

        let overdue = 0;


        assignments.forEach(function (assignment) {

            const status = getAssignmentStatus(assignment);

            if (status === "pending") pending++;

            if (status === "submitted") submitted++;

            if (status === "overdue") overdue++;

        });


        const totalEl = document.getElementById("totalAssignments");
        const pendingEl = document.getElementById("pendingAssignments");
        const submittedEl = document.getElementById("submittedAssignments");
        const overdueEl = document.getElementById("overdueAssignments");

        if (totalEl) totalEl.textContent = assignments.length;
        if (pendingEl) pendingEl.textContent = pending;
        if (submittedEl) submittedEl.textContent = submitted;
        if (overdueEl) overdueEl.textContent = overdue;

    }


    // Render Assignments Cards //

    const assignmentsGrid = document.getElementById("assignmentsGrid");

    const noResults = document.getElementById("noResults");

    let currentFilter = "all";

    let currentSearch = "";


    function renderAssignments() {

        if (!assignmentsGrid) return;

        assignmentsGrid.innerHTML = "";


        const filteredAssignments = assignments.filter(function (assignment) {

            if (!assignment) return false;

            const status = getAssignmentStatus(assignment);

            const searchText = (
                (assignment.title || "") + " " +
                (assignment.courseCode || "") + " " +
                (assignment.courseName || "") + " " +
                (assignment.lecturer || "")
            ).toLowerCase();

            const matchesSearch = searchText.includes(currentSearch);

            const matchesFilter =
                currentFilter === "all" || status === currentFilter;

            return matchesSearch && matchesFilter;

        });


        filteredAssignments.forEach(function (assignment) {

            const status = getAssignmentStatus(assignment);

            const card = document.createElement("div");

            card.className = "assignment-card";

            card.innerHTML = `

                <div class="assignment-card-top">

                    <span class="assignment-course">
                        ${escapeHTML(assignment.courseCode)}
                    </span>

                    <span class="status-badge status-${status}">
                        ${getStatusLabel(status)}
                    </span>

                </div>

                <h5>${escapeHTML(assignment.title)}</h5>

                <p class="assignment-description">
                    ${escapeHTML(assignment.description)}
                </p>

                <div class="assignment-meta">

                    <span>
                        <i class="bi bi-book"></i>
                        ${escapeHTML(assignment.courseName)}
                    </span>

                    <span>
                        <i class="bi bi-calendar-event"></i>
                        Due: ${escapeHTML(formatDate(assignment.dueDate))}
                    </span>

                </div>

                <div class="assignment-card-footer">

                    <button
                        type="button"
                        class="view-details-btn"
                        data-action="details"
                        data-id="${escapeHTML(assignment.id)}">

                        <i class="bi bi-eye"></i>
                        View Details

                    </button>

                    <button
                        type="button"
                        class="card-submit-btn"
                        data-action="submit"
                        data-id="${escapeHTML(assignment.id)}"
                        ${status === "overdue" ? "disabled" : ""}>

                        <i class="bi bi-upload"></i>
                        ${status === "submitted" ? "Resubmit" : "Submit"}

                    </button>

                </div>

            `;

            assignmentsGrid.appendChild(card);

        });


        if (noResults) {
            noResults.hidden = filteredAssignments.length !== 0;
        }

        updateSummary();

    }


    // Search Assignments //

    const searchInputEl = document.getElementById("searchInput");
    if (searchInputEl) {
        searchInputEl.addEventListener("input", function () {

            currentSearch = this.value.toLowerCase().trim();

            renderAssignments();

        });
    }


    // Filter Assignments //

    document.querySelectorAll(".filter-btn").forEach(function (button) {

        button.addEventListener("click", function () {

            document.querySelectorAll(".filter-btn").forEach(function (btn) {

                btn.classList.remove("active");

            });


            this.classList.add("active");

            currentFilter = this.dataset.filter;

            renderAssignments();

        });

    });


    // Modal Variables //

    const detailsModalElement = document.getElementById("detailsModal");

    const submissionModalElement = document.getElementById("submissionModal");

    const detailsModal = detailsModalElement && typeof bootstrap !== "undefined"
        ? new bootstrap.Modal(detailsModalElement)
        : null;

    const submissionModal = submissionModalElement && typeof bootstrap !== "undefined"
        ? new bootstrap.Modal(submissionModalElement)
        : null;

    let pendingSubmissionId = null;


    // View Assignment Details //

    function viewDetails(id) {

        const assignment = assignments.find(item => item && item.id === id);

        if (!assignment) return;

        const status = getAssignmentStatus(assignment);

        document.getElementById("detailCourse").textContent =
            (assignment.courseCode || "") + " · " + (assignment.courseName || "");

        document.getElementById("detailTitle").textContent =
            assignment.title || "";

        document.getElementById("detailLecturer").textContent =
            assignment.lecturer || "Lecturer not specified";

        document.getElementById("detailDueDate").textContent =
            formatDate(assignment.dueDate);

        document.getElementById("detailCategory").textContent =
            assignment.category || "-";

        document.getElementById("detailDescription").textContent =
            assignment.description || "";

        const statusElement = document.getElementById("detailStatus");

        statusElement.textContent =
            "Current status: " + getStatusLabel(status);


        const submitButton = document.getElementById("detailsSubmitButton");

        submitButton.dataset.id = id;

        submitButton.disabled = status === "overdue";

        submitButton.innerHTML = status === "submitted"
            ? '<i class="bi bi-arrow-repeat"></i> Resubmit Assignment'
            : '<i class="bi bi-upload"></i> Submit Assignment';


        if (status === "overdue") {

            statusElement.textContent +=
                ". The submission deadline has passed.";

        } else if (status === "submitted") {

            statusElement.textContent +=
                ". You have already submitted this assignment.";

        }


        if (detailsModal) detailsModal.show();

    }


    // Assignments Card Button //

    if (assignmentsGrid) {
        assignmentsGrid.addEventListener("click", function (e) {

            const button = e.target.closest("button[data-action]");

            if (!button) return;

            const id = button.dataset.id;


            if (button.dataset.action === "details") {

                viewDetails(id);

            }


            if (button.dataset.action === "submit" && !button.disabled) {

                openSubmissionModal(id);

            }

        });
    }


    // Open Submission Modal //

    function openSubmissionModal(id) {

        const assignment = assignments.find(item => item && item.id === id);

        if (!assignment) return;

        if (getAssignmentStatus(assignment) === "overdue") {

            alert("The deadline for this assignment has passed.");

            return;

        }


        document.getElementById("submissionForm").reset();

        document.getElementById("submissionAssignmentId").value = id;

        document.getElementById("submissionAssignmentName").textContent =
            (assignment.title || "") + " · " + (assignment.courseCode || "");

        document.getElementById("submissionModalTitle").textContent =
            submissions[id] ? "Resubmit Assignment" : "Submit Assignment";

        document.getElementById("confirmSubmitButton").innerHTML =
            submissions[id]
                ? '<i class="bi bi-arrow-repeat"></i> Update Submission'
                : '<i class="bi bi-send"></i> Submit Work';


        const existingSubmission =
            document.getElementById("existingSubmission");

        if (submissions[id]) {

            existingSubmission.hidden = false;

            existingSubmission.innerHTML = `
                <i class="bi bi-check-circle-fill"></i>
                Previous file: ${escapeHTML(submissions[id].fileName)}
            `;

        } else {

            existingSubmission.hidden = true;

            existingSubmission.innerHTML = "";

        }

        if (submissionModal) submissionModal.show();

    }


    // Open Submission From Details Modal //

    const detailsSubmitBtn = document.getElementById("detailsSubmitButton");
    if (detailsSubmitBtn) {
        detailsSubmitBtn.addEventListener("click", function () {

            const id = this.dataset.id;

            if (!id || this.disabled) return;

            pendingSubmissionId = id;

            if (detailsModal) detailsModal.hide();

        });
    }


    if (detailsModalElement) {
        detailsModalElement.addEventListener("hidden.bs.modal", function () {

            if (pendingSubmissionId) {

                const id = pendingSubmissionId;

                pendingSubmissionId = null;

                openSubmissionModal(id);

            }

        });
    }


    // File Submission //

    const submissionFormEl = document.getElementById("submissionForm");
    if (submissionFormEl) {
        submissionFormEl.addEventListener("submit", function (e) {

            e.preventDefault();

            const id = document.getElementById("submissionAssignmentId").value;

            const assignment = assignments.find(item => item && item.id === id);

            const fileInput = document.getElementById("submissionFile");

            const file = fileInput.files && fileInput.files[0];


            if (!assignment || !file) {

                alert("Please select an assignment file.");

                return;

            }


            if (getAssignmentStatus(assignment) === "overdue") {

                alert("The deadline for this assignment has passed.");

                return;

            }


            // Allowed file formats //

            const allowedExtensions = [
                "pdf",
                "doc",
                "docx",
                "ppt",
                "pptx",
                "zip"
            ];

            const extension = file.name.split(".").pop().toLowerCase();

            if (!allowedExtensions.includes(extension)) {

                alert("Please upload a PDF, DOC, DOCX, PPT, PPTX or ZIP file.");

                return;

            }

            // Maximum file size: 1.5 MB //

            const maximumSize = 1.5 * 1024 * 1024;

            if (file.size > maximumSize) {

                alert("Your file is too large. The maximum size is 1.5 MB.");

                return;

            }


            const reader = new FileReader();

            reader.onload = function () {

                const oldSubmission = submissions[id];

                submissions[id] = {
                    fileName: file.name,
                    fileType: file.type,
                    fileData: reader.result,
                    submittedAt: new Date().toISOString()
                };


                if (!saveSubmissions()) {

                    if (oldSubmission === undefined) {

                        delete submissions[id];

                    } else {

                        submissions[id] = oldSubmission;

                    }

                    return;

                }


                alert("Your assignment has been submitted successfully! ♡");

                if (submissionModal) submissionModal.hide();

                renderAssignments();

            };


            reader.onerror = function () {

                alert("Unable to read your file. Please try again.");

            };


            reader.readAsDataURL(file);

        });
    }


    // Initial Display //

    renderAssignments();

});
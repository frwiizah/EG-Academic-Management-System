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
    // CHECK STUDENT LOGIN SESSION
    // =====================================

    const isLoggedIn = safeSessionGet("isLoggedIn");
    const loggedInRole = safeSessionGet("loggedInRole");

    if (isLoggedIn !== "true" || loggedInRole !== "student") {
        window.location.replace("index.html");
        return;
    }


    // =====================================
    // GET STUDENT INFORMATION
    // =====================================

    const studentUsername = safeSessionGet("loggedInUsername", "") || "";
    const studentName = safeSessionGet("loggedInName", "Student") || "Student";

    let users = [];

    try {
        const rawUsers = safeLocalGet("users", null);
        users = rawUsers ? JSON.parse(rawUsers) : [];
        if (!Array.isArray(users)) users = [];
    } catch (error) {
        users = [];
    }

    const studentIndex = users.findIndex(function (user) {
        return user && user.username === studentUsername && user.role === "student";
    });

    let student = studentIndex !== -1 ? users[studentIndex] : {};

    const profilePictureKey = "egStudentProfilePicture_" + studentUsername;
    const oldProfilePictureKey = "egProfilePicture_" + studentUsername;

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


    // =====================================
    // DISPLAY STUDENT NAME AND PICTURE
    // =====================================

    const studentNameElement = document.getElementById("studentName");
    const welcomeName = document.getElementById("welcomeName");
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
        if (studentNameElement) studentNameElement.textContent = displayName;
        if (welcomeName) welcomeName.textContent = displayName;
        if (dropdownStudentName) dropdownStudentName.textContent = displayName;
        createAvatarContent(profileAvatar);
        createAvatarContent(dropdownAvatar);
    }

    updateProfileDisplay();


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


    // =====================================
    // ACTIVE COURSES & DASHBOARD SYNC
    // =====================================

    const defaultActiveCourses = [
        {
            id: "C001",
            code: "IMS560",
            name: "Advanced Database Management System",
            category: "3 Hours · Profesor Madya Dr Muhamad Khairulnizam Bin Zaini",
            creditHours: 3,
            lecturer: "PROFESOR MADYA DR MUHAMAD KHAIRULNIZAM BIN ZAINI",
            progress: 80,
            status: "Active"
        },
        {
            id: "C002",
            code: "IMS565",
            name: "Information System Project Management",
            category: "3 Hours · Dr. Hasnah Binti Hashim",
            creditHours: 3,
            lecturer: "DR. HASNAH BINTI HASHIM",
            progress: 65,
            status: "Active"
        },
        {
            id: "C003",
            code: "IMS566",
            name: "Advanced Web Design Development and Content Management",
            category: "3 Hours · Dr. Muhammad Asyraf Bin Wahi Anuar",
            creditHours: 3,
            lecturer: "DR. MUHAMMAD ASYRAF BIN WAHI ANUAR",
            progress: 90,
            status: "Active"
        },
        {
            id: "C004",
            code: "IMS564",
            name: "User Experience Design",
            category: "3 Hours · Profesor Madya Dr Norizan Binti Anwar",
            creditHours: 3,
            lecturer: "PROFESOR MADYA DR NORIZAN BINTI ANWAR",
            progress: 75,
            status: "Active"
        },
        {
            id: "C005",
            code: "CTU554",
            name: "Values and Civilization II",
            category: "2 Hours · Ahmad Syahmi Bin Mohd Kamil",
            creditHours: 2,
            lecturer: "AHMAD SYAHMI BIN MOHD KAMIL",
            progress: 85,
            status: "Active"
        },
        {
            id: "C006",
            code: "LCC501",
            name: "English for Professional Correspondence",
            category: "2 Hours · Siti Nurshafezan Binti Ahmad",
            creditHours: 2,
            lecturer: "SITI NURSHAFEZAN BINTI AHMAD",
            progress: 82,
            status: "Active"
        },
        {
            id: "C007",
            code: "TGC451",
            name: "Introductory German (Level II)",
            category: "2 Hours · Haslina Binti Daud",
            creditHours: 2,
            lecturer: "HASLINA BINTI DAUD",
            progress: 70,
            status: "Active"
        },
        {
            id: "C008",
            code: "ICM572",
            name: "Gamification for Content Management",
            category: "3 Hours · Dr. Mazwani Ayu Binti Mazlan",
            creditHours: 3,
            lecturer: "DR. MAZWANI AYU BINTI MAZLAN",
            progress: 88,
            status: "Active"
        }
    ];

    const COURSE_BY_CODE = defaultActiveCourses.reduce(function (acc, item) {
        acc[item.code.toUpperCase()] = item;
        return acc;
    }, {});

    function getActiveCourses() {
        let rawCourses = [];
        try {
            const saved = safeLocalGet("egCourses", null);
            if (saved === null) {
                return defaultActiveCourses;
            }
            const parsed = JSON.parse(saved);
            rawCourses = Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultActiveCourses;
        } catch (e) {
            rawCourses = defaultActiveCourses;
        }

        const normalized = rawCourses.map(function (course) {
            if (!course || typeof course !== "object") return course;
            const codeKey = String(course.code || course.courseCode || "").trim().toUpperCase();
            const catalogItem = COURSE_BY_CODE[codeKey];
            if (!catalogItem) return course;

            const creditHours = course.creditHours ?? catalogItem.creditHours;
            const lecturer = course.lecturer || catalogItem.lecturer;
            return Object.assign({}, catalogItem, course, {
                code: catalogItem.code,
                name: course.name || course.courseName || catalogItem.name,
                category: course.category || `${creditHours} Hours · ${lecturer}`
            });
        });

        return normalized.filter(function (course) {
            return String(course && course.status ? course.status : "Active").toLowerCase() === "active";
        });
    }

    function isAssignmentOverdue(dueDateStr) {
        if (!dueDateStr) return false;
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const parsedDue = new Date(dueDateStr);
        if (Number.isNaN(parsedDue.getTime())) return false;
        const dueDayStart = new Date(parsedDue.getFullYear(), parsedDue.getMonth(), parsedDue.getDate());
        return dueDayStart < todayStart;
    }

    function renderDashboardCourses(searchQuery = "") {
        const coursesGrid = document.getElementById("coursesGrid");
        const noResults = document.getElementById("noResults");
        if (!coursesGrid) return;

        const activeCourses = getActiveCourses();
        const query = searchQuery.toLowerCase().trim();

        const filtered = activeCourses.filter(function (course) {
            const text = `${course.code || ""} ${course.name || ""} ${course.category || ""} ${course.lecturer || ""}`.toLowerCase();
            return text.includes(query);
        });

        coursesGrid.innerHTML = "";

        const topStyles = [
            { topClass: "course-pink", barClass: "pink-bar", icon: "bi-database" },
            { topClass: "course-purple", barClass: "purple-bar", icon: "bi-kanban" },
            { topClass: "course-peach", barClass: "peach-bar", icon: "bi-window-sidebar" }
        ];

        filtered.slice(0, 3).forEach(function (course, index) {
            const style = topStyles[index % topStyles.length];
            const progress = Math.min(100, Math.max(0, Number(course.progress) || 0));

            const card = document.createElement("div");
            card.className = "course-card";
            card.innerHTML = `
                <div class="course-top ${style.topClass}">
                    <i class="bi ${style.icon}"></i>
                    <span>${escapeHTML(course.code || "-")}</span>
                </div>
                <div class="course-body">
                    <h5>${escapeHTML(course.name || "Untitled Course")}</h5>
                    <p>${escapeHTML(course.category || "Information Management")}</p>
                    <div class="course-progress">
                        <div class="progress-info">
                            <span>Course Progress</span>
                            <strong>${progress}%</strong>
                        </div>
                        <div class="progress">
                            <div class="progress-bar ${style.barClass}" style="width:${progress}%"></div>
                        </div>
                    </div>
                </div>
            `;
            coursesGrid.appendChild(card);
        });

        if (noResults) {
            noResults.hidden = filtered.length !== 0;
        }
    }

    function syncDashboardData() {
        const statEnrolled = document.getElementById("statEnrolledCourses");
        const statCompleted = document.getElementById("statCompletedTasks");
        const statPending = document.getElementById("statPendingTasks");
        const statPerformance = document.getElementById("statOverallPerformance");
        const perfScoreDisplay = document.getElementById("perfScoreDisplay");

        const activeCourses = getActiveCourses();
        if (statEnrolled) {
            statEnrolled.textContent = String(activeCourses.length).padStart(2, "0");
        }

        const searchEl = document.getElementById("searchInput");
        renderDashboardCourses(searchEl ? searchEl.value : "");

        let assignments = [];
        try {
            const rawAssignments = safeLocalGet("egAssignments", null);
            assignments = rawAssignments ? JSON.parse(rawAssignments) : [];
            if (!Array.isArray(assignments)) assignments = [];
        } catch (e) { assignments = []; }

        let submissions = {};
        try {
            const rawSubs = safeLocalGet("egSubmissions_" + studentUsername, null);
            submissions = rawSubs ? JSON.parse(rawSubs) : {};
        } catch (e) { submissions = {}; }

        let savedPerf = null;
        try {
            const rawPerf = safeLocalGet("egStudentPerformance_" + studentUsername, null);
            savedPerf = rawPerf ? JSON.parse(rawPerf) : null;
        } catch (e) { savedPerf = null; }

        let completedCount = 0;
        let pendingCount = 0;

        assignments.forEach(function (assignment) {
            if (!assignment) return;
            if (submissions && submissions[assignment.id]) {
                completedCount++;
            } else if (!isAssignmentOverdue(assignment.dueDate)) {
                pendingCount++;
            }
        });

        if (savedPerf && typeof savedPerf.completedTasks === "number") {
            completedCount = savedPerf.completedTasks;
        }
        if (savedPerf && typeof savedPerf.pendingTasks === "number") {
            pendingCount = savedPerf.pendingTasks;
        }

        if (statCompleted) statCompleted.textContent = String(completedCount).padStart(2, "0");
        if (statPending) statPending.textContent = String(pendingCount).padStart(2, "0");

        if (savedPerf && savedPerf.average !== undefined && savedPerf.average !== null) {
            if (statPerformance) statPerformance.textContent = savedPerf.average + "%";
            if (perfScoreDisplay) perfScoreDisplay.textContent = savedPerf.average + "%";
        }
    }

    syncDashboardData();


    // =====================================
    // EDITABLE MINI CALENDAR WIDGET LOGIC
    // =====================================
    const calendarStorageKey = "egCalendarEvents_" + studentUsername;

    function loadDashboardEvents() {
        let savedEvents = [];
        try {
            const rawEvents = safeLocalGet(calendarStorageKey, null);
            savedEvents = rawEvents ? JSON.parse(rawEvents) : [];
            if (!Array.isArray(savedEvents)) savedEvents = [];
        } catch (e) {
            savedEvents = [];
        }

        let assignments = [];
        try {
            const rawAssignments = safeLocalGet("egAssignments", null);
            assignments = rawAssignments ? JSON.parse(rawAssignments) : [];
            if (!Array.isArray(assignments)) assignments = [];
        } catch (e) { assignments = []; }

        const assignmentEvents = assignments
            .filter(a => a && a.dueDate)
            .map(function (assignment) {
                const codeKey = String(assignment.courseCode || "").trim().toUpperCase();
                const courseObj = COURSE_BY_CODE[codeKey];
                const courseLabel = courseObj
                    ? `${courseObj.code} - ${courseObj.name}`
                    : (assignment.courseCode || "");
                return {
                    id: "assignment_" + assignment.id,
                    title: "Due: " + (assignment.title || "Assignment"),
                    date: assignment.dueDate,
                    time: "23:59",
                    category: "Reminder",
                    description: courseLabel + " · " + (assignment.description || "Assignment Deadline"),
                    isAssignment: true
                };
            });

        const manualEvents = savedEvents.filter(ev => ev && !ev.isAssignment);
        return manualEvents.concat(assignmentEvents);
    }

    let dashToday = new Date();
    let dashYear = dashToday.getFullYear();
    let dashMonth = dashToday.getMonth();
    let selectedDashDate = dashToday.toISOString().split("T")[0];

    const dashCalendarGrid = document.getElementById("dashboardCalendarGrid");
    const dashMonthYear = document.getElementById("dashboardMonthYear");
    const dashCalendarMonth = document.getElementById("dashCalendarMonth");

    function renderDashboardCalendar() {
        if (!dashCalendarGrid) return;

        const firstDay = new Date(dashYear, dashMonth, 1);
        const lastDay = new Date(dashYear, dashMonth + 1, 0);
        const totalDays = lastDay.getDate();
        const startingDay = (firstDay.getDay() + 6) % 7;

        const monthName = firstDay.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
        if (dashMonthYear) dashMonthYear.textContent = monthName;
        if (dashCalendarMonth) dashCalendarMonth.textContent = monthName;

        dashCalendarGrid.innerHTML = "";
        const events = loadDashboardEvents();
        const todayStr = new Date().toISOString().split("T")[0];

        const prevMonthLastDay = new Date(dashYear, dashMonth, 0).getDate();
        for (let i = startingDay - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            const d = new Date(dashYear, dashMonth - 1, day);
            appendDashDayCell(d, true, events, todayStr);
        }

        for (let day = 1; day <= totalDays; day++) {
            const d = new Date(dashYear, dashMonth, day);
            appendDashDayCell(d, false, events, todayStr);
        }

        const remainingCells = 42 - dashCalendarGrid.children.length;
        for (let day = 1; day <= remainingCells; day++) {
            const d = new Date(dashYear, dashMonth + 1, day);
            appendDashDayCell(d, true, events, todayStr);
        }
    }

    function appendDashDayCell(dateObj, isOtherMonth, events, todayStr) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "calendar-day";
        btn.textContent = String(dateObj.getDate());
        btn.style.height = "34px";
        btn.style.fontSize = "10px";

        if (isOtherMonth) btn.classList.add("other-month");
        if (dateStr === todayStr) btn.classList.add("today");
        if (dateStr === selectedDashDate) btn.classList.add("selected");
        if (events.some(ev => ev.date === dateStr)) btn.classList.add("has-event");

        btn.addEventListener("click", function () {
            selectedDashDate = dateStr;
            dashYear = dateObj.getFullYear();
            dashMonth = dateObj.getMonth();
            renderDashboardCalendar();
            openDashboardAddEventModal(dateStr);
        });

        dashCalendarGrid.appendChild(btn);
    }

    function openDashboardAddEventModal(dateString) {
        const eventForm = document.getElementById("eventForm");
        const modalTitle = document.getElementById("modalTitle");
        const saveEventButton = document.getElementById("saveEventButton");
        const eventDateInput = document.getElementById("eventDate");
        const eventIdInput = document.getElementById("eventId");

        if (eventForm) eventForm.reset();
        if (eventIdInput) eventIdInput.value = "";
        if (modalTitle) modalTitle.textContent = "Add New Event";
        if (saveEventButton) saveEventButton.textContent = "Save Event";
        if (eventDateInput) eventDateInput.value = dateString;

        const eventModalEl = document.getElementById("eventModal");
        if (eventModalEl && typeof bootstrap !== "undefined" && bootstrap.Modal) {
            const modal = bootstrap.Modal.getOrCreateInstance(eventModalEl);
            modal.show();
        }
    }

    const eventForm = document.getElementById("eventForm");
    if (eventForm) {
        eventForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const idEl = document.getElementById("eventId");
            const nameEl = document.getElementById("eventName");
            const dateEl = document.getElementById("eventDate");
            const timeEl = document.getElementById("eventTime");
            const catEl = document.getElementById("eventCategory");
            const descEl = document.getElementById("eventDescription");

            const id = idEl ? idEl.value : "";
            const title = nameEl ? nameEl.value.trim() : "";
            const date = dateEl ? dateEl.value : "";
            const time = timeEl ? timeEl.value : "";
            const category = catEl ? catEl.value : "Study";
            const description = descEl ? descEl.value.trim() : "";

            if (!title || !date) {
                alert("Please enter the event name and date.");
                return;
            }

            let savedEvents = [];
            try {
                const rawSaved = safeLocalGet(calendarStorageKey, null);
                savedEvents = rawSaved ? JSON.parse(rawSaved) : [];
                if (!Array.isArray(savedEvents)) savedEvents = [];
            } catch (err) { savedEvents = []; }

            const newEvent = {
                id: id || Date.now().toString(),
                title,
                date,
                time,
                category,
                description,
                isAssignment: false
            };

            if (id) {
                const index = savedEvents.findIndex(ev => ev && ev.id === id);
                if (index !== -1) savedEvents[index] = newEvent;
                else savedEvents.push(newEvent);
            } else {
                savedEvents.push(newEvent);
            }

            if (!safeLocalSet(calendarStorageKey, JSON.stringify(savedEvents))) {
                alert("Could not save event due to browser storage limits.");
                return;
            }

            const eventModalEl = document.getElementById("eventModal");
            if (eventModalEl && typeof bootstrap !== "undefined" && bootstrap.Modal) {
                const modal = bootstrap.Modal.getInstance(eventModalEl);
                if (modal) modal.hide();
            }

            renderDashboardCalendar();
            syncDashboardData();
            alert("Event saved successfully and synced with your calendar!");
        });
    }

    const dashPrevMonth = document.getElementById("dashPrevMonth");
    const dashNextMonth = document.getElementById("dashNextMonth");
    const dashboardAddEventBtn = document.getElementById("dashboardAddEventBtn");

    if (dashPrevMonth) {
        dashPrevMonth.addEventListener("click", function () {
            dashMonth--;
            if (dashMonth < 0) { dashMonth = 11; dashYear--; }
            renderDashboardCalendar();
        });
    }

    if (dashNextMonth) {
        dashNextMonth.addEventListener("click", function () {
            dashMonth++;
            if (dashMonth > 11) { dashMonth = 0; dashYear++; }
            renderDashboardCalendar();
        });
    }

    if (dashboardAddEventBtn) {
        dashboardAddEventBtn.addEventListener("click", function () {
            openDashboardAddEventModal(new Date().toISOString().split("T")[0]);
        });
    }

    renderDashboardCalendar();


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
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    function openSidebar() {
        if (sidebar) sidebar.classList.add("show");
        if (sidebarOverlay) sidebarOverlay.classList.add("show");
        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "true");
            menuToggle.setAttribute("aria-label", "Close navigation menu");
        }
    }

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove("show");
        if (sidebarOverlay) sidebarOverlay.classList.remove("show");
        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation menu");
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
        sidebarOverlay.addEventListener("click", closeSidebar);
    }

    if (sidebar) {
        sidebar.querySelectorAll(".menu-link").forEach(function (link) {
            link.addEventListener("click", closeSidebar);
        });
    }

    window.addEventListener("resize", function () {
        if (window.innerWidth > 850) {
            closeSidebar();
        }
    });


    // =====================================
    // NOTIFICATION SYSTEM
    // =====================================
    const notificationButton = document.getElementById("notificationButton");
    const notificationPanel = document.getElementById("notificationPanel");
    const notificationList = document.getElementById("notificationList");
    const notificationBadge = document.getElementById("notificationBadge");
    const notificationCount = document.getElementById("notificationCount");
    const notificationEmpty = document.getElementById("notificationEmpty");
    const markAllRead = document.getElementById("markAllRead");

    const notificationStorageKey = "egNotifications_" + studentUsername;
    const defaultNotifications = [
        {
            id: "notice001",
            title: "Assignment Reminder",
            message: "Your Database Schema & Query Report for IMS560 (Advanced Database Management System) is due soon.",
            type: "assignment",
            date: "14 November 2026",
            read: false
        }
    ];

    let notifications = [];
    try {
        const savedNotifications = safeLocalGet(notificationStorageKey, null);
        notifications = savedNotifications ? JSON.parse(savedNotifications) : defaultNotifications;
        if (!Array.isArray(notifications)) notifications = defaultNotifications;
    } catch (e) {
        notifications = defaultNotifications;
    }

    function renderNotifications() {
        if (!notificationList) return;
        notificationList.innerHTML = "";
        const unread = notifications.filter(item => item && !item.read);

        if (notificationBadge) {
            if (unread.length > 0) {
                notificationBadge.classList.add("show");
                notificationBadge.textContent = unread.length > 9 ? "9+" : String(unread.length);
            } else {
                notificationBadge.classList.remove("show");
            }
        }
        if (notificationCount) {
            notificationCount.textContent = unread.length === 0
                ? "You have no new notifications"
                : `You have ${unread.length} unread notification(s)`;
        }
        if (notificationEmpty) notificationEmpty.hidden = notifications.length > 0;

        notifications.forEach(function (item, index) {
            if (!item) return;
            const div = document.createElement("div");
            div.className = "notification-item" + (!item.read ? " unread" : "");
            div.innerHTML = `
                <div class="notification-item-icon" style="background:#f7e5ef; color:#b67c9e;"><i class="bi bi-bell"></i></div>
                <div class="notification-item-content">
                    <h6>${escapeHTML(item.title)}</h6>
                    <p>${escapeHTML(item.message)}</p>
                    <small>${escapeHTML(item.date || "")}</small>
                </div>
            `;
            div.addEventListener("click", function () {
                notifications[index].read = true;
                safeLocalSet(notificationStorageKey, JSON.stringify(notifications));
                renderNotifications();
            });
            notificationList.appendChild(div);
        });
    }
    renderNotifications();

    if (markAllRead) {
        markAllRead.addEventListener("click", function (event) {
            event.stopPropagation();
            notifications.forEach(function (item) {
                if (item) item.read = true;
            });
            safeLocalSet(notificationStorageKey, JSON.stringify(notifications));
            renderNotifications();
        });
    }

    if (notificationButton && notificationPanel) {
        notificationButton.addEventListener("click", function (event) {
            event.stopPropagation();
            const isOpen = notificationPanel.classList.toggle("show");
            if (isOpen && profileDropdown) {
                profileDropdown.classList.remove("show");
            }
        });
    }


    // =====================================
    // PROFILE MODAL, PICTURE UPLOAD & DROPDOWN
    // =====================================
    const profileButton = document.getElementById("profileButton");
    const profileDropdown = document.getElementById("profileDropdown");
    if (profileButton && profileDropdown) {
        profileButton.addEventListener("click", function (e) {
            e.stopPropagation();
            const isOpen = profileDropdown.classList.toggle("show");
            profileButton.setAttribute("aria-expanded", String(isOpen));
            if (isOpen && notificationPanel) {
                notificationPanel.classList.remove("show");
            }
        });
    }

    document.addEventListener("click", function (event) {
        if (
            profileDropdown &&
            profileButton &&
            !profileDropdown.contains(event.target) &&
            !profileButton.contains(event.target)
        ) {
            profileDropdown.classList.remove("show");
            profileButton.setAttribute("aria-expanded", "false");
        }
        if (
            notificationPanel &&
            notificationButton &&
            !notificationPanel.contains(event.target) &&
            !notificationButton.contains(event.target)
        ) {
            notificationPanel.classList.remove("show");
        }
    });

    const changePictureButton = document.getElementById("changePictureButton");
    const profilePictureInput = document.getElementById("profilePictureInput");

    if (changePictureButton && profilePictureInput) {
        changePictureButton.addEventListener("click", function () {
            if (profileDropdown) profileDropdown.classList.remove("show");
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
                if (studentIndex !== -1 && users[studentIndex]) {
                    users[studentIndex].profilePicture = profilePicture;
                    safeLocalSet("users", JSON.stringify(users));
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

    function populateProfileModal() {
        const modalStudentName = document.getElementById("modalStudentName");
        const modalProfileAvatar = document.getElementById("modalProfileAvatar");

        if (modalStudentName) {
            modalStudentName.textContent = displayName;
        }
        createAvatarContent(modalProfileAvatar);

        const fullNameEl = document.getElementById("viewFullName");
        const usernameEl = document.getElementById("viewUsername");
        const studentIdEl = document.getElementById("viewStudentId");
        const emailEl = document.getElementById("viewEmail");
        const phoneEl = document.getElementById("viewPhone");
        const programEl = document.getElementById("viewProgram");

        if (fullNameEl) fullNameEl.textContent = student.fullName || student.name || studentName;
        if (usernameEl) usernameEl.textContent = student.username || studentUsername || "-";
        if (studentIdEl) studentIdEl.textContent = student.studentId || student.id || "-";
        if (emailEl) emailEl.textContent = student.email || "-";
        if (phoneEl) phoneEl.textContent = student.phone || student.phoneNumber || "-";
        if (programEl) programEl.textContent = student.program || student.course || "-";
    }

    if (viewProfileButton && profileModal) {
        viewProfileButton.addEventListener("click", function () {
            populateProfileModal();
            profileModal.classList.add("show");
            if (profileDropdown) {
                profileDropdown.classList.remove("show");
                if (profileButton) profileButton.setAttribute("aria-expanded", "false");
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

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeSidebar();
            if (profileModal) profileModal.classList.remove("show");
            if (profileDropdown) {
                profileDropdown.classList.remove("show");
                if (profileButton) profileButton.setAttribute("aria-expanded", "false");
            }
            if (notificationPanel) {
                notificationPanel.classList.remove("show");
            }
        }
    });


    // =====================================
    // SEARCH COURSES
    // =====================================
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            renderDashboardCourses(searchInput.value);
        });
    }


    // =====================================
    // PERFORMANCE CHART
    // =====================================
    const chartCanvas = document.getElementById("performanceChart");
    if (chartCanvas && typeof Chart !== "undefined") {
        new Chart(chartCanvas, {
            type: "line",
            data: {
                labels: ["June", "July", "August", "September", "October", "November"],
                datasets: [{
                    label: "Academic Performance",
                    data: [60, 68, 65, 75, 80, 85],
                    borderColor: "#c18da6",
                    backgroundColor: "rgba(217, 165, 184, 0.18)",
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: "#c18da6",
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, max: 100, grid: { color: "#f3edf1" } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

});
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

    const username = safeSessionGet("loggedInUsername", "") || "";
    const studentName = safeSessionGet("loggedInName", "Student") || "Student";

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

    // SHARED PROFILE PICTURE STORAGE KEY
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


    // =====================================
    // DISPLAY STUDENT NAME AND PICTURE
    // =====================================

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
    // LOGOUT FUNCTION
    // =====================================

    function logoutStudent() {
        const confirmation = window.confirm("Are you sure you want to log out?");

        if (confirmation) {
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
        sidebarOverlay.addEventListener("click", function () {
            closeSidebar();
        });
    }

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeSidebar();
            if (notificationPanel) notificationPanel.classList.remove("show");
            if (profileDropdown) profileDropdown.classList.remove("show");
            if (profileModal) profileModal.classList.remove("show");
        }
    });

    if (sidebar) {
        sidebar.querySelectorAll(".menu-link").forEach(function (link) {
            link.addEventListener("click", function () {
                closeSidebar();
            });
        });
    }


    // =====================================
    // COURSE CATALOG & NOTIFICATION SYSTEM
    // =====================================

    const COURSE_CATALOG = {
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
            return { icon: "bi-file-earmark-text", background: "#f7e5ef", color: "#b67c9e" };
        }
        return { icon: "bi-megaphone", background: "#fbe9df", color: "#d69a78" };
    }

    function renderNotifications() {
        if (!notificationList) return;
        notificationList.innerHTML = "";

        const unreadNotifications = notifications.filter(item => item && !item.read);

        if (notificationBadge) {
            if (unreadNotifications.length > 0) {
                notificationBadge.classList.add("show");
                notificationBadge.textContent = unreadNotifications.length > 9 ? "9+" : unreadNotifications.length;
            } else {
                notificationBadge.classList.remove("show");
                notificationBadge.textContent = "";
            }
        }

        if (notificationCount) {
            if (unreadNotifications.length === 0) {
                notificationCount.textContent = "You have no new notifications";
            } else {
                notificationCount.textContent = "You have " + unreadNotifications.length + " unread notification(s)";
            }
        }

        if (notifications.length === 0) {
            if (notificationEmpty) notificationEmpty.hidden = false;
            return;
        }

        if (notificationEmpty) notificationEmpty.hidden = true;

        notifications.forEach(function (item, index) {
            if (!item) return;
            const iconData = getNotificationIcon(item.type);
            const notificationItem = document.createElement("div");
            notificationItem.className = "notification-item";
            if (!item.read) notificationItem.classList.add("unread");

            notificationItem.innerHTML = `
                <div class="notification-item-icon" style="background: ${iconData.background}; color: ${iconData.color};">
                    <i class="bi ${iconData.icon}"></i>
                </div>
                <div class="notification-item-content">
                    <h6>${escapeHTML(item.title)}</h6>
                    <p>${escapeHTML(item.message)}</p>
                    <small>${escapeHTML(item.date || "")}</small>
                </div>
                ${!item.read ? '<span class="notification-unread-dot"></span>' : ''}
            `;

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
            if (profileDropdown) profileDropdown.classList.remove("show");
        });
    }

    if (markAllReadButton) {
        markAllReadButton.addEventListener("click", function () {
            notifications.forEach(item => { if (item) item.read = true; });
            saveNotifications();
            renderNotifications();
        });
    }


    // =====================================
    // STUDENT PROFILE DROPDOWN & MODAL
    // =====================================

    const profileButton = document.getElementById("profileButton");
    const profileDropdown = document.getElementById("profileDropdown");

    if (profileButton && profileDropdown) {
        profileButton.addEventListener("click", function (event) {
            event.stopPropagation();
            profileDropdown.classList.toggle("show");
            if (notificationPanel) notificationPanel.classList.remove("show");
        });
    }

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

        if (modalStudentName) modalStudentName.textContent = displayName;

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
            if (profileDropdown) profileDropdown.classList.remove("show");
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
    // CHANGE PROFILE PICTURE
    // =====================================

    const changePictureButton = document.getElementById("changePictureButton");
    const profilePictureInput = document.getElementById("profilePictureInput");

    if (changePictureButton && profilePictureInput) {
        changePictureButton.addEventListener("click", function () {
            if (profileDropdown) profileDropdown.classList.remove("show");
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


    // =====================================
    // CLOSE DROPDOWNS WHEN CLICKING OUTSIDE
    // =====================================

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


    // =====================================
    // CALENDAR VARIABLES & SYNCED STORAGE LOGIC
    // =====================================

    const today = new Date();
    let currentYear = today.getFullYear();
    let currentMonth = today.getMonth();
    let selectedDate = formatDate(today);

    const calendarGrid = document.getElementById("calendarGrid");
    const eventModalEl = document.getElementById("eventModal");
    const eventModal = eventModalEl && typeof bootstrap !== "undefined"
        ? new bootstrap.Modal(eventModalEl)
        : null;
    const eventForm = document.getElementById("eventForm");
    const storageKey = "egCalendarEvents_" + username;

    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function parseDate(dateString) {
        if (typeof dateString !== "string") return new Date(NaN);
        const parts = dateString.split("-");
        if (parts.length !== 3) return new Date(NaN);
        const y = Number(parts[0]);
        const m = Number(parts[1]);
        const d = Number(parts[2]);
        if (!y || m < 1 || m > 12 || d < 1 || d > 31) return new Date(NaN);
        return new Date(y, m - 1, d);
    }

    function formatLongDate(dateString) {
        const parsed = parseDate(dateString);
        if (isNaN(parsed.getTime())) return dateString || "Invalid date";
        return parsed.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

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

    function loadEvents() {
        let savedEvents = [];
        try {
            const rawSaved = safeLocalGet(storageKey, null);
            savedEvents = rawSaved ? JSON.parse(rawSaved) : [];
            if (!Array.isArray(savedEvents)) savedEvents = [];
        } catch (error) {
            console.error("Unable to load calendar events:", error);
            savedEvents = [];
        }

        let assignments = [];
        try {
            const rawAssignments = safeLocalGet("egAssignments", null);
            assignments = rawAssignments ? JSON.parse(rawAssignments) : [];
            if (!Array.isArray(assignments)) assignments = [];
        } catch (error) {
            assignments = [];
        }

        const assignmentEvents = assignments
            .filter(assignment => assignment && assignment.dueDate && !isNaN(parseDate(assignment.dueDate).getTime()))
            .map(function (assignment) {
                const codeKey = String(assignment.courseCode || "").trim().toUpperCase();
                const refCourse = COURSE_CATALOG[codeKey];
                const courseCode = refCourse ? refCourse.code : (assignment.courseCode || "");
                const courseName = assignment.courseName || (refCourse ? refCourse.name : "");
                const courseLabel = courseCode && courseName
                    ? `${courseCode} (${courseName})`
                    : (courseCode || courseName);
                return {
                    id: "assignment_" + assignment.id,
                    title: "Due: " + assignment.title,
                    date: assignment.dueDate,
                    time: "23:59",
                    category: "Reminder",
                    description: (courseLabel ? courseLabel + " · " : "") + (assignment.description || "Assignment Deadline"),
                    isAssignment: true
                };
            });

        const manualEvents = savedEvents.filter(ev => ev && !ev.isAssignment && !isNaN(parseDate(ev.date).getTime()));
        return manualEvents.concat(assignmentEvents);
    }

    let events = loadEvents();

    function saveEvents() {
        const manualEvents = events.filter(ev => ev && !ev.isAssignment);
        safeLocalSet(storageKey, JSON.stringify(manualEvents));
    }

    function renderCalendar() {
        if (!calendarGrid) return;

        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const totalDays = lastDay.getDate();
        const startingDay = (firstDay.getDay() + 6) % 7;

        const monthName = firstDay.toLocaleDateString("en-GB", {
            month: "long",
            year: "numeric"
        });

        const monthYearEl = document.getElementById("monthYear");
        const calendarMonthEl = document.getElementById("calendarMonth");
        if (monthYearEl) monthYearEl.textContent = monthName;
        if (calendarMonthEl) calendarMonthEl.textContent = monthName;

        calendarGrid.innerHTML = "";

        const previousMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();

        for (let i = startingDay - 1; i >= 0; i--) {
            const day = previousMonthLastDay - i;
            const date = new Date(currentYear, currentMonth - 1, day);
            createCalendarDay(date, true);
        }

        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(currentYear, currentMonth, day);
            createCalendarDay(date, false);
        }

        const remainingCells = 42 - calendarGrid.children.length;
        for (let day = 1; day <= remainingCells; day++) {
            const date = new Date(currentYear, currentMonth + 1, day);
            createCalendarDay(date, true);
        }

        updateSummary();
    }

    function createCalendarDay(date, isOtherMonth) {
        const dateString = formatDate(date);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "calendar-day";
        button.textContent = date.getDate();

        if (isOtherMonth) button.classList.add("other-month");
        if (dateString === formatDate(today)) button.classList.add("today");
        if (dateString === selectedDate) button.classList.add("selected");
        if (events.some(event => event.date === dateString)) button.classList.add("has-event");

        button.addEventListener("click", function () {
            selectedDate = dateString;
            currentYear = date.getFullYear();
            currentMonth = date.getMonth();
            renderCalendar();
            renderSelectedEvents();
        });

        calendarGrid.appendChild(button);
    }

    function renderSelectedEvents() {
        const container = document.getElementById("selectedEvents");
        if (!container) return;

        const selectedEvents = events
            .filter(event => event.date === selectedDate)
            .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

        const selectedDateText = document.getElementById("selectedDateText");
        if (selectedDateText) {
            selectedDateText.textContent = formatLongDate(selectedDate);
        }

        container.innerHTML = "";

        if (selectedEvents.length === 0) {
            container.innerHTML = `
                <div class="empty-events">
                    <i class="bi bi-calendar2-heart"></i>
                    <p>No events for this date.</p>
                    <p>Click "Add Event" to create one.</p>
                </div>
            `;
            return;
        }

        selectedEvents.forEach(function (event) {
            const category = escapeHTML(event.category);
            let icon = "bi-book";

            if (category === "Personal") {
                icon = "bi-person-heart";
            } else if (category === "Reminder") {
                icon = "bi-bell";
            }

            const eventElement = document.createElement("div");
            eventElement.className = "event-item category-" + category.toLowerCase();

            let actionButtons = `
                <div class="event-actions">
                    <button type="button" class="edit-event" data-id="${escapeHTML(event.id)}" title="Edit event">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button type="button" class="delete-event" data-id="${escapeHTML(event.id)}" title="Delete event">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
            if (event.isAssignment) {
                actionButtons = `<div class="event-actions"><span class="badge bg-secondary" style="font-size:9px;">Assignment</span></div>`;
            }

            eventElement.innerHTML = `
                <div class="event-color-icon">
                    <i class="bi ${icon}"></i>
                </div>
                <div class="event-content">
                    <h6>${escapeHTML(event.title)}</h6>
                    <p><i class="bi bi-clock"></i> ${event.time ? escapeHTML(event.time) : "Time not specified"}</p>
                    <p>${escapeHTML(event.description || "No description added.")}</p>
                    <span class="event-category">${category}</span>
                </div>
                ${actionButtons}
            `;

            container.appendChild(eventElement);
        });

        container.querySelectorAll(".edit-event").forEach(function (button) {
            button.addEventListener("click", function () {
                editEvent(this.dataset.id);
            });
        });

        container.querySelectorAll(".delete-event").forEach(function (button) {
            button.addEventListener("click", function () {
                deleteEvent(this.dataset.id);
            });
        });
    }

    const addEventButton = document.getElementById("addEventButton");
    if (addEventButton) {
        addEventButton.addEventListener("click", function () {
            if (eventForm) eventForm.reset();
            document.getElementById("eventId").value = "";
            document.getElementById("modalTitle").textContent = "Add New Event";
            document.getElementById("saveEventButton").textContent = "Save Event";
            document.getElementById("eventDate").value = selectedDate;
            document.getElementById("eventCategory").value = "Study";
            if (eventModal) eventModal.show();
        });
    }

    if (eventForm) {
        eventForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const id = document.getElementById("eventId").value;
            const title = document.getElementById("eventName").value.trim();
            const date = document.getElementById("eventDate").value;
            const time = document.getElementById("eventTime").value;
            const category = document.getElementById("eventCategory").value;
            const description = document.getElementById("eventDescription").value.trim();

            if (!title || !date || isNaN(parseDate(date).getTime())) {
                alert("Please enter a valid event name and date.");
                return;
            }

            const eventData = {
                id: id || Date.now().toString(),
                title,
                date,
                time,
                category,
                description,
                isAssignment: false
            };

            if (id) {
                const index = events.findIndex(event => event.id === id);
                if (index !== -1) {
                    events[index] = eventData;
                }
            } else {
                events.push(eventData);
            }

            saveEvents();
            events = loadEvents();
            selectedDate = date;
            const selectedDateObject = parseDate(date);
            currentYear = selectedDateObject.getFullYear();
            currentMonth = selectedDateObject.getMonth();

            if (eventModal) eventModal.hide();
            renderCalendar();
            renderSelectedEvents();
            updateUpcomingEvents();
        });
    }

    function editEvent(id) {
        const event = events.find(event => event.id === id);
        if (!event || event.isAssignment) return;

        document.getElementById("eventId").value = event.id;
        document.getElementById("eventName").value = event.title;
        document.getElementById("eventDate").value = event.date;
        document.getElementById("eventTime").value = event.time || "";
        document.getElementById("eventCategory").value = event.category;
        document.getElementById("eventDescription").value = event.description || "";

        document.getElementById("modalTitle").textContent = "Edit Event";
        document.getElementById("saveEventButton").textContent = "Update Event";
        if (eventModal) eventModal.show();
    }

    function deleteEvent(id) {
        const event = events.find(event => event.id === id);
        if (!event || event.isAssignment) return;

        const confirmation = window.confirm("Are you sure you want to delete this event?");
        if (!confirmation) return;

        events = events.filter(event => event.id !== id);
        saveEvents();
        events = loadEvents();
        renderCalendar();
        renderSelectedEvents();
        updateUpcomingEvents();
    }

    function updateUpcomingEvents() {
        const container = document.getElementById("upcomingList");
        if (!container) return;

        const todayString = formatDate(today);
        const upcoming = events
            .filter(event => event.date >= todayString)
            .sort((a, b) => {
                const dateComparison = a.date.localeCompare(b.date);
                if (dateComparison !== 0) return dateComparison;
                return (a.time || "").localeCompare(b.time || "");
            })
            .slice(0, 5);

        container.innerHTML = "";

        if (upcoming.length === 0) {
            container.innerHTML = `
                <div class="upcoming-empty">
                    No upcoming events. Enjoy your free time! ♡
                </div>
            `;
            return;
        }

        upcoming.forEach(function (event) {
            const date = parseDate(event.date);
            const day = date.getDate();
            const month = date.toLocaleDateString("en-GB", { month: "short" });

            const row = document.createElement("div");
            row.className = "upcoming-row";
            row.innerHTML = `
                <div class="upcoming-date">
                    <strong>${day}</strong>
                    <span>${month}</span>
                </div>
                <div class="upcoming-details">
                    <h6>${escapeHTML(event.title)}</h6>
                    <p>${escapeHTML(event.category)} ${event.time ? " · " + escapeHTML(event.time) : ""}</p>
                </div>
            `;
            container.appendChild(row);
        });
    }

    function updateSummary() {
        const todayString = formatDate(today);
        const upcomingCount = events.filter(event => event.date >= todayString).length;
        const todayCount = events.filter(event => event.date === todayString).length;

        const totalEventsEl = document.getElementById("totalEvents");
        const upcomingEventsEl = document.getElementById("upcomingEvents");
        const todayEventsEl = document.getElementById("todayEvents");

        if (totalEventsEl) totalEventsEl.textContent = events.length;
        if (upcomingEventsEl) upcomingEventsEl.textContent = upcomingCount;
        if (todayEventsEl) todayEventsEl.textContent = todayCount;
    }

    const prevMonthBtn = document.getElementById("previousMonth");
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener("click", function () {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar();
        });
    }

    const nextMonthBtn = document.getElementById("nextMonth");
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener("click", function () {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar();
        });
    }

    const todayButton = document.getElementById("todayButton");
    if (todayButton) {
        todayButton.addEventListener("click", function () {
            currentYear = today.getFullYear();
            currentMonth = today.getMonth();
            selectedDate = formatDate(today);
            renderCalendar();
            renderSelectedEvents();
        });
    }

    // Initial Display
    renderCalendar();
    renderSelectedEvents();
    updateUpcomingEvents();

});
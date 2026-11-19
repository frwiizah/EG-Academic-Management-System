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
    // STUDENT AUTHENTICATION
    // =====================================

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
    // ESCAPE HTML HELPER
    // =====================================

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


    // =====================================
    // LOGOUT WITH CONFIRMATION
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
    // STUDENT PROFILE DROPDOWN & MODAL
    // =====================================

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


    // =====================================
    // CHANGE PROFILE PICTURE
    // =====================================

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


    // =====================================
    // COURSE CATALOG & GRADE CALCULATION
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

    function getGrade(marks) {
        if (marks >= 80) return "A";
        if (marks >= 75) return "A-";
        if (marks >= 70) return "B+";
        if (marks >= 65) return "B";
        if (marks >= 60) return "B-";
        if (marks >= 55) return "C+";
        if (marks >= 50) return "C";
        return "F";
    }


    // =====================================
    // SYNCHRONIZED PERFORMANCE DATA LOADERS
    // =====================================

    const defaultActiveCoursesFallback = [
        { code: "IMS560", name: "Advanced Database Management System", marks: 85, grade: "A", progress: 80 },
        { code: "IMS565", name: "Information System Project Management", marks: 78, grade: "A-", progress: 65 },
        { code: "IMS566", name: "Advanced Web Design Development and Content Management", marks: 88, grade: "A", progress: 75 },
        { code: "IMS564", name: "User Experience Design", marks: 84, grade: "A", progress: 70 },
        { code: "CTU554", name: "Values and Civilization II", marks: 82, grade: "A", progress: 85 },
        { code: "LCC501", name: "English for Professional Correspondence", marks: 79, grade: "A-", progress: 70 },
        { code: "TGC451", name: "Introductory German (Level II)", marks: 76, grade: "A-", progress: 65 },
        { code: "ICM572", name: "Gamification for Content Management", marks: 86, grade: "A", progress: 75 }
    ];

    function loadSyncedCourses() {
        let storedCourses = [];
        try {
            const raw = safeLocalGet("egCourses", null);
            if (raw === null) {
                return defaultActiveCoursesFallback;
            }
            const parsed = JSON.parse(raw);
            storedCourses = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            storedCourses = [];
        }

        const activeOnly = storedCourses.filter(function (course) {
            return String(course && course.status ? course.status : "Active").toLowerCase() === "active";
        });

        if (activeOnly.length === 0) {
            return [];
        }

        let savedPerf = {};
        try {
            const rawPerf = safeLocalGet("egStudentPerformance_" + username, null);
            savedPerf = rawPerf ? JSON.parse(rawPerf) : {};
        } catch (e) {
            savedPerf = {};
        }

        const savedMarksMap = (savedPerf && savedPerf.courseMarks) || {};

        return activeOnly.map(function (c, idx) {
            const codeKey = String(c.code || "").trim().toUpperCase();
            const catalogCourse = COURSE_CATALOG[codeKey];
            const fallback = defaultActiveCoursesFallback[idx] || { marks: 80, progress: 75 };
            const progressVal = Math.min(100, Math.max(0, Number(c.progress ?? fallback.progress)));
            const marksVal = Number(savedMarksMap[c.code] ?? c.marks ?? fallback.marks);
            return {
                code: catalogCourse ? catalogCourse.code : (c.code || ("COURSE" + (idx + 1))),
                name: c.name || (catalogCourse ? catalogCourse.name : "Course"),
                marks: marksVal,
                grade: getGrade(marksVal),
                progress: progressVal
            };
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

    function loadSyncedAssignmentProgress() {
        let assignments = [];
        try {
            const rawAssign = safeLocalGet("egAssignments", null);
            assignments = rawAssign ? JSON.parse(rawAssign) : [];
        } catch (e) {
            assignments = [];
        }

        let submissions = {};
        try {
            const rawSub = safeLocalGet("egSubmissions_" + username, null);
            submissions = rawSub ? JSON.parse(rawSub) : {};
        } catch (e) {
            submissions = {};
        }

        if (!Array.isArray(assignments) || assignments.length === 0) {
            return { completed: 8, pending: 2, overdue: 0 };
        }

        let completedCount = 0;
        let pendingCount = 0;
        let overdueCount = 0;

        assignments.forEach(function (assignment) {
            if (!assignment) return;
            if (submissions && submissions[assignment.id]) {
                completedCount++;
            } else if (isAssignmentOverdue(assignment.dueDate)) {
                overdueCount++;
            } else {
                pendingCount++;
            }
        });

        return {
            completed: completedCount,
            pending: pendingCount,
            overdue: overdueCount
        };
    }

    const courses = loadSyncedCourses();
    const assignmentData = loadSyncedAssignmentProgress();

    const recentFeedback = [
        {
            title: "Advanced Database Management System - Chapter 4 Exercise",
            course: "IMS560",
            mark: "85/100",
            comment: "Good work! Your database queries and answers are well organized. Continue improving your explanation and examples.",
            date: "10 November 2026"
        },
        {
            title: "Information System Project Management - Group Assignment",
            course: "IMS565",
            mark: "78/100",
            comment: "Good teamwork and project planning. Some sections can be explained in more detail.",
            date: "7 November 2026"
        },
        {
            title: "Advanced Web Design Development and Content Management - Individual Project",
            course: "IMS566",
            mark: "88/100",
            comment: "Excellent layout structure and content management implementation. Keep up the good work!",
            date: "3 November 2026"
        }
    ];


    // =====================================
    // UPDATE & PERSIST PERFORMANCE SUMMARY
    // =====================================

    function updateSummary() {
        const totalMarks = courses.reduce(function (total, course) {
            return total + Number(course.marks || 0);
        }, 0);

        const average = courses.length > 0 ? Math.round(totalMarks / courses.length) : 0;
        const gradeText = courses.length > 0 ? getGrade(average) : "-";

        const overallGradeEl = document.getElementById("overallGrade");
        const averageMarksEl = document.getElementById("averageMarks");
        const totalCoursesEl = document.getElementById("totalCourses");
        const completedTasksEl = document.getElementById("completedTasks");

        if (overallGradeEl) overallGradeEl.textContent = gradeText;
        if (averageMarksEl) averageMarksEl.textContent = average + "%";
        if (totalCoursesEl) totalCoursesEl.textContent = courses.length;
        if (completedTasksEl) {
            const totalTasks = assignmentData.completed + assignmentData.pending + assignmentData.overdue;
            completedTasksEl.textContent = assignmentData.completed + "/" + totalTasks;
        }

        const courseMarksObj = {};
        courses.forEach(function (c) {
            courseMarksObj[c.code] = c.marks;
        });

        safeLocalSet(
            "egStudentPerformance_" + username,
            JSON.stringify({
                average: average,
                grade: gradeText,
                totalCourses: courses.length,
                completedTasks: assignmentData.completed,
                pendingTasks: assignmentData.pending,
                overdueTasks: assignmentData.overdue,
                courseMarks: courseMarksObj,
                updatedAt: new Date().toISOString()
            })
        );
    }


    // =====================================
    // DISPLAY COURSE RESULTS TABLE
    // =====================================

    function displayCourseResults() {
        const tableBody = document.getElementById("courseResultsBody");
        if (!tableBody) return;

        tableBody.innerHTML = "";

        if (courses.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">No active courses available.</td>
                </tr>
            `;
            return;
        }

        courses.forEach(function (course) {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>
                    <span class="course-code">
                        ${escapeHTML(course.code)}
                    </span>
                </td>

                <td>${escapeHTML(course.name)}</td>

                <td>${Number(course.marks)}%</td>

                <td>
                    <span class="grade-badge">
                        ${escapeHTML(course.grade)}
                    </span>
                </td>

                <td>
                    <div class="marks-progress">
                        <div class="progress">
                            <div
                                class="progress-bar"
                                role="progressbar"
                                style="width: ${Number(course.progress)}%"
                                aria-valuenow="${Number(course.progress)}"
                                aria-valuemin="0"
                                aria-valuemax="100">
                            </div>
                        </div>
                        <span>${Number(course.progress)}%</span>
                    </div>
                </td>
            `;

            tableBody.appendChild(row);
        });
    }


    // =====================================
    // DISPLAY RECENT FEEDBACK
    // =====================================

    function displayFeedback() {
        const feedbackList = document.getElementById("feedbackList");
        if (!feedbackList) return;

        feedbackList.innerHTML = "";

        recentFeedback.forEach(function (feedback) {
            const item = document.createElement("div");
            item.className = "feedback-item";

            item.innerHTML = `
                <div class="feedback-icon">
                    <i class="bi bi-chat-left-text"></i>
                </div>

                <div class="feedback-content">
                    <h6>${escapeHTML(feedback.title)}</h6>
                    <p>${escapeHTML(feedback.comment)}</p>
                    <small>
                        ${escapeHTML(feedback.course)} · ${escapeHTML(feedback.date)}
                    </small>
                </div>

                <div class="feedback-mark">
                    ${escapeHTML(feedback.mark)}
                </div>
            `;

            feedbackList.appendChild(item);
        });
    }


    // =====================================
    // CHARTS INITIALIZATION & THEME SYNC
    // =====================================

    let coursePerformanceChartInstance = null;
    let assignmentProgressChartInstance = null;

    function isDarkTheme() {
        return document.documentElement.getAttribute("data-theme") === "dark";
    }

    function renderCharts() {
        const dark = isDarkTheme();
        const tickYColor = dark ? "#aaa0b1" : "#a39aa7";
        const tickXColor = dark ? "#c0b6c7" : "#8f8592";
        const gridColor = dark ? "#403a49" : "#f1edf2";
        const pendingSliceColor = dark ? "#484151" : "#e9e2ed";
        const completedSliceColor = dark ? "#c79ab8" : "#b78ca9";
        const overdueSliceColor = dark ? "#e4a1b6" : "#df91a9";
        const palette = dark
            ? ["#c79ab8", "#b5a3d6", "#e2b29b", "#a799cc", "#d8a8c4", "#c3b2e0", "#e6bea8", "#b4a6d6"]
            : ["#c89bb8", "#b9a8d8", "#e5b8a1", "#a99bcf", "#d4a8c3", "#c4b4e0", "#ebc3ae", "#b5a7d6"];
        const barColors = courses.map(function (_, idx) {
            return palette[idx % palette.length];
        });

        const courseChart = document.getElementById("coursePerformanceChart");
        if (courseChart && typeof Chart !== "undefined") {
            if (coursePerformanceChartInstance) {
                coursePerformanceChartInstance.destroy();
            }

            coursePerformanceChartInstance = new Chart(courseChart, {
                type: "bar",
                data: {
                    labels: courses.map(function (course) {
                        return course.code;
                    }),
                    datasets: [
                        {
                            label: "Marks (%)",
                            data: courses.map(function (course) {
                                return course.marks;
                            }),
                            backgroundColor: barColors,
                            borderRadius: 8,
                            borderSkipped: false,
                            barThickness: 35
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: dark ? "#35313e" : "#554458",
                            padding: 12,
                            callbacks: {
                                label: function (context) {
                                    return "Marks: " + context.parsed.y + "%";
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                stepSize: 20,
                                font: {
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
                                    size: 10
                                },
                                color: tickXColor
                            },
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }

        const assignmentChart = document.getElementById("assignmentProgressChart");
        if (assignmentChart && typeof Chart !== "undefined") {
            if (assignmentProgressChartInstance) {
                assignmentProgressChartInstance.destroy();
            }

            assignmentProgressChartInstance = new Chart(assignmentChart, {
                type: "doughnut",
                data: {
                    labels: ["Completed", "Pending", "Overdue"],
                    datasets: [
                        {
                            data: [
                                assignmentData.completed,
                                assignmentData.pending,
                                assignmentData.overdue
                            ],
                            backgroundColor: [
                                completedSliceColor,
                                pendingSliceColor,
                                overdueSliceColor
                            ],
                            borderWidth: 0,
                            hoverOffset: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "72%",
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: dark ? "#35313e" : "#554458",
                            padding: 12
                        }
                    }
                }
            });
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

    let resizeTimer = null;
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            if (coursePerformanceChartInstance) {
                coursePerformanceChartInstance.resize();
            }
            if (assignmentProgressChartInstance) {
                assignmentProgressChartInstance.resize();
            }
        }, 150);
    });


    // =====================================
    // INITIAL RENDER
    // =====================================

    updateSummary();
    displayCourseResults();
    displayFeedback();
    renderCharts();

});
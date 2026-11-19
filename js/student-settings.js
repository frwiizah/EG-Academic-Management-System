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

    function safeSessionSet(key, value) {
        try {
            sessionStorage.setItem(key, String(value));
            return true;
        } catch (e) {
            return false;
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

    const isLoggedIn = safeSessionGet("isLoggedIn");
    const loggedInRole = safeSessionGet("loggedInRole");

    if (isLoggedIn !== "true" || loggedInRole !== "student") {
        window.location.replace("index.html");
        return;
    }

    const loggedInUsername =
        safeSessionGet("loggedInUsername", "") || "";

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
        return user &&
            String(user.username || "").toLowerCase() === loggedInUsername.toLowerCase() &&
            (!user.role || user.role === "student");
    });

    if (studentIndex === -1) {
        alert("Student account could not be found. Please log in again.");
        safeSessionClear();
        window.location.replace("index.html");
        return;
    }

    let student = users[studentIndex];

    // SHARED PROFILE PICTURE STORAGE KEY
    const profilePictureKey = "egStudentProfilePicture_" + student.username;
    const oldProfilePictureKey = "egProfilePicture_" + student.username;

    let profilePicture =
        safeLocalGet(profilePictureKey, "") ||
        student.profilePicture ||
        safeLocalGet(oldProfilePictureKey, "") ||
        "";

    if (profilePicture) {
        safeLocalSet(profilePictureKey, profilePicture);
    }


    // =====================================
    // STUDENT PROFILE DISPLAY
    // =====================================

    const fullNameInput = document.getElementById("fullName");
    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");
    const studentIdInput = document.getElementById("studentId");
    const phoneInput = document.getElementById("phone");
    const programInput = document.getElementById("program");

    const studentName = document.getElementById("studentName");
    const profileAvatar = document.getElementById("profileAvatar");
    const dropdownAvatar = document.getElementById("dropdownAvatar");
    const dropdownStudentName = document.getElementById("dropdownStudentName");
    const largeAvatar = document.getElementById("largeAvatar");
    const profileDisplayName = document.getElementById("profileDisplayName");

    function createAvatarContent(element, displayName) {
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

    function displayStudentProfile() {
        const displayName = student.fullName || student.name || "Student";

        if (studentName) studentName.textContent = displayName;
        if (profileDisplayName) profileDisplayName.textContent = displayName;

        if (dropdownStudentName) {
            dropdownStudentName.textContent = displayName;
        }

        createAvatarContent(profileAvatar, displayName);
        createAvatarContent(dropdownAvatar, displayName);
        createAvatarContent(largeAvatar, displayName);

        if (fullNameInput) fullNameInput.value = student.fullName || student.name || "";
        if (usernameInput) usernameInput.value = student.username || "";
        if (emailInput) emailInput.value = student.email || "";
        if (studentIdInput) studentIdInput.value = student.studentId || student.id || "";
        if (phoneInput) phoneInput.value = student.phone || student.phoneNumber || "";
        if (programInput) programInput.value = student.program || student.course || "";
    }

    displayStudentProfile();


    // =====================================
    // NOTIFICATION PREFERENCES & TOPBAR SYNC
    // =====================================

    const assignmentNotification =
        document.getElementById("assignmentNotification");
    const announcementNotification =
        document.getElementById("announcementNotification");
    const feedbackNotification =
        document.getElementById("feedbackNotification");
    const saveNotificationsButton =
        document.getElementById("saveNotifications");
    const notificationMessage =
        document.getElementById("notificationMessage");

    const preferenceKey = "egStudentPreferences_" + student.username;

    let savedPreferences = {
        assignments: true,
        announcements: true,
        feedback: true
    };

    try {
        const rawPrefs = safeLocalGet(preferenceKey, null);
        const parsedPrefs = rawPrefs ? JSON.parse(rawPrefs) : null;
        if (parsedPrefs && typeof parsedPrefs === "object") {
            savedPreferences = {
                assignments: parsedPrefs.assignments !== false,
                announcements: parsedPrefs.announcements !== false,
                feedback: parsedPrefs.feedback !== false
            };
        }
    } catch (error) {
        savedPreferences = {
            assignments: true,
            announcements: true,
            feedback: true
        };
    }

    if (assignmentNotification) assignmentNotification.checked = savedPreferences.assignments;
    if (announcementNotification) announcementNotification.checked = savedPreferences.announcements;
    if (feedbackNotification) feedbackNotification.checked = savedPreferences.feedback;


    // =====================================
    // TOPBAR NOTIFICATION SYSTEM
    // =====================================

    const notificationButton = document.getElementById("notificationButton");
    const notificationPanel = document.getElementById("notificationPanel");
    const topbarNotificationList = document.getElementById("topbarNotificationList");
    const notificationBadge = document.getElementById("notificationBadge");
    const notificationCount = document.getElementById("notificationCount");
    const notificationEmpty = document.getElementById("notificationEmpty");
    const markAllReadButton = document.getElementById("markAllRead");

    const notificationStorageKey = "egNotifications_" + student.username;

    const defaultNotifications = [
        {
            id: "notice001",
            title: "Assignment Reminder",
            message: "Your Individual Project for IMS566 is due on 15 November 2026.",
            type: "assignment",
            date: "14 November 2026",
            read: false
        },
        {
            id: "notice002",
            title: "Upcoming Assignment",
            message: "Your Group Assignment for IMS565 is due on 20 November 2026.",
            type: "assignment",
            date: "14 November 2026",
            read: false
        },
        {
            id: "notice003",
            title: "Exercise Reminder",
            message: "Remember to complete your Chapter 4 Exercise for IMS566 before 25 November 2026.",
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

    function isNotificationEnabledByPreference(type) {
        if (type === "assignment") return savedPreferences.assignments;
        if (type === "feedback") return savedPreferences.feedback;
        return savedPreferences.announcements;
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
        if (!topbarNotificationList) return;

        topbarNotificationList.innerHTML = "";

        const visibleEntries = notifications
            .map(function (item, index) {
                return { item: item, index: index };
            })
            .filter(function (entry) {
                return entry.item && isNotificationEnabledByPreference(entry.item.type);
            });

        const unreadNotifications = visibleEntries.filter(function (entry) {
            return !entry.item.read;
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

        if (visibleEntries.length === 0) {
            if (notificationEmpty) {
                notificationEmpty.hidden = false;
            }
            return;
        }

        if (notificationEmpty) {
            notificationEmpty.hidden = true;
        }

        visibleEntries.forEach(function (entry) {
            const item = entry.item;
            const actualIndex = entry.index;
            const iconData = getNotificationIcon(item.type);

            const notificationItem = document.createElement("div");
            notificationItem.className = "topbar-notification-item";

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
                notifications[actualIndex].read = true;
                saveNotifications();
                renderNotifications();
            });

            topbarNotificationList.appendChild(notificationItem);
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
                if (item && isNotificationEnabledByPreference(item.type)) {
                    item.read = true;
                }
            });
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

            if (notificationPanel) {
                notificationPanel.classList.remove("show");
            }
        });
    }

    const dropdownEditProfile = document.getElementById("dropdownEditProfile");
    if (dropdownEditProfile && profileDropdown) {
        dropdownEditProfile.addEventListener("click", function () {
            profileDropdown.classList.remove("show");
        });
    }

    const dropdownSettings = document.getElementById("dropdownSettings");
    if (dropdownSettings && profileDropdown) {
        dropdownSettings.addEventListener("click", function () {
            profileDropdown.classList.remove("show");
        });
    }


    // View Student Profile Modal

    const viewProfileButton = document.getElementById("viewProfileButton");
    const profileModal = document.getElementById("profileModal");
    const closeProfileModal = document.getElementById("closeProfileModal");
    const modalEditProfileBtn = document.getElementById("modalEditProfileBtn");

    function displayProfileDetails() {
        const displayName = student.fullName || student.name || "Student";

        const profileFields = {
            viewFullName: student.fullName || student.name || "-",
            viewUsername: student.username || "-",
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
            createAvatarContent(modalProfileAvatar, displayName);
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

    if (modalEditProfileBtn && profileModal) {
        modalEditProfileBtn.addEventListener("click", function () {
            profileModal.classList.remove("show");
            if (fullNameInput) fullNameInput.focus();
            const profileSection = document.getElementById("profileSection");
            if (profileSection) {
                profileSection.scrollIntoView({ behavior: "smooth" });
            }
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
    const sectionChangePictureBtn = document.getElementById("sectionChangePictureBtn");
    const profilePictureInput = document.getElementById("profilePictureInput");

    function triggerPictureUpload() {
        if (profileDropdown) {
            profileDropdown.classList.remove("show");
        }
        if (profilePictureInput) {
            profilePictureInput.click();
        }
    }

    if (changePictureButton) {
        changePictureButton.addEventListener("click", triggerPictureUpload);
    }

    if (sectionChangePictureBtn) {
        sectionChangePictureBtn.addEventListener("click", triggerPictureUpload);
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
                if (users[studentIndex]) {
                    users[studentIndex].profilePicture = profilePicture;
                    safeLocalSet("users", JSON.stringify(users));
                    student = users[studentIndex];
                }

                displayStudentProfile();
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
    // SAVE PROFILE INFORMATION
    // =====================================

    const profileForm = document.getElementById("profileForm");
    const profileMessage = document.getElementById("profileMessage");

    function showMessage(element, message, type) {
        if (!element) return;
        element.textContent = message;
        element.className = type ? ("form-message " + type) : "form-message";
    }

    if (profileForm) {
        profileForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const updatedName = fullNameInput ? fullNameInput.value.trim() : "";
            const updatedEmail = emailInput ? emailInput.value.trim() : "";

            if (!updatedName || !updatedEmail) {
                showMessage(
                    profileMessage,
                    "Please complete your name and email address.",
                    "error"
                );
                return;
            }

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(updatedEmail)) {
                showMessage(
                    profileMessage,
                    "Please enter a valid email address.",
                    "error"
                );
                return;
            }

            student.fullName = updatedName;
            student.email = updatedEmail;
            student.studentId = studentIdInput ? studentIdInput.value.trim() : "";
            student.phone = phoneInput ? phoneInput.value.trim() : "";
            student.program = programInput ? programInput.value.trim() : "";

            users[studentIndex] = student;
            if (!safeLocalSet("users", JSON.stringify(users))) {
                showMessage(
                    profileMessage,
                    "Unable to save profile changes in browser storage.",
                    "error"
                );
                return;
            }

            safeSessionSet("loggedInName", updatedName);

            displayStudentProfile();
            displayProfileDetails();

            showMessage(
                profileMessage,
                "Your profile has been updated successfully!",
                "success"
            );
        });
    }


    // =====================================
    // RESET PROFILE FORM
    // =====================================

    const resetProfileButton = document.getElementById("resetProfile");

    if (resetProfileButton) {
        resetProfileButton.addEventListener("click", function () {
            setTimeout(function () {
                displayStudentProfile();
                showMessage(profileMessage, "", "");
            }, 0);
        });
    }


    // =====================================
    // CHANGE PASSWORD FORM
    // =====================================

    const passwordForm = document.getElementById("passwordForm");
    const currentPasswordInput = document.getElementById("currentPassword");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const passwordMessage = document.getElementById("passwordMessage");

    if (passwordForm) {
        passwordForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const currentPassword = currentPasswordInput ? currentPasswordInput.value : "";
            const newPassword = newPasswordInput ? newPasswordInput.value : "";
            const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : "";

            if (currentPassword !== student.password) {
                showMessage(
                    passwordMessage,
                    "Your current password is incorrect.",
                    "error"
                );
                return;
            }

            if (newPassword.length < 6) {
                showMessage(
                    passwordMessage,
                    "Your new password must contain at least 6 characters.",
                    "error"
                );
                return;
            }

            if (newPassword !== confirmPassword) {
                showMessage(
                    passwordMessage,
                    "New password and confirmation do not match.",
                    "error"
                );
                return;
            }

            if (newPassword === currentPassword) {
                showMessage(
                    passwordMessage,
                    "Please choose a different password.",
                    "error"
                );
                return;
            }

            student.password = newPassword;
            users[studentIndex] = student;
            if (!safeLocalSet("users", JSON.stringify(users))) {
                showMessage(
                    passwordMessage,
                    "Unable to save password update in browser storage.",
                    "error"
                );
                return;
            }

            passwordForm.reset();

            showMessage(
                passwordMessage,
                "Your password has been changed successfully!",
                "success"
            );
        });
    }


    // =====================================
    // SAVE NOTIFICATION PREFERENCES
    // =====================================

    if (saveNotificationsButton) {
        saveNotificationsButton.addEventListener("click", function () {
            const preferences = {
                assignments: assignmentNotification ? assignmentNotification.checked : true,
                announcements: announcementNotification ? announcementNotification.checked : true,
                feedback: feedbackNotification ? feedbackNotification.checked : true
            };

            savedPreferences = preferences;
            safeLocalSet(preferenceKey, JSON.stringify(preferences));
            renderNotifications();

            showMessage(
                notificationMessage,
                "Your notification preferences have been saved!",
                "success"
            );
        });
    }


    // =====================================
    // SETTINGS SECTION NAVIGATION
    // =====================================

    const navigationLinks =
        document.querySelectorAll(".settings-nav-link");

    navigationLinks.forEach(function (link) {
        link.addEventListener("click", function () {
            navigationLinks.forEach(function (item) {
                item.classList.remove("active");
            });

            link.classList.add("active");
        });
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
    // LOG OUT WITH CONFIRMATION
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

});
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

    const lecturerUsername = safeSessionGet("loggedInUsername", "") || "";
    const lecturerName = safeSessionGet("loggedInName", "Lecturer") || "Lecturer";


    // ========================================
    // ELEMENTS & SAFE BOOTSTRAP MODALS
    // ========================================

    const tableBody = document.getElementById("studentsTableBody");
    const searchInput = document.getElementById("studentSearch");
    const statusFilter = document.getElementById("statusFilter");
    const emptyState = document.getElementById("emptyState");

    const studentForm = document.getElementById("studentForm");
    const studentModalElement = document.getElementById("studentModal");
    const viewModalElement = document.getElementById("viewStudentModal");

    const hasBootstrapModal = typeof bootstrap !== "undefined" && typeof bootstrap.Modal === "function";

    const studentModal = (hasBootstrapModal && studentModalElement)
        ? bootstrap.Modal.getOrCreateInstance(studentModalElement)
        : null;

    const viewStudentModal = (hasBootstrapModal && viewModalElement)
        ? bootstrap.Modal.getOrCreateInstance(viewModalElement)
        : null;

    const formMessage = document.getElementById("formMessage");


    // ========================================
    // LOCAL STORAGE
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


    // ========================================
    // LECTURER PROFILE & DROPDOWN SYNC
    // ========================================

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
        lecturerName ||
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
    // SYNC DEMO STUDENT ACCOUNT
    // ========================================

    function syncDemoStudent() {
        const users = getUsers();

        const existingStudent = users.find(user =>
            user &&
            String(user.username || "").toLowerCase() === "izaa" &&
            String(user.role || "").toLowerCase() === "student"
        );

        if (!existingStudent) {
            const demoStudent = {
                fullName: "Izaa",
                studentId: "",
                username: "izaa",
                email: "izaa@example.com",
                phone: "",
                program: "",
                password: "izaa1234",
                status: "active",
                role: "student"
            };

            users.push(demoStudent);
            saveUsers(users);
        }
    }

    syncDemoStudent();


    // ========================================
    // GET STUDENTS & SHARED PROFILE PICTURE
    // ========================================

    function getStudents() {
        return getUsers().filter(user =>
            user &&
            user.role &&
            String(user.role).toLowerCase() === "student"
        );
    }

    function getStudentAvatarSrc(student) {
        const username = student.username || "";
        const storedPic = username
            ? (safeLocalGet("egStudentProfilePicture_" + username, "") ||
               safeLocalGet("egProfilePicture_" + username, "") || "")
            : "";

        return storedPic || student.profilePicture || "";
    }


    // ========================================
    // HELPER FUNCTIONS
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

    function getInitials(name) {
        return String(name || "S")
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(word => word.charAt(0).toUpperCase())
            .join("");
    }

    function getStudentStatus(student) {
        return String(student.status || "active").toLowerCase() === "inactive"
            ? "inactive"
            : "active";
    }

    function showFormMessage(message, type) {
        if (!formMessage) return;
        formMessage.textContent = message;
        formMessage.className = type ? ("form-message " + type) : "form-message";
    }


    // ========================================
    // UPDATE SUMMARY CARDS
    // ========================================

    function updateSummary() {
        const students = getStudents();

        const activeCount = students.filter(student =>
            getStudentStatus(student) === "active"
        ).length;

        const inactiveCount = students.length - activeCount;

        const totalEl = document.getElementById("totalStudents");
        const activeEl = document.getElementById("activeStudents");
        const inactiveEl = document.getElementById("inactiveStudents");

        if (totalEl) totalEl.textContent = String(students.length);
        if (activeEl) activeEl.textContent = String(activeCount);
        if (inactiveEl) inactiveEl.textContent = String(inactiveCount);
    }


    // ========================================
    // DISPLAY STUDENTS
    // ========================================

    function renderStudents() {
        const students = getStudents();

        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";
        const selectedStatus = statusFilter ? statusFilter.value : "all";

        const filteredStudents = students.filter(student => {
            const name = String(student.fullName || student.name || "").toLowerCase();
            const studentId = String(student.studentId || "").toLowerCase();
            const username = String(student.username || "").toLowerCase();
            const email = String(student.email || "").toLowerCase();
            const program = String(student.program || student.course || "").toLowerCase();

            const matchesSearch =
                name.includes(searchTerm) ||
                studentId.includes(searchTerm) ||
                username.includes(searchTerm) ||
                email.includes(searchTerm) ||
                program.includes(searchTerm);

            const matchesStatus =
                selectedStatus === "all" ||
                getStudentStatus(student) === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        if (!tableBody) return;
        tableBody.innerHTML = "";

        filteredStudents.forEach(student => {
            const name = student.fullName || student.name || "Unnamed Student";
            const username = student.username || "";
            const studentId = student.studentId || "Not provided";
            const program = student.program || student.course || "Not provided";
            const status = getStudentStatus(student);
            const avatarSrc = getStudentAvatarSrc(student);

            const avatarContent = avatarSrc
                ? `<img src="${escapeHTML(avatarSrc)}" alt="${escapeHTML(name)}">`
                : escapeHTML(getInitials(name));

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>
                    <div class="student-name">
                        <div class="student-avatar">
                            ${avatarContent}
                        </div>

                        <div>
                            <strong>${escapeHTML(name)}</strong>
                            <small>${escapeHTML(student.email || "No email")}</small>
                        </div>
                    </div>
                </td>

                <td>${escapeHTML(studentId)}</td>

                <td>${escapeHTML(username)}</td>

                <td>${escapeHTML(program)}</td>

                <td>
                    <span class="student-status ${status}">
                        ${status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                </td>

                <td>
                    <div class="action-buttons">

                        <button type="button" class="action-btn view-btn"
                            data-action="view"
                            data-username="${escapeHTML(username)}"
                            title="View Student">
                            <i class="bi bi-eye"></i>
                        </button>

                        <button type="button" class="action-btn edit-btn"
                            data-action="edit"
                            data-username="${escapeHTML(username)}"
                            title="Edit Student">
                            <i class="bi bi-pencil"></i>
                        </button>

                        <button type="button" class="action-btn delete-btn"
                            data-action="delete"
                            data-username="${escapeHTML(username)}"
                            title="Delete Student">
                            <i class="bi bi-trash"></i>
                        </button>

                    </div>
                </td>
            `;

            tableBody.appendChild(row);
        });

        if (emptyState) {
            emptyState.hidden = filteredStudents.length !== 0;
        }

        updateSummary();
    }


    // ========================================
    // RESET FORM
    // ========================================

    function resetForm() {
        if (!studentForm) return;
        studentForm.reset();

        const editUsernameEl = document.getElementById("editUsername");
        const usernameField = document.getElementById("studentUsername");
        const passwordGroup = document.getElementById("passwordGroup");
        const passwordField = document.getElementById("studentPassword");
        const modalTitleEl = document.getElementById("modalTitle");
        const saveBtnEl = document.getElementById("saveStudentButton");

        if (editUsernameEl) editUsernameEl.value = "";
        if (usernameField) usernameField.readOnly = false;
        if (passwordGroup) passwordGroup.hidden = false;
        if (passwordField) {
            passwordField.required = true;
            passwordField.placeholder = "Create student password";
        }
        if (modalTitleEl) modalTitleEl.textContent = "Add New Student";
        if (saveBtnEl) saveBtnEl.textContent = "Save Student";

        showFormMessage("", "");
    }


    // ========================================
    // ADD STUDENT BUTTON
    // ========================================

    const addStudentButton = document.getElementById("addStudentButton");
    if (addStudentButton) {
        addStudentButton.addEventListener("click", function () {
            resetForm();
            const modalTitleEl = document.getElementById("modalTitle");
            if (modalTitleEl) modalTitleEl.textContent = "Add New Student";
        });
    }


    // ========================================
    // ADD OR UPDATE STUDENT
    // ========================================

    if (studentForm) {
        studentForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const users = getUsers();

            const editUsernameEl = document.getElementById("editUsername");
            const fullNameEl = document.getElementById("studentFullName");
            const studentIdEl = document.getElementById("studentId");
            const usernameEl = document.getElementById("studentUsername");
            const emailEl = document.getElementById("studentEmail");
            const phoneEl = document.getElementById("studentPhone");
            const programEl = document.getElementById("studentProgram");
            const passwordEl = document.getElementById("studentPassword");
            const statusEl = document.getElementById("studentStatus");

            const editUsername = editUsernameEl ? editUsernameEl.value : "";
            const fullName = fullNameEl ? fullNameEl.value.trim() : "";
            const studentId = studentIdEl ? studentIdEl.value.trim() : "";
            const username = usernameEl ? usernameEl.value.trim() : "";
            const email = emailEl ? emailEl.value.trim() : "";
            const phone = phoneEl ? phoneEl.value.trim() : "";
            const program = programEl ? programEl.value.trim() : "";
            const password = passwordEl ? passwordEl.value : "";
            const status = statusEl ? statusEl.value : "active";

            if (!fullName || !studentId || !username || !email) {
                showFormMessage("Please complete all required fields.", "error");
                return;
            }

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                showFormMessage("Please enter a valid email address.", "error");
                return;
            }

            const editing = editUsername !== "";

            if (!editing && !password) {
                showFormMessage("Please create a password for the student.", "error");
                return;
            }

            const duplicate = users.some(user => {
                if (!user) return false;
                if (editing && user.username === editUsername) {
                    return false;
                }

                return (
                    String(user.username || "").toLowerCase() === username.toLowerCase() ||
                    String(user.email || "").toLowerCase() === email.toLowerCase() ||
                    (
                        studentId &&
                        String(user.studentId || "").toLowerCase() === studentId.toLowerCase()
                    )
                );
            });

            if (duplicate) {
                showFormMessage("Username, email or student ID already exists.", "error");
                return;
            }

            if (editing) {
                const userIndex = users.findIndex(user =>
                    user &&
                    user.username === editUsername &&
                    user.role &&
                    String(user.role).toLowerCase() === "student"
                );

                if (userIndex === -1) {
                    showFormMessage("Student record could not be found.", "error");
                    return;
                }

                users[userIndex] = {
                    ...users[userIndex],
                    fullName,
                    studentId,
                    email,
                    phone,
                    program,
                    status
                };

                if (password) {
                    users[userIndex].password = password;
                }
            } else {
                const newStudent = {
                    fullName,
                    studentId,
                    username,
                    email,
                    phone,
                    program,
                    password,
                    status,
                    role: "student"
                };

                users.push(newStudent);
            }

            if (!saveUsers(users)) {
                showFormMessage("Could not save changes due to browser storage limits.", "error");
                return;
            }

            if (studentModal) {
                studentModal.hide();
            }
            renderStudents();

            alert(editing
                ? "Student information updated successfully!"
                : "New student added successfully!"
            );
        });
    }


    // ========================================
    // VIEW, EDIT AND DELETE STUDENT
    // ========================================

    if (tableBody) {
        tableBody.addEventListener("click", function (event) {
            const button = event.target.closest("button[data-action]");
            if (!button) return;

            const action = button.dataset.action;
            const username = button.dataset.username;

            const student = getStudents().find(user =>
                user.username === username
            );

            if (!student) return;

            if (action === "view") {
                const name = student.fullName || student.name || "Unnamed Student";
                const detailsEl = document.getElementById("studentDetails");

                if (detailsEl) {
                    detailsEl.innerHTML = `
                        <div class="detail-row">
                            <small>Full Name</small>
                            <strong>${escapeHTML(name)}</strong>
                        </div>

                        <div class="detail-row">
                            <small>Student ID</small>
                            <strong>${escapeHTML(student.studentId || "Not provided")}</strong>
                        </div>

                        <div class="detail-row">
                            <small>Username</small>
                            <strong>${escapeHTML(student.username)}</strong>
                        </div>

                        <div class="detail-row">
                            <small>Email Address</small>
                            <strong>${escapeHTML(student.email || "Not provided")}</strong>
                        </div>

                        <div class="detail-row">
                            <small>Phone Number</small>
                            <strong>${escapeHTML(student.phone || "Not provided")}</strong>
                        </div>

                        <div class="detail-row">
                            <small>Programme</small>
                            <strong>${escapeHTML(student.program || student.course || "Not provided")}</strong>
                        </div>

                        <div class="detail-row">
                            <small>Account Status</small>
                            <strong>${getStudentStatus(student).toUpperCase()}</strong>
                        </div>
                    `;
                }

                if (viewStudentModal) {
                    viewStudentModal.show();
                }
            }

            if (action === "edit") {
                resetForm();

                const modalTitleEl = document.getElementById("modalTitle");
                const saveBtnEl = document.getElementById("saveStudentButton");
                const editUsernameEl = document.getElementById("editUsername");
                const fullNameEl = document.getElementById("studentFullName");
                const studentIdEl = document.getElementById("studentId");
                const usernameEl = document.getElementById("studentUsername");
                const emailEl = document.getElementById("studentEmail");
                const phoneEl = document.getElementById("studentPhone");
                const programEl = document.getElementById("studentProgram");
                const statusEl = document.getElementById("studentStatus");
                const passwordGroupEl = document.getElementById("passwordGroup");
                const passwordEl = document.getElementById("studentPassword");

                if (modalTitleEl) modalTitleEl.textContent = "Edit Student";
                if (saveBtnEl) saveBtnEl.textContent = "Update Student";
                if (editUsernameEl) editUsernameEl.value = student.username;
                if (fullNameEl) fullNameEl.value = student.fullName || student.name || "";
                if (studentIdEl) studentIdEl.value = student.studentId || "";
                if (usernameEl) {
                    usernameEl.value = student.username || "";
                    usernameEl.readOnly = true;
                }
                if (emailEl) emailEl.value = student.email || "";
                if (phoneEl) phoneEl.value = student.phone || "";
                if (programEl) programEl.value = student.program || student.course || "";
                if (statusEl) statusEl.value = getStudentStatus(student);
                if (passwordGroupEl) passwordGroupEl.hidden = false;
                if (passwordEl) {
                    passwordEl.required = false;
                    passwordEl.value = "";
                    passwordEl.placeholder = "Leave blank to keep current password";
                }

                if (studentModal) {
                    studentModal.show();
                }
            }

            if (action === "delete") {
                const confirmDelete = window.confirm(
                    "Are you sure you want to delete " +
                    (student.fullName || student.username) +
                    "?"
                );

                if (!confirmDelete) return;

                const updatedUsers = getUsers().filter(user =>
                    !(
                        user &&
                        user.username === username &&
                        user.role &&
                        String(user.role).toLowerCase() === "student"
                    )
                );

                saveUsers(updatedUsers);
                renderStudents();

                alert("Student record deleted successfully!");
            }
        });
    }


    // ========================================
    // SEARCH AND FILTER
    // ========================================

    if (searchInput) {
        searchInput.addEventListener("input", renderStudents);
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", renderStudents);
    }


    // ========================================
    // CLEAR FORM WHEN MODAL CLOSES
    // ========================================

    if (studentModalElement) {
        studentModalElement.addEventListener("hidden.bs.modal", resetForm);
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
    // INITIAL DISPLAY
    // ========================================

    renderStudents();

});
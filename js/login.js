// ==========================================
// DEMO ACCOUNTS
// ==========================================

const validUsername = "lecturer";
const validPassword = "lecturer123";

const demoStudent = {
    fullName: "Izaa",
    username: "izaa",
    password: "izaa1234",
    email: "izaa@example.com",
    role: "student"
};


// ==========================================
// GET HTML ELEMENTS
// ==========================================

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const forgotForm = document.getElementById("forgotForm");

const loginView = document.getElementById("loginView");
const registerView = document.getElementById("registerView");
const forgotView = document.getElementById("forgotView");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const errorMessage = document.getElementById("errorMessage");
const registerMessage = document.getElementById("registerMessage");
const forgotMessage = document.getElementById("forgotMessage");

const togglePassword = document.getElementById("togglePassword");
const togglePasswordIcon = document.getElementById("togglePasswordIcon");
const toggleRegPassword = document.getElementById("toggleRegPassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
const toggleNewPassword = document.getElementById("toggleNewPassword");
const toggleConfirmNewPassword = document.getElementById("toggleConfirmNewPassword");

const showRegister = document.getElementById("showRegister");
const showForgot = document.getElementById("showForgot");
const showLoginFromReg = document.getElementById("showLoginFromReg");
const showLoginFromForgot = document.getElementById("showLoginFromForgot");

const lecturerRole = document.getElementById("lecturerRole");
const studentRole = document.getElementById("studentRole");


// ==========================================
// STORAGE HELPERS
// ==========================================

function getRegisteredUsers() {
    return JSON.parse(localStorage.getItem("users")) || [];
}

function getDemoStudentPassword() {
    return localStorage.getItem("demoStudentPassword") || demoStudent.password;
}


// ==========================================
// VIEW SWITCHER HELPER
// ==========================================

function switchView(targetView) {
    loginView.style.display = "none";
    registerView.style.display = "none";
    forgotView.style.display = "none";

    errorMessage.style.display = "none";
    registerMessage.style.display = "none";
    forgotMessage.style.display = "none";
    forgotMessage.classList.remove("success-message");

    targetView.style.display = "flex";
}


// ==========================================
// AUTOMATICALLY FILL LOGIN CREDENTIALS
// ==========================================

function updateLoginCredentials(role) {
    errorMessage.style.display = "none";

    if (role === "lecturer") {
        usernameInput.value = validUsername;
        passwordInput.value = validPassword;
    } else if (role === "student") {
        usernameInput.value = demoStudent.username;
        passwordInput.value = getDemoStudentPassword();
    }
}

lecturerRole.addEventListener("change", function () {
    if (lecturerRole.checked) updateLoginCredentials("lecturer");
});

studentRole.addEventListener("change", function () {
    if (studentRole.checked) updateLoginCredentials("student");
});

if (lecturerRole.checked) {
    updateLoginCredentials("lecturer");
} else if (studentRole.checked) {
    updateLoginCredentials("student");
}


// ==========================================
// PASSWORD VISIBILITY TOGGLES
// ==========================================

togglePassword.addEventListener("click", function () {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        togglePasswordIcon.classList.replace("bi-eye-slash", "bi-eye");
    } else {
        passwordInput.type = "password";
        togglePasswordIcon.classList.replace("bi-eye", "bi-eye-slash");
    }
});

function bindTextToggle(buttonEl, inputId) {
    buttonEl.addEventListener("click", function () {
        const inputEl = document.getElementById(inputId);
        if (inputEl.type === "password") {
            inputEl.type = "text";
            buttonEl.textContent = "Hide";
        } else {
            inputEl.type = "password";
            buttonEl.textContent = "Show";
        }
    });
}

bindTextToggle(toggleRegPassword, "regPassword");
bindTextToggle(toggleConfirmPassword, "confirmPassword");
bindTextToggle(toggleNewPassword, "newPassword");
bindTextToggle(toggleConfirmNewPassword, "confirmNewPassword");


// ==========================================
// NAVIGATION BETWEEN VIEWS
// ==========================================

showRegister.addEventListener("click", function () {
    switchView(registerView);
});

showForgot.addEventListener("click", function () {
    forgotForm.reset();
    switchView(forgotView);
});

showLoginFromReg.addEventListener("click", function () {
    switchView(loginView);
    updateLoginCredentials(studentRole.checked ? "student" : "lecturer");
});

showLoginFromForgot.addEventListener("click", function () {
    switchView(loginView);
    updateLoginCredentials(studentRole.checked ? "student" : "lecturer");
});


// ==========================================
// REGISTRATION VALIDATION
// ==========================================

registerForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const username = document.getElementById("regUsername").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    const users = getRegisteredUsers();

    const usernameExists = users.some(
        user => user.username.toLowerCase() === username.toLowerCase()
    );

    if (
        username.toLowerCase() === validUsername ||
        username.toLowerCase() === demoStudent.username ||
        usernameExists
    ) {
        showRegisterError("Username already exists. Please choose another username.");
        return;
    }

    const emailExists = users.some(
        user => user.email.toLowerCase() === email.toLowerCase()
    );

    if (email.toLowerCase() === demoStudent.email || emailExists) {
        showRegisterError("Email already registered. Please use another email.");
        return;
    }

    if (password.length < 6) {
        showRegisterError("Password must contain at least 6 characters.");
        return;
    }

    if (password !== confirmPassword) {
        showRegisterError("Passwords do not match. Please try again.");
        return;
    }

    users.push({
        fullName: fullName,
        username: username,
        email: email,
        password: password,
        role: "student"
    });

    localStorage.setItem("users", JSON.stringify(users));

    alert("Registration successful! You can now sign in.");
    registerForm.reset();

    switchView(loginView);
    studentRole.checked = true;
    usernameInput.value = username;
    passwordInput.value = password;
});

function showRegisterError(message) {
    registerMessage.textContent = message;
    registerMessage.style.display = "block";
}


// ==========================================
// FORGOT PASSWORD VALIDATION & RESET
// ==========================================

forgotForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const identifier = document.getElementById("forgotIdentifier").value.trim().toLowerCase();
    const newPassword = document.getElementById("newPassword").value;
    const confirmNewPassword = document.getElementById("confirmNewPassword").value;

    forgotMessage.classList.remove("success-message");

    // Prevent resetting hardcoded lecturer demo account
    if (identifier === validUsername) {
        showForgotMessage("Lecturer demo password cannot be changed here. Contact admin.", false);
        return;
    }

    if (newPassword.length < 6) {
        showForgotMessage("New password must contain at least 6 characters.", false);
        return;
    }

    if (newPassword !== confirmNewPassword) {
        showForgotMessage("New passwords do not match. Please try again.", false);
        return;
    }

    // Check demo student account ("izaa" or "izaa@example.com")
    if (
        identifier === demoStudent.username.toLowerCase() ||
        identifier === demoStudent.email.toLowerCase()
    ) {
        localStorage.setItem("demoStudentPassword", newPassword);
        showForgotMessage("Password reset successful! Redirecting to sign in...", true);

        setTimeout(() => {
            forgotForm.reset();
            switchView(loginView);
            studentRole.checked = true;
            usernameInput.value = demoStudent.username;
            passwordInput.value = newPassword;
        }, 1200);
        return;
    }

    // Check registered student accounts in localStorage
    const users = getRegisteredUsers();
    const userIndex = users.findIndex(
        user =>
            user.username.toLowerCase() === identifier ||
            user.email.toLowerCase() === identifier
    );

    if (userIndex === -1) {
        showForgotMessage("No student account found with that username or email.", false);
        return;
    }

    users[userIndex].password = newPassword;
    localStorage.setItem("users", JSON.stringify(users));

    const resetUsername = users[userIndex].username;
    showForgotMessage("Password reset successful! Redirecting to sign in...", true);

    setTimeout(() => {
        forgotForm.reset();
        switchView(loginView);
        studentRole.checked = true;
        usernameInput.value = resetUsername;
        passwordInput.value = newPassword;
    }, 1200);
});

function showForgotMessage(message, isSuccess) {
    forgotMessage.textContent = message;
    if (isSuccess) {
        forgotMessage.classList.add("success-message");
    } else {
        forgotMessage.classList.remove("success-message");
    }
    forgotMessage.style.display = "block";
}


// ==========================================
// LOGIN VALIDATION
// ==========================================

loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const selectedRole = document.querySelector('input[name="loginRole"]:checked');

    errorMessage.style.display = "none";

    if (!selectedRole) {
        errorMessage.textContent = "Please select your account type.";
        errorMessage.style.display = "block";
        return;
    }

    const role = selectedRole.value;
    const users = getRegisteredUsers();

    // LECTURER LOGIN
    if (role === "lecturer") {
        if (username.toLowerCase() === validUsername && password === validPassword) {
            sessionStorage.setItem("isLoggedIn", "true");
            sessionStorage.setItem("loggedInRole", "lecturer");
            sessionStorage.setItem("loggedInName", "Lecturer");
            sessionStorage.setItem("loggedInUsername", username);

            window.location.href = "dashboard.html";
            return;
        }
    }

    // STUDENT LOGIN
    if (role === "student") {
        if (
            username.toLowerCase() === demoStudent.username &&
            password === getDemoStudentPassword()
        ) {
            sessionStorage.setItem("isLoggedIn", "true");
            sessionStorage.setItem("loggedInRole", "student");
            sessionStorage.setItem("loggedInName", demoStudent.fullName);
            sessionStorage.setItem("loggedInUsername", demoStudent.username);

            window.location.href = "student-dashboard.html";
            return;
        }

        const registeredUser = users.find(
            user =>
                user.username.toLowerCase() === username.toLowerCase() &&
                user.password === password &&
                (!user.role || user.role === "student")
        );

        if (registeredUser) {
            sessionStorage.setItem("isLoggedIn", "true");
            sessionStorage.setItem("loggedInRole", "student");
            sessionStorage.setItem("loggedInName", registeredUser.fullName);
            sessionStorage.setItem("loggedInUsername", registeredUser.username);

            window.location.href = "student-dashboard.html";
            return;
        }
    }

    errorMessage.textContent = "Invalid username, password or account type. Please try again.";
    errorMessage.style.display = "block";
});
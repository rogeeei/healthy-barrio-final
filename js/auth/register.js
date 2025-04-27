import {
  backendURL,
  successNotification,
  errorNotification,
} from "../utils/utils.js";

// Form Register
const form_register = document.getElementById("form_register");

form_register.onsubmit = async (e) => {
  e.preventDefault();

  // Disable Submit Button
  const submitButton = document.querySelector("#form_register button");
  submitButton.disabled = true;
  submitButton.innerHTML = `<div class="spinner-border me-2" role="status"></div>`;

  // Prepare FormData
  const formData = new FormData(form_register);

  try {
    // Fetch API - User Registration
    const response = await fetch(`${backendURL}/api/user`, {
      credentials: "include",
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });

    const json = await response.json(); // Parse response JSON

    if (response.ok) {
      successNotification("Successfully registered account.", 5);
      form_register.reset();

      // Redirect to login page after successful registration
      setTimeout(() => {
        window.location.href = "/login.html";
      }, 2000);
    } else if (response.status === 422) {
      errorNotification("Validation errors:", json.errors);
      errorNotification(json.message || "Validation error occurred.", 100);
    } else {
      errorNotification("Unexpected error:", json);
      errorNotification("An unexpected error occurred. Please try again.", 20);
    }
  } catch (error) {
    errorNotification("Fetch error:", error);
    errorNotification("Network error: " + error.message, 20);
  } finally {
    // Re-enable Submit Button
    submitButton.disabled = false;
    submitButton.innerHTML = `Send Request`;
  }
};

import {
  backendURL,
  showNavAdminPages,
  successNotification,
  errorNotification,
  logout,
} from "../utils/utils.js";

document.addEventListener("DOMContentLoaded", () => {
  showNavAdminPages();

  // Get user role from localStorage
  const userRole = localStorage.getItem("role");

  //  Hide the add buttons if the user is a super admin
  if (userRole === "super_admin") {
    document.querySelectorAll(".add-btn").forEach((button) => {
      button.style.display = "none"; // Hide all add buttons
    });
  }

  //  Attach event listeners ONLY if the form exists
  const medicineForm = document.getElementById("form_medicine");
  if (medicineForm) {
    medicineForm.addEventListener("submit", handleMedicineSubmit);
  }

  const equipmentForm = document.getElementById("form_equipment");
  if (equipmentForm) {
    equipmentForm.addEventListener("submit", handleEquipmentSubmit);
  }
});

//  Logout Button
const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", logout);
}

/**  Handle Add/Edit Medicine */
async function handleMedicineSubmit(event) {
  event.preventDefault();
  const submitButton = document.querySelector(
    "#form_medicine button[type='submit']"
  );
  submitButton.disabled = true;
  submitButton.innerHTML = `<div class="spinner-border me-2" role="status"></div><span>Saving...</span>`;

  const formData = new FormData(event.target);
  const medicineId = document.getElementById("medicine_id").value.trim();
  const url = medicineId
    ? `${backendURL}/api/medicine/${medicineId}`
    : `${backendURL}/api/medicine`;
  const method = medicineId ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        ...(method === "PUT" && { "Content-Type": "application/json" }),
      },
      body:
        method === "PUT"
          ? JSON.stringify(Object.fromEntries(formData))
          : formData,
    });

    if (response.ok) {
      successNotification(
        `Medicine ${medicineId ? "updated" : "added"} successfully.`,
        5
      );
      document.getElementById("form_medicine").reset();
      bootstrap.Modal.getInstance(
        document.getElementById("medicine_modal")
      )?.hide();
      await getMedicine();
    } else {
      throw new Error("Failed to save medicine.");
    }
  } catch (error) {
    console.error("Error:", error.message);
    errorNotification("An error occurred: " + error.message, 5);
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = `Save`;
  }
}

/**  Handle Add/Edit Equipment */
async function handleEquipmentSubmit(event) {
  event.preventDefault();
  const submitButton = document.querySelector(
    "#form_equipment button[type='submit']"
  );
  submitButton.disabled = true;
  submitButton.innerHTML = `<div class="spinner-border me-2" role="status"></div><span>Saving...</span>`;

  const formData = new FormData(event.target);
  const equipmentId = document.getElementById("equipment_id").value.trim();
  const url = equipmentId
    ? `${backendURL}/api/equipment/${equipmentId}`
    : `${backendURL}/api/equipment`;
  const method = equipmentId ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        ...(method === "PUT" && { "Content-Type": "application/json" }),
      },
      body:
        method === "PUT"
          ? JSON.stringify(Object.fromEntries(formData))
          : formData,
    });

    if (response.ok) {
      successNotification(
        `Equipment ${equipmentId ? "updated" : "added"} successfully.`,
        5
      );
      document.getElementById("form_equipment").reset();
      bootstrap.Modal.getInstance(
        document.getElementById("equipment_modal")
      )?.hide();
      await getEquipment();
    } else {
      throw new Error("Failed to save equipment.");
    }
  } catch (error) {
    console.error("Error:", error.message);
    errorNotification("An error occurred: " + error.message, 5);
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = `Save`;
  }
}

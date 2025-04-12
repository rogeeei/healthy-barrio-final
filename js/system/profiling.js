import {
  backendURL,
  showNavAdminPages,
  successNotification,
  errorNotification,
  logout
} from "../utils/utils.js";

showNavAdminPages();

// Logout Button
const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", logout);
}

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const citizenId = urlParams.get("citizen_id");

  if (citizenId) {
    fetchCitizenDetails(citizenId);
    fetchTransactionHistory(citizenId);
  } else {
    errorNotification("Citizen ID is missing.");
  }

  // Event listener for month selection
  const monthDropdownItems = document.querySelectorAll(".dropdown-item");
  monthDropdownItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      const selectedMonth = event.target.getAttribute("data-month");
      document.getElementById("monthDropdown").textContent =
        event.target.textContent; // Update dropdown text
      fetchTransactionHistory(citizenId, selectedMonth);
    });
  });
});

// Fetching Citizen Details
async function fetchCitizenDetails(citizen_id) {
  try {
    const response = await fetch(`${backendURL}/api/citizen/${citizen_id}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      const citizen = await response.json();

      if (!citizen || !citizen.citizen_id) {
        errorNotification("Citizen not found");
        return;
      }

      document.getElementById("citizen_id").value = citizen.citizen_id;
      populateCitizenDetails(citizen);
    } else {
      errorNotification(`HTTP-Error: ${response.status}`);
    }
  } catch (error) {
    errorNotification(`An error occurred: ${error.message}`);
  }
}

// Populate Citizen Details
function populateCitizenDetails(citizen) {
  const servicesAvailed =
    citizen.services_availed && citizen.services_availed.length > 0
      ? citizen.services_availed.map((service) => `<p>${service}</p>`).join("")
      : "<p class='no-services'>No services availed</p>";

  document.getElementById("citizen_id").innerText = citizen.citizen_id || "N/A";

  document.getElementById("lastname").innerText = `${citizen.firstname || ""} ${
    citizen.middle_name &&
    !["N/A", "None", "Not Available", "n/a", "not avail", "none"].includes(
      citizen.middle_name
    )
      ? citizen.middle_name
      : ""
  } ${citizen.lastname || ""} ${
    citizen.suffix &&
    !["N/A", "None", "Not Available", "n/a", "not avail", "none"].includes(
      citizen.suffix
    )
      ? citizen.suffix
      : ""
  }`.trim();

  document.getElementById("citizenBirthdate").innerText =
    citizen.date_of_birth || "N/A";
  document.getElementById("gender").innerText =
    citizen.gender || "Not specified";
  document.getElementById("purok").innerText = citizen.purok || "N/A";
  document.getElementById("barangay").innerText = citizen.barangay || "N/A";
  document.getElementById("blood_type").innerText = citizen.blood_type || "N/A";
  document.getElementById("allergies").innerText = citizen.allergies || "None";
  document.getElementById("weight").innerText = citizen.weight
    ? `${citizen.weight} kg`
    : "N/A";
  document.getElementById("height").innerText = citizen.height
    ? `${citizen.height} cm`
    : "N/A";
  document.getElementById("medication").innerText =
    citizen.medication || "None";
  document.getElementById("emergency_contact_name").innerText =
    citizen.emergency_contact_name || "N/A";
  document.getElementById("emergency_contact_number").innerText =
    citizen.emergency_contact_no || "N/A";
}

const transactionHistoryBody = document.getElementById(
  "transactionHistoryBody"
);

async function fetchTransactionHistory(citizenId, month = null) {
  try {
    let url = `${backendURL}/api/show/transaction/${citizenId}`;
    if (month) {
      url += `?month=${month}`;
    }

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      const data = await response.json();

      transactionHistoryBody.innerHTML = "";

      if (!data.transactions || data.transactions.length === 0) {
        transactionHistoryBody.innerHTML = `
          <tr><td colspan="5" class="text-center">No transactions found for this month.</td></tr>
        `;
        return;
      }

      data.transactions.forEach((transaction) => {
        let medicineDetails = "N/A";
        if (
          transaction.medicines_availed &&
          transaction.medicines_availed.length > 0
        ) {
          medicineDetails = transaction.medicines_availed
            .map(
              (med) =>
                `${med.name} (${med.quantity} ${med.unit ? med.unit : ""})`
            )
            .join(", ");
        }

        let serviceDetails = transaction.service_availed || "N/A";
        if (
          serviceDetails.toLowerCase().includes("bp") ||
          serviceDetails.toLowerCase().includes("blood pressure")
        ) {
          serviceDetails += ` - ${transaction.blood_pressure || "N/A"}`;
        }

        const row = document.createElement("tr");
        row.innerHTML = `
    <td>${transaction.transaction_date}</td>
    <td>${serviceDetails}</td>
    <td>${medicineDetails}</td>
  `;

        transactionHistoryBody.appendChild(row);
      });
    } else {
      const errorData = await response.json();
      errorNotification(`Error: ${response.status} - ${errorData.message}`);
    }
  } catch (error) {
    errorNotification("An error occurred: " + error.message);
  }
}

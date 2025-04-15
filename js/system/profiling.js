import {
  backendURL,
  showNavAdminPages,
  successNotification,
  errorNotification,
  logout,
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

  const monthDropdownItems = document.querySelectorAll(".dropdown-item");
  monthDropdownItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      const selectedMonth = event.target.getAttribute("data-month");
      document.getElementById("monthDropdown").textContent =
        event.target.textContent;

      // Pass null instead of "all" to fetch all months
      fetchTransactionHistory(
        citizenId,
        selectedMonth === "all" ? null : selectedMonth
      );
    });
  });

  // Download PDF Button Event Listener
  const downloadBtn = document.getElementById("download-pdf");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", downloadPDF);
  }
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

  // Update the municipality and province at the bottom of the Profiling section
  document.getElementById("municipality").innerText =
    citizen.municipality || "N/A";
  document.getElementById("province").innerText = citizen.province || "N/A";
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

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 10;

  // Title
  const pageWidth = doc.internal.pageSize.getWidth();
  const title = "Citizen Profile";
  const textWidth = doc.getTextWidth(title);
  const x = (pageWidth - textWidth) / 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, x, y);
  y += 10;

  // Basic text styling
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  const details = [
    ["Citizen ID", "citizen_id"],
    ["Name", "lastname"],
    ["Birthdate", "citizenBirthdate"],
    ["Gender", "gender"],
    ["Purok", "purok"],
    ["Barangay", "barangay"],
    ["Blood Type", "blood_type"],
    ["Allergies", "allergies"],
    ["Weight", "weight"],
    ["Height", "height"],
    ["Medication", "medication"],
    ["Municipality", "municipality"],
    ["Province", "province"],
  ];

  // Loop and print each detail
  details.forEach(([label, id]) => {
    const value = document.getElementById(id)?.innerText || "N/A";
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 10, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 60, y);
    y += 8;
  });

  // Emergency Contact (on a new line each)
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text(`Emergency Contact Name:`, 10, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(
    document.getElementById("emergency_contact_name").innerText || "N/A",
    10,
    y
  );
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text(`Emergency Contact Number:`, 10, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(
    document.getElementById("emergency_contact_number").innerText || "N/A",
    10,
    y
  );
  y += 10;

  // Transaction Table Header
  doc.setFont("helvetica", "bold");
  doc.text("Transaction History:", 10, y);
  y += 10;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Date", 10, y);
  doc.text("Service", 60, y);
  doc.text("Medicines", 120, y);
  y += 7;
  doc.setFont("helvetica", "normal");

  const transactionHistory = document.getElementById("transactionHistoryBody");
  Array.from(transactionHistory.rows).forEach((row) => {
    const date = row.cells[0].innerText;
    const service = row.cells[1].innerText;
    const medicine = row.cells[2].innerText;

    // Wrap text if needed (basic word wrapping)
    const maxWidth = 60;
    const splitService = doc.splitTextToSize(service, maxWidth);
    const splitMedicine = doc.splitTextToSize(medicine, maxWidth);
    const lineCount = Math.max(splitService.length, splitMedicine.length);

    for (let i = 0; i < lineCount; i++) {
      doc.text(i === 0 ? date : "", 10, y);
      doc.text(splitService[i] || "", 60, y);
      doc.text(splitMedicine[i] || "", 120, y);
      y += 7;
    }
  });

  const citizenId = document.getElementById("citizen_id").innerText;
  doc.save(`citizen_profile_${citizenId}.pdf`);
}

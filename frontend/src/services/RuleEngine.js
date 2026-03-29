export const processRequest = (category, subType, urgency, hasRequirements) => {
  let priority = "LOW";
  let instructions = "";
  let action = "SCHEDULE";

  if (category === "Medical") {
    if (urgency === "High") {
      priority = "HIGH";
      instructions = "Proceed to the Barangay Health Center immediately for triage.";
      action = "EMERGENCY_WALK_IN";
    } else {
      priority = "MEDIUM";
      instructions = "Bring your PhilHealth ID and previous prescriptions.";
      action = "SCHEDULE_APPOINTMENT";
    }
  } else if (category === "Documents") {
    priority = "LOW";
    if (subType === "Clearance") {
      instructions = "Bring 2x2 ID picture and your Community Tax Certificate (Cedula).";
    } else if (subType === "Indigency") {
      instructions = "Bring a Certificate of Residency and proof of income.";
    }
    if (!hasRequirements) {
      instructions = "⚠️ REQUIRED: Please secure your documents first before booking.";
      action = "RECALL_REQUIREMENTS";
    }
  } else if (category === "Complaint") {
    priority = "MEDIUM";
    instructions = "You will be scheduled for a preliminary mediation with the Lupon.";
    action = "SCHEDULE_MEDIATION";
  }

  return { priority, instructions, action, timestamp: new Date().toISOString() };
};
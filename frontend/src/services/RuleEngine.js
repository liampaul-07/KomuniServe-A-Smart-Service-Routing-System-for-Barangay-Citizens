export const processRequest = ({ category, subType, urgency, description }) => {
  let priority = "LOW";
  let instructions = "";
  let action = "WALK_IN";
  let requiresAppointment = false;

  if (category === "Medical") {
    if (subType === "Chest_Pain") {
      priority = "HIGH";
      instructions = "Proceed to the Barangay Health Center immediately. Do not wait — this may be serious.";
      action = "WALK_IN";
      requiresAppointment = false;

    } else if (subType === "Fever_Short") {
      priority = "MEDIUM";
      instructions = "Symptoms just started. You may walk in to the Barangay Health Center. Bring your PhilHealth ID if available.";
      action = "WALK_IN";
      requiresAppointment = false;

    } else if (subType === "Fever_Long") {
      priority = "MEDIUM";
      instructions = "Symptoms have persisted. Schedule an appointment with the Barangay Health Center. Bring your PhilHealth ID and any previous prescriptions.";
      action = "SCHEDULE";
      requiresAppointment = true;

    } else if (subType === "Wound") {
      priority = "MEDIUM";
      instructions = "Proceed to the Barangay Health Center for wound assessment. Bring a valid ID.";
      action = "WALK_IN";
      requiresAppointment = false;

    } else if (subType === "Routine") {
      priority = "LOW";
      instructions = "Schedule an appointment for your prescription refill or routine check. Bring your PhilHealth ID and previous prescriptions.";
      action = "SCHEDULE";
      requiresAppointment = true;
    }

  } else if (category === "Documents") {
    priority = "LOW";
    action = "SCHEDULE";
    requiresAppointment = true;

    const docRequirements = {
      Clearance:       "✔ 2x2 ID picture\n✔ Community Tax Certificate (Cedula)\n✔ Valid ID",
      Indigency:       "✔ Valid ID\n✔ Certificate of Residency\n✔ Proof of income (or affidavit of no income)",
      Residency:       "✔ Valid ID\n✔ Proof of address (utility bill or lease contract)",
      Good_Moral:      "✔ Valid ID\n✔ 2x2 ID picture",
      Business_Permit: "✔ Valid ID\n✔ DTI or SEC registration\n✔ Lease contract or proof of business address",
    };

    const reqList = docRequirements[subType] ?? "Bring a valid ID and any relevant supporting documents.";
    instructions = `Schedule an appointment to request this document.\n\nRequirements:\n${reqList}`;

  } else if (category === "Complaint") {
    if (urgency === "High") {
      priority = "HIGH";
      instructions = `Your complaint has been flagged as urgent. Proceed to the barangay hall immediately.\n\nYour concern: "${description}"`;
      action = "WALK_IN";
      requiresAppointment = false;
    } else {
      priority = "MEDIUM";
      instructions = `Your complaint will be scheduled for mediation or assessment by the barangay.\n\nYour concern: "${description}"`;
      action = "SCHEDULE";
      requiresAppointment = true;
    }
  }

  return {
    priority,
    instructions,
    action,
    requiresAppointment,
    timestamp: new Date().toISOString(),
  };
};
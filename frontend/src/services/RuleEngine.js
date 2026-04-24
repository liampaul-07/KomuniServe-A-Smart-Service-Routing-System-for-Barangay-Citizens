// FACILITY DATA — hardcoded for now.
// When Supabase is connected, this will be replaced by a fetch from the services table.
const FACILITIES = {
  HEALTH_CENTER:  'Barangay Health Center',
  SOCIAL_WELFARE: 'Barangay Social Welfare Office',
  BARANGAY_HALL:  'Barangay Hall',
  LUPON:          'Barangay Hall — Lupon Tagapamayapa',
  RECORDS:        'Barangay Hall — Records Office',
  INFRA:          'Barangay Hall — Infrastructure Office',
};

export const processRequest = ({ category, subType, urgency, description }) => {
  let priority = 'LOW';
  let instructions = '';
  let action = 'WALK_IN';
  let requiresAppointment = false;
  let facility = FACILITIES.BARANGAY_HALL;

  if (category === 'Medical') {
    if (subType === 'Physical') {
      facility = FACILITIES.HEALTH_CENTER;
      if (urgency === 'High') {
        priority = 'HIGH';
        instructions = 'Proceed to the Barangay Health Center immediately. Bring any valid ID.';
        action = 'WALK_IN';
        requiresAppointment = false;
      } else {
        priority = 'MEDIUM';
        instructions = 'Schedule an appointment at the Barangay Health Center. Bring your PhilHealth ID and any previous prescriptions.';
        action = 'SCHEDULE';
        requiresAppointment = true;
      }

    } else if (subType === 'Psychological') {
      priority = 'MEDIUM';
      instructions = 'A social worker or mental health officer will assist you. Schedule an appointment and bring a valid ID.';
      action = 'SCHEDULE';
      requiresAppointment = true;
      facility = FACILITIES.SOCIAL_WELFARE;
    } else if (subType === 'Checkup') {
      priority = 'LOW';
      instructions = 'Schedule a routine checkup at the Barangay Health Center. Bring your PhilHealth ID.';
      action = 'SCHEDULE';
      requiresAppointment = true;
      facility = FACILITIES.HEALTH_CENTER;
    }

  } else if (category === 'Documents') {
    priority = 'LOW';
    action = 'SCHEDULE';
    requiresAppointment = true;
    facility = FACILITIES.RECORDS;

    const docRequirements = {
      Clearance:       '✔ 2x2 ID picture\n✔ Community Tax Certificate (Cedula)\n✔ Valid ID',
      Indigency:       '✔ Valid ID\n✔ Certificate of Residency\n✔ Proof of income (or affidavit of no income)',
      Residency:       '✔ Valid ID\n✔ Proof of address (utility bill or lease contract)',
      Good_Moral:      '✔ Valid ID\n✔ 2x2 ID picture',
      Business_Permit: '✔ Valid ID\n✔ DTI or SEC registration\n✔ Lease contract or proof of business address',
    };

    const reqList = docRequirements[subType] ?? 'Bring a valid ID and any relevant supporting documents.';
    instructions = `Schedule an appointment to request this document.\n\nRequirements:\n${reqList}`;

  } else if (category === 'Complaint') {
    const submitReportTypes = [
      'Noise',
      'Broken_Water_Pump', 'Broken_Electrical_Wire',
      'Eroded_Road', 'Other_Infrastructure', 'Infrastructure',
    ];
    const isSubmitReport = submitReportTypes.includes(subType);

    if (isSubmitReport) {
      const isInfra = subType !== 'Noise';
      facility = isInfra ? FACILITIES.INFRA : FACILITIES.BARANGAY_HALL;

      const highInfra = ['Broken_Electrical_Wire', 'Eroded_Road'];
      if (highInfra.includes(subType) || urgency === 'High') {
        priority = 'HIGH';
        instructions = `This has been flagged as an urgent hazard. Your report will be submitted directly to the barangay.\n\nYour report: "${description}"`;
      } else if (subType === 'Noise') {
        priority = 'LOW';
        instructions = `Your noise or public disturbance complaint will be submitted to the barangay for action.\n\nYour report: "${description}"`;
      } else {
        priority = 'MEDIUM';
        instructions = `Your report will be submitted to the barangay for assessment.\n\nYour report: "${description}"`;
      }
    action = 'SUBMIT_REPORT';
    requiresAppointment = false;
  } else {
    // COMPLAINT_OPTIONS: Domestic_Issue, Physical_Threat, Property_Dispute, Other
    facility = urgency === 'High' ? FACILITIES.BARANGAY_HALL : FACILITIES.LUPON;
    priority = urgency ? urgency.toUpperCase() : 'MEDIUM';
    const readableType = subType ? subType.replace(/_/g, ' ') : 'your concern';
    instructions = `You are filing a complaint regarding: ${readableType}. You may submit this as a report only, or also schedule an appointment for mediation.\n\nYour concern: "${description}"`;
    action = 'COMPLAINT_OPTIONS';
    requiresAppointment = false;
  }
}

  return {
    priority,
    instructions,
    action,
    requiresAppointment,
    facility,
    timestamp: new Date().toISOString(),
  };
};
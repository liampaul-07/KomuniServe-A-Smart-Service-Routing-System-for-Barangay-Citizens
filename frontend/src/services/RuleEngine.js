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
    const infraTypes = ['Broken_Water_Pump', 'Broken_Electrical_Wire', 'Eroded_Road', 'Other_Infrastructure'];
    const isInfra = infraTypes.includes(subType);

    if (isInfra) {
      facility = FACILITIES.INFRA;
      const highInfra = ['Broken_Electrical_Wire', 'Eroded_Road'];
      if (highInfra.includes(subType)) {
        priority = 'HIGH';
        instructions = `This has been flagged as an urgent infrastructure hazard. Your report will be submitted to the barangay immediately.\n\nYour report: "${description}"`;
      } else {
        priority = 'MEDIUM';
        instructions = `Your infrastructure report will be submitted to the barangay for assessment.\n\nYour report: "${description}"`;
      }
      action = 'SUBMIT_REPORT';
      requiresAppointment = false;

    } else {
      facility = urgency === 'High' ? FACILITIES.BARANGAY_HALL : FACILITIES.LUPON;
      if (urgency === 'High') {
        priority = 'HIGH';
        instructions = `Your complaint has been flagged as urgent. Proceed to the barangay hall immediately.\n\nYour concern: "${description}"`;
        action = 'WALK_IN';
        requiresAppointment = false;
      } else {
        priority = 'MEDIUM';
        instructions = `Your complaint will be scheduled for mediation or assessment by the barangay.\n\nYour concern: "${description}"`;
        action = 'SCHEDULE';
        requiresAppointment = true;
      }
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
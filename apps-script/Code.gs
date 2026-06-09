/**
 * Zane Tutors — Apps Script API Layer
 * 
 * This script is deployed as a Google Apps Script Web App.
 * It provides a REST-like API for reading/writing tutor data
 * to a Google Sheet with multiple tabs.
 * 
 * Sheet tabs:
 *   - Tutors
 *   - Subjects
 *   - PreferredLevels
 *   - AvailabilitySlots
 *   - Reviews
 *   - Assessments
 *   - Documents
 * 
 * Deploy as:
 *   - Execute as: Me
 *   - Who has access: Anyone (or Anyone with the link)
 * 
 * The web app URL will be used by the frontend as a fallback
 * when the WordPress API is unavailable.
 */

// ── Configuration ──
const SHEET_NAME = 'Zane Tutors Data'; // Name of the Google Sheet

// ── Helper: Get the spreadsheet ──
function getSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss;
}

// ── Helper: Get or create a sheet tab ──
function getOrCreateSheet(sheetName) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

// ── Helper: Read all rows from a sheet as array of objects ──
function readSheetAsObjects(sheetName) {
  const sheet = getOrCreateSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  
  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  return rows;
}

// ── Helper: Find a row by a column value ──
function findRowByColumn(sheetName, columnName, value) {
  const sheet = getOrCreateSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;
  
  const headers = data[0];
  const colIndex = headers.indexOf(columnName);
  if (colIndex === -1) return null;
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colIndex]) === String(value)) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = data[i][j];
      }
      return { row, rowIndex: i + 1 }; // 1-based row index
    }
  }
  return null;
}

// ── Helper: Append a row to a sheet ──
function appendRow(sheetName, rowData) {
  const sheet = getOrCreateSheet(sheetName);
  const headers = sheet.getDataRange().getValues()[0] || [];
  
  // If sheet is empty, set headers from rowData keys
  if (headers.length === 0) {
    const keys = Object.keys(rowData);
    sheet.getRange(1, 1, 1, keys.length).setValues([keys]);
    sheet.getRange(2, 1, 1, keys.length).setValues([keys.map(k => rowData[k])]);
    return;
  }
  
  const row = headers.map(h => rowData[h] !== undefined ? rowData[h] : '');
  sheet.appendRow(row);
}

// ── Helper: Update a row by column value ──
function updateRow(sheetName, columnName, value, updates) {
  const sheet = getOrCreateSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return false;
  
  const headers = data[0];
  const colIndex = headers.indexOf(columnName);
  if (colIndex === -1) return false;
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colIndex]) === String(value)) {
      for (const key in updates) {
        const keyIndex = headers.indexOf(key);
        if (keyIndex !== -1) {
          sheet.getRange(i + 1, keyIndex + 1).setValue(updates[key]);
        }
      }
      return true;
    }
  }
  return false;
}

// ── Helper: Delete a row by column value ──
function deleteRow(sheetName, columnName, value) {
  const sheet = getOrCreateSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return false;
  
  const headers = data[0];
  const colIndex = headers.indexOf(columnName);
  if (colIndex === -1) return false;
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colIndex]) === String(value)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

// ── Helper: JSON response ──
function jsonResponse(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ── Helper: Parse request body ──
function parseBody(e) {
  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    return null;
  }
}

// ── Helper: Generate a simple ID ──
function generateId() {
  return Utilities.getUuid().split('-')[0] + Date.now().toString(36);
}

// ══════════════════════════════════════════════════════════════
// MAIN ENTRY POINT — doGet / doPost
// ══════════════════════════════════════════════════════════════

function doGet(e) {
  const action = e.parameter.action;
  
  switch (action) {
    case 'getTutors':
      return handleGetTutors(e);
    case 'getTutor':
      return handleGetTutor(e);
    case 'getAssessments':
      return handleGetAssessments(e);
    case 'getReviews':
      return handleGetReviews(e);
    case 'getDocuments':
      return handleGetDocuments(e);
    case 'getSubjects':
      return handleGetSubjects(e);
    case 'getPreferredLevels':
      return handleGetPreferredLevels(e);
    case 'getAvailabilitySlots':
      return handleGetAvailabilitySlots(e);
    case 'getCatalogue':
      return handleGetCatalogue(e);
    case 'getAdminTutors':
      return handleGetAdminTutors(e);
    case 'health':
      return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
    default:
      return jsonResponse({ error: 'Unknown action', available: ['getTutors', 'getTutor', 'getAssessments', 'getReviews', 'getDocuments', 'getSubjects', 'getPreferredLevels', 'getAvailabilitySlots', 'getCatalogue', 'getAdminTutors', 'health'] });
  }
}

function doPost(e) {
  const action = e.parameter.action;
  
  switch (action) {
    case 'saveAssessment':
      return handleSaveAssessment(e);
    case 'saveTutor':
      return handleSaveTutor(e);
    case 'updateTutor':
      return handleUpdateTutor(e);
    case 'addReview':
      return handleAddReview(e);
    case 'saveDocument':
      return handleSaveDocument(e);
    case 'verifyTutor':
      return handleVerifyTutor(e);
    case 'importTutors':
      return handleImportTutors(e);
    case 'exportTutors':
      return handleExportTutors(e);
    default:
      return jsonResponse({ error: 'Unknown action', available: ['saveAssessment', 'saveTutor', 'updateTutor', 'addReview', 'saveDocument', 'verifyTutor', 'importTutors', 'exportTutors'] });
  }
}

// ══════════════════════════════════════════════════════════════
// HANDLERS — GET
// ══════════════════════════════════════════════════════════════

function handleGetTutors(e) {
  const tutors = readSheetAsObjects('Tutors');
  return jsonResponse({ tutors, count: tutors.length });
}

function handleGetTutor(e) {
  const id = e.parameter.id;
  if (!id) return jsonResponse({ error: 'Missing id parameter' }, 400);
  
  const result = findRowByColumn('Tutors', 'id', id);
  if (!result) return jsonResponse({ error: 'Tutor not found' }, 404);
  
  return jsonResponse({ tutor: result.row });
}

function handleGetAssessments(e) {
  const tutorId = e.parameter.tutorId;
  let assessments = readSheetAsObjects('Assessments');
  
  if (tutorId) {
    assessments = assessments.filter(a => String(a.tutorId) === String(tutorId));
  }
  
  return jsonResponse({ assessments, count: assessments.length });
}

function handleGetReviews(e) {
  const tutorId = e.parameter.tutorId;
  let reviews = readSheetAsObjects('Reviews');
  
  if (tutorId) {
    reviews = reviews.filter(r => String(r.tutorId) === String(tutorId));
  }
  
  return jsonResponse({ reviews, count: reviews.length });
}

function handleGetDocuments(e) {
  const tutorId = e.parameter.tutorId;
  let documents = readSheetAsObjects('Documents');
  
  if (tutorId) {
    documents = documents.filter(d => String(d.tutorId) === String(tutorId));
  }
  
  return jsonResponse({ documents, count: documents.length });
}

function handleGetSubjects(e) {
  const subjects = readSheetAsObjects('Subjects');
  return jsonResponse({ subjects, count: subjects.length });
}

function handleGetPreferredLevels(e) {
  const levels = readSheetAsObjects('PreferredLevels');
  return jsonResponse({ levels, count: levels.length });
}

function handleGetAvailabilitySlots(e) {
  const tutorId = e.parameter.tutorId;
  let slots = readSheetAsObjects('AvailabilitySlots');
  
  if (tutorId) {
    slots = slots.filter(s => String(s.tutorId) === String(tutorId));
  }
  
  return jsonResponse({ slots, count: slots.length });
}

function handleGetCatalogue(e) {
  const tutors = readSheetAsObjects('Tutors');
  // Filter to only verified tutors for public catalogue
  const catalogue = tutors.filter(t => 
    t.isVerified === 'true' || t.isVerified === true || t.verificationStatus === 'approved'
  );
  return jsonResponse({ tutors: catalogue, count: catalogue.length });
}

function handleGetAdminTutors(e) {
  const tutors = readSheetAsObjects('Tutors');
  return jsonResponse({ tutors, count: tutors.length });
}

// ══════════════════════════════════════════════════════════════
// HANDLERS — POST
// ══════════════════════════════════════════════════════════════

function handleSaveAssessment(e) {
  const body = parseBody(e);
  if (!body) return jsonResponse({ error: 'Invalid request body' }, 400);
  
  const assessment = {
    id: generateId(),
    tutorId: body.tutorId || '',
    tutorName: body.tutorName || '',
    email: body.email || '',
    date: new Date().toISOString(),
    overallScore: body.overallScore || 0,
    overallPassed: body.overallPassed || 'No',
    readinessLevel: body.readinessLevel || '',
    subjects: JSON.stringify(body.subjects || []),
    subjectScores: JSON.stringify(body.subjectScores || []),
    yearsExperience: body.yearsExperience || '',
    educationLevel: body.educationLevel || '',
    resultData: JSON.stringify(body.resultData || {}),
    psychResults: JSON.stringify(body.psychResults || []),
    digitalToolsResults: JSON.stringify(body.digitalToolsResults || []),
  };
  
  appendRow('Assessments', assessment);
  return jsonResponse({ success: true, id: assessment.id });
}

function handleSaveTutor(e) {
  const body = parseBody(e);
  if (!body) return jsonResponse({ error: 'Invalid request body' }, 400);
  
  const tutor = {
    id: body.id || generateId(),
    email: body.email || '',
    firstName: body.firstName || '',
    lastName: body.lastName || '',
    phone: body.phone || '',
    location: body.location || '',
    profilePhoto: body.profilePhoto || '',
    qualification: body.qualification || '',
    macroCategory: body.macroCategory || '',
    subjects: JSON.stringify(body.subjects || []),
    experience: body.experience || 0,
    hourlyRate: body.hourlyRate || 0,
    briefIntro: body.briefIntro || '',
    preferredLevels: JSON.stringify(body.preferredLevels || []),
    currentWork: body.currentWork || '',
    availability: body.availability || '',
    availabilitySlots: JSON.stringify(body.availabilitySlots || []),
    teachingHistory: body.teachingHistory || '',
    classDelivery: body.classDelivery || '',
    classType: body.classType || '',
    trcnCertified: body.trcnCertified || false,
    rating: body.rating || 0,
    reviewCount: body.reviewCount || 0,
    isVerified: body.isVerified || false,
    verificationStatus: body.verificationStatus || 'pending',
    adminNotes: body.adminNotes || '',
    onboardingStep: body.onboardingStep || 'signup',
    createdAt: body.createdAt || new Date().toISOString(),
    accountType: body.accountType || '',
    gender: body.gender || '',
    dob: body.dob || '',
    stateOfOrigin: body.stateOfOrigin || '',
    portalIntent: body.portalIntent || '',
    lmsTeachingTrack: body.lmsTeachingTrack || '',
  };
  
  appendRow('Tutors', tutor);
  return jsonResponse({ success: true, id: tutor.id });
}

function handleUpdateTutor(e) {
  const body = parseBody(e);
  if (!body || !body.id) return jsonResponse({ error: 'Missing tutor id' }, 400);
  
  const updates = {};
  const allowedFields = [
    'email', 'firstName', 'lastName', 'phone', 'location', 'profilePhoto',
    'qualification', 'macroCategory', 'subjects', 'experience', 'hourlyRate',
    'briefIntro', 'preferredLevels', 'currentWork', 'availability',
    'availabilitySlots', 'teachingHistory', 'classDelivery', 'classType',
    'trcnCertified', 'rating', 'reviewCount', 'isVerified', 'verificationStatus',
    'adminNotes', 'onboardingStep', 'accountType', 'gender', 'dob',
    'stateOfOrigin', 'portalIntent', 'lmsTeachingTrack',
  ];
  
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = typeof body[field] === 'object' ? JSON.stringify(body[field]) : body[field];
    }
  }
  
  const success = updateRow('Tutors', 'id', body.id, updates);
  if (!success) return jsonResponse({ error: 'Tutor not found' }, 404);
  
  return jsonResponse({ success: true });
}

function handleAddReview(e) {
  const body = parseBody(e);
  if (!body) return jsonResponse({ error: 'Invalid request body' }, 400);
  
  const review = {
    id: generateId(),
    tutorId: body.tutorId || '',
    reviewerName: body.reviewerName || '',
    rating: body.rating || 0,
    comment: body.comment || '',
    date: new Date().toISOString(),
  };
  
  appendRow('Reviews', review);
  
  // Update tutor's average rating
  const reviews = readSheetAsObjects('Reviews').filter(r => String(r.tutorId) === String(body.tutorId));
  const avgRating = reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length;
  updateRow('Tutors', 'id', body.tutorId, { 
    rating: Math.round(avgRating * 10) / 10, 
    reviewCount: reviews.length 
  });
  
  return jsonResponse({ success: true, rating: Math.round(avgRating * 10) / 10, reviewCount: reviews.length });
}

function handleSaveDocument(e) {
  const body = parseBody(e);
  if (!body) return jsonResponse({ error: 'Invalid request body' }, 400);
  
  const doc = {
    id: generateId(),
    tutorId: body.tutorId || '',
    fileName: body.fileName || '',
    uploadedAt: new Date().toISOString(),
    expiryDate: body.expiryDate || '',
    url: body.url || '',
  };
  
  appendRow('Documents', doc);
  return jsonResponse({ success: true, id: doc.id });
}

function handleVerifyTutor(e) {
  const body = parseBody(e);
  if (!body || !body.tutorId) return jsonResponse({ error: 'Missing tutorId' }, 400);
  
  const updates = {
    verificationStatus: body.status || 'pending',
    isVerified: body.status === 'approved' ? 'true' : 'false',
    adminNotes: body.notes || '',
  };
  
  const success = updateRow('Tutors', 'id', body.tutorId, updates);
  if (!success) return jsonResponse({ error: 'Tutor not found' }, 404);
  
  return jsonResponse({ success: true });
}

function handleImportTutors(e) {
  const body = parseBody(e);
  if (!body || !body.tutors) return jsonResponse({ error: 'Missing tutors array' }, 400);
  
  let imported = 0;
  for (const tutor of body.tutors) {
    try {
      appendRow('Tutors', tutor);
      imported++;
    } catch (err) {
      console.error('Failed to import tutor:', err);
    }
  }
  
  return jsonResponse({ success: true, imported });
}

function handleExportTutors(e) {
  const tutors = readSheetAsObjects('Tutors');
  return jsonResponse({ tutors, count: tutors.length });
}

// ══════════════════════════════════════════════════════════════
// INITIALIZATION — Run once to set up sheet tabs with headers
// ══════════════════════════════════════════════════════════════

function initializeSheetTabs() {
  const tabs = {
    'Tutors': [
      'id', 'email', 'firstName', 'lastName', 'phone', 'location',
      'profilePhoto', 'qualification', 'macroCategory', 'subjects',
      'experience', 'hourlyRate', 'briefIntro', 'preferredLevels',
      'currentWork', 'availability', 'availabilitySlots', 'teachingHistory',
      'classDelivery', 'classType', 'trcnCertified', 'rating', 'reviewCount',
      'isVerified', 'verificationStatus', 'adminNotes', 'onboardingStep',
      'createdAt', 'accountType', 'gender', 'dob', 'stateOfOrigin',
      'portalIntent', 'lmsTeachingTrack', 'lastOnline', 'profileViews',
      'hiddenFromCatalogue', 'lastNudgedAt',
    ],
    'Subjects': [
      'id', 'name', 'category', 'level', 'description',
    ],
    'PreferredLevels': [
      'id', 'tutorId', 'level', 'description',
    ],
    'AvailabilitySlots': [
      'id', 'tutorId', 'day', 'startTime', 'endTime',
    ],
    'Reviews': [
      'id', 'tutorId', 'reviewerName', 'rating', 'comment', 'date',
    ],
    'Assessments': [
      'id', 'tutorId', 'tutorName', 'email', 'date', 'overallScore',
      'overallPassed', 'readinessLevel', 'subjects', 'subjectScores',
      'yearsExperience', 'educationLevel', 'resultData', 'psychResults',
      'digitalToolsResults',
    ],
    'Documents': [
      'id', 'tutorId', 'fileName', 'uploadedAt', 'expiryDate', 'url',
    ],
  };
  
  for (const [tabName, headers] of Object.entries(tabs)) {
    const sheet = getOrCreateSheet(tabName);
    const existingHeaders = sheet.getDataRange().getValues()[0] || [];
    if (existingHeaders.length === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }
  
  return 'Sheet tabs initialized successfully';
}
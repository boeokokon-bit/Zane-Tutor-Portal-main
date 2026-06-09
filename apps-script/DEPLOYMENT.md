# Apps Script Deployment Guide

This document explains how to set up and deploy the Google Apps Script backend for the Zane Tutor Portal.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│                                                      │
│  api.ts ──────► WP API (Primary)                     │
│     │                                                 │
│     └──────► apiWithFallback.ts ──► Apps Script (Fallback) │
│                                                      │
│  googleSheets.ts ──► Legacy Script + Apps Script      │
└─────────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌─────────────────────────────┐
│  WordPress API  │    │  Google Apps Script Web App  │
│  (facilitator.  │    │                              │
│   zanetutors.   │    │  ┌─────────────────────────┐ │
│   com.ng)       │    │  │  Google Sheet (Multi-Tab)│ │
│                 │    │  │                          │ │
│  - Auth         │    │  │  - Tutors                │ │
│  - Profiles     │    │  │  - Subjects              │ │
│  - Catalogue    │    │  │  - PreferredLevels       │ │
│  - Leads        │    │  │  - AvailabilitySlots     │ │
│  - Admin        │    │  │  - Reviews               │ │
│                 │    │  │  - Assessments            │ │
│                 │    │  │  - Documents              │ │
│                 │    │  └─────────────────────────┘ │
└─────────────────┘    └─────────────────────────────┘
```

## Sheet Tab Schema

### Tutors
| Column | Type | Description |
|--------|------|-------------|
| id | string | Unique tutor ID |
| email | string | Tutor email |
| firstName | string | First name |
| lastName | string | Last name |
| phone | string | Phone number |
| location | string | City/location |
| profilePhoto | string | Photo URL |
| qualification | string | Academic qualification |
| macroCategory | string | Academic or Skills |
| subjects | JSON string | Array of subjects |
| experience | number | Years of experience |
| hourlyRate | number | Hourly rate (₦) |
| briefIntro | string | Bio/intro |
| preferredLevels | JSON string | Array of teaching levels |
| currentWork | string | Current workplace |
| availability | string | Availability summary |
| availabilitySlots | JSON string | Array of availability slots |
| teachingHistory | string | Teaching history |
| classDelivery | string | Delivery method |
| classType | string | offline/virtual/hybrid |
| trcnCertified | boolean | TRCN certified |
| rating | number | Average rating |
| reviewCount | number | Number of reviews |
| isVerified | boolean | Verification status |
| verificationStatus | string | pending/approved/rejected |
| adminNotes | string | Admin notes |
| onboardingStep | string | Current onboarding step |
| createdAt | string | ISO date |
| accountType | string | academic/skill |
| gender | string | Gender |
| dob | string | Date of birth |
| stateOfOrigin | string | State of origin |
| portalIntent | string | teach/lms |
| lmsTeachingTrack | string | general/academic |
| lastOnline | string | Last online timestamp |
| profileViews | number | Profile view count |
| hiddenFromCatalogue | boolean | Hidden from public |
| lastNudgedAt | string | Last nudge timestamp |

### Subjects
| Column | Type | Description |
|--------|------|-------------|
| id | string | Subject ID |
| name | string | Subject name |
| category | string | academic/skill |
| level | string | Teaching level |
| description | string | Description |

### PreferredLevels
| Column | Type | Description |
|--------|------|-------------|
| id | string | Record ID |
| tutorId | string | Reference to tutor |
| level | string | Teaching level |
| description | string | Description |

### AvailabilitySlots
| Column | Type | Description |
|--------|------|-------------|
| id | string | Record ID |
| tutorId | string | Reference to tutor |
| day | string | Day of week |
| startTime | string | Start time |
| endTime | string | End time |

### Reviews
| Column | Type | Description |
|--------|------|-------------|
| id | string | Review ID |
| tutorId | string | Reference to tutor |
| reviewerName | string | Reviewer name |
| rating | number | Rating (1-5) |
| comment | string | Review comment |
| date | string | ISO date |

### Assessments
| Column | Type | Description |
|--------|------|-------------|
| id | string | Assessment ID |
| tutorId | string | Reference to tutor |
| tutorName | string | Tutor name |
| email | string | Tutor email |
| date | string | ISO date |
| overallScore | number | Overall readiness score |
| overallPassed | string | Yes/No |
| readinessLevel | string | proficient/competent/developing/not_ready |
| subjects | JSON string | Array of subject results |
| subjectScores | JSON string | Array of detailed scores |
| yearsExperience | string | Experience range |
| educationLevel | string | Education level |
| resultData | JSON string | Full result data |
| psychResults | JSON string | Psychological assessment results |
| digitalToolsResults | JSON string | Digital tools assessment results |

### Documents
| Column | Type | Description |
|--------|------|-------------|
| id | string | Document ID |
| tutorId | string | Reference to tutor |
| fileName | string | File name |
| uploadedAt | string | ISO date |
| expiryDate | string | Expiry date (for IDs) |
| url | string | Document URL |

## Setup Steps

### Step 1: Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet named **"Zane Tutors Data"**
3. Note the Sheet ID from the URL (between `/d/` and `/edit`)

### Step 2: Add the Apps Script

1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete any existing code in `Code.gs`
3. Copy the entire contents of `apps-script/Code.gs` into the editor
4. Click **Save** (💾)

### Step 3: Initialize Sheet Tabs

1. In the Apps Script editor, select the `initializeSheetTabs` function from the dropdown
2. Click **Run** (▶️)
3. Authorize the script when prompted
4. Go back to your Google Sheet — you should see all 7 tabs created with headers

### Step 4: Deploy as Web App

1. In the Apps Script editor, click **Deploy > New deployment**
2. Select **Web app**
3. Configure:
   - **Description:** "Zane Tutors API"
   - **Execute as:** Me (your account)
   - **Who has access:** Anyone (or "Anyone with Google account" for more security)
4. Click **Deploy**
5. Copy the **Web app URL** — this is your Apps Script API endpoint

### Step 5: Configure the Frontend

1. Copy `.env.example` to `.env`
2. Set the `VITE_APPS_SCRIPT_URL` value to the URL from Step 4:
   ```
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```
3. Restart your dev server

### Step 6: Test the Connection

1. Open the browser console
2. Navigate to a page that uses the API
3. You should see fallback logs like:
   ```
   [API Fallback] getCatalogue: WP API failed, trying Apps Script...
   [API Fallback] getCatalogue: Apps Script succeeded
   ```

## API Endpoints

### GET Endpoints
| Action | URL | Parameters |
|--------|-----|------------|
| `getTutors` | `?action=getTutors` | — |
| `getTutor` | `?action=getTutor&id=xxx` | `id` (required) |
| `getCatalogue` | `?action=getCatalogue` | — |
| `getAdminTutors` | `?action=getAdminTutors` | — |
| `getAssessments` | `?action=getAssessments` | `tutorId` (optional) |
| `getReviews` | `?action=getReviews` | `tutorId` (optional) |
| `getDocuments` | `?action=getDocuments` | `tutorId` (optional) |
| `getSubjects` | `?action=getSubjects` | — |
| `getPreferredLevels` | `?action=getPreferredLevels` | — |
| `getAvailabilitySlots` | `?action=getAvailabilitySlots` | `tutorId` (optional) |
| `health` | `?action=health` | — |

### POST Endpoints
| Action | URL | Body |
|--------|-----|------|
| `saveTutor` | `?action=saveTutor` | Tutor object |
| `updateTutor` | `?action=updateTutor` | Tutor object with `id` |
| `saveAssessment` | `?action=saveAssessment` | Assessment result |
| `addReview` | `?action=addReview` | `{ tutorId, reviewerName, rating, comment }` |
| `saveDocument` | `?action=saveDocument` | `{ tutorId, fileName, url, expiryDate }` |
| `verifyTutor` | `?action=verifyTutor` | `{ tutorId, status, notes }` |
| `importTutors` | `?action=importTutors` | `{ tutors: [...] }` |
| `exportTutors` | `?action=exportTutors` | — |

## Updating the Script

When you update `apps-script/Code.gs`:

1. Go to **Extensions > Apps Script**
2. Paste the updated code
3. Click **Save**
4. Go to **Deploy > Manage deployments**
5. Click the **Edit** (✏️) button next to your current deployment
6. Change the **Version** to "New version"
7. Click **Deploy**

The URL stays the same — only the version changes.

## Fallback Behavior

The app uses the `withFallback()` pattern:

1. **Primary (WP API):** Tried first for all operations
2. **Fallback (Apps Script):** Tried only if WP fails
3. **Error:** If both fail, the original WP error is thrown

For assessments and profiles, a **dual-write** pattern is used:
- Data is written to both WP and Apps Script simultaneously
- If one fails, the other still gets the data
- This ensures data is mirrored across both systems

## Optional: One-Time CSV Migration

If you need to migrate old tutor records from CSV:

1. Prepare your CSV with tutor data
2. Use the `importTutors` POST endpoint
3. Format: `{ "tutors": [ { "id": "...", "email": "...", ... } ] }`
4. This is a one-time operation — not part of the main architecture
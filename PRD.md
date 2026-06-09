# Zane Tutor Portal – Product Requirements Document (PRD)

## 1. Product Vision
The Zane Tutor Portal is a unified, high-performance platform designed to manage two distinct tutor ecosystems: **Academic Tutors** and **Skills Experts**. It serves as a bridge between the WordPress backend and a modern React frontend, providing a seamless experience for tutors, parents, and administrators.

---

## 2. Target Audience
-   **Academic Tutors**: Educators specializing in traditional school subjects (JAMB, WAEC, etc.).
-   **Skills Experts**: Professionals teaching digital or vocational skills (Programming, Design, etc.).
-   **Parents/Students**: Looking for experts and making booking requests.
-   **Administrators**: Managing tutor verification, lead distribution, and platform settings.

---

## 3. Functional Requirements

### 3.1. Unified Authentication System
-   **JWT-Based Auth**: Secure, stateless authentication using JSON Web Tokens.
-   **Role-Aware Signups**: Ability to choose between Academic or Skill Expert during registration.
-   **Admin Access**: Restricted access to sensitive management endpoints.

### 3.2. Dual-Catalogue Display
-   **Academic Hub (Catalogue A)**: Display of tutors specializing in school subjects.
-   **Skills Hub (Catalogue B)**: Display of experts in digital/vocational skills.
-   **Dynamic Toggles**: Admin can enable/disable specific catalogues via the backend.
-   **Deep Linking**: Support for direct access via `?tab=academic` or `?tab=skills`.

### 3.3. Tutor Onboarding Flow
-   **Step 1: Signup**: Account creation and initial role selection.
-   **Step 2: Profile**: Detailed info collection (subjects, experience, hourly rate).
-   **Step 3: Assessment**: Skill/knowledge testing to ensure quality.
-   **Step 4: Verification**: Final admin review before appearing in the catalogue.

### 3.4. Desktop-first Responsive UX
-   **Full-width forms**: Onboarding and portal profile questions render in a single-column layout on mobile and expand cleanly on desktop to maximize readability.
-   **Portal dashboard**: Tutor portal sections such as profile status, verification alerts, quick actions and badges are arranged in full-width stacked cards for large screens.
-   **Training hub**: Training pages use wider containers and responsive module cards to improve usability on desktop while preserving mobile stacking.
-   **Shareable profile pages**: Tutors have dedicated public profile URLs at `/tutor/:tutorId` for easy sharing and direct access.
-   **Removed modal-profile path**: Legacy popup-based tutor profile dialogs are deprecated in favor of dedicated profile pages.

### 3.5. Lead & Booking Management
-   **Booking Requests**: Parents can submit offers to specific tutors.
-   **Admin Forwarding**: Admins can review and "Forward" leads to tutors.
-   **Archive System**: Ability to clear processed leads from the active dashboard to keep it organized.
-   **Notifications**: Email alerts to tutors when a new lead is assigned.

### 3.5. Admin Management Suite
-   **Tutor Verification**: Approve or Reject tutors based on profile quality and test results.
-   **Nudge System**: Send reminders to tutors who haven't completed their profiles.
-   **Review Management**: Weighted rating system (Admin reviews carry more weight).
-   **Catalogue Control**: Hide/Show tutors from public view manually.

### 3.6. Gamification & Engagement
-   **Tutor of the Month**: Visual "Crown" badge and point bonuses for top performers.
-   **Mastery Badges**: Visual rewards for profile completion and verification.

---

## 4. Technical Stack
-   **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, Shadcn UI.
-   **Backend**: WordPress (Headless), Custom PHP REST API (Master Plugin).
-   **Communication**: REST API via Axios/Fetch with Bearer Token Authorization.

---

## 5. Security & Performance
-   **CORS Policy**: Whitelisted domains for secure cross-origin requests.
-   **Database**: Custom tables for assessments and auth tokens to ensure high performance.
-   **API Optimization**: Consolidated legacy snippets into a single "Master Plugin" to reduce server overhead and 404 errors.

---

## 6. Critical Operational Notes
-   **Plugin File**: `zane-portal-master.php` must be active for all features to work.
-   **Environment Variables**: `VITE_WP_API_URL` must point to the correct WordPress JSON root.
-   **JWT Secret**: Must be kept consistent between the server and any external integrations.

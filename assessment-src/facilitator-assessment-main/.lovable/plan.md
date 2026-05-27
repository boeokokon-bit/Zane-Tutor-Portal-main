

# User Authentication and Dashboard Implementation

## Overview

Add user accounts, login/signup, and a personal dashboard to the JAMB Readiness Assessment app. Users can track their assessment history, review past scores, and revisit question reviews -- all powered by a custom PHP snippet on your WordPress site at `https://zanetutors.com.ng/`.

---

## What You Will Get

1. Login and Signup pages inside the assessment app
2. Assessment results automatically saved to your WordPress database when logged in
3. A Dashboard page showing all past assessments with scores, dates, and readiness levels
4. Ability to click into any past assessment to see full details and question reviews
5. Header updates showing user name, Dashboard link, and Logout when signed in
6. Everything works exactly as before for users who do not log in

---

## What You Need To Do (WordPress Side)

I will provide you a single PHP file to add to your WordPress site. You can either:
- Paste it into your theme's `functions.php`, OR
- Upload it as a mini plugin file to `wp-content/plugins/`

This PHP code will:
- Create two database tables automatically (`wp_zane_auth_tokens` and `wp_zane_assessments`)
- Register REST API endpoints for register, login, logout, user info, and assessment CRUD
- Handle CORS headers for your Vercel subdomain
- Use WordPress's built-in user system for accounts (same users as your WP site)
- Generate secure tokens without any third-party plugin

---

## Technical Details

### New Files (React App)

| File | Purpose |
|------|---------|
| `src/contexts/AuthContext.tsx` | Global auth state -- stores user and token in localStorage, provides login/logout/register functions, validates token on app load |
| `src/lib/wordpressApi.ts` | API client for all calls to `https://zanetutors.com.ng/wp-json/zane/v1/...` with automatic token attachment |
| `src/pages/Auth.tsx` | Login and Signup page with tab switching between forms |
| `src/pages/Dashboard.tsx` | Assessment history list with cards; click to expand full details including question review |
| `src/components/auth/LoginForm.tsx` | Email + password form with validation and error handling |
| `src/components/auth/SignupForm.tsx` | First name, last name, email, password form |
| `src/components/dashboard/AssessmentHistoryCard.tsx` | Card showing date, overall score, readiness badge, and subjects for one past assessment |
| `src/components/dashboard/AssessmentDetailDialog.tsx` | Dialog showing full breakdown of a past assessment -- subject scores, weak topics, question review |

### Modified Files

| File | Changes |
|------|---------|
| `src/App.tsx` | Wrap with AuthProvider, add `/auth` and `/dashboard` routes |
| `src/components/layout/Header.tsx` | Sign In button links to `/auth`; when logged in, show user name + Dashboard link + Logout button |
| `src/pages/Assessment.tsx` | After submission, if logged in, save result to WordPress API in parallel with Google Sheets (silently -- never blocks the flow) |
| `src/pages/Results.tsx` | Auto-save to WordPress if logged in; show "Saved to Dashboard" indicator |

### PHP Snippet (WordPress Side)

A single PHP file providing these REST API endpoints:

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/wp-json/zane/v1/register` | POST | No | Create WordPress user account |
| `/wp-json/zane/v1/login` | POST | No | Validate credentials, return token |
| `/wp-json/zane/v1/logout` | POST | Yes | Invalidate token |
| `/wp-json/zane/v1/me` | GET | Yes | Get current user info |
| `/wp-json/zane/v1/assessments` | POST | Yes | Save assessment result |
| `/wp-json/zane/v1/assessments` | GET | Yes | List user's past assessments (summary) |
| `/wp-json/zane/v1/assessments/{id}` | GET | Yes | Get full details of one assessment |

Token system:
- 64-character random token generated on login using `wp_generate_password()`
- Stored hashed in `wp_zane_auth_tokens` table with 7-day expiry
- Sent as `Authorization: Bearer {token}` from React app
- No JWT plugin needed

### Safety Guarantees

- All new features are additive -- existing assessment flow is completely unchanged for non-logged-in users
- WordPress API save runs in parallel with Google Sheets save and fails silently if there is an error
- No existing files are structurally changed -- only small additions (routes, auth checks, save calls)
- The PHP snippet creates its own isolated tables and does not modify any existing WordPress data

### Rollout Order

1. Create all new React files (AuthContext, API client, Auth page, Dashboard page, components)
2. Update App.tsx with new routes and AuthProvider
3. Update Header.tsx with auth-aware buttons
4. Update Assessment.tsx and Results.tsx with parallel WP save (only when logged in)
5. Generate the PHP snippet for you to add to WordPress
6. Test end-to-end


<?php
/**
 * ============================================================
 * ZANE TUTORS – Unified Master Plugin
 * ============================================================
 * This plugin consolidates all tutor portal functionality,
 * including authentication, profiles, catalogue, leads, 
 * and admin management.
 * ============================================================
 */

/*
Plugin Name: Zane Tutors Master Plugin
Description: Unified REST API for Tutor Profiles, Catalogue, Assessments, and Settings.
Version: 3.0
Author: Zane Tutors
*/

if (!defined('ABSPATH')) exit;

// ─────────────────────────────────────────────────────────────
// ROUTER FALLBACK FOR REACT SPA (SUBDIRECTORY /portal/)
// ─────────────────────────────────────────────────────────────
add_action('init', function() {
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    if (strpos($uri, '/portal/') !== false && !preg_match('/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|map)$/i', $uri) && strpos($uri, '/wp-json') === false) {
        $index_path = ABSPATH . 'portal/index.html';
        if (file_exists($index_path)) {
            header('Content-Type: text/html; charset=utf-8');
            readfile($index_path);
            exit;
        }
    }
});

define('ZANE_JWT_SECRET', 'CHANGE_THIS_TO_A_STRONG_RANDOM_STRING_64_CHARS');
define('ZANE_SITE_URL', 'https://facilitator.zanetutors.com.ng');
define('ZANE_SUPPORT_EMAIL', 'hello@zanetutors.com.ng');

// ─────────────────────────────────────────────────────────────
// EMAIL NOTIFICATION HELPER
// ─────────────────────────────────────────────────────────────
function zane_send_email($to, $subject, $html_body) {
    $headers = [
        'Content-Type: text/html; charset=UTF-8',
        'From: Zane Tutors <' . ZANE_SUPPORT_EMAIL . '>',
    ];
    return wp_mail($to, $subject, $html_body, $headers);
}

function zane_notify_registration($email, $name) {
    zane_send_email($email, 'Welcome to Zane Tutors — Let\'s Get Started!', "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
            <h2 style='color: #071244;'>Welcome to Zane Tutors, {$name}! 🎓</h2>
            <p>Your account has been created successfully. Here's what to do next:</p>
            <ol style='line-height: 1.8;'>
                <li>Complete your profile (teaching experience, subjects, availability)</li>
                <li>Take the proficiency assessment (optional but recommended)</li>
                <li>Upload your documents for verification</li>
            </ol>
            <p><a href='" . ZANE_SITE_URL . "/dashboard' style='display:inline-block; padding:12px 24px; background:#071244; color:#fff; text-decoration:none; border-radius:8px;'>Go to Dashboard →</a></p>
            <p style='color:#666; font-size:12px; margin-top:30px;'>If you have any questions, reply to this email or WhatsApp us at +234 810 723 9402.</p>
        </div>
    ");
}

function zane_notify_verification_approved($email, $name) {
    zane_send_email($email, '🎉 You\'re Verified — Your Profile is Live!', "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;>
            <h2 style='color: #071244;'>Great news, {$name}!</h2>
            <p>Your documents have been reviewed and your profile is now <strong>verified and live</strong> on the Zane Tutors catalogue.</p>
            <p>Parents and students can now discover your profile and book sessions with you.</p>
            <p><a href='" . ZANE_SITE_URL . "/tutor/" . urlencode($name) . "' style='display:inline-block; padding:12px 24px; background:#16a34a; color:#fff; text-decoration:none; border-radius:8px;'>View Your Public Profile →</a></p>
            <p style='color:#666; font-size:12px; margin-top:30px;'>Keep your profile updated for better visibility in search results.</p>
        </div>
    ");
}

function zane_notify_verification_rejected($email, $name, $notes = '') {
    $notesHtml = $notes ? "<p><strong>Admin notes:</strong> {$notes}</p>" : '';
    zane_send_email($email, 'Action Required — Documents Need Revision', "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;>
            <h2 style='color: #071244;'>Hi {$name},</h2>
            <p>After reviewing your documents, we found a few issues that need to be corrected before your profile can go live.</p>
            {$notesHtml}
            <p>Please log in, update your documents, and resubmit for review.</p>
            <p><a href='" . ZANE_SITE_URL . "/dashboard' style='display:inline-block; padding:12px 24px; background:#dc2626; color:#fff; text-decoration:none; border-radius:8px;'>Update Documents →</a></p>
        </div>
    ");
}

function zane_notify_assessment_completed($email, $name, $score, $rating) {
    zane_send_email($email, 'Your Assessment Results Are Ready!', "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;>
            <h2 style='color: #071244;'>Hi {$name},</h2>
            <p>You've completed the Tutor Proficiency Assessment. Here's a summary:</p>
            <div style='background:#f0f4ff; padding:20px; border-radius:12px; text-align:center; margin:20px 0;>
                <p style='font-size:36px; font-weight:bold; color:#071244; margin:0;'>{$score}/100</p>
                <p style='font-size:14px; color:#666; margin:5px 0 0;'>{$rating}</p>
            </div>
            <p>Your results have been saved and are available in your dashboard. These insights help parents choose the right tutor.</p>
            <p><a href='" . ZANE_SITE_URL . "/assessment/results' style='display:inline-block; padding:12px 24px; background:#071244; color:#fff; text-decoration:none; border-radius:8px;'>View Full Results →</a></p>
        </div>
    ");
}

function zane_notify_nudge($email, $name, $step) {
    zane_send_email($email, "Friendly Reminder — Complete Your {$step}", "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;>
            <h2 style='color: #071244;'>Hi {$name},</h2>
            <p>We noticed you haven't completed the <strong>{$step}</strong> step yet. It only takes a few minutes!</p>
            <p>Completing your profile helps parents find and trust you, and unlocks more features on the platform.</p>
            <p><a href='" . ZANE_SITE_URL . "/dashboard' style='display:inline-block; padding:12px 24px; background:#071244; color:#fff; text-decoration:none; border-radius:8px;'>Continue Where You Left Off →</a></p>
            <p style='color:#666; font-size:12px; margin-top:30px;'>If you need help, reply to this email or WhatsApp us at +234 810 723 9402.</p>
        </div>
    ");
}

// ─────────────────────────────────────────────────────────────
// AUTH HELPERS (JWT)
// ─────────────────────────────────────────────────────────────

function zane_create_jwt($user_id, $email, $is_admin = false) {
    $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64_encode(json_encode([
        'sub' => $user_id,
        'email' => $email,
        'is_admin' => $is_admin,
        'iat' => time(),
        'exp' => time() + (7 * 24 * 3600),
    ]));
    $signature = base64_encode(hash_hmac('sha256', "$header.$payload", ZANE_JWT_SECRET, true));
    return "$header.$payload.$signature";
}

function zane_verify_jwt($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    [$header, $payload, $signature] = $parts;
    $expected = base64_encode(hash_hmac('sha256', "$header.$payload", ZANE_JWT_SECRET, true));
    if (!hash_equals($expected, $signature)) return false;
    $data = json_decode(base64_decode($payload), true);
    if ($data['exp'] < time()) return false;
    return $data;
}

function zane_get_auth_user($request) {
    $auth = $request->get_header('Authorization');
    if (!$auth || strpos($auth, 'Bearer ') !== 0) return false;
    $token = substr($auth, 7);
    return zane_verify_jwt($token);
}

function zane_require_admin($request) {
    $user = zane_get_auth_user($request);
    if (!$user || !$user['is_admin']) return false;
    return $user;
}

// ─────────────────────────────────────────────────────────────
// PROFILE HELPERS
// ─────────────────────────────────────────────────────────────

function zane_get_tutor_profile($user_id) {
    $user = get_userdata($user_id);
    if (!$user) return null;
    
    // Support both new and legacy metadata keys
    $subjects = get_user_meta($user_id, 'zane_subjects', true) ?: get_user_meta($user_id, 'teacher_subjects', true);
    $levels = get_user_meta($user_id, 'zane_preferred_levels', true) ?: get_user_meta($user_id, 'teacher_preferred_levels', true);
    $location = get_user_meta($user_id, 'zane_location', true) ?: get_user_meta($user_id, 'teacher_location', true);
    $qualification = get_user_meta($user_id, 'zane_qualification', true) ?: get_user_meta($user_id, 'teacher_qualification', true);
    $experience = get_user_meta($user_id, 'zane_experience', true) ?: get_user_meta($user_id, 'teacher_experience', true);
    $hourly_rate = get_user_meta($user_id, 'zane_hourly_rate', true) ?: get_user_meta($user_id, 'hourly_rate', true);
    $brief_intro = get_user_meta($user_id, 'zane_brief_intro', true) ?: get_user_meta($user_id, 'teacher_brief_intro', true);
    $availability_slots = get_user_meta($user_id, 'zane_availability_slots', true);
    $reviews = get_user_meta($user_id, 'zane_reviews', true) ?: [];
    $leads = get_user_meta($user_id, 'zane_tutor_leads', true) ?: [];
    $past_projects = get_user_meta($user_id, 'zane_past_projects', true) ?: [];
    $account_type = get_user_meta($user_id, 'zane_account_type', true) ?: '';
    $portal_intent = get_user_meta($user_id, 'zane_portal_intent', true) ?: (in_array('um_creator', (array) $user->roles) ? 'lms' : 'teach');
    $lms_teaching_track = get_user_meta($user_id, 'zane_lms_teaching_track', true) ?: 'general';
    $skill_categories = get_user_meta($user_id, 'zane_skill_categories', true) ?: [];
    $cached_lane = get_user_meta($user_id, 'zane_lane', true) ?: '';

    // New metadata (monthly plan opt-in and document details)
    $monthly_plan_optin = get_user_meta($user_id, 'zane_monthly_plan_optin', true);
    $uploaded_docs_detailed = get_user_meta($user_id, 'zane_uploaded_docs_detailed', true) ?: [];
    $ice_contact = get_user_meta($user_id, 'zane_ice_contact', true) ?: '';
    $guarantor_doc = get_user_meta($user_id, 'zane_guarantor_doc', true) ?: '';
    $nysc_id = get_user_meta($user_id, 'zane_nysc_id', true) ?: '';

    $user_roles = (array) $user->roles;
    $onboarding_step = get_user_meta($user_id, 'zane_onboarding_step', true);
    
    // STAGE MAPPING LOGIC (CRITICAL FOR ADMIN DASHBOARD GROUPING)
    if (!$onboarding_step) {
        if (in_array('verified_tutor', $user_roles) || in_array('top_rated_teacher', $user_roles)) {
            $onboarding_step = 'verification';
        } elseif (in_array('tutor', $user_roles) || in_array('teacher', $user_roles)) {
            $onboarding_step = 'verification';
        } elseif (in_array('contributor', $user_roles)) {
            $onboarding_step = 'profile';
        } else {
            $onboarding_step = 'signup';
        }
    }

    $is_verified = in_array('verified_tutor', $user_roles) || in_array('top_rated_teacher', $user_roles) || (bool) get_user_meta($user_id, 'zane_is_verified', true);

    return [
        'id' => (string) $user_id,
        'email' => $user->user_email,
        'firstName' => get_user_meta($user_id, 'first_name', true) ?: $user->display_name,
        'lastName' => get_user_meta($user_id, 'last_name', true) ?: '',
        'phone' => get_user_meta($user_id, 'zane_phone', true) ?: '',
        'location' => $location ?: 'Online/Flexible',
        'profilePhoto' => get_user_meta($user_id, 'zane_profile_photo', true) ?: '',
        'qualification' => $qualification ?: '',
        'subjects' => is_array($subjects) ? $subjects : ($subjects ? explode(',', $subjects) : []),
        'experience' => (int) $experience,
        'hourlyRate' => (int) $hourly_rate,
        'briefIntro' => $brief_intro ?: '',
        'preferredLevels' => is_array($levels) ? $levels : ($levels ? explode(',', $levels) : []),
        'currentWork' => get_user_meta($user_id, 'zane_current_work', true) ?: '',
        'availability' => get_user_meta($user_id, 'zane_availability', true) ?: '',
        'availabilitySlots' => is_array($availability_slots) ? $availability_slots : [],
        'teachingHistory' => get_user_meta($user_id, 'zane_teaching_history', true) ?: '',
        'classDelivery' => get_user_meta($user_id, 'zane_class_delivery', true) ?: '',
        'classType' => get_user_meta($user_id, 'zane_class_type', true) ?: '',
        'trcnCertified' => (bool) get_user_meta($user_id, 'zane_trcn_certified', true),
        'rating' => (float) get_user_meta($user_id, 'zane_rating', true),
        'reviewCount' => count($reviews),
        'reviews' => $reviews,
        'isVerified' => $is_verified,
        'verificationStatus' => get_user_meta($user_id, 'zane_verification_status', true) ?: ($is_verified ? 'approved' : 'pending'),
        'onboardingStep' => $onboarding_step,
        'createdAt' => get_user_meta($user_id, 'zane_created_at', true) ?: $user->user_registered,
        'roles' => $user_roles,
        'accountType' => $account_type,
        'portalIntent' => $portal_intent,
        'lmsTeachingTrack' => $lms_teaching_track,
        'pastProjects' => is_array($past_projects) ? $past_projects : [],
        'monthlyPlanOptIn' => (bool) $monthly_plan_optin,
        'skillCategories' => is_array($skill_categories) ? $skill_categories : ($skill_categories ? explode(',', $skill_categories) : []),
        'lane' => $cached_lane,
        'uploadedDocsDetailed' => is_array($uploaded_docs_detailed) ? $uploaded_docs_detailed : [],
        'iceContact' => $ice_contact,
        'guarantorDoc' => $guarantor_doc,
        'nyscId' => $nysc_id,
        'hiddenFromCatalogue' => (bool) get_user_meta($user_id, 'zane_hidden_from_catalogue', true),
        'assignedLeads' => array_values(array_filter($leads, fn($l) => ($l['status'] ?? '') === 'forwarded'))
    ];
}

function zane_get_public_tutor_profile($user_id) {
    $p = zane_get_tutor_profile($user_id);
    if (!$p) return null;
    unset($p['email'], $p['phone'], $p['adminNotes'], $p['lastNudgedAt']);
    // Strip private project links — the public catalogue should not expose them
    if (!empty($p['pastProjects']) && is_array($p['pastProjects'])) {
        $p['pastProjects'] = array_map(function($proj) {
            unset($proj['link']);
            return $proj;
        }, $p['pastProjects']);
    }
    return $p;
}

// ─────────────────────────────────────────────────────────────
// REST API ENDPOINTS
// ─────────────────────────────────────────────────────────────

add_action('rest_api_init', function() {
    // Register um_creator role if not exists
    if (!get_role('um_creator')) {
        add_role('um_creator', 'LMS Partner Creator', [
            'read' => true,
            'edit_posts' => false,
            'delete_posts' => false,
        ]);
    }

    $ns = 'zane/v1';

    // ───────────────────────────────────────────────
    // RATE LIMIT HELPER (simple IP-based throttle)
    // ───────────────────────────────────────────────
    function zane_check_rate_limit($name, $max = 10, $window = 60) {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $key = 'zane_rl_' . $name . '_' . md5($ip);
        $data = get_transient($key);
        if (!$data) $data = ['count' => 0, 'first' => time()];
        $data['count']++;
        if ($data['count'] > $max && (time() - $data['first']) < $window) {
            return new WP_Error('rate_limited', 'Too many requests. Please try again later.', ['status' => 429]);
        }
        set_transient($key, $data, $window);
        return true;
    }

    // ───────────────────────────────────────────────
    // AUTH HELPER — validates JWT + returns user data
    // ───────────────────────────────────────────────
    function zane_authenticate_request($request) {
        $auth = zane_get_auth_user($request);
        if (!$auth) return false;
        return $auth;
    }

    // --- AUTH ---
    register_rest_route($ns, '/auth/login', [
        'methods' => 'POST',
        'callback' => function($request) {
            // Rate limit: 5 attempts per minute per IP
            $rate = zane_check_rate_limit('login', 5, 60);
            if (is_wp_error($rate)) return $rate;

            $email = sanitize_email($request->get_param('email'));
            $password = $request->get_param('password');
            $user = get_user_by('email', $email);
            if (!$user || !wp_check_password($password, $user->user_pass, $user->ID)) {
                return new WP_Error('invalid', 'Invalid email or password.', ['status' => 401]);
            }
            $is_admin = in_array('administrator', $user->roles);
            return [
                'token' => zane_create_jwt($user->ID, $email, $is_admin),
                'user' => zane_get_tutor_profile($user->ID),
                'is_admin' => $is_admin
            ];
        },
        'permission_callback' => '__return_true',
    ]);

    register_rest_route($ns, '/auth/signup', [
        'methods' => 'POST',
        'callback' => function($request) {
            // Rate limit: 3 signups per 5 minutes per IP
            $rate = zane_check_rate_limit('signup', 3, 300);
            if (is_wp_error($rate)) return $rate;

            $email = sanitize_email($request->get_param('email'));
            $password = $request->get_param('password');
            if (email_exists($email)) return new WP_Error('exists', 'Email exists', ['status' => 409]);
            
            // Password complexity check
            if (strlen($password) < 8) {
                return new WP_Error('weak_password', 'Password must be at least 8 characters.', ['status' => 400]);
            }
            
            $uid = wp_create_user($email, $password, $email);
            if (is_wp_error($uid)) return $uid;
            
            $user = new WP_User($uid);
            $type = sanitize_text_field($request->get_param('accountType'));
            $intent = sanitize_text_field($request->get_param('portalIntent'));
            $lms_track = sanitize_text_field($request->get_param('lmsTeachingTrack'));
            
            // Store consent date server-side
            $consent = $request->get_param('privacyConsent');
            if ($consent) update_user_meta($uid, 'zane_privacy_consent_date', current_time('mysql'));
            
            if ($intent === 'lms') {
                $user->set_role('um_creator');
            } elseif ($type === 'skill') {
                $user->set_role('teacher');
            } else {
                $user->set_role('contributor');
            }
            
            if ($type) update_user_meta($uid, 'zane_account_type', $type);
            if ($intent) update_user_meta($uid, 'zane_portal_intent', $intent);
            if ($lms_track) update_user_meta($uid, 'zane_lms_teaching_track', $lms_track);
            
            update_user_meta($uid, 'first_name', sanitize_text_field($request->get_param('firstName')));
            update_user_meta($uid, 'last_name', sanitize_text_field($request->get_param('lastName')));
            update_user_meta($uid, 'zane_phone', sanitize_text_field($request->get_param('phone')));
            update_user_meta($uid, 'zane_location', sanitize_text_field($request->get_param('location')));
            update_user_meta($uid, 'zane_onboarding_step', 'profile');
            update_user_meta($uid, 'zane_created_at', current_time('Y-m-d'));

            // Send welcome email
            $name = sanitize_text_field($request->get_param('firstName'));
            zane_notify_registration($email, $name);

            return [
                'token' => zane_create_jwt($uid, $email, false),
                'user' => zane_get_tutor_profile($uid)
            ];
        },
        'permission_callback' => '__return_true'
    ]);
    
    // --- CHANGE PASSWORD ---
    register_rest_route($ns, '/auth/change-password', [
        'methods' => 'POST',
        'callback' => function($request) {
            $auth = zane_get_auth_user($request);
            if (!$auth) return new WP_Error('unauthorized', 'Invalid token', ['status' => 401]);
            
            $p = $request->get_json_params();
            $current = $p['currentPassword'] ?? '';
            $new_pass = $p['newPassword'] ?? '';
            
            if (strlen($new_pass) < 8) {
                return new WP_Error('weak_password', 'New password must be at least 8 characters.', ['status' => 400]);
            }
            
            $user = get_userdata($auth['sub']);
            if (!$user || !wp_check_password($current, $user->user_pass, $user->ID)) {
                return new WP_Error('invalid_password', 'Current password is incorrect.', ['status' => 400]);
            }
            
            wp_set_password($new_pass, $user->ID);
            
            // Re-issue JWT since old one was signed with old state
            $is_admin = in_array('administrator', $user->roles);
            return [
                'success' => true,
                'message' => 'Password changed successfully.',
                'token' => zane_create_jwt($user->ID, $user->user_email, $is_admin)
            ];
        },
        'permission_callback' => '__return_true'
    ]);

    // --- CATALOGUE ---
    register_rest_route($ns, '/tutor-catalogue', [
        'methods' => 'GET',
        'callback' => function() {
            $users = get_users(['role__in' => ['contributor', 'tutor', 'verified_tutor', 'teacher', 'top_rated_teacher']]);
            $tutors = [];
            foreach ($users as $u) {
                $p = zane_get_public_tutor_profile($u->ID);
                if ($p && $p['portalIntent'] === 'teach' && ($p['isVerified'] || $p['onboardingStep'] === 'verification')) {
                    $tutors[] = $p;
                }
            }
            return $tutors;
        },
        'permission_callback' => '__return_true'
    ]);

    // --- ADVANCE STEP ---
    register_rest_route($ns, '/tutor/advance-step', [
        'methods' => 'POST',
        'callback' => function($request) {
            $auth = zane_get_auth_user($request);
            if (!$auth) return new WP_Error('unauthorized', 'Invalid token', ['status' => 401]);
            
            $p = $request->get_json_params();
            if (isset($p['step'])) {
                update_user_meta($auth['sub'], 'zane_onboarding_step', sanitize_text_field($p['step']));
            }
            return rest_ensure_response(['success' => true, 'step' => $p['step']]);
        },
        'permission_callback' => '__return_true'
    ]);

    // --- PROFILE ---
    register_rest_route($ns, '/tutor/profile', [
        'methods' => ['GET', 'POST'],
        'callback' => function($request) {
            $auth = zane_get_auth_user($request);
            if (!$auth) return new WP_Error('unauthorized', 'Invalid token', ['status' => 401]);
            $uid = $auth['sub'];
            
            if ($request->get_method() === 'POST') {
                $p = $request->get_json_params();
                $meta_map = [
                    'firstName' => 'first_name', 'lastName' => 'last_name',
                    'phone' => 'zane_phone', 'location' => 'zane_location',
                    'qualification' => 'zane_qualification', 'subjects' => 'zane_subjects',
                    'experience' => 'zane_experience', 'hourlyRate' => 'zane_hourly_rate',
                    'briefIntro' => 'zane_brief_intro', 'preferredLevels' => 'zane_preferred_levels',
                    'availabilitySlots' => 'zane_availability_slots', 'classType' => 'zane_class_type',
                    'currentWork' => 'zane_current_work', 'teachingHistory' => 'zane_teaching_history',
                    'classDelivery' => 'zane_class_delivery', 'trcnCertified' => 'zane_trcn_certified',
                    'availability' => 'zane_availability', 'pastProjects' => 'zane_past_projects',
                    'profilePhoto' => 'zane_profile_photo',
                    'accountType' => 'zane_account_type', 'portalIntent' => 'zane_portal_intent',
                    'lmsTeachingTrack' => 'zane_lms_teaching_track',
                    'monthlyPlanOptIn' => 'zane_monthly_plan_optin',
                    'uploadedDocsDetailed' => 'zane_uploaded_docs_detailed',
                    'iceContact' => 'zane_ice_contact',
                    'guarantorDoc' => 'zane_guarantor_doc',
                    'nyscId' => 'zane_nysc_id',
                    'skillCategories' => 'zane_skill_categories',
                    'lane' => 'zane_lane'
                ];
                foreach ($meta_map as $param => $meta) {
                    if (isset($p[$param])) update_user_meta($uid, $meta, $p[$param]);
                }
            }
            return zane_get_tutor_profile($uid);
        },
        'permission_callback' => '__return_true'
    ]);

    // --- ADMIN VERIFY ---
    register_rest_route($ns, '/admin/verify', [
        'methods' => 'POST',
        'callback' => function($request) {
            if (!zane_require_admin($request)) return new WP_Error('forbidden', 'Admin only', ['status' => 403]);
            $p = $request->get_json_params();
            $tutorId = sanitize_text_field($p['tutorId']);
            $status = sanitize_text_field($p['status']); // 'approved' or 'rejected'
            $notes = isset($p['notes']) ? sanitize_textarea_field($p['notes']) : '';
            
            $user = get_userdata($tutorId);
            if (!$user) return new WP_Error('not_found', 'Tutor not found', ['status' => 404]);
            
            update_user_meta($tutorId, 'zane_verification_status', $status);
            if ($notes) update_user_meta($tutorId, 'zane_admin_notes', $notes);
            
            if ($status === 'approved') {
                $user_obj = new WP_User($tutorId);
                $user_obj->add_role('verified_tutor');
                update_user_meta($tutorId, 'zane_is_verified', true);
                zane_notify_verification_approved($user->user_email, get_user_meta($tutorId, 'first_name', true) ?: $user->display_name);
            } elseif ($status === 'rejected') {
                zane_notify_verification_rejected($user->user_email, get_user_meta($tutorId, 'first_name', true) ?: $user->display_name, $notes);
            }
            
            return ['success' => true, 'status' => $status];
        },
        'permission_callback' => '__return_true',
    ]);

    // --- ADMIN NUDGE ---
    register_rest_route($ns, '/admin/nudge', [
        'methods' => 'POST',
        'callback' => function($request) {
            if (!zane_require_admin($request)) return new WP_Error('forbidden', 'Admin only', ['status' => 403]);
            $p = $request->get_json_params();
            $tutorId = sanitize_text_field($p['tutorId']);
            
            $user = get_userdata($tutorId);
            if (!$user) return new WP_Error('not_found', 'Tutor not found', ['status' => 404]);
            
            update_user_meta($tutorId, 'zane_last_nudged_at', current_time('mysql'));
            
            $step = get_user_meta($tutorId, 'zane_onboarding_step', true) ?: 'profile';
            $stepLabels = ['signup' => 'Account Setup', 'profile' => 'Profile Completion', 'test' => 'Assessment', 'verification' => 'Verification'];
            $stepLabel = $stepLabels[$step] ?? $step;
            
            zane_notify_nudge($user->user_email, get_user_meta($tutorId, 'first_name', true) ?: $user->display_name, $stepLabel);
            
            return ['success' => true];
        },
        'permission_callback' => '__return_true',
    ]);

    // --- LEADS ---
    register_rest_route($ns, '/leads', [
        'methods' => 'POST',
        'callback' => function($request) {
            $p = $request->get_json_params();
            $tid = $p['tutorId'];
            $leads = get_user_meta($tid, 'zane_tutor_leads', true) ?: [];
            $leads[] = [
                'id' => uniqid(), 'date' => current_time('mysql'),
                'parentName' => sanitize_text_field($p['parentName']),
                'parentPhone' => sanitize_text_field($p['parentPhone']),
                'message' => sanitize_textarea_field($p['message']),
                'offerAmount' => $p['offerAmount'] ?? '',
                'status' => 'new'
            ];
            update_user_meta($tid, 'zane_tutor_leads', $leads);
            return ['success' => true];
        },
        'permission_callback' => '__return_true'
    ]);

    // --- ADMIN ---
    register_rest_route($ns, '/admin/tutors', [
        'methods' => 'GET',
        'callback' => function($request) {
            if (!zane_require_admin($request)) return new WP_Error('forbidden', 'Admin only', ['status' => 403]);
            $users = get_users(['role__in' => ['contributor', 'tutor', 'verified_tutor', 'teacher', 'top_rated_teacher', 'um_creator']]);
            return array_map(fn($u) => zane_get_tutor_profile($u->ID), $users);
        },
        'permission_callback' => '__return_true'
    ]);

    register_rest_route($ns, '/admin/leads', [
        'methods' => 'GET',
        'callback' => function($request) {
            if (!zane_require_admin($request)) return new WP_Error('forbidden', 'Admin only', ['status' => 403]);
            $users = get_users(['role__in' => ['contributor', 'tutor', 'verified_tutor', 'teacher', 'top_rated_teacher', 'um_creator']]);
            $all = [];
            foreach ($users as $u) {
                $leads = get_user_meta($u->ID, 'zane_tutor_leads', true) ?: [];
                foreach ($leads as $l) {
                    if (($l['status'] ?? '') === 'archived') continue;
                    $l['tutorId'] = $u->ID;
                    $l['tutorName'] = $u->display_name;
                    $all[] = $l;
                }
            }
            return $all;
        },
        'permission_callback' => '__return_true'
    ]);

    register_rest_route($ns, '/admin/leads/archive', [
        'methods' => 'POST',
        'callback' => function($request) {
            if (!zane_require_admin($request)) return new WP_Error('forbidden', 'Admin only', ['status' => 403]);
            $p = $request->get_json_params();
            $leads = get_user_meta($p['tutorId'], 'zane_tutor_leads', true) ?: [];
            foreach ($leads as &$l) { if ($l['id'] === $p['leadId']) $l['status'] = 'archived'; }
            update_user_meta($p['tutorId'], 'zane_tutor_leads', $leads);
            return ['success' => true];
        },
        'permission_callback' => '__return_true'
    ]);

    // --- SETTINGS ---
    register_rest_route($ns, '/settings', [
        'methods' => ['GET', 'POST'],
        'callback' => function($request) {
            if ($request->get_method() === 'POST') {
                if (!zane_require_admin($request)) return new WP_Error('forbidden', 'Admin only', ['status' => 403]);
                $p = $request->get_json_params();
                $map = [
                    'whatsappNumber' => 'zane_whatsapp_number',
                    'contactEmail' => 'zane_contact_email',
                    'commissionRate' => 'zane_commission_rate',
                    'portalNotice' => 'zane_portal_notice',
                    'showSkillsCatalogue' => 'zane_show_skills_catalogue',
                    'showAcademicsCatalogue' => 'zane_show_academics_catalogue',
                ];
                foreach ($map as $k => $opt) {
                    if (array_key_exists($k, $p)) update_option($opt, $p[$k]);
                }
            }
            return [
                'whatsappNumber' => get_option('zane_whatsapp_number', '2348108325024'),
                'contactEmail' => get_option('zane_contact_email', get_option('admin_email')),
                'commissionRate' => (int) get_option('zane_commission_rate', 30),
                'portalNotice' => get_option('zane_portal_notice', 'Welcome to the Zane Tutor Portal!'),
                'showSkillsCatalogue' => (bool) get_option('zane_show_skills_catalogue', true),
                'showAcademicsCatalogue' => (bool) get_option('zane_show_academics_catalogue', true),
            ];
        },
        'permission_callback' => '__return_true'
    ]);

    // --- CUSTOM UPLOAD HELPER (stores files OUTSIDE WP media library) ---
    // Files live in wp-content/uploads/zane-uploads/{photos|docs}/{user_id}/
    // They are directly accessible via URL but do NOT appear in the Media Library.
    function zane_custom_upload($file_param, $subfolder, $user_id) {
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        if (empty($file_param) || !is_array($file_param)) {
            return new WP_Error('no_file', 'No file provided.', ['status' => 400]);
        }
        if ($file_param['error'] !== UPLOAD_ERR_OK) {
            return new WP_Error('upload_error', 'Upload error: ' . $file_param['error'], ['status' => 500]);
        }
        $max_size = 10 * 1024 * 1024; // 10 MB
        if ($file_param['size'] > $max_size) {
            return new WP_Error('too_large', 'File exceeds 10 MB limit.', ['status' => 400]);
        }
        $allowed = ['image/jpeg','image/png','image/gif','image/webp','application/pdf','image/svg+xml'];
        if (!in_array($file_param['type'], $allowed)) {
            return new WP_Error('invalid_type', 'File type not allowed.', ['status' => 400]);
        }
        $upload_dir = wp_upload_dir();
        $base = $upload_dir['basedir'] . '/zane-uploads/' . $subfolder . '/' . $user_id;
        if (!file_exists($base)) wp_mkdir_p($base);
        $ext  = pathinfo($file_param['name'], PATHINFO_EXTENSION);
        $filename = wp_unique_filename($base, 'upload_' . time() . '.' . $ext);
        $filepath = $base . '/' . $filename;
        if (!move_uploaded_file($file_param['tmp_name'], $filepath)) {
            return new WP_Error('move_failed', 'Could not save file.', ['status' => 500]);
        }
        $relative = 'wp-content/uploads/zane-uploads/' . $subfolder . '/' . $user_id . '/' . $filename;
        $url = site_url('/' . $relative);
        return ['url' => $url, 'filename' => $filename, 'path' => $filepath];
    }

    // --- UPLOAD ENDPOINTS ---
    register_rest_route($ns, '/tutor/upload-photo', [
        'methods' => 'POST',
        'callback' => function($request) {
            $auth = zane_get_auth_user($request);
            if (!$auth) return new WP_Error('unauthorized', 'Invalid token.', ['status' => 401]);
            $files = $request->get_file_params();
            $result = zane_custom_upload($files['photo'] ?? null, 'photos', $auth['sub']);
            if (is_wp_error($result)) return $result;
            $url = $result['url'];
            update_user_meta($auth['sub'], 'zane_profile_photo', $url);
            update_user_meta($auth['sub'], 'profile_photo', $url);
            return rest_ensure_response(['url' => $url]);
        },
        'permission_callback' => '__return_true',
    ]);

    register_rest_route($ns, '/tutor/upload-doc', [
        'methods' => 'POST',
        'callback' => function($request) {
            $auth = zane_get_auth_user($request);
            if (!$auth) return new WP_Error('unauthorized', 'Invalid token.', ['status' => 401]);
            $files = $request->get_file_params();
            $result = zane_custom_upload($files['file'] ?? null, 'docs', $auth['sub']);
            if (is_wp_error($result)) return $result;
            $url = $result['url'];

            // If the frontend provided a docKey and optional expiryDate, persist detailed document metadata
            $docKey = $request->get_param('docKey');
            $expiry = $request->get_param('expiryDate');
            if ($docKey) {
                $docKey = sanitize_text_field($docKey);
                $expiry = $expiry ? sanitize_text_field($expiry) : null;
                $detailed = get_user_meta($auth['sub'], 'zane_uploaded_docs_detailed', true) ?: [];
                $detailed[$docKey] = [
                    'url' => $url,
                    'fileName' => $result['filename'],
                    'uploadedAt' => current_time('mysql'),
                ];
                if ($expiry) $detailed[$docKey]['expiryDate'] = $expiry;
                update_user_meta($auth['sub'], 'zane_uploaded_docs_detailed', $detailed);

                // Maintain backward-compatible flat map
                $flat = get_user_meta($auth['sub'], 'zane_uploaded_docs', true) ?: [];
                $flat[$docKey] = $url;
                update_user_meta($auth['sub'], 'zane_uploaded_docs', $flat);
            }

            return rest_ensure_response(['url' => $url, 'docKey' => $docKey ?? null]);
        },
        'permission_callback' => '__return_true',
    ]);
});

// ─────────────────────────────────────────────────────────────
// ADMIN UI SETTINGS
// ─────────────────────────────────────────────────────────────

add_action('admin_menu', function() {
    add_menu_page('Zane Portal Settings', 'Zane Settings', 'manage_options', 'zane-settings', 'zane_render_settings_page');
});

add_action('admin_init', function() {
    register_setting('zane_settings_group', 'zane_whatsapp_number');
    register_setting('zane_settings_group', 'zane_contact_email');
    register_setting('zane_settings_group', 'zane_commission_rate');
    register_setting('zane_settings_group', 'zane_portal_notice');
    register_setting('zane_settings_group', 'zane_show_skills_catalogue');
    register_setting('zane_settings_group', 'zane_show_academics_catalogue');
});

// Register user meta keys so they can be exposed and managed reliably
add_action('init', function() {
    if (function_exists('register_user_meta')) {
        register_user_meta('user', 'zane_monthly_plan_optin', [
            'type' => 'boolean', 'description' => 'Monthly plan opt-in flag', 'single' => true, 'show_in_rest' => true
        ]);
        register_user_meta('user', 'zane_ice_contact', [
            'type' => 'string', 'description' => 'In-case-of-emergency contact', 'single' => true, 'show_in_rest' => true
        ]);
        register_user_meta('user', 'zane_guarantor_doc', [
            'type' => 'string', 'description' => 'Guarantor document URL', 'single' => true, 'show_in_rest' => true
        ]);
        register_user_meta('user', 'zane_nysc_id', [
            'type' => 'string', 'description' => 'NYSC ID document URL', 'single' => true, 'show_in_rest' => true
        ]);
        register_user_meta('user', 'zane_uploaded_docs_detailed', [
            'type' => 'object', 'description' => 'Detailed uploaded docs with expiry and metadata', 'single' => true, 'show_in_rest' => true
        ]);
        register_user_meta('user', 'zane_skill_categories', [
            'type' => 'array', 'description' => 'Skill categories (for skills/lms_creator lanes)', 'single' => true, 'show_in_rest' => true
        ]);
        register_user_meta('user', 'zane_lane', [
            'type' => 'string', 'description' => 'Cached resolved lane', 'single' => true, 'show_in_rest' => true
        ]);
    }
});

function zane_render_settings_page() {
    ?>
    <div class="wrap">
        <h1>Zane Portal – Master Settings</h1>
        <form method="post" action="options.php">
            <?php settings_fields('zane_settings_group'); ?>
            <table class="form-table">
                <tr><th>WhatsApp Number</th><td><input type="text" name="zane_whatsapp_number" value="<?php echo esc_attr(get_option('zane_whatsapp_number')); ?>" /></td></tr>
                <tr><th>Show Academic Catalogue</th><td><input type="checkbox" name="zane_show_academics_catalogue" value="1" <?php checked(1, get_option('zane_show_academics_catalogue', 1)); ?> /></td></tr>
                <tr><th>Show Skills Catalogue</th><td><input type="checkbox" name="zane_show_skills_catalogue" value="1" <?php checked(1, get_option('zane_show_skills_catalogue', 1)); ?> /></td></tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}

// ─────────────────────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────────────────────

add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        $origin = get_http_origin();
        $allowed = ['https://book.zanetutors.com.ng', 'https://classes.zanetutors.com.ng', 'https://facilitator.zanetutors.com.ng', 'https://zane-tutor-portal.vercel.app', 'http://localhost:5173'];
        if (in_array($origin, $allowed) || preg_match('/\.lovable\.app$/', parse_url($origin, PHP_URL_HOST) ?? '')) {
            header("Access-Control-Allow-Origin: $origin");
            header('Access-Control-Allow-Credentials: true');
        }
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Authorization, Content-Type');
        return $value;
    });
}, 15);

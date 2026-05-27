<?php
/**
 * ZaneTutors Unified API
 * 
 * Add this file to wp-content/plugins/zane-unified-api.php
 * Then activate it from the WordPress admin Plugins page.
 */

/*
Plugin Name: ZaneTutors Unified API
Description: Unified REST API for Tutor Profiles, Catalogue, Assessments, and Settings.
Version: 2.2
Author: ZaneTutors
*/

if (!defined('ABSPATH')) exit;

// ============================================================
// DATABASE SETUP
// ============================================================

function zane_create_tables() {
    global $wpdb;
    $charset = $wpdb->get_charset_collate();

    $tokens_table = $wpdb->prefix . 'zane_auth_tokens';
    $assessments_table = $wpdb->prefix . 'zane_assessments';

    $sql = "CREATE TABLE $tokens_table (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        user_id bigint(20) NOT NULL,
        token_hash varchar(255) NOT NULL,
        expires_at datetime NOT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY user_id (user_id),
        KEY token_hash (token_hash)
    ) $charset;

    CREATE TABLE $assessments_table (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        user_id bigint(20) NOT NULL,
        result_data longtext NOT NULL,
        overall_score int(3) NOT NULL DEFAULT 0,
        readiness_level varchar(50) NOT NULL DEFAULT '',
        subjects text NOT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY user_id (user_id),
        KEY created_at (created_at)
    ) $charset;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}
register_activation_hook(__FILE__, 'zane_create_tables');

// Ensure tables exist
add_action('init', function() {
    global $wpdb;
    if (get_option('zane_unified_api_db_version') !== '2.2') {
        zane_create_tables();
        update_option('zane_unified_api_db_version', '2.2');
    }
});

// ============================================================
// CORS & AUTH HELPERS
// ============================================================

add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        $origin = get_http_origin();
        $allowed_origins = [
            'https://facilitator.zanetutors.com.ng',
            'https://classes.zanetutors.com.ng',
            'https://zane-tutor-portal.vercel.app',
            'http://localhost:5173',
            'http://localhost:8080',
        ];
        if (in_array($origin, $allowed_origins) || preg_match('/\.lovable\.app$/', parse_url($origin, PHP_URL_HOST) ?? '')) {
            header("Access-Control-Allow-Origin: $origin");
            header('Access-Control-Allow-Credentials: true');
        }
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE, PUT');
        header('Access-Control-Allow-Headers: Authorization, Content-Type');
        return $value;
    });
}, 15);

function zane_get_current_user_id() {
    $auth = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
    if (strpos($auth, 'Bearer ') !== 0) return null;
    $token = substr($auth, 7);
    
    global $wpdb;
    $table = $wpdb->prefix . 'zane_auth_tokens';
    $hash = hash('sha256', $token);
    
    $row = $wpdb->get_row($wpdb->prepare(
        "SELECT user_id FROM $table WHERE token_hash = %s AND expires_at > NOW()",
        $hash
    ));
    
    return $row ? (int) $row->user_id : null;
}

// ============================================================
// TUTOR PROFILE HELPERS
// ============================================================

function zane_get_tutor_profile($user_id) {
    $user = get_userdata($user_id);
    if (!$user) return null;
    
    $subjects = get_user_meta($user_id, 'zane_subjects', true) ?: get_user_meta($user_id, 'teacher_subjects', true);
    $levels = get_user_meta($user_id, 'zane_preferred_levels', true) ?: get_user_meta($user_id, 'teacher_preferred_levels', true);
    $location = get_user_meta($user_id, 'zane_location', true) ?: get_user_meta($user_id, 'teacher_location', true);
    $qualification = get_user_meta($user_id, 'zane_qualification', true) ?: get_user_meta($user_id, 'teacher_qualification', true);
    $experience = get_user_meta($user_id, 'zane_experience', true) ?: get_user_meta($user_id, 'teacher_experience', true);
    $hourly_rate = get_user_meta($user_id, 'zane_hourly_rate', true) ?: get_user_meta($user_id, 'hourly_rate', true);
    $brief_intro = get_user_meta($user_id, 'zane_brief_intro', true) ?: get_user_meta($user_id, 'teacher_brief_intro', true);
    $leads = get_user_meta($user_id, 'zane_tutor_leads', true) ?: [];

    $user_roles = (array) $user->roles;
    $is_verified = in_array('verified_tutor', $user_roles) || in_array('top_rated_teacher', $user_roles) || (bool) get_user_meta($user_id, 'zane_is_verified', true);

    return [
        'id' => (string) $user_id,
        'email' => $user->user_email,
        'firstName' => get_user_meta($user_id, 'first_name', true) ?: $user->display_name,
        'lastName' => get_user_meta($user_id, 'last_name', true) ?: '',
        'phone' => get_user_meta($user_id, 'zane_phone', true) ?: '',
        'location' => $location ?: 'Online/Flexible',
        'qualification' => $qualification ?: '',
        'subjects' => is_array($subjects) ? $subjects : ($subjects ? explode(',', $subjects) : []),
        'experience' => (int) $experience,
        'hourlyRate' => (int) $hourly_rate,
        'briefIntro' => $brief_intro ?: '',
        'preferredLevels' => is_array($levels) ? $levels : ($levels ? explode(',', $levels) : []),
        'currentWork' => get_user_meta($user_id, 'zane_current_work', true) ?: '',
        'availability' => get_user_meta($user_id, 'zane_availability', true) ?: '',
        'isVerified' => $is_verified,
        'onboardingStep' => get_user_meta($user_id, 'zane_onboarding_step', true) ?: 'profile',
        'createdAt' => get_user_meta($user_id, 'zane_created_at', true) ?: $user->user_registered,
        'roles' => $user_roles,
        'assignedLeads' => array_values(array_filter($leads, fn($l) => ($l['status'] ?? '') === 'forwarded'))
    ];
}

// ============================================================
// ENDPOINTS
// ============================================================

add_action('rest_api_init', function() {
    $ns = 'zane/v1';

    // --- SETTINGS ---
    register_rest_route($ns, '/settings', [
        'methods' => 'GET',
        'callback' => function() {
            return [
                'whatsappNumber' => get_option('zane_whatsapp_number', '2348108325024'),
                'contactEmail' => get_option('zane_contact_email', 'admin@zanetutors.com.ng'),
                'commissionRate' => (int) get_option('zane_commission_rate', 30),
                'portalNotice' => get_option('zane_portal_notice', 'Welcome to the Zane Tutor Portal!'),
                'showSkillsCatalogue' => (bool) get_option('zane_show_skills_catalogue', true),
                'showAcademicsCatalogue' => (bool) get_option('zane_show_academics_catalogue', true),
            ];
        },
        'permission_callback' => '__return_true',
    ]);

    // --- AUTH ---
    register_rest_route($ns, '/auth/signup', [
        'methods' => 'POST',
        'callback' => function($req) {
            $email = sanitize_email($req['email']);
            $user_id = wp_create_user($email, $req['password'], $email);
            if (is_wp_error($user_id)) return $user_id;

            $user = new WP_User($user_id);
            if (($req['accountType'] ?? '') === 'skill') $user->set_role('teacher');
            else $user->set_role('contributor');

            update_user_meta($user_id, 'first_name', sanitize_text_field($req['firstName']));
            update_user_meta($user_id, 'last_name', sanitize_text_field($req['lastName']));
            update_user_meta($user_id, 'zane_phone', sanitize_text_field($req['phone']));
            update_user_meta($user_id, 'zane_location', sanitize_text_field($req['location']));
            update_user_meta($user_id, 'zane_onboarding_step', 'profile');

            $token = wp_generate_password(64, false);
            global $wpdb;
            $wpdb->insert($wpdb->prefix . 'zane_auth_tokens', [
                'user_id' => $user_id, 'token_hash' => hash('sha256', $token),
                'expires_at' => date('Y-m-d H:i:s', time() + 7 * DAY_IN_SECONDS)
            ]);
            return ['token' => $token, 'user' => zane_get_tutor_profile($user_id)];
        },
        'permission_callback' => '__return_true'
    ]);

    register_rest_route($ns, '/auth/login', [
        'methods' => 'POST',
        'callback' => function($req) {
            $user = wp_authenticate($req['email'], $req['password']);
            if (is_wp_error($user)) {
                $u_email = get_user_by('email', $req['email']);
                if ($u_email) $user = wp_authenticate($u_email->user_login, $req['password']);
            }
            if (is_wp_error($user)) return new WP_Error('auth_failed', 'Invalid credentials', ['status' => 401]);

            $token = wp_generate_password(64, false);
            global $wpdb;
            $wpdb->insert($wpdb->prefix . 'zane_auth_tokens', [
                'user_id' => $user->ID, 'token_hash' => hash('sha256', $token),
                'expires_at' => date('Y-m-d H:i:s', time() + 7 * DAY_IN_SECONDS)
            ]);
            return ['token' => $token, 'user' => zane_get_tutor_profile($user->ID), 'is_admin' => in_array('administrator', $user->roles)];
        },
        'permission_callback' => '__return_true'
    ]);

    // --- TUTOR CATALOGUE ---
    register_rest_route($ns, '/tutor-catalogue', [
        'methods' => 'GET',
        'callback' => function() {
            $users = get_users(['role__in' => ['contributor', 'tutor', 'verified_tutor', 'teacher', 'top_rated_teacher']]);
            $tutors = [];
            foreach ($users as $u) {
                $p = zane_get_tutor_profile($u->ID);
                if ($p['isVerified'] || $p['onboardingStep'] === 'verification' || in_array('top_rated_teacher', $p['roles'])) {
                    $tutors[] = $p;
                }
            }
            return $tutors;
        },
        'permission_callback' => '__return_true'
    ]);

    // --- PROFILE ---
    register_rest_route($ns, '/tutor/profile', [
        'methods' => ['GET', 'POST'],
        'callback' => function($req) {
            $uid = zane_get_current_user_id();
            if (!$uid) return new WP_Error('unauthorized', 'Auth required', ['status' => 401]);
            if ($req->get_method() === 'POST') {
                $p = $req->get_json_params();
                if (isset($p['firstName'])) update_user_meta($uid, 'first_name', sanitize_text_field($p['firstName']));
                if (isset($p['lastName'])) update_user_meta($uid, 'last_name', sanitize_text_field($p['lastName']));
                if (isset($p['phone'])) update_user_meta($uid, 'zane_phone', sanitize_text_field($p['phone']));
                if (isset($p['location'])) update_user_meta($uid, 'zane_location', sanitize_text_field($p['location']));
                if (isset($p['subjects'])) update_user_meta($uid, 'zane_subjects', $p['subjects']);
                if (isset($p['preferredLevels'])) update_user_meta($uid, 'zane_preferred_levels', $p['preferredLevels']);
                if (isset($p['hourlyRate'])) update_user_meta($uid, 'zane_hourly_rate', (int)$p['hourlyRate']);
                if (isset($p['experience'])) update_user_meta($uid, 'zane_experience', (int)$p['experience']);
                if (isset($p['briefIntro'])) update_user_meta($uid, 'zane_brief_intro', sanitize_textarea_field($p['briefIntro']));
                if (isset($p['qualification'])) update_user_meta($uid, 'zane_qualification', sanitize_text_field($p['qualification']));
            }
            return zane_get_tutor_profile($uid);
        },
        'permission_callback' => '__return_true'
    ]);

    // --- LEADS ---
    register_rest_route($ns, '/leads', [
        'methods' => 'POST',
        'callback' => function($req) {
            $p = $req->get_json_params();
            $tid = $p['tutorId'];
            $leads = get_user_meta($tid, 'zane_tutor_leads', true) ?: [];
            $leads[] = [
                'id' => uniqid(), 'date' => current_time('mysql'),
                'parentName' => sanitize_text_field($p['parentName']),
                'parentPhone' => sanitize_text_field($p['parentPhone']),
                'message' => sanitize_textarea_field($p['message']),
                'offerAmount' => sanitize_text_field($p['offerAmount'] ?? ''),
                'status' => 'new'
            ];
            update_user_meta($tid, 'zane_tutor_leads', $leads);
            return ['success' => true];
        },
        'permission_callback' => '__return_true'
    ]);

    register_rest_route($ns, '/tutor/assigned-leads', [
        'methods' => 'GET',
        'callback' => function() {
            $uid = zane_get_current_user_id();
            if (!$uid) return new WP_Error('unauthorized', 'Auth required', ['status' => 401]);
            $leads = get_user_meta($uid, 'zane_tutor_leads', true) ?: [];
            return array_values(array_filter($leads, fn($l) => ($l['status'] ?? '') === 'forwarded'));
        },
        'permission_callback' => '__return_true'
    ]);

    // --- PHOTO UPLOAD ---
    register_rest_route($ns, '/tutor/upload-photo', [
        'methods' => 'POST',
        'callback' => function($request) {
            $uid = zane_get_current_user_id();
            if (!$uid) return new WP_Error('unauthorized', 'Auth required', ['status' => 401]);
            require_once(ABSPATH . 'wp-admin/includes/image.php');
            require_once(ABSPATH . 'wp-admin/includes/file.php');
            require_once(ABSPATH . 'wp-admin/includes/media.php');
            $aid = media_handle_upload('photo', 0);
            if (is_wp_error($aid)) return $aid;
            $url = wp_get_attachment_url($aid);
            update_user_meta($uid, 'zane_profile_photo', $url);
            return ['url' => $url];
        },
        'permission_callback' => '__return_true'
    ]);

    // --- ADMIN ---
    register_rest_route($ns, '/admin/tutors', [
        'methods' => 'GET',
        'callback' => function() {
            $uid = zane_get_current_user_id();
            $u = get_userdata($uid);
            if (!$u || !in_array('administrator', $u->roles)) return new WP_Error('forbidden', 'Admin only', ['status' => 403]);
            $users = get_users(['role__in' => ['contributor', 'tutor', 'verified_tutor', 'teacher', 'top_rated_teacher']]);
            return array_map(fn($u) => zane_get_tutor_profile($u->ID), $users);
        },
        'permission_callback' => '__return_true'
    ]);

    register_rest_route($ns, '/admin/leads', [
        'methods' => 'GET',
        'callback' => function() {
            $uid = zane_get_current_user_id();
            $u = get_userdata($uid);
            if (!$u || !in_array('administrator', $u->roles)) return new WP_Error('forbidden', 'Admin only', ['status' => 403]);
            $users = get_users(['role__in' => ['contributor', 'tutor', 'verified_tutor', 'teacher', 'top_rated_teacher']]);
            $all = [];
            foreach ($users as $u) {
                $leads = get_user_meta($u->ID, 'zane_tutor_leads', true) ?: [];
                foreach ($leads as $l) {
                    $l['tutorId'] = (string)$u->ID;
                    $l['tutorName'] = get_user_meta($u->ID, 'first_name', true) ?: $u->display_name;
                    if (($l['status'] ?? '') !== 'archived') $all[] = $l;
                }
            }
            usort($all, fn($a, $b) => strcmp($b['date'], $a['date']));
            return $all;
        },
        'permission_callback' => '__return_true'
    ]);

    register_rest_route($ns, '/admin/leads/forward', [
        'methods' => 'POST',
        'callback' => function($req) {
            $uid = zane_get_current_user_id();
            $u = get_userdata($uid);
            if (!$u || !in_array('administrator', $u->roles)) return new WP_Error('forbidden', 'Admin only', ['status' => 403]);
            $p = $req->get_json_params();
            $tid = $p['tutorId']; $lid = $p['leadId'];
            $leads = get_user_meta($tid, 'zane_tutor_leads', true) ?: [];
            foreach ($leads as &$l) { if ($l['id'] === $lid) $l['status'] = 'forwarded'; }
            update_user_meta($tid, 'zane_tutor_leads', $leads);
            return ['success' => true];
        },
        'permission_callback' => '__return_true'
    ]);

    register_rest_route($ns, '/admin/leads/archive', [
        'methods' => 'POST',
        'callback' => function($req) {
            $uid = zane_get_current_user_id();
            $u = get_userdata($uid);
            if (!$u || !in_array('administrator', $u->roles)) return new WP_Error('forbidden', 'Admin only', ['status' => 403]);
            $p = $req->get_json_params();
            $tid = $p['tutorId']; $lid = $p['leadId'];
            $leads = get_user_meta($tid, 'zane_tutor_leads', true) ?: [];
            foreach ($leads as &$l) { if ($l['id'] === $lid) $l['status'] = 'archived'; }
            update_user_meta($tid, 'zane_tutor_leads', $leads);
            return ['success' => true];
        },
        'permission_callback' => '__return_true'
    ]);

    register_rest_route($ns, '/admin/verify', [
        'methods' => 'POST',
        'callback' => function($req) {
            $uid = zane_get_current_user_id();
            $u = get_userdata($uid);
            if (!$u || !in_array('administrator', $u->roles)) return new WP_Error('forbidden', 'Admin only', ['status' => 403]);
            $p = $req->get_json_params(); $tid = $p['tutorId']; $status = $p['status'];
            update_user_meta($tid, 'zane_verification_status', $status);
            update_user_meta($tid, 'zane_is_verified', $status === 'approved');
            if ($status === 'approved') { $t = new WP_User($tid); $t->set_role('verified_tutor'); }
            return ['success' => true];
        },
        'permission_callback' => '__return_true'
    ]);

    // --- ASSESSMENTS ---
    register_rest_route($ns, '/assessments', [
        'methods' => ['GET', 'POST'],
        'callback' => function($req) {
            $uid = zane_get_current_user_id();
            if (!$uid) return new WP_Error('unauthorized', 'Auth required', ['status' => 401]);
            global $wpdb; $table = $wpdb->prefix . 'zane_assessments';
            if ($req->get_method() === 'POST') {
                $d = $req->get_json_params();
                $wpdb->insert($table, [
                    'user_id' => $uid, 'result_data' => wp_json_encode($d),
                    'overall_score' => (int)($d['compositeScore'] ?? $d['finalReadinessScore'] ?? 0),
                    'readiness_level' => sanitize_text_field($d['tutorRating'] ?? $d['readinessLevel'] ?? ''),
                    'subjects' => wp_json_encode($d['studentInfo']['selectedSubjects'] ?? [])
                ]);
                return ['success' => true, 'id' => $wpdb->insert_id];
            }
            $rows = $wpdb->get_results($wpdb->prepare("SELECT * FROM $table WHERE user_id = %d ORDER BY created_at DESC", $uid));
            return array_map(fn($r) => ['id' => (int)$r->id, 'date' => $r->created_at, 'overall_score' => (int)$r->overall_score, 'readiness_level' => $r->readiness_level, 'subjects' => json_decode($r->subjects), 'result_data' => json_decode($r->result_data)], $rows);
        },
        'permission_callback' => '__return_true'
    ]);

    // --- REVIEWS ---
    register_rest_route($ns, '/tutor/(?P<id>\d+)/review', [
        'methods' => 'POST',
        'callback' => function($request) {
            $tutor_id = (int) $request['id'];
            $params = $request->get_json_params();
            $reviewer = sanitize_text_field($params['reviewerName'] ?? '');
            $rating = (float) ($params['rating'] ?? 0);
            $comment = sanitize_textarea_field($params['comment'] ?? '');
            if (empty($reviewer) || $rating < 1 || $rating > 5) return new WP_Error('invalid', 'Name and 1-5 rating required', ['status' => 400]);
            $reviews = get_user_meta($tutor_id, 'zane_reviews', true) ?: [];
            $reviews[] = ['id' => uniqid('r'), 'reviewerName' => $reviewer, 'rating' => $rating, 'comment' => $comment, 'date' => current_time('Y-m-d')];
            update_user_meta($tutor_id, 'zane_reviews', $reviews);
            $avg = array_sum(array_column($reviews, 'rating')) / count($reviews);
            update_user_meta($tutor_id, 'zane_rating', round($avg, 1));
            update_user_meta($tutor_id, 'zane_review_count', count($reviews));
            return ['success' => true, 'rating' => round($avg, 1), 'reviewCount' => count($reviews)];
        },
        'permission_callback' => '__return_true'
    ]);

    // --- DEBUG ---
    register_rest_route($ns, '/debug/user/(?P<id>\d+)', [
        'methods' => 'GET',
        'callback' => function($req) {
            $uid = zane_get_current_user_id();
            $u = get_userdata($uid);
            if (!$u || !in_array('administrator', $u->roles)) return new WP_Error('forbidden', 'Admin only', ['status' => 403]);
            return ['user_id' => $req['id'], 'meta' => array_map(fn($v) => maybe_unserialize($v[0]), get_user_meta($req['id']))];
        },
        'permission_callback' => '__return_true'
    ]);
});

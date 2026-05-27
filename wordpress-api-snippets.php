<?php
/**
 * ============================================================
 * ZANE TUTORS – WordPress REST API Snippets
 * ============================================================
 * 
 * Add each snippet below to your WordPress site using the
 * "Code Snippets" plugin (or similar). Each snippet registers
 * REST API endpoints under /wp-json/zane/v1/
 * 
 * Your React app on Vercel will call these endpoints.
 * 
 * IMPORTANT: Update ZANE_JWT_SECRET to a strong random string
 * and keep it identical on both WP and your Vercel env vars.
 * ============================================================
 */


// ─────────────────────────────────────────────────────────────
// SNIPPET 1: JWT Authentication
// Name it: "Zane API – JWT Auth"
// ─────────────────────────────────────────────────────────────

define('ZANE_JWT_SECRET', 'CHANGE_THIS_TO_A_STRONG_RANDOM_STRING_64_CHARS');

// Helper: Create JWT
function zane_create_jwt($user_id, $email, $is_admin = false) {
    $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64_encode(json_encode([
        'sub' => $user_id,
        'email' => $email,
        'is_admin' => $is_admin,
        'iat' => time(),
        'exp' => time() + (7 * 24 * 3600), // 7 days
    ]));
    $signature = base64_encode(hash_hmac('sha256', "$header.$payload", ZANE_JWT_SECRET, true));
    return "$header.$payload.$signature";
}

// Helper: Verify JWT
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

// Helper: Get current user from JWT in request
function zane_get_auth_user($request) {
    $auth = $request->get_header('Authorization');
    if (!$auth || strpos($auth, 'Bearer ') !== 0) return false;
    $token = substr($auth, 7);
    return zane_verify_jwt($token);
}

// Helper: Check admin
function zane_require_admin($request) {
    $user = zane_get_auth_user($request);
    if (!$user || !$user['is_admin']) return false;
    return $user;
}

// ── Login endpoint ──
add_action('rest_api_init', function() {
    register_rest_route('zane/v1', '/auth/login', [
        'methods' => 'POST',
        'callback' => 'zane_handle_login',
        'permission_callback' => '__return_true',
    ]);
});

function zane_handle_login($request) {
    $email = sanitize_email($request->get_param('email'));
    $password = $request->get_param('password');
    
    if (empty($email) || empty($password)) {
        return new WP_Error('missing_fields', 'Email and password are required.', ['status' => 400]);
    }
    
    $user = get_user_by('email', $email);
    if (!$user || !wp_check_password($password, $user->user_pass, $user->ID)) {
        return new WP_Error('invalid_credentials', 'Invalid email or password.', ['status' => 401]);
    }
    
    $is_admin = in_array('administrator', $user->roles);
    $token = zane_create_jwt($user->ID, $email, $is_admin);
    
    // Get tutor profile data
    $profile = zane_get_tutor_profile($user->ID);
    
    return rest_ensure_response([
        'token' => $token,
        'user' => $profile,
        'is_admin' => $is_admin,
    ]);
}

// ── Signup endpoint ──
add_action('rest_api_init', function() {
    register_rest_route('zane/v1', '/auth/signup', [
        'methods' => 'POST',
        'callback' => 'zane_handle_signup',
        'permission_callback' => '__return_true',
    ]);
});

function zane_handle_signup($request) {
    $email = sanitize_email($request->get_param('email'));
    $password = $request->get_param('password');
    $first_name = sanitize_text_field($request->get_param('firstName'));
    $last_name = sanitize_text_field($request->get_param('lastName'));
    $phone = sanitize_text_field($request->get_param('phone'));
    $location = sanitize_text_field($request->get_param('location'));
    
    if (empty($email) || empty($password) || empty($first_name) || empty($last_name)) {
        return new WP_Error('missing_fields', 'All required fields must be filled.', ['status' => 400]);
    }
    
    if (email_exists($email)) {
        return new WP_Error('email_exists', 'An account with this email already exists.', ['status' => 409]);
    }
    
    $user_id = wp_create_user($email, $password, $email);
    if (is_wp_error($user_id)) {
        return new WP_Error('signup_failed', $user_id->get_error_message(), ['status' => 500]);
    }
    
    // Set user role to 'contributor' initially
    $user = new WP_User($user_id);
    $user->set_role('contributor'); 
    
    wp_update_user([
        'ID' => $user_id,
        'first_name' => $first_name,
        'last_name' => $last_name,
    ]);
    
    // Save tutor meta
    update_user_meta($user_id, 'zane_phone', $phone);
    update_user_meta($user_id, 'zane_location', $location);
    update_user_meta($user_id, 'zane_onboarding_step', 'profile');
    update_user_meta($user_id, 'zane_is_verified', '0');
    update_user_meta($user_id, 'zane_created_at', current_time('Y-m-d'));
    
    $token = zane_create_jwt($user_id, $email, false);
    $profile = zane_get_tutor_profile($user_id);
    
    return rest_ensure_response([
        'token' => $token,
        'user' => $profile,
    ]);
}


// ─────────────────────────────────────────────────────────────
// SNIPPET 2: Tutor Profile CRUD
// Name it: "Zane API – Tutor Profiles"
// ─────────────────────────────────────────────────────────────

// Helper: Build tutor profile array from WP user
function zane_get_tutor_profile($user_id) {
    $user = get_userdata($user_id);
    if (!$user) return null;
    
    $subjects = get_user_meta($user_id, 'zane_subjects', true);
    $levels = get_user_meta($user_id, 'zane_preferred_levels', true);
    $availability_slots = get_user_meta($user_id, 'zane_availability_slots', true);
    $reviews = get_user_meta($user_id, 'zane_reviews', true);
    
    $user_roles = (array) $user->roles;
    $onboarding_step = get_user_meta($user_id, 'zane_onboarding_step', true);
    
    // Map WordPress roles to Onboarding Steps if meta is missing
    if (!$onboarding_step) {
        if (in_array('verified_tutor', $user_roles)) {
            $onboarding_step = 'verification';
        } elseif (in_array('tutor', $user_roles)) {
            $onboarding_step = 'verification'; // Passed test, awaiting final verification
        } elseif (in_array('contributor', $user_roles)) {
            $onboarding_step = 'profile';
        } else {
            $onboarding_step = 'signup';
        }
    }

    $profile = [
        'id' => (string) $user_id,
        'email' => $user->user_email,
        'firstName' => $user->first_name,
        'lastName' => $user->last_name,
        'phone' => get_user_meta($user_id, 'zane_phone', true) ?: '',
        'location' => get_user_meta($user_id, 'zane_location', true) ?: '',
        'profilePhoto' => get_user_meta($user_id, 'zane_profile_photo', true) ?: '',
        'qualification' => get_user_meta($user_id, 'zane_qualification', true) ?: '',
        'subjects' => is_array($subjects) ? $subjects : [],
        'experience' => (int) get_user_meta($user_id, 'zane_experience', true),
        'hourlyRate' => (int) get_user_meta($user_id, 'zane_hourly_rate', true),
        'briefIntro' => get_user_meta($user_id, 'zane_brief_intro', true) ?: '',
        'preferredLevels' => is_array($levels) ? $levels : [],
        'currentWork' => get_user_meta($user_id, 'zane_current_work', true) ?: '',
        'availability' => get_user_meta($user_id, 'zane_availability', true) ?: '',
        'availabilitySlots' => is_array($availability_slots) ? $availability_slots : [],
        'teachingHistory' => get_user_meta($user_id, 'zane_teaching_history', true) ?: '',
        'classDelivery' => get_user_meta($user_id, 'zane_class_delivery', true) ?: '',
        'classType' => get_user_meta($user_id, 'zane_class_type', true) ?: '',
        'trcnCertified' => (bool) get_user_meta($user_id, 'zane_trcn_certified', true),
        'rating' => (float) get_user_meta($user_id, 'zane_rating', true),
        'reviewCount' => (int) get_user_meta($user_id, 'zane_review_count', true),
        'reviews' => is_array($reviews) ? $reviews : [],
        'isVerified' => in_array('verified_tutor', $user_roles) || (bool) get_user_meta($user_id, 'zane_is_verified', true),
        'verificationStatus' => get_user_meta($user_id, 'zane_verification_status', true) ?: (in_array('verified_tutor', $user_roles) ? 'approved' : 'pending'),
        'adminNotes' => get_user_meta($user_id, 'zane_admin_notes', true) ?: '',
        'lastNudgedAt' => get_user_meta($user_id, 'zane_last_nudged_at', true) ?: '',
        'onboardingStep' => $onboarding_step,
        'assessmentHistory' => get_user_meta($user_id, 'zane_assessment_history', true) ?: [],
        'lastAssessmentScore' => get_user_meta($user_id, 'zane_last_assessment_score', true) ?: null,
        'createdAt' => get_user_meta($user_id, 'zane_created_at', true) ?: $user->user_registered,
    ];
    // Only add raw meta for debugging if requested by an admin
    // This prevents leaking sensitive WordPress internal meta to the frontend
    $profile['debug_all_meta'] = [];
    if (current_user_can('manage_options')) {
        $all_meta_data = get_user_meta($user_id);
        if (is_array($all_meta_data)) {
            foreach ($all_meta_data as $k => $v) {
                $profile['debug_all_meta'][$k] = maybe_unserialize($v[0]);
            }
        }
    }

    return $profile;
}

/**
 * Public version of the tutor profile (hides sensitive info like email/phone)
 */
function zane_get_public_tutor_profile($user_id) {
    $full_profile = zane_get_tutor_profile($user_id);
    if (!$full_profile) return null;
    
    // Remove sensitive fields
    unset($full_profile['email']);
    unset($full_profile['phone']);
    unset($full_profile['adminNotes']);
    unset($full_profile['lastNudgedAt']);
    unset($full_profile['verificationStatus']);
    unset($full_profile['debug_all_meta']);
    
    return $full_profile;
}

// ── Get own profile ──
add_action('rest_api_init', function() {
    register_rest_route('zane/v1', '/tutor/profile', [
        'methods' => 'GET',
        'callback' => 'zane_get_own_profile',
        'permission_callback' => '__return_true',
    ]);
});

function zane_get_own_profile($request) {
    $auth = zane_get_auth_user($request);
    if (!$auth) return new WP_Error('unauthorized', 'Invalid token.', ['status' => 401]);
    
    $profile = zane_get_tutor_profile($auth['sub']);
    if (!$profile) return new WP_Error('not_found', 'Profile not found.', ['status' => 404]);
    
    return rest_ensure_response($profile);
}

// ── Update own profile ──
add_action('rest_api_init', function() {
    register_rest_route('zane/v1', '/tutor/profile', [
        'methods' => 'POST',
        'callback' => 'zane_update_own_profile',
        'permission_callback' => '__return_true',
    ]);
});

function zane_update_own_profile($request) {
    $auth = zane_get_auth_user($request);
    if (!$auth) return new WP_Error('unauthorized', 'Invalid token.', ['status' => 401]);
    
    $user_id = $auth['sub'];
    $params = $request->get_json_params();
    
    // Map of param keys to meta keys
    $meta_map = [
        'qualification' => 'zane_qualification',
        'subjects' => 'zane_subjects',
        'experience' => 'zane_experience',
        'hourlyRate' => 'zane_hourly_rate',
        'briefIntro' => 'zane_brief_intro',
        'preferredLevels' => 'zane_preferred_levels',
        'currentWork' => 'zane_current_work',
        'availability' => 'zane_availability',
        'availabilitySlots' => 'zane_availability_slots',
        'teachingHistory' => 'zane_teaching_history',
        'classDelivery' => 'zane_class_delivery',
        'classType' => 'zane_class_type',
        'trcnCertified' => 'zane_trcn_certified',
        'location' => 'zane_location',
        'phone' => 'zane_phone',
        'profilePhoto' => 'zane_profile_photo',
    ];
    
    foreach ($meta_map as $param_key => $meta_key) {
        if (isset($params[$param_key])) {
            update_user_meta($user_id, $meta_key, $params[$param_key]);
        }
    }
    
    $profile = zane_get_tutor_profile($user_id);
    return rest_ensure_response($profile);
}

// ── Advance onboarding step ──
add_action('rest_api_init', function() {
    register_rest_route('zane/v1', '/tutor/advance-step', [
        'methods' => 'POST',
        'callback' => 'zane_advance_step',
        'permission_callback' => '__return_true',
    ]);
});

function zane_advance_step($request) {
    $auth = zane_get_auth_user($request);
    if (!$auth) return new WP_Error('unauthorized', 'Invalid token.', ['status' => 401]);
    
    $step = sanitize_text_field($request->get_param('step'));
    $valid_steps = ['signup', 'profile', 'test', 'verification'];
    
    if (!in_array($step, $valid_steps)) {
        return new WP_Error('invalid_step', 'Invalid onboarding step.', ['status' => 400]);
    }
    
    update_user_meta($auth['sub'], 'zane_onboarding_step', $step);
    
    return rest_ensure_response(['success' => true, 'step' => $step]);
}


// ─────────────────────────────────────────────────────────────
// SNIPPET 3: Tutor Catalogue (Public)
// Name it: "Zane API – Catalogue"
// ─────────────────────────────────────────────────────────────

add_action('rest_api_init', function() {
    register_rest_route('zane/v1', '/tutor-catalogue', [
        'methods' => 'GET',
        'callback' => 'zane_get_catalogue',
        'permission_callback' => '__return_true',
    ]);
});

function zane_get_catalogue($request) {
    // Get all users with 'tutor' or 'verified_tutor' roles
    $args = [
        'role__in' => ['tutor', 'verified_tutor'],
        'number' => 100,
    ];
    
    $users = get_users($args);
    $tutors = [];
    
    foreach ($users as $user) {
        $profile = zane_get_public_tutor_profile($user->ID);
        if ($profile) $tutors[] = $profile;
    }
    
    return rest_ensure_response($tutors);
}


// ─────────────────────────────────────────────────────────────
// SNIPPET 4: Admin Endpoints
// Name it: "Zane API – Admin"
// ─────────────────────────────────────────────────────────────

// ── Get all tutors (admin) ──
add_action('rest_api_init', function() {
    register_rest_route('zane/v1', '/admin/tutors', [
        'methods' => 'GET',
        'callback' => 'zane_admin_get_all_tutors',
        'permission_callback' => '__return_true',
    ]);
});

function zane_admin_get_all_tutors($request) {
    $admin = zane_require_admin($request);
    if (!$admin) return new WP_Error('forbidden', 'Admin access required.', ['status' => 403]);
    
    $args = [
        'role__in' => ['contributor', 'tutor', 'verified_tutor'],
        'number' => 500,
    ];
    
    $users = get_users($args);
    $tutors = [];
    
    foreach ($users as $user) {
        if (in_array('administrator', $user->roles)) continue;
        $tutors[] = zane_get_tutor_profile($user->ID);
    }
    
    return rest_ensure_response($tutors);
}

// ── Verify/Reject tutor (admin) ──
add_action('rest_api_init', function() {
    register_rest_route('zane/v1', '/admin/verify', [
        'methods' => 'POST',
        'callback' => 'zane_admin_verify_tutor',
        'permission_callback' => '__return_true',
    ]);
});

function zane_admin_verify_tutor($request) {
    $admin = zane_require_admin($request);
    if (!$admin) return new WP_Error('forbidden', 'Admin access required.', ['status' => 403]);
    
    $tutor_id = (int) $request->get_param('tutorId');
    $status = sanitize_text_field($request->get_param('status')); // 'approved' or 'rejected'
    $notes = sanitize_textarea_field($request->get_param('notes'));
    
    if (!in_array($status, ['approved', 'rejected'])) {
        return new WP_Error('invalid_status', 'Status must be approved or rejected.', ['status' => 400]);
    }
    
    update_user_meta($tutor_id, 'zane_verification_status', $status);
    update_user_meta($tutor_id, 'zane_is_verified', $status === 'approved' ? '1' : '0');
    if ($notes) update_user_meta($tutor_id, 'zane_admin_notes', $notes);
    
    if ($status === 'approved') {
        $user = new WP_User($tutor_id);
        $user->set_role('verified_tutor');
    }
    
    return rest_ensure_response(['success' => true]);
}

// ── Nudge tutor (admin) ──
add_action('rest_api_init', function() {
    register_rest_route('zane/v1', '/admin/nudge', [
        'methods' => 'POST',
        'callback' => 'zane_admin_nudge_tutor',
        'permission_callback' => '__return_true',
    ]);
});

function zane_admin_nudge_tutor($request) {
    $admin = zane_require_admin($request);
    if (!$admin) return new WP_Error('forbidden', 'Admin access required.', ['status' => 403]);
    
    $tutor_id = (int) $request->get_param('tutorId');
    update_user_meta($tutor_id, 'zane_last_nudged_at', current_time('c'));
    
    // Optional: Send email nudge
    $user = get_userdata($tutor_id);
    if ($user) {
        $step = get_user_meta($tutor_id, 'zane_onboarding_step', true);
        wp_mail(
            $user->user_email,
            'Complete Your Zane Tutors Profile',
            "Hi {$user->first_name},\n\nYou're almost done setting up your tutor profile! Please log in to complete your {$step} step.\n\nVisit: https://facilitator.zanetutors.com.ng\n\nBest,\nZane Tutors Team"
        );
    }
    
    return rest_ensure_response(['success' => true]);
}

// ── Delete tutor (admin) ──
add_action('rest_api_init', function() {
    register_rest_route('zane/v1', '/admin/delete', [
        'methods' => 'POST',
        'callback' => 'zane_admin_delete_tutor',
        'permission_callback' => '__return_true',
    ]);
});

function zane_admin_delete_tutor($request) {
    $admin = zane_require_admin($request);
    if (!$admin) return new WP_Error('forbidden', 'Admin access required.', ['status' => 403]);
    
    $tutor_id = (int) $request->get_param('tutorId');
    
    // Don't allow deleting admins
    $user = get_userdata($tutor_id);
    if (!$user || in_array('administrator', $user->roles)) {
        return new WP_Error('forbidden', 'Cannot delete this user.', ['status' => 403]);
    }
    
    require_once(ABSPATH . 'wp-admin/includes/user.php');
    wp_delete_user($tutor_id);
    
    return rest_ensure_response(['success' => true]);
}


// ─────────────────────────────────────────────────────────────
// SNIPPET 5: Reviews & Ratings
// Name it: "Zane API – Reviews"
// ─────────────────────────────────────────────────────────────

add_action('rest_api_init', function() {
    register_rest_route('zane/v1', '/tutor/(?P<id>\d+)/review', [
        'methods' => 'POST',
        'callback' => 'zane_add_review',
        'permission_callback' => '__return_true',
    ]);
});

function zane_add_review($request) {
    $tutor_id = (int) $request['id'];
    $reviewer = sanitize_text_field($request->get_param('reviewerName'));
    $rating = (float) $request->get_param('rating');
    $comment = sanitize_textarea_field($request->get_param('comment'));
    
    // Check if the submission is from an admin (using the JWT if present)
    $auth = zane_get_auth_user($request);
    $is_admin = ($auth && $auth['is_admin']);
    $weight = $is_admin ? 5 : 1; // Admin reviews count 5x more

    if (empty($reviewer) || $rating < 1 || $rating > 5 || empty($comment)) {
        return new WP_Error('invalid_data', 'All fields required. Rating must be 1-5.', ['status' => 400]);
    }
    
    $reviews = get_user_meta($tutor_id, 'zane_reviews', true);
    if (!is_array($reviews)) $reviews = [];
    
    $reviews[] = [
        'id' => uniqid('r'),
        'reviewerName' => $reviewer,
        'rating' => $rating,
        'comment' => $comment,
        'date' => current_time('Y-m-d'),
        'isAdmin' => $is_admin,
        'weight' => $weight
    ];
    
    update_user_meta($tutor_id, 'zane_reviews', $reviews);
    
    // Recalculate weighted average rating
    $total_weighted_rating = 0;
    $total_weight = 0;
    
    foreach ($reviews as $review) {
        $r_weight = isset($review['weight']) ? $review['weight'] : 1;
        $total_weighted_rating += ($review['rating'] * $r_weight);
        $total_weight += $r_weight;
    }
    
    $avg = round($total_weighted_rating / $total_weight, 1);
    
    update_user_meta($tutor_id, 'zane_rating', $avg);
    update_user_meta($tutor_id, 'zane_review_count', count($reviews));
    
    return rest_ensure_response([
        'success' => true,
        'rating' => $avg,
        'reviewCount' => count($reviews),
        'is_admin_review' => $is_admin
    ]);
}


// ─────────────────────────────────────────────────────────────
// SNIPPET 6: CORS Headers for Vercel frontend
// Name it: "Zane API – CORS"
// ─────────────────────────────────────────────────────────────

add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        $origin = get_http_origin();
        $allowed_origins = [
            'https://classes.zanetutors.com.ng',
            'https://facilitator.zanetutors.com.ng',
            'https://zane-tutor-portal.vercel.app',
            'http://localhost:8080',
            'http://localhost:5173',
        ];
        
        if (in_array($origin, $allowed_origins)) {
            header("Access-Control-Allow-Origin: $origin");
        }
        
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');
        
        return $value;
    });
}, 15);

// Handle OPTIONS preflight
add_action('init', function() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
        $allowed_origins = [
            'https://classes.zanetutors.com.ng',
            'https://facilitator.zanetutors.com.ng',
            'https://zane-tutor-portal.vercel.app',
            'http://localhost:8080',
            'http://localhost:5173',
        ];
        
        if (in_array($origin, $allowed_origins)) {
            header("Access-Control-Allow-Origin: $origin");
        }
        
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');
        exit(0);
    }
});


// ─────────────────────────────────────────────────────────────
// SNIPPET 7: Photo Upload
// Name it: "Zane API – Photo Upload"
// ─────────────────────────────────────────────────────────────

add_action('rest_api_init', function() {
    register_rest_route('zane/v1', '/tutor/upload-photo', [
        'methods' => 'POST',
        'callback' => 'zane_upload_photo',
        'permission_callback' => '__return_true',
    ]);
});

function zane_upload_photo($request) {
    $auth = zane_get_auth_user($request);
    if (!$auth) return new WP_Error('unauthorized', 'Invalid token.', ['status' => 401]);
    
    $files = $request->get_file_params();
    if (empty($files['photo'])) {
        return new WP_Error('no_file', 'No photo uploaded.', ['status' => 400]);
    }
    
    require_once(ABSPATH . 'wp-admin/includes/image.php');
    require_once(ABSPATH . 'wp-admin/includes/file.php');
    require_once(ABSPATH . 'wp-admin/includes/media.php');
    
    $attachment_id = media_handle_upload('photo', 0);
    if (is_wp_error($attachment_id)) {
        return new WP_Error('upload_failed', $attachment_id->get_error_message(), ['status' => 500]);
    }
    
    $url = wp_get_attachment_url($attachment_id);
    update_user_meta($auth['sub'], 'zane_profile_photo', $url);
    
    return rest_ensure_response(['url' => $url]);
}

// ─────────────────────────────────────────────────────────────
// SNIPPET 8: Debug Tools (Admin Only)
// ─────────────────────────────────────────────────────────────

add_action('rest_api_init', function() {
    register_rest_route('zane/v1', '/debug/user/(?P<id>\d+)', [
        'methods' => 'GET',
        'callback' => 'zane_debug_user_meta',
        'permission_callback' => function($request) {
            $auth = zane_get_auth_user($request);
            if (!$auth) return false;
            $user = get_userdata($auth['sub']);
            return $user && in_array('administrator', (array) $user->roles);
        },
    ]);
});

function zane_debug_user_meta($request) {
    $user_id = $request['id'];
    $meta = get_user_meta($user_id);
    
    // Clean up the meta for easier reading
    $clean_meta = [];
    foreach ($meta as $key => $values) {
        $clean_meta[$key] = maybe_unserialize($values[0]);
    }
    
    return rest_ensure_response([
        'user_id' => $user_id,
        'roles' => get_userdata($user_id)->roles,
        'meta' => $clean_meta
    ]);
}

// -------------------------------------------------------------
// SNIPPET 9: Lead Capture (Booking/Offers)
// -------------------------------------------------------------

add_action('rest_api_init', function() {
    register_rest_route('zane/v1', '/leads', [
        'methods' => 'POST',
        'callback' => 'zane_handle_lead_submission',
        'permission_callback' => '__return_true',
    ]);
});

function zane_handle_lead_submission($request) {
    $params = $request->get_json_params();
    $tutor_id = isset($params['tutorId']) ? sanitize_text_field($params['tutorId']) : '';
    $tutor_name = isset($params['tutorName']) ? sanitize_text_field($params['tutorName']) : '';
    $parent_name = isset($params['parentName']) ? sanitize_text_field($params['parentName']) : '';
    $parent_email = isset($params['parentEmail']) ? sanitize_email($params['parentEmail']) : '';
    $parent_phone = isset($params['parentPhone']) ? sanitize_text_field($params['parentPhone']) : '';
    $message = isset($params['message']) ? sanitize_textarea_field($params['message']) : '';
    $offer_amount = isset($params['offerAmount']) ? sanitize_text_field($params['offerAmount']) : '';
    
    if (!$parent_name || !$parent_phone || !$tutor_id) {
        return new WP_Error('missing_fields', 'Please provide name and phone number.', ['status' => 400]);
    }

    $leads = get_user_meta($tutor_id, 'zane_tutor_leads', true);
    if (!is_array($leads)) $leads = [];
    
    $new_lead = [
        'id' => uniqid(),
        'date' => current_time('mysql'),
        'parentName' => $parent_name,
        'parentEmail' => $parent_email,
        'parentPhone' => $parent_phone,
        'message' => $message,
        'offerAmount' => $offer_amount,
        'status' => 'new'
    ];
    
    $leads[] = $new_lead;
    update_user_meta($tutor_id, 'zane_tutor_leads', $leads);
    
    $admin_email = get_option('admin_email');
    $subject = "New Tutor Offer for $tutor_name from $parent_name";
    $body = "Parent Name: $parent_name\nEmail: $parent_email\nPhone: $parent_phone\nTutor: $tutor_name\nOffer: $offer_amount\n\nMessage:\n$message";
    wp_mail($admin_email, $subject, $body);

    return rest_ensure_response(['success' => true, 'message' => 'Your offer has been sent! We will contact you shortly.']);
}

// -- Get All Leads (Admin) --
add_action('rest_api_init', function() {
    register_rest_route('zane/v1', '/admin/leads', [
        'methods' => 'GET',
        'callback' => 'zane_admin_get_all_leads',
        'permission_callback' => '__return_true',
    ]);
});

function zane_admin_get_all_leads($request) {
    $user_id = zane_require_admin($request);
    if (!$user_id) return new WP_Error('forbidden', 'Admin access required.', ['status' => 403]);
    
    $args = [
        'role__in' => ['contributor', 'tutor', 'verified_tutor'],
        'number' => 500,
    ];
    
    $users = get_users($args);
    $all_leads = [];
    
    foreach ($users as $user) {
        $leads = get_user_meta($user->ID, 'zane_tutor_leads', true);
        if (is_array($leads)) {
            foreach ($leads as $lead) {
                $lead['tutorId'] = $user->ID;
                $lead['tutorName'] = $user->first_name . " " . $user->last_name;
                $all_leads[] = $lead;
            }
        }
    }
    
    // Sort by date desc
    usort($all_leads, function($a, $b) {
        return strcmp($b['date'], $a['date']);
    });
    
    return rest_ensure_response($all_leads);
}

// -- Forward Lead to Tutor --
add_action('rest_api_init', function() {
    register_rest_route('zane/v1', '/admin/leads/forward', [
        'methods' => 'POST',
        'callback' => 'zane_admin_forward_lead',
        'permission_callback' => '__return_true',
    ]);
});

function zane_admin_forward_lead($request) {
    $admin_id = zane_require_admin($request);
    if (!$admin_id) return new WP_Error('forbidden', 'Admin access required.', ['status' => 403]);
    
    $params = $request->get_json_params();
    $tutor_id = isset($params['tutorId']) ? $params['tutorId'] : '';
    $lead_id = isset($params['leadId']) ? $params['leadId'] : '';
    
    if (!$tutor_id || !$lead_id) return new WP_Error('missing', 'Missing ID', ['status' => 400]);
    
    $leads = get_user_meta($tutor_id, 'zane_tutor_leads', true);
    $found = false;
    foreach ($leads as &$lead) {
        if ($lead['id'] === $lead_id) {
            $lead['status'] = 'forwarded';
            $lead['forwardedAt'] = current_time('mysql');
            $found = true;
            break;
        }
    }
    
    if ($found) {
        update_user_meta($tutor_id, 'zane_tutor_leads', $leads);
        
        // Notify Tutor via Email
        $tutor = get_userdata($tutor_id);
        $subject = "New Booking Request Assigned to You!";
        $body = "Hello " . $tutor->first_name . ",\n\nAn administrator has assigned a new booking request to you. Please log in to your tutor portal to view the details.\n\nZane Tutors Admin";
        wp_mail($tutor->user_email, $subject, $body);
        
        return rest_ensure_response(['success' => true]);
    }
    
    return new WP_Error('not_found', 'Lead not found', ['status' => 404]);
}

// -- Get Assigned Leads (Tutor) --
add_action('rest_api_init', function() {
    register_rest_route('zane/v1', '/tutor/assigned-leads', [
        'methods' => 'GET',
        'callback' => 'zane_tutor_get_assigned_leads',
        'permission_callback' => '__return_true',
    ]);
});

function zane_tutor_get_assigned_leads($request) {
    $user_id = zane_get_user_id($request);
    if (!$user_id) return new WP_Error('forbidden', 'Not logged in.', ['status' => 401]);
    
    $all_leads = get_user_meta($user_id, 'zane_tutor_leads', true);
    $assigned = [];
    if (is_array($all_leads)) {
        foreach ($all_leads as $lead) {
            if ($lead['status'] === 'forwarded') {
                $assigned[] = $lead;
            }
        }
    }
    
    return rest_ensure_response($assigned);
}

// ─────────────────────────────────────────────────────────────
// SNIPPET 10: Global Settings API
// Name it: "Zane API – Global Settings"
// ─────────────────────────────────────────────────────────────

/**
 * Register the settings page in the WP Sidebar
 */
add_action('admin_menu', function() {
    add_menu_page(
        'Zane Portal Settings',
        'Zane Settings',
        'manage_options',
        'zane-settings',
        'zane_render_settings_page',
        'dashicons-admin-generic',
        80
    );
});

/**
 * Register the actual settings in the database
 */
add_action('admin_init', function() {
    register_setting('zane_settings_group', 'zane_whatsapp_number');
    register_setting('zane_settings_group', 'zane_contact_email');
    register_setting('zane_settings_group', 'zane_commission_rate');
    register_setting('zane_settings_group', 'zane_portal_notice');
});

/**
 * Render the Settings Page HTML
 */
function zane_render_settings_page() {
    ?>
    <div class="wrap">
        <h1>Zane Portal – Global Settings</h1>
        <form method="post" action="options.php">
            <?php settings_fields('zane_settings_group'); ?>
            <?php do_settings_sections('zane_settings_group'); ?>
            <table class="form-table">
                <tr valign="top">
                    <th scope="row">Admin WhatsApp Number</th>
                    <td><input type="text" name="zane_whatsapp_number" value="<?php echo esc_attr(get_option('zane_whatsapp_number', '2348108325024')); ?>" class="regular-text" />
                    <p class="description">Include country code, no "+" sign (e.g., 2348108325024)</p></td>
                </tr>
                <tr valign="top">
                    <th scope="row">Admin Contact Email</th>
                    <td><input type="email" name="zane_contact_email" value="<?php echo esc_attr(get_option('zane_contact_email', get_option('admin_email'))); ?>" class="regular-text" /></td>
                </tr>
                <tr valign="top">
                    <th scope="row">Platform Commission (%)</th>
                    <td><input type="number" name="zane_commission_rate" value="<?php echo esc_attr(get_option('zane_commission_rate', '30')); ?>" class="small-text" /> %
                    <p class="description">This is added to the tutor's base rate in the catalogue.</p></td>
                </tr>
                <tr valign="top">
                    <th scope="row">Portal Global Notice</th>
                    <td><textarea name="zane_portal_notice" rows="3" class="large-text"><?php echo esc_textarea(get_option('zane_portal_notice', 'Welcome to the Zane Tutor Portal!')); ?></textarea>
                    <p class="description">This will appear at the top of the Tutor Dashboard.</p></td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}

/**
 * Register the REST API endpoint for settings
 */
add_action('rest_api_init', function() {
    register_rest_route('zane/v1', '/settings', [
        'methods' => 'GET',
        'callback' => 'zane_get_global_settings',
        'permission_callback' => '__return_true',
    ]);
});

function zane_get_global_settings($request) {
    return rest_ensure_response([
        'whatsappNumber' => get_option('zane_whatsapp_number', '2348108325024'),
        'contactEmail' => get_option('zane_contact_email', get_option('admin_email')),
        'commissionRate' => (int) get_option('zane_commission_rate', 30),
        'portalNotice' => get_option('zane_portal_notice', 'Welcome to the Zane Tutor Portal!')
    ]);
}

// ─────────────────────────────────────────────────────────────
// SNIPPET 11: Tutor Assessments
// Name it: "Zane API – Tutor Assessments"
// ─────────────────────────────────────────────────────────────

add_action('rest_api_init', function() {
    register_rest_route('zane/v1', '/assessments', [
        'methods' => 'POST',
        'callback' => 'zane_save_assessment',
        'permission_callback' => 'zane_require_auth',
    ]);
    
    register_rest_route('zane/v1', '/assessments', [
        'methods' => 'GET',
        'callback' => 'zane_get_my_assessments',
        'permission_callback' => 'zane_require_auth',
    ]);
});

function zane_save_assessment($request) {
    $user_id = zane_get_auth_user_id($request);
    $params = $request->get_json_params();
    $result_data = isset($params['result_data']) ? $params['result_data'] : null;

    if (!$result_data) {
        return new WP_Error('missing_data', 'Assessment data is required', ['status' => 400]);
    }

    // Save to history
    $history = get_user_meta($user_id, 'zane_assessment_history', true);
    if (!is_array($history)) $history = [];
    
    $new_entry = [
        'id' => uniqid(),
        'date' => current_time('mysql'),
        'data' => $result_data
    ];
    
    $history[] = $new_entry;
    update_user_meta($user_id, 'zane_assessment_history', $history);

    // Update main profile status
    update_user_meta($user_id, 'zane_onboarding_step', 'verification');
    
    // Extract composite score for quick access
    if (isset($result_data['compositeScore'])) {
        update_user_meta($user_id, 'zane_last_assessment_score', $result_data['compositeScore']);
    }

    return rest_ensure_response([
        'success' => true,
        'id' => $new_entry['id'],
        'message' => 'Assessment saved successfully'
    ]);
}

function zane_get_my_assessments($request) {
    $user_id = zane_get_auth_user_id($request);
    $history = get_user_meta($user_id, 'zane_assessment_history', true);
    return rest_ensure_response(is_array($history) ? $history : []);
}

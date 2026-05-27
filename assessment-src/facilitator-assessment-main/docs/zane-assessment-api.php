<?php
/**
 * ZaneTutors Assessment API
 * 
 * Add this file to wp-content/plugins/zane-assessment-api.php
 * Then activate it from the WordPress admin Plugins page.
 * 
 * OR paste the contents (without the opening <?php tag) into your theme's functions.php
 */

/*
Plugin Name: ZaneTutors Assessment API
Description: REST API endpoints for the JAMB Readiness Assessment app
Version: 1.1
Author: ZaneTutors
*/

// Prevent direct access
if (!defined('ABSPATH')) exit;

// ============================================================
// DATABASE SETUP
// ============================================================

function zane_create_tables() {
    global $wpdb;
    $charset = $wpdb->get_charset_collate();

    $tokens_table = $wpdb->prefix . 'zane_auth_tokens';
    $assessments_table = $wpdb->prefix . 'zane_assessments';

    // dbDelta requires exact formatting — no IF NOT EXISTS
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

// Always ensure tables exist (handles functions.php usage where activation hook won't fire)
add_action('init', function() {
    global $wpdb;
    $tokens_table = $wpdb->prefix . 'zane_auth_tokens';
    $assessments_table = $wpdb->prefix . 'zane_assessments';
    
    // Check both tables
    $tokens_exist = $wpdb->get_var("SHOW TABLES LIKE '$tokens_table'") === $tokens_table;
    $assessments_exist = $wpdb->get_var("SHOW TABLES LIKE '$assessments_table'") === $assessments_table;
    
    if (!$tokens_exist || !$assessments_exist) {
        zane_create_tables();
    }
});

// ============================================================
// APACHE FIX: Ensure Authorization header is passed through
// Some Apache/CGI setups strip the Authorization header
// ============================================================

add_action('init', function() {
    // Try to recover Authorization from environment
    if (!isset($_SERVER['HTTP_AUTHORIZATION'])) {
        if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $_SERVER['HTTP_AUTHORIZATION'] = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        } elseif (function_exists('getallheaders')) {
            $headers = getallheaders();
            if (isset($headers['Authorization'])) {
                $_SERVER['HTTP_AUTHORIZATION'] = $headers['Authorization'];
            } elseif (isset($headers['authorization'])) {
                $_SERVER['HTTP_AUTHORIZATION'] = $headers['authorization'];
            }
        }
    }
}, 1);

// ============================================================
// CORS HEADERS
// ============================================================

add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        $allowed_origins = [
            'https://id-preview--5c847b5c-3c42-4691-a998-6dd4d40432ea.lovable.app',
            'http://localhost:5173',
            'http://localhost:3000',
        ];
        $origin = get_http_origin();
        // Also allow any *.lovable.app subdomain
        if (in_array($origin, $allowed_origins) || preg_match('/\.lovable\.app$/', parse_url($origin, PHP_URL_HOST) ?? '')) {
            header("Access-Control-Allow-Origin: $origin");
            header('Access-Control-Allow-Credentials: true');
        }
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE');
        header('Access-Control-Allow-Headers: Authorization, Content-Type');
        return $value;
    });
});

// Handle preflight OPTIONS requests
add_action('init', function() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
        if (preg_match('/\.lovable\.app$/', parse_url($origin, PHP_URL_HOST) ?? '') || strpos($origin, 'localhost') !== false) {
            header("Access-Control-Allow-Origin: $origin");
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE');
            header('Access-Control-Allow-Headers: Authorization, Content-Type');
            header('Access-Control-Max-Age: 86400');
        }
        exit(0);
    }
});

// ============================================================
// TOKEN HELPERS
// ============================================================

function zane_generate_token() {
    return wp_generate_password(64, false, false);
}

function zane_hash_token($token) {
    return hash('sha256', $token);
}

function zane_store_token($user_id, $token) {
    global $wpdb;
    $table = $wpdb->prefix . 'zane_auth_tokens';
    
    // Clean up expired tokens for this user
    $wpdb->query($wpdb->prepare(
        "DELETE FROM $table WHERE user_id = %d AND expires_at < NOW()",
        $user_id
    ));

    $result = $wpdb->insert($table, [
        'user_id'    => $user_id,
        'token_hash' => zane_hash_token($token),
        'expires_at' => date('Y-m-d H:i:s', time() + 7 * DAY_IN_SECONDS),
    ]);
    
    // If insert failed (table might not exist), force create tables and retry
    if ($result === false) {
        zane_create_tables();
        $wpdb->insert($table, [
            'user_id'    => $user_id,
            'token_hash' => zane_hash_token($token),
            'expires_at' => date('Y-m-d H:i:s', time() + 7 * DAY_IN_SECONDS),
        ]);
    }
}

function zane_validate_token($token) {
    global $wpdb;
    $table = $wpdb->prefix . 'zane_auth_tokens';
    $hash  = zane_hash_token($token);

    $row = $wpdb->get_row($wpdb->prepare(
        "SELECT user_id FROM $table WHERE token_hash = %s AND expires_at > NOW()",
        $hash
    ));

    return $row ? (int) $row->user_id : null;
}

function zane_get_current_user_from_token() {
    $auth = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
    if (empty($auth) && function_exists('getallheaders')) {
        $headers = getallheaders();
        $auth = isset($headers['Authorization']) ? $headers['Authorization'] : '';
        if (empty($auth)) {
            $auth = isset($headers['authorization']) ? $headers['authorization'] : '';
        }
    }
    // Also check REDIRECT variant
    if (empty($auth) && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $auth = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    if (strpos($auth, 'Bearer ') !== 0) return null;
    $token = substr($auth, 7);
    return zane_validate_token($token);
}

function zane_user_response($user) {
    return [
        'id'           => $user->ID,
        'email'        => $user->user_email,
        'first_name'   => get_user_meta($user->ID, 'first_name', true),
        'last_name'    => get_user_meta($user->ID, 'last_name', true),
        'display_name' => $user->display_name,
    ];
}

// ============================================================
// REST API ENDPOINTS
// ============================================================

add_action('rest_api_init', function() {
    $namespace = 'zane/v1';

    // --- REGISTER ---
    register_rest_route($namespace, '/register', [
        'methods'  => 'POST',
        'callback' => function(WP_REST_Request $req) {
            $email      = sanitize_email($req->get_param('email'));
            $password   = $req->get_param('password');
            $first_name = sanitize_text_field($req->get_param('first_name'));
            $last_name  = sanitize_text_field($req->get_param('last_name'));

            if (empty($email) || empty($password)) {
                return new WP_Error('missing_fields', 'Email and password are required.', ['status' => 400]);
            }
            if (strlen($password) < 6) {
                return new WP_Error('weak_password', 'Password must be at least 6 characters.', ['status' => 400]);
            }
            if (email_exists($email)) {
                return new WP_Error('email_exists', 'An account with this email already exists.', ['status' => 409]);
            }

            $username = sanitize_user(explode('@', $email)[0] . '_' . wp_rand(100, 999));
            $user_id = wp_create_user($username, $password, $email);

            if (is_wp_error($user_id)) {
                return new WP_Error('registration_failed', $user_id->get_error_message(), ['status' => 500]);
            }

            update_user_meta($user_id, 'first_name', $first_name);
            update_user_meta($user_id, 'last_name', $last_name);
            wp_update_user(['ID' => $user_id, 'display_name' => trim("$first_name $last_name")]);

            $token = zane_generate_token();
            zane_store_token($user_id, $token);

            return rest_ensure_response([
                'token' => $token,
                'user'  => zane_user_response(get_userdata($user_id)),
            ]);
        },
        'permission_callback' => '__return_true',
    ]);

    // --- LOGIN ---
    register_rest_route($namespace, '/login', [
        'methods'  => 'POST',
        'callback' => function(WP_REST_Request $req) {
            $email    = sanitize_email($req->get_param('email'));
            $password = $req->get_param('password');

            $user = wp_authenticate($email, $password);

            // wp_authenticate checks by login first; try email
            if (is_wp_error($user)) {
                $found = get_user_by('email', $email);
                if ($found) {
                    $user = wp_authenticate($found->user_login, $password);
                }
            }

            if (is_wp_error($user)) {
                return new WP_Error('invalid_credentials', 'Invalid email or password.', ['status' => 401]);
            }

            $token = zane_generate_token();
            zane_store_token($user->ID, $token);

            return rest_ensure_response([
                'token' => $token,
                'user'  => zane_user_response($user),
            ]);
        },
        'permission_callback' => '__return_true',
    ]);

    // --- LOGOUT ---
    register_rest_route($namespace, '/logout', [
        'methods'  => 'POST',
        'callback' => function() {
            global $wpdb;
            $auth = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
            if (strpos($auth, 'Bearer ') === 0) {
                $token = substr($auth, 7);
                $table = $wpdb->prefix . 'zane_auth_tokens';
                $wpdb->delete($table, ['token_hash' => zane_hash_token($token)]);
            }
            return rest_ensure_response(['success' => true]);
        },
        'permission_callback' => '__return_true',
    ]);

    // --- ME (current user) ---
    register_rest_route($namespace, '/me', [
        'methods'  => 'GET',
        'callback' => function() {
            $user_id = zane_get_current_user_from_token();
            if (!$user_id) {
                return new WP_Error('unauthorized', 'Invalid or expired token.', ['status' => 401]);
            }
            return rest_ensure_response(zane_user_response(get_userdata($user_id)));
        },
        'permission_callback' => '__return_true',
    ]);

    // --- SAVE ASSESSMENT ---
    register_rest_route($namespace, '/assessments', [
        'methods'  => 'POST',
        'callback' => function(WP_REST_Request $req) {
            global $wpdb;
            $user_id = zane_get_current_user_from_token();
            if (!$user_id) {
                return new WP_Error('unauthorized', 'Invalid or expired token.', ['status' => 401]);
            }

            $result_data = $req->get_param('result_data');
            if (empty($result_data)) {
                return new WP_Error('missing_data', 'result_data is required.', ['status' => 400]);
            }

            $table = $wpdb->prefix . 'zane_assessments';
            $overall_score = isset($result_data['finalReadinessScore']) ? intval($result_data['finalReadinessScore']) : 0;
            $readiness_level = isset($result_data['readinessLevel']) ? sanitize_text_field($result_data['readinessLevel']) : '';
            $subjects = [];
            if (isset($result_data['studentInfo']['selectedSubjects']) && is_array($result_data['studentInfo']['selectedSubjects'])) {
                $subjects = array_map('sanitize_text_field', $result_data['studentInfo']['selectedSubjects']);
            }

            $wpdb->insert($table, [
                'user_id'         => $user_id,
                'result_data'     => wp_json_encode($result_data),
                'overall_score'   => $overall_score,
                'readiness_level' => $readiness_level,
                'subjects'        => wp_json_encode($subjects),
            ]);

            return rest_ensure_response(['id' => $wpdb->insert_id]);
        },
        'permission_callback' => '__return_true',
    ]);

    // --- LIST ASSESSMENTS ---
    register_rest_route($namespace, '/assessments', [
        'methods'  => 'GET',
        'callback' => function() {
            global $wpdb;
            $user_id = zane_get_current_user_from_token();
            if (!$user_id) {
                return new WP_Error('unauthorized', 'Invalid or expired token.', ['status' => 401]);
            }

            $table = $wpdb->prefix . 'zane_assessments';
            $rows = $wpdb->get_results($wpdb->prepare(
                "SELECT id, overall_score, readiness_level, subjects, result_data, created_at FROM $table WHERE user_id = %d ORDER BY created_at DESC LIMIT 50",
                $user_id
            ));

            $results = array_map(function($row) {
                $result_data = json_decode($row->result_data, true);
                // Extract subject scores for summary display
                $subject_scores = [];
                if (isset($result_data['subjectResults']) && is_array($result_data['subjectResults'])) {
                    foreach ($result_data['subjectResults'] as $sr) {
                        $subject_scores[] = [
                            'subject'    => $sr['subject'] ?? '',
                            'score'      => (int) ($sr['score'] ?? 0),
                            'total'      => (int) ($sr['totalQuestions'] ?? 0),
                            'percentage' => (int) ($sr['percentage'] ?? 0),
                            'status'     => $sr['status'] ?? '',
                        ];
                    }
                }
                return [
                    'id'              => (int) $row->id,
                    'date'            => $row->created_at,
                    'overall_score'   => (int) $row->overall_score,
                    'readiness_level' => $row->readiness_level,
                    'subjects'        => json_decode($row->subjects, true) ?: [],
                    'subject_scores'  => $subject_scores,
                ];
            }, $rows);

            return rest_ensure_response($results);
        },
        'permission_callback' => '__return_true',
    ]);

    // --- GET SINGLE ASSESSMENT ---
    register_rest_route($namespace, '/assessments/(?P<id>\d+)', [
        'methods'  => 'GET',
        'callback' => function(WP_REST_Request $req) {
            global $wpdb;
            $user_id = zane_get_current_user_from_token();
            if (!$user_id) {
                return new WP_Error('unauthorized', 'Invalid or expired token.', ['status' => 401]);
            }

            $id = (int) $req->get_param('id');
            $table = $wpdb->prefix . 'zane_assessments';
            $row = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $table WHERE id = %d AND user_id = %d",
                $id, $user_id
            ));

            if (!$row) {
                return new WP_Error('not_found', 'Assessment not found.', ['status' => 404]);
            }

            return rest_ensure_response([
                'id'              => (int) $row->id,
                'date'            => $row->created_at,
                'overall_score'   => (int) $row->overall_score,
                'readiness_level' => $row->readiness_level,
                'subjects'        => json_decode($row->subjects, true) ?: [],
                'result_data'     => json_decode($row->result_data, true),
            ]);
        },
        'permission_callback' => '__return_true',
    ]);

    // --- ADMIN: LIST ASSESSMENTS FOR A USER ---
    register_rest_route($namespace, '/admin/assessments/(?P<user_id>\d+)', [
        'methods'  => 'GET',
        'callback' => function(WP_REST_Request $req) {
            global $wpdb;
            $current_user_id = zane_get_current_user_from_token();
            if (!$current_user_id || !user_can($current_user_id, 'manage_options')) {
                return new WP_Error('unauthorized', 'You do not have permission to perform this action.', ['status' => 403]);
            }

            $target_user_id = (int) $req->get_param('user_id');
            $table = $wpdb->prefix . 'zane_assessments';
            $rows = $wpdb->get_results($wpdb->prepare(
                "SELECT id, overall_score, readiness_level, subjects, result_data, created_at FROM $table WHERE user_id = %d ORDER BY created_at DESC",
                $target_user_id
            ));

            $results = array_map(function($row) {
                $result_data = json_decode($row->result_data, true);
                $subject_scores = [];
                if (isset($result_data['subjectResults']) && is_array($result_data['subjectResults'])) {
                    foreach ($result_data['subjectResults'] as $sr) {
                        $subject_scores[] = [
                            'subject'    => $sr['subject'] ?? '',
                            'score'      => (int) ($sr['score'] ?? 0),
                            'total'      => (int) ($sr['totalQuestions'] ?? 0),
                            'percentage' => (int) ($sr['percentage'] ?? 0),
                            'status'     => $sr['status'] ?? '',
                        ];
                    }
                }
                return [
                    'id'              => (int) $row->id,
                    'date'            => $row->created_at,
                    'overall_score'   => (int) $row->overall_score,
                    'readiness_level' => $row->readiness_level,
                    'subjects'        => json_decode($row->subjects, true) ?: [],
                    'subject_scores'  => $subject_scores,
                ];
            }, $rows);

            return rest_ensure_response($results);
        },
        'permission_callback' => '__return_true',
    ]);

    // --- DEBUG: Test token validation ---
    register_rest_route($namespace, '/debug-token', [
        'methods'  => 'GET',
        'callback' => function() {
            global $wpdb;
            $auth = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : 'NOT SET';
            $redirect = isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION']) ? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] : 'NOT SET';
            $all_headers = function_exists('getallheaders') ? getallheaders() : [];
            
            $table = $wpdb->prefix . 'zane_auth_tokens';
            $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table'") === $table;
            $token_count = $table_exists ? $wpdb->get_var("SELECT COUNT(*) FROM $table") : 'TABLE_MISSING';
            
            return rest_ensure_response([
                'http_authorization' => substr($auth, 0, 20) . '...',
                'redirect_auth' => substr($redirect, 0, 20) . '...',
                'all_headers_keys' => array_keys($all_headers),
                'table_exists' => $table_exists,
                'token_count' => $token_count,
            ]);
        },
        'permission_callback' => '__return_true',
    ]);
});

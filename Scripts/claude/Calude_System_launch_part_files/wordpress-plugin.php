<?php
/**
 * Plugin Name: LLB Question Bank Bridge
 * Plugin URI: https://coralrush.com
 * Description: Bridge between WordPress and LLB Question Bank API
 * Version: 1.0.0
 * Author: Your Name
 * License: GPL v2 or later
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// ============================================================================
// PLUGIN CONSTANTS
// ============================================================================

define('LLB_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('LLB_PLUGIN_URL', plugin_dir_url(__FILE__));
define('LLB_API_URL', 'https://api.coralrush.com');

// ============================================================================
// ACTIVATION HOOK
// ============================================================================

register_activation_hook(__FILE__, 'llb_activate_plugin');

function llb_activate_plugin() {
    // Create options table for caching
    add_option('llb_questions_cache', array());
    add_option('llb_cache_timestamp', 0);
    
    flush_rewrite_rules();
}

// ============================================================================
// DEACTIVATION HOOK
// ============================================================================

register_deactivation_hook(__FILE__, 'llb_deactivate_plugin');

function llb_deactivate_plugin() {
    flush_rewrite_rules();
}

// ============================================================================
// ENQUEUE SCRIPTS & STYLES
// ============================================================================

add_action('wp_enqueue_scripts', 'llb_enqueue_scripts');

function llb_enqueue_scripts() {
    // Only on quiz pages
    if (is_page('quiz') || is_page('llb-questions')) {
        wp_enqueue_style('llb-styles', LLB_PLUGIN_URL . 'assets/css/style.css');
        wp_enqueue_script('axios', 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js', array(), null, true);
        wp_enqueue_script('llb-script', LLB_PLUGIN_URL . 'assets/js/app.js', array('axios'), null, true);
        
        // Pass API URL to JavaScript
        wp_localize_script('llb-script', 'llb_config', array(
            'api_url' => LLB_API_URL,
            'nonce' => wp_create_nonce('llb_nonce'),
        ));
    }
}

// ============================================================================
// REST API ENDPOINTS
// ============================================================================

add_action('rest_api_init', 'llb_register_rest_endpoints');

function llb_register_rest_endpoints() {
    // Get questions
    register_rest_route('llb/v1', '/questions', array(
        'methods' => 'GET',
        'callback' => 'llb_get_questions',
        'permission_callback' => '__return_true',
    ));

    // Get single question
    register_rest_route('llb/v1', '/questions/(?P<id>[a-zA-Z0-9_-]+)', array(
        'methods' => 'GET',
        'callback' => 'llb_get_single_question',
        'permission_callback' => '__return_true',
    ));

    // Get subjects
    register_rest_route('llb/v1', '/subjects', array(
        'methods' => 'GET',
        'callback' => 'llb_get_subjects',
        'permission_callback' => '__return_true',
    ));

    // Get years
    register_rest_route('llb/v1', '/years', array(
        'methods' => 'GET',
        'callback' => 'llb_get_years',
        'permission_callback' => '__return_true',
    ));

    // Get study materials
    register_rest_route('llb/v1', '/study/(?P<id>[a-zA-Z0-9_-]+)', array(
        'methods' => 'GET',
        'callback' => 'llb_get_study_materials',
        'permission_callback' => '__return_true',
    ));

    // Update progress
    register_rest_route('llb/v1', '/progress', array(
        'methods' => 'POST',
        'callback' => 'llb_update_progress',
        'permission_callback' => function() {
            return is_user_logged_in();
        },
    ));

    // Get user progress
    register_rest_route('llb/v1', '/progress/(?P<id>[a-zA-Z0-9_-]+)', array(
        'methods' => 'GET',
        'callback' => 'llb_get_user_progress',
        'permission_callback' => function($request) {
            $user_id = $request->get_param('id');
            return is_user_logged_in() && (get_current_user_id() == $user_id || current_user_can('manage_options'));
        },
    ));

    // Get dashboard
    register_rest_route('llb/v1', '/dashboard', array(
        'methods' => 'GET',
        'callback' => 'llb_get_dashboard',
        'permission_callback' => function() {
            return is_user_logged_in();
        },
    ));
}

// ============================================================================
// REST CALLBACKS
// ============================================================================

/**
 * Get questions from LLB API
 */
function llb_get_questions($request) {
    $skip = $request->get_param('skip') ?: 0;
    $limit = $request->get_param('limit') ?: 20;
    $subject = $request->get_param('subject');
    $year = $request->get_param('year');

    // Check cache first
    $cache_key = md5("questions_$skip$limit$subject$year");
    $cached = get_transient("llb_$cache_key");
    
    if ($cached) {
        return $cached;
    }

    // Build API URL
    $url = LLB_API_URL . '/api/questions/';
    $params = array('skip' => $skip, 'limit' => $limit);
    
    if ($subject) $params['subject'] = $subject;
    if ($year) $params['year'] = $year;

    $url = add_query_arg($params, $url);

    // Call API
    $response = wp_remote_get($url, array(
        'timeout' => 10,
        'sslverify' => true,
    ));

    if (is_wp_error($response)) {
        return new WP_Error('api_error', 'Failed to fetch questions', array('status' => 500));
    }

    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body);

    // Cache for 1 hour
    set_transient("llb_$cache_key", $data, HOUR_IN_SECONDS);

    return $data;
}

/**
 * Get single question
 */
function llb_get_single_question($request) {
    $id = $request->get_param('id');

    $cached = get_transient("llb_question_$id");
    if ($cached) {
        return $cached;
    }

    $url = LLB_API_URL . '/api/questions/' . $id;

    $response = wp_remote_get($url, array(
        'timeout' => 10,
    ));

    if (is_wp_error($response)) {
        return new WP_Error('api_error', 'Failed to fetch question', array('status' => 500));
    }

    $data = json_decode(wp_remote_retrieve_body($response));

    set_transient("llb_question_$id", $data, HOUR_IN_SECONDS);

    return $data;
}

/**
 * Get subjects
 */
function llb_get_subjects() {
    $cached = get_transient('llb_subjects');
    if ($cached) {
        return $cached;
    }

    $url = LLB_API_URL . '/api/questions/subjects/list';

    $response = wp_remote_get($url, array('timeout' => 10));

    if (is_wp_error($response)) {
        return new WP_Error('api_error', 'Failed to fetch subjects', array('status' => 500));
    }

    $data = json_decode(wp_remote_retrieve_body($response));

    set_transient('llb_subjects', $data, DAY_IN_SECONDS);

    return $data;
}

/**
 * Get years
 */
function llb_get_years() {
    $cached = get_transient('llb_years');
    if ($cached) {
        return $cached;
    }

    $url = LLB_API_URL . '/api/questions/years/list';

    $response = wp_remote_get($url, array('timeout' => 10));

    if (is_wp_error($response)) {
        return new WP_Error('api_error', 'Failed to fetch years', array('status' => 500));
    }

    $data = json_decode(wp_remote_retrieve_body($response));

    set_transient('llb_years', $data, DAY_IN_SECONDS);

    return $data;
}

/**
 * Get study materials
 */
function llb_get_study_materials($request) {
    $id = $request->get_param('id');

    $cached = get_transient("llb_study_$id");
    if ($cached) {
        return $cached;
    }

    $url = LLB_API_URL . '/api/study/' . $id;

    $response = wp_remote_get($url, array('timeout' => 10));

    if (is_wp_error($response)) {
        return new WP_Error('api_error', 'Failed to fetch study materials', array('status' => 500));
    }

    $data = json_decode(wp_remote_retrieve_body($response));

    set_transient("llb_study_$id", $data, HOUR_IN_SECONDS);

    return $data;
}

/**
 * Update student progress (in WordPress database)
 */
function llb_update_progress($request) {
    $user_id = get_current_user_id();
    $question_id = $request->get_param('question_id');
    $status = $request->get_param('status') ?: 'in_progress';
    $attempts = $request->get_param('attempts') ?: 1;
    $score = $request->get_param('score') ?: 0;

    // Store in WordPress user meta
    $progress = get_user_meta($user_id, 'llb_progress', true) ?: array();
    
    $progress[$question_id] = array(
        'status' => $status,
        'attempts' => $attempts,
        'score' => $score,
        'timestamp' => current_time('mysql'),
    );

    update_user_meta($user_id, 'llb_progress', $progress);

    // Also send to backend API for syncing
    $api_url = LLB_API_URL . '/api/progress/' . $user_id . '/' . $question_id;

    wp_remote_post($api_url, array(
        'method' => 'PUT',
        'timeout' => 10,
        'headers' => array('Content-Type' => 'application/json'),
        'body' => wp_json_encode(array(
            'status' => $status,
            'attempts' => $attempts,
            'correct_answers' => $score,
        )),
    ));

    return array('success' => true, 'message' => 'Progress updated');
}

/**
 * Get user progress
 */
function llb_get_user_progress($request) {
    $user_id = get_current_user_id();
    $progress = get_user_meta($user_id, 'llb_progress', true) ?: array();

    return array(
        'user_id' => $user_id,
        'progress' => $progress,
    );
}

/**
 * Get dashboard
 */
function llb_get_dashboard() {
    $user_id = get_current_user_id();
    $progress = get_user_meta($user_id, 'llb_progress', true) ?: array();

    $total = count($progress);
    $completed = count(array_filter($progress, function($p) {
        return $p['status'] === 'completed';
    }));

    return array(
        'total_questions' => $total,
        'completed_questions' => $completed,
        'progress_percentage' => $total > 0 ? ($completed / $total * 100) : 0,
        'user_id' => $user_id,
    );
}

// ============================================================================
// SHORTCODE
// ============================================================================

add_shortcode('llb_questions', 'llb_shortcode');

function llb_shortcode($atts) {
    extract(shortcode_atts(array(
        'subject' => '',
        'year' => '',
    ), $atts));

    ob_start();
    ?>
    <div id="llb-app" class="llb-container">
        <p>Loading LLB Questions...</p>
    </div>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Load questions via API
            const subject = "<?php echo esc_js($subject); ?>";
            const year = "<?php echo esc_js($year); ?>";
            
            fetch('/wp-json/llb/v1/questions?' + (subject ? 'subject=' + subject : '') + (year ? '&year=' + year : ''))
                .then(r => r.json())
                .then(data => {
                    const app = document.getElementById('llb-app');
                    let html = '<div class="questions-list">';
                    
                    data.forEach(q => {
                        html += '<div class="question-card">';
                        html += '<h3>' + q.question_number + '. ' + q.question_text.substring(0, 100) + '...</h3>';
                        html += '<p>Subject: ' + q.subject + ' | Year: ' + q.year + ' | Marks: ' + q.marks + '</p>';
                        html += '<a href="#" class="read-more" data-id="' + q.id + '">View Full Question</a>';
                        html += '</div>';
                    });
                    
                    html += '</div>';
                    app.innerHTML = html;
                });
        });
    </script>
    <?php
    return ob_get_clean();
}

// ============================================================================
// ADMIN SETTINGS PAGE
// ============================================================================

add_action('admin_menu', 'llb_add_admin_menu');

function llb_add_admin_menu() {
    add_menu_page(
        'LLB Settings',
        'LLB Question Bank',
        'manage_options',
        'llb-settings',
        'llb_admin_page',
        'dashicons-book'
    );
}

function llb_admin_page() {
    ?>
    <div class="wrap">
        <h1>LLB Question Bank Settings</h1>
        
        <h2>API Status</h2>
        <p>
            API URL: <strong><?php echo LLB_API_URL; ?></strong><br>
            Status: <span id="api-status">Checking...</span>
        </p>

        <h2>Caching</h2>
        <p>
            <button class="button button-primary" id="clear-cache">Clear Cache</button>
        </p>

        <h2>Documentation</h2>
        <p>Add the shortcode to any page to display questions:</p>
        <code>[llb_questions subject="Law of Torts" year="2024"]</code>

        <h2>Recent Questions</h2>
        <div id="recent-questions">Loading...</div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Check API status
            fetch('<?php echo LLB_API_URL; ?>/health')
                .then(r => r.json())
                .then(d => {
                    document.getElementById('api-status').textContent = d.status;
                    document.getElementById('api-status').style.color = d.status === 'healthy' ? 'green' : 'red';
                })
                .catch(e => {
                    document.getElementById('api-status').textContent = 'Offline';
                    document.getElementById('api-status').style.color = 'red';
                });

            // Clear cache
            document.getElementById('clear-cache').addEventListener('click', function(e) {
                e.preventDefault();
                fetch('/wp-admin/admin.php?page=llb-settings&action=clear-cache', {
                    method: 'POST',
                })
                .then(() => alert('Cache cleared!'));
            });
        });
    </script>
    <?php
}

// ============================================================================
// END OF PLUGIN
// ============================================================================

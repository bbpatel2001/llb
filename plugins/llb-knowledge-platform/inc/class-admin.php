<?php
/**
 * LLB Admin - Admin interface
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class LLB_Admin {
    
    public static function init() {
        add_action( 'admin_menu', array( __CLASS__, 'add_menus' ) );
        add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
        add_action( 'wp_ajax_llb_check_backend', array( __CLASS__, 'check_backend' ) );
    }
    
    public static function add_menus() {
        // Main menu
        add_menu_page(
            'LLB Knowledge Platform',
            'LLB Platform',
            'manage_options',
            'llb-platform',
            array( __CLASS__, 'dashboard_page' ),
            'dashicons-book',
            6
        );
        
        // Settings
        add_submenu_page(
            'llb-platform',
            'Settings',
            'Settings',
            'manage_options',
            'llb-settings',
            array( __CLASS__, 'settings_page' )
        );
        
        // Questions
        add_submenu_page(
            'llb-platform',
            'Questions',
            'Questions',
            'manage_options',
            'llb-questions',
            array( __CLASS__, 'questions_page' )
        );
    }
    
    public static function register_settings() {
        register_setting( 'llb_settings', 'llb_api_url', array(
            'default' => 'http://localhost:6000',
        ));
    }
    
    public static function dashboard_page() {
        $backend_status = LLB_API_Client::check_health() ? 'Online ✅' : 'Offline ❌';
        ?>
        <div class="wrap">
            <h1>LLB Knowledge Platform</h1>
            <div class="notice notice-info"><p>Backend Status: <strong><?php echo $backend_status; ?></strong></p></div>
            
            <h2>Quick Stats</h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 20px;">
                <div style="background: white; padding: 20px; border-left: 4px solid #1a3a52;">
                    <h3>Questions</h3>
                    <p style="font-size: 24px; font-weight: bold;">Loading...</p>
                </div>
                <div style="background: white; padding: 20px; border-left: 4px solid #2980b9;">
                    <h3>Papers</h3>
                    <p style="font-size: 24px; font-weight: bold;">Loading...</p>
                </div>
                <div style="background: white; padding: 20px; border-left: 4px solid #27ae60;">
                    <h3>Quizzes</h3>
                    <p style="font-size: 24px; font-weight: bold;">Loading...</p>
                </div>
                <div style="background: white; padding: 20px; border-left: 4px solid #e74c3c;">
                    <h3>Flashcards</h3>
                    <p style="font-size: 24px; font-weight: bold;">Loading...</p>
                </div>
            </div>
        </div>
        <?php
    }
    
    public static function settings_page() {
        ?>
        <div class="wrap">
            <h1>LLB Settings</h1>
            <form method="post" action="options.php">
                <?php settings_fields( 'llb_settings' ); ?>
                <table class="form-table">
                    <tr>
                        <th scope="row"><label for="llb_api_url">Backend API URL</label></th>
                        <td>
                            <input 
                                type="text" 
                                id="llb_api_url" 
                                name="llb_api_url" 
                                value="<?php echo esc_attr( get_option( 'llb_api_url', 'http://localhost:6000' ) ); ?>" 
                                class="regular-text"
                            />
                            <p class="description">Enter the Node.js backend API URL</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
            
            <hr />
            
            <h2>Backend Status</h2>
            <button class="button button-primary" id="llb-check-backend">Check Backend Connection</button>
            <div id="llb-status-result" style="margin-top: 10px;"></div>
        </div>
        
        <script>
        document.getElementById('llb-check-backend').addEventListener('click', function() {
            fetch(ajaxurl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'action=llb_check_backend'
            })
            .then(r => r.json())
            .then(data => {
                document.getElementById('llb-status-result').innerHTML = 
                    '<div class="notice ' + (data.success ? 'notice-success' : 'notice-error') + '"><p>' + 
                    data.data.message + '</p></div>';
            });
        });
        </script>
        <?php
    }
    
    public static function questions_page() {
        ?>
        <div class="wrap">
            <h1>Questions from Backend</h1>
            <p>Loading questions from API...</p>
            <div id="llb-questions-list" style="margin-top: 20px;"></div>
        </div>
        
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            fetch('<?php echo LLB_API_Client::get_url(); ?>/questions?limit=10')
                .then(r => r.json())
                .then(data => {
                    let html = '<table class="wp-list-table widefat">';
                    html += '<thead><tr><th>Question</th><th>Type</th><th>Subject</th></tr></thead>';
                    if (data.questions) {
                        data.questions.forEach(q => {
                            html += '<tr><td>' + q.text + '</td><td>' + q.type + '</td><td>' + q.subject + '</td></tr>';
                        });
                    } else {
                        html += '<tr><td colspan="3">No questions found</td></tr>';
                    }
                    html += '</table>';
                    document.getElementById('llb-questions-list').innerHTML = html;
                });
        });
        </script>
        <?php
    }
    
    public static function check_backend() {
        $status = LLB_API_Client::check_health();
        wp_send_json( array(
            'success' => $status,
            'data' => array(
                'message' => $status ? 'Backend is online! ✅' : 'Backend is offline ❌',
            ),
        ));
    }
}

<?php
/**
 * Plugin Name: LLB Knowledge Platform
 * Plugin URI: https://coralrush.com/
 * Description: Complete LLB Knowledge Platform with Question Papers, Case Laws, Flashcards, and Quizzes
 * Version: 2.0.0
 * Author: CoralRush
 * License: GPL v2 or later
 * Text Domain: llb-knowledge-platform
 * Domain Path: /languages
 * Requires at least: 5.0
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Plugin constants
define( 'LLB_KP_PATH', plugin_dir_path( __FILE__ ) );
define( 'LLB_KP_URL', plugin_dir_url( __FILE__ ) );
define( 'LLB_KP_VERSION', '2.0.0' );

// Load classes
require_once LLB_KP_PATH . 'inc/class-api-client.php';
require_once LLB_KP_PATH . 'inc/class-admin.php';
require_once LLB_KP_PATH . 'inc/class-shortcodes.php';

// Main plugin class
class LLB_Knowledge_Platform {
    
    public static function init() {
        add_action( 'init', array( __CLASS__, 'register_post_types' ) );
        add_action( 'init', array( __CLASS__, 'load_classes' ) );
        add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_frontend' ) );
        add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_admin' ) );
    }
    
    public static function load_classes() {
        LLB_Admin::init();
        LLB_Shortcodes::init();
        
        // Update API URL from settings
        $api_url = get_option( 'llb_api_url', 'http://localhost:6000' );
        if ( ! empty( $api_url ) ) {
            LLB_API_Client::set_url( $api_url );
        }
    }
    
    public static function register_post_types() {
        register_post_type( 'llb_question', array(
            'label' => 'Questions',
            'public' => true,
            'show_in_rest' => true,
            'supports' => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
            'menu_icon' => 'dashicons-index-card',
        ));
        
        register_post_type( 'llb_flashcard', array(
            'label' => 'Flashcards',
            'public' => true,
            'show_in_rest' => true,
            'supports' => array( 'title', 'editor' ),
            'menu_icon' => 'dashicons-format-quote',
        ));
        
        register_post_type( 'llb_quiz', array(
            'label' => 'Quizzes',
            'public' => true,
            'show_in_rest' => true,
            'supports' => array( 'title', 'editor' ),
            'menu_icon' => 'dashicons-list-view',
        ));
    }
    
    public static function enqueue_frontend() {
        wp_enqueue_style( 'llb-style', LLB_KP_URL . 'assets/llb-style.css', array(), LLB_KP_VERSION );
    }
    
    public static function enqueue_admin() {
        wp_enqueue_style( 'llb-admin-style', LLB_KP_URL . 'assets/llb-style.css', array(), LLB_KP_VERSION );
    }
}

// Initialize
LLB_Knowledge_Platform::init();

// Activation hook
register_activation_hook( __FILE__, function() {
    LLB_Knowledge_Platform::register_post_types();
    flush_rewrite_rules();
});

// Deactivation hook
register_deactivation_hook( __FILE__, function() {
    flush_rewrite_rules();
});

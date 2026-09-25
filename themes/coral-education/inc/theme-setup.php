<?php
/**
 * Theme Setup & Activation Defaults
 * 
 * Sets up default theme options on activation
 * 
 * @package Education Zone
 * @subpackage Coral Education
 */

function coral_education_set_default_options() {
    // Only run once on activation
    if ( get_option( 'coral_education_theme_activated' ) ) {
        return;
    }

    // Enable main sections by default
    $sections_to_enable = array(
        'education_zone_ed_slider_section',
        'education_zone_ed_info_section',
        'education_zone_ed_welcome_section',
        'education_zone_ed_llb_academy_section',
        'education_zone_ed_courses_section',
        'education_zone_ed_extra_info_section',
        'education_zone_ed_choose_us_section',
        'education_zone_ed_testimonials_section',
    );

    foreach ( $sections_to_enable as $option_name ) {
        if ( ! get_option( $option_name ) ) {
            update_option( $option_name, '1' );
        }
    }

    // Set default banner text
    if ( ! get_option( 'education_zone_banner_title' ) ) {
        update_option( 'education_zone_banner_title', __( 'Welcome to Coral Education', 'education-zone' ) );
    }

    if ( ! get_option( 'education_zone_banner_description' ) ) {
        update_option( 'education_zone_banner_description', __( 'Comprehensive legal education for law schools and academic institutions', 'education-zone' ) );
    }

    // Set default LLB Academy section text
    if ( ! get_option( 'education_zone_llb_academy_title' ) ) {
        update_option( 'education_zone_llb_academy_title', 'LLB Academy' );
    }

    if ( ! get_option( 'education_zone_llb_academy_subtitle' ) ) {
        update_option( 'education_zone_llb_academy_subtitle', 'Master Law Degree Program' );
    }

    if ( ! get_option( 'education_zone_llb_academy_description' ) ) {
        update_option( 'education_zone_llb_academy_description', 'Comprehensive legal education with courses covering Constitutional Law, Criminal Law, Civil Law, and more.' );
    }

    if ( ! get_option( 'education_zone_llb_academy_button' ) ) {
        update_option( 'education_zone_llb_academy_button', 'Explore Programs' );
    }

    if ( ! get_option( 'education_zone_llb_academy_button_link' ) ) {
        update_option( 'education_zone_llb_academy_button_link', '#' );
    }

    if ( ! get_option( 'education_zone_llb_academy_features' ) ) {
        update_option( 'education_zone_llb_academy_features', 'Expert Faculty|Comprehensive Curriculum|Study Materials|Practice Tests' );
    }

    // Mark that activation has been run
    update_option( 'coral_education_theme_activated', true );
}

// Hook into after_switch_theme to run on activation
add_action( 'after_switch_theme', 'coral_education_set_default_options' );

// Also run on theme init in case theme files are uploaded directly
if ( ! get_option( 'coral_education_theme_activated' ) ) {
    add_action( 'wp_head', function() {
        if ( is_user_logged_in() && current_user_can( 'edit_theme_options' ) ) {
            coral_education_set_default_options();
        }
    }, 1 );
}

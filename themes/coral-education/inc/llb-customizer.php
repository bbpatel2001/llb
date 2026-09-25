<?php
/**
 * LLB Academy Customizer Settings
 * 
 * @package Education Zone
 * @subpackage LLB Academy
 */

function education_zone_llb_customizer_settings( $wp_customize ) {
    
    /* Option list of all pages */
    $options_pages = array();
    $options_pages_obj = get_posts( 'post_type=page&posts_per_page=-1' );
    $options_pages[''] = __( 'Choose Page', 'education-zone' );
    foreach ( $options_pages_obj as $education_pages ) {
        $options_pages[$education_pages->ID] = $education_pages->post_title;
    }

    /** LLB Academy Section */
    $wp_customize->add_section(
        'education_zone_llb_academy_section_settings',
        array(
            'title' => __( 'LLB Academy Section', 'education-zone' ),
            'priority' => 41,
            'capability' => 'edit_theme_options',
            'panel' => 'education_zone_home_page_settings'
        )
    );
    
    /** Enable LLB Academy Section */   
    $wp_customize->add_setting(
        'education_zone_ed_llb_academy_section',
        array(
            'default' => '1',
            'sanitize_callback' => 'education_zone_sanitize_checkbox',
        )
    );
    
    $wp_customize->add_control(
        'education_zone_ed_llb_academy_section',
        array(
            'label' => __( 'Enable LLB Academy Section', 'education-zone' ),
            'section' => 'education_zone_llb_academy_section_settings',
            'type' => 'checkbox',
        )
    );

    /** LLB Academy Title */
    $wp_customize->add_setting(
        'education_zone_llb_academy_title',
        array(
            'default' => 'LLB Academy',
            'sanitize_callback' => 'sanitize_text_field',
        )
    );
    
    $wp_customize->add_control(
        'education_zone_llb_academy_title',
        array(
            'label' => __( 'Section Title', 'education-zone' ),
            'section' => 'education_zone_llb_academy_section_settings',
            'type' => 'text',
        )
    );

    /** LLB Academy Subtitle */
    $wp_customize->add_setting(
        'education_zone_llb_academy_subtitle',
        array(
            'default' => 'Master Law Degree Program',
            'sanitize_callback' => 'sanitize_text_field',
        )
    );
    
    $wp_customize->add_control(
        'education_zone_llb_academy_subtitle',
        array(
            'label' => __( 'Subtitle', 'education-zone' ),
            'section' => 'education_zone_llb_academy_section_settings',
            'type' => 'text',
        )
    );

    /** LLB Academy Description */
    $wp_customize->add_setting(
        'education_zone_llb_academy_description',
        array(
            'default' => 'Comprehensive legal education with courses covering Constitutional Law, Criminal Law, Civil Law, and more.',
            'sanitize_callback' => 'sanitize_textarea_field',
        )
    );
    
    $wp_customize->add_control(
        'education_zone_llb_academy_description',
        array(
            'label' => __( 'Description', 'education-zone' ),
            'section' => 'education_zone_llb_academy_section_settings',
            'type' => 'textarea',
        )
    );

    /** LLB Academy Image */
    $wp_customize->add_setting(
        'education_zone_llb_academy_image',
        array(
            'sanitize_callback' => 'esc_url_raw',
        )
    );
    
    $wp_customize->add_control(
        new WP_Customize_Image_Control(
            $wp_customize,
            'education_zone_llb_academy_image',
            array(
                'label' => __( 'Section Image', 'education-zone' ),
                'section' => 'education_zone_llb_academy_section_settings',
            )
        )
    );

    /** LLB Academy Button Text */
    $wp_customize->add_setting(
        'education_zone_llb_academy_button',
        array(
            'default' => 'Explore Programs',
            'sanitize_callback' => 'sanitize_text_field',
        )
    );
    
    $wp_customize->add_control(
        'education_zone_llb_academy_button',
        array(
            'label' => __( 'Button Text', 'education-zone' ),
            'section' => 'education_zone_llb_academy_section_settings',
            'type' => 'text',
        )
    );

    /** LLB Academy Button Link */
    $wp_customize->add_setting(
        'education_zone_llb_academy_button_link',
        array(
            'default' => '#',
            'sanitize_callback' => 'esc_url_raw',
        )
    );
    
    $wp_customize->add_control(
        'education_zone_llb_academy_button_link',
        array(
            'label' => __( 'Button Link', 'education-zone' ),
            'section' => 'education_zone_llb_academy_section_settings',
            'type' => 'url',
        )
    );

    /** LLB Academy Features */
    $wp_customize->add_setting(
        'education_zone_llb_academy_features',
        array(
            'default' => 'Expert Faculty|Comprehensive Curriculum|Study Materials|Practice Tests',
            'sanitize_callback' => 'sanitize_textarea_field',
        )
    );
    
    $wp_customize->add_control(
        'education_zone_llb_academy_features',
        array(
            'label' => __( 'Features (separated by |)', 'education-zone' ),
            'description' => __( 'Example: Feature 1|Feature 2|Feature 3', 'education-zone' ),
            'section' => 'education_zone_llb_academy_section_settings',
            'type' => 'textarea',
        )
    );
}

add_action( 'customize_register', 'education_zone_llb_customizer_settings' );

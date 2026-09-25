<?php
/**
 * LLB Knowledge Platform - Child Theme Functions
 * Customized for Law Learning Management System
 * Based on: Smart Education + Education Spark + Education Zone
 */

// Exit if accessed directly
if ( !defined( 'ABSPATH' ) ) exit;

/**
 * LLB Theme Setup
 */
function education_zone_llb_setup(){
    load_child_theme_textdomain( 'education-zone-llb', get_stylesheet_directory() . '/languages' );
    add_theme_support( 'automatic-feed-links' );
    add_theme_support( 'title-tag' );
}
add_action( 'after_setup_theme', 'education_zone_llb_setup', 101 );

/**
 * Enqueue LLB Theme Styles and Scripts
 */
function education_zone_llb_styles() {
    $my_theme = wp_get_theme();
    $version  = $my_theme['Version'];

    // Enqueue parent theme stylesheet
    wp_enqueue_style( 'education-zone-style', get_template_directory_uri() . '/style.css' );
    
    // Enqueue child theme stylesheet with customizations
    wp_enqueue_style( 'education-zone-llb-style', get_stylesheet_directory_uri() . '/style.css', array( 'education-zone-style' ), $version );
    
    // Enqueue custom JavaScript for LLB features
    wp_enqueue_script( 'education-zone-llb-custom-js', get_stylesheet_directory_uri() . '/js/custom.js', array('jquery'), $version, true );
}
add_action( 'wp_enqueue_scripts', 'education_zone_llb_styles' );

/**
 * LLB Theme Customizer Options
 */
function education_zone_llb_customize_register( $wp_customize ){
    
    // Remove parent theme menu label if needed
    if( $wp_customize->get_control( 'education_zone_top_menu_label' ) ) {
        $wp_customize->remove_control( 'education_zone_top_menu_label' );
    }

    // Set default banner style
    if( $wp_customize->get_setting( 'education_zone_slider_type' ) ) {
        $wp_customize->get_setting( 'education_zone_slider_type' )->default = 'static_banner';
    }

    /**
     * LLB Specific Settings - Address
     */
    $wp_customize->add_setting(
        'education_zone_llb_address',
        array(
            'default'           => 'Law School, Main Campus',
            'sanitize_callback' => 'wp_kses_post',
        )
    );
    
    $wp_customize->add_control(
        'education_zone_llb_address',
        array(
            'label'   => __( 'School/Institution Address', 'education-zone-llb' ),
            'section' => 'education_zone_top_header_settings',
            'type'    => 'text',
        )
    );

    /**
     * LLB Specific Settings - CTA Label
     */
    $wp_customize->add_setting(
        'education_zone_llb_cta_label',
        array(
            'default'           => 'Enroll Now',
            'sanitize_callback' => 'sanitize_text_field',
        )
    );
    
    $wp_customize->add_control(
        'education_zone_llb_cta_label',
        array(
            'label'   => __( 'CTA Button Label', 'education-zone-llb' ),
            'section' => 'education_zone_top_header_settings',
            'type'    => 'text',
        )
    );

    /**
     * LLB Specific Settings - CTA Link
     */
    $wp_customize->add_setting(
        'education_zone_llb_cta_link',
        array(
            'default'           => '',
            'sanitize_callback' => 'esc_url_raw',
        )
    );
    
    $wp_customize->add_control(
        'education_zone_llb_cta_link',
        array(
            'label'   => __( 'CTA Button Link', 'education-zone-llb' ),
            'section' => 'education_zone_top_header_settings',
            'type'    => 'url',
        )
    );

    /**
     * Enable/Disable Search Form
     */
    $wp_customize->add_setting( 
        'education_zone_llb_ed_search_form', 
        array(
            'default'           => true,
            'sanitize_callback' => 'education_zone_sanitize_checkbox'
        ) 
    );

    $wp_customize->add_control(
        'education_zone_llb_ed_search_form',
        array(
            'section'     => 'education_zone_top_header_settings',
            'label'       => __( 'Show Search Form', 'education-zone-llb' ),
            'description' => __( 'Display search form in header for finding courses and content', 'education-zone-llb' ),
            'type'        => 'checkbox',
        )
    );

}
add_action( 'customize_register', 'education_zone_llb_customize_register', 101 );

/**
 * Custom Site Header for LLB
 */
function education_zone_llb_site_header(){
    $phone          = get_theme_mod( 'education_zone_phone' );
    $email          = get_theme_mod( 'education_zone_email' );
    $address        = get_theme_mod( 'education_zone_llb_address' );
    $ed_search_form = get_theme_mod( 'education_zone_llb_ed_search_form', true );
    $cta_label      = get_theme_mod( 'education_zone_llb_cta_label', 'Enroll Now' );
    $cta_links      = get_theme_mod( 'education_zone_llb_cta_link' );
    ?>
    <header id="masthead" class="site-header header-two llb-header" role="banner" itemscope itemtype="https://schema.org/WPHeader">
        <div class="header-holder">
            <?php 
            if( has_nav_menu( 'secondary' ) ){ ?>
                <div class="header-top">
                    <div class="container">
                        <div class="top-links">
                            <nav id="secondary-navigation" class="secondary-nav" role="navigation">               
                                <?php wp_nav_menu( array( 'theme_location' => 'secondary', 'menu_id' => 'secondary-menu', 'fallback_cb' => false ) ); ?>
                            </nav>
                        </div>
                        <?php if( get_theme_mod('education_zone_ed_social') ) do_action('education_zone_social'); ?>
                    </div>
                </div>
            <?php 
            } ?>
            <div class="header-m">
                <div class="container">
                    <?php  
                    education_zone_site_branding(); 

                    if( $email || $phone ){
                        echo '<div class="site-info-wrap llb-info">';
                            echo '<div class="info-box-wrap">';   
                                if( $email || $phone ){ ?>
                                    <div class="info-box llb-contact"> 
                                        <i class="fa fa-phone" aria-hidden="true"></i>
                                        <span class="contact-info">
                                            <?php if( $phone ){ ?><a href="<?php echo esc_url( 'tel:' . preg_replace( '/[^\d+]/', '', $phone ) ); ?>"><?php echo esc_html( $phone ); ?></a><?php } 
                                            if( $email ){ ?><a href="mailto:<?php echo sanitize_email( $email ); ?>"><?php echo esc_html( $email ); ?></a><?php } ?>
                                        </span>
                                    </div>
                                <?php
                                } 
                                if( $address ){ ?>
                                    <div class="info-box llb-address">
                                        <i class="fa fa-map-marker" aria-hidden="true"></i>
                                        <span><?php echo esc_html( $address ); ?></span>
                                    </div>
                                <?php }
                            
                            echo '</div>';
                            if( $cta_label && $cta_links ){ ?>
                                <a href="<?php echo esc_url( $cta_links ); ?>" class="apply-btn llb-cta"><?php echo esc_html( $cta_label ); ?></a>
                            <?php } 
                        echo '</div>';
                    } ?>
                </div>
            </div>
        </div>
        <div class="header-bottom">
            <div class="container">
                <nav id="site-navigation" class="main-navigation" role="navigation" itemscope itemtype="https://schema.org/SiteNavigationElement">                        
                    <?php wp_nav_menu( array( 'theme_location' => 'primary', 'menu_id' => 'primary-menu' ) ); ?>
                </nav>
                
                <?php
                if( $ed_search_form ){ ?>
                    <div class="form-section">
                        <a href="#" id="search-btn" class="search-toggle-btn" data-toggle-target=".header-search-modal" data-toggle-body-class="showing-search-modal" aria-expanded="false" data-set-focus=".header-search-modal .search-field">
                            <i class="fa fa-search" aria-hidden="true"></i>
                        </a>
                        <div class="example head-search-form search header-searh-wrap header-search-modal cover-modal" data-modal-target-string=".header-search-modal">                       
                            <?php get_search_form(); ?>
                            <button class="btn-form-close" data-toggle-target=".header-search-modal" data-toggle-body-class="showing-search-modal" aria-expanded="false" data-set-focus=".header-search-modal">  </button>
                        </div>
                    </div>
                <?php 
                } ?>
            </div>
        </div>
    </header>
    <?php
}

/**
 * LLB Footer
 */
function education_zone_llb_footer_bottom(){ ?>
    <div class="site-info llb-footer-info">
        <?php 
        if( get_theme_mod('education_zone_ed_social') ) do_action('education_zone_social'); 

        $copyright_text = get_theme_mod( 'education_zone_footer_copyright_text' ); ?>
        <p> 
            <?php 
            if( $copyright_text ){
                echo '<span>' . wp_kses_post( $copyright_text ) . '</span>';
            } else {
                echo '<span>';
                    echo esc_html__( 'Copyright &copy;', 'education-zone-llb' ) . date_i18n( esc_html__( 'Y', 'education-zone-llb' ) ); 
                echo ' <a href="' . esc_url( home_url( '/' ) ) . '">' . esc_html( get_bloginfo( 'name' ) ) . '</a>.</span>';
            }?>
            <span class="by">
                <?php echo esc_html__( 'LLB Knowledge Platform | Powered by', 'education-zone-llb' ); ?>
                <a rel="nofollow" href="<?php echo esc_url( 'https://rarathemes.com/' ); ?>" target="_blank"><?php echo esc_html__( 'Rara Themes', 'education-zone-llb' ); ?></a>.
            </span>
            <?php 
                if ( function_exists( 'the_privacy_policy_link' ) ) {
                    the_privacy_policy_link();
                }
            ?>
        </p>
    </div>
    <?php
}

/**
 * Helper function to check if checkbox is enabled
 */
if( ! function_exists( 'education_zone_sanitize_checkbox' ) ) {
    function education_zone_sanitize_checkbox( $input ) {
        return ( ( isset( $input ) && true == $input ) ? true : false );
    }
}

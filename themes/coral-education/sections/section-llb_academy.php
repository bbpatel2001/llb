<?php
/**
 * LLB Academy Section
 * 
 * @package Education Zone
 * @subpackage LLB Academy
 */

$llb_title = get_theme_mod( 'education_zone_llb_academy_title', 'LLB Academy' );
$llb_subtitle = get_theme_mod( 'education_zone_llb_academy_subtitle', 'Master Law Degree Program' );
$llb_description = get_theme_mod( 'education_zone_llb_academy_description', 'Comprehensive legal education with courses covering Constitutional Law, Criminal Law, Civil Law, and more.' );
$llb_image = get_theme_mod( 'education_zone_llb_academy_image' );
$llb_button_text = get_theme_mod( 'education_zone_llb_academy_button', 'Explore Programs' );
$llb_button_link = get_theme_mod( 'education_zone_llb_academy_button_link', '#' );
$llb_features = get_theme_mod( 'education_zone_llb_academy_features', 'Expert Faculty|Comprehensive Curriculum|Study Materials|Practice Tests' );

?>

<div class="container">
    <div class="llb-academy-wrapper">
        
        <!-- LLB Academy Header -->
        <div class="llb-academy-header">
            <h2 class="llb-academy-title"><?php echo esc_html( $llb_title ); ?></h2>
            <h3 class="llb-academy-subtitle"><?php echo esc_html( $llb_subtitle ); ?></h3>
            <p class="llb-academy-description"><?php echo esc_html( $llb_description ); ?></p>
        </div>

        <!-- LLB Academy Content -->
        <div class="llb-academy-content">
            <?php if ( $llb_image ) { ?>
                <div class="llb-academy-image">
                    <img src="<?php echo esc_url( $llb_image ); ?>" alt="<?php echo esc_attr( $llb_title ); ?>">
                </div>
            <?php } ?>

            <div class="llb-academy-info">
                <!-- Features -->
                <?php if ( $llb_features ) { ?>
                    <div class="llb-features">
                        <h4><?php esc_html_e( 'Key Features', 'education-zone' ); ?></h4>
                        <ul class="llb-features-list">
                            <?php 
                            $features = array_map( 'trim', explode( '|', $llb_features ) );
                            foreach ( $features as $feature ) {
                                if ( ! empty( $feature ) ) {
                                    echo '<li><span class="check-icon">✓</span> ' . esc_html( $feature ) . '</li>';
                                }
                            }
                            ?>
                        </ul>
                    </div>
                <?php } ?>

                <!-- CTA Button -->
                <?php if ( $llb_button_text && $llb_button_link ) { ?>
                    <div class="llb-academy-cta">
                        <a href="<?php echo esc_url( $llb_button_link ); ?>" class="btn btn-llb-academy">
                            <?php echo esc_html( $llb_button_text ); ?>
                        </a>
                    </div>
                <?php } ?>
            </div>
        </div>

        <!-- Quick Links -->
        <div class="llb-quick-links">
            <h4><?php esc_html_e( 'Program Categories', 'education-zone' ); ?></h4>
            <div class="llb-links-grid">
                <div class="llb-link-card">
                    <h5><?php esc_html_e( 'Question Papers', 'education-zone' ); ?></h5>
                    <p><?php esc_html_e( '10+ years of exam papers', 'education-zone' ); ?></p>
                    <a href="<?php echo esc_url( get_post_type_archive_link( 'llb_question_paper' ) ); ?>"><?php esc_html_e( 'Browse →', 'education-zone' ); ?></a>
                </div>

                <div class="llb-link-card">
                    <h5><?php esc_html_e( 'Case Laws', 'education-zone' ); ?></h5>
                    <p><?php esc_html_e( 'Important court judgments', 'education-zone' ); ?></p>
                    <a href="<?php echo esc_url( get_post_type_archive_link( 'llb_case_law' ) ); ?>"><?php esc_html_e( 'Browse →', 'education-zone' ); ?></a>
                </div>

                <div class="llb-link-card">
                    <h5><?php esc_html_e( 'Acts & Statutes', 'education-zone' ); ?></h5>
                    <p><?php esc_html_e( 'Legal reference material', 'education-zone' ); ?></p>
                    <a href="<?php echo esc_url( get_post_type_archive_link( 'llb_statute' ) ); ?>"><?php esc_html_e( 'Browse →', 'education-zone' ); ?></a>
                </div>

                <div class="llb-link-card">
                    <h5><?php esc_html_e( 'Study Materials', 'education-zone' ); ?></h5>
                    <p><?php esc_html_e( 'Notes, flashcards & MCQs', 'education-zone' ); ?></p>
                    <a href="<?php echo esc_url( get_post_type_archive_link( 'llb_study_material' ) ); ?>"><?php esc_html_e( 'Browse →', 'education-zone' ); ?></a>
                </div>
            </div>
        </div>

    </div>
</div>

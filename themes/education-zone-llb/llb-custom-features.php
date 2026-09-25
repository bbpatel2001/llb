<?php
/**
 * LLB Knowledge Platform - Custom Features
 * Law-Specific Features for LLB Theme
 */

if ( !defined( 'ABSPATH' ) ) exit;

/**
 * Register Custom Post Types for Law Content
 */
function llb_register_custom_post_types() {
    
    // Question Papers Post Type
    register_post_type( 'llb_question_paper', array(
        'labels' => array(
            'name'               => __( 'Question Papers', 'llb-platform' ),
            'singular_name'      => __( 'Question Paper', 'llb-platform' ),
            'add_new'            => __( 'Add Question Paper', 'llb-platform' ),
            'add_new_item'       => __( 'Add New Question Paper', 'llb-platform' ),
            'edit_item'          => __( 'Edit Question Paper', 'llb-platform' ),
            'view_item'          => __( 'View Question Paper', 'llb-platform' ),
            'search_items'       => __( 'Search Question Papers', 'llb-platform' ),
        ),
        'public'             => true,
        'show_ui'            => true,
        'show_in_menu'       => true,
        'supports'           => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
        'has_archive'        => true,
        'rewrite'            => array( 'slug' => 'question-papers' ),
        'menu_icon'          => 'dashicons-book'
    ) );

    // Case Laws Post Type
    register_post_type( 'llb_case_law', array(
        'labels' => array(
            'name'               => __( 'Case Laws', 'llb-platform' ),
            'singular_name'      => __( 'Case Law', 'llb-platform' ),
            'add_new'            => __( 'Add Case Law', 'llb-platform' ),
            'add_new_item'       => __( 'Add New Case Law', 'llb-platform' ),
            'edit_item'          => __( 'Edit Case Law', 'llb-platform' ),
            'view_item'          => __( 'View Case Law', 'llb-platform' ),
            'search_items'       => __( 'Search Case Laws', 'llb-platform' ),
        ),
        'public'             => true,
        'show_ui'            => true,
        'show_in_menu'       => true,
        'supports'           => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
        'has_archive'        => true,
        'rewrite'            => array( 'slug' => 'case-laws' ),
        'menu_icon'          => 'dashicons-scales'
    ) );

    // Acts & Statutes Post Type
    register_post_type( 'llb_statute', array(
        'labels' => array(
            'name'               => __( 'Acts & Statutes', 'llb-platform' ),
            'singular_name'      => __( 'Act/Statute', 'llb-platform' ),
            'add_new'            => __( 'Add Statute', 'llb-platform' ),
            'add_new_item'       => __( 'Add New Statute', 'llb-platform' ),
            'edit_item'          => __( 'Edit Statute', 'llb-platform' ),
            'view_item'          => __( 'View Statute', 'llb-platform' ),
            'search_items'       => __( 'Search Acts', 'llb-platform' ),
        ),
        'public'             => true,
        'show_ui'            => true,
        'show_in_menu'       => true,
        'supports'           => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
        'has_archive'        => true,
        'rewrite'            => array( 'slug' => 'acts-statutes' ),
        'menu_icon'          => 'dashicons-format-quote'
    ) );

    // Study Materials Post Type
    register_post_type( 'llb_study_material', array(
        'labels' => array(
            'name'               => __( 'Study Materials', 'llb-platform' ),
            'singular_name'      => __( 'Study Material', 'llb-platform' ),
            'add_new'            => __( 'Add Study Material', 'llb-platform' ),
            'add_new_item'       => __( 'Add New Study Material', 'llb-platform' ),
            'edit_item'          => __( 'Edit Study Material', 'llb-platform' ),
            'view_item'          => __( 'View Study Material', 'llb-platform' ),
            'search_items'       => __( 'Search Materials', 'llb-platform' ),
        ),
        'public'             => true,
        'show_ui'            => true,
        'show_in_menu'       => true,
        'supports'           => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
        'has_archive'        => true,
        'rewrite'            => array( 'slug' => 'study-materials' ),
        'menu_icon'          => 'dashicons-format-aside'
    ) );

    // Revision Notes Post Type
    register_post_type( 'llb_revision_note', array(
        'labels' => array(
            'name'               => __( 'Revision Notes', 'llb-platform' ),
            'singular_name'      => __( 'Revision Note', 'llb-platform' ),
            'add_new'            => __( 'Add Revision Note', 'llb-platform' ),
            'add_new_item'       => __( 'Add New Revision Note', 'llb-platform' ),
            'edit_item'          => __( 'Edit Revision Note', 'llb-platform' ),
            'view_item'          => __( 'View Revision Note', 'llb-platform' ),
            'search_items'       => __( 'Search Notes', 'llb-platform' ),
        ),
        'public'             => true,
        'show_ui'            => true,
        'show_in_menu'       => true,
        'supports'           => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
        'has_archive'        => true,
        'rewrite'            => array( 'slug' => 'revision-notes' ),
        'menu_icon'          => 'dashicons-book-alt'
    ) );
}
add_action( 'init', 'llb_register_custom_post_types' );

/**
 * Register Custom Taxonomies
 */
function llb_register_custom_taxonomies() {
    
    // Subject Taxonomy
    register_taxonomy( 'llb_subject', array( 'llb_question_paper', 'llb_case_law', 'llb_study_material' ), array(
        'labels' => array(
            'name'              => __( 'Subjects', 'llb-platform' ),
            'singular_name'     => __( 'Subject', 'llb-platform' ),
            'add_new_item'      => __( 'Add New Subject', 'llb-platform' ),
            'new_item_name'     => __( 'New Subject Name', 'llb-platform' ),
            'edit_item'         => __( 'Edit Subject', 'llb-platform' ),
            'view_item'         => __( 'View Subject', 'llb-platform' ),
            'search_items'      => __( 'Search Subjects', 'llb-platform' ),
        ),
        'public'            => true,
        'show_ui'           => true,
        'show_in_menu'      => true,
        'hierarchical'      => true,
        'rewrite'           => array( 'slug' => 'subject' ),
    ) );

    // Semester Taxonomy
    register_taxonomy( 'llb_semester', array( 'llb_question_paper', 'llb_study_material' ), array(
        'labels' => array(
            'name'              => __( 'Semesters', 'llb-platform' ),
            'singular_name'     => __( 'Semester', 'llb-platform' ),
            'add_new_item'      => __( 'Add New Semester', 'llb-platform' ),
            'new_item_name'     => __( 'New Semester Name', 'llb-platform' ),
        ),
        'public'            => true,
        'show_ui'           => true,
        'show_in_menu'      => true,
        'hierarchical'      => true,
        'rewrite'           => array( 'slug' => 'semester' ),
    ) );

    // Year Taxonomy
    register_taxonomy( 'llb_year', array( 'llb_question_paper', 'llb_case_law' ), array(
        'labels' => array(
            'name'              => __( 'Years', 'llb-platform' ),
            'singular_name'     => __( 'Year', 'llb-platform' ),
            'add_new_item'      => __( 'Add Year', 'llb-platform' ),
            'new_item_name'     => __( 'New Year', 'llb-platform' ),
        ),
        'public'            => true,
        'show_ui'           => true,
        'show_in_menu'      => true,
        'hierarchical'      => false,
        'rewrite'           => array( 'slug' => 'year' ),
    ) );

    // Content Type Taxonomy (Short Answer, Long Answer, MCQ, etc.)
    register_taxonomy( 'llb_content_type', array( 'llb_study_material' ), array(
        'labels' => array(
            'name'              => __( 'Content Types', 'llb-platform' ),
            'singular_name'     => __( 'Content Type', 'llb-platform' ),
            'add_new_item'      => __( 'Add Content Type', 'llb-platform' ),
            'new_item_name'     => __( 'New Content Type', 'llb-platform' ),
        ),
        'public'            => true,
        'show_ui'           => true,
        'show_in_menu'      => true,
        'hierarchical'      => true,
        'rewrite'           => array( 'slug' => 'content-type' ),
    ) );

    // Court Taxonomy
    register_taxonomy( 'llb_court', array( 'llb_case_law' ), array(
        'labels' => array(
            'name'              => __( 'Courts', 'llb-platform' ),
            'singular_name'     => __( 'Court', 'llb-platform' ),
            'add_new_item'      => __( 'Add Court', 'llb-platform' ),
            'new_item_name'     => __( 'New Court Name', 'llb-platform' ),
        ),
        'public'            => true,
        'show_ui'           => true,
        'show_in_menu'      => true,
        'hierarchical'      => true,
        'rewrite'           => array( 'slug' => 'court' ),
    ) );
}
add_action( 'init', 'llb_register_custom_taxonomies' );

/**
 * Register Custom Meta Boxes for Question Papers
 */
function llb_add_question_paper_metabox() {
    add_meta_box(
        'llb_question_paper_details',
        __( 'Question Paper Details', 'llb-platform' ),
        'llb_question_paper_metabox_callback',
        'llb_question_paper',
        'normal',
        'high'
    );
}
add_action( 'add_meta_boxes', 'llb_add_question_paper_metabox' );

function llb_question_paper_metabox_callback( $post ) {
    $exam_date = get_post_meta( $post->ID, '_llb_exam_date', true );
    $total_marks = get_post_meta( $post->ID, '_llb_total_marks', true );
    $duration = get_post_meta( $post->ID, '_llb_duration', true );
    $university = get_post_meta( $post->ID, '_llb_university', true );
    ?>
    <table class="form-table">
        <tr>
            <th scope="row"><label for="llb_exam_date"><?php _e( 'Exam Date', 'llb-platform' ); ?></label></th>
            <td><input type="date" id="llb_exam_date" name="llb_exam_date" value="<?php echo esc_attr( $exam_date ); ?>" /></td>
        </tr>
        <tr>
            <th scope="row"><label for="llb_total_marks"><?php _e( 'Total Marks', 'llb-platform' ); ?></label></th>
            <td><input type="number" id="llb_total_marks" name="llb_total_marks" value="<?php echo esc_attr( $total_marks ); ?>" /></td>
        </tr>
        <tr>
            <th scope="row"><label for="llb_duration"><?php _e( 'Duration (in minutes)', 'llb-platform' ); ?></label></th>
            <td><input type="number" id="llb_duration" name="llb_duration" value="<?php echo esc_attr( $duration ); ?>" /></td>
        </tr>
        <tr>
            <th scope="row"><label for="llb_university"><?php _e( 'University', 'llb-platform' ); ?></label></th>
            <td><input type="text" id="llb_university" name="llb_university" value="<?php echo esc_attr( $university ); ?>" /></td>
        </tr>
    </table>
    <?php
}

function llb_save_question_paper_metabox( $post_id ) {
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
    if ( ! current_user_can( 'edit_post', $post_id ) ) return;
    
    if ( isset( $_POST['llb_exam_date'] ) ) {
        update_post_meta( $post_id, '_llb_exam_date', sanitize_text_field( $_POST['llb_exam_date'] ) );
    }
    if ( isset( $_POST['llb_total_marks'] ) ) {
        update_post_meta( $post_id, '_llb_total_marks', sanitize_text_field( $_POST['llb_total_marks'] ) );
    }
    if ( isset( $_POST['llb_duration'] ) ) {
        update_post_meta( $post_id, '_llb_duration', sanitize_text_field( $_POST['llb_duration'] ) );
    }
    if ( isset( $_POST['llb_university'] ) ) {
        update_post_meta( $post_id, '_llb_university', sanitize_text_field( $_POST['llb_university'] ) );
    }
}
add_action( 'save_post', 'llb_save_question_paper_metabox' );

/**
 * Register Custom Meta Boxes for Case Laws
 */
function llb_add_case_law_metabox() {
    add_meta_box(
        'llb_case_law_details',
        __( 'Case Details', 'llb-platform' ),
        'llb_case_law_metabox_callback',
        'llb_case_law',
        'normal',
        'high'
    );
}
add_action( 'add_meta_boxes', 'llb_add_case_law_metabox' );

function llb_case_law_metabox_callback( $post ) {
    $case_citation = get_post_meta( $post->ID, '_llb_case_citation', true );
    $judgment_year = get_post_meta( $post->ID, '_llb_judgment_year', true );
    $judges = get_post_meta( $post->ID, '_llb_judges', true );
    $ratio_decidendi = get_post_meta( $post->ID, '_llb_ratio_decidendi', true );
    ?>
    <table class="form-table">
        <tr>
            <th scope="row"><label for="llb_case_citation"><?php _e( 'Case Citation', 'llb-platform' ); ?></label></th>
            <td><input type="text" id="llb_case_citation" name="llb_case_citation" value="<?php echo esc_attr( $case_citation ); ?>" placeholder="e.g., [2020] 1 SCC 100" /></td>
        </tr>
        <tr>
            <th scope="row"><label for="llb_judgment_year"><?php _e( 'Judgment Year', 'llb-platform' ); ?></label></th>
            <td><input type="number" id="llb_judgment_year" name="llb_judgment_year" value="<?php echo esc_attr( $judgment_year ); ?>" /></td>
        </tr>
        <tr>
            <th scope="row"><label for="llb_judges"><?php _e( 'Judges', 'llb-platform' ); ?></label></th>
            <td><textarea id="llb_judges" name="llb_judges" rows="3"><?php echo esc_textarea( $judges ); ?></textarea></td>
        </tr>
        <tr>
            <th scope="row"><label for="llb_ratio_decidendi"><?php _e( 'Ratio Decidendi', 'llb-platform' ); ?></label></th>
            <td><textarea id="llb_ratio_decidendi" name="llb_ratio_decidendi" rows="4"><?php echo esc_textarea( $ratio_decidendi ); ?></textarea></td>
        </tr>
    </table>
    <?php
}

function llb_save_case_law_metabox( $post_id ) {
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
    if ( ! current_user_can( 'edit_post', $post_id ) ) return;
    
    if ( isset( $_POST['llb_case_citation'] ) ) {
        update_post_meta( $post_id, '_llb_case_citation', sanitize_text_field( $_POST['llb_case_citation'] ) );
    }
    if ( isset( $_POST['llb_judgment_year'] ) ) {
        update_post_meta( $post_id, '_llb_judgment_year', sanitize_text_field( $_POST['llb_judgment_year'] ) );
    }
    if ( isset( $_POST['llb_judges'] ) ) {
        update_post_meta( $post_id, '_llb_judges', wp_kses_post( $_POST['llb_judges'] ) );
    }
    if ( isset( $_POST['llb_ratio_decidendi'] ) ) {
        update_post_meta( $post_id, '_llb_ratio_decidendi', wp_kses_post( $_POST['llb_ratio_decidendi'] ) );
    }
}
add_action( 'save_post', 'llb_save_case_law_metabox' );

/**
 * Add Dashboard Widget with LLB Statistics
 */
function llb_add_dashboard_widget() {
    wp_add_dashboard_widget(
        'llb_dashboard_widget',
        __( 'LLB Platform Statistics', 'llb-platform' ),
        'llb_dashboard_widget_callback'
    );
}
add_action( 'wp_dashboard_setup', 'llb_add_dashboard_widget' );

function llb_dashboard_widget_callback() {
    $papers = wp_count_posts( 'llb_question_paper' );
    $cases = wp_count_posts( 'llb_case_law' );
    $statutes = wp_count_posts( 'llb_statute' );
    $materials = wp_count_posts( 'llb_study_material' );
    ?>
    <ul style="list-style-type: none; padding: 0;">
        <li><strong><?php _e( 'Question Papers:', 'llb-platform' ); ?></strong> <?php echo esc_html( $papers->publish ); ?></li>
        <li><strong><?php _e( 'Case Laws:', 'llb-platform' ); ?></strong> <?php echo esc_html( $cases->publish ); ?></li>
        <li><strong><?php _e( 'Acts & Statutes:', 'llb-platform' ); ?></strong> <?php echo esc_html( $statutes->publish ); ?></li>
        <li><strong><?php _e( 'Study Materials:', 'llb-platform' ); ?></strong> <?php echo esc_html( $materials->publish ); ?></li>
    </ul>
    <?php
}

/**
 * Enqueue LLB Custom Styles
 */
function llb_enqueue_custom_styles() {
    wp_enqueue_style( 'llb-custom', get_stylesheet_directory_uri() . '/css/llb-custom.css', array(), '1.0.0' );
}
add_action( 'wp_enqueue_scripts', 'llb_enqueue_custom_styles' );

/**
 * Add LLB Custom Admin Styles
 */
function llb_enqueue_admin_styles() {
    wp_enqueue_style( 'llb-admin-custom', get_stylesheet_directory_uri() . '/css/llb-admin.css', array(), '1.0.0' );
}
add_action( 'admin_enqueue_scripts', 'llb_enqueue_admin_styles' );

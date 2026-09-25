<?php
/**
 * LLB Shortcodes - Frontend display
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class LLB_Shortcodes {
    
    public static function init() {
        add_shortcode( 'llb_questions', array( __CLASS__, 'questions' ) );
        add_shortcode( 'llb_papers', array( __CLASS__, 'papers' ) );
        add_shortcode( 'llb_quizzes', array( __CLASS__, 'quizzes' ) );
        add_shortcode( 'llb_backend_status', array( __CLASS__, 'status' ) );
    }
    
    public static function questions( $atts ) {
        $atts = shortcode_atts( array(
            'limit' => 10,
            'subject' => '',
        ), $atts );
        
        $params = array( 'limit' => $atts['limit'] );
        if ( ! empty( $atts['subject'] ) ) {
            $params['subject'] = $atts['subject'];
        }
        
        $questions = LLB_API_Client::get_questions( $params );
        
        if ( isset( $questions['error'] ) ) {
            return '<p>Error loading questions: ' . esc_html( $questions['error'] ) . '</p>';
        }
        
        $html = '<div class="llb-questions">';
        
        if ( isset( $questions['questions'] ) && ! empty( $questions['questions'] ) ) {
            $html .= '<table class="llb-table"><thead><tr><th>Question</th><th>Type</th><th>Subject</th></tr></thead><tbody>';
            
            foreach ( $questions['questions'] as $q ) {
                $html .= '<tr>';
                $html .= '<td>' . esc_html( $q['text'] ?? $q['title'] ?? 'N/A' ) . '</td>';
                $html .= '<td>' . esc_html( $q['type'] ?? 'N/A' ) . '</td>';
                $html .= '<td>' . esc_html( $q['subject'] ?? 'N/A' ) . '</td>';
                $html .= '</tr>';
            }
            
            $html .= '</tbody></table>';
        } else {
            $html .= '<p>No questions found.</p>';
        }
        
        $html .= '</div>';
        
        return $html;
    }
    
    public static function papers( $atts ) {
        $atts = shortcode_atts( array(
            'limit' => 20,
            'semester' => '',
        ), $atts );
        
        $params = array( 'limit' => $atts['limit'] );
        if ( ! empty( $atts['semester'] ) ) {
            $params['semester'] = $atts['semester'];
        }
        
        $papers = LLB_API_Client::get_papers( $params );
        
        if ( isset( $papers['error'] ) ) {
            return '<p>Error loading papers: ' . esc_html( $papers['error'] ) . '</p>';
        }
        
        $html = '<div class="llb-papers">';
        
        if ( isset( $papers['papers'] ) && ! empty( $papers['papers'] ) ) {
            $html .= '<ul class="llb-papers-list">';
            
            foreach ( $papers['papers'] as $paper ) {
                $html .= '<li>';
                $html .= '<strong>' . esc_html( $paper['title'] ?? 'Paper' ) . '</strong><br/>';
                $html .= 'Semester: ' . esc_html( $paper['semester'] ?? 'N/A' ) . ' | ';
                $html .= 'Questions: ' . esc_html( $paper['questionCount'] ?? 0 );
                $html .= '</li>';
            }
            
            $html .= '</ul>';
        } else {
            $html .= '<p>No papers found.</p>';
        }
        
        $html .= '</div>';
        
        return $html;
    }
    
    public static function quizzes( $atts ) {
        $atts = shortcode_atts( array(
            'limit' => 10,
        ), $atts );
        
        $quizzes = LLB_API_Client::get_quizzes( array( 'limit' => $atts['limit'] ) );
        
        if ( isset( $quizzes['error'] ) ) {
            return '<p>Error loading quizzes: ' . esc_html( $quizzes['error'] ) . '</p>';
        }
        
        $html = '<div class="llb-quizzes">';
        
        if ( isset( $quizzes['quizzes'] ) && ! empty( $quizzes['quizzes'] ) ) {
            $html .= '<div class="llb-quizzes-grid">';
            
            foreach ( $quizzes['quizzes'] as $quiz ) {
                $html .= '<div class="llb-quiz-card">';
                $html .= '<h3>' . esc_html( $quiz['title'] ?? 'Quiz' ) . '</h3>';
                $html .= '<p>' . esc_html( $quiz['description'] ?? '' ) . '</p>';
                $html .= '<p><small>Questions: ' . esc_html( $quiz['questionCount'] ?? 0 ) . ' | ';
                $html .= 'Marks: ' . esc_html( $quiz['totalMarks'] ?? 0 ) . '</small></p>';
                $html .= '<button class="button">Take Quiz</button>';
                $html .= '</div>';
            }
            
            $html .= '</div>';
        } else {
            $html .= '<p>No quizzes available.</p>';
        }
        
        $html .= '</div>';
        
        return $html;
    }
    
    public static function status() {
        $is_online = LLB_API_Client::check_health();
        $status_text = $is_online ? 'Online ✅' : 'Offline ❌';
        $status_class = $is_online ? 'llb-status-online' : 'llb-status-offline';
        
        return '<div class="llb-backend-status ' . $status_class . '">Backend: ' . esc_html( $status_text ) . '</div>';
    }
}

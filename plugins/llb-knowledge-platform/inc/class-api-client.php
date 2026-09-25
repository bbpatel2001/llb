<?php
/**
 * LLB API Client - Connects to Node.js Backend
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class LLB_API_Client {
    
    private static $api_url = 'http://localhost:6000/api';
    private static $timeout = 30;
    
    public static function set_url( $url ) {
        self::$api_url = rtrim( $url, '/' ) . '/api';
    }
    
    public static function get_url() {
        return self::$api_url;
    }
    
    public static function check_health() {
        $response = wp_remote_get( self::$api_url . '/health', array(
            'timeout' => self::$timeout,
        ));
        
        if ( is_wp_error( $response ) ) {
            return false;
        }
        
        $status = wp_remote_retrieve_response_code( $response );
        return $status === 200;
    }
    
    public static function get_questions( $params = array() ) {
        $url = self::$api_url . '/questions';
        
        if ( ! empty( $params ) ) {
            $url .= '?' . http_build_query( $params );
        }
        
        return self::request( 'GET', $url );
    }
    
    public static function get_papers( $params = array() ) {
        $url = self::$api_url . '/papers';
        
        if ( ! empty( $params ) ) {
            $url .= '?' . http_build_query( $params );
        }
        
        return self::request( 'GET', $url );
    }
    
    public static function generate_answer( $question_id, $type = 'short' ) {
        $data = array(
            'questionId' => $question_id,
            'type' => $type,
        );
        
        return self::request( 'POST', self::$api_url . '/answers/generate', $data );
    }
    
    public static function get_quizzes( $params = array() ) {
        $url = self::$api_url . '/quizzes';
        
        if ( ! empty( $params ) ) {
            $url .= '?' . http_build_query( $params );
        }
        
        return self::request( 'GET', $url );
    }
    
    private static function request( $method, $url, $data = array() ) {
        $args = array(
            'timeout' => self::$timeout,
            'headers' => array(
                'Content-Type' => 'application/json',
            ),
        );
        
        if ( $method === 'POST' && ! empty( $data ) ) {
            $args['body'] = wp_json_encode( $data );
        }
        
        $response = wp_remote_request( $url, array_merge( $args, array( 'method' => $method ) ) );
        
        if ( is_wp_error( $response ) ) {
            return array( 'error' => $response->get_error_message() );
        }
        
        $body = wp_remote_retrieve_body( $response );
        return json_decode( $body, true );
    }
}

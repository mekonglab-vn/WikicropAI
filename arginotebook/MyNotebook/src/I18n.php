<?php
namespace MyNotebook;

class I18n {
    private static $messages = null;
    private static $locale = 'en';

    public static function setLocale( $locale ) {
        self::$locale = in_array( $locale, [ 'en', 'vi' ], true ) ? $locale : 'en';
        self::$messages = null;
    }

    public static function getLocale() {
        return self::$locale;
    }

    public static function all() {
        if ( self::$messages !== null ) {
            return self::$messages;
        }

        $path = __DIR__ . '/../resources/i18n/' . self::$locale . '.json';
        $raw = file_get_contents( $path );
        if ( strncmp( $raw, "\xEF\xBB\xBF", 3 ) === 0 ) {
            $raw = substr( $raw, 3 );
        }
        self::$messages = json_decode( $raw, true ) ?: [];
        if ( !self::$messages && self::$locale !== 'en' ) {
            $fallback = file_get_contents( __DIR__ . '/../resources/i18n/en.json' );
            if ( strncmp( $fallback, "\xEF\xBB\xBF", 3 ) === 0 ) {
                $fallback = substr( $fallback, 3 );
            }
            self::$messages = json_decode( $fallback, true ) ?: [];
        }
        return self::$messages;
    }

    public static function msg( $key, $params = [] ) {
        $messages = self::all();
        $message = $messages[ $key ] ?? $key;

        foreach ( $params as $name => $value ) {
            $message = str_replace( '{{' . $name . '}}', (string)$value, $message );
        }

        return $message;
    }
}

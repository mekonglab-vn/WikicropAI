<?php
namespace MyNotebook\Pages;

use MyNotebook\I18n;

class DashboardPage {
    public function render( $output ) {
        // Create a safe MediaWiki URL
        $specialPageUrl = \SpecialPage::getTitleFor( 'MyNotebook' )->getFullURL();
        $llmManagerUrl = \SpecialPage::getTitleFor( 'MyNotebook' )->getFullURL( [ 'action' => 'llm_manager' ] );
        $templateManagerUrl = \SpecialPage::getTitleFor( 'MyNotebook' )->getFullURL( [ 'action' => 'template_manager' ] );
        $sourceManagerUrl = \SpecialPage::getTitleFor( 'MyNotebook' )->getFullURL( [ 'action' => 'source_manager' ] );
        $lang = I18n::getLocale();
        
        // Pass the Special page Base URL down to JS
        $output->addJsConfigVars( 'MyNotebookBaseUrl', $specialPageUrl );

        $html = "
           <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'>
            
            <style>
            
                a.ws-btn-outline, 
                a.ws-btn-outline:visited {
                    padding: 10px 20px; 
                    background: #ffffff; 
                    color: #187A35 !important; 
                    border: 2px solid #187A35; 
                    text-decoration: none !important; 
                    border-radius: 25px; 
                    font-weight: bold; 
                    font-size: 14px; 
                    display: inline-flex; 
                    align-items: center; 
                    gap: 8px;
                    transition: all 0.2s ease-in-out;
                }
                
                a.ws-btn-outline i {
                    color: #187A35 !important;
                    transition: color 0.2s ease-in-out;
                }
                
                a.ws-btn-outline:hover, 
                a.ws-btn-outline:active,
                a.ws-btn-outline:focus {
                    background: #187A35 !important;
                    color: #ffffff !important;
                    text-decoration: none !important;
                }
                
                a.ws-btn-outline:hover i {
                    color: #ffffff !important;
                }
                
                /* 3 & 4. Handle MediaWiki H2 default font and horizontal rule */
                h2.ws-dashboard-title {
                    font-family: sans-serif !important; /* Force sans-serif font */
                    border-bottom: none !important; /* Remove the annoying horizontal rule */
                    margin: 0 0 20px 0 !important; 
                    color: #1e293b !important; 
                    text-align: left; 
                    font-size: 1.6em;
                }
            </style>

            <div style='font-family: sans-serif; padding: 10px 0;'>
                
                <div style='display: flex; gap: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; flex-wrap: wrap;'>
                    
                    <a href='{$templateManagerUrl}' class='ws-btn-outline'>
                        <i class='fas fa-file-code'></i> " . I18n::msg( 'dashboard.outline_settings' ) . "
                    </a>
                    <a href='{$sourceManagerUrl}' class='ws-btn-outline'>
                        <i class='fas fa-database'></i> " . I18n::msg( 'dashboard.source_settings' ) . "
                    </a>
                    <button type='button' id='ws_lang_toggle' class='ws-btn-outline' style='border-radius: 25px; background: #ffffff;'>
                        <i class='fas fa-language'></i> " . strtoupper( $lang ) . "
                    </button>
                </div>

                <h2 class='ws-dashboard-title'>" . I18n::msg( 'dashboard.notebook_list' ) . "</h2>

                <div id='notebook-grid' style='display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 20px; margin-right: 40px;'>
                    <p style='color: #666;'>" . I18n::msg( 'common.loading_data' ) . "</p>
                </div>

            </div>
        ";

        $output->addHTML( $html );
    }
}

<?php
namespace MyNotebook;

use SpecialPage;
use MyNotebook\I18n;

class SpecialMyNotebook extends SpecialPage {
    public function __construct() {
        parent::__construct( 'MyNotebook' );
    }

    public function execute( $par ) {
        $this->setHeaders();
        $request = $this->getRequest();
        $output = $this->getOutput();

        $locale = $request->getVal( 'lang', $_COOKIE['mn_lang'] ?? 'en' );
        I18n::setLocale( $locale );

        // Pass the API URL into JavaScript so scripts can use it
        global $wgMyNotebookApiUrl;
        $output->addJsConfigVars( 'MyNotebookApiUrl', $wgMyNotebookApiUrl );
        $output->addJsConfigVars( 'MyNotebookLang', I18n::getLocale() );
        $output->addJsConfigVars( 'MyNotebookMessages', I18n::all() );
        $output->addModules( 'ext.myNotebook.scripts' );

        // Common title for the entire Extension
        $output->setPageTitle( I18n::msg( 'dashboard.notebook_list' ) );

        // ---------------------------------------------------------
        // OVERRIDE MEDIAWIKI CSS TO EXPAND THE INTERFACE TO FULL SCREEN
        // ---------------------------------------------------------
        $output->addInlineStyle('
            /* Break the outermost wrapper you just found */
            main#content.mw-body {
                display: block !important; /* Key to breaking the grid */
                max-width: 100% !important;
                padding: 20px 25px !important; /* Create a nice outer margin */
            }

            .firstHeading.mw-first-heading {
                font-size: 28px;
            }

            /* 2. Force all outer wrappers to expand to 100% width */
            .mw-page-container,
            .mw-page-container-inner,
            .mw-content-container {
                max-width: 100% !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
            }

            /* 3. Hide the column containing miscellaneous tools on the right (if any) */
            .vector-column-end {
                display: none !important;
            }
        ');;

        // Read the 'action' parameter from the URL (Default is 'dashboard')
        $action = $request->getVal( 'action', 'dashboard' );

        // Use the action to call the corresponding class in the Pages directory
        // Moved 'default' to the end to make the code safer and more accurate
        switch ( $action ) {
            case 'workspace':
                $notebookId = $request->getInt( 'id', 0 );
                $page = new \MyNotebook\Pages\WorkspacePage();
                $page->render( $output, $notebookId );
                break;
                
            case 'llm_manager':
                $page = new \MyNotebook\Pages\LLMManagerPage();
                $page->render( $output );
                break;
            
            case 'template_manager':
                $page = new \MyNotebook\Pages\TemplateManagerPage();
                $page->render( $output );
                break;

            case 'source_manager':
                $page = new \MyNotebook\Pages\SourcePage();
                $page->render( $output );
                break;
                
            case 'dashboard':
            default:
                $page = new \MyNotebook\Pages\DashboardPage();
                $page->render( $output );
                break;
        }
    }
}

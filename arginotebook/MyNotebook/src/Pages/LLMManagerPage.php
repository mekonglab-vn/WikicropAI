<?php
namespace MyNotebook\Pages;

use MyNotebook\I18n;

class LLMManagerPage {
    public function render( $output ) {
        // Giao diện thuần HTML, không chứa logic JS
        $html = "
            <div style='display: flex; gap: 20px; font-family: sans-serif; margin-top: 15px;'>
                
                <div style='flex: 1; border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #fff;'>
                    <button id='btn_go_back' style='padding: 6px 12px; background: #e2e8f0; color: #334155; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 5px; margin-bottom: 15px;'>
                        &larr; " . I18n::msg( 'common.back' ) . "
                    </button>

                    <h3 style='margin-top: 0;'>" . I18n::msg( 'llm.list_title' ) . "</h3>

                    <div id='llm-list-container'>
                        <p style='color: #666;'>" . I18n::msg( 'llm.loading' ) . "</p>
                    </div>
                </div>

                <div style='flex: 1; border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #f8fafc;'>
                    <h3 style='margin-top: 0;' id='form-title'>" . I18n::msg( 'llm.create_title' ) . "</h3>
                    <form id='llmForm'>
                        <input type='hidden' id='form_id' value=''>
                        
                        <div style='margin-bottom: 10px;'>
                            <label style='font-weight: bold;'>" . I18n::msg( 'llm.provider_label' ) . ":</label><br>
                            <input type='text' id='form_provider' placeholder='" . I18n::msg( 'llm.provider_placeholder' ) . "' style='width: 100%; padding: 8px; box-sizing: border-box;'>
                        </div>
                        
                        <div style='margin-bottom: 10px;'>
                            <label style='font-weight: bold;'>" . I18n::msg( 'llm.base_url_label' ) . ":</label><br>
                            <input type='text' id='form_base_url' placeholder='" . I18n::msg( 'llm.base_url_placeholder' ) . "' style='width: 100%; padding: 8px; box-sizing: border-box;'>
                        </div>
                        
                        <div style='margin-bottom: 10px;'>
                            <label style='font-weight: bold;'>" . I18n::msg( 'llm.api_key_label' ) . ":</label><br>
                            <input type='password' id='form_api_key' placeholder='" . I18n::msg( 'llm.api_key_placeholder' ) . "' style='width: 100%; padding: 8px; box-sizing: border-box;'>
                        </div>
                        
                        <div style='margin-bottom: 15px;'>
                            <label style='font-weight: bold;'>" . I18n::msg( 'llm.model_name_label' ) . ":</label><br>
                            <input type='text' id='form_model_name' placeholder='" . I18n::msg( 'llm.model_name_placeholder' ) . "' style='width: 100%; padding: 8px; box-sizing: border-box;'>
                        </div>
                        
                        <div style='display: flex; gap: 10px;'>
                            <button type='button' id='btn_save' style='padding: 8px 15px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; flex: 1;'>
                                " . I18n::msg( 'llm.add_button' ) . "
                            </button>
                            <button type='button' id='btn_delete' disabled style='padding: 8px 15px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: not-allowed; opacity: 0.5;'>
                                " . I18n::msg( 'common.delete' ) . "
                            </button>
                            <button type='button' id='btn_cancel' disabled style='padding: 8px 15px; background: #64748b; color: white; border: none; border-radius: 4px; cursor: not-allowed; opacity: 0.5;'>
                                " . I18n::msg( 'common.cancel' ) . "
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        ";

        $output->addHTML( $html );
    }
}

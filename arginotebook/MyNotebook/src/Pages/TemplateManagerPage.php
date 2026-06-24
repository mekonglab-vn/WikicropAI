<?php
namespace MyNotebook\Pages;

use MyNotebook\I18n;

class TemplateManagerPage {
    public function render( $output ) {
        $html = "
            <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'>
            <div style='display: flex; gap: 20px; font-family: sans-serif; margin-top: 15px;'>
                
                <div style='flex: 1; border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #fff;'>
                    <button id='btn_go_back' style='padding: 6px 12px; background: #e2e8f0; color: #334155; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 5px; margin-bottom: 15px;'>
                    <i class='fas fa-angle-left'></i> " . I18n::msg( 'common.back' ) . "
                </button>
                <h3 style='margin-top: 0;'>" . I18n::msg( 'template.page_title' ) . "</h3>
                    <div id='search-container' style='margin-bottom: 15px; display:flex; flex-direction: row; gap: 10px; align-items: center;'>
                        <input type='text' id='search_input' placeholder='" . I18n::msg( 'template.search_placeholder' ) . "' 
                            style='width: 100%; padding: 10px; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 15px;'
                            oninput='filterTemplates()'>
                            
                        <button style='display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 0; color: #475569; cursor: pointer; font-size: 14px; font-weight: 600; white-space: nowrap;'>
                            <i class='fas fa-search'></i> " . I18n::msg( 'template.search_button' ) . "
                        </button>
                    </div>
                    <div id='template-list-container'>
                        
                        <p style='color: #666;'>" . I18n::msg( 'template.loading' ) . "</p>
                    </div>
                </div>

                <div style='flex: 1.5; border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #f8fafc; margin-right: 300px'>
                    <h2 style='margin: 0 0 15px 0; text-align: center;' id='form-title'>" . I18n::msg( 'template.create_title' ) . "</h2>
                    <form id='templateForm'>
                        <input type='hidden' id='form_template_id' value=''>
                        
                        <div style='margin-bottom: 20px;'>
                            <label style='font-weight: bold; font-size: 15px; display: block; margin-bottom: 5px;'>" . I18n::msg( 'template.name_label' ) . ":</label>
                            <input type='text' id='form_template_name' placeholder='" . I18n::msg( 'template.name_example' ) . "' style='width: 100%; padding: 10px; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 15px;'>
                        </div>

                        <div style='margin-bottom: 20px;'>
                            <label style='font-weight: bold; font-size: 15px; display: block; margin-bottom: 5px;'>" . I18n::msg( 'template.description_label' ) . ":</label>
                            <input type='text' id='form_template_description' placeholder='" . I18n::msg( 'template.description_example' ) . "' style='width: 100%; padding: 10px; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 15px;'>
                        </div>
                        
                        <div style='border-top: 2px solid #e2e8f0; padding-top: 15px; margin-bottom: 15px;'>
                            <div style='display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;'>
                                <label style='font-weight: bold; font-size: 15px;'>" . I18n::msg( 'template.article_structure' ) . ":</label>
                                <button type='button' id='btn_add_section' style='padding: 5px 10px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;'>
                                    + " . I18n::msg( 'common.add' ) . "
                                </button>
                            </div>
                            
                            <div id='prompt_structure_container' style='display: flex; flex-direction: column; gap: 15px;'>
                                </div>
                        </div>
                        
                        <div style='display: flex; gap: 10px; margin-top: 25px;'>
                            <button type='button' id='btn_save_template' style='padding: 10px 15px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;'>
                                " . I18n::msg( 'template.add_button' ) . "
                            </button>
                            <button type='button' id='btn_delete_template' disabled style='padding: 10px 15px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: not-allowed; opacity: 0.5;'>
                                " . I18n::msg( 'common.delete' ) . "
                            </button>
                            <button type='button' id='btn_cancel_template' disabled style='padding: 10px 15px; background: #64748b; color: white; border: none; border-radius: 4px; cursor: not-allowed; opacity: 0.5;'>
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

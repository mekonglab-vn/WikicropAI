<?php
namespace MyNotebook\Pages;

use MyNotebook\I18n;

class SourcePage {
    public function render( $output ) {
        $html = "
            <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'>
            <div id='sm_app' class='ws-container' style='margin-right: 300px;'>
                
                <div class='ws-column ws-col-left'>
                    <button id='btn_go_back' style='display: inline-flex; align-items: center; gap: 8px; padding: 8px 20px; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 30px; color: #475569; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s; max-width: 120px; margin-bottom: 20px;'>
                        <i class='fas fa-angle-left'></i> " . I18n::msg( 'common.back' ) . "
                    </button>
                    
                    <h3 class='ws-title ws-title-sm'>" . I18n::msg( 'source.select_notebook' ) . "</h3>
                    <select id='sm_notebook_select' style='width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 20px; outline: none; background: #ffffff;'>
                        <option value=''>-- " . I18n::msg( 'common.loading_data' ) . " --</option>
                    </select>

                    <h3 class='ws-title ws-title-sm'>" . I18n::msg( 'source.select_source' ) . "</h3>
                    <select id='sm_source_select' style='width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 20px; outline: none; background: #ffffff;' disabled>
                        <option value=''>-- " . I18n::msg( 'source.choose_data_source' ) . " --</option>
                    </select>

                    <h3 class='ws-title ws-title-sm'>" . I18n::msg( 'source.details_title' ) . "</h3>
                    <div id='sm_source_details' style='border: 1px dashed #cbd5e1; border-radius: 6px; padding: 15px; margin-bottom: 20px; background: #ffffff; color: #334155; font-size: 14px; line-height: 1.6; height: 120px; overflow-y: auto;'>
                        <span style='color: #94a3b8; font-style: italic;'>" . I18n::msg( 'source.no_info' ) . "</span>
                    </div>
                    
                    <button id='sm_btn_delete_source' class='ws-btn' style='width: 100%; padding: 12px; background: #ef4444; color: white; display: none;'>
                        <i class='fas fa-trash-alt'></i> " . I18n::msg( 'source.delete' ) . "
                    </button>
                </div>

                <div class='ws-column ws-col-main' style='display: flex; flex-direction: column; gap: 10px;'>
                    <h3 class='ws-title ws-title-lg' style='margin-bottom: 5px;'>" . I18n::msg( 'source.chunk_list' ) . "</h3>
                    
                    <div style='max-height: 250px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 20px; background: #fafafa;'>
                        <table style='width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; table-layout: fixed;'>
                            <thead style='background: #f8fafc; position: sticky; top: 0; z-index: 10; box-shadow: 0 1px 2px rgba(0,0,0,0.05);'>
                                <tr>
                                    <th style='padding: 10px; border-bottom: 1px solid #cbd5e1; width: 50px;'>" . I18n::msg( 'common.id' ) . "</th>
                                    <th style='padding: 10px; border-bottom: 1px solid #cbd5e1; width: 120px;'>" . I18n::msg( 'source.index' ) . "</th>
                                    <th style='padding: 10px; border-bottom: 1px solid #cbd5e1;'>" . I18n::msg( 'source.extracted_content' ) . "</th>
                                    <th style='padding: 10px; border-bottom: 1px solid #cbd5e1; width: 80px; text-align: center;'>" . I18n::msg( 'source.action' ) . "</th>
                                </tr>
                            </thead>
                            <tbody id='sm_chunk_table_body' style='background: #ffffff;'>
                                <tr>
                                    <td colspan='4' style='padding: 20px; text-align: center; color: #64748b; font-style: italic;'>
                                        " . I18n::msg( 'source.choose_data_source' ) . "
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
    
                    <h3 class='ws-title ws-title-sm' style='margin-bottom: 5px;'>" . I18n::msg( 'source.chunk_details' ) . "</h3>
                    <div id='sm_chunk_details' style='height: 150px; overflow-y: auto; border: 1px solid #cbd5e1; border-radius: 6px; padding: 15px; background: #ffffff; color: #334155; line-height: 1.6;'>
                        <span style='color: #94a3b8; font-style: italic;'>" . I18n::msg( 'source.click_segment' ) . "</span>
                    </div>
                </div>

            </div>
        ";

        $output->addHTML( $html );
    }
}

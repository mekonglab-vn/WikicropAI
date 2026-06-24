// ==========================================
// 1. SAFE INITIALIZATION
// ==========================================
function initSourceManager() {
    const app = document.getElementById('sm_app');
    if (!app) return;

    document.getElementById('sm_notebook_select').addEventListener('change', smLoadSources);
    document.getElementById('sm_source_select').addEventListener('change', smLoadChunks);
    document.getElementById('sm_btn_delete_source').addEventListener('click', smDeleteSource);
    
    
    document.getElementById('btn_go_back').addEventListener('click', function() {
        window.location.href = mw.util ? mw.util.getUrl('Special:MyNotebook') : '/index.php/Special:MyNotebook';
    });
    
    smLoadNotebooks();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSourceManager);
} else {
    initSourceManager();
}

// ==========================================
// 2. LOAD NOTEBOOK LIST
// ==========================================
async function smLoadNotebooks() {
    const select = document.getElementById('sm_notebook_select');
    
    try {
        const userId = apiClient.getUserId();
        const notebooks = await apiClient.apiGet(`/notebooks/user/${userId}`);
        
        select.innerHTML = `<option value=''>-- ${mnI18n.t('source.select_notebook')} --</option>`;
        
        if (notebooks && notebooks.length > 0) {
            console.log("Notebooks loaded:", notebooks);
            notebooks.forEach(nb => {
                const option = document.createElement('option');
                option.value = nb.id;
                option.textContent = nb.name;
                select.appendChild(option);
            });
        } else {
            select.innerHTML = `<option value=''>-- ${mnI18n.t('source.no_notebooks')} --</option>`;
        }
    } catch (error) {
        console.error("Error loading notebooks:", error);
        select.innerHTML = `<option value=''>-- ${mnI18n.t('source.error_loading_data')} --</option>`;
    }
}

// ==========================================
// 3. LOAD DATA SOURCES
// ==========================================
async function smLoadSources() {
    const nbId = document.getElementById('sm_notebook_select').value;
    const select = document.getElementById('sm_source_select');
    const details = document.getElementById('sm_source_details');
    const btnDelete = document.getElementById('sm_btn_delete_source');
    const tbody = document.getElementById('sm_chunk_table_body');

    // Reset UI
    select.innerHTML = `<option value=''>-- ${mnI18n.t('source.select_source')} --</option>`;
    select.disabled = true;
    details.innerHTML = `<span style='color: #94a3b8; font-style: italic;'>${mnI18n.t('source.no_info')}</span>`;
    btnDelete.style.display = "none";
    tbody.innerHTML = `<tr><td colspan='4' style='padding: 20px; text-align: center; color: #64748b; font-style: italic;'>${mnI18n.t('source.choose_data_source')}</td></tr>`;

    if (!nbId) return;

    try {
        const sources = await apiClient.apiGet(`/notebooks/${nbId}/sources`);
        if (sources && sources.length > 0) {
            select.disabled = false;
            sources.forEach(src => {
                const option = document.createElement('option');
                option.value = src.id;
                option.textContent = src.title;
                option.dataset.info = JSON.stringify(src);
                select.appendChild(option);
            });
        } else {
            select.innerHTML = `<option value=''>-- ${mnI18n.t('source.no_sources')} --</option>`;
        }
    } catch (error) {
        console.error("Error loading sources:", error);
    }
}

// ==========================================
// 4. LOAD SEGMENTS (CHUNKS)
// ==========================================
async function smLoadChunks() {
    const select = document.getElementById('sm_source_select');
    const sourceId = select.value;
    const details = document.getElementById('sm_source_details');
    const btnDelete = document.getElementById('sm_btn_delete_source');
    const tbody = document.getElementById('sm_chunk_table_body');
    const chunkDetails = document.getElementById('sm_chunk_details');

    tbody.innerHTML = `<tr><td colspan='4' style='padding: 20px; text-align: center; color: #d97706; font-style: italic;'>${mnI18n.t('source.loading_chunk_data')}</td></tr>`;
    chunkDetails.innerHTML = `<span style='color: #94a3b8; font-style: italic;'>${mnI18n.t('source.click_segment')}</span>`;

    if (!sourceId) {
        details.innerHTML = `<span style='color: #94a3b8; font-style: italic;'>${mnI18n.t('source.no_info')}</span>`;
        btnDelete.style.display = "none";
        return;
    }

    const selectedOption = select.options[select.selectedIndex];
    const srcData = JSON.parse(selectedOption.dataset.info);
    
    details.innerHTML = `
        <strong style="color: #0f172a;">${mnI18n.t('source.name')}:</strong> ${srcData.title}<br>
        <strong style="color: #0f172a;">${mnI18n.t('source.type')}:</strong> ${srcData.type}<br>
        <strong style="color: #0f172a;">${mnI18n.t('source.path')}:</strong> <span style="word-break: break-all; color: #3b82f6;">${srcData.url_or_path}</span><br>
        <strong style="color: #0f172a;">${mnI18n.t('source.status')}:</strong> <span style="color: ${srcData.status === 'completed' ? '#10b981' : '#ef4444'}; font-weight: bold;">${srcData.status}</span>
    `;
    btnDelete.style.display = "block";

    try {
        const chunks = await apiClient.apiGet(`/sources/${sourceId}/chunks`);
        tbody.innerHTML = "";
        
        if (chunks && chunks.length > 0) {
            chunks.forEach(chunk => {
                const tr = document.createElement('tr');
                tr.style.cssText = "border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background 0.2s;";
                tr.onmouseover = () => tr.style.background = "#f8fafc";
                tr.onmouseout = () => tr.style.background = "#ffffff";
                
                let displayContent = chunk.content;
                if (displayContent.length > 70) {
                    displayContent = `<span class="sm-short">${displayContent.substring(0, 70)}...</span>
                                      <span class="sm-full" style="display:none;">${displayContent}</span>
                                      <a href="javascript:void(0)" class="sm-toggle-btn" style="color: #3b82f6; text-decoration: none; font-size: 13px; font-weight: bold; margin-left: 5px;">${mnI18n.t('source.read_more')}</a>`;
                }

                tr.innerHTML = `
                    <td style='padding: 12px; color: #64748b;'>${chunk.id}</td>
                    <td style='padding: 12px; color: #64748b; font-size: 12px;'>
                        <span style='background: #e2e8f0; padding: 2px 6px; border-radius: 4px;'>${chunk.chunk_index ? chunk.chunk_index.substring(0, 8) + '...' : mnI18n.t('common.na')}</span>
                    </td>
                    <td style='padding: 12px;'>${displayContent}</td>
                    <td style='padding: 12px; text-align: center;'>
                        <button class="sm-btn-del-chunk" data-id="${chunk.id}" style="background: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; padding: 6px 10px; cursor: pointer; border-radius: 4px; font-weight: bold; transition: all 0.2s;">${mnI18n.t('source.delete')}</button>
                    </td>
                `;

                tr.addEventListener('click', function(e) {
                    if(e.target.classList.contains('sm-btn-del-chunk')) {
                        smDeleteChunk(e.target.dataset.id);
                        return;
                    }
                    if(e.target.classList.contains('sm-toggle-btn')) {
                        const shortSpan = tr.querySelector('.sm-short');
                        const fullSpan = tr.querySelector('.sm-full');
                        if (shortSpan.style.display === 'none') {
                            shortSpan.style.display = 'inline';
                            fullSpan.style.display = 'none';
                            e.target.innerText = mnI18n.t('source.read_more');
                        } else {
                            shortSpan.style.display = 'none';
                            fullSpan.style.display = 'inline';
                            e.target.innerText = mnI18n.t('source.collapse');
                        }
                        return;
                    }

                    // --- ADDITIONAL SECTION: RENDER CHUNK DETAILS WITH METADATA ---
                    const meta = chunk.meta_data || {};
                    const sourceType = meta.source_type || 'unknown';
                    let locationStr = '';

                    switch (sourceType) {
                        case 'docx':
                            locationStr = mnI18n.t('source.segment_number', { index: `<strong>${meta.block_index ?? mnI18n.t('common.na')}</strong>` });
                            break;
                        case 'pdf':
                            locationStr = mnI18n.t('source.page_number', { index: `<strong>${meta.page_number ?? mnI18n.t('common.na')}</strong>` });
                            break;
                        case 'audio':
                        case 'youtube':
                            const start = formatTime(meta.start_seconds);
                            const end = formatTime(meta.end_seconds);
                            locationStr = mnI18n.t('source.time_range', { start: `<strong>${start}</strong>`, end: `<strong>${end}</strong>` });
                            break;
                        case 'web':
                            locationStr = mnI18n.t('source.web_source');
                            break;
                    }

                    chunkDetails.innerHTML = `
                        <div style="margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px dashed #cbd5e1; font-size: 13px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span><strong style="color: #1e293b;">${mnI18n.t('common.id')}:</strong> #${chunk.id}</span>
                                <span style="font-family: monospace; background: #f1f5f9; padding: 2px 5px; border-radius: 3px;">${chunk.chunk_index}</span>
                            </div>
                            <div><strong style="color: #1e293b;">${mnI18n.t('source.location')}:</strong> ${locationStr} [${sourceType.toUpperCase()}]</div>
                        </div>
                        <div style="white-space: pre-wrap;">${chunk.content}</div>
                    `;
                });

                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan='4' style='padding: 20px; text-align: center; color: #64748b; font-style: italic;'>${mnI18n.t('source.no_extracted_data')}</td></tr>`;
        }
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan='4' style='padding: 20px; text-align: center; color: #ef4444;'>${mnI18n.t('source.error_loading_segments')}</td></tr>`;
    }
}

// ==========================================
// 5. DELETE FUNCTIONS
// ==========================================
async function smDeleteSource() {
    const sourceId = document.getElementById('sm_source_select').value;
    if (!sourceId) return;

    if (confirm(mnI18n.t('source.delete_all_chunks_confirm'))) {
        const result = await apiClient.apiDelete(`/sources/${sourceId}`);
        if (result) smLoadSources();
    }
}

async function smDeleteChunk(chunkId) {
    if (confirm(mnI18n.t('source.delete_segment_confirm'))) {
        const result = await apiClient.apiDelete(`/chunks/${chunkId}`);
        if (result) smLoadChunks();
    }
}

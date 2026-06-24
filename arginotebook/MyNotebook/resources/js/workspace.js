function initWorkspace() {
    const idInput = document.getElementById('ws_notebook_id');
    if (!idInput) return;
    window.nbId = idInput.value;


    document.getElementById('ws_btn_open_template_modal').addEventListener('click', openTemplateModal);
    document.getElementById('ws_btn_close_modal').addEventListener('click', closeTemplateModal);
    document.getElementById('ws_btn_add_section').addEventListener('click', () => wsAddTemplateSection());
    document.getElementById('ws_btn_save_select_tpl').addEventListener('click', handleCreateAndSelectTemplate);


    //document.getElementById('ws_btn_file').addEventListener('click', handleUploadFile);
    //document.getElementById('ws_btn_url').addEventListener('click', handleAddUrl);
    //document.getElementById('ws_file_upload').addEventListener('change', handleUploadFile);
    // Sự kiện cho Modal Nguồn
    document.getElementById('ws_btn_open_source_modal').addEventListener('click', () => {
        document.getElementById('ws_source_modal').style.display = 'flex';
        document.getElementById('ws_modal_source_status').innerText = '';
    });
    document.getElementById('ws_btn_close_source_modal').addEventListener('click', () => {
        document.getElementById('ws_source_modal').style.display = 'none';
        
    });
    document.getElementById('ws_btn_close_source_detail_modal').addEventListener('click', ()=> {
        document.getElementById('ws_source_detail_modal').style.display = 'none';
        document.getElementById('ws_source_chunks_container').innerHTML = ''; 
    })
    
    // Gắn sự kiện cho các nút TRONG modal
    document.getElementById('ws_file_upload_modal').addEventListener('change', handleUploadFile);
    document.getElementById('ws_btn_url_modal').addEventListener('click', handleAddUrl);


    document.getElementById('ws_btn_generate').addEventListener('click', handleGenerate);
    document.getElementById('ws_btn_edit').addEventListener('click', toggleEditMode);
    document.getElementById('ws_btn_save').addEventListener('click', handleSaveArticle);
    document.getElementById('ws_btn_delete').addEventListener('click', handleDeleteNotebook);
    document.getElementById('ws_btn_mindmap').addEventListener('click', handleGenerateMindmap);

    document.getElementById('btn_go_back').addEventListener('click', function() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = mw.util.getUrl('Special:MyNotebook');
    }
    });

    document.getElementById("ws_btn_upload").addEventListener("click", function() {
        uploadToWiki();
    });

    // Modal close buttons
    const youtubeCloseBtn = document.getElementById('ws_youtube_modal_close');
    if (youtubeCloseBtn) {
        youtubeCloseBtn.addEventListener('click', closeYoutubeModal);
    }

    const mindmapCloseBtn = document.getElementById('ws_mindmap_modal_close');
    if (mindmapCloseBtn) {
        mindmapCloseBtn.addEventListener('click', closeMindmapModal);
    }

    loadNotebookDetails();
    loadArticle();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWorkspace);
} else {
    initWorkspace();
}

// Hàm show/hide modal loading
function showLoadingModal() {
    const modal = document.getElementById('ws_loading_modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function hideLoadingModal() {
    const modal = document.getElementById('ws_loading_modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function loadNotebookDetails() {
    const data = await apiClient.apiGet(`/notebooks/${window.nbId}`);
    if (!data) return;

    document.getElementById('ws_notebook_title').innerText = data.name;
    const list = document.getElementById('ws_source_list');
    list.innerHTML = "";

    if (data.sources && data.sources.length > 0) {
        data.sources.forEach(src => {
            // Tạo thẻ bọc ngoài (Card)
            const card = document.createElement('div');
            card.style.backgroundColor = "#ffffff";
            card.style.border = "1px solid #d1d5db"; // Border xám
            card.style.borderRadius = "8px"; // Bo góc nhẹ
            card.style.padding = "12px";
            card.style.marginBottom = "12px";

            card.addEventListener('click', () => {
        
             openSourceDetailModal(src.id, ""); 
            });


            // Phần trên: Tên nguồn
            const titleDiv = document.createElement('div');
            titleDiv.style.fontWeight = "600";
            titleDiv.style.marginBottom = "10px";
            titleDiv.style.color = "#1f2937"; // Chữ màu tối cho dễ đọc
            titleDiv.style.wordBreak = "break-word";
            titleDiv.innerText = src.title;

            // Phần dưới: Container chứa các badge
            const badgeContainer = document.createElement('div');
            badgeContainer.style.display = "flex";
            badgeContainer.style.gap = "8px";

            // Badge Trạng thái
            const statusBadge = document.createElement('span');
            statusBadge.style.backgroundColor = "#187A35"; // Nền xanh
            statusBadge.style.color = "#ffffff"; // Chữ trắng
            statusBadge.style.padding = "2px 10px";
            statusBadge.style.borderRadius = "12px"; // Bo góc cong
            statusBadge.style.fontSize = "12px";
            statusBadge.style.fontWeight = "500";
            statusBadge.innerText = src.status;

            // Badge Type
            const typeBadge = document.createElement('span');
            typeBadge.style.backgroundColor = "#E6E6E6"; // Nền xám
            typeBadge.style.color = "#000000"; // Chữ đen
            typeBadge.style.padding = "2px 10px";
            typeBadge.style.borderRadius = "12px"; // Bo góc cong
            typeBadge.style.fontSize = "12px";
            typeBadge.style.fontWeight = "500";
            typeBadge.innerText = src.type || mnI18n.t('common.na');

            // Lắp ráp các thành phần
            badgeContainer.appendChild(statusBadge);
            badgeContainer.appendChild(typeBadge);
            
            card.appendChild(titleDiv);
            card.appendChild(badgeContainer);
            
            list.appendChild(card);
        });
    } else {
        list.innerHTML = `<p style='color: #64748b; font-style: italic;'>${mnI18n.t('workspace.no_sources')}</p>`;
    }
}


async function loadArticle() {
    const data = await apiClient.apiGet(`/notebooks/${window.nbId}/articles`);
    const view = document.getElementById('ws_article_view');
    const editContainer = document.getElementById('ws_article_edit');

    if (data && data.length > 0) {
        const article = data[data.length - 1];
        window.currentArticle = article;

        // Cập nhật Template Select nếu có
        if (article.template_id) {
            const tplSelect = document.getElementById('template_select');
            if (tplSelect) tplSelect.value = article.template_id;
        }

        let htmlContent = ""; // Cho bên Xem
        let editFormHtml = ""; // Cho bên Sửa

        // 1. Bản đồ tra cứu Bibliography
        const bibMap = {};
        if (article.bibliography) {
            article.bibliography.forEach(bib => {
                if (bib.locator) bibMap[bib.id] = bib.locator;
            });
        }

        // 2. Hàm đệ quy xử lý nội dung
        function processArrayContent(nodes) {
            if (!nodes || nodes.length === 0) return;

            for (const node of nodes) {
                let sectionTitle = node.title || "";
                let sectionContent = node.content || "";
                let sources = node.source || [];

                // --- XỬ LÝ TRÍCH DẪN (Cite) ---
                let citeHtml = "";
                let citeLabel = ""; // Hiển thị text thuần bên Edit
                
                if (sources.length > 0) {
                    const sortedSources = [...sources].sort((a, b) => a - b);
                    sortedSources.forEach(bibId => {
                        const loc = bibMap[bibId];
                        // Cite cho bên View (có data-attr để hover)
                        if (loc && loc.source_id) {
                            citeHtml += ` <sup class="citation-marker" data-source-id="${loc.source_id}" data-chunk-index="${loc.chunk_index || ''}" style="color: #2563eb; cursor: pointer; font-weight: bold; padding: 0 2px;">[${bibId}]</sup>`;
                        } else {
                            citeHtml += ` <sup style="color: #94a3b8; padding: 0 2px;">[${bibId}]</sup>`;
                        }
                        // Cite cho bên Edit (hiển thị để người dùng biết đoạn này có nguồn nào)
                        citeLabel += `[${bibId}] `;
                    });
                }

                // --- BÊN VIEW (HTML) ---
                if (sectionTitle) {
                    htmlContent += `<strong style="display: block; margin-top: 15px; font-size: 1.1em; color: #1e293b;">${sectionTitle}</strong>`;
                }
                if (sectionContent) {
                    htmlContent += `<span style="display: block; margin-top: 5px; line-height: 1.6;">${sectionContent}${citeHtml}</span>`;
                }

                // --- BÊN EDIT (FORM) ---
                editFormHtml += `
                    <div class="ws-edit-row" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <input type="text" class="ws-edit-title" value="${sectionTitle}" placeholder="${mnI18n.t('workspace.section_title_placeholder')}" 
                                   style="width: 70%; font-weight: bold; border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px;">
                            <span style="font-size: 12px; color: #64748b; background: #fff; padding: 2px 8px; border-radius: 10px; border: 1px solid #e2e8f0;">
                                ${mnI18n.t('workspace.source_label')} ${citeLabel || mnI18n.t('workspace.no_source_label')}
                            </span>
                        </div>
                        <textarea class="ws-edit-content" rows="3" style="width: 100%; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px; font-size: 14px; resize: vertical;">${sectionContent}</textarea>
                        <input type="hidden" class="ws-edit-source" value='${JSON.stringify(sources)}'>
                    </div>
                `;

                if (node.children && node.children.length > 0) {
                    processArrayContent(node.children);
                }
            }
        }

        // Thực hiện xử lý
        if (article.final_content && article.final_content.array_content) {
            processArrayContent(article.final_content.array_content);
        } else {
            // Fallback nếu bài viết chỉ có full_content
            const rawText = article.final_content?.full_content || "";
            htmlContent = rawText.replace(/\n/g, "<br>");
            editFormHtml = `<textarea class="ws-edit-content" style="width:100%; height:300px;">${rawText}</textarea>`;
        }

        // 3. Xử lý Bibliography & Sources (Chỉ hiển thị bên View)
        if (article.bibliography && article.bibliography.length > 0) {
            htmlContent += `<br><hr><strong style="display: block; margin-top: 15px; font-size: 1.1em;">${mnI18n.t('workspace.reference_title')}</strong>`;
            if (!window.sourceCache) window.sourceCache = {};
            const uniqueSources = new Set();
            let index = 1;
            

            for (const bib of article.bibliography) {
                const sourceId = bib.locator?.source_id;
                let sourceTitle = mnI18n.t('workspace.unknown_source');
                let sourceObj = null;

                if (sourceId) {
                    if (!sourceCache[sourceId]) {
                        const sourceData = await apiClient.apiGet(`/sources/${sourceId}`);
                    sourceCache[sourceId] = sourceData;
                }

                    sourceObj = sourceCache[sourceId];
                    sourceTitle = sourceObj ? (sourceObj.title || mnI18n.t('workspace.untitled_source')) : mnI18n.t('workspace.deleted_source');
                    if (sourceTitle !== mnI18n.t('workspace.deleted_source')) uniqueSources.add(sourceTitle);
                }

                if (sourceTitle !== mnI18n.t('workspace.unknown_source') && sourceTitle !== mnI18n.t('workspace.deleted_source')) {
                    uniqueSources.add(sourceTitle);
                }

                let locationStr = ''; 
                
                if (bib.locator) {
                    const sourceType = bib.locator.source_type || 'unknown';
                    switch (sourceType) {
                        case 'web':
                            const chunkIdx = bib.locator.chunk_index;
                            const source_id = bib.locator.source_id;
                            
                            const sourceData = await apiClient.apiGet(`/sources/${source_id}/chunks/${chunkIdx}`);
                            const fullText = sourceData?.content || "";
                            
                            if (fullText.length > 60) {
                                
                                const startText = fullText.substring(0, 30).trim();
                                const endText = fullText.substring(fullText.length - 30).trim();
                                locationStr += ` <i style="color: #64748b;">["${startText} ... ${endText}"]</i>`;
                            } else {
                                locationStr += ` <i style="color: #64748b;">["${fullText}"]</i>`;
                            }
                            
                            break;
                        case 'docx':
                            locationStr = ` - ${mnI18n.t('source.segment_number', { index: bib.locator.block_index ?? mnI18n.t('common.na') })}`;
                            break;

                        case 'pdf':
                            locationStr = ` - ${mnI18n.t('source.page_number', { index: bib.locator.page_number ?? mnI18n.t('common.na') })}`;
                            break;

                        case 'audio':
                        case 'youtube':
                        case 'video':
                            const startSec = bib.locator.start_seconds ?? 0;
                            const endSec = bib.locator.end_seconds ?? 0;
                            const startVal = formatTime(startSec)
                            const endVal = formatTime(endSec)
                            locationStr = `- ${mnI18n.t('source.time_range', { start: startVal, end: endVal })}`;
                            break;

                        default:
                            locationStr = '';
                            break;
                    }
                }
                
                htmlContent += `<div style="font-size: 13px; margin-top: 4px; color: #475569;">[${bib.id}] - ${sourceTitle}${locationStr}</div>`;
            }
            if (uniqueSources.size > 0) {
                htmlContent += `<br><strong style="display: block; margin-top: 15px; font-size: 1.1em;">${mnI18n.t('workspace.sources_title')}</strong>`;
                
                uniqueSources.forEach(sourceName => {
                    htmlContent += `<div style="margin-top: 5px;">${sourceName}</div>`;
                });
              }
        }
        // Gán vào giao diện
        view.innerHTML = htmlContent;
        editContainer.innerHTML = editFormHtml;

        // Kích hoạt lại sự kiện hover cho các trích dẫn
        if (typeof setupTooltipEvents === 'function') setupTooltipEvents();

    } else {
        window.currentArticle = null;
        view.innerHTML = `<p style='color: #666; font-style: italic;'>${mnI18n.t('workspace.no_article')}</p>`;
        editContainer.innerHTML = "";
    }
}

function closeMindmapModal() {
    document.getElementById('ws_mindmap_modal').style.display = 'none';
    document.getElementById('ws_mm_draw_zone').innerHTML = '';
}
function closeYoutubeModal() {
    const modal = document.getElementById('youtube_modal');
    const iframe = document.getElementById('youtube_iframe');
    
    if (modal && iframe) {
        iframe.src = ""; // Dừng video ngay lập tức
        modal.style.display = 'none';
    }
}



// Hàm xử lý đóng/mở modal video youtube
function openYoutubeModal(videoId, startTime = 0) {
    const modal = document.getElementById('youtube_modal');
    document.body.appendChild(modal);
    const iframe = document.getElementById('youtube_iframe');
    const cleanId = videoId.includes('v=') ? videoId.split('v=')[1].split('&')[0] : videoId;
    iframe.src = `https://www.youtube.com/embed/${cleanId}?start=${Math.floor(startTime)}&autoplay=1`;
    modal.style.display = 'flex';
}



window.onclick = function(event) {
    const modal = document.getElementById('youtube_modal');
    if (event.target == modal) {
        closeYoutubeModal();
    }
}

// Hàm xử lý modal source
function closeSourceDetailModal() {
    document.getElementById('ws_source_detail_modal').style.display = 'none';
    document.getElementById('ws_source_chunks_container').innerHTML = ''; // Dọn dẹp DOM
}





async function openSourceDetailModal(source_id, chunk_idx = "") {
    const modal = document.getElementById('ws_source_detail_modal');
    const container = document.getElementById('ws_source_chunks_container');
    const loading = document.getElementById('ws_source_loading');
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    container.innerHTML = '';
    loading.style.display = 'block';

    try {
        const chunks = await apiClient.apiGet(`/sources/${source_id}/chunks`);
        const sourceData = await apiClient.apiGet(`/sources/${source_id}`);
        loading.style.display = 'none';

        if (!chunks || chunks.length === 0) {
            container.innerHTML = `<p style="color: #64748b; text-align: center; font-size: 14px;">${mnI18n.t('workspace.no_excerpt_content')}</p>`;
            return;
        }

        chunks.forEach(chunk => {
            const chunkDiv = document.createElement('div');
            chunkDiv.id = `chunk-${chunk.chunk_index}`;
            chunkDiv.style.padding = '12px 15px';
            chunkDiv.style.border = '1px solid #e2e8f0';
            chunkDiv.style.borderRadius = '8px';
            chunkDiv.style.marginBottom = '10px';
            chunkDiv.style.transition = 'all 0.2s ease';

            const meta = chunk.meta_data || {};
            const sourceType = meta.source_type || mnI18n.t('common.unknown');
            let locationStr = '';
            let startSec = 0;

            switch (sourceType) {
                case 'docx':
                    locationStr = ` - ${mnI18n.t('source.segment_number', { index: meta.block_index ?? mnI18n.t('common.na') })}`; 
                    break;
                case 'pdf':
                    locationStr = ` - ${mnI18n.t('source.page_number', { index: meta.page_number ?? mnI18n.t('common.na') })}`;
                    break;
                case 'audio':
                case 'youtube':
                case 'video':
                    startSec = meta.start_seconds ?? 0;
                    const endSec = meta.end_seconds ?? 0;
                    locationStr = ` - ${mnI18n.t('source.time_range', { start: formatTime(startSec), end: formatTime(endSec) })}`;
                    
                    chunkDiv.style.cursor = 'pointer';
                    chunkDiv.style.borderLeft = '4px solid #ef4444';
                    chunkDiv.onmouseover = () => chunkDiv.style.backgroundColor = '#fef2f2';
                    chunkDiv.onmouseout = () => {
                        if (!isHighlighted) chunkDiv.style.backgroundColor = 'transparent';
                    };
                    link_youtube = sourceData.title;
                    console.log(link_youtube)
                    chunkDiv.onclick = () => openYoutubeModal(link_youtube, startSec);
                    break;
            }

            const isHighlighted = (chunk_idx !== "" && chunk.chunk_index === chunk_idx);
            if (isHighlighted) {
                chunkDiv.style.backgroundColor = '#fef08a';
                chunkDiv.style.borderColor = '#eab308';
            }

            const metaHTML = `<div style='font-size: 11px; color: #187A35; font-weight: 700; margin-bottom: 6px; font-family: monospace; text-transform: uppercase;'>[${sourceType}${locationStr}]</div>`;
            const contentHTML = `<div style='font-size: 14px; color: #334155; line-height: 1.6;'>${chunk.content}</div>`;
            
            if (sourceType === 'youtube') {
                chunkDiv.innerHTML = metaHTML + contentHTML + `<div style="margin-top:8px; font-size:12px; color:#ef4444; font-weight:bold; display:flex; align-items:center; gap:5px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> ${mnI18n.t('workspace.play_video_hint')}</div>`;
            } else {
                chunkDiv.innerHTML = metaHTML + contentHTML;
            }
            
            container.appendChild(chunkDiv);
        });

        if (chunk_idx !== "") {
            const targetElement = document.getElementById(`chunk-${chunk_idx}`);
            if (targetElement) {
                setTimeout(() => {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 150);
            }
        }

    } catch (error) {
        loading.style.display = 'none';
        container.innerHTML = `<p style="color: #ef4444; text-align: center; font-size: 14px;">${mnI18n.t('workspace.connection_error_loading_data')}</p>`;
    }
}

// Bấm ra ngoài vùng tối (overlay) để đóng Modal
document.getElementById('ws_source_detail_modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeSourceDetailModal();
    }
});

// ==========================================
// HÀM XỬ LÝ TOOLTIP CHUNK TRÍCH DẪN
// ==========================================
function setupTooltipEvents() {
    const markers = document.querySelectorAll('.citation-marker');
    const tooltip = document.getElementById('chunk_tooltip');

    tooltip.style.pointerEvents = 'auto';
    let hideTimeout;

    if (!window.chunkCache) window.chunkCache = {};
    if (!window.sourceCache) window.sourceCache = {}; // Đảm bảo object tồn tại

    tooltip.addEventListener('mouseenter', () => {
        if (hideTimeout) clearTimeout(hideTimeout);
    });

    tooltip.addEventListener('mouseleave', () => {
        hideTimeout = setTimeout(() => {
            tooltip.style.display = 'none';
        }, 400); 
    });

    markers.forEach(marker => {
        marker.addEventListener('mouseenter', async (e) => {
            if (hideTimeout) clearTimeout(hideTimeout);

            const sourceId = marker.getAttribute('data-source-id');
            const chunkIndex = marker.getAttribute('data-chunk-index');
            const cacheKey = `${sourceId}_${chunkIndex}`;

            tooltip.style.display = 'block';
            tooltip.style.opacity = '1';
            
            let leftPos = e.clientX + 5;
            let topPos = e.clientY + 5;
            if (leftPos + 350 > window.innerWidth) leftPos = e.clientX - 355;
            if (topPos + 150 > window.innerHeight) topPos = e.clientY - 155;
            tooltip.style.left = leftPos + 'px';
            tooltip.style.top = topPos + 'px';

            if (window.chunkCache[cacheKey]) {
                tooltip.innerHTML = window.chunkCache[cacheKey];
            } else {
                tooltip.innerHTML = `<span style='color: #94a3b8; font-style: italic;'><i class='fa fa-spinner fa-spin'></i> ${mnI18n.t('common.loading_data')}</span>`;
                try {
                    // Lấy nội dung đoạn chunk
                    const data = await apiClient.apiGet(`/sources/${sourceId}/chunks/${chunkIndex}`);
                    
                    // Lấy tên nguồn (Ưu tiên lấy từ cache RAM để khỏi gọi API lại, nếu chưa có mới gọi API)
                    let sourceName = window.sourceCache[sourceId] && window.sourceCache[sourceId].title;
                    if (!sourceName) {
                        try {
                            const sourceData = await apiClient.apiGet(`/sources/${sourceId}`);
                            sourceName = sourceData ? sourceData.title : mnI18n.t('workspace.unknown_source');
                            window.sourceCache[sourceId] = { title: sourceName };
                        } catch (err) {
                            sourceName = mnI18n.t('workspace.cannot_load_source_name');
                        }
                    }

                    if (data && data.content) {
                        // Nối thêm HTML hiển thị tên nguồn ở dưới cùng
                        const contentHtml = `
                            <strong style="color: #0f172a; border-bottom: 1px solid #eee; padding-bottom: 5px; display: block; margin-bottom: 5px;">${mnI18n.t('workspace.excerpt_title')}</strong>
                            <div style="max-height: 200px; overflow-y: auto; color: #334155;">${data.content}</div>
                            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 0.9em; color: #475569;">
                                <strong>${mnI18n.t('workspace.source_label')}</strong> <em>${sourceName}</em>
                            </div>
                        `;
                        window.chunkCache[cacheKey] = contentHtml;
                        tooltip.innerHTML = contentHtml;
                    } else {
                    tooltip.innerHTML = `<span style='color: #ef4444;'>${mnI18n.t('workspace.no_excerpt_content')}</span>`;
                    }
                } catch (error) {
                    tooltip.innerHTML = `<span style='color: #ef4444;'>${mnI18n.t('workspace.connection_error_loading_data')}</span>`;
                }
            }
        });

        marker.addEventListener('click', () => {
        // Lấy dữ liệu từ attribute của marker giống như lúc hover
        const sourceId = marker.getAttribute('data-source-id');
        const chunkIndex = marker.getAttribute('data-chunk-index');
        
        // Gọi hàm mở modal, truyền cả 2 tham số để modal highlight và cuộn tới đúng chunk
        if (sourceId && chunkIndex) {
            openSourceDetailModal(sourceId, chunkIndex);
            
            // Tùy chọn: Có thể ẩn luôn tooltip khi modal đã mở ra cho gọn màn hình
            tooltip.style.display = 'none'; 
        }
        });

        marker.addEventListener('mouseleave', () => {
            hideTimeout = setTimeout(() => {
                tooltip.style.display = 'none';
            }, 400); 
        });
    });
}

async function handleUploadFile() {
    const fileInput = document.getElementById('ws_file_upload_modal'); // ID mới
    const file = fileInput.files[0];
    if (!file) return;

    const statusDiv = document.getElementById('ws_modal_source_status'); // ID trạng thái trong modal
    statusDiv.innerText = mnI18n.t('workspace.extracting_file_status');
    
    const formData = new FormData();
    formData.append("file", file);
    const url = apiClient.getBaseUrl() + `/ai/extract/file/${window.nbId}`; 
    
    try {
        const response = await fetch(url, { method: 'POST', body: formData });
        if (response.ok) {
            fileInput.value = ""; 
            document.getElementById('ws_source_modal').style.display = 'none'; // Đóng modal
            loadNotebookDetails(); // Cập nhật lại list ở ngoài
        } else {
            const errorData = await response.json();
            alert(mnI18n.t('common.error_prefix') + (errorData.detail || mnI18n.t('workspace.file_processing_error')));
        }
    } catch (error) {
        alert(mnI18n.t('workspace.error_network_upload'));
    }
    statusDiv.innerText = "";
}

// --- BƯỚC 3: Bổ sung hàm xử lý URL ---
async function handleAddUrl() {
    const urlInput = document.getElementById('ws_url_input_modal'); // ID mới
    const urlValue = urlInput.value.trim();
    
    if (!urlValue) {
        alert(mnI18n.t('workspace.valid_url_required'));
        return;
    }

    const statusDiv = document.getElementById('ws_modal_source_status');
    statusDiv.innerText = mnI18n.t('workspace.extracting_url_status');

    try {
        const endpoint = `/ai/extract/url/${window.nbId}?url=${encodeURIComponent(urlValue)}`;
        const result = await apiClient.apiPost(endpoint, {}); 
        
        if (result && result.status === "success") {
            urlInput.value = ""; 
            document.getElementById('ws_source_modal').style.display = 'none'; // Đóng modal
            loadNotebookDetails(); 
        }
    } catch (error) {
        console.error(mnI18n.t('workspace.url_extraction_error'), error);
    }
    statusDiv.innerText = "";
}
window.allWorkspaceTemplates = [];
async function openTemplateModal() {
    const modal = document.getElementById('ws_template_modal');
    modal.style.display = 'flex';

    document.body.appendChild(document.getElementById('ws_template_modal'));
    
    // Dọn dẹp form bên trái & ô tìm kiếm
    document.getElementById('ws_tpl_name').value = '';
    document.getElementById('ws_tpl_search_input').value = ''; // Reset ô tìm kiếm mỗi khi mở modal
    document.getElementById('ws_tpl_structure_container').innerHTML = '';
    
    // Giả sử hàm này bạn đã có để thêm 1 dòng trống
    if (typeof wsAddTemplateSection === "function") wsAddTemplateSection(); 
    
    const listContainer = document.getElementById('ws_tpl_list_container');
    listContainer.innerHTML = `<p style='color: #64748b; font-size: 14px; font-style: italic;'>${mnI18n.t('common.loading_data')}</p>`;
    
    const userId = apiClient.getUserId();
    const data = await apiClient.apiGet(`/templates/${userId}`);
    
    // Lưu vào biến tạm để filter
    window.allWorkspaceTemplates = data || [];
    
    // Gọi hàm render
    renderWorkspaceTemplateList(window.allWorkspaceTemplates);
}





// Hàm render danh sách (dùng chung cho load và search)
function renderWorkspaceTemplateList(templates) {
    const listContainer = document.getElementById('ws_tpl_list_container');
    listContainer.innerHTML = "";
    
    if (templates && templates.length > 0) {
        templates.forEach(tpl => {
            const div = document.createElement('div');
            div.style.cssText = "border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; cursor: pointer; background: #f8fafc; transition: all 0.2s;";
            
            div.onmouseover = () => { div.style.background = "#eff6ff"; div.style.borderColor = "#bfdbfe"; };
            div.onmouseout = () => { div.style.background = "#f8fafc"; div.style.borderColor = "#e2e8f0"; };
            
            const sectionCount = Array.isArray(tpl.prompt_structure) ? tpl.prompt_structure.length : 0;
            div.innerHTML = `
                <strong style='font-size: 14px; color: #0f172a; display: block; margin-bottom: 3px;'>${tpl.name}</strong>
                <span style='font-size: 12px; color: #64748b;'>${mnI18n.t('template.items_included', { count: sectionCount })}</span>
            `;
            
            div.onclick = () => selectTemplateForWorkspace(tpl.id, tpl.name);
            listContainer.appendChild(div);
        });
    } else {
        listContainer.innerHTML = `<p style='color: #64748b; font-size: 13px; text-align: center; margin-top: 10px;'>${mnI18n.t('template.no_match')}</p>`;
    }
}

// Logic lọc dữ liệu khi gõ phím
function filterWorkspaceTemplates() {
    const keyword = document.getElementById('ws_tpl_search_input').value.toLowerCase().trim();
    
    const filtered = window.allWorkspaceTemplates.filter(tpl => 
        tpl.name.toLowerCase().includes(keyword)
    );
    
    renderWorkspaceTemplateList(filtered);
}

function closeTemplateModal() {
    document.getElementById('ws_template_modal').style.display = 'none';
}

async function selectTemplateForWorkspace(id) {
    const tpl = allWorkspaceTemplates.find(t => t.id === id);
    if (!tpl) return;

    // --- NẠP ID VÀO ĐÂY ---
    document.getElementById('ws_editing_template_id').value = id;
    
    document.getElementById('ws_tpl_name').value = tpl.name;
    const container = document.getElementById('ws_tpl_structure_container');
    container.innerHTML = "";
    const structure = tpl.prompt_structure || [];
    structure.forEach(section => {
        wsAddTemplateSection(section.title, section.description);
    });
}

// --- BƯỚC 3: Logic tạo Template bên trái Modal ---
function wsAddTemplateSection(title = "", desc = "") {
    const container = document.getElementById('ws_tpl_structure_container');
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'ws-tpl-section-item';
    sectionDiv.style.cssText = "background: #ffffff; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; position: relative;";
    
    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '✕';
    removeBtn.style.cssText = "position: absolute; top: 5px; right: 5px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 10px; display: flex; align-items: center; justify-content: center;";
    removeBtn.onclick = () => container.removeChild(sectionDiv);

    // Chèn giá trị title và desc vào template string
    sectionDiv.innerHTML = `
        <input type="text" class="ws-section-title" placeholder="${mnI18n.t('workspace.section_title_placeholder')}" 
            value="${title}"
            style="width: 88%; padding: 6px; margin-bottom: 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;">
        <textarea class="ws-section-desc" placeholder="${mnI18n.t('workspace.section_description_placeholder')}" rows="2" 
            style="width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box; resize: vertical; font-size: 13px;">${desc}</textarea>
    `;
    sectionDiv.appendChild(removeBtn);
    container.appendChild(sectionDiv);
}

async function handleCreateAndSelectTemplate() {
    const name = document.getElementById('ws_tpl_name').value.trim();
    const editingId = document.getElementById('ws_editing_template_id').value; // Lấy ID đang sửa

    if (!name) { alert(mnI18n.t('workspace.template_name_required')); return; }

    const sections = document.querySelectorAll('.ws-tpl-section-item');
    let structureArray = [];
    sections.forEach(section => {
        const title = section.querySelector('.ws-section-title').value.trim();
        const desc = section.querySelector('.ws-section-desc').value.trim();
        if (title !== '') structureArray.push({ title: title, description: desc });
    });

    if (structureArray.length === 0) {
        alert(mnI18n.t('workspace.template_section_required')); return;
    }

    const payload = {
        name: name,
        prompt_structure: structureArray,
        user_id: apiClient.getUserId()
    };

    let result;
    if (editingId) {
        // TRƯỜNG HỢP 1: Cập nhật dàn ý cũ (Dùng PUT)
        result = await apiClient.apiPut(`/templates/${editingId}`, payload);
    } else {
        // TRƯỜNG HỢP 2: Tạo mới hoàn toàn (Dùng POST)
        result = await apiClient.apiPost(`/templates`, payload);
    }
    
    if (result && (result.id || editingId)) {
        const finalId = editingId || result.id;
        const finalName = name;

        // Gán vào UI chính
        document.getElementById('ws_selected_template_id').value = finalId;
        document.getElementById('ws_selected_template_name').innerText = finalName;
        document.getElementById('ws_selected_template_name').style.color = "#0f172a";
        


        closeTemplateModal();
        alert(mnI18n.t('workspace.template_selected_success'))
        // --- QUAN TRỌNG: Reset ID về rỗng cho lần sau ---
        document.getElementById('ws_editing_template_id').value = "";
        document.getElementById('ws_tpl_name').value = "";
        document.getElementById('ws_tpl_structure_container').innerHTML = "";
    }
}

// --- BƯỚC 4: Sửa lại hàm Generate cũ của bạn ---
async function handleGenerate() {
    // Đọc từ thẻ hidden thay vì ô input text cũ
    const tplId = document.getElementById('ws_selected_template_id').value;
    if (!tplId) {
        alert(mnI18n.t('workspace.select_template_first'));
        return;
    }

    showLoadingModal();
    document.getElementById('ws_status_text').innerText = mnI18n.t('workspace.ai_writing_status');
    
    const payload = {
        user_id: apiClient.getUserId(),
        template_id: parseInt(tplId),
        topic_name: document.getElementById('ws_notebook_title').innerText
    };

    try {
        const result = await apiClient.apiPost(`/ai/generate/${window.nbId}`, payload);
        
        if (result) {
            loadArticle();
        }
    } finally {
        hideLoadingModal();
        document.getElementById('ws_status_text').innerText = "";
    }
}

function toggleEditMode() {
    const view = document.getElementById('ws_article_view');
    const edit = document.getElementById('ws_article_edit');
    
    if (view.style.display !== 'none') {
        view.style.display = 'none';
        edit.style.display = 'block';
    } else {
        view.style.display = 'block';
        edit.style.display = 'none';
    }
}

async function handleSaveArticle() {
    if (!window.currentArticle) {
        alert(mnI18n.t('workspace.no_article_to_save'));
        return;
    }

    document.getElementById('ws_status_text').innerText = mnI18n.t('workspace.saving_status');

    // 1. Thu thập dữ liệu từ các hàng trong Form Editor
    const rows = document.querySelectorAll('.ws-edit-row');
    const newArrayContent = [];
    let fullTextAccumulator = ""; // Dùng để cập nhật lại full_content cho đồng bộ

    rows.forEach(row => {
        const title = row.querySelector('.ws-edit-title').value.trim();
        const content = row.querySelector('.ws-edit-content').value.trim();
        
        // Lấy lại mảng source từ hidden input đã lưu lúc load
        let source = [];
        try {
            source = JSON.parse(row.querySelector('.ws-edit-source').value);
        } catch (e) {
            source = [];
        }

        if (title || content) {
            newArrayContent.push({
                title: title,
                content: content,
                source: source, // Bảo toàn trích dẫn của đoạn này
                type: "leaf",
                children: []
            });
            
            // Phục dựng lại full_content để hiển thị sơ cua nếu cần
            fullTextAccumulator += (title ? title + "\n" : "") + content + "\n\n";
        }
    });

    // 2. Đóng gói Payload
    const payload = {
        final_content: {
            array_content: newArrayContent,
            full_content: fullTextAccumulator.trim()
        },
        bibliography: window.currentArticle.bibliography // Giữ nguyên danh mục tài liệu tham khảo
    };

    // 3. Gọi API PUT để cập nhật
    const articleId = window.currentArticle.id;
    const url = apiClient.getBaseUrl() + `/articles/${articleId}`;
    
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
     
            window.currentArticle.final_content = payload.final_content;

            // Chuyển chế độ hiển thị
            document.getElementById('ws_article_view').style.display = 'block';
            document.getElementById('ws_article_edit').style.display = 'none';
            
            
            await loadArticle(); 
            
            alert(mnI18n.t('workspace.article_save_success'));
        } else {
            const errData = await response.json();
            alert(mnI18n.t('workspace.server_error', { detail: errData.detail || mnI18n.t('workspace.save_connection_error') }));
        }
    } catch (error) {
        console.error("Save Error:", error);
        alert(mnI18n.t('workspace.save_connection_error'));
    }
    
    document.getElementById('ws_status_text').innerText = "";
}

async function handleDeleteNotebook() {
    if (!confirm(mnI18n.t('workspace.delete_confirm'))) return; 
    const result = await apiClient.apiDelete(`/notebooks/${window.nbId}`);
    if (result) {
        alert(mnI18n.t('workspace.deleted_success'));
        window.location.href = mw.util.getUrl('Special:MyNotebook');
    } else {
        alert(mnI18n.t('workspace.delete_error'));
    }  
}

function openCustomModal() {
    document.body.appendChild(document.getElementById('custom_modal'));
    document.getElementById('custom_modal').classList.remove('hidden');

}

// Hàm đóng Modal
function closeCustomModal() {
    document.getElementById('custom_modal').classList.add('hidden');
}

// Đóng Modal khi click ra ngoài vùng trắng (click vào nền mờ)
document.getElementById('custom_modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeCustomModal();
    }
});


// Upload wiki 
async function uploadToWiki() {
    showLoadingModal();
    
    try {
        const notebookData = await apiClient.apiGet(`/notebooks/${window.nbId}`);
        if (!notebookData) {
            hideLoadingModal();
            return;
        }

        const data = await apiClient.apiGet(`/notebooks/${window.nbId}/articles`);

        let article = {};
        if (data && data.length > 0) {
            article = data[data.length - 1];
            window.currentArticle = article; 
        } else {
            alert(mnI18n.t('workspace.no_article_to_upload'));
            hideLoadingModal();
            return;
        }

        const wikiData = {
            name: notebookData.name || mnI18n.t('workspace.unknown_article_name'), 
            array_content: [],
            array_bibliography: [],
            array_sources: []
        };

        // --- 1. Trích xuất nội dung bài viết ---
        function extractContent(nodes) {
            if (!nodes || nodes.length === 0) return;
            for (const node of nodes) {
                if (node.title || node.content) {
                    let citeText = "";
                    if (node.source && Array.isArray(node.source)) {
                        const sortedSourceList = [...node.source].sort((a, b) => a - b);
                        citeText = sortedSourceList.map(bibId => `[${bibId}]`).join(' ');
                    }
                    wikiData.array_content.push({
                        title: node.title || "",
                        content: (node.content || "") + " " + citeText
                    });
                }
                if (node.children && node.children.length > 0) {
                    extractContent(node.children);
                }
            }
        }

        if (article.final_content && article.final_content.array_content) {
            extractContent(article.final_content.array_content);
        }

        // --- 2. Trích xuất danh mục tham khảo ---
        if (article.bibliography && article.bibliography.length > 0) {
            const uniqueSourcesSet = new Set();
            if (!window.sourceCache) window.sourceCache = {};

            for (const bib of article.bibliography) {
                const locator = bib.locator || {};
                const sourceId = locator.source_id;
                const chunkIdx = locator.chunk_index;
                
                let sourceTitle = mnI18n.t('workspace.unknown_source');
                let sourceObj = null;

                if (sourceId) {
                    // Nếu chưa có trong cache thì fetch về
                    if (!window.sourceCache[sourceId]) {
                        try {
                            // Lấy toàn bộ source object thay vì chỉ lấy chunk lẻ để đồng bộ với loadArticle
                            const sourceData = await apiClient.apiGet(`/sources/${sourceId}`);
                            window.sourceCache[sourceId] = sourceData;
                        } catch (e) {
                            window.sourceCache[sourceId] = { title: mnI18n.t('workspace.cannot_load_source_name') };
                        }
                    }
                    
                    // FIX LỖI Ở ĐÂY: Lấy title từ Object trong cache
                    sourceObj = window.sourceCache[sourceId];
                    sourceTitle = sourceObj?.title || mnI18n.t('workspace.unknown_source');
                }

                if (sourceTitle !== mnI18n.t('workspace.unknown_source') && sourceTitle !== mnI18n.t('workspace.deleted_source')) {
                    uniqueSourcesSet.add(sourceTitle);
                }

                let locationStr = '';
                if (sourceId && sourceObj) {
                    const sourceType = locator.source_type || 'unknown';
                    switch (sourceType) {
                        case 'web':
                            // Tận dụng dữ liệu đã có trong sourceObj để lấy fullText, không cần fetch thêm lần nữa
                            if (chunkIdx !== undefined && sourceObj.chunks && sourceObj.chunks[chunkIdx]) {
                                const fullText = (sourceObj.chunks[chunkIdx].content || "").trim();
                                if (fullText.length > 60) {
                                    const startText = fullText.substring(0, 30);
                                    const endText = fullText.substring(fullText.length - 30);
                                    locationStr = ` ["${startText} ... ${endText}"]`;
                                } else if (fullText.length > 0) {
                                    locationStr = ` ["${fullText}"]`;
                                }
                            }
                            break;
                        case 'docx':
                            locationStr = ` - ${mnI18n.t('source.segment_number', { index: locator.block_index ?? mnI18n.t('common.na') })}`;
                            break;
                        case 'pdf':
                            locationStr = ` - ${mnI18n.t('source.page_number', { index: locator.page_number ?? mnI18n.t('common.na') })}`;
                            break;
                        case 'youtube': case 'video': case 'audio':
                            const start = formatTime(locator.start_seconds ?? 0);
                            const end = formatTime(locator.end_seconds ?? 0);
                            locationStr = ` - ${mnI18n.t('source.time_range', { start, end })}`;
                            break;
                    }
                }

                // Gửi chuỗi text thuần túy lên Wiki
                wikiData.array_bibliography.push(`[${bib.id}] - ${sourceTitle}${locationStr}`);
            }
            wikiData.array_sources = Array.from(uniqueSourcesSet);
        }

        // Gọi API upload
        const uploadResult = await apiClient.apiPost(`/ai/wiki/upload`, wikiData);

        // Kiểm tra kết quả từ Backend trả về
        if (uploadResult && uploadResult.status === "success") {
            alert(mnI18n.t('workspace.upload_success'));
            
            const wikiUrlName = notebookData.name.replace(/\s+/g, '_');
            location.href = `http://localhost/wikicrop/index.php/Draft:${wikiUrlName}`;
        } else {
            const errorMsg = uploadResult?.message || mnI18n.t('workspace.unspecified_reason');
            alert(mnI18n.t('workspace.system_error', { detail: errorMsg }));
        }

        return wikiData;

    } catch (error) {
        console.error("Lỗi uploadToWiki:", error);
        alert(mnI18n.t('workspace.upload_connect_error'));
    } finally {
        hideLoadingModal();
    }
}


async function openMindmapModal(notebook_id) {
    const modal = document.getElementById('ws_mindmap_modal');
    const drawZone = document.getElementById('ws_mm_draw_zone');
    const btnSave = document.getElementById('ws_mm_btn_save_img');
    const btnGenerate = document.getElementById('ws_mm_btn_generate');

    if (!modal || !drawZone) return;

    if (modal.parentNode !== document.body) document.body.appendChild(modal);
    modal.style.display = 'flex';
    btnSave.style.display = 'none';

    let status = document.getElementById('ws_mm_status');
    if (!status) {
        status = document.createElement('p');
        status.id = 'ws_mm_status';
        status.style.cssText = 'text-align:center; color:#64748b; font-style:italic; width: 100%; padding: 100px 0; margin: 0;';
        drawZone.appendChild(status);
    }

    // Reset trạng thái ban đầu: Hiện loading chung và xóa layout cũ để fetch cái mới
    status.style.display = 'block';
    status.innerText = mnI18n.t('workspace.loading_mindmap');
    const oldLayout = drawZone.querySelector('.mm-layout');
    if (oldLayout) oldLayout.remove();

    // Sự kiện nút Tạo mới: Thay đổi trạng thái trực tiếp trên nút
    btnGenerate.onclick = async () => {
        const originalText = btnGenerate.innerText;
        
        btnGenerate.innerText = mnI18n.t('workspace.generating');
        btnGenerate.disabled = true;
        btnGenerate.style.opacity = '0.7';
        btnGenerate.style.cursor = 'not-allowed';

        try {
            const res = await apiClient.apiPost(`/ai/mindmap/generate/${notebook_id}`);
            if (res) {
                await openMindmapModal(notebook_id);
            }
        } catch (e) {
            status.style.display = 'block';
            status.innerText = mnI18n.t('workspace.mindmap_error', { detail: e.message || 'Server error' });
        } finally {
            btnGenerate.innerText = originalText;
            btnGenerate.disabled = false;
            btnGenerate.style.opacity = '1';
            btnGenerate.style.cursor = 'pointer';
        }
    };

    try {
        const response = await fetch(apiClient.getBaseUrl() + '/notebooks/' + notebook_id + '/mindmap');
        
        if (response.status === 404) {
            status.style.display = 'block';
            status.innerText = mnI18n.t('workspace.no_mindmap');
            return;
        }

        const data = await response.json();
        
        status.style.display = 'none';
        btnSave.style.display = 'block';

        const structure = typeof data.structure === 'string' ? JSON.parse(data.structure) : data.structure;
        renderMindmap(structure, drawZone);

        btnSave.onclick = () => {
            html2canvas(drawZone).then(canvas => {
                const link = document.createElement('a');
                link.download = `mindmap-${notebook_id}.png`;
                link.href = canvas.toDataURL();
                link.click();
            });
        };

    } catch (error) {
        status.style.display = 'block';
        status.innerText = mnI18n.t('workspace.mindmap_connect_error');
    }
}


function renderMindmap(data, container) {
    container.innerHTML = '';

    
    // Tạo Layout
    const layout = document.createElement('div');
    layout.className = 'mm-layout';
    
    const col1 = document.createElement('div'); col1.className = 'mm-col mm-col-1';
    const col2 = document.createElement('div'); col2.className = 'mm-col mm-col-2';
    const col3 = document.createElement('div'); col3.className = 'mm-col mm-col-3';

    layout.appendChild(col1);
    layout.appendChild(col2);
    layout.appendChild(col3);
    container.appendChild(layout);

    // Tạo SVG Overlay
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'mm_svg_overlay';
    svg.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1;';
    layout.appendChild(svg);

    const subTopics = data.children || [];

    // 1. Render Cấp 3 (Lá)
    subTopics.forEach(sub => {
        sub.leafElements = [];
        (sub.children || []).forEach(leaf => {
            const el = document.createElement('div');
            el.className = 'mm-node leaf';
            el.innerText = leaf.title;
            col3.appendChild(el);
            sub.leafElements.push(el);
        });
    });

    // 2. Render Cấp 2 (Sub)
    subTopics.forEach(sub => {
        sub.element = document.createElement('div');
        sub.element.className = 'mm-node sub';
        sub.element.innerText = sub.title;
        col2.appendChild(sub.element);
    });

    // 3. Render Root
    const rootEl = document.createElement('div');
    rootEl.className = 'mm-node root';
    rootEl.innerText = data.title;
    col1.appendChild(rootEl);

    // 4. Thuật toán căn chỉnh và chống cắt hình (Offset)
    setTimeout(() => {
        const layoutRect = layout.getBoundingClientRect();
        let minTopFound = 0;
        let maxBottomFound = 0;

        // ÉP CHIỀU CAO: Bắt Cột 1 và 2 phải cao bằng Cột 3 để làm mốc
        const col3Height = col3.offsetHeight;
        col1.style.minHeight = col3Height + 'px';
        col2.style.minHeight = col3Height + 'px';

        // BƯỚC A: Tính toán vị trí tâm
        subTopics.forEach(sub => {
            if (sub.leafElements.length > 0) {
                const first = sub.leafElements[0].getBoundingClientRect();
                const last = sub.leafElements[sub.leafElements.length - 1].getBoundingClientRect();
                const targetY = (first.top + last.bottom) / 2 - layoutRect.top;
                const topPos = targetY - sub.element.offsetHeight / 2;
                
                sub.calculatedTop = topPos;
                if (topPos < minTopFound) minTopFound = topPos;
            }
        });

        if (subTopics.length > 0) {
            const firstSubTop = subTopics[0].calculatedTop;
            const lastSubTop = subTopics[subTopics.length - 1].calculatedTop;
            const lastSubHeight = subTopics[subTopics.length - 1].element.offsetHeight;
            
            const rootY = (firstSubTop + (lastSubTop + lastSubHeight)) / 2;
            const rootTopPos = rootY - rootEl.offsetHeight / 2;
            
            rootEl.calculatedTop = rootTopPos;
            if (rootTopPos < minTopFound) minTopFound = rootTopPos;
        }

        // Áp dụng vị trí và theo dõi điểm thấp nhất
        const offset = Math.abs(minTopFound); 

        subTopics.forEach(sub => {
            sub.element.style.position = 'absolute';
            const finalTop = sub.calculatedTop + offset;
            sub.element.style.top = finalTop + 'px';
            sub.element.style.left = '0';
            sub.element.style.right = '0';

            const bottom = finalTop + sub.element.offsetHeight;
            if (bottom > maxBottomFound) maxBottomFound = bottom;
        });

        rootEl.style.position = 'absolute';
        const rootFinalTop = rootEl.calculatedTop + offset;
        rootEl.style.top = rootFinalTop + 'px';
        rootEl.style.left = '0';
        rootEl.style.right = '0';

        if (rootFinalTop + rootEl.offsetHeight > maxBottomFound) {
            maxBottomFound = rootFinalTop + rootEl.offsetHeight;
        }

        // Dịch chuyển cột 3 xuống đồng bộ
        col3.style.marginTop = offset + 'px';
        if (offset + col3Height > maxBottomFound) {
            maxBottomFound = offset + col3Height;
        }

        // CHỐNG BIẾN MẤT: Bắt layout nới rộng ra bao trùm toàn bộ
        layout.style.minHeight = (maxBottomFound + 160) + 'px'; // +160px để bù khoảng padding trên dưới

        // Vẽ dây nối SAU KHI HTML đã áp dụng tọa độ mới
        // Dùng requestAnimationFrame để chờ trình duyệt vẽ xong vị trí mới
        requestAnimationFrame(() => {
            // Lấy lại kích thước layout mới nhất
            const updatedLayoutRect = layout.getBoundingClientRect();
            
            drawBezierConnections(svg, rootEl, subTopics, updatedLayoutRect);
            
            // Cập nhật SVG
            svg.setAttribute('width', layout.scrollWidth);
            svg.setAttribute('height', layout.scrollHeight);
        });

    }, 200);
}

function createNodeEl(title, type) {
    const el = document.createElement('div');
    el.className = 'mm-node ' + type;
    el.innerText = title;
    return el;
}
 
function drawBezierConnections(svg, rootEl, subTopics, layoutRect) {
    const rootR = rootEl.getBoundingClientRect();

    subTopics.forEach(sub => {
        const subR = sub.element.getBoundingClientRect();
        
        // Vẽ Root -> Sub
        const x1 = rootR.right - layoutRect.left;
        const y1 = rootR.top + rootR.height/2 - layoutRect.top;
        const x2 = subR.left - layoutRect.left;
        const y2 = subR.top + subR.height/2 - layoutRect.top;
        
        appendBezier(svg, x1, y1, x2, y2, '#2563eb');

        // Vẽ Sub -> Leaf
        sub.leafElements.forEach(leaf => {
            const leafR = leaf.getBoundingClientRect();
            const lx1 = subR.right - layoutRect.left;
            const ly1 = subR.top + subR.height/2 - layoutRect.top;
            const lx2 = leafR.left - layoutRect.left;
            const ly2 = leafR.top + leafR.height/2 - layoutRect.top;
            
            appendBezier(svg, lx1, ly1, lx2, ly2, '#10b981');
        });
    });
}

function appendBezier(svg, x1, y1, x2, y2, color) {
    const dist = Math.abs(x2 - x1) * 0.5;
    const pathData = `M ${x1} ${y1} C ${x1 + dist} ${y1}, ${x2 - dist} ${y2}, ${x2} ${y2}`;
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('opacity', '0.5');
    svg.appendChild(path);
}

function handleGenerateMindmap() {
    openMindmapModal(window.nbId);
}

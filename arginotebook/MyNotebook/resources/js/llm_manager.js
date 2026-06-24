function initLLMManager() {
    // Kiểm tra xem có đang ở đúng trang LLM Manager không
    const listContainer = document.getElementById('llm-list-container');
    if (!listContainer) return; // Nếu không có thì thoát tĩnh lặng

    console.log("LLM Manager started successfully!");

    // Gắn sự kiện (Event Listeners) cho các nút cố định trên Form
    document.getElementById('btn_save').addEventListener('click', handleSaveLLM);
    document.getElementById('btn_delete').addEventListener('click', handleDeleteLLM);
    document.getElementById('btn_cancel').addEventListener('click', cancelEdit);
    document.getElementById('btn_go_back').addEventListener('click', function() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = mw.util.getUrl('Special:MyNotebook');
    }
    });
    // Chạy tải dữ liệu danh sách
    loadLLMs();
}
if (document.readyState === "loading") {
    // Nếu trang đang tải (Tàu chưa chạy) -> Ngồi đợi
    document.addEventListener("DOMContentLoaded", initLLMManager);
} else {
    // Nếu HTML đã vẽ xong xuôi (Tàu đã chạy) -> Kích hoạt ngay lập tức!
    initLLMManager(); 
}


// ==========================================
// 1. HÀM GET: LẤY VÀ HIỂN THỊ DANH SÁCH
// ==========================================
async function loadLLMs() {
    console.log("Starting to load the LLM list...");
    const listContainer = document.getElementById('llm-list-container');
    listContainer.innerHTML = `<p style='color: #666;'>${mnI18n.t('llm.loading')}</p>`;

    const userId = apiClient.getUserId();
    const data = await apiClient.apiGet(`/llms/${userId}`);

    if (!data) {
        listContainer.innerHTML = `<p style='color: red;'>${mnI18n.t('llm.error_loading_list')}</p>`;
        return;
    }

    if (data.length === 0) {
        listContainer.innerHTML = `<p style='color: #666;'>${mnI18n.t('llm.no_config')}</p>`;
        return;
    }

    listContainer.innerHTML = ""; 
    data.forEach(llm => {
        const div = document.createElement('div');
        div.style.cssText = "border: 1px solid #e2e8f0; padding: 12px; margin-bottom: 10px; border-radius: 6px; cursor: pointer; background: #f8fafc; display: flex; justify-content: space-between; align-items: center;";
        
        // Tạo nút Kích hoạt hoặc Nhãn tùy trạng thái
        let statusHtml = '';
        if (llm.is_active) {
            statusHtml = `<span style='color: #059669; font-size: 12px; font-weight: bold; padding: 2px 6px; background: #d1fae5; border-radius: 4px;'>${mnI18n.t('llm.active')}</span>`;
        } else {
            // Use the 'btn-activate' class so JS can detect it easily
            statusHtml = `<button class="btn-activate" style='background: #10b981; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;'>${mnI18n.t('llm.activate')}</button>`;
        }

        div.innerHTML = `
            <div>
                <strong style='font-size: 15px;'>${llm.model_name}</strong><br>
                <span style='font-size: 13px; color: #64748b;'>${llm.provider}</span>
            </div>
            <div>${statusHtml}</div>
        `;

        // Lắng nghe sự kiện click trên toàn bộ khung LLM
        div.addEventListener('click', function(event) {
            // Nếu click trúng cái nút có class 'btn-activate' -> Chạy hàm Kích hoạt
            if (event.target.classList.contains('btn-activate')) {
                activateLLM(event, llm.id);
            } else {
                // Nếu click ra ngoài nút -> Chạy hàm Sửa (Select)
                selectLLM(llm);
            }
        });

        listContainer.appendChild(div);
    });
}

// ==========================================
// CÁC HÀM XỬ LÝ GIAO DIỆN (UI STATE)
// ==========================================
function selectLLM(llm) {
    document.getElementById('form_id').value = llm.id;
    document.getElementById('form_provider').value = llm.provider;
    document.getElementById('form_base_url').value = llm.base_url;
    document.getElementById('form_api_key').value = llm.api_key;
    document.getElementById('form_model_name').value = llm.model_name;

    document.getElementById('form-title').innerText = mnI18n.t('llm.update_title', { name: llm.model_name });
    document.getElementById('btn_save').innerText = mnI18n.t('llm.update_button');
    
    toggleButtons(false);
}

function cancelEdit() {
    document.getElementById('form_id').value = '';
    document.getElementById('form_provider').value = '';
    document.getElementById('form_base_url').value = '';
    document.getElementById('form_api_key').value = '';
    document.getElementById('form_model_name').value = '';

    document.getElementById('form-title').innerText = mnI18n.t('llm.create_title');
    document.getElementById('btn_save').innerText = mnI18n.t('llm.add_button');
    
    toggleButtons(true);
}

function toggleButtons(isDisabled) {
    const btnDelete = document.getElementById('btn_delete');
    const btnCancel = document.getElementById('btn_cancel');
    
    btnDelete.disabled = isDisabled;
    btnCancel.disabled = isDisabled;
    
    const opacity = isDisabled ? "0.5" : "1";
    const cursor = isDisabled ? "not-allowed" : "pointer";
    
    btnDelete.style.opacity = opacity;
    btnDelete.style.cursor = cursor;
    btnCancel.style.opacity = opacity;
    btnCancel.style.cursor = cursor;
}

// ==========================================
// 2 & 3. HÀM POST (THÊM) VÀ PUT (SỬA)
// ==========================================
async function handleSaveLLM() {
    const id = document.getElementById('form_id').value;
    
    const payload = {
        provider: document.getElementById('form_provider').value,
        base_url: document.getElementById('form_base_url').value,
        api_key: document.getElementById('form_api_key').value,
        model_name: document.getElementById('form_model_name').value,
        user_id: apiClient.getUserId()
    };

    if (!payload.provider || !payload.model_name) {
        alert(mnI18n.t('llm.enter_required_alert'));
        return;
    }

    let result;
    if (id) {
        result = await apiClient.apiPut(`/llms/${id}`, payload);
    } else {
        result = await apiClient.apiPost(`/llms`, payload);
    }

    if (result) {
        alert(id ? mnI18n.t('llm.update_success') : mnI18n.t('llm.save_success'));
        cancelEdit(); 
        loadLLMs();   
    }
}

// ==========================================
// 4. HÀM PUT: KÍCH HOẠT MÔ HÌNH
// ==========================================
async function activateLLM(event, llmId) {
    event.stopPropagation();
    const user_id = apiClient.getUserId()
    const result = await apiClient.apiPut(`/llms/${user_id}/active/${llmId}`, {});
    if (result) {
        loadLLMs(); 
    }
}

// ==========================================
// 5. HÀM DELETE: XÓA MÔ HÌNH
// ==========================================
async function handleDeleteLLM() {
    const id = document.getElementById('form_id').value;
    if (!id) return;

    if (!confirm(mnI18n.t('llm.delete_confirm'))) return;

    const result = await apiClient.apiDelete(`/llms/${id}`);
    if (result) {
        cancelEdit();
        loadLLMs();
    }
}

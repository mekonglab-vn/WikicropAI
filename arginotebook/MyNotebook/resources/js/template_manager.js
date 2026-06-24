// ==========================================
// 1. SAFE INITIALIZATION IN MEDIAWIKI
// ==========================================
function initTemplateManager() {
    const listContainer = document.getElementById('template-list-container');
    if (!listContainer) return; // Exit if this is not the Template page


    // Attach events to buttons
    document.getElementById('btn_add_section').addEventListener('click', () => addTemplateSection());
    document.getElementById('btn_save_template').addEventListener('click', handleSaveTemplate);
    document.getElementById('btn_delete_template').addEventListener('click', handleDeleteTemplate);
    document.getElementById('btn_cancel_template').addEventListener('click', cancelTemplateEdit);
    document.getElementById('btn_go_back').addEventListener('click', function() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = mw.util.getUrl('Special:MyNotebook');
    }
    });

    // Create one empty item by default when entering the page
    addTemplateSection();
    
    // Load list
    loadTemplates();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTemplateManager);
} else {
    initTemplateManager();
}

// ==========================================
// 2. FUNCTIONS FOR MANAGING DYNAMIC ITEMS (DYNAMIC FORM)
// ==========================================
function addTemplateSection(titleVal = '', descVal = '') {
    const container = document.getElementById('prompt_structure_container');
    
    // Create a wrapper block for one item
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'template-section-item';
    sectionDiv.style.cssText = "background: #ffffff; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; position: relative;";
    
    // Button to delete this item
    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '✕';
    removeBtn.style.cssText = "position: absolute; top: 5px; right: 5px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; font-size: 10px; display: flex; align-items: center; justify-content: center;";
    removeBtn.onclick = function() {
        container.removeChild(sectionDiv);
    };

    // Content: Title and description
    const contentHtml = `
        <div style="margin-bottom: 8px;">
            <input type="text" class="section-title" placeholder="${mnI18n.t('template.title_placeholder')}" value="${titleVal}" style="width: 90%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px;">
        </div>
        <div>
            <textarea class="section-desc" placeholder="${mnI18n.t('template.description_placeholder')}" rows="2" style="width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box; resize: vertical;">${descVal}</textarea>
        </div>
    `;
    
    sectionDiv.innerHTML = contentHtml;
    sectionDiv.appendChild(removeBtn);
    container.appendChild(sectionDiv);
}

// Scan the entire form and collect it into a JSON array
function getPromptStructureData() {
    const sections = document.querySelectorAll('.template-section-item');
    let structureArray = [];
    
    sections.forEach(section => {
        const title = section.querySelector('.section-title').value.trim();
        const desc = section.querySelector('.section-desc').value.trim();
        
        // Only get items with a title entered
        if (title !== '') {
            structureArray.push({ title: title, description: desc });
        }
    });
    
    return structureArray;
}

// ==========================================
// 3. API AND UI LOGIC (STATE)
// ==========================================

window.allTemplates = [];

// Global variable to store the original list
window.allTemplates = [];

async function loadTemplates() {
    const listContainer = document.getElementById('template-list-container');
    listContainer.innerHTML = `<p style='color: #666;'><i class='fas fa-spinner fa-spin'></i> ${mnI18n.t('template.loading')}</p>`;

    const userId = apiClient.getUserId();
    const data = await apiClient.apiGet(`/templates/${userId}`);

    if (!data) {
        listContainer.innerHTML = `<p style='color: red;'>${mnI18n.t('template.error_loading_list')}</p>`;
        return;
    }

    // Save data to the global variable for the filter function later
    window.allTemplates = data; 
    
    // Call the render function for the first display
    renderTemplates(window.allTemplates);
}

// Helper function: Render the Template list on screen
function renderTemplates(templates) {
    const listContainer = document.getElementById('template-list-container');
    listContainer.innerHTML = "";

    if (templates.length === 0) {
        listContainer.innerHTML = `<p style='color: #64748b; font-style: italic; padding: 10px;'>${mnI18n.t('template.no_match')}</p>`;
        return;
    }

    templates.forEach(tpl => {
        const div = document.createElement('div');
        div.style.cssText = "border: 1px solid #e2e8f0; padding: 12px; margin-bottom: 10px; border-radius: 6px; cursor: pointer; background: #f8fafc; transition: background 0.2s;";
        
        div.onmouseover = () => div.style.background = "#e2e8f0";
        div.onmouseout = () => div.style.background = "#f8fafc";
        
        const sectionCount = Array.isArray(tpl.prompt_structure) ? tpl.prompt_structure.length : 0;

        div.innerHTML = `
            <strong style='font-size: 15px; color: #0f172a;'>${tpl.name}</strong><br>
            <span style='font-size: 13px; color: #64748b;'>${mnI18n.t('template.items_included', { count: sectionCount })}</span>
        `;

        div.onclick = () => selectTemplate(tpl);
        listContainer.appendChild(div);
    });
}

// Search handler function (Triggered whenever a key is typed)
function filterTemplates() {
    const keyword = document.getElementById('search_input').value.toLowerCase().trim();
    
    // Filter the data array based on the template name
    const filtered = window.allTemplates.filter(tpl => 
        tpl.name.toLowerCase().includes(keyword)
    );

    // Re-render the filtered list
    renderTemplates(filtered);
}

function selectTemplate(tpl) {
    document.getElementById('form_template_id').value = tpl.id;
    document.getElementById('form_template_name').value = tpl.name;

    // Clear the current item list
    const container = document.getElementById('prompt_structure_container');
    container.innerHTML = '';

    // Populate small forms from the JSON array
    if (Array.isArray(tpl.prompt_structure) && tpl.prompt_structure.length > 0) {
        tpl.prompt_structure.forEach(item => {
            addTemplateSection(item.title, item.description);
        });
    } else {
        // If there are no items, create one empty item
        addTemplateSection();
    }

    // Change the UI state to "Edit"
    document.getElementById('form-title').innerText = mnI18n.t('template.update_title', { name: tpl.name });
    document.getElementById('btn_save_template').innerText = mnI18n.t('template.update_button');
    toggleTemplateButtons(false);
}

function cancelTemplateEdit() {
    document.getElementById('form_template_id').value = '';
    document.getElementById('form_template_name').value = '';

    // Restore one single empty item
    const container = document.getElementById('prompt_structure_container');
    container.innerHTML = '';
    addTemplateSection();

    document.getElementById('form-title').innerText = mnI18n.t('template.create_title');
    document.getElementById('btn_save_template').innerText = mnI18n.t('template.add_button');
    toggleTemplateButtons(true);
}

function toggleTemplateButtons(isDisabled) {
    const btnDelete = document.getElementById('btn_delete_template');
    const btnCancel = document.getElementById('btn_cancel_template');
    
    btnDelete.disabled = isDisabled;
    btnCancel.disabled = isDisabled;
    
    btnDelete.style.opacity = isDisabled ? "0.5" : "1";
    btnDelete.style.cursor = isDisabled ? "not-allowed" : "pointer";
    btnCancel.style.opacity = isDisabled ? "0.5" : "1";
    btnCancel.style.cursor = isDisabled ? "not-allowed" : "pointer";
}

// ==========================================
// 4. SAVE (ADD / EDIT)
// ==========================================
async function handleSaveTemplate() {
    const id = document.getElementById('form_template_id').value;
    const name = document.getElementById('form_template_name').value.trim();
    
    // Call the function that collects JSON data
    const structureData = getPromptStructureData();

    if (name === '') {
        alert(mnI18n.t('template.enter_name_alert'));
        return;
    }

    if (structureData.length === 0) {
        alert(mnI18n.t('template.enter_title_alert'));
        return;
    }

    const payload = {
        name: name,
        prompt_structure: structureData,
        user_id: apiClient.getUserId()
    };

    let result;
    if (id) {
        // API PUT (Edit) - This is currently a placeholder; you can call the backend when ready
        result = await apiClient.apiPut(`/templates/${id}`, payload);
        if (!result) {
            alert(mnI18n.t('template.update_failed'));
        }
        else {
            alert(mnI18n.t('template.save_updated_success'));
        }
        return;
    } else {
        // API POST (Add new)
        result = await apiClient.apiPost(`/templates`, payload);
    }

    if (result) {
        alert(id ? mnI18n.t('template.save_updated_success') : mnI18n.t('template.save_success'));
        cancelTemplateEdit(); 
        loadTemplates();   
    }
}

// Placeholder for Delete
async function handleDeleteTemplate() {
    const id = document.getElementById('form_template_id').value;
    if (!id) return;

    if (!confirm(mnI18n.t('template.delete_confirm'))) return;
    
    const result = await apiClient.apiDelete(`/templates/${id}`);
    if (result) { 
        alert(mnI18n.t('template.delete_success'));
        cancelTemplateEdit(); loadTemplates(); }
}

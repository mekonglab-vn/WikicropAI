// ==========================================
// 1. SAFE INITIALIZATION IN MEDIAWIKI
// ==========================================
function initDashboard() {
    const gridContainer = document.getElementById('notebook-grid');
    if (!gridContainer) return; 

    const langToggle = document.getElementById('ws_lang_toggle');
    if (langToggle) {
        langToggle.addEventListener('click', toggleDashboardLanguage);
    }

    loadNotebooks();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboard);
} else {
    initDashboard();
}

// ==========================================
// 2. LOAD NOTEBOOK LIST
// ==========================================
async function loadNotebooks() {
    const gridContainer = document.getElementById('notebook-grid');
    const userId = apiClient.getUserId();
    const specialPageUrl = mw.config.get('MyNotebookBaseUrl');

    // 1. Get data from FastAPI
    const notebooks = await apiClient.apiGet(`/notebooks/user/${userId}`);

    if (!notebooks) {
        gridContainer.innerHTML = `<p style='color: red;'>${mnI18n.t('dashboard.error_connection')}</p>`;
        return;
    }

    gridContainer.innerHTML = ""; // Clear the "Loading..." text

    // 2. The "Create new" button is also restyled with a white tone/gray border
    const createNode = document.createElement('div');
    createNode.style.cssText = "border: 2px dashed #7F7F7F; border-radius: 12px; min-height: 140px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; background: #ffffff; transition: all 0.2s; box-sizing: border-box;";
    createNode.innerHTML = `
        <div style='font-size: 36px; color: #187A35; margin-bottom: 8px; line-height: 1;'><i class="fas fa-plus-circle"></i></div>
        <div style='color: #7F7F7F; font-weight: bold; font-size: 14px;'>${mnI18n.t('dashboard.create_notebook')}</div>
    `;
    createNode.onmouseover = () => { createNode.style.borderColor = "#187A35"; createNode.style.boxShadow = "0 4px 10px rgba(43,127,255,0.1)"; };
    createNode.onmouseout = () => { createNode.style.borderColor = "#7F7F7F"; createNode.style.boxShadow = "none"; };
    createNode.onclick = createNewNotebook;
    gridContainer.appendChild(createNode);

    // 3. Render existing notebook nodes
    notebooks.forEach(nb => {
        const nbCard = document.createElement('a');
        nbCard.href = `${specialPageUrl}?action=workspace&id=${nb.id}`;
        
        // CSS Card: White background, dark gray border #7F7F7F
        nbCard.style.cssText = `border: 1px solid #7F7F7F; border-radius: 12px; min-height: 140px; padding: 20px; cursor: pointer; background: #ffffff; text-decoration: none; display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; box-sizing: border-box;`;
        
        // Hover effect lifts the card and highlights the green border
        nbCard.onmouseover = () => { nbCard.style.transform = "translateY(-4px)"; nbCard.style.boxShadow = "0 6px 15px rgba(0,0,0,0.08)"; nbCard.style.borderColor = "#187A35"; };
        nbCard.onmouseout = () => { nbCard.style.transform = "translateY(0)"; nbCard.style.boxShadow = "none"; nbCard.style.borderColor = "#7F7F7F"; };

        const dateStr = new Date(nb.created_at).toLocaleDateString('vi-VN');
        const sourceCount = (nb.sources && Array.isArray(nb.sources)) ? nb.sources.length : 0;

        nbCard.innerHTML = `
            <div style='display: flex; align-items: center; margin-bottom: 15px;'>
            
                <div style='background: #187A35; color: #ffffff; padding: 3px 12px; border-radius: 20px; font-size: 13px; font-weight: bold;'>
                    ${mnI18n.t('dashboard.sources_count', { count: sourceCount })}
                </div>
                
                <div style='margin-left: auto; font-size: 13px; color: #7F7F7F; font-weight: 600;'>
                    ${dateStr}
                </div>
                <i class='fas fa-file-alt' style='color: #187A35; font-size: 20px; margin-left: 12px;'></i>
            </div>
            <div style='flex: 1;'>
                <h3 style='margin: 0; font-size: 18px; color: #1e293b; font-weight: bold; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;'>${nb.name}</h3>
            </div>
            
            
        `;

        gridContainer.appendChild(nbCard);
    });
}

// ==========================================
// 3. CREATE NEW NOTEBOOK
// ==========================================
async function createNewNotebook() {
    const name = prompt(mnI18n.t('dashboard.prompt_new_notebook'));
    
    // If the user clicks Cancel or leaves it blank
    if (!name || name.trim() === "") return;

    const payload = {
        name: name.trim(),
        user_id: apiClient.getUserId()
    };

    // Assume your notebook creation API is POST /notebooks/
    const result = await apiClient.apiPost(`/notebooks/`, payload);

    if (result) {
        // Created successfully -> reload the list to show the new notebook
        loadNotebooks();
    }
}

function toggleDashboardLanguage() {
    const currentLang = (mw.config.get('MyNotebookLang') || 'en').toLowerCase();
    const nextLang = currentLang === 'vi' ? 'en' : 'vi';

    document.cookie = `mn_lang=${nextLang}; path=/; max-age=31536000`;

    const url = new URL(window.location.href);
    url.searchParams.set('lang', nextLang);
    window.location.href = url.toString();
}

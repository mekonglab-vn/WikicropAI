// Tạo một object toàn cục để các file khác (như llm_manager.js) có thể gọi
const apiClient = {
    
    // ==========================================
    // 1. QUẢN LÝ USER ID (LocalStorage)
    // ==========================================
    initUserId: function(defaultId = 0) {
        // Chỉ cài đặt nếu chưa có, tránh ghi đè dữ liệu cũ
        if (!localStorage.getItem('mn_user_id')) {
            localStorage.setItem('mn_user_id', defaultId);
            console.log("Initialized User ID in LocalStorage:", defaultId);
        }
    },

    getUserId: function() {
        const mwUserId = mw.config.get('wgUserId');
        
        // Nếu đã đăng nhập, mwUserId sẽ là số > 0
        if (mwUserId && mwUserId > 0) {
            return mwUserId;
        }
        
        // Nếu chưa đăng nhập (Khách), trả về 0 hoặc xử lý chuyển hướng đăng nhập tùy bạn
        return 0;
    },

    // ==========================================
    // 2. CẤU HÌNH API
    // ==========================================
    // Lấy URL từ PHP truyền sang. Nếu lỗi thì fallback về localhost
    getBaseUrl: function() {
        return mw.config.get('MyNotebookApiUrl') || 'http://localhost:8000/api/v1';
    },

    // Hàm gọi API cốt lõi dùng chung
    _fetchAPI: async function(endpoint, method, data = null) {
        const url = this.getBaseUrl() + endpoint;
        const options = {
            method: method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            
            // Xử lý lỗi HTTP (VD: 400, 404, 500)
            if (!response.ok) {
                const errorData = await response.json();
                const errorMsg = errorData.detail || mnI18n.t('api.error_server', { status: response.status });
                throw new Error(errorMsg);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`[API Error] ${method} ${endpoint}:`, error.message);
            // Could use a Toast library for nicer errors, using alert for now
            alert(mnI18n.t('common.error_prefix') + error.message); 
            return null; // Trả về null để file gọi dễ dàng check IF
        }
    },

    // ==========================================
    // 3. CÁC PHƯƠNG THỨC GIAO TIẾP SẴN SÀNG SỬ DỤNG
    // ==========================================
    apiGet: async function(endpoint) {
        return await this._fetchAPI(endpoint, 'GET');
    },

    apiPost: async function(endpoint, data) {
        return await this._fetchAPI(endpoint, 'POST', data);
    },

    apiPut: async function(endpoint, data) {
        return await this._fetchAPI(endpoint, 'PUT', data);
    },

    apiDelete: async function(endpoint) {
        return await this._fetchAPI(endpoint, 'DELETE');
    }
};

// Auto-run the user_id=0 initialization as soon as this file loads
// This is the easiest way to avoid adding extra script to PHP
apiClient.initUserId(0);

const formatTime = (totalSeconds) => {
    const s = Math.floor(totalSeconds ?? 0);
    const minutes = Math.floor(s / 60);
    const seconds = s % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

extensions/MyNotebook/
│
├── extension.json               # Cấu hình nạp file của MediaWiki
│
├── src/                         # Chứa logic PHP (Backend của UI)
│   ├── SpecialMyNotebook.php    # Đóng vai trò Router (Chỉ làm nhiệm vụ chuyển hướng)
│   └── Pages/                   # Thư mục mới chứa giao diện từng trang
│       ├── DashboardPage.php    # Hàm vẽ HTML cho Dashboard
│       ├── WorkspacePage.php    # Hàm vẽ HTML cho Workspace
│       └── LLMManagerPage.php   # Hàm vẽ HTML cho Cấu hình LLM
│
└── resources/                   # Chứa tài nguyên tĩnh (Frontend)
    ├── css/
    │   └── ext.myNotebook.css   # File CSS định dạng giao diện
    │
    └── js/                      # Thư mục mới chia nhỏ logic Javascript
        ├── api_client.js        # File chuyên cấu hình axios/fetch gọi localhost:8000
        ├── dashboard.js         # Logic riêng cho Dashboard
        └── workspace.js         # Logic riêng cho Workspace (Upload file, gọi AI viết bài)
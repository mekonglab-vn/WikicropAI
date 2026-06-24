1. Thông tin chung
Đây là thư mục đảm nhận nhiệm vụ backend cho Wikicrop

Chạy lệnh sau để cài đặt những thư viện cần thiết
pip install -r requirements.txt 

Tham khảo tài liệu HuongDanCaiDat_WikiNotebook.pdf ở thư mục gốc để biết thêm về cách cài đặt


2. Cấu trúc thư mục
arginotebook_be/
│
├── api.py                 # File chạy chính (Khởi tạo FastAPI app)
│
├── routers/               # Tầng Route (Endpoint): Chỉ nhận Request và trả về Response
│   ├── notebooks.py       # Các API quản lý sổ tay: thông tin nguồn, sổ tay
│   ├── contents.py        # Các API quản lý bài viết: thông tin bài viết, chunks,...
│   └── generate.py        # API kích hoạt quá trình viết bài
│
├── services/              # Tầng Logic (Controller/Service): Trái tim của hệ thống
│   └── ai_generation.py   # Ghép nối data từ MySQL, gọi VectorDB và LLM
│
├── databases/             # Tầng Database (CRUD): Chỉ chứa các lệnh thao tác MySQL
│   ├── crud_notebook.py   # Lệnh SELECT, INSERT, UPDATE cho bảng notebooks
│   └── connection.py      # Cấu hình kết nối MySQL (SQLAlchemy/PyMySQL)
│
├── schemas/               # Tầng Pydantic: Khai báo format dữ liệu vào/ra (để validate)
│
└── ai_core/               # Tầng Model AI
    ├── preprocessor.py    # Chunking, Embedding, lưu ChromaDB
    ├── wiki_composer.py   # Agent viết bài, RAG logic
    ├── llm_engine.py      # Giao tiếp với LLM API
    └── extractor.py       # Trích xuất PDF, web, youtube


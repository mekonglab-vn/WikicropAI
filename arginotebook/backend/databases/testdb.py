from databases.connection import engine, Base
# Bắt buộc phải import các models để SQLAlchemy nhận diện được cấu trúc
from databases.models import LLMConfig, Notebook, Source, SourceChunk, Template, Article, Citation

def init_db():
    print("Đang kết nối đến MySQL và kiểm tra cấu trúc bảng...")
    try:
        # Lệnh này sẽ tự động tạo bảng nếu nó chưa có trong database wiki_local
        Base.metadata.create_all(bind=engine)
        print("Thành công! Toàn bộ các bảng đã được khởi tạo trong database 'wiki_local'.")
    except Exception as e:
        print("Lỗi kết nối hoặc tạo bảng:")
        print(e)

if __name__ == "__main__":
    init_db()
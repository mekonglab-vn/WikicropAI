from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
# Import hàm init_db từ file của bạn
from databases.testdb import init_db
from routers import llms, notebooks, content, generate

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Hành động khi ứng dụng bắt đầu: Khởi tạo DB/Tạo bảng
    init_db()
    yield
    # Hành động khi ứng dụng tắt (nếu cần)

app = FastAPI(title="WikiCrop AI Writing API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(llms.router)
app.include_router(notebooks.router)
app.include_router(content.router)
app.include_router(generate.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
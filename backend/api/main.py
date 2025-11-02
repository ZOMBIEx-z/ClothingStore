from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Clothing Store API",
    # description="",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Clothing Store API is running", "version": "1.0.0"}


def main():
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
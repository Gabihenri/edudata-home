from fastapi import FastAPI

app = FastAPI(
    title="EduData IA API",
    version="1.0.0"
)

@app.get("/")
def root():
    return {
        "plataforma": "EduData IA",
        "status": "online",
        "versao": "1.0.0"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }

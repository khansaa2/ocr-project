import os
import tempfile
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware


from paddletest import process_invoice, process_pdf

app = FastAPI(title="Invoice OCR API", version="1.0.0")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",  
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/process-invoice")
async def process_invoice_api(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[-1].lower()
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(await file.read())
    tmp.close()

    try:
        if suffix == ".pdf":
            results = process_pdf(tmp.name)
        else:
            results = process_invoice(tmp.name)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
    finally:
        os.unlink(tmp.name)

    return JSONResponse(content=results)
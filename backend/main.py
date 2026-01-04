from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_db_and_tables, get_session
from services import load_initial_data, load_coicop_data
from api import router
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    from sqlmodel import Session
    from database import engine
    with Session(engine) as session:
        load_coicop_data(session)
        load_initial_data(session)
    print("Startup complete")
    yield

app = FastAPI(title="COICOP Validation System", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "System Operational"}

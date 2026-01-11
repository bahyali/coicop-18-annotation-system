from sqlmodel import SQLModel, create_engine, Session
from pathlib import Path

# Store database in /app/data directory for persistent volume
data_dir = Path("/app/data")
data_dir.mkdir(exist_ok=True)

sqlite_file_name = data_dir / "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

engine = create_engine(sqlite_url, echo=False)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

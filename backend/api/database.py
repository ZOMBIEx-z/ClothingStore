from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Создаем подключение к SQLite. Файл 'sql_app.db' будет создан в корне
SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

# connect_args нужен только для SQLite, чтобы разрешить многопоточные запросы
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Создаем класс SessionLocal, который будет использоваться для создания сессий
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовый класс для моделей SQLAlchemy
Base = declarative_base()

# Dependency для получения сессии БД в роутерах
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
"""
Database initialization script.
Used to create database tables.
"""
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from app.core.database import Base
from app.models import (
    User,
    Job,
    Resource,
    Conversation,
    Message,
    CustomerServiceMessage,
    KnowledgeBase,
    ChatMemory,
    CustomerServiceKnowledge,
    CustomerServiceMemory,
    ResearchDemand,
    TechnicalBarrier,
    ResearchAchievement,
    CooperationProject,
    InquiryRecord,
    InnovationDynamics
)
from app.core.config import settings
import sys
import io

# Fix Windows console encoding issue
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Parse database URL to get database name
DATABASE_URL = settings.DATABASE_URL
DB_NAME = DATABASE_URL.split('/')[-1]  # Extract database name
BASE_URL = '/'.join(DATABASE_URL.split('/')[:-1])  # URL without database name


def create_database():
    """Create database if it doesn't exist"""
    engine = create_engine(BASE_URL, pool_pre_ping=True)
    try:
        with engine.connect() as conn:
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
            print(f"[OK] Database '{DB_NAME}' created successfully")
    except Exception as e:
        print(f"[ERROR] Failed to create database: {e}")
        return False
    finally:
        engine.dispose()
    return True


def create_tables():
    """Create all tables"""
    from app.core.database import engine

    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("\n[OK] Database tables created successfully")
        print("\nCreated tables:")
        for table_name in Base.metadata.tables.keys():
            print(f"  - {table_name}")
        return True
    except Exception as e:
        print(f"\n[ERROR] Failed to create tables: {e}")
        return False


def verify_tables():
    """Verify tables are created successfully"""
    from app.core.database import engine

    try:
        with engine.connect() as conn:
            result = conn.execute(text(f"SHOW TABLES FROM `{DB_NAME}`"))
            tables = [row[0] for row in result]
            print(f"\n[OK] Tables in database '{DB_NAME}':")
            for table in tables:
                print(f"  - {table}")
            return len(tables) > 0
    except Exception as e:
        print(f"\n[ERROR] Failed to verify tables: {e}")
        return False


def main():
    """Main function"""
    print("=" * 60)
    print("Industry-Academia Platform Database Initialization")
    print("=" * 60)

    # 1. Create database
    print(f"\n[1/3] Creating database '{DB_NAME}'...")
    if not create_database():
        print("\nDatabase creation failed, please check configuration and permissions")
        return

    # 2. Create tables
    print("\n[2/3] Creating tables...")
    if not create_tables():
        print("\nTable creation failed, please check configuration")
        return

    # 3. Verify tables
    print("\n[3/3] Verifying tables...")
    verify_tables()

    print("\n" + "=" * 60)
    print("Database initialization completed!")
    print("=" * 60)


if __name__ == "__main__":
    main()

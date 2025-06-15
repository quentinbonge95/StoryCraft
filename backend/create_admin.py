import sys
import os
from pathlib import Path
from datetime import datetime
from sqlalchemy.orm import Session

# Add the backend directory to the Python path
sys.path.append(str(Path(__file__).parent))

from app.database import SessionLocal, engine, Base
from app.models import User
from app.core.security import get_password_hash

# Create database tables if they don't exist
Base.metadata.create_all(bind=engine)

def create_admin_user(email: str, password: str, full_name: str = "Admin User"):
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin = db.query(User).filter(User.email == email).first()
        if admin:
            print(f"Admin user with email {email} already exists.")
            return admin

        # Create new admin user
        admin = User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            is_active=True,
            is_superuser=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"Created admin user with email: {email}")
        return admin
    except Exception as e:
        db.rollback()
        print(f"Error creating admin user: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    email = "Admin@example.com"
    password = "Afp0910!"
    create_admin_user(email, password)

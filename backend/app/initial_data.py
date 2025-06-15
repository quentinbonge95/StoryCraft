import logging
import sys
from typing import Any, Dict, List

from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.core.config import settings
from app.db import base  # noqa: F401
from app.db.session import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_db(db: Session) -> None:
    # Tables should be created with Alembic migrations
    # But if you don't want to use migrations, create
    # the tables un-commenting the next line
    # Base.metadata.create_all(bind=engine)

    user = crud.user.get_by_email(db, email=settings.FIRST_SUPERUSER_EMAIL)
    if not user:
        user_in = schemas.UserCreate(
            email=settings.FIRST_SUPERUSER_EMAIL,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = crud.user.create(db, obj_in=user_in)  # noqa: F841
        logger.info(f"Created superuser {settings.FIRST_SUPERUSER_EMAIL}")
    else:
        logger.info(f"Superuser {settings.FIRST_SUPERUSER_EMAIL} already exists")


def main() -> None:
    logger.info("Creating initial data")
    db = SessionLocal()
    try:
        init_db(db)
    except Exception as e:
        logger.error(f"Error creating initial data: {e}")
        sys.exit(1)
    finally:
        db.close()
    logger.info("Initial data created")


if __name__ == "__main__":
    main()

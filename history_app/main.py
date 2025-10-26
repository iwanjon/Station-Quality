from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from models.models import Base
from databases.database import engine
from routers import stasiun, stasiun_history
from contextlib import asynccontextmanager
from configs.logging_config import setup_logging  # Import the setup function
import logging
from middlewares.error_handler import log_unhandled_exceptions

logger = logging.getLogger("station_history")



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup logging when the application starts
    setup_logging()
    logger.info("Logging configured and application starting up.")
    yield
    # Any cleanup can go here
    logger.info("Application shutting down.")

app = FastAPI(lifespan=lifespan)
# app = FastAPI()

# Base.metadata.create_all(bind=engine)
app.middleware("http")(log_unhandled_exceptions)


@app.get("/healthy")
def health_check(request:Request):
    logger.info("Root endpoint was called.")
    logger.error("Root error")

    return {'status': 'Healthy'}



app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(stasiun.router)
app.include_router(stasiun_history.router)

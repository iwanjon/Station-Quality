from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from models.models import Base
from databases.database import engine
from routers import stasiun, stasiun_history

app = FastAPI()

# Base.metadata.create_all(bind=engine)


@app.get("/healthy")
def health_check(request:Request):

    return {'status': 'Healthy'}



app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(stasiun.router)
app.include_router(stasiun_history.router)

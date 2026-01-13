# from typing import Annotated
from pydantic import BaseModel, Field
# from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Path
from starlette import status
from core.save_to_db import get_station_location
from models.models import  Stasiun
from databases.database import db_dependency
import logging

from schemas.schemas import StasiunBase
log = logging.getLogger("station_history")

router = APIRouter()


# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()


# db_dependency = Annotated[Session, Depends(get_db)]
# user_dependency = Annotated[dict, Depends(get_current_user)]


class TodoRequest(BaseModel):
    title: str = Field(min_length=3)
    description: str = Field(min_length=3, max_length=100)
    priority: int = Field(gt=0, lt=6)
    complete: bool




@router.get("/stasiun/{stasiun_code}", status_code=status.HTTP_200_OK)
async def read_todo(db: db_dependency, stasiun_code:str):

    todo_model = db.query(Stasiun).filter(Stasiun.kode_stasiun == stasiun_code).first()
    
    if todo_model is not None:
        return todo_model
    raise HTTPException(status_code=404, detail='Todo not found.')






@router.put("/stasiun_location/{stasiun_code}", status_code=status.HTTP_200_OK, response_model=StasiunBase)
async def updatestationlocation( db: db_dependency,
                      stasiun_code: str)-> Stasiun:
    # if user is None:
    #     raise HTTPException(status_code=401, detail='Authentication Failed')
    stasiun:Stasiun|None = db.query(Stasiun).filter(Stasiun.kode_stasiun == stasiun_code).first()
    
    if not stasiun :
        raise HTTPException(status_code=404, detail='Stasiun not found.')
    
    
    log.info("station_data: {}".format(stasiun.__dict__))
    
    station_location = get_station_location(stasiun_code)

    log.info("station_location: {}".format(station_location))
    
    stasiun.lintang = station_location[0]
    stasiun.bujur = station_location[1]
    stasiun.elevasi = station_location[2]
    
  
            
    db.add(stasiun)
    db.flush()
    db.commit()
    log.info("station location {} updated".format(stasiun_code))
    
    # from pdb import set_trace as sstt
    # sstt()
    return stasiun









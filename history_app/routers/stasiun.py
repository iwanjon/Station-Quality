# from typing import Annotated
from pydantic import BaseModel, Field
# from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Path
from starlette import status
from core.save_to_db import get_station_history, get_station_location
from models.models import  Stasiun
from databases.database import db_dependency
import logging
from pdb import set_trace as sstt

from typing import List




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







class SeismicStation(BaseModel):
    ip_address: str
    network: str
    station_code: str
    location_code: str
    channel_group: str
    channel_type: str
    latitude: float
    longitude: float
    stage: str
    datalogger: str
    sensor_bb: str
    sensor_acc: str

# Simulated DB update function
def update_station_in_db(db: db_dependency, station: SeismicStation):
    stasiun:Stasiun|None = db.query(Stasiun).filter(Stasiun.kode_stasiun == station.station_code).first()
    if stasiun:
        stasiun.digitizer_komunikasi = station.datalogger
        db.add(stasiun)
        # db.flush()
        # db.commit()
    # In a real app, you would use SQLAlchemy or Motor here
    # Example: db.stations.update_one({"station_code": station.station_code}, {"$set": station.dict()})
    # print(f"DB Update: {station.station_code} ({station.datalogger}) saved.")
        log.info("station {} with digitizer {} updated".format(station.station_code,station.datalogger ))
        return True
    
    log.warning("not found station {} with digitizer {}".format(station.station_code,station.datalogger ))
    return False

@router.put("/stations/process")
async def process_stations(db: db_dependency, stations: List[SeismicStation]):
    success_stations = []
    failed_stations = []

    for station in stations:
        try:
            # Attempt to update the database
            is_updated = update_station_in_db(db, station)
            
            if is_updated:
                # Add to success list if successful
                success_stations.append({
                    "station_code": station.station_code,
                    "ip_address": station.ip_address,
                    "status": "updated"
                })
            else:
                failed_stations.append({
                    "station_code": station.station_code,
                    "ip_address": station.ip_address,
                    "status": "not found"
                })
                
        except Exception as e:
            # Track failures without stopping the whole process
            failed_stations.append({
                "station_code": station.station_code,
                "error": str(e)
            })
    db.flush()
    db.commit()
    # Return the list of stations that were successfully processed
    return {
        "message": "Processing complete",
        "processed_count": len(success_stations),
        "successful_stations": success_stations,
        "failed_count": len(failed_stations),
        "failures": failed_stations
    }
    

@router.put("/stations/status/accelero/{stasiun_code}")
async def update_status_acc(db: db_dependency,
                      stasiun_code: str):
    success_stations = []
    failed_stations = []
    stasiun_data = get_station_history(stasiun_code,False)
    
    
    stasiun:Stasiun|None = db.query(Stasiun).filter(Stasiun.kode_stasiun == stasiun_code).first()
    if not stasiun:
        return {
            "message": "not found station",
            "status": "not processed",
            "stasiun": stasiun_code,
            }
        
    for i in stasiun_data:
        # sstt()
        if i[1].startswith("HN") and i[8]:
            stasiun.accelerometer = "installed"
            db.add(stasiun)
            db.commit()
            return {
                "message": "accelerometer status updated",
                "status": "installed",
                "stasiun": stasiun_code,
            }
    
    stasiun.accelerometer = "not_installed"
    db.add(stasiun)
    db.commit()
    return {
            "message": "accelerometer status updated",
            "status": "not installed",
            "stasiun": stasiun_code,
            }
    
            
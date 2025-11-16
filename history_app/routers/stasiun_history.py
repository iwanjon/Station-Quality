# # from typing import Annotated
from pydantic import BaseModel, Field
# from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Path
from starlette import status
from models.models import StasiunHistory, Stasiun
from databases.database import db_dependency
from core.save_to_db import get_station_history
import json
import logging

log = logging.getLogger("station_history")

router = APIRouter()


# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()


# db_dependency = Annotated[Session, Depends(get_db)]




def encode_complex_pairs(obj):
    if isinstance(obj, complex):
        return {"__type__": "complex", "re": float(obj.real), "im": float(obj.imag)}
    raise TypeError(f"Not JSON-serializable: {type(obj).__name__}")

def decode_complex_pairs(d):
    if isinstance(d, dict) and d.get("__type__") == "complex":
        return complex(d["re"], d["im"])
    return d

class TodoRequest(BaseModel):
    title: str = Field(min_length=3)
    description: str = Field(min_length=3, max_length=100)
    priority: int = Field(gt=0, lt=6)
    complete: bool




@router.get("/stasiun_history/{stasiun_code}", status_code=status.HTTP_200_OK)
async def getstationhistory(db: db_dependency, stasiun_code:str):

    stasiun:Stasiun|None = db.query(Stasiun).filter(Stasiun.kode_stasiun == stasiun_code).first()

    
    if not stasiun :
        raise HTTPException(status_code=404, detail='Stasiun not found.')
    
    log.info(stasiun.__dict__)
    
    stasiun_hist = db.query(StasiunHistory).filter(StasiunHistory.stasiun_id == stasiun.stasiun_id).all()
    
    if len(stasiun_hist) > 0:
        return stasiun_hist
    raise HTTPException(status_code=404, detail='stasiun history not found.')





@router.put("/stasiun_history/{stasiun_code}", status_code=status.HTTP_204_NO_CONTENT)
async def updatestationhistory( db: db_dependency,
                      stasiun_code: str):
    # if user is None:
    #     raise HTTPException(status_code=401, detail='Authentication Failed')
    stasiun:Stasiun|None = db.query(Stasiun).filter(Stasiun.kode_stasiun == stasiun_code).first()
    
    if not stasiun :
        raise HTTPException(status_code=404, detail='Stasiun not found.')
    
    if stasiun_code != "AAFM":
        stasiun2:Stasiun|None = db.query(Stasiun).filter(Stasiun.kode_stasiun == "AAFM").first()
        if not stasiun2 :
            log.info("AAFM IS DISSAPIER")
            log.info(stasiun.kode_stasiun)
    
    log.info("station_data: {}".format(stasiun.__dict__))
    
    history_data = get_station_history(stasiun_code,True)

    log.info("history_data: {}".format(history_data))
    
    for ind, i in enumerate(history_data):
        exist_history:StasiunHistory|None = db.query(StasiunHistory).filter(StasiunHistory.sensor_name == i[2], StasiunHistory.digitizer_name == i[3], StasiunHistory.start_date == i[6], StasiunHistory.channel==i[1]).first()
        dumps13 = json.dumps(i[13], default=encode_complex_pairs, ensure_ascii=False)
        # loads13 = json.loads(dumps13, object_hook=decode_complex_pairs)
        loads13 = json.loads(dumps13)
        print(ind)
     
        if not exist_history:
            new_hist = StasiunHistory()
            
            new_hist.stasiun_id = stasiun.stasiun_id
            new_hist.channel = i[1]
            new_hist.sensor_name = i[2]
            new_hist.digitizer_name = i[3]
            new_hist.total_gain = i[4]
            new_hist.input_unit = i[5]
            new_hist.start_date = i[6].datetime
            new_hist.end_date = i[7].datetime if i[7] else None
            new_hist.status = i[8]
            new_hist.latitude = i[9]
            new_hist.longitude = i[10]
            new_hist.elevation = i[11]
            new_hist.sampling_rate = i[12]
            new_hist.paz = loads13
            new_hist.response_path = i[14]
            
            db.add(new_hist)
            db.flush()
            # db.commit()
        # elif exist_history.end_date != i[7]:
        else:
            exist_history.stasiun_id = stasiun.stasiun_id
            exist_history.channel = i[1]
            exist_history.sensor_name = i[2]
            exist_history.digitizer_name = i[3]
            exist_history.total_gain = i[4]
            exist_history.input_unit = i[5]
            exist_history.start_date = i[6].datetime
            exist_history.end_date = i[7].datetime if i[7] else None
            exist_history.status = i[8]
            exist_history.latitude = i[9]
            exist_history.longitude = i[10]
            exist_history.elevation = i[11]
            exist_history.sampling_rate = i[12]
            exist_history.paz = loads13
            exist_history.response_path = i[14]
            
            db.add(exist_history)
            db.flush()
            # db.commit()
        # else:
        #     continue
        
    # Step 4: Commit all changes at the end
    try:
        db.commit()
        log.info("Station history updated successfully.")
    except Exception as e:
        db.rollback()  # Rollback in case of failure
        log.error(f"Failed to commit changes: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    # db.commit()
    
    # log.info("station history updated")













# import json

# def encode_complex_pairs(obj):
#     if isinstance(obj, complex):
#         return {"__type__": "complex", "re": float(obj.real), "im": float(obj.imag)}
#     raise TypeError(f"Not JSON-serializable: {type(obj).__name__}")

# def decode_complex_pairs(d):
#     if isinstance(d, dict) and d.get("__type__") == "complex":
#         return complex(d["re"], d["im"])
#     return d

# pz = {
#     '_pz_transfer_function_type': 'LAPLACE (RADIANS/SECOND)',
#     '_normalization_frequency': 0.1,
#     'normalization_factor': 63193.0,
#     '_zeros': [0j, 0j],
#     '_poles': [(-0.03702+0.03702j), (-0.03702-0.03702j),
#                (-177.72+177.72j), (-177.72-177.72j)],
#     'stage_sequence_number': 1,
#     'input_units': 'M/S',
#     'output_units': 'V',
#     'resource_id2': 'NRL/Geodevice/BBVS.120.1000/1',
#     'stage_gain': 1000.0,
#     'stage_gain_frequency': 0.1,
#     'name': 'NRL/Geodevice/BBVS.120.1000/1',
#     # ... other keys ...
# }

# # Dump → JSON
# s = json.dumps(pz, default=encode_complex_pairs, ensure_ascii=False)

# # Load ← JSON
# pz_back = json.loads(s, object_hook=decode_complex_pairs)

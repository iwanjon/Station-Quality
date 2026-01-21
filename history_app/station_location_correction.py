import argparse
import requests
from dotenv import load_dotenv
import os
# from configs.logging_config import setup_logging
# setup_logging()
from external_logger import register_global_exception_handler, setup_logger
import logging
import traceback

setup_logger(name="auto_update_history",log_file="app.log")

log = logging.getLogger("auto_update_history")
load_dotenv()
# Register the global exception handler
register_global_exception_handler(log)

GET_STATIONS_PATH=os.getenv("GET_STATIONS_PATH")
UPDATE_LOCATION_STATION_PATH=os.getenv("UPDATE_LOCATION_STATION_PATH")



def run_app():
    
    try:
        log.info("start request GET stations")
        all_station = requests.get(GET_STATIONS_PATH)
    except Exception as e:
        log.error(e) 
        log.error(traceback.print_exc()) 
        return
    
    number_of_origin_station = len(all_station.json())
    if number_of_origin_station == 0:
        log.error("number station is zero")
        return
    
    process_stations = all_station.json()
    number_of_station = len(process_stations)
    
    for no , i in enumerate(process_stations):

        try:
            sta = i.get("kode_stasiun")
            net = i.get("net")
            lokasi = i.get("lokasi")
            status = i.get("status")
            log.info("update station: number {} of {} , code {} , network {} , status {} , lokasi {}".format(str(no+1) , 
                                                                                                             str(number_of_station),  
                                                                                                             str(sta), 
                                                                                                             str(net), 
                                                                                                             str(status), 
                                                                                                             str(lokasi)
                                                                                                             ))
            HISTORY_APP_URL=UPDATE_LOCATION_STATION_PATH.format(sta)
            requests.put(HISTORY_APP_URL)
        except Exception as e:
            log.error(e)
            log.error(traceback.print_exc())
            continue
    
    return

if  __name__ == "__main__":
    run_app()

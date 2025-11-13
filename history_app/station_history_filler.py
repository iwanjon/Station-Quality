import requests
from dotenv import load_dotenv
import os
# from configs.logging_config import setup_logging
# setup_logging()
from external_logger import register_global_exception_handler, setup_logger
import logging
import traceback

setup_logger(name="auto_update_history",log_file="cron_auto_update_history.log")

log = logging.getLogger("auto_update_history")
load_dotenv()
# Register the global exception handler
register_global_exception_handler(log)

GET_STATIONS_PATH=os.getenv("GET_STATIONS_PATH")
UPDATE_HISTORY_STATION_PATH=os.getenv("UPDATE_HISTORY_STATION_PATH")



def run_app():
    try:
        log.info("start request")
        all_station = requests.get(GET_STATIONS_PATH)
    except Exception as e:
        log.error(e) 
        log.error(traceback.print_exc()) 
        return
    
    number_of_station = len(all_station.json())
    for no , i in enumerate(all_station.json()):
        # if no == 5:
        #     return
        # from pdb import set_trace as sstt
        # sstt()
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
            HISTORY_APP_URL=UPDATE_HISTORY_STATION_PATH.format(sta)
            requests.put(HISTORY_APP_URL)
        except Exception as e:
            log.error(e)
            log.error(traceback.print_exc())
            continue
    
    return

if  __name__ == "__main__":
    run_app()

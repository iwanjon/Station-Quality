import argparse
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
    
    # Create an ArgumentParser object
    parser = argparse.ArgumentParser(description="Process some configuration.")
    
    # Define the --config argument to specify the path to the .env file
    parser.add_argument('--config', type=str, help='Path to the configuration file', required=True)
    
    # Parse the arguments
    args = parser.parse_args()

    # Load environment variables from the specified .env file
    if os.path.exists(args.config):
        load_dotenv(dotenv_path=args.config)
        print(f"Loaded environment variables from: {args.config}")
    else:
        print(f"Error: The configuration file {args.config} was not found!")
        return

    # You can now access environment variables like this:
    RANGE = os.getenv('RANGE')  # Replace with your actual variable name
    if RANGE:
        log.info(f"RANGE: {RANGE}")
    else:
        log.error("RANGE is not set! in env")   
        return 
    
    start, end = map(int, RANGE.split(":"))
    slice_obj = slice(start, end)

    # op=[1,2,3,4,5,6,7,8,9]
    # print(op[slice_obj])
    
    try:
        log.info("start request")
        all_station = requests.get(GET_STATIONS_PATH)
    except Exception as e:
        log.error(e) 
        log.error(traceback.print_exc()) 
        return
    
    number_of_origin_station = len(all_station.json())
    if number_of_origin_station == 0:
        log.error("number station is zero")
        return
    
    process_stations = all_station.json()[slice_obj]
    number_of_station = len(process_stations)
    
    for no , i in enumerate(process_stations):
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

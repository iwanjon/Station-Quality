import argparse
import requests
from dotenv import load_dotenv
import os
from external_logger import register_global_exception_handler, setup_logger
import logging
import traceback
import __main__

setup_logger(name="auto_update_history", log_file="cron_auto_update_history.log")

log = logging.getLogger("auto_update_history")

# Register the global exception handler
register_global_exception_handler(log)

def run_app():
    log.info(__main__.__file__)
    # Create an ArgumentParser object
    parser = argparse.ArgumentParser(description="Trigger request to station quality filler.")
    
    # Define the --config argument to specify the path to the .env file
    parser.add_argument('--config', type=str, help='Path to the configuration file', required=True)
    
    # Parse the arguments
    args = parser.parse_args()

    # Load environment variables from the specified .env file
    if os.path.exists(args.config):
        load_dotenv(dotenv_path=args.config)
        log.info(f"Loaded environment variables from: {args.config}")
    else:
        log.error(f"Error: The configuration file {args.config} was not found!")
        return

    # Fetch the target URL from the environment, defaulting to the one you provided
    target_url = os.getenv("STASIUN_QUALITY_FILLER_URL", "http://100.1.12.13:9090/werty")
    
    try:
        log.info(f"Starting request to: {target_url}")
        
        # Triggering a GET request to the target URL
        response = requests.get(target_url)
        
        # Check if the request was successful
        response.raise_for_status() 
        log.info(f"Request successful! Status code: {response.status_code}")
        
    except Exception as e:
        log.error(f"Failed to trigger request: {e}")
        # Using format_exc() instead of print_exc() so the traceback goes into your log file instead of the console
        log.error(traceback.format_exc()) 

if __name__ == "__main__":
    run_app()
    log.info("finish runing this script")
    log.info(__main__.__file__)
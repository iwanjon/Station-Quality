import logging
from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger("station_history") # Use the same logger name

async def log_unhandled_exceptions(request: Request, call_next):
    """
    Middleware to catch, log, and return a 500 response for any unhandled exception.
    """
    try:
        # Try to process the request
        response = await call_next(request)
        return response
    except Exception as e:
        # Log the unhandled exception with a full stack trace
        logger.error(
            f"Unhandled exception for request: {request.method} {request.url}",
            exc_info=True  # This adds the full stack trace
        )
        # Return a generic 500 error response
        return JSONResponse(
            status_code=500,
            content={"message": "Internal Server Error"},
        )
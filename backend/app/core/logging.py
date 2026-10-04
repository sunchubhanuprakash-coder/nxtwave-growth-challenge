import logging
import sys


def setup_logging():
    """
    Configures structured console logging for the application.
    """
    log_format = "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s"
    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    logger = logging.getLogger("growth_engine")
    return logger


logger = setup_logging()

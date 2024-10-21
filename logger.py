import logging
from threading import Lock

class Logger:
    _instance = None
    _lock = Lock()

    def __new__(cls, name="stasks", level=logging.DEBUG):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(Logger, cls).__new__(cls)
                cls._instance._initialize(name, level)
        return cls._instance

    def _initialize(self, name, level):
        self.logger = logging.getLogger(name)
        if not self.logger.hasHandlers():  # Prevents duplicate handlers
            self.logger.setLevel(level)

            # File handler
            file_handler = logging.FileHandler("stasks.log")
            file_handler.setLevel(level)
            file_format = logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            )
            file_handler.setFormatter(file_format)
            self.logger.addHandler(file_handler)

            # Console handler
            console_handler = logging.StreamHandler()
            console_handler.setLevel(logging.DEBUG)  # Logs everything to the console
            console_format = logging.Formatter(
                "%(levelname)s - %(message)s"
            )
            console_handler.setFormatter(console_format)
            self.logger.addHandler(console_handler)

    def get_logger(self):
        return self.logger
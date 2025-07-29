import torch
import logging

# Configure logging to provide clear feedback
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

def redownload_zoedepth_model():
    """
    Forces a re-download of the ZoeDepth model from the Torch Hub repository.
    This is useful for clearing a corrupted cache or ensuring the latest version
    of the model is fetched.
    """
    try:
        logging.info("Attempting to force a re-download of the ZoeDepth model (ZoeD_NK)...")
        logging.info("The `force_reload=True` flag will bypass any existing cache.")
        
        # Use torch.hub.load with force_reload=True to ignore the cache
        model = torch.hub.load('isl-org/ZoeDepth', 'ZoeD_NK', pretrained=True, force_reload=True)
        
        logging.info("✅ Successfully re-downloaded and loaded the ZoeD_NK model.")
        logging.info("The model cache should now be updated.")
        
    except Exception as e:
        logging.error("❌ Failed to re-download the ZoeDepth model.")
        logging.error(f"   Error: {e}")
        logging.warning("Please check your internet connection and firewall settings.")
        logging.warning("If the issue persists, Torch Hub or GitHub may be temporarily unavailable.")

if __name__ == "__main__":
    logging.info("======================================================")
    logging.info("ZoeDepth Model Cache Refresh Script")
    logging.info("======================================================")
    redownload_zoedepth_model()

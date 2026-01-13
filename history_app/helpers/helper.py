from pathlib import Path

BASEDIR =  Path(__file__).resolve().parent.parent
 

def clear_static_images_only():
    target_dir = BASEDIR / "static" / "public" / "response"
    deleted_files = []
    
    # Define valid image types
    valid_exts = {".jpg", ".jpeg", ".png"}

    if not target_dir.exists():
        return {"message": "Directory not found"}

    for item in target_dir.iterdir():
        # Check extension safely
        if item.is_file() and item.suffix.lower() in valid_exts:
            try:
                item.unlink()
                deleted_files.append(item.name)
            except Exception as e:
                print(f"Could not delete {item.name}: {e}")

    return {
        "message": "Image cleanup complete",
        "deleted_count": len(deleted_files),
        "deleted_files": deleted_files,
        "target_dir":target_dir
    }
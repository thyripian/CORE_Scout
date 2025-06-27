#!/usr/bin/env python3
import argparse
import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from database_operations.sqlite_operations import SQLiteDatabase
from core.utilities.config_manager import load_config

def main():
    parser = argparse.ArgumentParser(description="CORE-Scout: Austere search + render server")
    parser.add_argument(
        "--config", "-c", default="config/settings_offline.json",
        help="Path to the JSON config file"
    )
    args = parser.parse_args()

    # 1) Load JSON config
    cfg = load_config(args.config)
    if cfg["database"]["type"] != "sqlite":
        raise RuntimeError("CORE-Scout must be run with database.type = 'sqlite'")

    # 2) Initialize and connect to SQLite
    db_path = cfg["database"]["sqlite_path"]
    if not os.path.exists(db_path):
        raise RuntimeError(f"SQLite DB not found at: {db_path}")
    db = SQLiteDatabase(db_path)
    db.connect()

    # 3) Create FastAPI app
    app = FastAPI()

    # 4) Mount static React files (absolute path)
    #    __file__ is this script’s path; user_interface/ui/build is relative to project root.
    base_dir = os.path.dirname(__file__)
    static_dir = os.path.join(base_dir, "user_interface", "ui", "build")
    if not os.path.isdir(static_dir):
        raise RuntimeError(f"Static directory not found: {static_dir}")
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="ui")

    # 5) API endpoint: search
    @app.get("/api/search")
    async def search_reports(
        q: str = Query(..., description="FTS5 MATCH expression"),
        limit: int = Query(50, ge=1, le=500)
    ):
        try:
            rows = db.search(q, limit=limit)
            return rows
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"SQLite search error: {e}")

    # 6) API endpoint: get a full report by ID
    @app.get("/api/report/{report_id}")
    async def get_report(report_id: str):
        rec = db.get_report(report_id)
        if not rec:
            raise HTTPException(status_code=404, detail="Report not found")
        return rec

    # 7) If you added /api/upload-db or /api/set-db-path earlier, include those here as well.

    # 8) Run Uvicorn
    import uvicorn
    uvicorn.run(
        app,
        host=cfg["server"]["host"],
        port=cfg["server"]["port"],
        log_level="info"
    )

if __name__ == "__main__":
    main()

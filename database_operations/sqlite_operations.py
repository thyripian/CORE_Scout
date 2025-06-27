import sqlite3
import base64
import pickle
import imghdr
from io import BytesIO
import mgrs  # pip install mgrs

class SQLiteDatabase:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.conn: sqlite3.Connection = None
        self.cursor: sqlite3.Cursor = None
        self.mgrs_converter = mgrs.MGRS()

    def connect(self) -> None:
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self.cursor = self.conn.cursor()

    def search(self, query_str: str, limit: int = 50):
        sql = """
        SELECT r.*
        FROM reports r
        JOIN reports_fts fts ON r.pk = fts.rowid
        WHERE fts MATCH ?
        ORDER BY bm25(fts)
        LIMIT ?
        """
        self.cursor.execute(sql, (query_str, limit))
        rows = self.cursor.fetchall()
        return [dict(row) for row in rows]

    def get_report(self, report_id: str):
        self.cursor.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
        row = self.cursor.fetchone()
        if not row:
            return None
        rec = dict(row)

        raw_b64 = rec.get("images")
        images_list = []
        if raw_b64:
            try:
                pickled = base64.b64decode(raw_b64)
                images_io_list = pickle.loads(pickled)
            except Exception:
                images_io_list = []
            for bio in images_io_list:
                img_bytes = bio.getvalue() if isinstance(bio, BytesIO) else bio
                fmt = imghdr.what(None, h=img_bytes) or "jpeg"
                b64str = base64.b64encode(img_bytes).decode("utf-8")
                images_list.append({"mime": f"image/{fmt}", "data": b64str})
        rec["images"] = images_list

        mgrs_str = rec.get("MGRS") or ""
        coords_list = []
        if mgrs_str:
            for m in mgrs_str.split("|"):
                try:
                    lat, lon = self.mgrs_converter.toLatLon(m)
                    coords_list.append({"mgrs": m, "lat": lat, "lon": lon})
                except Exception:
                    continue
        rec["coords"] = coords_list

        return rec

    def close(self) -> None:
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()

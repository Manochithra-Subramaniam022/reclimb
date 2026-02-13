from flask import Flask, render_template, request, redirect, url_for, session, send_from_directory, abort
import sqlite3
import os
import hashlib
from functools import wraps
from werkzeug.utils import secure_filename
from datetime import datetime

from flask_cors import CORS

app = Flask(__name__)
app.secret_key = "dev-secret-key"
CORS(app, supports_credentials=True, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

def api_response(data=None, status=200, message=None):
    if request.is_json or request.args.get('json') == 'true' or 'application/json' in request.headers.get('Accept', ''):
        resp = {"success": status < 400}
        if data is not None: resp["data"] = data
        if message: resp["message"] = message
        return resp, status
    return None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "reclaim.db")
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_DOMAIN = "@cit.edu.in"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

# ---------- DB ----------

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()

    conn.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL,
        item_name TEXT NOT NULL,
        status TEXT NOT NULL,
        location TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT NOT NULL,
        contact TEXT NOT NULL,
        image_path TEXT,
        is_returned INTEGER DEFAULT 0
    )
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        requester_id INTEGER NOT NULL,
        claim_message TEXT NOT NULL,
        image_path TEXT,
        status TEXT DEFAULT 'pending'
    )
    """)

    conn.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        timestamp TEXT NOT NULL
    )
    """)

    conn.commit()
    conn.close()

# ---------- UTILS ----------

def hash_password(p):
    return hashlib.sha256(p.encode()).hexdigest()

def login_required(f):
    @wraps(f)
    def wrap(*args, **kwargs):
        if "user_id" not in session:
            error_resp = api_response(status=401, message="Session expired. Please login again.")
            if error_resp: return error_resp
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return wrap

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# ---------- AUTH ----------

@app.route("/", methods=["GET", "POST"])
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form["email"].lower()
        password = request.form["password"]

        if not email.endswith(ALLOWED_DOMAIN):
            return "Invalid college email"

        conn = get_db()
        user = conn.execute(
            "SELECT * FROM users WHERE email=? AND password=?",
            (email, hash_password(password))
        ).fetchone()
        conn.close()

        if not user:
            return api_response(status=401, message="Invalid credentials") or "Invalid credentials"

        session.clear()
        session["user_id"] = user["id"]
        session["user_name"] = user["name"]
        
        return api_response(data={"user_id": user["id"], "name": user["name"]}) or redirect(url_for("dashboard"))

    return render_template("login.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        conn = get_db()
        conn.execute(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            (
                request.form["name"],
                request.form["email"].lower(),
                hash_password(request.form["password"])
            )
        )
        conn.commit()
        conn.close()
        return api_response(message="Registration successful") or redirect(url_for("login"))

    return render_template("register.html")

@app.route("/logout")
def logout():
    session.clear()
    return api_response(message="Logged out") or redirect(url_for("login"))

@app.route("/api/me")
def get_me():
    if "user_id" in session:
        return api_response(data={"user_id": session["user_id"], "user_name": session["user_name"]})
    return api_response(status=401, message="Not authenticated")

# ---------- DASHBOARD ----------

@app.route("/dashboard")
@login_required
def dashboard():
    section = request.args.get("section", "active")
    query = request.args.get("q", "").strip()

    conn = get_db()
    
    sql = """
        SELECT id, item_name, date, status, location
        FROM items
        WHERE is_returned = ?
    """
    params = [1 if section == "previous" else 0]

    if query:
        sql += " AND item_name LIKE ?"
        params.append(f"%{query}%")

    sql += " ORDER BY id DESC"
    
    items = conn.execute(sql, params).fetchall()
    conn.close()

    items_list = [dict(ix) for ix in items]
    return api_response(data={"items": items_list, "section": section, "query": query}) or render_template("dashboard.html", items=items, section=section, query=query)

# ---------- ITEMS ----------

@app.route("/add/<status>", methods=["GET", "POST"])
@login_required
def add_item(status):
    if request.method == "POST":
        image = request.files.get("image")
        image_path = None

        if status == "found" and (not image or image.filename == ""):
            return "Image required for FOUND items"

        if image and image.filename:
            if not allowed_file(image.filename):
                return "Invalid image type"
            filename = secure_filename(image.filename)
            filename = f"item_{session['user_id']}_{filename}"
            image.save(os.path.join(UPLOAD_FOLDER, filename))
            image_path = filename

        conn = get_db()
        conn.execute("""
            INSERT INTO items
            (owner_id, item_name, status, location, date, description, contact, image_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            session["user_id"],
            request.form["item_name"].strip().title(),
            status.capitalize(),
            request.form["location"].strip().title(),
            request.form["date"],
            request.form["description"],
            request.form["contact"],
            image_path
        ))
        conn.commit()
        conn.close()
        return api_response(message=f"{status.capitalize()} item posted successfully") or redirect(url_for("dashboard"))

    return render_template("add_item.html", status=status)

@app.route("/uploads/<filename>")
@login_required
def uploads(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# ---------- ITEM VIEW ----------

@app.route("/item/<int:item_id>")
@login_required
def view_item(item_id):
    conn = get_db()
    item = conn.execute("SELECT * FROM items WHERE id=?", (item_id,)).fetchone()

    req = conn.execute("""
        SELECT * FROM requests
        WHERE item_id=? AND requester_id=?
    """, (item_id, session["user_id"])).fetchone()

    show_full = (
        session["user_id"] == item["owner_id"] or
        (req and req["status"] == "accepted")
    )

    conn.close()

    data = {
        "item": dict(item),
        "request": dict(req) if req else None,
        "show_full": show_full
    }
    return api_response(data=data) or render_template(
        "item.html",
        item=item,
        request_obj=req,
        show_full=show_full
    )

# ---------- SEND REQUEST (FIXED) ----------

@app.route("/request/<int:item_id>", methods=["GET", "POST"])
@login_required
def request_item(item_id):
    if request.method == "GET":
        return redirect(url_for("view_item", item_id=item_id))

    claim = request.form["claim_message"].strip()
    image = request.files.get("image")
    image_path = None

    if image and image.filename:
        if not allowed_file(image.filename):
            return "Invalid image"
        filename = secure_filename(image.filename)
        filename = f"req_{session['user_id']}_{filename}"
        image.save(os.path.join(UPLOAD_FOLDER, filename))
        image_path = filename

    conn = get_db()
    conn.execute("""
        INSERT INTO requests (item_id, requester_id, claim_message, image_path)
        VALUES (?, ?, ?, ?)
    """, (item_id, session["user_id"], claim, image_path))
    conn.commit()
    conn.close()

    return api_response(message="Claim request sent") or redirect(url_for("requests_inbox"))

# ---------- RETURN ----------

@app.route("/mark_returned/<int:item_id>", methods=["POST"])
@login_required
def mark_returned(item_id):
    conn = get_db()
    conn.execute("""
        UPDATE items SET is_returned=1
        WHERE id=? AND owner_id=?
    """, (item_id, session["user_id"]))
    conn.commit()
    conn.close()
    return api_response(message="Item marked as returned") or redirect(url_for("dashboard", section="previous"))

# ---------- REQUESTS (UNIFIED INBOX) ----------

@app.route("/requests")
@login_required
def requests_inbox():
    conn = get_db()
    inbox = conn.execute("""
        SELECT 
            r.id,
            r.status,
            r.claim_message,
            r.image_path AS claim_image,
            i.item_name,
            i.is_returned,
            i.owner_id,
            r.requester_id,
            CASE
                WHEN i.owner_id = ? THEN 'received'
                ELSE 'sent'
            END AS role
        FROM requests r
        JOIN items i ON i.id = r.item_id
        WHERE i.owner_id = ? OR r.requester_id = ?
        ORDER BY r.id DESC
    """, (
        session["user_id"],
        session["user_id"],
        session["user_id"]
    )).fetchall()
    conn.close()

    inbox_list = [dict(ix) for ix in inbox]
    return api_response(data={"inbox": inbox_list}) or render_template("requests.html", inbox=inbox)

@app.route("/request_action/<int:req_id>/<action>", methods=["POST"])
@login_required
def request_action(req_id, action):
    status = "accepted" if action == "accept" else "rejected"
    conn = get_db()
    conn.execute("UPDATE requests SET status=? WHERE id=?", (status, req_id))
    conn.commit()
    conn.close()
    return api_response(message=f"Request {action}ed") or redirect(url_for("requests_inbox"))

# ---------- CHAT ----------

@app.route("/chat/<int:req_id>")
@login_required
def chat(req_id):
    conn = get_db()

    req = conn.execute("""
        SELECT r.*, i.owner_id, i.is_returned, i.id AS item_id
        FROM requests r
        JOIN items i ON i.id = r.item_id
        WHERE r.id=? AND r.status='accepted'
    """, (req_id,)).fetchone()

    if not req:
        conn.close()
        return api_response(status=404, message="Request not found or not accepted") or abort(404)

    if session["user_id"] not in (req["owner_id"], req["requester_id"]):
        conn.close()
        return api_response(status=403, message=f"Unauthorized access. Your ID: {session['user_id']}, Owner: {req['owner_id']}, Requester: {req['requester_id']}") or abort(403)

    messages = conn.execute("""
        SELECT m.message, m.timestamp, u.name
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        WHERE m.request_id=?
        ORDER BY m.id
    """, (req_id,)).fetchall()

    conn.close()

    messages_list = [dict(m) for m in messages]
    data = {
        "messages": messages_list,
        "req_id": req_id,
        "is_returned": req["is_returned"],
        "item_id": req["item_id"],
        "owner_id": req["owner_id"]
    }
    return api_response(data=data) or render_template(
        "chat.html",
        messages=messages,
        req_id=req_id,
        is_returned=req["is_returned"],
        item_id=req["item_id"],
        owner_id=req["owner_id"]
    )

@app.route("/send_message/<int:req_id>", methods=["POST"])
@login_required
def send_message(req_id):
    conn = get_db()
    
    # Check if request exists and is accepted
    req = conn.execute("""
        SELECT r.*, i.owner_id, i.is_returned
        FROM requests r
        JOIN items i ON i.id = r.item_id
        WHERE r.id=? AND r.status='accepted'
    """, (req_id,)).fetchone()

    if not req:
        conn.close()
        return api_response(status=404, message="Chat session not found or not accepted") or abort(404)

    # Security check: User must be either the owner or the requester
    if session["user_id"] not in (req["owner_id"], req["requester_id"]):
        conn.close()
        return api_response(status=403, message="Unauthorized to send messages in this chat") or abort(403)

    # Check if item is already returned
    if req["is_returned"] == 1:
        conn.close()
        return api_response(status=403, message="Item already returned. Chat is closed.") or abort(403)

    message_text = ""
    if request.is_json:
        message_text = request.json.get("message", "").strip()
    else:
        message_text = request.form.get("message", "").strip()

    print(f"[DEBUG] Sending message to req_id {req_id}: '{message_text}' from user {session['user_id']}")

    if not message_text:
        conn.close()
        return api_response(status=400, message="Message cannot be empty") or ("Message cannot be empty", 400)

    conn.execute("""
        INSERT INTO messages (request_id, sender_id, message, timestamp)
        VALUES (?, ?, ?, ?)
    """, (
        req_id,
        session["user_id"],
        message_text,
        datetime.now().strftime("%Y-%m-%d %H:%M")
    ))
    conn.commit()
    conn.close()
    
    return api_response(message="Message sent") or redirect(url_for("chat", req_id=req_id))

# ---------- RUN ----------

if __name__ == "__main__":
    init_db()
    app.run(debug=True)

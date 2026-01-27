import uuid

from flask import (
    Flask,
    flash,
    redirect,
    render_template,
    request,
    Response,
    session,
    url_for,
)

from parser import parse_file
from analyzer import (
    summary,
    urls_detail_report,
    bots_report,
    status_codes_report,
    ips_report,
    crawl_frequency_report,
)
from csv_export import generate_csv, raw_csv

app = Flask(__name__)
app.secret_key = "log-analyzer-dev-key"

# In-memory storage: session_id -> { "entries": [...], "file_count": int, "error_count": int }
sessions_data = {}


def _get_entries():
    sid = session.get("session_id")
    if not sid or sid not in sessions_data:
        return None
    return sessions_data[sid]


@app.route("/")
def upload_page():
    return render_template("upload.html")


@app.route("/upload", methods=["POST"])
def upload():
    files = request.files.getlist("files")
    if not files or all(f.filename == "" for f in files):
        flash("No files selected.")
        return redirect(url_for("upload_page"))

    all_entries = []
    total_errors = 0
    file_count = 0

    for f in files:
        if f.filename == "":
            continue
        entries, errors = parse_file(f.stream)
        all_entries.extend(entries)
        total_errors += errors
        file_count += 1

    if not all_entries:
        flash("No valid log entries found in uploaded files.")
        return redirect(url_for("upload_page"))

    sid = str(uuid.uuid4())
    session["session_id"] = sid
    sessions_data[sid] = {
        "entries": all_entries,
        "file_count": file_count,
        "error_count": total_errors,
    }

    return redirect(url_for("dashboard"))


@app.route("/dashboard")
def dashboard():
    data = _get_entries()
    if not data:
        flash("No data loaded. Please upload log files first.")
        return redirect(url_for("upload_page"))
    s = summary(data["entries"])
    return render_template(
        "dashboard.html",
        s=s,
        file_count=data["file_count"],
        error_count=data["error_count"],
    )


@app.route("/urls")
def urls_page():
    data = _get_entries()
    if not data:
        flash("No data loaded. Please upload log files first.")
        return redirect(url_for("upload_page"))
    report = urls_detail_report(data["entries"])
    all_bots = sorted({bot["bot_name"] for row in report for bot in row.get("bots", [])})
    return render_template("urls_detail.html", data=report, all_bots=all_bots)


@app.route("/bots")
def bots_page():
    data = _get_entries()
    if not data:
        flash("No data loaded. Please upload log files first.")
        return redirect(url_for("upload_page"))
    return render_template("bots.html", data=bots_report(data["entries"]))


@app.route("/status-codes")
def status_codes_page():
    data = _get_entries()
    if not data:
        flash("No data loaded. Please upload log files first.")
        return redirect(url_for("upload_page"))
    return render_template("status_codes.html", data=status_codes_report(data["entries"]))


@app.route("/ips")
def ips_page():
    data = _get_entries()
    if not data:
        flash("No data loaded. Please upload log files first.")
        return redirect(url_for("upload_page"))
    return render_template("ips.html", data=ips_report(data["entries"]))


@app.route("/crawl-frequency")
def crawl_frequency_page():
    data = _get_entries()
    if not data:
        flash("No data loaded. Please upload log files first.")
        return redirect(url_for("upload_page"))
    return render_template("crawl_frequency.html", data=crawl_frequency_report(data["entries"]))


@app.route("/download/<report>")
def download_report(report):
    data = _get_entries()
    if not data:
        flash("No data loaded. Please upload log files first.")
        return redirect(url_for("upload_page"))

    entries = data["entries"]

    if report == "raw":
        csv_str = raw_csv(entries)
        filename = "raw_logs.csv"
    elif report == "urls":
        rows = urls_detail_report(entries)
        fieldnames = ["url", "hits", "bot_hits", "human_hits", "bot_count", "status_codes", "avg_bytes", "last_access"]
        csv_str = generate_csv(rows, fieldnames)
        filename = "urls_report.csv"
    elif report == "bots":
        rows = bots_report(entries)
        fieldnames = ["bot_name", "bot_category", "hits", "unique_urls", "status_codes", "avg_bytes", "first_seen", "last_seen", "verified_googlebot"]
        csv_str = generate_csv(rows, fieldnames)
        filename = "bots_report.csv"
    elif report == "status_codes":
        rows = status_codes_report(entries)
        fieldnames = ["code", "count", "percentage", "top_urls"]
        csv_str = generate_csv(rows, fieldnames)
        filename = "status_codes_report.csv"
    elif report == "ips":
        rows = ips_report(entries)
        fieldnames = ["ip", "hits", "is_bot", "bot_name", "unique_urls"]
        csv_str = generate_csv(rows, fieldnames)
        filename = "ips_report.csv"
    elif report == "crawl_frequency":
        rows = crawl_frequency_report(entries)
        fieldnames = ["url", "crawl_count", "avg_interval", "last_crawl"]
        csv_str = generate_csv(rows, fieldnames)
        filename = "crawl_frequency_report.csv"
    else:
        flash(f"Unknown report: {report}")
        return redirect(url_for("dashboard"))

    return Response(
        csv_str,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


if __name__ == "__main__":
    app.run(debug=True, port=5001)

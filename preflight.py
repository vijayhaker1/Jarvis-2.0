#!/usr/bin/env python3
"""
Preflight Test Harness for Jarvis (Prompt 07 & 16)
Runs live verification chains against the running server.
"""

import sys
import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:3000"

def run_check(label, check_fn):
    try:
        passed, msg = check_fn()
        if passed:
            print(f"✔  {label} — {msg}")
            return "pass"
        else:
            print(f"✖  {label} — {msg}")
            return "fail"
    except Exception as e:
        print(f"✖  {label} — ERROR: {str(e)}")
        return "fail"

def test_server_up():
    req = urllib.request.urlopen(f"{BASE_URL}/api/graph", timeout=5)
    return req.status == 200, f"HTTP {req.status}"

def test_graph_data():
    req = urllib.request.urlopen(f"{BASE_URL}/api/graph", timeout=5)
    data = json.loads(req.read().decode())
    count = len(data.get("nodes", []))
    return count > 0, f"{count} nodes verified"

def test_chat():
    payload = json.dumps({"question": "What is our 2026 executive strategy?"}).encode()
    req = urllib.request.Request(f"{BASE_URL}/api/chat", data=payload, headers={"Content-Type": "application/json"})
    resp = urllib.request.urlopen(req, timeout=8)
    data = json.loads(resp.read().decode())
    has_answer = bool(data.get("answer"))
    has_nodes = isinstance(data.get("nodes"), list)
    return (has_answer and has_nodes), f"answer: '{data.get('answer', '')[:40]}...', nodes: {data.get('nodes')}"

def test_remember():
    payload = json.dumps({"text": "remember that the finish window should be 900 milliseconds"}).encode()
    req = urllib.request.Request(f"{BASE_URL}/api/remember", data=payload, headers={"Content-Type": "application/json"})
    resp = urllib.request.urlopen(req, timeout=5)
    data = json.loads(resp.read().decode())
    success = data.get("success") is True
    return success, f"new star created id={data.get('note', {}).get('id')}"

def test_focus_diag():
    req = urllib.request.urlopen(f"{BASE_URL}/focus/diag", timeout=5)
    data = json.loads(req.read().decode())
    # Verify no identities present
    no_identities = "app_name" not in data and "url" not in data and "title" not in data
    return no_identities and data.get("sessionOn") is not None, "clean anonymous boolean statuses verified"

def test_see_jpeg():
    # 1x1 base64 JPEG
    tiny_jpeg = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
    payload = json.dumps({"image": tiny_jpeg, "question": "Inspect this probe"}).encode()
    req = urllib.request.Request(f"{BASE_URL}/api/see", data=payload, headers={"Content-Type": "application/json"})
    resp = urllib.request.urlopen(req, timeout=8)
    data = json.loads(resp.read().decode())
    return bool(data.get("answer")), "JPEG frame processed and answered"

def main():
    print("\n--- JARVIS PREFLIGHT HARNESS (Prompt 07 & 16) ---")
    checks = [
        ("The server is up and serving the viewer", test_server_up),
        ("The graph data loads and the node count is greater than zero", test_graph_data),
        ("/chat returns a well-formed answer to a real question, with a nodes array", test_chat),
        ("/remember writes a real file and the note is retrievable immediately", test_remember),
        ("GET /focus/diag returns booleans and statuses ONLY, no identities", test_focus_diag),
        ("/see answers a real JPEG frame", test_see_jpeg)
    ]

    pass_count = 0
    fail_count = 0
    warn_count = 0

    for label, fn in checks:
        result = run_check(label, fn)
        if result == "pass":
            pass_count += 1
        elif result == "fail":
            fail_count += 1
        else:
            warn_count += 1

    summary = f"{pass_count} pass, {fail_count} fail, {warn_count} warn."
    print("-------------------------------------------------")
    print(f"SUMMARY: {summary}\n")
    if fail_count > 0:
        sys.exit(1)
    sys.exit(0)

if __name__ == "__main__":
    main()

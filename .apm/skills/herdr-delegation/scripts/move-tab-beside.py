#!/usr/bin/env python3
"""Move a Herdr tab to sit immediately after another tab in the same workspace.

Usage: move-tab-beside.py <tab_id> <anchor_tab_id>

The herdr CLI has no tab move command, so this calls the socket API's tab.move
directly. It talks to $HERDR_SOCKET_PATH, or the default session socket.
"""

import json
import os
import socket
import sys


def call(sock_path, method, params):
    with socket.socket(socket.AF_UNIX) as sock:
        sock.connect(sock_path)
        sock.sendall((json.dumps({"id": method, "method": method, "params": params}) + "\n").encode())
        buf = b""
        while not buf.endswith(b"\n"):
            chunk = sock.recv(65536)
            if not chunk:
                break
            buf += chunk
    response = json.loads(buf)
    if "error" in response:
        sys.exit(f"{method} failed: {json.dumps(response['error'])}")
    return response["result"]


def main():
    if len(sys.argv) != 3:
        sys.exit("usage: move-tab-beside.py <tab_id> <anchor_tab_id>")
    tab_id, anchor_id = sys.argv[1:]
    sock_path = os.environ.get("HERDR_SOCKET_PATH") or os.path.expanduser("~/.config/herdr/herdr.sock")

    workspace_id = anchor_id.split(":", 1)[0]
    if tab_id.split(":", 1)[0] != workspace_id:
        sys.exit(f"{tab_id} and {anchor_id} are in different workspaces")

    if tab_id == anchor_id:
        sys.exit("a tab cannot move beside itself")
    tabs = [t["tab_id"] for t in call(sock_path, "tab.list", {"workspace_id": workspace_id})["tabs"]]
    for t in (tab_id, anchor_id):
        if t not in tabs:
            sys.exit(f"{t} is not a tab in {workspace_id}")

    # tab.move counts insert_index against the order before the tab is removed.
    index = tabs.index(anchor_id) + 1
    result = call(sock_path, "tab.move", {"tab_id": tab_id, "insert_index": index})
    order = [t["tab_id"] for t in result["tabs"]]
    if order.index(tab_id) != order.index(anchor_id) + 1:
        sys.exit(f"tab order after move does not place {tab_id} after {anchor_id}: {order}")
    print(json.dumps({"tab_id": tab_id, "after": anchor_id, "order": order}))


if __name__ == "__main__":
    main()

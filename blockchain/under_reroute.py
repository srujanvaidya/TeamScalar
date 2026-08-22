"""
CLI Under Reroute Script — Alias launcher for blockchain/agent_reroute.py.
Sends human-approved container reroute decisions to Polygon Amoy.
"""

import sys
import os

_project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from blockchain.agent_reroute import main

if __name__ == "__main__":
    main()

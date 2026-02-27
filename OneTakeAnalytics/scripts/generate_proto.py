"""Generate Python gRPC and protobuf code from contracts/proto."""
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
PROTO_ROOT = REPO_ROOT / "contracts" / "proto"
OUT_ROOT = REPO_ROOT / "OneTakeAnalytics" / "libs" / "onetake_proto"
OUT_ROOT.mkdir(parents=True, exist_ok=True)

def main():
    proto_files = [
        PROTO_ROOT / "analytics" / "v1" / "analytics.proto",
        PROTO_ROOT / "reco" / "v1" / "reco.proto",
    ]
    cmd = [
        sys.executable,
        "-m",
        "grpc_tools.protoc",
        f"-I{PROTO_ROOT}",
        f"--python_out={OUT_ROOT}",
        f"--grpc_python_out={OUT_ROOT}",
    ] + [str(f) for f in proto_files]
    subprocess.run(cmd, check=True)

if __name__ == "__main__":
    main()

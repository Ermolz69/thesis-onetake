#!/usr/bin/env python3
import argparse
import glob
import os
import sys
import xml.etree.ElementTree as ET


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate a Cobertura coverage report against a minimum line-rate threshold."
    )
    parser.add_argument(
        "--pattern",
        required=True,
        help="Glob pattern for the cobertura XML report.",
    )
    parser.add_argument(
        "--label",
        required=True,
        help="Human-readable suite label for logs and CI summaries.",
    )
    parser.add_argument(
        "--min-line-rate",
        type=float,
        required=True,
        help="Minimum acceptable line-rate as a decimal between 0 and 1.",
    )
    parser.add_argument(
        "--summary-file",
        help="Optional path to append a Markdown summary row for GitHub Actions.",
    )
    return parser.parse_args()


def append_summary(summary_file: str, label: str, actual_rate: float, min_rate: float, report_path: str) -> None:
    os.makedirs(os.path.dirname(summary_file), exist_ok=True) if os.path.dirname(summary_file) else None
    with open(summary_file, "a", encoding="utf-8") as handle:
        handle.write(
            f"| {label} | {actual_rate:.2%} | {min_rate:.2%} | `{report_path}` |\n"
        )


def main() -> int:
    args = parse_args()
    matches = sorted(glob.glob(args.pattern, recursive=True))
    if not matches:
        print(f"[coverage] No coverage report matched pattern: {args.pattern}", file=sys.stderr)
        return 1

    report_path = matches[0]
    root = ET.parse(report_path).getroot()
    actual_rate = float(root.attrib.get("line-rate", "0"))

    print(
        f"[coverage] {args.label}: line-rate={actual_rate:.2%}, required>={args.min_line_rate:.2%} ({report_path})"
    )

    if args.summary_file:
        append_summary(args.summary_file, args.label, actual_rate, args.min_line_rate, report_path)

    if actual_rate < args.min_line_rate:
        print(
            f"[coverage] {args.label} failed coverage gate: {actual_rate:.2%} < {args.min_line_rate:.2%}",
            file=sys.stderr,
        )
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

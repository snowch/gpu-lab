# Copyright © 2026 Christopher Snow.
"""List CUDA kernel launch dimensions from a Kineto Chrome JSON trace."""
import argparse
import json
import math
from pathlib import Path


def dimensions(value):
    """Accept only three positive integer dimensions; missing is not zero."""
    if (isinstance(value, list) and len(value) == 3
            and all(type(n) is int and n > 0 for n in value)):
        return value
    return None


def kernel_launches(trace):
    events = trace.get("traceEvents") if isinstance(trace, dict) else None
    if not isinstance(events, list):
        raise ValueError("Expected a Chrome JSON object with a traceEvents list.")
    for event in events:
        if not isinstance(event, dict):
            continue
        if str(event.get("cat", "")).lower() != "kernel":
            continue
        args = event.get("args")
        args = args if isinstance(args, dict) else {}
        yield {
            "name": str(event.get("name", "Unnamed kernel")),
            "grid": dimensions(args.get("grid")),
            "block": dimensions(args.get("block")),
            "correlation": args.get("correlation"),
        }


def describe(launch):
    def field(name, unit):
        dims = launch[name]
        if dims is None:
            return f"{name}: unavailable"
        return f"{name}: {dims} ({math.prod(dims)} {unit})"
    return (launch["name"] + "\n  " + field("grid", "blocks")
            + "; " + field("block", "threads per block")
            + f"; correlation: {launch['correlation']}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("trace", type=Path)
    args = parser.parse_args()
    try:
        trace = json.loads(args.trace.read_text(encoding="utf-8"))
        launches = list(kernel_launches(trace))
    except (OSError, ValueError) as error:
        parser.exit(1, f"Cannot read trace: {error}\n")
    if not launches:
        print("No kernel events found. This does not prove no GPU work ran.")
        print("Check CUDA profiling support and the captured interval.")
    for launch in launches:
        print(describe(launch))


if __name__ == "__main__":
    main()

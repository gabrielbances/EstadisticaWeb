from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path


def load_python_prototype():
    project_root = Path(__file__).resolve().parents[2]
    prototype_path = project_root / "ODIOEXCEL copy.py"

    spec = importlib.util.spec_from_file_location("odioexcel_copy", prototype_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"No se pudo cargar el prototipo Python desde {prototype_path}")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def normalize_anova(rows):
    return [
        {
            "source": row["fuente"],
            "sumSquares": row["SC"],
            "degreesOfFreedom": row["gl"],
            "meanSquare": row["CM"],
            "varianceRatio": row["RV"],
        }
        for row in rows
    ]


def normalize_chi_square(result):
    return {
        "statistic": result["estadistico"],
        "degreesOfFreedom": result["gl"],
        "expected": result["esperada"],
    }


def main():
    if len(sys.argv) != 2:
      raise SystemExit("Uso: python3 scripts/python_statistics_reference.py <fixtures.json>")

    fixtures_path = Path(sys.argv[1]).resolve()
    fixtures = json.loads(fixtures_path.read_text(encoding="utf-8"))
    prototype = load_python_prototype()

    output = {"anova": {}, "chiSquare": {}}

    for case in fixtures.get("anova", []):
        output["anova"][case["id"]] = normalize_anova(
            prototype.compute_anova(case["matrix"])
        )

    for case in fixtures.get("chiSquare", []):
        output["chiSquare"][case["id"]] = normalize_chi_square(
            prototype.compute_chi_square(case["matrix"])
        )

    print(json.dumps(output, ensure_ascii=False))


if __name__ == "__main__":
    main()

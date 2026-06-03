#!/usr/bin/env python3
"""One-time refactor: service classes -> interface + *ServiceImpl in impl/."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / "backend/src/main/java/com/smartmart/service"

REGULAR = [
    "AuthService",
    "CategoryService",
    "DashboardService",
    "InventoryLedgerService",
    "InventoryQueryService",
    "ItemService",
    "LocationService",
    "OrderService",
    "PurchaseOrderService",
    "ScrapOrderService",
    "SupplierService",
    "UomService",
    "UserService",
]

AI = [
    "ForecastOrchestrationService",
    "GeminiInsightService",
    "ReorderRecommendationService",
]


def transform(content: str, name: str, impl_pkg: str, iface_pkg: str) -> str:
    content = content.replace(f"package com.smartmart.service;\n", f"package {impl_pkg};\n", 1)
    content = content.replace(
        f"public class {name}",
        f"public class {name}Impl implements {iface_pkg}.{name}",
        1,
    )
    content = re.sub(
        rf"public {name}\(",
        f"public {name}Impl(",
        content,
        count=1,
    )
    # Cross-service imports stay as interface package
    for svc in REGULAR + AI:
        content = content.replace(
            f"import com.smartmart.service.{svc};",
            f"import {('com.smartmart.service.ai' if svc in AI else 'com.smartmart.service')}.{svc};",
        )
    content = content.replace("AuthService::toUserResponse", "authService.toUserResponse")
    content = content.replace("InventoryLedgerService.LotAllocation", "InventoryLedgerService.LotAllocation")
    return content


def add_override(content: str) -> str:
    lines = content.split("\n")
    out = []
    in_class = False
    for i, line in enumerate(lines):
        if "public class " in line and "Impl" in line:
            in_class = True
        if in_class and re.match(r"\s+public ", line) and "Impl(" not in line and "record " not in line:
            prev = out[-1] if out else ""
            if "@Override" not in prev:
                indent = line[: len(line) - len(line.lstrip())]
                out.append(f"{indent}@Override")
        out.append(line)
    return "\n".join(out)


def main() -> None:
    for name in REGULAR:
        src = ROOT / f"{name}.java"
        if not src.exists():
            print(f"skip missing {src}")
            continue
        iface_pkg = "com.smartmart.service"
        impl_pkg = "com.smartmart.service.impl"
        body = src.read_text(encoding="utf-8")
        impl_body = add_override(transform(body, name, impl_pkg, iface_pkg))
        (ROOT / "impl" / f"{name}Impl.java").write_text(impl_body, encoding="utf-8")
        src.unlink()
        print(f"OK {name} -> impl/{name}Impl.java")

    ai_root = ROOT / "ai"
    ai_root.mkdir(exist_ok=True)
    (ai_root / "impl").mkdir(exist_ok=True)

    for name in AI:
        src = ROOT / f"{name}.java"
        if not src.exists():
            print(f"skip missing {src}")
            continue
        iface_pkg = "com.smartmart.service.ai"
        impl_pkg = "com.smartmart.service.ai.impl"
        body = src.read_text(encoding="utf-8")
        body = body.replace("package com.smartmart.service;\n", f"package {impl_pkg};\n", 1)
        body = body.replace(
            f"import com.smartmart.service.ReorderRecommendationService;",
            "import com.smartmart.service.ai.ReorderRecommendationService;",
        )
        impl_body = add_override(transform(body, name, impl_pkg, iface_pkg))
        (ai_root / "impl" / f"{name}Impl.java").write_text(impl_body, encoding="utf-8")
        src.unlink()
        print(f"OK {name} -> ai/impl/{name}Impl.java")


if __name__ == "__main__":
    main()

"""Write a development sample CSV with quality issues. Does not insert database records."""

from pathlib import Path

import pandas as pd

OUTPUT = Path(__file__).resolve().parents[2] / "tests" / "sample_sales.csv"


def main() -> None:
    rows = []
    regions = ["Hyderabad", "hyderabad", "HYDERABAD", "Bengaluru", "Chennai", None]
    products = ["Fiber Kit", "Sensor Pack", "Analytics Suite", "Starter Bundle"]
    for i in range(80):
        rows.append(
            {
                "order_id": 1000 + i if i % 17 else 1000,
                "date": f"2025-0{(i % 9) + 1:d}-{((i % 27) + 1):02d}",
                "product": products[i % 4],
                "customer": f"Customer {i % 12}",
                "region": regions[i % len(regions)],
                "quantity": i % 9 if i % 11 else None,
                "price": "1,250" if i % 13 == 0 else 120 + (i % 15) * 8,
                "discount": 0 if i % 5 else 0.15,
                "revenue": None if i % 7 == 0 else (120 + (i % 15) * 8) * ((i % 9) or 1),
                "profit": -40 if i % 19 == 0 else 18 + (i % 20),
                "cost": 80 + (i % 10),
            }
        )
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(rows).to_csv(OUTPUT, index=False)
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()

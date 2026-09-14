"""Small, explainable demand forecast for the bundled monthly CSV data."""

import csv
import math
from datetime import datetime, timezone
from pathlib import Path


DATA_FILE = Path(__file__).resolve().parents[1] / "Data" / "final30.csv"
AVERAGE_DISHES_PER_DINER = 1.5

# The sample CSV has generic item1..item5 headings.  These mappings make the
# demo useful to the mess while keeping every ingredient quantity explicit.
DISHES = [
    {
        "csv_column": "item1", "name": "Masala Dosa", "unit": "plates",
        "recipe": [("rice", "Rice", "kg", 0.12), ("potato", "Potato", "kg", 0.10), ("oil", "Oil", "litres", 0.015)],
    },
    {
        "csv_column": "Item 2", "name": "Paneer Butter Masala", "unit": "servings",
        "recipe": [("paneer", "Paneer", "kg", 0.15), ("tomato", "Tomato", "pieces", 2), ("oil", "Oil", "litres", 0.02)],
    },
    {
        "csv_column": "Item 3", "name": "Veg Fried Rice", "unit": "servings",
        "recipe": [("rice", "Rice", "kg", 0.18), ("carrot", "Carrot", "kg", 0.06), ("onion", "Onion", "kg", 0.05), ("oil", "Oil", "litres", 0.02)],
    },
    {
        "csv_column": "Item 4", "name": "Chole Bhature", "unit": "plates",
        "recipe": [("flour", "Flour", "kg", 0.18), ("lentils", "Lentils", "kg", 0.15), ("oil", "Oil", "litres", 0.03)],
    },
    {
        "csv_column": "Item 5", "name": "Chicken Biryani", "unit": "servings",
        "recipe": [("rice", "Rice", "kg", 0.20), ("onion", "Onion", "kg", 0.06), ("carrot", "Carrot", "kg", 0.05), ("oil", "Oil", "litres", 0.02)],
    },
]


def _read_history(csv_path=DATA_FILE):
    with Path(csv_path).open(newline="", encoding="utf-8") as source:
        rows = list(csv.DictReader(source))
    if len(rows) < 7:
        raise ValueError("Forecast data must contain at least seven daily rows")
    return rows


def _forecast(values):
    """Forecast tomorrow from a weighted 7-day average and 30-day trend."""
    recent = values[-7:]
    weighted_average = sum(value * (index + 1) for index, value in enumerate(recent)) / sum(range(1, 8))
    count = len(values)
    mean_x = (count - 1) / 2
    mean_y = sum(values) / count
    denominator = sum((index - mean_x) ** 2 for index in range(count))
    slope = sum((index - mean_x) * (value - mean_y) for index, value in enumerate(values)) / denominator
    return max(0, round(weighted_average + slope))


def build_forecast(csv_path=DATA_FILE):
    """Return preparation and raw-material recommendations for five dishes."""
    rows = _read_history(csv_path)
    dishes = []
    materials = {}
    daily_dish_totals = [0] * len(rows)

    for dish in DISHES:
        values = [float(row[dish["csv_column"]]) for row in rows]
        daily_dish_totals = [total + value for total, value in zip(daily_dish_totals, values)]
        predicted = _forecast(values)
        buffer = max(2, math.ceil(predicted * 0.10))
        prepare = predicted + buffer
        dishes.append({
            "name": dish["name"],
            "unit": dish["unit"],
            "history_column": dish["csv_column"],
            "average_daily_orders": round(sum(values) / len(values), 1),
            "forecast_orders": predicted,
            "safety_buffer": buffer,
            "prepare_quantity": prepare,
        })
        for material_id, name, unit, per_serving in dish["recipe"]:
            key = (material_id, unit)
            materials[key] = materials.get(key, {"id": material_id, "name": name, "unit": unit, "quantity": 0})
            materials[key]["quantity"] += prepare * per_serving

    raw_materials = [
        {**material, "quantity": round(material["quantity"], 2)}
        for material in materials.values()
    ]
    raw_materials.sort(key=lambda material: material["name"])
    crowd_history = [
        {
            "day": str(row.get("Day") or f"Day {index + 1}"),
            "actual": round(total / AVERAGE_DISHES_PER_DINER),
        }
        for index, (row, total) in enumerate(zip(rows, daily_dish_totals))
    ]
    forecast_diners = round(sum(dish["forecast_orders"] for dish in dishes) / AVERAGE_DISHES_PER_DINER)
    uncertainty = max(3, math.ceil(forecast_diners * 0.12))
    return {
        "model": "weighted 7-day average with 30-day linear trend",
        "data_points": len(rows),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "dishes": dishes,
        "raw_materials": raw_materials,
        "crowd": {
            "unit": "estimated diners",
            "average_dishes_per_diner": AVERAGE_DISHES_PER_DINER,
            "forecast": forecast_diners,
            "lower": max(0, forecast_diners - uncertainty),
            "upper": forecast_diners + uncertainty,
            "history": crowd_history,
        },
    }

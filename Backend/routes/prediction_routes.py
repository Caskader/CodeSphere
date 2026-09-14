"""Admin endpoint for demand and raw-material predictions."""

from flask import Blueprint, jsonify

from forecasting import build_forecast
from utils.auth_middleware import admin_required


prediction_bp = Blueprint("predictions", __name__, url_prefix="/api/predictions")


@prediction_bp.route("/monthly-demand", methods=["GET"])
@admin_required
def monthly_demand():
    try:
        return jsonify(build_forecast()), 200
    except (OSError, ValueError, KeyError) as error:
        return jsonify({"error": f"Could not build forecast: {error}"}), 500

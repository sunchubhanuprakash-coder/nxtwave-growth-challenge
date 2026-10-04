"""
Phase 15 Test Suite: Advanced Intelligence Engine
=================================================
Validates the explainable artificial intelligence, predictive scoring,
insufficient data safety guards, and 9 intelligence features:
1. Registration forecasting
2. Channel recommendation
3. Student segmentation (AI Curious, Project Builder, Placement Focused, Career Explorer)
4. Lead scoring
5. Anomaly detection
6. AI campaign strategist
7. AI copy optimizer
8. Referral propensity
9. College opportunity scoring
"""

import pytest
from fastapi.testclient import TestClient
from database.session import SessionLocal
from database.models import Campaign, Registration, Student, College, CampaignSource
from analytics.intelligence import AdvancedIntelligenceEngine
from backend.app.main import app

client = TestClient(app)


def test_explainable_structure_across_all_features():
    """
    Verifies that every prediction contains:
    - input_signals
    - score
    - reason
    - confidence
    """
    db = SessionLocal()
    try:
        summary = AdvancedIntelligenceEngine.get_full_intelligence_summary(db)
        features = [
            summary["forecasting"],
            summary["channel_recommendations"],
            summary["segmentation"],
            summary["lead_scoring"],
            summary["anomaly_detection"],
            summary["campaign_strategist"],
            summary["copy_optimizer"],
            summary["referral_propensity"],
            summary["college_opportunities"],
        ]

        for feat in features:
            assert "input_signals" in feat, f"Missing input_signals in {feat.get('feature')}"
            assert "score" in feat, f"Missing score in {feat.get('feature')}"
            assert "reason" in feat, f"Missing reason in {feat.get('feature')}"
            assert "confidence" in feat, f"Missing confidence in {feat.get('feature')}"
            assert isinstance(feat["input_signals"], dict), f"input_signals must be a dict in {feat.get('feature')}"
            assert len(feat["reason"]) >= 10, f"Reason too brief in {feat.get('feature')}"
            assert feat["confidence"] in ("HIGH", "MEDIUM", "LOW", "INSUFFICIENT_DATA")
    finally:
        db.close()


def test_student_segmentation_covers_all_4_segments():
    """
    Verifies student segmentation identifies the 4 required segments:
    AI Curious, Project Builder, Placement Focused, Career Explorer.
    """
    db = SessionLocal()
    try:
        res = AdvancedIntelligenceEngine.segment_students(db)
        assert res["feature"] == "student_segmentation"
        assert "segments" in res
        expected_segments = {"AI Curious", "Project Builder", "Placement Focused", "Career Explorer"}
        assert set(res["segments"].keys()) == expected_segments

        # Verify each segment contains key marketing hooks and persona definitions
        for seg_name, seg_data in res["segments"].items():
            assert "count" in seg_data
            assert "percentage" in seg_data
            assert "primary_persona" in seg_data
            assert "key_messaging_hook" in seg_data
    finally:
        db.close()


def test_insufficient_data_safety_guard():
    """
    Verifies that when data is insufficient (e.g. fresh database with 0 records),
    the system explicitly outputs 'Insufficient data for reliable prediction.'
    and does NOT fabricate certainty.
    """
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from database.base import Base

    mem_engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(mem_engine)
    MemSession = sessionmaker(bind=mem_engine)
    empty_db = MemSession()

    try:
        # 1. Forecasting guard
        f_res = AdvancedIntelligenceEngine.forecast_registrations(empty_db)
        assert f_res["confidence"] == "INSUFFICIENT_DATA"
        assert "Insufficient data for reliable prediction." in f_res["reason"]

        # 2. Channel recommendation guard
        c_res = AdvancedIntelligenceEngine.recommend_channels(empty_db)
        assert c_res["confidence"] == "INSUFFICIENT_DATA"
        assert "Insufficient data for reliable prediction." in c_res["reason"]

        # 3. Student segmentation guard
        s_res = AdvancedIntelligenceEngine.segment_students(empty_db)
        assert s_res["confidence"] == "INSUFFICIENT_DATA"
        assert "Insufficient data for reliable prediction." in s_res["reason"]

        # 4. Lead scoring guard
        l_res = AdvancedIntelligenceEngine.score_leads(empty_db)
        assert l_res["confidence"] == "INSUFFICIENT_DATA"
        assert "Insufficient data for reliable prediction." in l_res["reason"]

        # 5. Anomaly detection guard
        a_res = AdvancedIntelligenceEngine.detect_anomalies(empty_db)
        assert a_res["confidence"] == "INSUFFICIENT_DATA"
        assert "Insufficient data for reliable prediction." in a_res["reason"]

        # 6. Referral propensity guard
        r_res = AdvancedIntelligenceEngine.score_referral_propensity(empty_db)
        assert r_res["confidence"] == "INSUFFICIENT_DATA"
        assert "Insufficient data for reliable prediction." in r_res["reason"]

        # 7. College opportunity guard
        col_res = AdvancedIntelligenceEngine.score_college_opportunities(empty_db)
        assert col_res["confidence"] == "INSUFFICIENT_DATA"
        assert "Insufficient data for reliable prediction." in col_res["reason"]
    finally:
        empty_db.close()


def test_copy_optimizer_scores_and_generates_segment_variations():
    """
    Verifies AI copy optimizer computes explainable linguistic signals
    and generates customized copy variations for all 4 segments.
    """
    db = SessionLocal()
    try:
        sample = (
            "Hi {{name}}! 🚀 Build and deploy your first live AI project in 60 minutes for your resume. "
            "Only 40 seats left for final year students! Register now: {{referral_link}}"
        )
        res = AdvancedIntelligenceEngine.optimize_copy(db, sample_copy=sample)
        assert res["feature"] == "ai_copy_optimizer"
        assert res["score"] >= 80.0
        assert res["input_signals"]["has_action_cta"] is True
        assert res["input_signals"]["has_urgency_keywords"] is True
        assert res["input_signals"]["has_outcome_promise"] is True
        assert res["confidence"] == "HIGH"

        # Verify segment variations
        variations = res["segmentations_variations"] if "segmentations_variations" in res else res["segment_variations"]
        assert "Placement Focused" in variations
        assert "Project Builder" in variations
        assert "AI Curious" in variations
        assert "Career Explorer" in variations
    finally:
        db.close()


def test_api_intelligence_endpoints():
    """
    Verifies all 10 Phase 15 REST endpoints return HTTP 200 with valid schema.
    """
    # 1. Summary
    resp_sum = client.get("/api/intelligence/summary")
    assert resp_sum.status_code == 200
    data = resp_sum.json()
    assert "forecasting" in data
    assert "segmentation" in data
    assert "lead_scoring" in data

    # 2. Individual sub-endpoints
    endpoints = [
        "/api/intelligence/forecasting",
        "/api/intelligence/channels",
        "/api/intelligence/segmentation",
        "/api/intelligence/leads",
        "/api/intelligence/anomalies",
        "/api/intelligence/strategy",
        "/api/intelligence/referral-propensity",
        "/api/intelligence/colleges",
    ]
    for ep in endpoints:
        r = client.get(ep)
        assert r.status_code == 200, f"Endpoint {ep} failed with {r.status_code}"
        json_data = r.json()
        assert "input_signals" in json_data
        assert "score" in json_data
        assert "reason" in json_data
        assert "confidence" in json_data

    # 3. Copy optimizer POST
    post_resp = client.post("/api/intelligence/copy-optimizer", json={"copy_text": "Deploy live AI app URL now"})
    assert post_resp.status_code == 200
    post_data = post_resp.json()
    assert post_data["feature"] == "ai_copy_optimizer"
    assert "score" in post_data
    assert "segment_variations" in post_data

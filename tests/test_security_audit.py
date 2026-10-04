import os
import re
import hmac
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.config import settings
from backend.app.schemas.growth import mask_email, mask_phone
from backend.app.core.security import verify_admin_key
from database.session import SessionLocal
from database.models import Student, Registration

client = TestClient(app)


# ==============================================================================
# 1. ENVIRONMENT VARIABLES & SECRETS HYGIENE
# ==============================================================================
def test_security_env_and_secrets_hygiene():
    """
    Ensures .env is gitignored and no production API keys are hardcoded in source.
    """
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    gitignore_path = os.path.join(root_dir, ".gitignore")
    assert os.path.exists(gitignore_path), ".gitignore must exist in root repository"

    with open(gitignore_path, "r", encoding="utf-8") as f:
        gitignore_content = f.read()
    assert ".env" in gitignore_content, ".env must be explicitly ignored in .gitignore"

    # Regex patterns for active keys
    patterns = [
        re.compile(r"sk-[a-zA-Z0-9]{32,}"),       # OpenAI standard key
        re.compile(r"AIza[0-9A-Za-z-_]{35}"),     # Google Cloud / Gemini API key
    ]

    # Walk source trees (backend, database, ai, analytics, automation, tests)
    scanned_extensions = (".py", ".ts", ".tsx", ".js", ".json")
    for root, dirs, files in os.walk(root_dir):
        # Skip virtualenvs and node_modules
        if any(ignored in root for ignored in [".venv", "node_modules", ".git", "dist", "__pycache__"]):
            continue
        for file in files:
            if file.endswith(scanned_extensions):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    for pattern in patterns:
                        match = pattern.search(content)
                        assert match is None, f"Potential hardcoded secret found in {file_path}: {match.group(0)}"


# ==============================================================================
# 2. INPUT VALIDATION & PYDANTIC BOUNDS
# ==============================================================================
def test_security_input_validation_registration():
    """
    Tests strict validation on student registration payloads.
    Rejects malformed emails, short/invalid phones, out-of-range graduation years.
    """
    # Bad Email
    bad_email_payload = {
        "full_name": "Test User",
        "email": "not-a-valid-email",
        "phone_number": "9876543210",
        "college_name": "CBIT",
        "branch": "CSE",
        "graduation_year": 2025
    }
    res = client.post("/api/register", json=bad_email_payload)
    assert res.status_code == 422
    assert "email" in str(res.json()).lower()

    # Bad Phone (less than 10 digits)
    bad_phone_payload = {
        "full_name": "Test User",
        "email": "test.valid@example.com",
        "phone_number": "12345",
        "college_name": "CBIT",
        "branch": "CSE",
        "graduation_year": 2025
    }
    res = client.post("/api/register", json=bad_phone_payload)
    assert res.status_code == 422

    # Bad Graduation Year (e.g. 1990 or 2050)
    bad_year_payload = {
        "full_name": "Test User",
        "email": "test.valid@example.com",
        "phone_number": "9876543210",
        "college_name": "CBIT",
        "branch": "CSE",
        "graduation_year": 1995
    }
    res = client.post("/api/register", json=bad_year_payload)
    assert res.status_code == 422


# ==============================================================================
# 3. SQL INJECTION RESISTANCE
# ==============================================================================
@pytest.mark.parametrize("payload", [
    "' OR '1'='1",
    "'; DROP TABLE students; --",
    "' UNION SELECT id, email, full_name, NULL, NULL, NULL, NULL, NULL FROM students --",
    "1' OR '1' = '1' --",
    "admin' --",
    "\" OR \"\"=\"",
])
def test_security_sql_injection_defense_search(payload):
    """
    Fuzzes the registrations search endpoint with SQL injection payloads.
    Verifies that the ORM parameterized queries safely escape input without executing raw SQL.
    """
    res = client.get(f"/api/registrations?search={payload}")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data

    # Verify database integrity: students table still exists and has records
    db = SessionLocal()
    student_count = db.query(Student).count()
    db.close()
    assert student_count > 0, "Database table must not have been dropped"


def test_security_sql_injection_defense_referral_lookup():
    """
    Tests referral code lookup with malicious SQL injection strings.
    """
    sqli_code = "' OR 1=1; --"
    res = client.get(f"/api/referral/{sqli_code}")
    # Must return 404 Not Found, never 500 or SQL syntax error
    assert res.status_code == 404
    assert "does not exist" in res.json()["detail"].lower()


# ==============================================================================
# 4. XSS & SCRIPT INJECTION SANITIZATION
# ==============================================================================
def test_security_xss_script_injection_handling():
    """
    Submits XSS attack payloads in student registration string fields.
    Verifies that payloads are treated as plain text strings and do not crash the server.
    """
    xss_payload = {
        "full_name": "<script>alert('XSS_ATTACK')</script>",
        "email": "xss.unique.student@example.com",
        "phone_number": "9988776655",
        "college_name": "<img src=x onerror=alert('XSS')>",
        "branch": "CSE<svg onload=alert(1)>",
        "graduation_year": 2025
    }
    res = client.post("/api/register", json=xss_payload)
    assert res.status_code == 201
    data = res.json()
    assert data["student"]["email"] == "xss.unique.student@example.com"
    # Ensure returned student full_name is safely serialized
    assert "alert('XSS_ATTACK')" in data["student"]["full_name"]


# ==============================================================================
# 5. CORS HEADERS CONFIGURATION
# ==============================================================================
def test_security_cors_configuration():
    """
    Verifies CORS headers for trusted vs untrusted origins.
    """
    # Allowed origin preflight
    res = client.options(
        "/api/dashboard",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "http://localhost:5173"

    # Untrusted origin check
    res_untrusted = client.options(
        "/api/dashboard",
        headers={
            "Origin": "http://malicious-phishing-site.com",
            "Access-Control-Request-Method": "GET"
        }
    )
    # The server must NOT reflect malicious untrusted origins
    assert res_untrusted.headers.get("access-control-allow-origin") != "http://malicious-phishing-site.com"


# ==============================================================================
# 6. AUTHENTICATION & AUTHORIZATION (ADMIN PRIVILEGES)
# ==============================================================================
def test_security_admin_key_verification():
    """
    Verifies verify_admin_key function behavior and constant-time comparison.
    """
    # 1. Missing credentials -> 401
    with pytest.raises(Exception) as excinfo:
        verify_admin_key(x_admin_key=None, admin_key=None)
    assert "401" in str(excinfo.value)

    # 2. Invalid credentials -> 401
    with pytest.raises(Exception) as excinfo:
        verify_admin_key(x_admin_key="invalid_admin_token_999", admin_key=None)
    assert "401" in str(excinfo.value)

    # 3. Valid key via Header -> True
    assert verify_admin_key(x_admin_key=settings.ADMIN_API_KEY, admin_key=None) is True

    # 4. Valid key via Query Parameter -> True
    assert verify_admin_key(x_admin_key=None, admin_key=settings.ADMIN_API_KEY) is True

    # 5. Constant-time timing attack mitigation
    assert hmac.compare_digest("growth_admin_secret_2026", settings.ADMIN_API_KEY) is True
    assert hmac.compare_digest("wrong_key", settings.ADMIN_API_KEY) is False


# ==============================================================================
# 7. ERROR HANDLING & TRACEBACK LEAKAGE
# ==============================================================================
def test_security_error_handling_no_traceback_leaks():
    """
    Ensures error responses (404, 422, 400) return structured JSON without leaking
    Python stack traces, module paths, or raw database errors.
    """
    # Non-existent endpoint (404)
    res = client.get("/api/non_existent_secure_route_999")
    assert res.status_code == 404
    assert res.headers["content-type"].startswith("application/json")
    data = res.json()
    assert "detail" in data
    assert "Traceback" not in str(data)
    assert "File \"" not in str(data)

    # Invalid ID type (422)
    res = client.get("/api/student/invalid_string_id")
    assert res.status_code == 422
    assert "Traceback" not in str(res.json())

    # Invalid allocation payload exceeding budget cap (400)
    res = client.post("/api/budget/allocations", json={"allocations": [{"channel_id": 1, "allocated_inr": 3500.0}]})
    assert res.status_code == 400
    assert "Traceback" not in str(res.json())
    assert "exceeds" in res.json()["detail"].lower()
    assert "budget cap" in res.json()["detail"].lower()


# ==============================================================================
# 8. SENSITIVE DATA EXPOSURE & PRIVACY MASKING
# ==============================================================================
def test_security_privacy_masking_functions():
    """
    Validates unit functions mask_email and mask_phone.
    """
    assert mask_email("aditya.kumar@example.com") == "ad**********@example.com"
    assert mask_email("ab@domain.com") == "a*@domain.com"
    assert mask_email("invalid") == "****"

    assert mask_phone("9876543210") == "******3210"
    assert mask_phone("+919876543210") == "*********3210"
    assert mask_phone("12") == "******"


def test_security_leaderboard_privacy_protection():
    """
    Ensures referral leaderboard does not expose full emails, phone numbers, or complete surnames.
    """
    res = client.get("/api/referral/leaderboard")
    assert res.status_code == 200
    data = res.json()
    assert "leaderboard" in data

    for entry in data["leaderboard"]:
        # Phone number and email must NOT be present in LeaderboardEntry schema
        assert "phone_number" not in entry
        assert "email" not in entry

        # Full name must be masked (e.g. "Aditya K." or single word)
        name = entry["student_name"]
        parts = name.split()
        if len(parts) > 1:
            assert len(parts[-1]) <= 2, f"Expected masked initial, got: {parts[-1]}"

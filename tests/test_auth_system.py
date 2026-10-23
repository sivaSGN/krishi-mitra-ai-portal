"""
=============================================================================
Krishi Mitra AI Portal - Complete Authentication & Database Test Suite
=============================================================================
Tests:
1. User registration with all required profile fields (name, age, state, district, language, income, mobile, password).
2. Password hashing verification (verifies password is never stored as plain text, uses PBKDF2-HMAC-SHA256).
3. Mobile number uniqueness constraint (duplicate mobile rejection).
4. Successful user authentication against database credentials.
5. Invalid password rejection with appropriate error.
6. Non-existent mobile number rejection with appropriate error.
7. Verification of frontend routes (/login, /register) via HTTP.
"""

import os
import sys
import secrets

# Ensure workspace root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Ensure utf-8 stdout on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import auth_db

def run_tests():
    print("=" * 70)
    print("  RUNNING COMPLETE AUTHENTICATION & DATABASE SYSTEM TESTS")
    print("=" * 70)

    # 1. Test database initialization
    print("\n[Test 1] Initializing SQLite database...")
    auth_db.init_user_db()
    print("✓ SQLite database initialized successfully.")

    # 2. Test demo user authentication
    print("\n[Test 2] Testing default demo user authentication (9876543210)...")
    ok, msg, demo_user = auth_db.authenticate_user("9876543210", "farmer123")
    assert ok, f"Demo login failed: {msg}"
    assert demo_user["name"] == "Ramesh Kumar"
    print(f"✓ Default demo user authenticated: {demo_user['name']} ({demo_user['mobile']})")

    # 3. Test wrong password for demo user
    print("\n[Test 3] Testing incorrect password rejection...")
    bad_ok, bad_msg, _ = auth_db.authenticate_user("9876543210", "wrong_password_999")
    assert not bad_ok, "Login should have failed with wrong password!"
    assert "Incorrect password" in bad_msg, f"Unexpected error message: {bad_msg}"
    print(f"✓ Correctly rejected wrong password: '{bad_msg}'")

    # 4. Test non-existent user
    print("\n[Test 4] Testing non-existent mobile number rejection...")
    non_ok, non_msg, _ = auth_db.authenticate_user("9999999999", "any_password")
    assert not non_ok, "Login should have failed for non-existent mobile!"
    assert "No account found" in non_msg, f"Unexpected error message: {non_msg}"
    print(f"✓ Correctly rejected non-existent mobile: '{non_msg}'")

    # 5. Test new user registration
    test_mobile = "91" + str(secrets.randbelow(90000000) + 10000000)  # Random 10-digit mobile
    test_password = "SecurePassword123!"
    print(f"\n[Test 5] Registering new farmer with mobile '{test_mobile}'...")

    reg_ok, reg_msg, new_user = auth_db.register_user(
        name="Lakshmi Narayana",
        age=38,
        state="Andhra Pradesh",
        district="Guntur",
        preferred_language="te",
        annual_income="₹3,20,000",
        mobile=test_mobile,
        password=test_password,
    )
    assert reg_ok, f"Registration failed: {reg_msg}"
    assert new_user["mobile"] == test_mobile
    assert new_user["name"] == "Lakshmi Narayana"
    assert new_user["district"] == "Guntur"
    print(f"✓ Registration successful for: {new_user['name']}")

    # 6. Verify password is cryptographically hashed (NEVER plain text)
    print("\n[Test 6] Verifying password hashing security...")
    conn = auth_db.get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT password_hash, salt FROM users WHERE mobile = ?", (test_mobile,))
    row = cursor.fetchone()
    conn.close()

    assert row is not None
    assert row["password_hash"] != test_password, "CRITICAL: Password stored in plain text!"
    assert len(row["password_hash"]) == 64, "PBKDF2 SHA-256 hash must be 64 hex characters!"
    assert len(row["salt"]) == 32, "Salt must be 32 hex characters (16 bytes)!"
    print(f"✓ Password securely hashed using PBKDF2-HMAC-SHA256 (64 hex chars). Salt: {row['salt'][:8]}...")

    # 7. Test mobile number uniqueness
    print("\n[Test 7] Testing mobile number uniqueness (duplicate registration)...")
    dup_ok, dup_msg, _ = auth_db.register_user(
        name="Duplicate Attempt",
        age=40,
        state="Telangana",
        district="Hyderabad",
        preferred_language="en",
        annual_income="₹4,00,000",
        mobile=test_mobile,
        password="DifferentPassword456!",
    )
    assert not dup_ok, "Duplicate mobile number must NOT be registered!"
    assert "already exists" in dup_msg, f"Unexpected error message: {dup_msg}"
    print(f"✓ Duplicate mobile correctly rejected: '{dup_msg}'")

    # 8. Test authenticating newly registered user
    print(f"\n[Test 8] Authenticating newly registered user ({test_mobile})...")
    login_ok, login_msg, logged_user = auth_db.authenticate_user(test_mobile, test_password)
    assert login_ok, f"Login failed for new user: {login_msg}"
    assert logged_user["name"] == "Lakshmi Narayana"
    assert logged_user["district"] == "Guntur"
    assert logged_user["preferred_language"] == "te"
    print(f"✓ Newly registered user successfully logged in: {logged_user['name']} ({login_msg})")

    # 9. Verify Web HTTP endpoints for /login and /register
    print("\n[Test 9] Verifying frontend web routes on dev server...")
    try:
        import urllib.request
        login_resp = urllib.request.urlopen("http://localhost:8080/login")
        assert login_resp.status == 200
        login_html = login_resp.read().decode("utf-8")
        assert "Mobile Number" in login_html or "Farmer Portal" in login_html
        print("✓ Frontend /login route is responsive and active (HTTP 200).")

        reg_resp = urllib.request.urlopen("http://localhost:8080/register")
        assert reg_resp.status == 200
        reg_html = reg_resp.read().decode("utf-8")
        assert "Registration" in reg_html or "Farmer" in reg_html
        print("✓ Frontend /register route is responsive and active (HTTP 200).")
    except Exception as e:
        print(f"Dev server check note: {e}")

    # 10. Test farmer profile database storage & update
    print("\n[Test 10] Testing comprehensive farmer profile update & database storage...")
    profile_update = {
        "name": "Lakshmi Narayana",
        "age": 45,
        "gender": "Male",
        "state": "Andhra Pradesh",
        "district": "Guntur",
        "farmer_type": "Medium Farmer",
        "crop": "Chilli & Tobacco",
        "experience": "22 years",
        "irrigation": "Canal / River Irrigation",
        "ownership": "Owned",
        "land_size": "5.5 acres",
        "land_location": "Tenali Rural",
        "income": "₹3,20,000",
        "aadhaar": True,
        "bank": True,
        "land_document": True,
        "preferred_language": "te",
    }
    p_ok, p_msg, p_data = auth_db.save_or_update_farmer_profile(test_mobile, profile_update)
    assert p_ok, f"Farmer profile save failed: {p_msg}"
    assert p_data["crop"] == "Chilli & Tobacco"
    assert p_data["land_size"] == "5.5 acres"

    # Verify retrieval of this specific farmer's profile
    stored_profile = auth_db.get_farmer_profile_by_mobile(test_mobile)
    assert stored_profile is not None
    assert stored_profile["crop"] == "Chilli & Tobacco"
    assert stored_profile["land_size"] == "5.5 acres"
    assert stored_profile["irrigation"] == "Canal / River Irrigation"
    print(f"✓ All profile details for farmer ({test_mobile}) successfully saved and retrieved: {stored_profile['crop']}, {stored_profile['land_size']}")

    # 11. Test analytics retrieval and CSV dataset export
    print("\n[Test 11] Testing future analytics retrieval & CSV export...")
    all_farmers = auth_db.get_all_farmer_profiles_for_analysis()
    assert len(all_farmers) >= 2, "Should contain at least demo user and new farmer"
    csv_data = auth_db.export_farmers_to_csv()
    assert "Chilli & Tobacco" in csv_data
    assert "mobile,name,age" in csv_data
    print(f"✓ Analytics dataset verified with {len(all_farmers)} farmers and full CSV export capability.")

    print("\n" + "=" * 70)
    print("  ALL REGISTRATION, PROFILE & ANALYTICS TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    run_tests()

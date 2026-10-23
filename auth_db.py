"""
=============================================================================
Krishi Mitra AI Portal - User Authentication & Database Module (auth_db.py)
=============================================================================
Provides persistent SQLite database storage, PBKDF2 password hashing,
user registration, and credential validation for the Farmer Portal.
"""

import os
import sqlite3
import hashlib
import secrets
import csv
import io
from typing import Optional, Tuple, Dict, Any, List

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "users.db")


def get_db_connection() -> sqlite3.Connection:
    """Returns a connection to the SQLite users database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    """
    Hashes a password using PBKDF2-HMAC-SHA256 with 100,000 iterations.
    Returns (hex_hash, salt).
    """
    if not salt:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000,
    )
    return key.hex(), salt


def verify_password(password: str, stored_hash: str, salt: str) -> bool:
    """Verifies a plain password against the stored PBKDF2 hash in constant time."""
    computed_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(computed_hash, stored_hash)


def init_user_db():
    """
    Initializes the SQLite users and farmer_profiles tables with all profile attributes
    for comprehensive farmer profiling and future agricultural data analysis.
    Performs safe in-place schema migration if columns do not yet exist.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Base users authentication table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mobile TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            age INTEGER NOT NULL,
            state TEXT NOT NULL,
            district TEXT NOT NULL,
            preferred_language TEXT NOT NULL,
            annual_income TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()

    # Safe schema migration for users table: add any missing profile fields
    cursor.execute("PRAGMA table_info(users)")
    existing_user_cols = {row["name"] for row in cursor.fetchall()}
    columns_to_add = [
        ("gender", "TEXT DEFAULT 'Male'"),
        ("farmer_type", "TEXT DEFAULT 'Small Farmer'"),
        ("crop", "TEXT DEFAULT 'Paddy & Cotton'"),
        ("experience", "TEXT DEFAULT '18 years'"),
        ("irrigation", "TEXT DEFAULT 'Borewell'"),
        ("ownership", "TEXT DEFAULT 'Owned'"),
        ("land_size", "TEXT DEFAULT '3.5 acres'"),
        ("land_location", "TEXT DEFAULT 'Warangal Rural'"),
        ("aadhaar", "INTEGER DEFAULT 1"),
        ("bank", "INTEGER DEFAULT 1"),
        ("land_document", "INTEGER DEFAULT 1"),
    ]
    for col_name, col_def in columns_to_add:
        if col_name not in existing_user_cols:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")
            conn.commit()

    # 2. Comprehensive farmer_profiles table dedicated to analytical storage & querying
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS farmer_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mobile TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            age INTEGER NOT NULL,
            gender TEXT DEFAULT 'Male',
            state TEXT NOT NULL,
            district TEXT NOT NULL,
            farmer_type TEXT DEFAULT 'Small Farmer',
            crop TEXT DEFAULT 'Paddy & Cotton',
            experience TEXT DEFAULT '18 years',
            irrigation TEXT DEFAULT 'Borewell',
            ownership TEXT DEFAULT 'Owned',
            land_size TEXT DEFAULT '3.5 acres',
            land_location TEXT DEFAULT 'Warangal Rural',
            income TEXT DEFAULT '₹1,80,000',
            aadhaar INTEGER DEFAULT 1,
            bank INTEGER DEFAULT 1,
            land_document INTEGER DEFAULT 1,
            preferred_language TEXT DEFAULT 'en',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()

    # 3. Check if default demo user (Ramesh Kumar - 9876543210) exists; if not, seed in both tables
    cursor.execute("SELECT id FROM users WHERE mobile = ?", ("9876543210",))
    if not cursor.fetchone():
        demo_hash, demo_salt = hash_password("farmer123")
        cursor.execute("""
            INSERT INTO users (
                mobile, name, age, state, district, preferred_language, annual_income, password_hash, salt,
                gender, farmer_type, crop, experience, irrigation, ownership, land_size, land_location,
                aadhaar, bank, land_document
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "9876543210", "Ramesh Kumar", 46, "Telangana", "Warangal", "en", "₹1,80,000", demo_hash, demo_salt,
            "Male", "Small Farmer", "Paddy & Cotton", "18 years", "Borewell", "Owned", "3.5 acres", "Warangal Rural",
            1, 1, 1
        ))
        conn.commit()

    # Also ensure Ramesh Kumar exists in farmer_profiles table
    cursor.execute("SELECT id FROM farmer_profiles WHERE mobile = ?", ("9876543210",))
    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO farmer_profiles (
                mobile, name, age, gender, state, district, farmer_type, crop, experience,
                irrigation, ownership, land_size, land_location, income, aadhaar, bank,
                land_document, preferred_language
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "9876543210", "Ramesh Kumar", 46, "Male", "Telangana", "Warangal", "Small Farmer",
            "Paddy & Cotton", "18 years", "Borewell", "Owned", "3.5 acres", "Warangal Rural",
            "₹1,80,000", 1, 1, 1, "en"
        ))
        conn.commit()

    conn.close()


def register_user(
    name: str,
    age: int,
    state: str,
    district: str,
    preferred_language: str,
    annual_income: str,
    mobile: str,
    password: str,
) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    """
    Registers a new user in the database.
    Enforces unique mobile number and hashes the password before saving.
    """
    clean_mobile = mobile.strip().replace(" ", "").replace("-", "")
    if clean_mobile.startswith("+91"):
        clean_mobile = clean_mobile[3:]
    if not clean_mobile.isdigit() or len(clean_mobile) != 10:
        return False, "Mobile number must be exactly 10 digits.", None

    if len(password.strip()) < 6:
        return False, "Password must be at least 6 characters.", None

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check uniqueness of mobile
    cursor.execute("SELECT id FROM users WHERE mobile = ?", (clean_mobile,))
    if cursor.fetchone():
        conn.close()
        return False, "An account with this mobile number already exists. Please sign in instead.", None

    pwd_hash, salt = hash_password(password)

    try:
        cursor.execute("""
            INSERT INTO users (
                name, age, state, district, preferred_language, annual_income, mobile, password_hash, salt,
                gender, farmer_type, crop, experience, irrigation, ownership, land_size, land_location,
                aadhaar, bank, land_document
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            name.strip(),
            int(age),
            state.strip(),
            district.strip(),
            preferred_language.strip(),
            annual_income.strip(),
            clean_mobile,
            pwd_hash,
            salt,
            "Male",
            "Small Farmer",
            "Paddy & Cotton",
            "10 years",
            "Borewell",
            "Owned",
            "2.5 acres",
            f"{district.strip()} Rural",
            1,
            1,
            1,
        ))
        conn.commit()
        user_id = cursor.lastrowid

        # Also insert initial record into farmer_profiles for future analysis
        cursor.execute("""
            INSERT OR REPLACE INTO farmer_profiles (
                mobile, name, age, gender, state, district, farmer_type, crop, experience,
                irrigation, ownership, land_size, land_location, income, aadhaar, bank,
                land_document, preferred_language
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            clean_mobile,
            name.strip(),
            int(age),
            "Male",
            state.strip(),
            district.strip(),
            "Small Farmer",
            "Paddy & Cotton",
            "10 years",
            "Borewell",
            "Owned",
            "2.5 acres",
            f"{district.strip()} Rural",
            annual_income.strip(),
            1,
            1,
            1,
            preferred_language.strip(),
        ))
        conn.commit()
        conn.close()

        user_data = {
            "id": user_id,
            "mobile": clean_mobile,
            "name": name.strip(),
            "age": int(age),
            "gender": "Male",
            "state": state.strip(),
            "district": district.strip(),
            "farmer_type": "Small Farmer",
            "crop": "Paddy & Cotton",
            "experience": "10 years",
            "irrigation": "Borewell",
            "ownership": "Owned",
            "land_size": "2.5 acres",
            "land_location": f"{district.strip()} Rural",
            "preferred_language": preferred_language.strip(),
            "annual_income": annual_income.strip(),
            "income": annual_income.strip(),
            "aadhaar": True,
            "bank": True,
            "land_document": True,
        }
        return True, "Registration successful!", user_data
    except Exception as e:
        conn.close()
        return False, f"Database error during registration: {str(e)}", None


def authenticate_user(mobile: str, password: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    """
    Authenticates a user by validating their mobile number and password against the database.
    Returns their full profile details.
    """
    clean_mobile = mobile.strip().replace(" ", "").replace("-", "")
    if clean_mobile.startswith("+91"):
        clean_mobile = clean_mobile[3:]

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT u.*, fp.gender as fp_gender, fp.farmer_type as fp_type, fp.crop as fp_crop,
               fp.experience as fp_exp, fp.irrigation as fp_irr, fp.ownership as fp_own,
               fp.land_size as fp_size, fp.land_location as fp_loc, fp.income as fp_inc,
               fp.aadhaar as fp_aadhaar, fp.bank as fp_bank, fp.land_document as fp_doc
        FROM users u
        LEFT JOIN farmer_profiles fp ON u.mobile = fp.mobile
        WHERE u.mobile = ?
    """, (clean_mobile,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return False, "No account found with this mobile number. Please register first.", None

    if not verify_password(password, row["password_hash"], row["salt"]):
        return False, "Incorrect password. Please verify and try again.", None

    user_data = {
        "id": row["id"],
        "mobile": row["mobile"],
        "name": row["name"],
        "age": row["age"],
        "gender": row["fp_gender"] or row["gender"] or "Male",
        "state": row["state"],
        "district": row["district"],
        "farmer_type": row["fp_type"] or row["farmer_type"] or "Small Farmer",
        "crop": row["fp_crop"] or row["crop"] or "Paddy & Cotton",
        "experience": row["fp_exp"] or row["experience"] or "18 years",
        "irrigation": row["fp_irr"] or row["irrigation"] or "Borewell",
        "ownership": row["fp_own"] or row["ownership"] or "Owned",
        "land_size": row["fp_size"] or row["land_size"] or "3.5 acres",
        "land_location": row["fp_loc"] or row["land_location"] or f"{row['district']} Rural",
        "annual_income": row["annual_income"],
        "income": row["fp_inc"] or row["annual_income"],
        "aadhaar": bool(row["fp_aadhaar"] if row["fp_aadhaar"] is not None else row["aadhaar"]),
        "bank": bool(row["fp_bank"] if row["fp_bank"] is not None else row["bank"]),
        "land_document": bool(row["fp_doc"] if row["fp_doc"] is not None else row["land_document"]),
        "preferred_language": row["preferred_language"],
    }
    return True, "Authentication successful!", user_data


def get_user_by_mobile(mobile: str) -> Optional[Dict[str, Any]]:
    """Retrieves complete user profile details by mobile number."""
    return get_farmer_profile_by_mobile(mobile)


def save_or_update_farmer_profile(
    mobile: str,
    profile_data: Dict[str, Any],
) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    """
    Saves or updates all details for a specific farmer in both users and farmer_profiles
    tables for persistent storage and future analysis.
    """
    clean_mobile = mobile.strip().replace(" ", "").replace("-", "")
    if clean_mobile.startswith("+91"):
        clean_mobile = clean_mobile[3:]

    if not clean_mobile or len(clean_mobile) != 10:
        return False, "Invalid mobile number. Must be 10 digits.", None

    name = str(profile_data.get("name") or "Farmer").strip()
    try:
        age = int(profile_data.get("age", 42))
    except (ValueError, TypeError):
        age = 42

    gender = str(profile_data.get("gender") or "Male").strip()
    state = str(profile_data.get("state") or "Telangana").strip()
    district = str(profile_data.get("district") or "Warangal").strip()
    farmer_type = str(profile_data.get("farmer_type") or profile_data.get("farmerType") or "Small Farmer").strip()
    crop = str(profile_data.get("crop") or "Paddy & Cotton").strip()
    experience = str(profile_data.get("experience") or "15 years").strip()
    irrigation = str(profile_data.get("irrigation") or "Borewell").strip()
    ownership = str(profile_data.get("ownership") or "Owned").strip()
    land_size = str(profile_data.get("land_size") or profile_data.get("landSize") or "3.5 acres").strip()
    land_location = str(profile_data.get("land_location") or profile_data.get("landLocation") or f"{district} Rural").strip()
    income = str(profile_data.get("income") or profile_data.get("annual_income") or "₹1,80,000").strip()
    aadhaar = 1 if profile_data.get("aadhaar") else 0
    bank = 1 if profile_data.get("bank") else 0
    land_document = 1 if profile_data.get("land_document") or profile_data.get("landDocument") else 0
    preferred_language = str(profile_data.get("preferred_language") or profile_data.get("language") or "en").strip()

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 1. Update farmer_profiles table (Insert or Replace)
        cursor.execute("""
            INSERT INTO farmer_profiles (
                mobile, name, age, gender, state, district, farmer_type, crop, experience,
                irrigation, ownership, land_size, land_location, income, aadhaar, bank,
                land_document, preferred_language, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(mobile) DO UPDATE SET
                name = excluded.name,
                age = excluded.age,
                gender = excluded.gender,
                state = excluded.state,
                district = excluded.district,
                farmer_type = excluded.farmer_type,
                crop = excluded.crop,
                experience = excluded.experience,
                irrigation = excluded.irrigation,
                ownership = excluded.ownership,
                land_size = excluded.land_size,
                land_location = excluded.land_location,
                income = excluded.income,
                aadhaar = excluded.aadhaar,
                bank = excluded.bank,
                land_document = excluded.land_document,
                preferred_language = excluded.preferred_language,
                updated_at = CURRENT_TIMESTAMP
        """, (
            clean_mobile, name, age, gender, state, district, farmer_type, crop, experience,
            irrigation, ownership, land_size, land_location, income, aadhaar, bank,
            land_document, preferred_language
        ))

        # 2. Also keep users table updated in sync
        cursor.execute("""
            UPDATE users SET
                name = ?, age = ?, gender = ?, state = ?, district = ?, farmer_type = ?,
                crop = ?, experience = ?, irrigation = ?, ownership = ?, land_size = ?,
                land_location = ?, annual_income = ?, aadhaar = ?, bank = ?, land_document = ?,
                preferred_language = ?, updated_at = CURRENT_TIMESTAMP
            WHERE mobile = ?
        """, (
            name, age, gender, state, district, farmer_type,
            crop, experience, irrigation, ownership, land_size,
            land_location, income, aadhaar, bank, land_document,
            preferred_language, clean_mobile
        ))

        conn.commit()
        conn.close()

        updated_profile = {
            "mobile": clean_mobile,
            "name": name,
            "age": age,
            "gender": gender,
            "state": state,
            "district": district,
            "farmer_type": farmer_type,
            "farmerType": farmer_type,
            "crop": crop,
            "experience": experience,
            "irrigation": irrigation,
            "ownership": ownership,
            "land_size": land_size,
            "landSize": land_size,
            "land_location": land_location,
            "landLocation": land_location,
            "income": income,
            "annual_income": income,
            "aadhaar": bool(aadhaar),
            "bank": bool(bank),
            "land_document": bool(land_document),
            "landDocument": bool(land_document),
            "preferred_language": preferred_language,
        }
        return True, "Farmer profile successfully updated in database.", updated_profile

    except Exception as e:
        conn.close()
        return False, f"Failed to save farmer profile: {str(e)}", None


def get_farmer_profile_by_mobile(mobile: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves all stored details of a specific farmer by their mobile number.
    """
    clean_mobile = mobile.strip().replace(" ", "").replace("-", "")
    if clean_mobile.startswith("+91"):
        clean_mobile = clean_mobile[3:]

    conn = get_db_connection()
    cursor = conn.cursor()

    # Query farmer_profiles first, fallback to users
    cursor.execute("""
        SELECT * FROM farmer_profiles WHERE mobile = ?
    """, (clean_mobile,))
    row = cursor.fetchone()

    if not row:
        cursor.execute("SELECT * FROM users WHERE mobile = ?", (clean_mobile,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return None

    conn.close()

    return {
        "id": row["id"],
        "mobile": row["mobile"],
        "name": row["name"],
        "age": row["age"],
        "gender": row["gender"] if "gender" in row.keys() else "Male",
        "state": row["state"],
        "district": row["district"],
        "farmer_type": row["farmer_type"] if "farmer_type" in row.keys() else "Small Farmer",
        "farmerType": row["farmer_type"] if "farmer_type" in row.keys() else "Small Farmer",
        "crop": row["crop"] if "crop" in row.keys() else "Paddy & Cotton",
        "experience": row["experience"] if "experience" in row.keys() else "18 years",
        "irrigation": row["irrigation"] if "irrigation" in row.keys() else "Borewell",
        "ownership": row["ownership"] if "ownership" in row.keys() else "Owned",
        "land_size": row["land_size"] if "land_size" in row.keys() else "3.5 acres",
        "landSize": row["land_size"] if "land_size" in row.keys() else "3.5 acres",
        "land_location": row["land_location"] if "land_location" in row.keys() else f"{row['district']} Rural",
        "landLocation": row["land_location"] if "land_location" in row.keys() else f"{row['district']} Rural",
        "income": row["income"] if "income" in row.keys() else (row["annual_income"] if "annual_income" in row.keys() else "₹1,80,000"),
        "annual_income": row["income"] if "income" in row.keys() else (row["annual_income"] if "annual_income" in row.keys() else "₹1,80,000"),
        "aadhaar": bool(row["aadhaar"]) if "aadhaar" in row.keys() else True,
        "bank": bool(row["bank"]) if "bank" in row.keys() else True,
        "land_document": bool(row["land_document"]) if "land_document" in row.keys() else True,
        "landDocument": bool(row["land_document"]) if "land_document" in row.keys() else True,
        "preferred_language": row["preferred_language"] if "preferred_language" in row.keys() else "en",
        "created_at": row["created_at"] if "created_at" in row.keys() else None,
        "updated_at": row["updated_at"] if "updated_at" in row.keys() else None,
    }


def get_all_farmer_profiles_for_analysis() -> List[Dict[str, Any]]:
    """
    Returns all farmer profiles stored in the database for future analytics,
    crop distribution analysis, land ownership patterns, and subsidy targeting.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM farmer_profiles ORDER BY id DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        result.append({
            "id": r["id"],
            "mobile": r["mobile"],
            "name": r["name"],
            "age": r["age"],
            "gender": r["gender"],
            "state": r["state"],
            "district": r["district"],
            "farmer_type": r["farmer_type"],
            "crop": r["crop"],
            "experience": r["experience"],
            "irrigation": r["irrigation"],
            "ownership": r["ownership"],
            "land_size": r["land_size"],
            "land_location": r["land_location"],
            "income": r["income"],
            "aadhaar": bool(r["aadhaar"]),
            "bank": bool(r["bank"]),
            "land_document": bool(r["land_document"]),
            "preferred_language": r["preferred_language"],
            "created_at": r["created_at"],
            "updated_at": r["updated_at"],
        })
    return result


def export_farmers_to_csv() -> str:
    """
    Exports all farmer records as CSV format string for external analysis in
    Pandas, Excel, or BI tools.
    """
    farmers = get_all_farmer_profiles_for_analysis()
    output = io.StringIO()
    if not farmers:
        return "id,mobile,name,age,gender,state,district,farmer_type,crop,experience,irrigation,ownership,land_size,land_location,income,aadhaar,bank,land_document,preferred_language,created_at,updated_at\n"

    writer = csv.DictWriter(output, fieldnames=list(farmers[0].keys()))
    writer.writeheader()
    for f in farmers:
        writer.writerow(f)
    return output.getvalue()


# Auto-initialize DB on import
init_user_db()


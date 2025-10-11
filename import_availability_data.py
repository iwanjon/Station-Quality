#!/usr/bin/env python3
"""
Import Station Availability Data to Database
Imports JSON data (after conversion) into the availability table
"""

import json
import mysql.connector
from pathlib import Path
import argparse
from datetime import datetime
import sys

# Database configuration (with environment variable support)
import os

DB_CONFIG = {
    'host': os.getenv('MYSQL_HOST', 'localhost'),  # Changed from 'db' to 'localhost'
    'user': os.getenv('MYSQL_USER', 'root'),
    'password': os.getenv('MYSQL_PASS', 'admin'),
    'database': os.getenv('MYSQL_NAME', 'station_quality_control')
}

def connect_to_database():
    """Establish connection to MySQL database"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        print("✅ Successfully connected to database")
        return connection
    except mysql.connector.Error as err:
        print(f"❌ Database connection failed: {err}")
        return None

def validate_data_structure(data):
    """Validate that the JSON data has the expected structure"""
    required_fields = ['stasiun_id', 'tanggal', 'nilai_availability']
    
    if isinstance(data, list):
        # Check first few items
        sample_size = min(3, len(data))
        for i in range(sample_size):
            item = data[i]
            if not isinstance(item, dict):
                print(f"❌ Item {i} is not a dictionary")
                return False
            
            for field in required_fields:
                if field not in item:
                    print(f"❌ Missing required field '{field}' in item {i}")
                    return False
        
        print(f"✅ Data validation passed. Found {len(data)} records")
        return True
    else:
        print("❌ Data should be a list of objects")
        return False

def import_availability_data(json_file_path, batch_size=1000, dry_run=False):
    """
    Import availability data from JSON to database
    
    Args:
        json_file_path (str): Path to the converted JSON file
        batch_size (int): Number of records to insert per batch
        dry_run (bool): If True, only validate data without inserting
    """
    
    # Read JSON data
    try:
        with open(json_file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
        print(f"📁 Successfully loaded {json_file_path}")
    except Exception as e:
        print(f"❌ Error reading JSON file: {e}")
        return False
    
    # Validate data structure
    if not validate_data_structure(data):
        return False
    
    if dry_run:
        print("🔍 Dry run mode - Data validation completed successfully")
        print(f"📊 Would import {len(data)} availability records")
        return True
    
    # Connect to database
    connection = connect_to_database()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        # Prepare INSERT statement
        insert_query = """
        INSERT INTO availability (stasiun_id, tanggal, nilai_availability)
        VALUES (%s, %s, %s)
        """
        
        # Process data in batches
        total_records = len(data)
        inserted_count = 0
        error_count = 0
        
        print(f"🚀 Starting import of {total_records} records...")
        print(f"📦 Batch size: {batch_size}")
        
        for i in range(0, total_records, batch_size):
            batch = data[i:i + batch_size]
            batch_data = []
            
            for record in batch:
                try:
                    # Extract and validate data
                    stasiun_id = record.get('stasiun_id')
                    tanggal = record.get('tanggal')
                    nilai_availability = record.get('nilai_availability')
                    
                    # Basic validation
                    if stasiun_id is None or tanggal is None or nilai_availability is None:
                        error_count += 1
                        continue
                    
                    # Convert availability to float if it's string
                    if isinstance(nilai_availability, str):
                        nilai_availability = float(nilai_availability)
                    
                    batch_data.append((stasiun_id, tanggal, nilai_availability))
                    
                except (ValueError, TypeError) as e:
                    print(f"⚠️ Skipping invalid record: {record} - Error: {e}")
                    error_count += 1
                    continue
            
            # Insert batch
            if batch_data:
                try:
                    cursor.executemany(insert_query, batch_data)
                    connection.commit()
                    inserted_count += len(batch_data)
                    
                    # Progress indicator
                    progress = (i + len(batch)) / total_records * 100
                    print(f"📈 Progress: {progress:.1f}% ({inserted_count} inserted, {error_count} errors)")
                    
                except mysql.connector.Error as err:
                    print(f"❌ Batch insert failed: {err}")
                    connection.rollback()
                    return False
        
        # Final summary
        print("\n" + "=" * 60)
        print("📊 Import Summary:")
        print(f"   ✅ Successfully inserted: {inserted_count} records")
        print(f"   ❌ Errors/Skipped: {error_count} records")
        print(f"   📈 Success rate: {(inserted_count / total_records * 100):.1f}%")
        
        return True
        
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False
        
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("📡 Database connection closed")

def check_existing_data(stasiun_id=None, date_range=None):
    """Check existing availability data in database"""
    connection = connect_to_database()
    if not connection:
        return
    
    try:
        cursor = connection.cursor()
        
        # Build query
        query = "SELECT COUNT(*) FROM availability"
        params = []
        
        if stasiun_id:
            query += " WHERE stasiun_id = %s"
            params.append(stasiun_id)
        
        cursor.execute(query, params)
        count = cursor.fetchone()[0]
        
        print(f"📊 Existing availability records: {count}")
        
        # Get date range
        cursor.execute("SELECT MIN(tanggal), MAX(tanggal) FROM availability")
        date_range = cursor.fetchone()
        if date_range[0] and date_range[1]:
            print(f"📅 Date range: {date_range[0]} to {date_range[1]}")
        
    except mysql.connector.Error as err:
        print(f"❌ Error checking existing data: {err}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def main():
    parser = argparse.ArgumentParser(description='Import station availability data to database')
    parser.add_argument('json_file', help='Path to the converted JSON file')
    parser.add_argument('--batch-size', type=int, default=1000, help='Batch size for database inserts (default: 1000)')
    parser.add_argument('--dry-run', action='store_true', help='Validate data without importing')
    parser.add_argument('--check-existing', action='store_true', help='Check existing data in database')
    parser.add_argument('--db-host', default=os.getenv('MYSQL_HOST', 'localhost'), help='Database host')
    parser.add_argument('--db-user', default=os.getenv('MYSQL_USER', 'root'), help='Database user')
    parser.add_argument('--db-password', default=os.getenv('MYSQL_PASS', 'admin'), help='Database password')
    parser.add_argument('--db-name', default=os.getenv('MYSQL_NAME', 'station_quality_control'), help='Database name')
    
    args = parser.parse_args()
    
    # Update database config with command line arguments (only if provided)
    # Since defaults already use environment variables, we can safely update
    DB_CONFIG.update({
        'host': args.db_host,
        'user': args.db_user,
        'password': args.db_password,
        'database': args.db_name
    })
    
    print("🗄️ Station Availability Database Importer")
    print("=" * 60)
    
    if args.check_existing:
        check_existing_data()
        return
    
    # Check if JSON file exists
    json_path = Path(args.json_file)
    if not json_path.exists():
        print(f"❌ JSON file not found: {args.json_file}")
        sys.exit(1)
    
    # Import data
    success = import_availability_data(
        args.json_file, 
        batch_size=args.batch_size,
        dry_run=args.dry_run
    )
    
    if success:
        print("🎉 Import completed successfully!")
        sys.exit(0)
    else:
        print("💥 Import failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
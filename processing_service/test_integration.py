#!/usr/bin/env python3
"""
Integration test script for the Closet AI Processing Service
This script tests the complete workflow from API endpoint to image processing
"""

import requests
import json
import time
import sys
import os
from typing import Dict, Any

# Configuration
SERVICE_URL = os.getenv('PROCESSING_SERVICE_URL', 'http://localhost:8000')
TEST_IMAGE_URL = 'https://res.cloudinary.com/demo/image/upload/sample.jpg'

def test_health_check() -> bool:
    """Test the service health check endpoint"""
    print("🔍 Testing service health check...")
    try:
        response = requests.get(f"{SERVICE_URL}/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Service is healthy - Version: {data.get('version', 'unknown')}")
            print(f"   Features: {len(data.get('features', []))} available")
            return True
        else:
            print(f"❌ Health check failed with status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to connect to service: {e}")
        return False

def test_metrics_endpoint() -> bool:
    """Test the metrics endpoint"""
    print("\n📊 Testing metrics endpoint...")
    try:
        response = requests.get(f"{SERVICE_URL}/metrics", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Metrics endpoint working")
            print(f"   Service version: {data.get('service', {}).get('version', 'unknown')}")
            print(f"   Active requests: {data.get('service', {}).get('active_requests', 'unknown')}")
            return True
        else:
            print(f"❌ Metrics endpoint failed with status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"⚠️  Metrics endpoint not available: {e}")
        return False

def test_image_processing() -> bool:
    """Test the actual image processing functionality"""
    print("\n🖼️  Testing image processing...")
    
    start_time = time.time()
    
    try:
        payload = {"image_url": TEST_IMAGE_URL}
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'ClosetAI-Test/1.0'
        }
        
        print(f"   Sending request with image URL: {TEST_IMAGE_URL}")
        
        response = requests.post(
            f"{SERVICE_URL}/process",
            json=payload,
            headers=headers,
            timeout=35  # Generous timeout for processing
        )
        
        processing_time = time.time() - start_time
        
        if response.status_code == 200:
            # Check if we got image data
            content_type = response.headers.get('content-type', '')
            content_length = len(response.content)
            
            print(f"✅ Image processing successful!")
            print(f"   Processing time: {processing_time:.2f}s")
            print(f"   Content type: {content_type}")
            print(f"   Output size: {content_length} bytes")
            print(f"   Request ID: {response.headers.get('X-Request-ID', 'unknown')}")
            
            # Check for expected headers
            expected_headers = ['X-Request-ID', 'X-Processing-Time', 'X-Service-Version']
            for header in expected_headers:
                value = response.headers.get(header, 'missing')
                print(f"   {header}: {value}")
            
            if content_type == 'image/png' and content_length > 1000:
                print("✅ Response appears to be a valid processed image")
                return True
            else:
                print(f"⚠️  Unexpected response format or size")
                return False
                
        else:
            print(f"❌ Processing failed with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('detail', 'Unknown error')}")
                print(f"   Request ID: {error_data.get('request_id', 'unknown')}")
                if 'troubleshooting' in error_data:
                    print(f"   Troubleshooting: {error_data['troubleshooting']}")
            except:
                print(f"   Raw error: {response.text[:200]}...")
            return False
            
    except requests.exceptions.Timeout:
        print(f"❌ Processing timed out after {time.time() - start_time:.1f}s")
        return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False

def test_error_handling() -> bool:
    """Test error handling with invalid input"""
    print("\n🚨 Testing error handling...")
    
    test_cases = [
        {"payload": {}, "description": "missing image_url"},
        {"payload": {"image_url": ""}, "description": "empty image_url"},
        {"payload": {"image_url": "not-a-url"}, "description": "invalid URL format"},
        {"payload": {"image_url": "https://invalid-domain-that-does-not-exist.com/image.jpg"}, "description": "unreachable URL"},
    ]
    
    all_passed = True
    
    for test_case in test_cases:
        print(f"   Testing {test_case['description']}...")
        try:
            response = requests.post(
                f"{SERVICE_URL}/process",
                json=test_case["payload"],
                timeout=10
            )
            
            if response.status_code in [400, 404, 422, 500]:
                error_data = response.json()
                print(f"   ✅ Correctly returned error {response.status_code}: {error_data.get('detail', 'No detail')[:50]}...")
            else:
                print(f"   ⚠️  Unexpected status {response.status_code} for invalid input")
                all_passed = False
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Request failed unexpectedly: {e}")
            all_passed = False
    
    return all_passed

def main():
    """Run all integration tests for OPTIMIZED processing service"""
    print("🧪 Closet AI Processing Service Integration Tests - OPTIMIZED VERSION")
    print("=" * 75)
    print("🚀 Testing optimized workflow (canvas standardization removed)")
    print(f"Service URL: {SERVICE_URL}")
    print(f"Test Image: {TEST_IMAGE_URL}")
    print()
    
    tests = [
        ("Health Check", test_health_check),
        ("Metrics Endpoint", test_metrics_endpoint),
        ("Image Processing", test_image_processing),
        ("Error Handling", test_error_handling),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                print(f"❌ {test_name} test failed")
        except Exception as e:
            print(f"💥 {test_name} test crashed: {e}")
    
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The processing service integration is working correctly.")
        sys.exit(0)
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
        sys.exit(1)

if __name__ == "__main__":
    main() 
# ⚡ Quick Verification - Run These Commands

## Backend API (Port 6000)

**Test 1: Health Check**
```powershell
Invoke-WebRequest http://localhost:6000/api/health -UseBasicParsing
```
Expected: `"status":"ok","database":"Connected"`

**Test 2: API Documentation**
```powershell
Invoke-WebRequest http://localhost:6000/api -UseBasicParsing
```
Expected: Shows available endpoints

**Test 3: List Papers**
```powershell
Invoke-WebRequest http://localhost:6000/api/papers -UseBasicParsing
```
Expected: `"papers":[],"total":0` (no papers extracted yet)

**Test 4: Server Status**
```powershell
netstat -ano -p tcp | Select-String "6000"
```
Expected: Shows port 6000 LISTENING

---

## Python Environment

**Test 5: Check Virtual Environment**
```powershell
cd c:\projects\LLB\scripts
venv\Scripts\python.exe --version
```
Expected: Python 3.13.x

**Test 6: Check Packages**
```powershell
cd c:\projects\LLB\scripts
venv\Scripts\python.exe -c "import pdfplumber, pymongo; print('✓ Packages OK')"
```
Expected: `✓ Packages OK`

---

## MongoDB

**Test 7: MongoDB Connection**
```powershell
netstat -ano -p tcp | Select-String "27017"
```
Expected: Shows port 27017 LISTENING

---

## Summary

If all 7 tests pass:
- ✅ Backend is running
- ✅ API is responding
- ✅ Database is connected
- ✅ Python environment ready
- ✅ MongoDB listening

Then you're ready to:
- Run extraction script
- Test API with data
- Start Week 2 work

---

## Current Status

✅ **Backend**: Running on port 6000  
✅ **MongoDB**: Connected  
✅ **Python**: Virtual environment ready  
✅ **API**: Responding to requests  
✅ **Ready**: Question extraction can begin

**Next**: Read `extract_questions.py` and test on one paper first


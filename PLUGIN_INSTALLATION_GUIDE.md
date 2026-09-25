# 📦 LLB Knowledge Platform Plugin - Installation Guide

**Version:** 1.0.0  
**Status:** ✅ Ready to Install  
**File:** `llb-knowledge-platform.zip` (24 KB)

---

## ✅ Plugin Verification

The plugin has been verified and includes all necessary files:

### ✅ Core Files
- `llb-knowledge-platform.php` - Main plugin file
- `README.md` - Plugin documentation

### ✅ API Integration
- `inc/class-llb-api-client.php` - Node.js backend connection (FIXED ✅)
- `inc/class-llb-settings.php` - Admin configuration page (NEW ✅)
- `inc/class-llb-shortcodes.php` - WordPress shortcodes

### ✅ Admin Features
- `inc/class-llb-menu.php` - Admin menu
- `inc/class-llb-admin.php` - Admin pages
- `assets/js/admin-settings.js` - Test connection button (NEW ✅)

### ✅ Frontend Features
- `inc/class-llb-frontend.php` - Frontend display
- `assets/css/llb-frontend.css` - Styling
- `assets/css/llb-frontend.css` - Professional UI

### ✅ Other Components
- `inc/class-llb-course.php` - Course management
- `inc/class-llb-post-types.php` - Custom post types
- `templates/` - Template files

---

## 🚀 Installation Steps

### Step 1: Download Plugin ZIP
```
Location: c:\projects\LLB\plugins\llb-knowledge-platform.zip
Size: 24 KB
```

### Step 2: Upload to WordPress
1. Go to WordPress Admin Dashboard
2. Navigate to **Plugins** → **Add New**
3. Click **Upload Plugin**
4. Select `llb-knowledge-platform.zip`
5. Click **Install Now**
6. Click **Activate Plugin**

**OR** (Manual Installation):
1. Extract `llb-knowledge-platform.zip` to `wp-content/plugins/`
2. Go to WordPress Admin → **Plugins**
3. Find "LLB Knowledge Platform"
4. Click **Activate**

### Step 3: Configure Backend API
1. After activation, go to **Settings** → **LLB Backend**
2. Enter your Node.js backend URL:
   - **Local Dev:** `http://localhost:6000`
   - **Production:** `https://api.yourdomain.com`
3. Click **Test Connection** to verify
4. Click **Save Configuration**

### Step 4: Verify Installation
✅ Backend status shows "Online"  
✅ Settings page is accessible  
✅ Shortcodes are available  

---

## 🔧 Configuration

### Backend API URL
**Location:** Settings → LLB Backend

| Environment | Example URL |
|-----------|------------|
| Local Development | `http://localhost:6000` |
| Heroku | `https://my-app.herokuapp.com` |
| AWS EC2 | `http://ec2-xxx.amazonaws.com` |
| Custom Domain | `https://api.mylaw.edu` |

### Test Connection
1. Enter your backend URL
2. Click **Test Connection** button
3. Result will show:
   - ✅ **Success** - Backend is online and responding
   - ❌ **Error** - Check URL, ensure Node.js server is running

---

## 📝 Available Shortcodes

### Backend Status
```
[llb_backend_status]
```
**Output:** Shows ✅ Online or ❌ Offline

### Display Question
```
[llb_question id="123"]
```
**Displays:** Full question with marks and type

### Display Answer
```
[llb_answer question_id="123" type="short"]
```
**Types:** `short`, `long`, `mcq`, `case-study`

**Output includes:**
- Answer text
- Key points
- Case law references
- Statutory references
- Study tips

### Display Quiz
```
[llb_quiz id="quiz123"]
```
**Output:** Quiz card with "Take Quiz" button

### Quiz List
```
[llb_quiz_list subject="CONSTITUTIONAL LAW" semester="1" limit="10"]
```
**Output:** List of available quizzes

---

## 🏗️ Architecture

```
WordPress (Plugin)
    ↓ (HTTP REST)
Node.js Backend (APIs)
    ↓ (Database Connection)
MongoDB (Data Storage)
```

### Data Flow
1. User loads page with shortcode
2. WordPress calls Node.js API
3. Backend fetches data from MongoDB
4. Response displayed on page

### API Endpoints Used
- `GET /api/health` - Backend health check
- `GET /api/answers/{id}` - Get answers for question
- `POST /api/quizzes/create` - Create quiz
- `GET /api/quizzes/{id}` - Get quiz details
- `POST /api/quizzes/{id}/start` - Start quiz attempt

---

## ⚙️ Prerequisites

### WordPress
- ✅ Version 6.2 or higher
- ✅ PHP 7.4 or higher

### Node.js Backend (Must be running)
- Node.js 16+
- Express server running on configured URL
- MongoDB connection working

### MongoDB
- MongoDB Atlas (Cloud) OR
- Local MongoDB instance

---

## ✅ Verification Checklist

Before using the plugin:

- [ ] Plugin is activated in WordPress
- [ ] Backend API URL is configured
- [ ] Test Connection shows ✅ Success
- [ ] Shortcodes are working
- [ ] Node.js backend is running
- [ ] MongoDB is connected

---

## 🐛 Troubleshooting

### Plugin Installation Failed
**Error:** "No valid plugins were found"

**Solution:**
- Ensure `llb-knowledge-platform.php` is in the root of the ZIP
- Verify ZIP structure is correct
- Try uploading via SFTP manually

### Backend Shows Offline
**Error:** "❌ Backend is OFFLINE"

**Solution:**
- Verify Node.js server is running
- Check API URL is correct (no typos)
- Ensure server is accessible from WordPress server
- Check firewall settings

### Shortcodes Not Working
**Error:** Shortcode displays but no content

**Solution:**
- Verify backend is online
- Check question/quiz IDs are correct
- Ensure Node.js APIs are returning data

### Test Connection Fails
**Error:** "Connection failed" message

**Solution:**
- Verify URL format (http://localhost:6000 not localhost:6000)
- Check Node.js server is running
- Try accessing `/api/health` directly in browser

---

## 📚 Features

### For Students
✅ Browse question papers  
✅ View formatted answers  
✅ Case law references  
✅ Study tips  
✅ Take quizzes  

### For Admins
✅ Configure backend URL  
✅ Test backend connection  
✅ Monitor backend status  
✅ Manage shortcodes  

---

## 🔐 Security

- WordPress nonces protect AJAX calls
- User permissions checked for admin pages
- API URLs are configurable and secure
- No hardcoded credentials in plugin

---

## 📞 Support

### Common Issues

**Q: Where is the ZIP file?**  
A: `c:\projects\LLB\plugins\llb-knowledge-platform.zip`

**Q: What Node.js APIs are required?**  
A: See API Endpoints section above

**Q: Can I use the plugin without a backend?**  
A: Plugin will show error messages but won't crash

**Q: How do I update the backend URL?**  
A: Settings → LLB Backend → Enter new URL → Save

---

## 🎯 What's New in This Version

### ✅ Fixed Issues
- API URL now reads from WordPress settings (dynamic)
- Removed hardcoded localhost reference
- Fixed duplicate methods in API client
- Added proper error handling

### ✅ New Features
- Admin settings page for configuration
- Test Connection button with AJAX
- Backend status monitoring
- Comprehensive shortcodes

### ✅ Improvements
- Better code organization
- Proper WordPress hooks usage
- Security best practices
- Detailed documentation

---

## 📦 Plugin Details

| Property | Value |
|----------|-------|
| Name | LLB Knowledge Platform |
| Version | 1.0.0 |
| Author | CoralRush |
| License | GPL v2 or later |
| Text Domain | llb-knowledge-platform |
| Min WordPress | 6.2 |
| Min PHP | 7.4 |
| File Size | 24 KB |

---

## ✨ Installation Status

✅ **Plugin is READY for installation**

**Location:** `c:\projects\LLB\plugins\llb-knowledge-platform.zip`

**Next Steps:**
1. Upload ZIP to WordPress
2. Activate plugin
3. Configure Settings → LLB Backend
4. Test connection
5. Add shortcodes to pages

---

**Last Updated:** August 12, 2026  
**Status:** Production Ready ✅

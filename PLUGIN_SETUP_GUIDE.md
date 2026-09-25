# LLB Knowledge Platform WordPress Plugin - Setup & Usage Guide

## ✅ Plugin Status: READY FOR INSTALLATION

The WordPress plugin is now fully configured and ready to use with your hybrid architecture.

---

## 📋 What's Included

### Plugin Structure
```
plugins/llb-knowledge-platform/
├── llb-knowledge-platform.php          (Main plugin file)
├── inc/
│   ├── class-llb-api-client.php        ✅ API client for Node.js backend
│   ├── class-llb-settings.php          ✅ Admin settings page (NEW)
│   ├── class-llb-shortcodes.php        ✅ Shortcodes for displaying content
│   ├── class-llb-admin.php             (Admin features)
│   ├── class-llb-course.php            (Course management)
│   ├── class-llb-frontend.php          (Frontend)
│   ├── class-llb-menu.php              (Menu)
│   └── class-llb-post-types.php        (Post types)
├── assets/
│   ├── js/
│   │   └── admin-settings.js           ✅ Test connection button (NEW)
│   └── css/
│       └── llb-frontend.css            (Frontend styles)
└── templates/
    ├── archive-llb-content.php
    └── single-llb-content.php
```

---

## 🚀 Installation Steps

### Step 1: Activate the Plugin
1. Go to WordPress Admin → Plugins
2. Find "LLB Knowledge Platform"
3. Click "Activate"

### Step 2: Configure Backend API URL
1. Go to WordPress Admin → **Settings → LLB Backend**
2. Enter your Node.js backend API URL:
   - **Local Development**: `http://localhost:6000`
   - **Production**: `https://your-backend-domain.com`
3. Click "Save Configuration"

### Step 3: Test Connection
1. On the same settings page, click the **"🔗 Test Connection"** button
2. You'll see either:
   - ✅ **Connection Successful** - Backend is online
   - ❌ **Connection Failed** - Check your backend URL and ensure Node.js server is running

---

## 🔑 Key Features

### Admin Configuration Page
**Location**: Settings → LLB Backend

**Features**:
- Configure Node.js backend API URL
- Dynamic URL loading from WordPress options
- Test connection to verify backend is online
- Backend status display (online/offline)
- Setup guide with examples
- Shortcode documentation

### Shortcodes Available

Use these shortcodes on any WordPress page or post:

#### 1. Backend Status Badge
```
[llb_backend_status]
```
Displays: ✅ Backend Online or ❌ Backend Offline

#### 2. Display Question
```
[llb_question id="question123"]
```
Displays a specific question with title, type, and marks

#### 3. Display Answer
```
[llb_answer question_id="question123" type="short"]
```
Types available: `short`, `long`, `mcq`, `case-study`

**Features**:
- Case law references
- Statutory references
- Key points
- Study tips
- Quality scores

#### 4. Display Quiz
```
[llb_quiz id="quiz123"]
```
Displays quiz details and "Take Quiz" button

#### 5. Quiz List
```
[llb_quiz_list subject="CONSTITUTIONAL LAW" semester="1" limit="10"]
```
Lists available quizzes (stub - awaiting full implementation)

---

## 🔧 How It Works (Architecture)

```
WordPress Plugin (UI)
        ↓ (HTTP/REST)
Node.js Backend (APIs)
        ↓ (MongoDB Connection)
MongoDB Database
        ├─ Questions
        ├─ Answers
        ├─ Quizzes
        ├─ Case Laws
        └─ Study Materials
```

### API Flow
1. **User configures backend URL** in WordPress admin
2. **Plugin reads URL** from WordPress options: `get_option('llb_node_api_url')`
3. **API Client class** makes HTTP requests to Node.js backend
4. **Backend responds** with JSON data
5. **Plugin displays** data using shortcodes

---

## 📝 Configuration Examples

### Local Development Setup
```
Node.js Backend URL: http://localhost:6000
MongoDB: Local or MongoDB Atlas
Backend Status: Check via "Test Connection" button
```

### Production Setup
```
Node.js Backend URL: https://api.yourdomain.com
MongoDB: MongoDB Atlas (cloud)
Backend Status: Check via "Test Connection" button
```

### AWS Deployment Example
```
Node.js Backend URL: http://ec2-your-instance.amazonaws.com
MongoDB: MongoDB Atlas or RDS
Backend Status: Verify SSL certificate is valid
```

---

## 🐛 Troubleshooting

### ❌ "Connection Failed" Error

**Problem**: The test connection button shows connection failed

**Solutions**:
1. Verify your Node.js backend is running
   ```bash
   npm run dev
   ```

2. Verify the API URL is correct
   - Local: Should be `http://localhost:6000` (not https)
   - Production: Should have valid SSL certificate

3. Check firewall/security groups allow traffic
   - AWS: Check Security Group rules
   - Heroku: App should be running

4. Verify backend has `/api/health` endpoint
   ```bash
   # Test manually
   curl http://localhost:6000/api/health
   ```

### ❌ Shortcode Not Working

**Problem**: Shortcodes display error messages

**Solutions**:
1. Verify backend is online (check status badge)
2. Verify question/quiz IDs are correct
3. Check backend has the data (check MongoDB)
4. Review WordPress error logs

### ⚠️ Slow Loading

**Problem**: Pages with shortcodes load slowly

**Solutions**:
1. Check backend response time
2. Reduce number of items in [llb_quiz_list]
3. Use WordPress caching plugin (WP Super Cache, W3 Total Cache)
4. Optimize MongoDB queries on backend

---

## 🔐 Security Features

### Built-in Security
- ✅ Nonce verification for AJAX requests
- ✅ Capability checks (`manage_options` for admin functions)
- ✅ URL validation and sanitization
- ✅ HTML escaping for output
- ✅ JSON encoding for data
- ✅ CORS headers support (configure on backend)

### Recommended Production Setup
```php
// Add to wp-config.php for additional security
define('DISALLOW_FILE_EDIT', true);
define('DISALLOW_FILE_MODS', true);
```

---

## 📊 API Endpoints Used

The plugin communicates with these backend endpoints:

### Health Check
```
GET /api/health
```

### Answers
```
GET /api/answers/{questionId}
POST /api/answers/generate/short
POST /api/answers/generate/long
POST /api/answers/generate/mcq
POST /api/answers/generate/case-study
```

### Quizzes
```
GET /api/quizzes/{quizId}
POST /api/quizzes/create
POST /api/quizzes/auto-generate
POST /api/quizzes/{quizId}/start
POST /api/quizzes/attempts/{attemptId}/answer
POST /api/quizzes/attempts/{attemptId}/submit
GET /api/quizzes/attempts/{attemptId}/results
```

**Note**: Make sure your Node.js backend has all these endpoints implemented.

---

## 🎯 Next Steps

### For Testing
1. ✅ Install and activate the plugin
2. ✅ Configure backend URL
3. ✅ Test connection button
4. ✅ Create test pages with shortcodes
5. ✅ Verify data displays correctly

### For Production
1. Deploy Node.js backend to cloud (AWS, Heroku, etc.)
2. Configure MongoDB Atlas (cloud database)
3. Update backend URL in WordPress admin
4. Set up SSL certificate for HTTPS
5. Configure CORS on backend
6. Enable WordPress caching
7. Monitor performance and logs

### For Development
1. Keep local Node.js backend running
2. Use WordPress debugging
   ```php
   define('WP_DEBUG', true);
   define('WP_DEBUG_LOG', true);
   ```
3. Check browser console for JavaScript errors
4. Monitor WordPress error logs
5. Test all shortcodes

---

## 📚 Files Modified/Created

### Fixed Files
- ✅ `inc/class-llb-api-client.php` - Removed duplicate methods, dynamic URL loading
- ✅ `llb-knowledge-platform.php` - Updated load order

### New Files
- ✅ `inc/class-llb-settings.php` - Admin settings page
- ✅ `assets/js/admin-settings.js` - Test connection button functionality

### Status
- ✅ All files syntax-checked
- ✅ All init() methods called correctly
- ✅ All dependencies loaded in correct order
- ✅ Plugin ready for WordPress installation

---

## 🎓 Example Page Setup

### Page 1: Question Bank
```
[llb_backend_status]

# Question Bank

[llb_question id="q001"]
[llb_question id="q002"]
```

### Page 2: Study with Answers
```
[llb_answer question_id="q001" type="short"]
[llb_answer question_id="q001" type="long"]
```

### Page 3: Practice Quizzes
```
[llb_quiz id="quiz001"]
[llb_quiz id="quiz002"]
```

### Page 4: Quiz List
```
[llb_quiz_list subject="CONSTITUTIONAL LAW" semester="1" limit="5"]
```

---

## 💡 Tips

1. **Bookmark the Settings Page**: Regularly check backend status
2. **Use Test Button**: Before troubleshooting, always test connection first
3. **Cache Shortcodes**: Use WordPress transients in custom code to cache responses
4. **Monitor Logs**: Keep WordPress debug logs enabled during development
5. **Version Control**: Track .env changes for different environments

---

## 📞 Support

### Common Questions

**Q: Can I change the backend URL later?**
A: Yes! Go to Settings → LLB Backend anytime

**Q: Does the plugin work offline?**
A: No, the backend must be online. Graceful degradation messages will display

**Q: Can I customize the shortcode output?**
A: Yes, edit `inc/class-llb-shortcodes.php` to modify templates

**Q: How often does it check backend status?**
A: Every hour (cached), or test manually with the button

**Q: Can multiple WordPress sites use the same backend?**
A: Yes! Each WordPress site can point to the same Node.js backend

---

## ✅ Verification Checklist

Before going live:
- [ ] Plugin activated in WordPress
- [ ] Backend URL configured in Settings → LLB Backend
- [ ] Test Connection button works (✅ shows success)
- [ ] At least one shortcode tested on a page
- [ ] Backend status displays correctly
- [ ] SSL certificate valid (if using HTTPS)
- [ ] WordPress debug logs checked for errors
- [ ] Browser console checked for JavaScript errors
- [ ] Performance is acceptable (< 2 seconds page load)

---

## 🎉 You're Ready!

Your WordPress plugin is fully configured and ready to connect to your Node.js backend. 

Start by:
1. Activating the plugin
2. Configuring the backend URL
3. Testing the connection
4. Creating pages with shortcodes

Happy learning! 📚⚖️

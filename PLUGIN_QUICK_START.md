# ⚡ Plugin Quick Start

## ✅ Status: READY TO INSTALL

**ZIP File:** `c:\projects\LLB\plugins\llb-knowledge-platform.zip` (24 KB)

---

## 🚀 3-Step Installation

### 1️⃣ Upload to WordPress
- WordPress Admin → Plugins → Add New → Upload Plugin
- Select `llb-knowledge-platform.zip`
- Click Install → Activate

### 2️⃣ Configure Backend
- Settings → LLB Backend
- Enter Node.js API URL: `http://localhost:6000`
- Click **Test Connection**
- Click **Save Configuration**

### 3️⃣ Use Shortcodes
- Add to any page/post:
  ```
  [llb_backend_status]
  [llb_question id="123"]
  [llb_answer question_id="123" type="short"]
  ```

---

## 📋 What Was Fixed

✅ API URL now dynamic (reads from WordPress settings)  
✅ Admin settings page created  
✅ Test connection button added  
✅ Removed hardcoded localhost  
✅ All dependencies properly loaded  

---

## 📦 Plugin Contents

✅ 8 PHP classes  
✅ 2 CSS files  
✅ 2 JavaScript files  
✅ 2 Template files  
✅ Complete documentation  

---

## 🔗 Backend API URL Examples

| Environment | URL |
|-----------|-----|
| Local | `http://localhost:6000` |
| Heroku | `https://my-app.herokuapp.com` |
| AWS | `http://ec2-xxx.amazonaws.com` |
| Custom | `https://api.mylaw.edu` |

---

## ✨ Available Shortcodes

```
[llb_backend_status]                    → Shows online/offline
[llb_question id="123"]                 → Display question
[llb_answer question_id="123" type="short"]  → Display answer
[llb_quiz id="quiz123"]                 → Display quiz
[llb_quiz_list subject="LAW" semester="1"]  → List quizzes
```

---

## ⚙️ Requirements

- WordPress 6.2+
- PHP 7.4+
- Node.js backend running
- MongoDB connected

---

## 🎯 Next Steps

1. Download ZIP: `llb-knowledge-platform.zip`
2. Upload to WordPress
3. Activate plugin
4. Go to Settings → LLB Backend
5. Configure API URL
6. Click Test Connection
7. Add shortcodes to pages

---

**Ready to go!** 🚀

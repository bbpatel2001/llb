# LLB WordPress Plugin - Upgrade Guide

## Version 2.0.0 - Complete Edition

### What's New
- ✅ Full API Client integration
- ✅ Admin Dashboard with Backend status
- ✅ Settings page for API URL configuration
- ✅ Multiple Shortcodes (questions, papers, quizzes)
- ✅ New Post Types (Questions, Flashcards, Quizzes)
- ✅ Professional styling

### How to Upgrade - SAFE METHOD

**The plugin is ACTIVE. Follow this process to upgrade safely:**

#### Step 1: Download the New Plugin
```
File: c:\projects\LLB\plugins\llb-knowledge-platform.zip
```

#### Step 2: Update via WordPress Admin (RECOMMENDED)
1. Go to **Plugins** → **LLB Knowledge Platform**
2. Click **Delete** (don't worry, this just removes files)
3. Go to **Plugins** → **Add New** → **Upload Plugin**
4. Select the new ZIP file
5. Click **Install Now**
6. Click **Activate**

#### Step 3: Verify Installation
1. Go to **LLB Platform** menu in admin
2. Go to **Settings**
3. Check Backend Status (should show ✅ if backend is running)

### Alternative: Direct File Update (ADVANCED)

If you have FTP access:

1. **Via FTP/File Manager:**
   - Navigate to `/wp-content/plugins/llb-knowledge-platform/`
   - Upload new files from the ZIP (overwrite existing)
   - WordPress will auto-reload code

2. **Files to update:**
   - `llb-knowledge-platform.php` (main file)
   - Entire `/inc/` folder
   - Entire `/assets/` folder

### After Upgrade

1. **Check Admin Dashboard:**
   - Go to **LLB Platform** menu
   - Should see 4 stat cards
   - Backend status should show

2. **Test Shortcodes:**
   ```
   [llb_questions limit="10"]
   [llb_papers limit="20"]
   [llb_quizzes limit="10"]
   [llb_backend_status]
   ```

3. **Configure API URL:**
   - Go to **LLB Platform** → **Settings**
   - Enter your Node.js backend URL
   - Click **Check Backend Connection**

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-08-12 | Complete redesign, API integration |
| 1.0.0 | 2026-08-12 | Initial minimal version |

### Troubleshooting

**Problem: "Plugin could not be activated"**
- Solution: Clear WordPress cache, deactivate, reactivate

**Problem: "Backend shows offline"**
- Solution: Check API URL in Settings
- Ensure Node.js backend is running on configured URL

**Problem: Shortcodes showing errors**
- Solution: Check backend connection status
- Verify Node.js API is responding

### Rollback to Previous Version

If something goes wrong:
1. WordPress has auto-backup
2. Go to **Plugins** → **Delete** (removes current version)
3. Upload previous ZIP and activate

### Support

**For API issues:**
- Check: `LLB Platform` → `Settings` → `Check Backend Connection`
- Verify Node.js backend URL is correct

**For plugin issues:**
- Check WordPress error logs
- Check browser console (F12)
- Verify PHP version is 7.4+

---

**Version 2.0.0 - Ready to use!**

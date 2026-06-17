# TutorFlow Pro - Refresh Issue Resolution Guide

## Problem Summary
The app was experiencing 404 errors on page refresh when served at `/facilitator` on `classes.zanetutors.com.ng` because:
1. Route collisions: `/login`, `/dashboard` existed in both parent (`classes`) and child (`tutorflow-pro`) apps
2. Incorrect reverse proxy configuration leading to parent app intercepting requests
3. Missing fallback routing for SPA (Single Page Application)

## Applied Code Fixes ✅

### 1. Updated `vite.config.ts`
- Changed `base` from `/portal/` to `/facilitator/`
- This ensures all assets and relative paths use the correct base

### 2. Updated `src/App.tsx`
- Changed route from `path="/portal"` to `path="/tutor"` (line 36)
- This prevents collision with parent app's `/portal` routes
- TutorPortal is now accessible at `/facilitator/tutor`

### 3. Updated `vercel.json`
- Removed the catch-all rewrite: `"source": "/:path*"` → `"/index.html"`
- This prevents Vercel from incorrectly intercepting parent app routes
- Now only `/facilitator/*` routes are rewritten to index.html

### 4. Verified `src/App.tsx` Router
- ✅ `basename="/facilitator"` is correctly set in BrowserRouter
- React Router will automatically prepend `/facilitator` to all links

## Required Server Configuration

Your **nginx/reverse proxy at `classes.zanetutors.com.ng`** MUST be configured like this:

```nginx
# TutorFlow Pro - Facilitator Portal
location /facilitator/ {
    # Strip /facilitator/ before passing to backend
    proxy_pass http://tutorflow-pro-app/;
    
    # Add /facilitator/ back to redirect responses
    proxy_redirect ~^/ /facilitator/;
    
    # Important headers for proper routing
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
}

# Parent app routes (must NOT include /facilitator)
location /login {
    proxy_pass http://classes-app;
}

location /dashboard {
    proxy_pass http://classes-app;
}

location / {
    proxy_pass http://classes-app;
}
```

**Key points:**
- `/facilitator/` location MUST come BEFORE the catch-all `/` location
- Nginx processes locations in order, so specific paths must be first
- The trailing slash in `proxy_pass http://tutorflow-pro-app/;` is critical—it strips the `/facilitator` prefix

## URL Structure After Fix

| Page | Old URL | New URL |
|------|---------|---------|
| Tutor Home | `https://classes.zanetutors.com.ng/portal/` | `https://classes.zanetutors.com.ng/facilitator/` |
| Tutor Courses | `https://classes.zanetutors.com.ng/portal/portal` | `https://classes.zanetutors.com.ng/facilitator/tutor` |
| Dashboard | `https://classes.zanetutors.com.ng/portal/dashboard` | `https://classes.zanetutors.com.ng/facilitator/dashboard` |
| Login | `https://classes.zanetutors.com.ng/portal/login` | `https://classes.zanetutors.com.ng/facilitator/login` |

## Testing Steps After Deployment

1. **Direct URL access** (tests server-side routing):
   - `https://classes.zanetutors.com.ng/facilitator/dashboard`
   - Should load TutorFlow Pro dashboard, not classes 404

2. **Page refresh** (tests SPA routing):
   - Navigate to `/facilitator/tutor`
   - Press F5
   - Should remain on tutor page, not redirect to classes 404

3. **Links and navigation** (tests client-side routing):
   - Click internal links
   - All should start with `/facilitator/`

4. **Check Network tab**:
   - Look for HTML responses
   - Should see `index.html` being served, not 404

## Why This Fixes The Problem

**Before:**
- Request: `https://classes.zanetutors.com.ng/facilitator/dashboard`
- Nginx strips `/facilitator` → passes `/dashboard` to TutorFlow Pro
- React Router sees `/dashboard` (missing basepath) → creates links to `/tutor`
- Refresh sends `/tutor` to nginx
- No matching nginx rule → falls through to parent app → classes 404

**After:**
- Request: `https://classes.zanetutors.com.ng/facilitator/dashboard`
- Nginx `/facilitator/` rule matches → strips `/facilitator` → passes `/dashboard`
- React Router with `basename="/facilitator"` → creates links to `/facilitator/dashboard`
- Refresh sends `/facilitator/dashboard` → matches nginx rule again ✅
- `/facilitator/*` rewrites to index.html (Vercel)
- TutorFlow Pro loads correctly ✅

## Next Steps

1. **Update your nginx config** at the reverse proxy level
2. **Redeploy TutorFlow Pro** on Vercel (or your hosting)
3. **Test** the fixes using the testing steps above
4. **Verify** with browser DevTools Network tab
5. **Update bookmarks/links** from `/portal` to `/facilitator`

## Rollback (if needed)

If issues occur, you can quickly rollback by reverting to the previous commit:
```bash
git revert HEAD~2
git push
```

---

**Files Modified:**
- ✅ `vite.config.ts` 
- ✅ `src/App.tsx`
- ✅ `vercel.json`

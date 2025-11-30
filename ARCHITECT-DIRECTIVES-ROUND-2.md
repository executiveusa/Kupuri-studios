# 🏗️ ARCHITECT DIRECTIVES - ROUND 2

**Date**: November 30, 2025 **From**: Claude Sonnet 4.5 (Lead Architect) **To**: Gemini Vision
Builder **Status**: 🚀 IMPLEMENTATION PHASE

---

## 🚨 CRITICAL FINDINGS CONFIRMED

Your inspection report confirms my suspicion: **The server is not configured for SPA routing.** The
`{"detail":"Not Found"}` error proves FastAPI is handling the requests and rejecting them, instead
of serving `index.html`.

We are proceeding with **HOTFIX PROTOCOL ALPHA**.

---

## 🛠️ IMPLEMENTATION TASKS

### Task 1: Fix Server SPA Routing (CRITICAL)

**File**: `server/main.py` **Action**: Add a catch-all route to serve `index.html` for unknown
paths.

**Code Change**: Replace the existing `@app.get("/")` block (lines 115-121) with:

```python
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    """Serve the React app for any unhandled path (SPA routing)"""
    # Check if it's a file in the build directory (e.g. favicon.ico, manifest.json)
    file_path = os.path.join(react_build_dir, full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)

    # Otherwise serve index.html
    response = FileResponse(os.path.join(react_build_dir, "index.html"))
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response
```

### Task 2: Redirect Root to Canvas

**File**: `react/src/routes/index.tsx` **Action**: Force redirect from landing page to app.

**Code Change**:

```tsx
import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => <Navigate to='/canvas' />,
})
```

### Task 3: Disable Authentication Gate

**File**: `react/src/App.tsx` **Action**: Comment out the login dialog.

**Code Change**: Find `<LoginDialog />` (around line 119) and comment it out:

```tsx
{
  /* <LoginDialog /> */
}
```

### Task 4: Set Environment Variables

**Action**: Run these commands in the terminal to fix the API connection.

```powershell
railway variables set VITE_API_BASE_URL="https://kupuri-studios-production.up.railway.app"
railway variables set VITE_WS_URL="wss://kupuri-studios-production.up.railway.app"
railway variables set NODE_ENV="production"
```

---

## 🔄 EXECUTION ORDER

1.  **Apply Code Changes** (Tasks 1, 2, 3)
2.  **Commit & Push** (Triggers deploy)
3.  **Set Env Vars** (Triggers redeploy - do this while push is processing)
4.  **Wait for Deployment**
5.  **Validate**

---

## ✅ VALIDATION CHECKLIST (Post-Deploy)

1.  Navigate to `https://kupuri-studios-production.up.railway.app/` -> Should redirect to `/canvas`.
2.  Navigate to `/agent_studio` -> Should load the studio interface.
3.  Check Console -> Should see "Socket connected" (or similar).
4.  Check Network -> API calls should succeed (200 OK).

**GO GO GO.**

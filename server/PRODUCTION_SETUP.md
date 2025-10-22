# Production Setup Guide (Render)

## Environment Variables

Set these in Render Dashboard → Environment:

```bash
NODE_ENV=production
PORT=3001
```

## Template Storage on Render

### Option 1: Use Render Persistent Disk (Recommended)

1. In Render Dashboard, add a **Persistent Disk**:
   - Mount path: `/app/templates`
   - Size: 1GB (or as needed)

2. Add environment variable:
   ```bash
   TEMPLATE_ROOT=/app/templates
   ```

3. Your templates will persist across deployments

### Option 2: Add Templates via API

Use the backend API to add templates:

```bash
# Add a template directory
POST /api/templates/settings/allowed-roots
{
  "rootPath": "/app/templates"
}

# Upload templates via API
POST /api/templates/add
{
  "filePath": "/app/templates/my-template.html",
  "name": "My Template",
  "category": "Newsletter"
}
```

### Option 3: Store in Git Repository

1. Create `server/data/templates/` in your repo
2. Add templates there
3. Backend will scan this directory automatically

## Block Storage

Block storage works the same way:
- Development: Use frontend Storage UI with local paths
- Production: Files stored in `server/data/blocks/files/`

## WorkspaceManager

Production automatically registers:
- Project directory: `/app`
- Any paths added via API

Platform-specific blocked paths (macOS Library, Windows System32, etc.) work correctly on Linux.

## Sync Behavior

- **Development**: Frontend Storage locations → Custom local paths
- **Production**: Backend allowed roots → Server directories

Frontend "Sync New" button:
- Dev: Syncs your local directories
- Production: Syncs server-side template directories


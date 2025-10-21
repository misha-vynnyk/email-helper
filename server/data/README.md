# Data Storage Directory

This directory stores user-generated content and is **not committed to Git**.

## Structure

```
data/
├── blocks/
│   ├── custom/      # Custom blocks (JSON format)
│   └── files/       # TypeScript block files
├── templates/       # Email template HTML files
└── images/          # Uploaded images
```

## Cross-Platform Support

Storage paths are automatically configured for each operating system:

### macOS

```
~/Library/Application Support/EmailBuilder/
```

### Windows

```
C:\Users\YourName\AppData\Roaming\EmailBuilder\
```

### Linux

```
~/.local/share/EmailBuilder/
```

## Development vs Production

**Development** (local): Uses `./data` in project directory
**Production**: Uses OS-specific app data directories

## Configuration

You can customize storage paths using environment variables:

```bash
# Custom paths
CUSTOM_BLOCKS_DIR=/path/to/custom/blocks
BLOCK_FILES_DIR=/path/to/block/files
TEMPLATES_DIR=/path/to/templates
TEMPLATE_ROOTS=~/Documents/EmailTemplates,~/Templates
```

See `.env.example` for all options.

## Web Interface Configuration

Storage paths can also be configured from the web interface:

- Block Library → Settings → Storage Paths
- Template Library → Settings → Template Roots

Settings are saved in browser localStorage and synchronized with backend.

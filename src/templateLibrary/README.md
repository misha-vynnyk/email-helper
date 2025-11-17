# Template Library

File-based HTML email template management system with folder sync and preview capabilities.

## Features

- **File-Based Storage** - Work with `.html` files from your filesystem
- **Folder Sync** - Import entire folders with automatic organization
- **Live Preview** - Real-time template preview with device toggles
- **Search & Filter** - Find templates by name, category, tags
- **Template Metadata** - Categories, tags, descriptions
- **Directory Management** - Configure allowed root directories
- **Auto-Sync** - Keep templates synchronized with filesystem
- **Email Integration** - Send templates directly via SMTP

## Structure

```
templateLibrary/
├── components/          # UI components
│   ├── DirectoryManagementModal.tsx
│   ├── PreviewSettings.tsx
│   └── TemplateItem.tsx
├── hooks/              # React hooks
│   └── useTemplates.ts
├── services/           # Business logic
│   └── templateService.ts
├── api/                # API adapter
│   └── templateApi.ts
├── types/              # TypeScript types
│   └── index.ts
├── utils/              # Helper functions
├── index.ts            # Public API
└── README.md          # Documentation
```

## Usage

### Basic Usage

```typescript
import { TemplateLibrary } from '@/templateLibrary';

function MyComponent() {
  return <TemplateLibrary />;
}
```

### Using Hooks

```typescript
import { useTemplates } from '@/templateLibrary';

function CustomTemplateList() {
  const { templates, loading, error, createTemplate } = useTemplates({
    category: 'newsletter',
    search: 'welcome',
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {templates.map(template => (
        <div key={template.id}>{template.name}</div>
      ))}
    </div>
  );
}
```

### Using Service Layer

```typescript
import { templateService } from "@/templateLibrary";

async function loadNewsletterTemplates() {
  const templates = await templateService.listTemplates({
    category: "newsletter",
  });
  return templates;
}
```

## Architecture

### Service Layer Pattern

```
Component → Hook → Service → API → Backend → Filesystem
```

**Benefits:**

- Separation of concerns
- Testable business logic
- Type-safe API calls
- Reusable across components

### Data Flow

1. **Component** renders UI
2. **Hook** manages React state
3. **Service** handles business logic
4. **API** makes HTTP requests
5. **Backend** interacts with filesystem
6. **Filesystem** stores `.html` files

## API

### Hooks

#### `useTemplates(options?)`

Main hook for template management.

**Options:**

- `search?: string` - Search query
- `category?: string` - Filter by category
- `autoLoad?: boolean` - Auto-fetch on mount (default: true)

**Returns:**

- `templates: EmailTemplate[]` - Template array
- `loading: boolean` - Loading state
- `error: string | null` - Error message
- `loadTemplates: () => Promise<void>` - Reload templates
- `createTemplate: (data) => Promise<EmailTemplate>` - Create template
- `updateTemplate: (id, data) => Promise<EmailTemplate>` - Update template
- `deleteTemplate: (id) => Promise<void>` - Delete template
- `syncTemplate: (id) => Promise<EmailTemplate>` - Sync with filesystem

### Services

#### `templateService`

Business logic for template operations.

**Methods:**

- `listTemplates(filters?)` - Get all templates
- `getTemplate(id)` - Get single template
- `createTemplate(data)` - Create new template
- `updateTemplate(id, data)` - Update template
- `deleteTemplate(id)` - Delete template (file)
- `searchTemplates(query)` - Search templates
- `syncTemplate(id)` - Re-read from filesystem

### Types

```typescript
interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  keywords: string[];
  html: string;
  preview?: string;
  createdAt: number;
  updatedAt?: number;
  isCustom?: boolean;
  source?: "src" | "data";
  filePath?: string;
}

type TemplateCategory =
  | "newsletter"
  | "promotional"
  | "transactional"
  | "announcement"
  | "welcome"
  | "confirmation"
  | "other";

interface TemplateMetadata {
  subject?: string;
  preheader?: string;
  author?: string;
  version?: string;
}
```

## File Organization

### Storage Locations

**Default:**

- `~/Documents/Templates/` - User templates
- `server/data/templates/files/` - Server-managed templates
- `src/templates/` - Built-in templates (read-only)

**Custom:**
Configure additional directories via Directory Management modal.

### File Format

Templates are standard `.html` files:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />
    <title>Welcome Email</title>
  </head>
  <body>
    <!-- Email content -->
  </body>
</html>
```

### Metadata (Optional)

Add metadata as HTML comments:

```html
<!--
@category: newsletter
@tags: welcome, onboarding
@description: Welcome email for new users
@subject: Welcome to Our Service
@preheader: Get started in 3 easy steps
-->
<!DOCTYPE html>
...
```

## Directory Management

### Allowed Roots

Configure which directories can be accessed:

```typescript
import { addAllowedRoot, listAllowedRoots } from "@/templateLibrary";

// Add allowed directory
await addAllowedRoot("/Users/john/EmailTemplates");

// List all allowed
const roots = await listAllowedRoots();
```

### Security

- Only configured directories are accessible
- Path traversal prevention
- Sandboxed file operations
- Permission checks on backend

## Import & Export

### Bulk Import

```typescript
import { importFolder } from "@/templateLibrary";

await importFolder({
  folderPath: "/Users/john/EmailTemplates",
  recursive: true,
  category: "newsletter",
  tags: ["2024", "campaign"],
});
```

### Export

Templates are just files - copy them from configured directories.

## Integration

### With Email Builder

```typescript
import { EmailBuilder } from '@/documents';
import { useTemplates } from '@/templateLibrary';

function Editor() {
  const { templates } = useTemplates();
  const [html, setHtml] = useState('');

  const loadTemplate = (template) => {
    setHtml(template.html);
  };

  return (
    <>
      <TemplateSelector
        templates={templates}
        onSelect={loadTemplate}
      />
      <EmailBuilder value={html} onChange={setHtml} />
    </>
  );
}
```

### With Email Sender

```typescript
import { sendEmail } from "@/emailSender";
import { templateService } from "@/templateLibrary";

async function sendTemplateEmail(templateId: string, recipients: string[]) {
  const template = await templateService.getTemplate(templateId);

  await sendEmail({
    to: recipients,
    subject: template.metadata?.subject || template.name,
    html: template.html,
  });
}
```

## Best Practices

1. **Organize templates** in folders by type/campaign
2. **Use meaningful names** for easy searching
3. **Add metadata comments** for better categorization
4. **Keep templates small** (< 200 KB recommended)
5. **Test templates** before importing
6. **Sync regularly** to catch file changes
7. **Backup templates** outside the system
8. **Use version control** (git) for template files

## Sync Behavior

### Auto-Sync

- Detects file changes on filesystem
- Updates template content automatically
- Preserves metadata and categorization

### Manual Sync

- Click sync button on individual template
- Bulk sync all templates
- Useful after external file edits

### Conflict Resolution

- File changes always override in-memory state
- Metadata preserved unless changed in file
- Deletion detection and handling

## Performance

### Caching

- Template list cached in memory
- File content loaded on-demand
- Preview images generated once

### Optimization

- Lazy loading for large template sets
- Virtualized list rendering
- Debounced search/filter
- Incremental folder scanning

## Future Improvements

- [ ] Template versioning
- [ ] Collaborative editing
- [ ] Template variables/placeholders
- [ ] A/B testing support
- [ ] Usage analytics
- [ ] Template approval workflow
- [ ] Cloud storage integration
- [ ] Template marketplace
- [ ] Advanced metadata extraction
- [ ] Template inheritance/composition

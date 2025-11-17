# Block Library

Block management system for email templates with file-based and localStorage storage.

## Structure

```
blockLibrary/
├── components/          # UI components (to be organized)
├── hooks/              # React hooks for data fetching
├── services/           # Business logic layer
├── api/                # API adapter
├── types/              # TypeScript types
├── utils/              # Helper functions
├── constants.ts        # Constants
├── index.ts            # Public API
└── README.md          # Documentation
```

## Usage

### Basic Usage

```typescript
import { BlockLibrary, useBlocks } from '@/blockLibrary';

function MyComponent() {
  return <BlockLibrary />;
}
```

### Using Hooks

```typescript
import { useBlocks } from '@/blockLibrary';

function CustomBlockList() {
  const { blocks, loading, error, createBlock } = useBlocks({
    category: 'buttons',
    search: 'primary',
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {blocks.map(block => (
        <div key={block.id}>{block.name}</div>
      ))}
    </div>
  );
}
```

### Using Service Layer

```typescript
import { blockService } from "@/blockLibrary";

async function loadMyBlocks() {
  const blocks = await blockService.listBlocks({ category: "headers" });
  return blocks;
}
```

## Architecture

### Service Layer Pattern

```
Component → Hook → Service → API → Backend
```

**Benefits:**

- Clear separation of concerns
- Easy to test (services can be mocked)
- Reusable business logic
- Type-safe API calls

### Data Flow

1. **Component** renders UI and handles user interaction
2. **Hook** manages React state and side effects
3. **Service** contains business logic and data transformation
4. **API** handles HTTP requests
5. **Backend** processes and stores data

## Features

- **File-based blocks** - TypeScript files in `src/blocks/` or custom directories
- **LocalStorage blocks** - User-created blocks stored in browser
- **Search & Filter** - Find blocks by name, category, keywords
- **Storage Management** - Configure custom storage locations
- **Preview** - Live preview of block HTML
- **Drag & Drop** - (if implemented in UI)

## API

### Hooks

#### `useBlocks(options?)`

Main hook for block data management.

**Options:**

- `search?: string` - Search query
- `category?: string` - Filter by category
- `autoLoad?: boolean` - Auto-fetch on mount (default: true)

**Returns:**

- `blocks: EmailBlock[]` - Array of blocks
- `loading: boolean` - Loading state
- `error: string | null` - Error message
- `loadBlocks: () => Promise<void>` - Reload blocks
- `createBlock: (data) => Promise<EmailBlock>` - Create new block
- `updateBlock: (id, data) => Promise<EmailBlock>` - Update block
- `deleteBlock: (id) => Promise<void>` - Delete block

### Services

#### `blockService`

Business logic layer for block operations.

**Methods:**

- `listBlocks(filters?)` - Get all blocks
- `getBlock(id)` - Get single block
- `createBlock(data)` - Create new block
- `updateBlock(id, data)` - Update block
- `deleteBlock(id)` - Delete block
- `searchBlocks(query)` - Search blocks

### Types

```typescript
interface EmailBlock {
  id: string;
  name: string;
  category: string;
  keywords: string[];
  html: string;
  preview?: string;
  createdAt: number;
  isCustom?: boolean;
  source?: "src" | "data";
  filePath?: string;
}

type BlockCategory =
  | "header"
  | "footer"
  | "content"
  | "buttons"
  | "images"
  | "social"
  | "divider"
  | "spacer"
  | "other";
```

## Storage Locations

Blocks can be stored in multiple locations:

1. **Built-in** (`src/blocks/`) - Predefined blocks
2. **Custom Files** (`server/data/blocks/files/`) - File-based custom blocks
3. **LocalStorage** - Browser-stored blocks

Configure custom storage locations via the Storage modal.

## Development

### Adding New Block

```typescript
const newBlock = await blockService.createBlock({
  name: "My Button",
  category: "buttons",
  keywords: ["cta", "action"],
  html: '<a href="#" style="...">Click Me</a>',
  preview: "data:image/png;base64,...",
});
```

### Testing

```typescript
import { blockService } from "@/blockLibrary";

describe("BlockService", () => {
  it("should list blocks", async () => {
    const blocks = await blockService.listBlocks();
    expect(blocks).toBeInstanceOf(Array);
  });
});
```

## Migration Notes

This module uses the new centralized API architecture:

- Old `blockFileApi.ts` → New `api/blockApi.ts` (adapter)
- Direct API calls → Service layer pattern
- Component logic → Separated into hooks

## Future Improvements

- [ ] Add block templates
- [ ] Drag & drop reordering
- [ ] Block versioning
- [ ] Import/Export functionality
- [ ] Block preview cache
- [ ] Offline support

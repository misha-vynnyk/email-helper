# Email Blocks

This directory contains predefined email blocks that are automatically loaded into the Block Library.

## Creating a New Block

Each block should be a separate `.ts` file that exports a default `EmailBlock` object:

```typescript
import { EmailBlock } from '../types/block';

const MyBlock: EmailBlock = {
  id: 'unique-block-id',
  name: 'Block Display Name',
  category: 'Content', // Structure | Content | Buttons | Footer | Headers | Social | Custom
  keywords: ['keyword1', 'keyword2', 'searchable'],
  preview: '', // Optional: URL or base64 image
  html: `
    <!-- Email-safe HTML here -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <!-- Your content -->
    </table>
  `.trim(),
  createdAt: Date.now(),
};

export default MyBlock;
```

## Email-Safe HTML Guidelines

1. **Use table-based layouts** - Most email clients still require tables for layout
2. **Inline styles** - Always use inline CSS, avoid `<style>` tags
3. **Absolute URLs** - Use full URLs for images, not relative paths
4. **No JavaScript** - Email clients strip out JavaScript
5. **No external CSS** - Inline all styles
6. **Test rendering** - Use the preview feature to verify appearance

## Available Blocks

- `header-simple.ts` - Simple logo header
- `header-with-nav.ts` - Header with navigation links
- `hero-section.ts` - Hero banner with CTA
- `button-primary.ts` - Primary call-to-action button
- `text-paragraph.ts` - Text content block
- `footer-simple.ts` - Simple footer with links
- `social-icons.ts` - Social media icon links
- `divider-line.ts` - Horizontal divider
- `two-column-layout.ts` - Two-column responsive layout

## Auto-Loading

All `.ts` files in this directory are automatically loaded using Vite's `import.meta.glob`. No manual registration required!

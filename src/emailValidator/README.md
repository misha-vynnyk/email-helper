# Email Validator

HTML email validation and auto-fix tool with comprehensive rule checking.

## Features

- **HTML Validation** - Check email HTML for common issues
- **Auto-Fix** - Automatically fix many validation issues
- **Rule Categories** - Grouped by severity and type
- **Live Preview** - See issues highlighted in real-time
- **Detailed Reports** - Line numbers and fix suggestions
- **Batch Fixing** - Fix all issues of a category or severity

## Usage

```typescript
import { EmailValidationPanel } from '@/emailValidator';

function MyEditor() {
  const [html, setHtml] = useState('<html>...</html>');

  return (
    <EmailValidationPanel
      html={html}
      onHtmlChange={setHtml}
    />
  );
}
```

## Components

### EmailValidationPanel

Main validation UI component.

**Props:**

- `html: string` - HTML to validate
- `onHtmlChange?: (html: string) => void` - Callback for HTML changes (required for auto-fix)
- `autoValidate?: boolean` - Auto-validate on HTML change (default: true)
- `debounceMs?: number` - Debounce delay for auto-validation (default: 500ms)

## Validation Rules

### Structure Issues (Critical)

- Missing DOCTYPE
- Missing HTML, HEAD, or BODY tags
- Missing meta viewport
- Missing charset declaration

### Accessibility (High)

- Images without alt text
- Links without meaningful text
- Low contrast text
- Missing ARIA labels

### Email Client Compatibility (High)

- Unsupported CSS properties
- JavaScript usage (not allowed)
- External fonts without fallbacks
- Fixed positioning (unsupported)

### Performance (Medium)

- Large images (> 100 KB)
- Too many HTTP requests
- Inline styles too large

### Best Practices (Low)

- Semantic HTML usage
- Proper heading hierarchy
- Table layout recommendations
- Readable text size

## Auto-Fix Capabilities

The validator can automatically fix:

- Add missing DOCTYPE
- Insert meta viewport tag
- Add charset declaration
- Generate alt text for images
- Convert deprecated tags
- Fix malformed HTML
- Add ARIA labels

## API

### Validation

```typescript
interface ValidationIssue {
  rule: string;
  severity: "error" | "warning" | "info";
  message: string;
  line?: number;
  column?: number;
  fixable: boolean;
  category: string;
}

interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  summary: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
  };
}
```

### Usage

```typescript
import { validateEmailHtml } from "@/emailValidator/validator";

const result = validateEmailHtml(html);

if (!result.valid) {
  console.log(`Found ${result.summary.errors} errors`);
  result.issues.forEach((issue) => {
    console.log(`${issue.severity}: ${issue.message}`);
  });
}
```

## Categories

- **Structure** - HTML structure and required tags
- **Accessibility** - A11y compliance
- **Compatibility** - Email client support
- **Performance** - Loading and size optimization
- **Best Practices** - General HTML best practices
- **Security** - XSS and injection prevention

## Severity Levels

- **Error** (🔴) - Must fix, will cause rendering issues
- **Warning** (🟡) - Should fix, may cause problems
- **Info** (🔵) - Optional improvements

## Integration

### With Email Builder

```typescript
import { EmailBuilder } from '@/documents';
import { EmailValidationPanel } from '@/emailValidator';

function EditorWithValidation() {
  const [html, setHtml] = useState('');

  return (
    <>
      <EmailBuilder value={html} onChange={setHtml} />
      <EmailValidationPanel html={html} onHtmlChange={setHtml} />
    </>
  );
}
```

### Standalone Validation

```typescript
import { validateEmailHtml, autoFixIssues } from "@/emailValidator";

async function validateAndFix(html: string) {
  const result = validateEmailHtml(html);

  if (!result.valid) {
    const fixed = await autoFixIssues(html, result.issues);
    return fixed;
  }

  return html;
}
```

## Configuration

```typescript
const validatorConfig = {
  maxImageSize: 100 * 1024, // 100 KB
  maxLineLength: 120,
  requiredMeta: ['viewport', 'charset'],
  allowedCssProperties: [...],
  disallowedTags: ['script', 'iframe'],
};
```

## Best Practices

1. **Validate early** - Check HTML during editing
2. **Fix critical issues** - Always fix errors
3. **Test in clients** - Validation doesn't replace testing
4. **Use semantic HTML** - Better for accessibility
5. **Keep styles inline** - Email client compatibility
6. **Optimize images** - Reduce file size
7. **Test responsiveness** - Check on mobile devices

## Future Improvements

- [ ] Custom validation rules
- [ ] Rule configuration UI
- [ ] Export validation reports
- [ ] Integration with testing tools
- [ ] Accessibility score
- [ ] Client-specific validation
- [ ] Historical validation tracking

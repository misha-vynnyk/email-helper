# Code Audit - Bugs & Issues Found

## 🐛 Critical Bugs

### 1. **EstimatedSizeIndicator - Empty originalFormat handling**
**File**: `src/imageConverter/components/EstimatedSizeIndicator.tsx`
**Line**: 27-30

**Problem**:
```typescript
if (!originalFormat || originalFormat.length === 0) {
  console.warn("[EstimatedSizeIndicator] Missing originalFormat, using fallback");
  // Fallback to settings format  ← NO ACTUAL FALLBACK!
}
```

**Impact**:
- Якщо `originalFormat` пустий, код продовжує з пустим string
- `estimateOutputSize` отримує `""` і всі `.includes()` перевірки fallback до `else`
- Неточні розрахунки

**Fix**:
```typescript
let effectiveFormat = originalFormat;
if (!effectiveFormat || effectiveFormat.length === 0) {
  console.warn("[EstimatedSizeIndicator] Missing originalFormat, using fallback to settings format");
  effectiveFormat = `image/${settings.format}`; // e.g., "image/jpeg"
}

const estimatedSize = estimateOutputSize(originalSize, effectiveFormat, settings);
```

---

### 2. **estimatedSizeCalculator - No fallback for unknown formats**
**File**: `src/imageConverter/utils/estimatedSizeCalculator.ts`
**Lines**: 33-76

**Problem**:
```typescript
if (settings.format === "jpeg") {
  // ...
} else if (settings.format === "webp") {
  // ...
}
// ...
else if (settings.format === "gif") {
  // ...
}
// NO else clause! baseRatio stays 1.0 for unknown formats
```

**Impact**:
- Якщо якось передається неправильний format, estimation буде 1:1 (неточно)
- No error handling

**Fix**:
```typescript
} else {
  // Unknown format - conservative estimate
  console.warn(`[estimatedSizeCalculator] Unknown format: ${settings.format}`);
  baseRatio = 0.8; // Default conservative estimate
}
```

---

### 3. **ConversionSettings - Division by zero risk**
**File**: `src/imageConverter/components/ConversionSettings.tsx`
**Line**: 44

**Problem**:
```typescript
const averageOriginalSize = files.length > 0 ? totalOriginalSize / files.length : 0;
```

**Potential Issue**:
- Якщо файли є, але всі мають `originalSize = 0`, average буде 0
- EstimatedSizeIndicator return null (правильно)
- Але логіка може бути кращою

**Fix**: Not critical, but could add validation:
```typescript
const filesWithSize = files.filter(f => f.originalSize > 0);
const totalOriginalSize = filesWithSize.reduce((sum, f) => sum + f.originalSize, 0);
const averageOriginalSize = filesWithSize.length > 0 ? totalOriginalSize / filesWithSize.length : 0;
```

---

## ⚠️ Medium Priority Issues

### 4. **ConversionSettings - Inefficient format detection**
**File**: `src/imageConverter/components/ConversionSettings.tsx`
**Lines**: 47-59

**Problem**:
```typescript
const getRepresentativeFormat = () => {
  if (files.length === 0) return "";

  // Count formats
  const formatCounts = files.reduce((acc, f) => {
    const type = f.file?.type || "";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get most common
  const mostCommon = Object.entries(formatCounts).sort(([,a], [,b]) => b - a)[0];
  return mostCommon ? mostCommon[0] : files[0]?.file?.type || "";
};
```

**Issues**:
- Runs on every render (re-calculation)
- Sort is O(n log n) - unnecessary for finding max
- No memoization

**Fix**:
```typescript
import { useMemo } from "react";

const representativeFormat = useMemo(() => {
  if (files.length === 0) return "";

  // Count formats
  const formatCounts = new Map<string, number>();
  files.forEach(f => {
    const type = f.file?.type || "";
    formatCounts.set(type, (formatCounts.get(type) || 0) + 1);
  });

  // Find most common (O(n) instead of O(n log n))
  let maxCount = 0;
  let mostCommon = "";
  formatCounts.forEach((count, format) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = format;
    }
  });

  return mostCommon || files[0]?.file?.type || "";
}, [files]);
```

---

### 5. **estimatedSizeCalculator - Hardcoded dimensions assumption**
**File**: `src/imageConverter/utils/estimatedSizeCalculator.ts`
**Line**: 137, 154

**Problem**:
```typescript
const assumedOriginalDimension = 2500;  // Line 137
const assumedOriginalWidth = 800;       // Line 154
```

**Impact**:
- Resize calculations based on wrong assumptions can be way off
- 800px assumption for GIF is especially problematic

**Fix**:
Could accept optional `originalDimensions` parameter, but це потребує refactoring.
For now - OK as rough estimate, but documented limitation.

---

### 6. **QualityControl - No validation for quality bounds**
**File**: `src/imageConverter/components/QualityControl.tsx`
**Line**: 102

**Problem**:
```typescript
onChange={(_, value) => onQualityChange(value as number)}
```

**Potential Issue**:
- Slider може повернути array якщо `range={true}` (хоча тут немає)
- No validation що value в межах 1-100

**Fix**:
```typescript
onChange={(_, value) => {
  const numValue = Array.isArray(value) ? value[0] : value;
  const clampedValue = Math.max(1, Math.min(100, numValue));
  onQualityChange(clampedValue);
}}
```

---

## 💡 Minor Issues / Improvements

### 7. **EstimatedSizeIndicator - Potential NaN in width calculation**
**File**: `src/imageConverter/components/EstimatedSizeIndicator.tsx`
**Line**: 121

**Problem**:
```typescript
width: `${Math.min(100, (estimatedSize / originalSize) * 100)}%`,
```

**Potential Issue**:
- Якщо `originalSize === 0` (shouldn't happen через validation, але...)
- Може бути `NaN%` → invalid CSS

**Fix**: Already validated above, but could add extra safety:
```typescript
width: `${Math.min(100, Math.max(0, (estimatedSize / originalSize) * 100 || 0))}%`,
```

---

### 8. **QuickPresetsBar - Missing null check**
**File**: `src/imageConverter/components/QuickPresetsBar.tsx`
**Line**: 50

**Problem**:
```typescript
icon={PRESET_ICONS[presetId]}
```

**Potential Issue**:
- Якщо додається новий preset без іконки → icon буде `undefined`
- React warning

**Fix**:
```typescript
icon={PRESET_ICONS[presetId] || <SettingsIcon fontSize="small" />}
```

---

### 9. **ConversionSettings - No loading state for empty files**
**File**: `src/imageConverter/components/ConversionSettings.tsx`

**Observation**:
- Коли `files.length === 0`, EstimatedSizeIndicator просто не показується
- Можна додати placeholder message: "Upload files to see size estimation"

**Improvement**:
```typescript
{files.length === 0 ? (
  <Alert severity="info" sx={{ mt: 2 }}>
    Upload images to see estimated output sizes
  </Alert>
) : originalSize > 0 ? (
  <EstimatedSizeIndicator
    originalSize={originalSize}
    originalFormat={originalFormat}
    settings={settings}
  />
) : null}
```

---

## 🔍 Code Quality Issues

### 10. **Inconsistent error handling**

**Observations**:
- `EstimatedSizeIndicator` uses `console.warn` and `console.error`
- `estimatedSizeCalculator` не має логування
- Немає centralized error boundary для цих компонентів

**Recommendation**:
- Use logger utility consistently
- Add error boundary wrapper

---

### 11. **Missing PropTypes / Type validation**

**Files**: All new components

**Observation**:
- TypeScript interfaces є ✅
- Але runtime validation немає
- Якщо з context приходять неправильні дані → crashes

**Recommendation**:
- Add runtime assertions в development mode
- Use `zod` або `yup` для validation settings

---

### 12. **No unit tests for new components**

**Files**:
- `FormatTabsSelector.tsx`
- `QuickPresetsBar.tsx`
- `QualityControl.tsx`
- `EstimatedSizeIndicator.tsx`
- `AdvancedSettingsSection.tsx`

**Impact**:
- No test coverage для Phase 1 redesign
- Regression risks

**Recommendation**:
- Add Jest/React Testing Library tests
- Focus on:
  - EstimatedSizeIndicator calculations
  - QualityControl state changes
  - FormatTabsSelector selection

---

## 📊 Summary

### Critical (Must Fix): 2
1. ✅ EstimatedSizeIndicator - Empty originalFormat fallback
2. ✅ estimatedSizeCalculator - Unknown format handling

### Medium (Should Fix): 5
3. ⚠️ ConversionSettings - Division by zero edge case
4. ⚠️ ConversionSettings - Inefficient format detection
5. ⚠️ estimatedSizeCalculator - Hardcoded assumptions
6. ⚠️ QualityControl - No validation bounds
8. ⚠️ QuickPresetsBar - Missing icon fallback

### Minor (Nice to Have): 4
7. 💡 EstimatedSizeIndicator - Extra NaN safety
9. 💡 ConversionSettings - Empty state message
10. 💡 Inconsistent error handling
11. 💡 Missing runtime validation
12. 💡 No unit tests

---

## 🎯 Recommended Action Plan

### Immediate (Now):
1. Fix critical bugs #1 and #2
2. Add format detection memoization #4
3. Add icon fallback #8

### Short-term (This week):
4. Add quality bounds validation #6
5. Add empty state message #9
6. Improve error handling consistency #10

### Long-term (Next sprint):
7. Add unit tests #12
8. Add runtime validation #11
9. Review hardcoded assumptions #5

---

**Найбільш критичні для фіксу зараз**: #1, #2, #4

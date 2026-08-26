import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { RESPONSIVE_BREAKPOINT_PX, RESPONSIVE_TIER_ORDER, UTILITY_CLASS_CATALOG, type ResponsiveTier, type UtilityClassEntry } from "../responsiveUtilityCatalog";
import { updateResponsiveClassNames, useBuilderNode } from "../state/builderStore";

const TIER_LABEL: Record<ResponsiveTier, string> = { base: "Up to", sm: "Small — up to", xs: "Extra small — up to" };

function groupByCategory(entries: UtilityClassEntry[]): Array<{ group: string; entries: UtilityClassEntry[] }> {
  const groups = new Map<string, UtilityClassEntry[]>();
  for (const entry of entries) {
    const group = groups.get(entry.group);
    if (group) group.push(entry);
    else groups.set(entry.group, [entry]);
  }
  return [...groups.entries()].map(([group, groupEntries]) => ({ group, entries: groupEntries }));
}

/** Catalog is static module-level data — partition it into tiers/groups once at module load,
 * not on every render of every picker instance (the catalog has ~250 entries). */
const TIERS = RESPONSIVE_TIER_ORDER.map((tier) => {
  const tierEntries = UTILITY_CLASS_CATALOG.filter((entry) => entry.tier === tier);
  return { tier, tierEntries, groups: groupByCategory(tierEntries) };
});

interface ResponsiveClassPickerProps {
  nodeId: string;
}

/** Grouped checklist over the full UTILITY_CLASS_CATALOG (Display/Width/.../Misc within each of
 * the 3 fixed breakpoints), shown for any selected node regardless of its type — leaf, Section/
 * Row, or ready-made block. Only classes actually checked anywhere on the canvas end up in the
 * exported document's <style> — see render/collectResponsiveUsage.ts. Persists through
 * `updateResponsiveClassNames`, not the leaf-only `updateNodeFields` — containers need this to
 * actually save too. */
export function ResponsiveClassPicker({ nodeId }: ResponsiveClassPickerProps) {
  const node = useBuilderNode(nodeId);
  if (!node) return null;

  const selected = new Set(node.responsiveClassNames ?? []);

  const toggle = (className: string, checked: boolean) => {
    const next = checked ? [...selected, className] : [...selected].filter((c) => c !== className);
    updateResponsiveClassNames(nodeId, next);
  };

  return (
    <section className='space-y-2'>
      <h3 className='text-xs font-bold text-muted-foreground uppercase'>Responsive</h3>
      <div className='space-y-1.5'>
        {TIERS.map(({ tier, tierEntries, groups }) => {
          const tierSelectedCount = tierEntries.filter((entry) => selected.has(entry.className)).length;

          return (
            <details key={tier} className='rounded-md border border-border/50'>
              <summary className='cursor-pointer select-none px-2 py-1.5 text-xs font-semibold'>
                {TIER_LABEL[tier]} {RESPONSIVE_BREAKPOINT_PX[tier]}px{tierSelectedCount > 0 ? ` (${tierSelectedCount})` : ""}
              </summary>
              <div className='space-y-1 px-2 pb-2'>
                {groups.map(({ group, entries }) => (
                  <details key={group}>
                    <summary className='cursor-pointer select-none text-[11px] font-medium text-muted-foreground'>{group}</summary>
                    <div className='grid grid-cols-2 gap-x-2 gap-y-1 py-1'>
                      {entries.map((entry) => (
                        <label key={entry.className} className='flex items-center gap-1.5 text-[11px]'>
                          <Checkbox checked={selected.has(entry.className)} onCheckedChange={(checked) => toggle(entry.className, Boolean(checked))} />
                          <Label className='text-[11px] font-normal cursor-pointer'>{entry.className}</Label>
                        </label>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

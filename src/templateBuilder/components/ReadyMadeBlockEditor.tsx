import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { READY_MADE_BY_ID } from "../readyMadeCatalog";
import { updateNodeFields } from "../state/builderStore";
import type { ReadyMadeBlock } from "../types";

interface ReadyMadeBlockEditorProps {
  block: ReadyMadeBlock;
}

/** One input per the block's own definition.slots — the whole point of a ready-made block is
 * that it only exposes a handful of named slots, not a rich per-field form like Text/Image/
 * Button get. Works for any current or future catalog entry with no new editor code, since it's
 * driven entirely by readyMadeCatalog.ts data. */
export function ReadyMadeBlockEditor({ block }: ReadyMadeBlockEditorProps) {
  const definition = READY_MADE_BY_ID.get(block.definitionId);
  if (!definition) return <p className='text-xs text-muted-foreground'>Unknown ready-made block ({block.definitionId}).</p>;

  const setValue = (key: string, value: string) => updateNodeFields(block.id, { values: { ...block.values, [key]: value } });

  return (
    <div className='space-y-2'>
      {definition.slots.map((slot) => (
        <div key={slot.key} className='space-y-1'>
          <Label className='text-xs text-muted-foreground'>{slot.label}</Label>
          <Input value={block.values[slot.key] ?? ""} onChange={(e) => setValue(slot.key, e.target.value)} placeholder={slot.kind === "href" ? "https://..." : undefined} />
        </div>
      ))}
    </div>
  );
}

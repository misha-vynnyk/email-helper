import { useMemo } from "react";

import { findBlockOrLeaf, useCanvas } from "../state/builderStore";
import { useSelectedId } from "../state/selectionStore";
import { ImageBlockEditor } from "./ImageBlockEditor";
import { RowInspectorForm } from "./RowInspectorForm";
import { SectionInspectorForm } from "./SectionInspectorForm";
import { ShellSettingsForm } from "./ShellSettingsForm";
import { TextBlockEditor } from "./TextBlockEditor";

export function Inspector() {
  const canvas = useCanvas();
  const selectedId = useSelectedId();
  const lookup = useMemo(() => (selectedId ? findBlockOrLeaf(canvas, selectedId) : undefined), [canvas, selectedId]);

  return (
    <div className='space-y-4'>
      <section className='space-y-2'>
        <h3 className='text-xs font-bold text-muted-foreground uppercase'>MainContainer</h3>
        <ShellSettingsForm />
      </section>

      <section className='space-y-2'>
        <h3 className='text-xs font-bold text-muted-foreground uppercase'>Selected block</h3>
        {!lookup && <p className='text-xs text-muted-foreground'>Click a block on the canvas to edit it.</p>}
        {lookup?.kind === "section" && <SectionInspectorForm section={lookup.block} />}
        {lookup?.kind === "row" && (
          <div className='space-y-2'>
            <p className='text-xs text-muted-foreground'>Row with {lookup.block.columns.length} columns — drag text/image into a column.</p>
            <RowInspectorForm row={lookup.block} />
          </div>
        )}
        {lookup?.kind === "leaf" && (lookup.block.type === "text" ? <TextBlockEditor block={lookup.block} /> : <ImageBlockEditor block={lookup.block} />)}
      </section>
    </div>
  );
}

import { useMemo } from "react";

import { findBlockOrLeaf, useNodesMap } from "../state/builderStore";
import { useSelectedId } from "../state/selectionStore";
import type { BuilderLeafBlock } from "../types";
import { ButtonBlockEditor } from "./ButtonBlockEditor";
import { DividerBlockEditor } from "./DividerBlockEditor";
import { ImageBlockEditor } from "./ImageBlockEditor";
import { RowInspectorForm } from "./RowInspectorForm";
import { SectionInspectorForm } from "./SectionInspectorForm";
import { ShellSettingsForm } from "./ShellSettingsForm";
import { SpacerBlockEditor } from "./SpacerBlockEditor";
import { TextBlockEditor } from "./TextBlockEditor";

function renderLeafEditor(leaf: BuilderLeafBlock) {
  switch (leaf.type) {
    case "text":
      return <TextBlockEditor block={leaf} />;
    case "image":
      return <ImageBlockEditor block={leaf} />;
    case "button":
      return <ButtonBlockEditor block={leaf} />;
    case "divider":
      return <DividerBlockEditor block={leaf} />;
    case "spacer":
      return <SpacerBlockEditor block={leaf} />;
  }
}

export function Inspector() {
  const nodes = useNodesMap();
  const selectedId = useSelectedId();
  const lookup = useMemo(() => (selectedId ? findBlockOrLeaf(selectedId) : undefined), [nodes, selectedId]);

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
            <p className='text-xs text-muted-foreground'>Row with {lookup.block.childIds.length} columns — drag a block into a column.</p>
            <RowInspectorForm row={lookup.block} />
          </div>
        )}
        {lookup?.kind === "leaf" && renderLeafEditor(lookup.block)}
      </section>
    </div>
  );
}

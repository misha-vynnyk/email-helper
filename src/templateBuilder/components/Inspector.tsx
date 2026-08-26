import { useBuilderNode } from "../state/builderStore";
import { useSelectedId } from "../state/selectionStore";
import { isContainerNode, type BuilderLeafBlock, type BuilderNode } from "../types";
import { ButtonBlockEditor } from "./ButtonBlockEditor";
import { DividerBlockEditor } from "./DividerBlockEditor";
import { ImageBlockEditor } from "./ImageBlockEditor";
import { ReadyMadeBlockEditor } from "./ReadyMadeBlockEditor";
import { ResponsiveClassPicker } from "./ResponsiveClassPicker";
import { RowInspectorForm } from "./RowInspectorForm";
import { SectionInspectorForm } from "./SectionInspectorForm";
import { ShellSettingsForm } from "./ShellSettingsForm";
import { SpacerBlockEditor } from "./SpacerBlockEditor";
import { TextBlockEditor } from "./TextBlockEditor";

function isLeafBlock(node: BuilderNode): node is BuilderLeafBlock {
  return !isContainerNode(node) && node.type !== "ready-made";
}

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

/** Subscribes only to the SELECTED node (not the whole nodes map) — editing any other block on
 * the canvas doesn't re-render this panel, only a change to the currently selected one does. */
export function Inspector() {
  const selectedId = useSelectedId();
  const node = useBuilderNode(selectedId ?? "");

  return (
    <div className='space-y-4'>
      <section className='space-y-2'>
        <h3 className='text-xs font-bold text-muted-foreground uppercase'>MainContainer</h3>
        <ShellSettingsForm />
      </section>

      <section className='space-y-2'>
        <h3 className='text-xs font-bold text-muted-foreground uppercase'>Selected block</h3>
        {!node && <p className='text-xs text-muted-foreground'>Click a block on the canvas to edit it.</p>}
        {node?.type === "section" && <SectionInspectorForm section={node} />}
        {node?.type === "row" && (
          <div className='space-y-2'>
            <p className='text-xs text-muted-foreground'>Row with {node.childIds.length} columns — drag a block into a column.</p>
            <RowInspectorForm row={node} />
          </div>
        )}
        {node && isLeafBlock(node) && renderLeafEditor(node)}
        {node?.type === "ready-made" && <ReadyMadeBlockEditor block={node} />}
      </section>

      {node && <ResponsiveClassPicker nodeId={node.id} />}
    </div>
  );
}

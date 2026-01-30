import type { CSSProperties, ReactElement } from "react";
import { List } from "react-window";

type BaseRowRenderProps = {
  ariaAttributes: object;
  index: number;
  style: CSSProperties;
};

export type VirtualListProps<RowProps> = {
  rowComponent: (props: BaseRowRenderProps & RowProps) => ReactElement | null;
  rowCount: number;
  rowHeight: number;
  rowProps: RowProps;
  overscanCount?: number;
  style?: CSSProperties;
  // Allow passing key from parent without fighting TS
  listKey?: string;
};

/**
 * Typed wrapper around react-window v2 `List`.
 *
 * react-window v2 typing is strict around `rowProps` and injected row render props.
 * We keep the cast isolated here so feature code stays type-safe and clean.
 */
export function VirtualList<RowProps>({
  listKey,
  ...props
}: VirtualListProps<RowProps>): ReactElement {
  const ListCompat = List as unknown as (p: any) => ReactElement;
  return <ListCompat key={listKey} {...props} />;
}


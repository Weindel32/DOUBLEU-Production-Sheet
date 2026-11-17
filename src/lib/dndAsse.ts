import type { Modifier } from "@dnd-kit/core";

/** Trascinamento solo in verticale: le righe si spostano su e giù, non di lato. */
export const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

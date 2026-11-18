/**
 * Ambient declarations for the shell's platform modules.
 *
 * Those modules exist only in the running page: the browser half leaves them as
 * `require()` calls into the shell's module table, and no package provides their
 * types outside the harness checkout. Each declaration below is the slice of a
 * platform module this plugin actually uses.
 */
declare module '@deepseek-ai/dsh-client-ui-primitives' {
  import type { ComponentType } from 'react'

  /** Regular-weight map-pin glyph of the shared product icon set. */
  export const IconPinOutlineRegular: ComponentType<{ size?: number }>
}

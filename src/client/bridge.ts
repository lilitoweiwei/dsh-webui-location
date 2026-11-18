/**
 * Holds each open Session's composer actions for the `+` menu row.
 *
 * The shell hands the composer actions to slot components as props, never
 * through a service, so a command action cannot reach them on its own. This
 * package registers one entry that renders nothing and exists only to publish
 * its own props.
 */

import { useEffect } from 'react'
import type { Context } from '@deepseek-ai/cordis'

/** Revision-guarded caret span of the composer draft. */
export interface InsertionSpan {
  readonly start: number
  readonly end: number
  readonly draftRev: number
}

/** The composer actions this plugin uses, as the shell passes them to slot components. */
export interface ComposerActions {
  /** @returns the caret span to insert at, revision-guarded against later edits. */
  captureInsertion(): InsertionSpan
  /**
   * @param text - plain text inserted in one undo step.
   * @param span - the span `captureInsertion` returned.
   * @returns whether the editor applied it; false when the draft moved or is locked.
   */
  insertText(text: string, span: InsertionSpan): boolean
}

/** The `ctx.slots` face this package calls. */
interface SlotsFace {
  inject(key: string, contribute: () => () => void): void
  register(options: Record<string, unknown>, component: unknown): () => void
}

/**
 * Slot key holding compact controls at the left of the composer tool row.
 *
 * A Session-scope list slot is the only place an outside plugin can pick up the
 * standard props, and this one renders whenever a Session's composer is mounted.
 * The ambient `conversation.composer.dock` is declared but not rendered by the
 * shipped layout, so an entry registered there never mounts.
 */
const SLOT = 'conversation.input.left'

/** Actions parked per Session, published by the mounted bridge entry. */
const held = new Map<string, ComposerActions>()

/**
 * The composer actions of one open Session.
 * @param sessionId - Session identity.
 * @returns the actions, or undefined before that Session's composer mounts.
 */
export function composerActions(sessionId: string): ComposerActions | undefined {
  return held.get(sessionId)
}

/** The standard slot props this bridge reads. */
interface BridgeProps {
  readonly sessionId?: string
  readonly inputActions?: ComposerActions
}

/**
 * Publish the props it is given and render nothing.
 * @param props - the standard Session slot props.
 * @returns null, so the composer row stays visually unchanged.
 */
function ComposerActionsBridge(props: BridgeProps): null {
  const { sessionId, inputActions } = props
  useEffect(() => {
    if (sessionId === undefined || inputActions === undefined) return undefined
    held.set(sessionId, inputActions)
    return () => {
      if (held.get(sessionId) === inputActions) held.delete(sessionId)
    }
  }, [sessionId, inputActions])
  return null
}

/**
 * Register the bridge into the composer tool row.
 * @param ctx - browser root context.
 * @returns the disposer that removes the entry.
 */
export function installComposerActionsBridge(ctx: Context): () => void {
  const slots = ctx.get('slots') as SlotsFace
  let dispose: (() => void) | undefined
  slots.inject(SLOT, () => {
    dispose = slots.register({ name: SLOT, id: 'location', order: 90 }, ComposerActionsBridge)
    return () => {
      dispose?.()
      dispose = undefined
    }
  })
  return () => {
    dispose?.()
  }
}

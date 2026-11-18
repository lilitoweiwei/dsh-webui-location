/** Browser half: one `+` menu row that writes the current position into the composer. */

import type { Context } from '@deepseek-ai/cordis'
import { IconPinOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import { composerActions, installComposerActionsBridge } from './bridge.ts'
import { formatLocation } from './format.ts'
import { requestLocation } from './location.ts'

/** Services this half needs before it can contribute anything. */
export const inject = ['slots', 'commandUi', 'sessions']

/** The `ctx.commandUi` face this package calls. */
interface CommandsFace {
  register(contribution: {
    name: string
    label(): string
    description(): string
    icon: unknown
    available(session: { readonly sessionId: string }): boolean
    ui: { readonly kind: 'action'; run(session: { readonly sessionId: string }): void }
  }): () => void
}

/** One Session's composer input, as this package reaches it. */
interface SessionInputFace {
  /**
   * Show one notice in the composer.
   * @param level - severity tier.
   * @param text - notice body.
   */
  notify(level: 'info' | 'error', text: string): void
}

/** The per-Session input resolver the conversation service exposes. */
interface ConversationFace {
  readonly input: { for(actx: Context): SessionInputFace }
}

/** The `ctx.sessions` face this package calls. */
interface SessionsFace {
  scope(sessionId: string): Context | undefined
}

/** Sessions with a request in flight, so a second click cannot insert twice. */
const pending = new Set<string>()

/**
 * Register the bridge and the menu row.
 * @param ctx - browser root context.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => installComposerActionsBridge(ctx), 'dsh-webui-location: composer actions bridge')
  const commands = ctx.get('commandUi') as CommandsFace
  ctx.effect(() => commands.register({
    name: 'location',
    label: () => '位置信息',
    description: () => '把浏览器当前的精确位置写入输入框',
    icon: IconPinOutlineRegular,
    available: session => composerActions(session.sessionId) !== undefined,
    ui: { kind: 'action', run: (session) => { void insertLocation(ctx, session.sessionId) } },
  }), 'dsh-webui-location: add-menu row')
}

/**
 * Ask for a fix and write it at the composer caret, or report why it failed.
 * @param ctx - browser root context.
 * @param sessionId - Session whose composer receives the line.
 */
async function insertLocation(ctx: Context, sessionId: string): Promise<void> {
  const actx = (ctx.get('sessions') as SessionsFace).scope(sessionId)
  const conversation = actx?.get('conversation') as ConversationFace | undefined
  if (actx === undefined || conversation === undefined) return
  const input = conversation.input.for(actx)
  const actions = composerActions(sessionId)
  if (actions === undefined) {
    input.notify('error', '输入框尚未就绪，请稍后重试')
    return
  }
  if (pending.has(sessionId)) {
    input.notify('info', '正在获取位置…')
    return
  }
  pending.add(sessionId)
  try {
    const outcome = await requestLocation()
    if (outcome.kind === 'failed') {
      input.notify('error', `无法获取位置：${outcome.reason}`)
      return
    }
    if (!actions.insertText(formatLocation(outcome.fix, outcome.at), actions.captureInsertion())) {
      input.notify('error', '输入框正忙，未能写入位置')
    }
  } finally {
    pending.delete(sessionId)
  }
}

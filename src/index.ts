import type { Context, Session } from 'koishi'
import { h, Schema } from 'koishi'
import { escapeMarkdown } from 'koishi-plugin-adapter-qq-crack'
import { shortcut } from 'koishi-plugin-montmorill'

export const name = 'one-more-time'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

declare module 'koishi' {
  interface Session {
    oneMoreTime?: string
  }
}

export function apply(ctx: Context) {
  const stream = '<qq:markdown stream="[object Object]">'
  const atSelf = (session: Session) => {
    return `<at id="${session.selfId}"/>`
  }

  ctx.on('message-created', (session) => {
    session.oneMoreTime = session.content?.replace(atSelf(session), '').trim()
  })

  ctx.on('before-send', (session) => {
    session.content ??= ''
    session.content = session.content.replace(h.escape(atSelf(session)), '').trim()
    if (!session.oneMoreTime || session.content.startsWith(stream))
      return

    const oneMoreTime = `> 再来一次 👉 ${shortcut(session.isDirect, session.oneMoreTime)}`
    const element = session.elements?.[0]
    const content = element?.type.includes('markdown')
      ? h.unescape(element.children.join(''))
      : escapeMarkdown(session.content)
    session.elements = [h('markdown', `${content}\n${oneMoreTime}`)]
  })
}

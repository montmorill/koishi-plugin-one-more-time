import type { Context, Session } from 'koishi'
import { h, Schema } from 'koishi'
import { escapeMarkdown } from 'koishi-plugin-adapter-qq-crack'
import { shortcut } from 'koishi-plugin-montmorill'

export const name = 'one-more-time'

export interface Config {
  filterAtSelf: boolean
  skipWords: string[]
}

export const Config: Schema<Config> = Schema.object({
  filterAtSelf: Schema.boolean().default(true).description('过滤 <at id="selfId"/> 元素。'),
  skipWords: Schema.array(Schema.string()).default([
    '<qq:markdown stream="[object Object]">',
    '✅️回答正确！',
    '❌️回答错误！',
  ]).description('跳过含有这些关键词的内容。'),
})

declare module 'koishi' {
  interface Session {
    oneMoreTime?: string
  }
}

export function apply(ctx: Context, config: Config) {
  const atSelf = (session: Session) => {
    return `<at id="${session.selfId}"/>`
  }

  ctx.on('message-created', (session) => {
    session.oneMoreTime = session.content
    if (config.filterAtSelf) {
      session.oneMoreTime = session.oneMoreTime
        ?.replace(atSelf(session), '')
        .trimStart()
    }
  })

  ctx.on('before-send', (session) => {
    session.content ??= ''
    session.content = session.content.replace(h.escape(atSelf(session)), '')
    if (!session.oneMoreTime
      || config.skipWords.some(word => session.content?.includes(word))) {
      return
    }

    const oneMoreTime = `> 再来一次 👉 ${shortcut(session.isDirect, session.oneMoreTime)}`
    const element = session.elements?.[0]
    const content = element?.type.includes('markdown')
      ? h.unescape(element.children.join(''))
      : escapeMarkdown(session.content)
    session.elements = [h('markdown', `${content}\n${oneMoreTime}`)]
  })
}

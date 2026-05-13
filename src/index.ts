import type { Context } from 'koishi'
import { h, Schema } from 'koishi'
import { escapeMarkdown } from 'koishi-plugin-adapter-qq-crack'
import { shortcut } from 'koishi-plugin-montmorill'

export const name = 'one-more-time'
export interface Config {
  maxLength: number
  skips: string[]
}

export const Config: Schema<Config> = Schema.object({
  maxLength: Schema.number().default(100).description('最大长度。'),
  skips: Schema.array(Schema.string()).default([]).description('跳过匹配的内容。'),
})

declare module 'koishi' {
  interface Session {
    oneMoreTime?: string
  }
}

export function apply(ctx: Context, config: Config) {
  ctx.on('message', (session) => {
    session.oneMoreTime = session.content?.replace(/\s+$/, ' ')
  })

  const skips = config.skips.map(regex => new RegExp(regex))

  ctx.before('send', (session) => {
    if (!session.content || !session.oneMoreTime
      || session.oneMoreTime.length > config.maxLength
      || skips.some(regex => regex.test(session.content!))) {
      return
    }

    const oneMoreTime = shortcut.input(session.oneMoreTime, '再来一次')
    const element = session.elements?.[0]
    const content = element?.type.includes('markdown')
      ? h.unescape(element.children.join(''))
      : escapeMarkdown(session.content)
    session.elements = [h('markdown', `${content}\n> 👉 ${oneMoreTime}`)]
  })
}

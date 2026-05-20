import type { Context } from 'koishi'
import { QQBot, QQMessageEncoder } from '@satorijs/adapter-qq'
import { h, Schema } from 'koishi'
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
    oneMoreTime?: {
      show: string
      text: string
    }
  }
}

export function apply(ctx: Context, config: Config) {
  ctx.on('message', async (session) => {
    if (session.bot instanceof QQBot && session.elements && session.channelId) {
      const encoder = new QQMessageEncoder(session.bot, session.channelId)
      encoder.ensureMarkdown()
      await encoder.render(session.elements)
      session.oneMoreTime = {
        show: encoder.content,
        text: session.content!,
      }
    }
  })

  const skips = config.skips.map(regex => new RegExp(regex))

  ctx.before('send', (session) => {
    if (!session.elements?.length || !session.oneMoreTime
      || session.oneMoreTime.text.length > config.maxLength
      || skips.some(regex => regex.test(session.content!))) {
      return
    }

    const oneMoreTime = session.oneMoreTime.text.includes('\n')
      ? `> 👉 ${shortcut.input(session.oneMoreTime.text, '再来一次')}`
      : `> 再来一次 👉 ${shortcut(session.isDirect, session.oneMoreTime.text, session.oneMoreTime.show)}`
    if (session.elements.some(element => element.type.replace('qq:', '').startsWith('ark')))
      session.elements.push(h('br'), h('markdown', oneMoreTime))
    else
      session.elements = [h('markdown', ...session.elements, h('br'), oneMoreTime)]
  })
}

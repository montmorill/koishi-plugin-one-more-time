import type { Context } from 'koishi'
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
    oneMoreTime?: string
  }
}

export function apply(ctx: Context, config: Config) {
  ctx.on('message', (session) => {
    if (session.elements?.[0].type === 'text') {
      const content: string = session.elements[0].attrs.content
      session.oneMoreTime = content.replace(/\s+$/, ' ')
    }
  })

  const skips = config.skips.map(regex => new RegExp(regex))

  ctx.before('send', (session) => {
    if (!session.elements?.length || !session.oneMoreTime
      || session.oneMoreTime.length > config.maxLength
      || skips.some(regex => regex.test(session.content!))) {
      return
    }

    let lastElement = session.elements[session.elements.length - 1]
    if (lastElement.type === 'text') {
      session.elements.pop()
      session.elements.push(...h.parse(lastElement.attrs.content))
      lastElement = session.elements[session.elements.length - 1]
    }
    const oneMoreTime = session.oneMoreTime.includes('\n')
      ? `> 👉 ${shortcut.input(session.oneMoreTime, '再来一次')}`
      : `> 再来一次 👉 ${shortcut(session.isDirect, session.oneMoreTime)}`
    if (lastElement.type.includes('markdown')) {
      lastElement.children.push(h.text(`\n${oneMoreTime}`))
    }
    else if (lastElement.type === 'text') {
      session.elements.push(h('p', h('markdown', oneMoreTime)))
    }
    else {
      session.elements.push(h('message', h('markdown', oneMoreTime)))
    }
  })
}

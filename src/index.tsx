import { Context, Logger, Schema } from 'koishi'
import {} from 'koishi-plugin-spark-service'

export const name = 'spark-assistant'
export const inject = ['spark']
export const reusable = true

const logger = new Logger(name)

export interface Config {
  name?: string
  command?: string
  assistant_id: string
  domain?: string
  temperature?: number
  top_k?: number
  max_tokens?: number
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    name: Schema.string().default('讯飞星火助手').description('助手名称，显示在帮助菜单中'),
    command: Schema.string().default('spark-assistant').description('调用指令'),
    assistant_id: Schema.string().required(),
  }).description('基础配置'),
  Schema.object({
    domain: Schema.string().default('general').description('需要使用的领域'),
    temperature: Schema.number().default(0.5).min(0.01).max(1).step(0.01).description('核采样阈值,向上调整可以增加结果的随机程度'),
    top_k: Schema.number().default(4).min(1).max(6).step(1).description('从k个中随机选择一个(非等概率)'),
    max_tokens: Schema.number().default(2048).min(1).max(4096).step(1).description('回答的tokens的最大长度'),
  }).description('模型参数'),
])

export function apply(ctx: Context, config: Config) {
  ctx.command(`${config.command} <prompt:text>`, config.name).action(async ({ session }, prompt: string) => {
    const endpoint = 'wss://spark-openapi.cn-huabei-1.xf-yun.com/v1/assistants/' + config.assistant_id
    try {
      const result = await ctx.spark.chat(
        endpoint,
        {
          domain: config.domain,
          temperature: config.temperature,
          top_k: config.top_k,
          max_tokens: config.max_tokens,
        },
        session.userId,
        [
          {
            role: 'user',
            content: prompt,
          },
        ]
      )
      if (result)
        return (
          <>
            <quote id={session.userId} />
            {result}
          </>
        )
    } catch (error) {
      logger.error(error)
      return (
        <>
          <quote id={session.userId} />
          请求错误
        </>
      )
    }
  })
}

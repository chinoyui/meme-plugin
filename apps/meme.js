import { Config } from '#components'
import { Meme, Utils } from '#models'

/**
 * 生成表情包命令匹配的正则表达式
 */
const createMemeRegExp = () => {
  const keywords = Utils.Tools.getAllKeywords()

  if (!keywords) return null

  const prefix = Config.meme.forceSharp ? '^#' : '^#?'
  const escapedKeywords = keywords.map(keyword =>
    keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  )

  const keywordsRegex = `(${escapedKeywords.join('|')})`
  return new RegExp(`${prefix}${keywordsRegex}(.*)`, 'i')
}

let memeRegExp = createMemeRegExp()

export class meme extends plugin {
  constructor () {
    super({
      name: '清语表情:表情包生成',
      event: 'message',
      priority: -Infinity,
      rule: []
    })

    this.rulesInitialized = false
    this.initRules()
  }

  /**
     * 初始化规则
     */
  initRules () {
    if (this.rulesInitialized || !memeRegExp) {
      return
    }

    this.rule.push({
      reg: memeRegExp,
      fnc: 'meme'
    })

    this.rulesInitialized = true
  }

  /**
     * 重新生成正则并更新规则
     */
  updateRegExp () {
    const newRegExp = createMemeRegExp()

    memeRegExp = newRegExp

    this.rule = [{
      reg: memeRegExp,
      fnc: 'meme'
    }]

    return true
  }

  async meme (e) {
    if (!Config.meme.Enable) return false

    const message = e.msg.trim()
    const match = message.match(memeRegExp)
    if (!match) return false

    const matchedKeyword = match[1]
    const userText = match[2]?.trim() || ''
    if (!matchedKeyword) return false

    const memeKey = await Utils.Tools.getKey(matchedKeyword)
    if (!memeKey) return false

    /**
         * 用户权限检查
         */
    if (Config.access.enable) {
      const userId = e.user_id
      if (Config.access.mode === 0 && !Config.access.userWhiteList.includes(userId)) {
        logger.info(`[清语表情] 用户 ${userId} 不在白名单中，跳过生成`)
        return false
      } else if (Config.access.mode === 1 && Config.access.userBlackList.includes(userId)) {
        logger.info(`[清语表情] 用户 ${userId} 在黑名单中，跳过生成`)
        return false
      }
    }

    /**
         * 禁用表情列表
         */
    if (Config.access.blackListEnable && await Utils.Tools.isBlacklisted(matchedKeyword)) {
      logger.info(`[清语表情] 该表情 "${matchedKeyword}" 在禁用列表中，跳过生成`)
      return false
    }

    const params = Utils.Tools.getParams(memeKey)
    if (!params) return false

    const { min_texts, max_texts, min_images, max_images, default_texts, args_type } = params

    /**
         * 防误触发处理
         */
    if (min_texts === 0 && max_texts === 0 && userText && !/^(@\s*\d+\s*)+$/.test(userText.trim())) {
      return false
    }

    return await Meme.make(e, memeKey, min_texts, max_texts, min_images, max_images, default_texts, args_type, userText)
  }
}

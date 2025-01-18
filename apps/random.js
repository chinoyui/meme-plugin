import { Meme, Tools } from '#models'
import { Config } from '#components'

export class random extends plugin {
  constructor () {
    super({
      name: '清语表情:随机表情包',
      event: 'message',
      priority: -Infinity,
      rule: [
        {
          reg: /^#?(清语表情|clarity-meme)?随机(表情|meme)(包)?$/i,
          fnc: 'random'
        }
      ]
    })
  }

  async random (e) {
    if (!Config.meme.Enable) return false
    try {
      const memeKeys = Object.keys(Tools.getInfoMap())
      if (memeKeys.length === 0) {
        return true
      }

      const memeKey = memeKeys[Math.floor(Math.random() * memeKeys.length)]
      const memeInfo = Tools.getInfo(memeKey)

      if (!memeInfo) {
        return true
      }

      const { min_texts, max_texts, min_images, max_images } =
        memeInfo.params_type || {}

      const isValid =
        (min_texts === 1 && max_texts === 1) ||
        (min_images === 1 && max_images === 1) ||
        (min_texts === 1 && min_images === 1 && max_texts === 1 && max_images === 1)

      if (!isValid) {
        return true
      }

      await Meme.make(e, memeKey, memeInfo, '')
    } catch (error) {
      const errorMessage = await Utils.handleError(error)
      await e.reply(`[清语表情]生成随机表情包失败, 状态码: ${error.status}, 错误信息: ${errorMessage}`)
    }
  }
}

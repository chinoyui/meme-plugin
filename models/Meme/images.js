import { Utils } from '#models'
import { Config } from '#components'

async function handleImages (e, memeKey, userText, min_images, max_images, allUsers, formData) {
  let messageImages = []
  let userAvatars = []


  const masterQQList = (Array.isArray(Config.masterQQ) ? Config.masterQQ : [Config.masterQQ])
    .filter((qq) => qq && qq !== 'stdin')
    .map((qq) => qq.toString())

  const isMasterUser = masterQQList.includes(e.user_id.toString())
  const hasAtMaster = allUsers.some((qq) => masterQQList.includes(qq.toString()))
  const protectedUsers = Config.protect.user.map((id) => id.toString())
  const hasAtProtectedUser = allUsers.some((qq) => protectedUsers.includes(qq.toString()))

  if (allUsers.length > 0) {
    const avatarBuffers = await Utils.Common.getAvatar(e, allUsers)
    avatarBuffers.filter(Boolean).forEach((buffer) => {
      userAvatars.push(buffer)
    })
  }

  const fetchedImages = await Utils.Common.getImage(e)
  messageImages.push(...fetchedImages)

  /**
   * 特殊处理：当 min_images === 1 时，因没有多余的图片，表情保护功能会失效
   */
  if (min_images === 1 && messageImages.length === 0) {
    const triggerAvatar = await Utils.Common.getAvatar([e.user_id])
    if (triggerAvatar[0]) {
      userAvatars.push(triggerAvatar[0])
    }
  }

  if (messageImages.length + userAvatars.length < min_images) {
    const triggerAvatar = await Utils.Common.getAvatar([e.user_id])
    if (triggerAvatar[0]) {
      userAvatars.unshift(triggerAvatar[0])
    }
  }

  /**
   * 表情保护逻辑
   */
  if (Config.protect.enable && (await Utils.Tools.isProtected(memeKey, Config.protect.list))) {
    if (!isMasterUser) {
      if (hasAtMaster || hasAtProtectedUser) {
        /**
         * 如果只有一个艾特，反转图片顺序
         */
        if (allUsers.length === 1) {
          userAvatars.reverse()
        } else {
          /**
           * 如果第一个艾特不是主人或受保护用户，反转图片顺序
           */
          const firstAtUser = allUsers[0].toString()
          const isFirstAtMasterOrProtected = masterQQList.includes(firstAtUser) || protectedUsers.includes(firstAtUser)
          if (!isFirstAtMasterOrProtected) {
            userAvatars.reverse()
          }
        }
      }
    }
  }

  let finalImages

  if (messageImages.length === 1 && allUsers.length === 1) {
    finalImages = [...messageImages, ...userAvatars].slice(0, max_images)
  } else {
    finalImages = [...userAvatars, ...messageImages].slice(0, max_images)
  }

  finalImages.forEach((buffer, index) => {
    formData.append('images', buffer, `image${index}.png`)
  })

  if (finalImages.length < min_images) {
    return {
      success: false,
      userText: userText
    }
  }

  return {
    success: true,
    userText: userText
  }
}

export { handleImages }

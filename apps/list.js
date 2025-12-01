import { Config, Render, Version } from '#components'
import { Utils } from '#models'

export class list extends plugin {
    constructor() {
        super({
            name: '清语表情:列表',
            event: 'message',
            priority: -Infinity,
            rule: [{ reg: /^#?(?:(清语)?表情|meme(?:-plugin)?)列表$/i, fnc: 'list' }]
        });
    }

    static cache = {
        keySignature: '',
        img: null,
        count: 0
    };

    async list(e) {
        if (!Config.meme.enable) return false;

        try {
            const keys = (await Utils.Tools.getAllKeys() || []).sort();
            const currentSignature = JSON.stringify(keys);
            if (list.cache.keySignature === currentSignature && list.cache.img) {
                await e.reply(list.cache.img);
                return true;
            }

     
            const oldTotal = list.cache.count;
            const isColdStart = !list.cache.img;

            const tasks = keys.map(async (key) => {
                const [keyWords, params] = await Promise.all([
                    Utils.Tools.getKeyWords(key),
                    Utils.Tools.getParams(key)
                ]);

                if (!keyWords || keyWords.length === 0) return null;

                const { min_texts = 0, min_images = 0, args_type = null } = params || {};
                
                const types = [];
                if (min_texts >= 1) types.push('text');
                if (min_images >= 1) types.push('image');
                if (args_type !== null) types.push('arg');

                return {
                    name: keyWords[0], 
                    types
                };
            });

            const memeList = (await Promise.all(tasks)).filter(item => item !== null);
    
            const realTotal = memeList.length;

            if (realTotal === 0) {
                await e.reply(`[${Version.Plugin_AliasName}]没有找到表情列表, 请使用[#清语表情更新资源], 稍后再试`, true);
                return true;
            }

            const img = await Render.render('list/index', {
                memeList,
                total: realTotal
            });

            let tipMsg = '';
            if (!isColdStart && realTotal > oldTotal) {
                tipMsg = `\n列表更新完成，新增 ${realTotal - oldTotal} 个表情~`;
            }

            list.cache = {
                keySignature: currentSignature,
                img,
                count: realTotal
            };

            await e.reply(img);
            
            if (tipMsg) {
                await e.reply(tipMsg);
            }

            return true;

        } catch (error) {
            logger.error('加载表情列表失败:', error);
            await e.reply('加载表情列表失败，请稍后重试', true);
            return true;
        }
    }
}

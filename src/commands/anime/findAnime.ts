import { findAnimeMovie } from '../../modules/jikanAPI.js'
import { CommandContent } from '../../modules/loadCommand.js'

export default {
  name: 'findanime',
  desc: 'Search anime info from Jikan API',
  premium: false,
  execute: async ({ args }: CommandContent) => {
    const title = args?.join(' ')
    if (!title) {
      return {
        type: 'text',
        text: '⚠️ Anime Title Cannot Be Empty!',
      }
    }

    const result = await findAnimeMovie(title)

    if (!result) {
      return {
        type: 'text',
        text: 'Something went wrong with the anime lookup.',
      }
    }

    if (typeof result === 'string') {
      return {
        type: 'text',
        text: result,
      }
    }

    const content =
      `*Title:* ${result.title}\n` +
      `*Score:* ${result.score}\n` +
      `*Status:* ${result.status}\n` +
      `*Type:* ${result.type}\n` +
      `*Year:* ${result.year}\n\n` +
      `*Synopsis:* ${result.synopsis}\n\n` +
      `🔗 ${result.url}`

    return {
      type: 'image',
      url: result.picture,
      caption: content,
    }
  }
}
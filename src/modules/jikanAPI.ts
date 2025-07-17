import axios from 'axios'

export interface AnimeResult {
  title: string
  score: number
  status: string
  type: string
  year: number
  synopsis: string
  url: string
  picture: string
}

interface JikanImage {
  jpg: { image_url: string }
}

interface JikanAnime {
  title: string
  score: number
  status: string
  type: string
  synopsis: string
  url: string
  images: JikanImage
  aired?: {
    prop?: {
      from?: {
        year?: number
      }
    }
  }
}

interface JikanAPIResponse {
  data: JikanAnime[]
}

export async function findAnimeMovie(title: string): Promise<AnimeResult | string> {
  try {
    const res = await axios.get<JikanAPIResponse>(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`
    )

    const anime = res.data.data?.[0]
    if (anime) {
      return {
        title: anime.title,
        score: anime.score,
        status: anime.status,
        type: anime.type,
        year: anime.aired?.prop?.from?.year ?? 0,
        synopsis: anime.synopsis,
        url: anime.url,
        picture: anime.images.jpg.image_url,
      }
    } else {
      return `Anime Title : ${title} Not Found!`
    }
  } catch (error) {
    console.error(`Error Fetching on FindAnimeMovie:`, error)
    return 'Error occurred while fetching anime data.'
  }
}
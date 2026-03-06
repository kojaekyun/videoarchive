import * as cheerio from 'cheerio';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return Response.json({ success: false, error: 'URL parameter is required' }, { status: 400 });
    }

    // Auto-detect platform from URL string
    let platform = 'ott';
    const lowerUrl = targetUrl.toLowerCase();

    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
        platform = 'youtube';
    } else if (lowerUrl.includes('instagram.com')) {
        platform = 'instagram';
    } else if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch')) {
        platform = 'facebook';
    } else if (lowerUrl.includes('tiktok.com')) {
        platform = 'tiktok';
    }

    try {
        let title = '';
        let thumbnail = '';

        // Special handling for YouTube using oEmbed (much more reliable)
        if (platform === 'youtube') {
            try {
                const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`;
                const ytRes = await fetch(oembedUrl);
                if (ytRes.ok) {
                    const ytData = await ytRes.json();
                    title = ytData.title || '';
                    thumbnail = ytData.thumbnail_url || '';
                }
            } catch (ytErr) {
                console.error('YouTube oEmbed error:', ytErr);
            }
        }

        // If title is still empty, fallback to generic scraper
        if (!title) {
            const res = await fetch(targetUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (res.ok) {
                const html = await res.text();
                const $ = cheerio.load(html);

                // Try various meta tags
                title = $('meta[property="og:title"]').attr('content') ||
                    $('meta[name="twitter:title"]').attr('content') ||
                    $('title').text() || '';

                if (!thumbnail) {
                    thumbnail = $('meta[property="og:image"]').attr('content') ||
                        $('meta[name="twitter:image"]').attr('content') || '';
                }

                // Clean up title
                title = title.replace(/\s*-\s*(YouTube|Instagram|Facebook|TikTok)$/i, '').trim();
            }
        }

        return Response.json({ success: true, platform, title, thumbnail });
    } catch (error) {
        console.error('Error fetching metadata:', error);
        // Even if fetch fails (e.g. CORS/bot block), still return the platform we guessed
        return Response.json({ success: true, platform, title: '', thumbnail: '' });
    }
}

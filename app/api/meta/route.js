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
        // Attempt to fetch the HTML to scrape the title
        const res = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch URL: ${res.status}`);
        }

        const html = await res.text();
        const $ = cheerio.load(html);

        // Try to get og:title first, fallback to <title>
        let title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';

        let thumbnail = $('meta[property="og:image"]').attr('content') || '';

        // Clean up title (remove ' - YouTube' etc)
        title = title.replace(/\s*-\s*YouTube$/, '').trim();

        return Response.json({ success: true, platform, title, thumbnail });
    } catch (error) {
        console.error('Error fetching metadata:', error);
        // Even if fetch fails (e.g. CORS/bot block), still return the platform we guessed
        return Response.json({ success: true, platform, title: '', thumbnail: '' });
    }
}

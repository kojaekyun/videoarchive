export const dynamic = "force-dynamic";
import { google } from "googleapis";
import OpenAI from "openai";

const getOpenAIClient = () => {
    if (process.env.OPENAI_API_KEY) {
        return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return null;
};

async function generateAdAnalysis(title, brand, platform) {
    const openai = getOpenAIClient();
    if (!openai) {
        return "";
    }
    try {
        const prompt = `Analyze this advertisement strictly based on the provided metadata. Identify the hook type, emotional tone, and likely target audience in 2-3 short sentences.
Ad Title: "${title}"
Brand: "${brand}"
Platform: "${platform}"`;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 100,
            temperature: 0.7,
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error("OpenAI Error:", error);
        return "Analysis unavailable due to an error.";
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { brand, platform, ad_title, url, emotion_score, impression_point, hook_type } = body;

        // Check required fields
        if (!brand || !platform || !ad_title || !url) {
            return Response.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        // Google Sheets Auth
        const auth = new google.auth.GoogleAuth({
            credentials: {
                project_id: process.env.GOOGLE_PROJECT_ID,
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
            },
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        const sheets = google.sheets({ version: "v4", auth });
        const spreadsheetId = "1bjQBYgcDHvWogWDaHCJRg9QpbmOe624unBkX19UB3ew";
        const range = "Sheet1!A:M";

        // Generate Auto Fields
        const id = Date.now().toString();
        const created_at = new Date().toISOString();

        // Call GPT Analysis
        const gpt_analysis = await generateAdAnalysis(ad_title, brand, platform);

        // Prepare Row Data mapping to:
        // id | created_at | platform | brand | ad_title | url | format | emotion_score | impression_point | target_guess | hook_type | my_comment | gpt_analysis
        const newRow = [
            id,
            created_at,
            platform,
            brand,
            ad_title,
            url,
            "", // format
            emotion_score || "",
            impression_point || "",
            "", // target_guess
            hook_type || "",
            "", // my_comment
            gpt_analysis
        ];

        // Append to Sheets
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [newRow],
            },
        });

        return Response.json({ success: true, data: { id, created_at, gpt_analysis } });
    } catch (error) {
        console.error("API Error:", error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}

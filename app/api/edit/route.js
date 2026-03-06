export const dynamic = "force-dynamic";
import { google } from "googleapis";

export async function POST(request) {
    try {
        const body = await request.json();
        const { id, brand, platform, ad_title, url, emotion_score, impression_point, hook_type } = body;

        if (!id) {
            return Response.json({ success: false, error: "Missing ID" }, { status: 400 });
        }

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

        // 1. Find the row index by ID
        const getRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "Sheet1!A:A",
        });

        const rows = getRes.data.values;
        if (!rows) throw new Error("Could not read sheet data");

        const rowIndex = rows.findIndex(row => row[0] === id);
        if (rowIndex === -1) {
            return Response.json({ success: false, error: "Video not found" }, { status: 404 });
        }

        const sheetRowNumber = rowIndex + 1; // 1-indexed for Sheets range

        // 2. Prepare updated values (columns C to K - platform to hook_type)
        // Range: C(3) to K(11) -> index 2 to 10
        // col index: 2:platform, 3:brand, 4:ad_title, 5:url, 6:format, 7:emotion_score, 8:impression_point, 9:target_guess, 10:hook_type

        const updateRange = `Sheet1!C${sheetRowNumber}:K${sheetRowNumber}`;
        const updatedValues = [
            [
                platform,
                brand,
                ad_title,
                url,
                "", // format (retain empty or handle)
                emotion_score,
                impression_point,
                "", // target_guess
                hook_type
            ]
        ];

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: updateRange,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: updatedValues,
            },
        });

        return Response.json({ success: true, message: "Updated successfully" });
    } catch (error) {
        console.error("Edit API Error:", error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}

export const dynamic = "force-dynamic";
import { google } from "googleapis";

export async function POST(request) {
    try {
        const body = await request.json();
        const { id } = body;

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

        // 2. Delete the row (requires sheetId, not just spreadsheetId)
        const sheetMetadata = await sheets.spreadsheets.get({
            spreadsheetId,
        });
        const sheetId = sheetMetadata.data.sheets[0].properties.sheetId;

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId: sheetId,
                                dimension: "ROWS",
                                startIndex: rowIndex, // 0-indexed
                                endIndex: rowIndex + 1,
                            },
                        },
                    },
                ],
            },
        });

        return Response.json({ success: true, message: "Deleted successfully" });
    } catch (error) {
        console.error("Delete API Error:", error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}

import { google } from "googleapis";

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        project_id: process.env.GOOGLE_PROJECT_ID,
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = "1bjQBYgcDHvWogWDaHCJRg9QpbmOe624unBkX19UB3ew";
    const range = "Sheet1!A1:M50"; // 실제 시트 이름

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return Response.json({ success: true, data: [] });
    }

    const headers = rows[0];
    const data = rows.slice(1).map((row) =>
      Object.fromEntries(
        headers.map((header, index) => [
          header,
          row[index] || "",
        ])
      )
    );

    return Response.json({
      success: true,
      data,
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
    });
  }
}

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
    const range = "Sheet1!A1:M50";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    return Response.json({
      success: true,
      data: response.data.values,
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
    });
  }
}

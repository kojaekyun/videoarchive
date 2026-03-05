import { google } from "googleapis";

export async function GET(request) {
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

    // 최신 날짜순 정렬
    data.sort((a, b) => {
      if (!a.created_at) return 1;
      if (!b.created_at) return -1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    // 🔥 쿼리 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");
    
    // 🔥 플랫폼 필터
    let filteredData = data;
    
    if (platform) {
      filteredData = data.filter(
        (item) =>
          item.platform &&
          item.platform.toLowerCase() === platform.toLowerCase()
      );
    }

    // 🔥 날짜 범위 필터
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    
    if (from || to) {
      filteredData = filteredData.filter((item) => {
        if (!item.created_at) return false;
    
        const itemDate = new Date(item.created_at);
    
        if (from && itemDate < new Date(from)) return false;
        if (to && itemDate > new Date(to)) return false;
    
        return true;
      });
    }


    
    
    return Response.json({
      success: true,
      data: filteredData,
    });


    
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
    });
  }
}

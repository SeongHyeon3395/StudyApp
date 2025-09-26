import express from "express";
import fetch from "node-fetch";
import crypto from "crypto";

const router = express.Router();

// HMAC 인증 헤더 생성 함수
function generateHMACHeaders() {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString('hex');
  const apiKey = process.env.SOLAPI_API_KEY;
  const secretKey = process.env.SOLAPI_SECRET_KEY;
  
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(date + salt)
    .digest('hex');

  return {
    'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
    'Content-Type': 'application/json'
  };
}

router.post("/send-sms", async (req, res) => {
  try {
    const { to, text } = req.body;

    // API Key와 Secret Key 확인
    if (!process.env.SOLAPI_API_KEY || !process.env.SOLAPI_SECRET_KEY) {
      return res.status(500).json({ 
        error: "Solapi API Key 또는 Secret Key가 설정되지 않았습니다" 
      });
    }

    const headers = generateHMACHeaders();
    
    const response = await fetch("https://api.solapi.com/messages/v4/send", {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: {
          to,
          from: process.env.SOLAPI_SENDER_NUMBER, // 사전에 등록된 발신번호
          text
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Solapi API Error: ${response.status} - ${JSON.stringify(data)}`);
    }
    
    res.json(data);
  } catch (err) {
    console.error("Solapi API 오류:", err);
    res.status(500).json({ error: "Solapi API 호출 실패", details: err.message });
  }
});

export default router;

import express from "express";
import bodyParser from "body-parser";
import geminiRoutes from "./routes/gemini.js";
import solapiRoutes from "./routes/solapi.js";
import dotenv from "dotenv";
dotenv.config(); 
console.log(process.env.DB_HOST); // localhost
console.log(process.env.GEMINI_API_KEY); // Gemini 키 값

const app = express();
app.use(bodyParser.json());

app.use("/api/gemini", geminiRoutes);
app.use("/api/solapi", solapiRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend API server running on port ${PORT}`);
});

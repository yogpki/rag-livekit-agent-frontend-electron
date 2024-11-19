import { app, BrowserWindow, ipcMain, Menu } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { AccessToken } from "livekit-server-sdk";
import "dotenv/config"; // 加载 .env 文件

import { Client } from "node-osc"; // 引入 node-osc 客户端

// 用于模拟 __dirname 和 __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);




let mainWindow;
let oscClient;
// 初始化 OSC 客户端
function setupOSC() {
  oscClient = new Client("127.0.0.1", 5566); // 目标地址：localhost:5566
  console.log("OSC Client initialized for localhost:5566");
}

app.on("ready", () => {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      webSecurity: false, // 禁用跨域限制
      allowRunningInsecureContent: true, // 在开发阶段允许不安全内容
    },
  });

  
  mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));

  // 初始化 OSC 客户端
  setupOSC();
  // 禁用菜单
  //Menu.setApplicationMenu(null);


  
});

// 处理渲染进程发来的 OSC 发送请求
ipcMain.handle("send-osc", async (event, address, value) => {
  if (!oscClient) {
    console.error("OSC Client not initialized.");
    return;
  }
  oscClient.send(address, value, () => {
    console.log(`OSC message sent to ${address} with value ${value}`);
  });
});


// 监听渲染进程请求 Token
ipcMain.handle("generate-livekit-token", async () => {
  try {
    const connectionDetails = await generateConnectionDetails();
    return connectionDetails;
  } catch (error) {
    console.error("Error generating token:", error);
    throw error;
  }
});

// 生成 LiveKit 连接详情
async function generateConnectionDetails() {
    const API_KEY = process.env.LIVEKIT_API_KEY;
    const API_SECRET = process.env.LIVEKIT_API_SECRET;
    const LIVEKIT_URL = process.env.LIVEKIT_URL;
  
    if (!API_KEY || !API_SECRET || !LIVEKIT_URL) {
      throw new Error("LiveKit environment variables are not properly configured.");
    }
  
    const participantIdentity = `voice_assistant_user_${Math.round(
      Math.random() * 10_000
    )}`;
  
    const roomName = "voice_assistant_room";
  
     // 等待 createParticipantToken 函数返回结果
    const token = await createParticipantToken(
    {
      identity: participantIdentity,
    },
    roomName
  );
  
    const connectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName: roomName,
      participantToken: token,
      participantName: participantIdentity,
    };
  
    console.log("Generated connection details:", connectionDetails);
  
    return connectionDetails;
  }
  

// 生成 Participant Token
async function createParticipantToken(userInfo, roomName) {
    const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, userInfo);
    at.ttl = "5m"; // Token 有效期 5 分钟
    const grant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    };
    at.addGrant(grant);
    
    // toJwt() 方法返回的是字符串，因此无需等待其他异步操作
    return at.toJwt(); // 确保是同步返回字符串
  }

  

  

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

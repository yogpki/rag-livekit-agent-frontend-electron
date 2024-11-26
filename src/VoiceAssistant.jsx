import React, { useState, useEffect, useCallback } from "react";
import {
  LiveKitRoom,
  useVoiceAssistant,
  BarVisualizer,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  DisconnectButton,
} from "@livekit/components-react";
import { MicrophoneIcon } from "@heroicons/react/24/outline";
//import { VoiceAssistantControlBar } from './components/VoiceAssistantControlBar';

import { motion, AnimatePresence } from "framer-motion";

// hook for getting audio track
import { useLocalParticipant } from "@livekit/components-react";


export default function VoiceAssistantApp() {
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [agentState, setAgentState] = useState("disconnected");

  const [responseText, setResponseText] = useState("");
  const [userInputText, setUserInputText] = useState("");

  const [showVisualizer, setShowVisualizer] = useState(false); // 控制 BarVisualizer 显示
  const [isButtonDisabled, setIsButtonDisabled] = useState(false); // 控制 HoldButton 禁用状态

  

  
  // Fetch connection details from the main process
  const onConnectButtonClicked = useCallback(async () => {
    console.log("Connect button clicked"); // Debug info for button click
    try {
      const details = await window.livekitAPI.getConnectionDetails();
      console.log("Connection details fetched:", details); // Debug info for connection details
      setConnectionDetails(details);
    } catch (error) {
      console.error("Failed to get connection details:", error);
    }
  }, []);

  const handleDisconnected = () => {
    console.log("Disconnected from LiveKit room"); // Debug info for disconnect
    setConnectionDetails(null);
    setAgentState("disconnected"); // Update agentState to disconnected on disconnect
  };

  const onDeviceFailure = (error) => {
    console.error("Media device failure:", error);
    alert(
      "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the app."
    );
  };

  useEffect(() => {
    console.log("Agent state updated:", agentState); // Debug info for agentState changes
    // 如果在 listening 状态，启用按钮并隐藏 BarVisualizer
    if (agentState === "listening") {
      setShowVisualizer(false);
      setIsButtonDisabled(false);
    }

  }, [agentState]);

  

  useEffect(() => {
    // 收到 "/input" 消息时处理逻辑
    window.osc.onUpdateUserInputText((data) => {
      console.log("OSC Input received:", data);
      setUserInputText("You: \n" + data); // 设置用户输入，并触发逐字显示逻辑
      setResponseText(""); // 清空响应

      // 收到 "/input" 时，显示 BarVisualizer 并禁用按钮
      setShowVisualizer(true);
      setIsButtonDisabled(true);
    });

    // 收到 "/response" 消息时处理逻辑
    window.osc.onUpdateResponseText((response) => {
      console.log("OSC Response received:", response);
      setResponseText("Friska: \n" + response); // 设置响应，并触发逐字显示逻辑
    });
  }, []);
  

  return (
    <main
      data-lk-theme="default"
      className="h-full grid content-center bg-[var(--lk-bg)]"
    >
      <LiveKitRoom
        token={connectionDetails?.participantToken}
        serverUrl={connectionDetails?.serverUrl}
        connect={connectionDetails !== null}
        audio={true}
        video={false}
        onDisconnected={handleDisconnected}
        onMediaDeviceFailure={onDeviceFailure}
        className="grid grid-rows-[2fr_1fr] items-center"
      >
        {/* 使用 ResponseAndInputBox 组件 */}
        <ResponseAndInputBox
          responseText={responseText}
          userInputText={userInputText}
        />
        <SimpleVoiceAssistant agentState={agentState} onStateChange={setAgentState} />


        <ControlBar
          onConnectButtonClicked={onConnectButtonClicked}
          agentState={agentState}
          
        />
         

         {(agentState === "speaking" || agentState === "listening" || agentState === "thinking") && (
          <LanguageButtons />
        )}
        <RoomAudioRenderer />
      </LiveKitRoom>
    </main>
  );
}


// ResponseAndInputBox 组件
function ResponseAndInputBox({ responseText, userInputText }) {
  const [typedUserInput, setTypedUserInput] = useState(""); // 动态展示用户输入
  const [typedResponse, setTypedResponse] = useState(""); // 动态展示响应

  // Helper function to split中英混合的文本
  const splitText = (text) => {
    // 使用正则表达式将中英文字符分开
    return text.match(/[\u4e00-\u9fa5]|[^\u4e00-\u9fa5\s]+|\s+/g) || [];
  };

  useEffect(() => {
    let userInputTimeouts = [];

    if (userInputText) {
      setTypedUserInput(""); // 清空用户输入
      const words = splitText(userInputText); // 将中英混合文本拆分
      userInputTimeouts = words.map((word, index) => {
        const delay = index * 100; // 每个字符 0.1 秒延迟
        return setTimeout(() => {
          setTypedUserInput((prev) => prev + word);
        }, delay);
      });
    }

    return () => {
      userInputTimeouts.forEach(clearTimeout); // 清理超时
    };
  }, [userInputText]); // 每次用户输入变化时重新运行

  useEffect(() => {
    let responseTimeouts = [];

    if (responseText) {
      setTypedResponse(""); // 清空响应
      const words = splitText(responseText); // 将中英混合文本拆分
      responseTimeouts = words.map((word, index) => {
        const delay = index * 100; // 每个字符 0.1 秒延迟
        return setTimeout(() => {
          setTypedResponse((prev) => prev + word);
        }, delay);
      });
    }

    return () => {
      responseTimeouts.forEach(clearTimeout); // 清理超时
    };
  }, [responseText]); // 每次响应文本变化时重新运行

  return (
    <div className="w-[60vw] mx-auto mb-2">
      <div
        className="w-full text-white text-sm p-2 overflow-auto"
        style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
        dangerouslySetInnerHTML={{
          __html: typedUserInput.replace(/^You:/, "<strong>You:</strong>"),
        }}
      ></div>
      <div
        className="w-full text-white text-sm p-2 overflow-auto mt-2"
        style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
        dangerouslySetInnerHTML={{
          __html: typedResponse.replace(/^Friska:/, "<strong>Friska:</strong>"),
        }}
      ></div>
    </div>
  );
}


function SimpleVoiceAssistant({
  onStateChange,
  agentState,
  showVisualizer,
  isButtonDisabled,
}) {
  const { state, audioTrack } = useVoiceAssistant();
  const [isPressed, setIsPressed] = useState(false);
  const { microphoneTrack } = useLocalParticipant();

  useEffect(() => {
    console.log("VoiceAssistant state updated:", state);
    onStateChange(state);
  }, [state, onStateChange]);

  const handleHoldStart = async (event) => {
    event.preventDefault();
    setIsPressed(true);
    if (microphoneTrack) {
      microphoneTrack.unmute();
    }
    try {
      await window.osc.send("/hold", 1);
    } catch (error) {
      console.error("Failed to send OSC message to /hold:", error);
    }
  };

  const handleHoldEnd = async (event) => {
    event.preventDefault();
    setIsPressed(false);
    if (microphoneTrack) {
      microphoneTrack.mute();
    }
    try {
      await window.osc.send("/release", 1);
    } catch (error) {
      console.error("Failed to send OSC message to /release:", error);
    }
  };

  return (
    <div className="relative w-full h-[300px] max-w-[90vw] mx-auto flex flex-col justify-center items-center">
      <AnimatePresence>
        {!showVisualizer && agentState === "listening" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <button
              className={`w-32 h-32 ${
                isPressed ? "bg-red-500" : "bg-green-500"
              } text-white rounded-full shadow-md flex items-center justify-center`}
              onMouseDown={handleHoldStart}
              onMouseUp={handleHoldEnd}
              onTouchStart={handleHoldStart}
              onTouchEnd={handleHoldEnd}
              disabled={isButtonDisabled}
            >
              <MicrophoneIcon className="w-8 h-8" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {showVisualizer && (
        <BarVisualizer
          state={state}
          barCount={5}
          trackRef={audioTrack}
          className="agent-visualizer mb-4"
          options={{ minHeight: 24 }}
        />
      )}

    </div>
  );
}


function ControlBar({ onConnectButtonClicked, agentState }) {
  const handleButtonClick = async () => {
    console.log("Connect button in ControlBar clicked");
    await onConnectButtonClicked();

   

    // 发送 OSC 消息  // 初始狀態 cantonese， button released
    try {
      await window.osc.send("/start", 1);
      console.log("OSC message sent to /start");

      // 新增：發送 /can，值為 1
      await window.osc.send("/can", 1);
      console.log("OSC message sent to /can");
    } catch (error) {
      console.error("Failed to send OSC message:", error);
    }

    try {
      await window.osc.send("/release", 1);
      console.log("OSC message sent to /release with value 1");
    } catch (error) {
      console.error("Failed to send OSC message to /release:", error);
    }

  };

  return (
    <div className="relative h-[100px]">
      <AnimatePresence>
        {agentState === "disconnected" && (
          <motion.button
            initial={{ opacity: 0, top: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, top: "-10px" }}
            transition={{ duration: 1, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="uppercase absolute left-1/2 -translate-x-1/2 px-4 py-2 bg-white text-black rounded-md"
            onClick={handleButtonClick}
          >
            Start a conversation
          </motion.button>
          
        )}
      </AnimatePresence>
      <AnimatePresence>
        {agentState !== "disconnected" && agentState !== "connecting" && (
          <motion.div
            initial={{ opacity: 0, top: "10px" }}
            animate={{ opacity: 1, top: 0 }}
            exit={{ opacity: 0, top: "-10px" }}
            transition={{ duration: 0.4, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="flex h-8 absolute left-1/2 -translate-x-1/2 justify-center"
          >
            <VoiceAssistantControlBar controls={{ leave: false }} />
            <DisconnectButton />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



function LanguageButtons({ agentState }) {
  const [selectedLanguage, setSelectedLanguage] = useState("Cantonese");

  const handleButtonClick = async (language, oscAddress) => {
    if (selectedLanguage === language) {
      // 如果已經被選中，不執行任何操作
      return;
    }
    console.log(`${language} button clicked`);
    setSelectedLanguage(language);

    // 發送 OSC 消息
    try {
      await window.osc.send(oscAddress, 1);
      console.log(`OSC message sent to ${oscAddress}`);
    } catch (error) {
      console.error(`Failed to send OSC message to ${oscAddress}:`, error);
    }
  };

  // 判斷按鈕是否禁用
  const isDisabled = agentState === "speaking";

  // 按鈕樣式
  const getButtonStyles = (language) => {
    if (selectedLanguage === language) {
      return "bg-blue-500 text-white"; // 選中按鈕樣式：藍色
    }
    if (isDisabled) {
      return "bg-gray-500 text-gray-300 cursor-not-allowed"; // 禁用按鈕樣式：深灰色
    }
    return "bg-white text-black"; // 默認樣式：白色
  };

  if (agentState === "disconnected" || agentState === "initializing" ||  agentState === "connecting") {
    return null; // 按鈕不顯示
  }

  return (
    <div className="flex justify-center items-center mt-4 space-x-4">
      <button
        className={`uppercase px-4 py-2 rounded-md text-xs ${getButtonStyles(
          "Cantonese"
        )}`}
        style={{
          fontSize: "0.75rem", // 字體大小為 0.75rem (text-xs 對應的大小)
          lineHeight: "1.2", // 可選：行高
        }}
        onClick={() => handleButtonClick("Cantonese", "/can")}
        disabled={isDisabled}
      >
        Cantonese
      </button>
      <button
        className={`uppercase px-4 py-2 rounded-md text-xs ${getButtonStyles(
          "English"
        )}`}
        style={{
          fontSize: "0.75rem", // 字體大小為 0.75rem (text-xs 對應的大小)
          lineHeight: "1.2", // 可選：行高
        }}
        onClick={() => handleButtonClick("English", "/en")}
        disabled={isDisabled}
      >
        English
      </button>
      <button
        className={`uppercase px-4 py-2 rounded-md text-xs ${getButtonStyles(
          "Mandarin"
        )}`}
        style={{
          fontSize: "0.75rem", // 字體大小為 0.75rem (text-xs 對應的大小)
          lineHeight: "1.2", // 可選：行高
        }}
        onClick={() => handleButtonClick("Mandarin", "/mand")}
        disabled={isDisabled}
      >
        Mandarin
      </button>
    </div>
  );
}


import React, { useState, useEffect, useCallback } from "react";
import {
  LiveKitRoom,
  useVoiceAssistant,
  BarVisualizer,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  DisconnectButton,
} from "@livekit/components-react";

//import { VoiceAssistantControlBar } from './components/VoiceAssistantControlBar';

import { motion, AnimatePresence } from "framer-motion";

export default function VoiceAssistantApp() {
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [agentState, setAgentState] = useState("disconnected");
  

  
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
  }, [agentState]);

  

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
        <SimpleVoiceAssistant onStateChange={setAgentState} />
        <ControlBar
          onConnectButtonClicked={onConnectButtonClicked}
          agentState={agentState}
          
        />
        {agentState !== "disconnected" && (
          <LanguageButtons />
        )}
        <RoomAudioRenderer />
      </LiveKitRoom>
    </main>
  );
}

function SimpleVoiceAssistant({ onStateChange }) {
  const { state, audioTrack } = useVoiceAssistant();

  useEffect(() => {
    console.log("VoiceAssistant state updated:", state); // Debug info for voice assistant state
    onStateChange(state);
  }, [state, onStateChange]);

  

  return (
    <div className="h-[300px] max-w-[90vw] mx-auto">
      <BarVisualizer
        state={state}
        barCount={5}
        trackRef={audioTrack}
        className="agent-visualizer"
        options={{ minHeight: 24 }}
      />
    </div>
  );
}

function ControlBar({ onConnectButtonClicked, agentState }) {
  const handleButtonClick = async () => {
    console.log("Connect button in ControlBar clicked");
    await onConnectButtonClicked();

    // 发送 OSC 消息
    try {
      await window.osc.send("/start", 1);
      console.log("OSC message sent to /start");

      // 新增：發送 /can，值為 1
      await window.osc.send("/can", 1);
      console.log("OSC message sent to /can");
    } catch (error) {
      console.error("Failed to send OSC message:", error);
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


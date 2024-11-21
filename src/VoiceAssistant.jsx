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

  // hold button
  const [isPressed, setIsPressed] = useState(false); // 狀態: 是否按住

  
  

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
         {/* 使用 HoldToSpeakButton */}
         {(agentState === "speaking" || agentState === "listening" || agentState === "thinking") && (
          <HoldToSpeakButton
            agentState={agentState}
            isPressed={isPressed}
            setIsPressed={setIsPressed}
          />
        )}

         {(agentState === "speaking" || agentState === "listening" || agentState === "thinking") && (
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

    // geting audio track from participant
  //  const { microphoneTrack, localParticipant } = useLocalParticipant();

  //    // 初始化时静音麦克风
  //    if (microphoneTrack) {
  //     microphoneTrack.mute();
  //     console.log("Microphone muted on connect");
  //   } else {
  //     console.log("Microphone track not available at connect");
  //   }
    
  };

  // 

  // useEffect(() => {
  //   const handleKeyDown = (event) => {
  //     if (!microphoneTrack) return; // 如果没有麦克风音轨，则跳过处理

  //     if (event.key === 'a') {
  //       // Mute microphone when 'a' is pressed
  //       microphoneTrack.mute();
  //       console.log("Microphone muted");
  //     } else if (event.key === 's') {
  //       // Unmute microphone when 's' is pressed
  //       microphoneTrack.unmute();
  //       console.log("Microphone unmuted");
  //     }
  //   };

  //   // 监听键盘按下事件
  //   window.addEventListener("keydown", handleKeyDown);

  //   return () => {
  //     // 清理事件监听器
  //     window.removeEventListener("keydown", handleKeyDown);
  //   };
  // }, [microphoneTrack]);

  
  



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


function HoldToSpeakButton({ agentState, isPressed, setIsPressed }) {

  const { microphoneTrack } = useLocalParticipant();

  const handleHoldStart = async (event) => {
    event.preventDefault(); // 防止鼠标和触控事件冲突
    setIsPressed(true);
    console.log("Speak button is hold...");

    if (microphoneTrack) {
      // Unmute microphone
      microphoneTrack.unmute();
      console.log("Microphone unmuted");
    }

    // 发送 OSC 消息到 /hold，值为 1
    try {
      await window.osc.send("/hold", 1);
      console.log("OSC message sent to /hold with value 1");
    } catch (error) {
      console.error("Failed to send OSC message to /hold:", error);
    }

   
  };

  const handleHoldEnd = async (event) => {
    event.preventDefault(); // 防止鼠标和触控事件冲突
    setIsPressed(false);
    console.log("Speak button is released...");

    if (microphoneTrack) {
      // Mute microphone
      microphoneTrack.mute();
      console.log("Microphone muted");
    }

    //发送 OSC 消息到 /release，值为 1
    try {
      await window.osc.send("/release", 1);
      console.log("OSC message sent to /release with value 1");
    } catch (error) {
      console.error("Failed to send OSC message to /release:", error);
    }
    // 延迟两秒后发送 OSC 消息到 /release，值为 1
    // setTimeout(async () => {
    //   try {
    //     await window.osc.send("/release", 1);
    //     console.log("OSC message sent to /release with value 1 after 2 seconds delay");
    //   } catch (error) {
    //     console.error("Failed to send OSC message to /release:", error);
    //   }
    // }, 2000); // 延迟 2000 毫秒 (2 秒)

    
  };

  

  return (
    <div className="flex justify-center mt-4">
      <button
        className={`w-32 h-32 ${
          isPressed ? "bg-red-500" : "bg-green-500"
        } text-white rounded-full shadow-md flex items-center justify-center`}
        onMouseDown={handleHoldStart}
        onMouseUp={handleHoldEnd}
        //onMouseLeave={handleHoldEnd} // 确保鼠标离开时恢复
        onTouchStart={handleHoldStart}
        onTouchEnd={handleHoldEnd}
        onTouchCancel={handleHoldEnd} // 如果触摸事件被取消
      >
        <MicrophoneIcon className="w-8 h-8" />
      </button>
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


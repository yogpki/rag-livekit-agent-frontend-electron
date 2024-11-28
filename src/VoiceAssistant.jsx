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
import { CircularProgressbar } from 'react-circular-progressbar'; // 使用 react-circular-progressbar 库
import "react-circular-progressbar/dist/styles.css";

export default function VoiceAssistantApp() {
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [agentState, setAgentState] = useState("disconnected");

  const [responseText, setResponseText] = useState("");
  const [userInputText, setUserInputText] = useState("");

  const [showVisualizer, setShowVisualizer] = useState(false); // 控制 BarVisualizer 显示
  const [isButtonDisabled, setIsButtonDisabled] = useState(false); // 控制 HoldButton 禁用状态

  useEffect(() => {
    console.log("responseText updated:", responseText);
  }, [responseText]);

  
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

  // useEffect(() => {
  //   console.log("Agent state updated:", agentState); // Debug info for agentState changes
  //   // 如果在 listening 状态，启用按钮并隐藏 BarVisualizer
  //   if (agentState === "listening") {
  //     setShowVisualizer(false);
  //     setIsButtonDisabled(false);
  //   }

  // }, [agentState]);

  

  useEffect(() => {
    // 收到 "/input" 消息时处理逻辑
    window.osc.onUpdateUserInputText((data) => {
      console.log("OSC Input received:", data);
      setUserInputText("\n" + data); // 设置用户输入，并触发逐字显示逻辑
      setResponseText(""); // 清空响应

      // 收到 "/input" 时，显示 BarVisualizer 并禁用按钮
      //setShowVisualizer(true);
      //setIsButtonDisabled(true);
    });

    // 收到 "/response" 消息时处理逻辑
    window.osc.onUpdateResponseText((response) => {
      console.log("OSC Response received:", response);
      setResponseText("\n" + response); // 设置响应，并触发逐字显示逻辑
    });
  }, []);

  useEffect(() => {
    // 收到 "/userstop" 消息时，显示 BarVisualizer
    window.osc.onUserStop(() => {
      console.log("OSC userstop received!!");
      setShowVisualizer(true);
       setIsButtonDisabled(true);
    });
  
    // 收到 "/agentstop" 消息时，隐藏 BarVisualizer
    window.osc.onAgentStop(() => {
      console.log("OSC agentstop received!!");
       setShowVisualizer(false);
       setIsButtonDisabled(false);
    });
  }, []);
  

  return (
    <main
      data-lk-theme="default"
      className="h-screen grid content-center bg-[var(--lk-bg)]"
    >
      <LiveKitRoom
        token={connectionDetails?.participantToken}
        serverUrl={connectionDetails?.serverUrl}
        connect={connectionDetails !== null}
        audio={true}
        video={false}
        onDisconnected={handleDisconnected}
        onMediaDeviceFailure={onDeviceFailure}
        className="grid grid-rows-[33%_55%_12%] h-screen justify-items-center content-center"
      >
        {/* 使用 ResponseAndInputBox 组件 */}
        <div className="h-full flex justify-center align-self-start">
        <ResponseAndInputBox
          responseText={responseText}
          userInputText={userInputText}
          agentState={agentState} 
        />
        </div>
        <div className="h-full flex justify-center items-center">
        <SimpleVoiceAssistant
          agentState={agentState}
          onStateChange={setAgentState}
          showVisualizer={showVisualizer} // 传递 showVisualizer 状态
          isButtonDisabled={isButtonDisabled} // 传递 isButtonDisabled 状态
        />
      </div>
      <div className="h-full flex justify-center items-center">
        <ControlBar
          onConnectButtonClicked={onConnectButtonClicked}
          agentState={agentState}
          
        />
      </div>

        <RoomAudioRenderer />
      </LiveKitRoom>
    </main>
  );
}


// ResponseAndInputBox 组件
function ResponseAndInputBox({ responseText, userInputText, agentState }) {
  const [typedUserInput, setTypedUserInput] = useState(""); // 动态显示用户输入
  const [typedResponse, setTypedResponse] = useState(""); // 动态显示响应
  const [hasClearedOnConnected, setHasClearedOnConnected] = useState(false); // 确保清空操作只执行一次

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
  }, [userInputText]);

  useEffect(() => {
    let responseTimeouts = [];
    setTypedResponse(""); 
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
  }, [responseText]);

  // 在 agentState 为 connecting 时，显示特定文本
  useEffect(() => {
    if (agentState === "connecting") {
      setTypedUserInput("\nConnecting...");
      setTypedResponse(""); // 清空响应
    }
  }, [agentState]);

  // 在 agentState 为 connected 时，清空内容，只执行一次
  useEffect(() => {
    if (agentState != "disconnected" && agentState != "connecting" && !hasClearedOnConnected) {
      setTypedUserInput("");
      setTypedResponse("");
      setHasClearedOnConnected(true); // 标记已清空
    }
  }, [agentState, hasClearedOnConnected]);

  // 在 agentState 为 disconnected 时，重置 hasClearedOnConnected
  useEffect(() => {
    if (agentState === "disconnected") {
      setHasClearedOnConnected(false);
    }
  }, [agentState]);

  if (agentState === "disconnected") {
    return null;
  }

  return (
    <div className="w-[60vw] h-full flex flex-col justify-start mt-10">
      <div className="w-full text-white text-sm p-4 overflow-auto">
        {typedUserInput && (
          <>
            <strong>You:</strong>
            {typedUserInput.split("\n").map((line, index) => (
              <React.Fragment key={index}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </>
        )}
      </div>
      <div className="w-full text-white text-sm p-4 overflow-auto mt-2">
        {typedResponse && (
          <>
            <strong>Friska:</strong>
            {typedResponse.split("\n").map((line, index) => (
              <React.Fragment key={index}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </>
        )}
      </div>
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
  const [hasMuteOnConnected, setHasMuteOnConnected] = useState(false); // 确保静音操作只执行一次
  const [progress, setProgress] = useState(0); // 环状进度条的进度
  const [temporaryDisabled, setTemporaryDisabled] = useState(false); // 临时禁用状态

  

  useEffect(() => {
    console.log("VoiceAssistant state updated:", state);
    onStateChange(state);
  }, [state, onStateChange]);

  // Handle mute logic when agentState changes
  useEffect(() => {
    if (
      agentState !== "disconnected" &&
      agentState !== "connecting" &&
      !hasMuteOnConnected
    ) {
      console.log("Muting microphone as agentState is connected");
      if (microphoneTrack) {
        microphoneTrack.mute(); // 静音麦克风
      }

      // 发送 OSC 消息到 /can
      const sendOSCMessage = async () => {
        try {
          await window.osc.send("/can", 1);
          console.log("OSC message sent to /can with value 1");
        } catch (error) {
          console.error("Failed to send OSC message to /can:", error);
        }
      };
      
      sendOSCMessage(); // 调用发送函数

      setHasMuteOnConnected(true); // 标记已静音
    }
  }, [agentState, hasMuteOnConnected, microphoneTrack]);

  // Reset hasMuteOnConnected when disconnected
  useEffect(() => {
    if (agentState === "disconnected") {
      console.log("Resetting hasMuteOnConnected as agentState is disconnected");
      setHasMuteOnConnected(false); // 重置标记
    }
  }, [agentState]);

  // Update progress for circular slider when button is pressed
  useEffect(() => {
    let interval;
    if (isPressed) {
      interval = setInterval(() => {
        setProgress((prev) => (prev < 100 ? prev + 1 : 100));
      }, 50); // 每50ms增加1%
    } else {
      setProgress(0); // 重置进度条
    }
    return () => clearInterval(interval); // 清除计时器
  }, [isPressed]);
  


  const handleHoldStart = async (event) => {
    event.preventDefault();

    // 如果处于临时禁用状态，阻止按钮触发
    if (temporaryDisabled) {
      console.log("Button is temporarily disabled. Action blocked.");
      return;
    }

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

    // 启动临时禁用状态
    setTemporaryDisabled(true);
    setTimeout(() => {
      setTemporaryDisabled(false); // 2秒后解除禁用
      console.log("Temporary disable lifted.");
    }, 2000);

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
    <div className="relative w-full h-full flex flex-col justify-center items-center">
      {agentState !== "disconnected" && agentState !== "connecting" && (
        <>
          {/* 按钮部分：HoldButton 和 LanguageButtons */}
          <AnimatePresence>
            {!showVisualizer && (
              <motion.div
                key="buttons" // 为按钮部分设置唯一键
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }} // 控制淡出动画的时长
              >

              <div className="relative flex flex-col items-center space-y-8">
                {/* Hold Button 和环的共同父容器 */}
                <div
                  className="relative"
                  style={{
                    width: "240px", // 父容器宽度（需大于按钮）
                    height: "240px", // 父容器高度（需大于按钮）
                  }}
                >
                  {/* 环状 UI */}
                  {isPressed && (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        zIndex: 0,
                      }}
                    >
                      <CircularProgressbar
                        value={progress}
                        styles={{
                          path: {
                            stroke: "rgba(255, 0, 0, 0.8)", // 红色环
                            strokeWidth: 3, // 环的粗细
                            strokeLinecap: "round",
                            transition: "stroke-dashoffset 0.5s ease 0s",
                          },
                          trail: {
                            stroke: "rgba(255, 0, 0, 0.0)", // 环的背景轨迹
                            strokeWidth: 3,
                          },
                        }}
                      />
                    </div>
                  )}

                  {/* Hold Button */}
                  <button
                    className={`absolute w-48 h-48 ${
                      isPressed ? "bg-red-500 transform scale-95" : "bg-blue-500"
                    } text-white rounded-full shadow-md flex items-center justify-center transition-transform`}
                    style={{
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)", // 保证按钮和环都居中
                    }}
                    onMouseDown={handleHoldStart}
                    onMouseUp={handleHoldEnd}
                    onMouseLeave={handleHoldEnd}
                    onTouchStart={handleHoldStart}
                    onTouchEnd={handleHoldEnd}
                    disabled={isButtonDisabled}
                  >
                    <MicrophoneIcon className="w-8 h-8" />
                  </button>
                </div>

                {/* 语言选择按钮 */}
                <LanguageButtons isDisabled={isButtonDisabled} show={!showVisualizer} />
              </div>





              </motion.div>
            )}
          </AnimatePresence>

          {/* 显示 BarVisualizer */}
          {showVisualizer && (
            <BarVisualizer
              state={state}
              barCount={5}
              trackRef={audioTrack}
              className="agent-visualizer"
              options={{ minHeight: 24 }}
            />
          )}
        </>
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
    <div className="relative h-full flex justify-center items-center">
      <AnimatePresence>
        {agentState === "disconnected" && (
          <motion.button
            initial={{ opacity: 0, top: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, top: "-10px" }}
            transition={{ duration: 1, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="uppercase px-4 py-2 bg-white text-black rounded-md"
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
            className="flex justify-center items-center"
          >
            <VoiceAssistantControlBar controls={{ leave: false }} />
            <DisconnectButton />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


function LanguageButtons({ agentState, isDisabled, show }) {

  const [selectedLanguage, setSelectedLanguage] = useState("Cantonese"); // 默認選中 Cantonese

  const handleButtonClick = async (language, oscAddress) => {
    console.log(`handleButtonClick called for ${language}`); // 確保函數被調用
    if (selectedLanguage === language) {
      console.log(`${language} is already selected, skipping...`);
      return; // 當前已選中按鈕，不做任何操作
    }
  
    console.log(`Switching to ${language} mode`);
    setSelectedLanguage(language); // 更新選中的語言
  
    // 發送 OSC 消息
    try {
      await window.osc.send(oscAddress, 1); // 發送 OSC 消息
      console.log(`OSC message sent to ${oscAddress}`);
    } catch (error) {
      console.error(`Failed to send OSC message to ${oscAddress}:`, error);
    }
  };
  

  // 按鈕樣式判斷邏輯
  const getButtonStyles = (language) => {
    if (selectedLanguage === language) {
      return "bg-blue-500 text-white cursor-not-allowed"; // 當前選中按鈕：藍色，不可點擊
    }
    return "bg-gray-200 text-black cursor-pointer"; // 非選中按鈕：灰色，可點擊
  };

  // 按鈕禁用狀態判斷
  const isButtonDisabled = (language) => {
    // 如果程序禁用，或者當前按鈕已選中，則禁用按鈕
    return isDisabled || selectedLanguage === language;
  };

  console.log("isDisabled from props:", isDisabled);
console.log("selectedLanguage:", selectedLanguage);

  console.log("Cantonese Disabled:", isButtonDisabled("Cantonese"));
console.log("English Disabled:", isButtonDisabled("English"));
console.log("Mandarin Disabled:", isButtonDisabled("Mandarin"));

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center items-center mt-10 space-x-4"
        >
          {/* Cantonese Button */}
          <button
            className={`uppercase px-4 py-2 rounded-md text-xs ${getButtonStyles(
              "Cantonese"
            )}`}
            style={{
              fontSize: "0.75rem", // 字體大小為 0.75rem
              lineHeight: "1.2", // 行高
            }}
            onClick={() => {
              console.log("Cantonese button clicked"); // 調試輸出
              handleButtonClick("Cantonese", "/can");
            }}
            disabled={isButtonDisabled("Cantonese")} // 判斷是否禁用
          >
            粵
          </button>

          {/* English Button */}
          <button
            className={`uppercase px-4 py-2 rounded-md text-xs ${getButtonStyles(
              "English"
            )}`}
            style={{
              fontSize: "0.75rem",
              lineHeight: "1.2",
            }}
            onClick={() => {
              console.log("English button clicked"); // 調試輸出
              handleButtonClick("English", "/en");
            }}
            disabled={isButtonDisabled("English")} // 判斷是否禁用
          >
            Eng
          </button>

          {/* Mandarin Button */}
          <button
            className={`uppercase px-4 py-2 rounded-md text-xs ${getButtonStyles(
              "Mandarin"
            )}`}
            style={{
              fontSize: "0.75rem",
              lineHeight: "1.2",
            }}
            onClick={() => {
              console.log("Mandarin button clicked"); // 調試輸出
              handleButtonClick("Mandarin", "/mand");
            }}
            disabled={isButtonDisabled("Mandarin")} // 判斷是否禁用
          >
            國
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

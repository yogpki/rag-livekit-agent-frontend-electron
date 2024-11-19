// app.jsx
import React from "react";
import ReactDOM from "react-dom";
import VoiceAssistant from "./VoiceAssistant";
import "./App.css";

function App() {
  return (
    <div>  
      <main data-lk-theme="default" className="min-h-screen grid content-center bg-[var(--lk-bg)]">
        <VoiceAssistant />
     </main>

    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("app"));
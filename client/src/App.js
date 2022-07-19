import { useState, } from "react";
import Dashboard from "./components/Dashboard";
import RTCContext from "./contexts/RTCContext";
import { RTC } from "./classes/RTC";
import './App.css';

const RTCClient = new RTC()

function App() {


  return (
    <RTCContext.Provider value={{ RTCClient }}>
      <div className="App">
        <Dashboard key={0} />
      </div>
    </RTCContext.Provider>
  )
}

export default App;

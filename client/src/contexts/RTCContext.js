import React, { createContext } from "react";
import { RTC } from "../classes/RTC";

/**
 * @type {React.Context<{RTCClient: RTC, step: number, setStep: Function }>}
 */
const RTCContext = createContext(null);


export default RTCContext;
import * as Sentry from '@sentry/react';
import './instrument';
import "./index.css";
import { Scrollbar } from "@deskpro/deskpro-ui";
import App from "./App";
import React from "react";
import ReactDOM from "react-dom";

ReactDOM.render(
  <React.StrictMode>
    <Scrollbar style={{height: "100%", width: "100%"}}><App /></Scrollbar>
  </React.StrictMode>,
  document.getElementById("root")
);

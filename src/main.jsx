import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter as Router } from "react-router-dom";
import { RouteApp } from "./Router";
import "./index.css";
import 'remixicon/fonts/remixicon.css'
import './assets/css/colors.css';

const root = createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <Router>
      <RouteApp />
    </Router>
  </React.StrictMode>
);

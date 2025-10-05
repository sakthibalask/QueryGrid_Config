import React from "react";
import { Routes, Route } from "react-router-dom";
import { LandingPage } from "./components/LandingPage";

export function RouteApp() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
        </Routes>
    )
}
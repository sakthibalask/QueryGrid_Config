import React from "react";
import { Routes, Route } from "react-router-dom";
import { LandingPage } from "./components/LandingPage";
import ConfigMatrix from "./components/UI/ConfigMatrix.jsx";

export function RouteApp() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path='/config' element={<ConfigMatrix />}/>
        </Routes>
    )
}
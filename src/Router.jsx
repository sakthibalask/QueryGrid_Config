import React from "react";
import { Routes, Route } from "react-router-dom";
import { LandingPage } from "./components/LandingPage";
import HomePage from "./components/Pages/HomePage.jsx";

export function RouteApp() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path='/config' element={<HomePage />}/>
        </Routes>
    )
}
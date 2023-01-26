import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AllPosts from "./components/AllPosts.js";
import OnePost from "./components/OnePost.js";
import About from "./components/About.js";
import Portfolio from "./components/Portfolio.js";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AllPosts />} path='/' exact />
        <Route element={<OnePost />} path='/:slug' />
        <Route element={<About />} path='/:slug' />
        <Route element={<Portfolio />} path='/portfolio' />
      </Routes>
    </BrowserRouter>
  );
}
export default App;

import React from "react";
import { Route, Routes } from "react-router-dom";
import AllPosts from "./components/AllPosts.js";
import OnePost from "./components/OnePost.js";
import About from "./components/About.js";
import Portfolio from "./components/Portfolio.js";

function App() {
  return (
    <Routes>
      <Route element={<AllPosts />} exact path='/allpost' />
      <Route element={<OnePost />} path='/:slug' />
      <Route element={<About />} path='/:slug' />
      <Route element={<Portfolio />} exact path='/Portfolio' />
    </Routes>
  );
}
export default App;

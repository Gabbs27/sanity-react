import React from "react";
import { Route, Routes } from "react-router-dom";
import AllPosts from "./components/AllPosts.js";
import OnePost from "./components/OnePost.js";
import About from "./components/About.js";
import Portfolio from "./components/Portfolio.js";
import Me from "./components/Me.js";
import Repos from "./components/Repos";

function App() {
  return (
    <Routes>
      <Route element={<AllPosts />} exact path='/allpost' />
      <Route element={<OnePost />} path='/:slug' />
      <Route element={<About />} exact path='/About' />
      <Route element={<Portfolio />} exact path='/Portfolio' />
      <Route element={<Me />} exact path='/Gabriel-Abreu' />
      <Route element={<Repos />} exact path='/Repositorios' />
    </Routes>
  );
}
export default App;

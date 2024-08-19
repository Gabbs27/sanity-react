import React from "react";
import { Route, Routes } from "react-router-dom";
import AllPosts from "./components/AllPosts.js";
import OnePost from "./components/OnePost.js";
import About from "./components/About.js";
import Portfolio from "./components/Portfolio.js";
import Me from "./components/Me.js";
import Repos from "./components/Repos";
import NotFound from "./components/NotFound.js";
import Education from "./components/Education.js";

function App() {
  return (
    <Routes>
      <Route exact path='*' element={<NotFound />} />
      <Route element={<AllPosts />} exact path='/allpost' />
      <Route element={<OnePost />} path='/:slug' />
      <Route element={<About />} exact path='/About' />
      <Route element={<Portfolio />} exact path='/' />
      <Route element={<Me />} exact path='/Gabriel-Abreu' />
      <Route element={<Repos />} exact path='/Repositorios' />
      <Route element={<Education />} exact path='/Education' />
    </Routes>
  );
}
export default App;

import React, { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import LoadingSpinner from "./components/common/LoadingSpinner";

// Lazy load components for better performance
const AllPosts = lazy(() => import("./components/AllPosts.js"));
const OnePost = lazy(() => import("./components/OnePost.js"));
const About = lazy(() => import("./components/About.js"));
const Portfolio = lazy(() => import("./components/Portfolio.js"));
const Me = lazy(() => import("./components/Me.js"));
const Repos = lazy(() => import("./components/Repos"));
const NotFound = lazy(() => import("./components/NotFound.js"));
const Education = lazy(() => import("./components/Education.js"));
const Services = lazy(() => import("./components/Services"));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
      <Routes>
        <Route exact path='*' element={<NotFound />} />
        <Route element={<AllPosts />} exact path='/allpost' />
        <Route element={<OnePost />} path='/:slug' />
        <Route element={<About />} exact path='/About' />
        <Route element={<Portfolio />} exact path='/' />
        <Route element={<Me />} exact path='/Gabriel-Abreu' />
        <Route element={<Repos />} exact path='/Repositorios' />
        <Route element={<Education />} exact path='/Education' />
        <Route element={<Services />} exact path='/services' />
      </Routes>
    </Suspense>
  );
}
export default App;

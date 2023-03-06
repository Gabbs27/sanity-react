import React from "react";
import { Route, Routes } from "react-router-dom";
import NotFound from "./components/NotFound.js";

function App() {
  return (
    <Routes>
      <Route exact path='*' element={<NotFound />} />
    </Routes>
  );
}
export default App;

import React from 'react';
import { Routes, Route } from "react-router-dom"
import Lobbypage from './component/lobby';
import RoomPage from './component/Room';

function App() {
  return (
    <Routes>
      <Route path='/room/:id' element={<RoomPage/>} />
      <Route path='/' element={<Lobbypage/>} />
    </Routes>
  );
}

export default App;

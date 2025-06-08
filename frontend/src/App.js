// frontend/src/App.js
import React, { useEffect, useState } from 'react';
import Login from './Components/Login';
import axios from 'axios';

function App() {
  const [usuarios, setUsuarios] = useState([]);


  return (
    <div>
      <Login />
    </div>
  );
}

export default App;

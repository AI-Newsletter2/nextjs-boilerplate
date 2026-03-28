import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Navbar from './pages/Navbar';
import Home from './pages/Home';

function App() {

  return(
    <>
    <BrowserRouter>
      <Routes>
        <Route index element={<Home/>}/>
        <Route path="/navbar" element={<Navbar/>}/>
      </Routes>
    </BrowserRouter>
    
    </>
  )
}

export default App
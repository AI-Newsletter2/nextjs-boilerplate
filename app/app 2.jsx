import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Navbar from './pages/pages';
import Home from './pages/pages';

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
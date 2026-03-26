import { useState } from 'react';
import HeroPage from "./pages/HeroPage"
import MouseFollower from "./components/MouseFollower"
import Nav from "./components/Nav"  
import AboutPage from "./pages/AboutPage"
import CardPage from "./pages/CardPage" 
import Loader from "./components/Loader"

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading ? (
        <Loader onComplete={() => setIsLoading(false)} />
      ) : (
        <main className="w-full max-w-7xl mx-auto ">
          <MouseFollower/>
          <Nav/>   
          <HeroPage/> 
          <AboutPage/>
          <CardPage/>
        </main>
      )}
    </>
  )
}

export default App;
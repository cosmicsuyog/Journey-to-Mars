import HeroPage from "./pages/HeroPage"
import MouseFollower from "./components/MouseFollower"
import Nav from "./components/Nav"  
import AboutPage from "./pages/AboutPage"
const App = () => {
  return (
     <main className="w-full max-w-7xl mx-auto ">
      <MouseFollower/>
      <Nav/>   
      <HeroPage/> 
      <AboutPage/>
     </main>
  )
}

export default App;
import Agents from './pages/Agents';
import Analytics from './pages/Analytics';
import CustomDashboard from './pages/CustomDashboard';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import ProjectDetail from './pages/ProjectDetail';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import AgentMarketplace from './pages/AgentMarketplace';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Agents": Agents,
    "Analytics": Analytics,
    "CustomDashboard": CustomDashboard,
    "Dashboard": Dashboard,
    "Home": Home,
    "ProjectDetail": ProjectDetail,
    "Projects": Projects,
    "Settings": Settings,
    "AgentMarketplace": AgentMarketplace,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
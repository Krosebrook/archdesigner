import AgentMarketplace from './pages/AgentMarketplace';
import Agents from './pages/Agents';
import Analytics from './pages/Analytics';
import CustomDashboard from './pages/CustomDashboard';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import ProjectDetail from './pages/ProjectDetail';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import Documentation from './pages/Documentation';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AgentMarketplace": AgentMarketplace,
    "Agents": Agents,
    "Analytics": Analytics,
    "CustomDashboard": CustomDashboard,
    "Dashboard": Dashboard,
    "Home": Home,
    "ProjectDetail": ProjectDetail,
    "Projects": Projects,
    "Settings": Settings,
    "Documentation": Documentation,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
import AgentMarketplace from './pages/AgentMarketplace';
import Agents from './pages/Agents';
import Analytics from './pages/Analytics';
import CustomDashboard from './pages/CustomDashboard';
import Dashboard from './pages/Dashboard';
import Documentation from './pages/Documentation';
import Home from './pages/Home';
import ProjectDetail from './pages/ProjectDetail';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import SDKDocumentation from './pages/SDKDocumentation';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AgentMarketplace": AgentMarketplace,
    "Agents": Agents,
    "Analytics": Analytics,
    "CustomDashboard": CustomDashboard,
    "Dashboard": Dashboard,
    "Documentation": Documentation,
    "Home": Home,
    "ProjectDetail": ProjectDetail,
    "Projects": Projects,
    "Settings": Settings,
    "SDKDocumentation": SDKDocumentation,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
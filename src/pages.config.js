import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Analytics from './pages/Analytics';
import ProjectDetail from './pages/ProjectDetail';
import Agents from './pages/Agents';
import CustomDashboard from './pages/CustomDashboard';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Projects": Projects,
    "Analytics": Analytics,
    "ProjectDetail": ProjectDetail,
    "Agents": Agents,
    "CustomDashboard": CustomDashboard,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
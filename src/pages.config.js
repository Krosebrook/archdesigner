import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Analytics from './pages/Analytics';
import ProjectDetail from './pages/ProjectDetail';
import Agents from './pages/Agents';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Projects": Projects,
    "Analytics": Analytics,
    "ProjectDetail": ProjectDetail,
    "Agents": Agents,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};
import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Network, 
  Download, 
  AlertTriangle, 
  Zap,
  Loader2,
  RefreshCw,
  Search,
  Info,
  TrendingUp
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function DependencyVisualizer({ project, services }) {
  const [graphData, setGraphData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const canvasRef = useRef(null);

  const analyzeGraph = async () => {
    setIsAnalyzing(true);
    
    try {
      // Build graph data
      const nodes = services.map(s => ({
        id: s.id,
        name: s.name,
        type: 'service',
        category: s.category,
        degree: 0
      }));

      const edges = [];
      services.forEach(service => {
        if (service.depends_on && service.depends_on.length > 0) {
          service.depends_on.forEach(depId => {
            edges.push({
              from: service.id,
              to: depId,
              type: 'dependency'
            });
          });
        }
      });

      // Calculate degrees
      nodes.forEach(node => {
        const inDegree = edges.filter(e => e.to === node.id).length;
        const outDegree = edges.filter(e => e.from === node.id).length;
        node.degree = inDegree + outDegree;
      });

      // Detect orphaned nodes
      const connectedNodes = new Set();
      edges.forEach(e => {
        connectedNodes.add(e.from);
        connectedNodes.add(e.to);
      });
      const orphanedNodes = nodes
        .filter(n => !connectedNodes.has(n.id))
        .map(n => n.id);

      // Detect hotspots (high-degree nodes)
      const avgDegree = nodes.reduce((sum, n) => sum + n.degree, 0) / nodes.length;
      const hotspots = nodes
        .filter(n => n.degree > avgDegree * 2)
        .map(n => ({
          node_id: n.id,
          degree: n.degree,
          risk_level: n.degree > avgDegree * 3 ? 'high' : 'medium'
        }));

      // Detect cycles using DFS
      const cycles = detectCycles(nodes, edges);

      // Calculate complexity score
      const complexityScore = Math.round(
        (edges.length / nodes.length) * 10 + 
        (hotspots.length * 5) + 
        (cycles.length * 10)
      );

      const graphAnalysis = {
        graph_data: { nodes, edges },
        analysis: {
          orphaned_nodes: orphanedNodes,
          hotspots: hotspots,
          cycles: cycles
        },
        metrics: {
          total_nodes: nodes.length,
          total_edges: edges.length,
          max_degree: Math.max(...nodes.map(n => n.degree), 0),
          avg_degree: avgDegree,
          complexity_score: complexityScore
        }
      };

      setGraphData(graphAnalysis.graph_data);
      setAnalysis(graphAnalysis);

      // Get AI insights
      await getAIInsights(graphAnalysis);

      // Save to database
      await base44.entities.DependencyGraph.create({
        project_id: project.id,
        ...graphAnalysis
      });

    } catch (error) {
      console.error("Error analyzing graph:", error);
    }
    
    setIsAnalyzing(false);
  };

  const detectCycles = (nodes, edges) => {
    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();

    const dfs = (nodeId, path) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const outgoingEdges = edges.filter(e => e.from === nodeId);
      for (const edge of outgoingEdges) {
        if (!visited.has(edge.to)) {
          dfs(edge.to, [...path]);
        } else if (recursionStack.has(edge.to)) {
          const cycleStart = path.indexOf(edge.to);
          if (cycleStart !== -1) {
            cycles.push([...path.slice(cycleStart), edge.to]);
          }
        }
      }

      recursionStack.delete(nodeId);
    };

    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    });

    return cycles.slice(0, 5); // Limit to 5 cycles
  };

  const getAIInsights = async (graphAnalysis) => {
    try {
      const prompt = `Analyze this microservices dependency graph and provide insights:

METRICS:
- Total Services: ${graphAnalysis.metrics.total_nodes}
- Total Dependencies: ${graphAnalysis.metrics.total_edges}
- Max Degree: ${graphAnalysis.metrics.max_degree}
- Avg Degree: ${graphAnalysis.metrics.avg_degree.toFixed(2)}
- Complexity Score: ${graphAnalysis.metrics.complexity_score}

ISSUES:
- Orphaned Services: ${graphAnalysis.analysis.orphaned_nodes.length}
- Hotspot Services: ${graphAnalysis.analysis.hotspots.length}
- Circular Dependencies: ${graphAnalysis.analysis.cycles.length}

SERVICES:
${services.map(s => `- ${s.name} (${s.category}): ${(s.depends_on || []).length} dependencies`).join('\n')}

Provide:
1. Overall architecture health assessment
2. Specific risks from hotspots and cycles
3. Recommendations to reduce coupling
4. Suggestions for breaking cycles
5. Best practices for dependency management`;

      const insights = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            health_assessment: { type: "string" },
            risks: {
              type: "array",
              items: { type: "string" }
            },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  issue: { type: "string" },
                  recommendation: { type: "string" },
                  priority: { type: "string" }
                }
              }
            }
          }
        }
      });

      setAnalysis(prev => ({ ...prev, ai_insights: insights }));
    } catch (error) {
      console.error("Error getting AI insights:", error);
    }
  };

  const exportJSON = () => {
    const data = {
      project: project.name,
      timestamp: new Date().toISOString(),
      graph: graphData,
      analysis: analysis
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}-dependency-graph.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSVG = () => {
    if (!canvasRef.current) return;
    
    const svg = canvasRef.current.innerHTML;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}-dependency-graph.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (services.length > 0) {
      analyzeGraph();
    }
  }, [services.length]);

  const filteredNodes = graphData?.nodes.filter(node =>
    node.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white shadow-md border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5 text-blue-600" />
              Dependency Graph Analysis
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={analyzeGraph}
                disabled={isAnalyzing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {graphData && (
                <>
                  <Button variant="outline" size="sm" onClick={exportJSON}>
                    <Download className="w-4 h-4 mr-2" />
                    JSON
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportSVG}>
                    <Download className="w-4 h-4 mr-2" />
                    SVG
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {isAnalyzing && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">Analyzing dependency graph...</p>
          </div>
        </div>
      )}

      {analysis && (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="text-sm text-blue-700 mb-1">Total Services</div>
                <div className="text-2xl font-bold text-blue-900">{analysis.metrics.total_nodes}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="text-sm text-purple-700 mb-1">Dependencies</div>
                <div className="text-2xl font-bold text-purple-900">{analysis.metrics.total_edges}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4">
                <div className="text-sm text-orange-700 mb-1">Hotspots</div>
                <div className="text-2xl font-bold text-orange-900">{analysis.analysis.hotspots.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-4">
                <div className="text-sm text-red-700 mb-1">Cycles</div>
                <div className="text-2xl font-bold text-red-900">{analysis.analysis.cycles.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="text-sm text-green-700 mb-1">Complexity</div>
                <div className="text-2xl font-bold text-green-900">{analysis.metrics.complexity_score}</div>
              </CardContent>
            </Card>
          </div>

          {/* Issues Summary */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Orphaned Nodes */}
            {analysis.analysis.orphaned_nodes.length > 0 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
                    <Info className="w-5 h-5" />
                    Orphaned Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-yellow-700 mb-3">
                    {analysis.analysis.orphaned_nodes.length} services have no connections
                  </p>
                  <div className="space-y-1">
                    {analysis.analysis.orphaned_nodes.slice(0, 5).map(nodeId => {
                      const service = services.find(s => s.id === nodeId);
                      return (
                        <Badge key={nodeId} variant="outline" className="text-xs">
                          {service?.name || nodeId}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Hotspots */}
            {analysis.analysis.hotspots.length > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
                    <Zap className="w-5 h-5" />
                    High-Degree Hotspots
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-orange-700 mb-3">
                    Services with excessive dependencies
                  </p>
                  <div className="space-y-2">
                    {analysis.analysis.hotspots.map(hotspot => {
                      const service = services.find(s => s.id === hotspot.node_id);
                      return (
                        <div key={hotspot.node_id} className="flex items-center justify-between text-sm">
                          <span className="text-orange-900">{service?.name || hotspot.node_id}</span>
                          <Badge className={hotspot.risk_level === 'high' ? 'bg-red-500' : 'bg-orange-500'}>
                            {hotspot.degree} deps
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cycles */}
            {analysis.analysis.cycles.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-red-800">
                    <AlertTriangle className="w-5 h-5" />
                    Circular Dependencies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-700 mb-3">
                    {analysis.analysis.cycles.length} circular dependency chains detected
                  </p>
                  <div className="space-y-2">
                    {analysis.analysis.cycles.slice(0, 3).map((cycle, idx) => (
                      <div key={idx} className="text-xs text-red-900 bg-red-100 p-2 rounded">
                        {cycle.map(nodeId => {
                          const service = services.find(s => s.id === nodeId);
                          return service?.name || nodeId;
                        }).join(' → ')}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* AI Insights */}
          {analysis.ai_insights && (
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <TrendingUp className="w-5 h-5" />
                  AI-Powered Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Health Assessment</h4>
                  <p className="text-gray-700">{analysis.ai_insights.health_assessment}</p>
                </div>

                {analysis.ai_insights.risks && analysis.ai_insights.risks.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Key Risks</h4>
                    <ul className="space-y-1">
                      {analysis.ai_insights.risks.map((risk, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.ai_insights.recommendations && analysis.ai_insights.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Recommendations</h4>
                    <div className="space-y-2">
                      {analysis.ai_insights.recommendations.map((rec, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-lg border border-purple-200">
                          <div className="flex items-start justify-between mb-1">
                            <h5 className="font-medium text-gray-900 text-sm">{rec.issue}</h5>
                            <Badge className={
                              rec.priority === 'high' ? 'bg-red-500' :
                              rec.priority === 'medium' ? 'bg-orange-500' : 'bg-blue-500'
                            }>
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{rec.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Visual Graph */}
          <Card className="bg-white shadow-md border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Dependency Graph Visualization</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                ref={canvasRef}
                className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-lg p-8 min-h-[400px] flex items-center justify-center"
              >
                <svg width="100%" height="400" className="overflow-visible">
                  <defs>
                    <marker
                      id="arrowhead-dep"
                      markerWidth="10"
                      markerHeight="10"
                      refX="9"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3, 0 6" fill="#94a3b8" />
                    </marker>
                  </defs>
                  
                  {/* Render edges */}
                  {graphData.edges.map((edge, idx) => {
                    const fromNode = graphData.nodes.find(n => n.id === edge.from);
                    const toNode = graphData.nodes.find(n => n.id === edge.to);
                    if (!fromNode || !toNode) return null;
                    
                    const fromIndex = graphData.nodes.indexOf(fromNode);
                    const toIndex = graphData.nodes.indexOf(toNode);
                    
                    const angle1 = (fromIndex / graphData.nodes.length) * 2 * Math.PI;
                    const angle2 = (toIndex / graphData.nodes.length) * 2 * Math.PI;
                    
                    const radius = 150;
                    const centerX = 300;
                    const centerY = 200;
                    
                    const x1 = centerX + radius * Math.cos(angle1);
                    const y1 = centerY + radius * Math.sin(angle1);
                    const x2 = centerX + radius * Math.cos(angle2);
                    const y2 = centerY + radius * Math.sin(angle2);
                    
                    return (
                      <line
                        key={idx}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#94a3b8"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead-dep)"
                        opacity="0.6"
                      />
                    );
                  })}
                  
                  {/* Render nodes */}
                  {graphData.nodes.map((node, idx) => {
                    const angle = (idx / graphData.nodes.length) * 2 * Math.PI;
                    const radius = 150;
                    const centerX = 300;
                    const centerY = 200;
                    
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);
                    
                    const isOrphaned = analysis.analysis.orphaned_nodes.includes(node.id);
                    const isHotspot = analysis.analysis.hotspots.some(h => h.node_id === node.id);
                    const inCycle = analysis.analysis.cycles.some(cycle => cycle.includes(node.id));
                    
                    let fillColor = '#3b82f6';
                    if (isOrphaned) fillColor = '#eab308';
                    if (isHotspot) fillColor = '#f97316';
                    if (inCycle) fillColor = '#ef4444';
                    
                    return (
                      <g key={node.id}>
                        <circle
                          cx={x}
                          cy={y}
                          r="20"
                          fill={fillColor}
                          stroke="white"
                          strokeWidth="3"
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedNode(node)}
                        />
                        <text
                          x={x}
                          y={y + 35}
                          textAnchor="middle"
                          className="text-xs font-medium fill-gray-700"
                        >
                          {node.name.substring(0, 12)}
                        </text>
                        {node.degree > 0 && (
                          <text
                            x={x}
                            y={y + 5}
                            textAnchor="middle"
                            className="text-xs font-bold fill-white"
                          >
                            {node.degree}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-gray-600">Normal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-600">Orphaned</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                  <span className="text-gray-600">Hotspot</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-gray-600">In Cycle</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {services.length === 0 && !isAnalyzing && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Add services to your project to generate dependency analysis.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
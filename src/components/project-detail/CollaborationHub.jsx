import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Activity, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function CollaborationHub({ project }) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newSessionName, setNewSessionName] = useState("");
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    loadSessions();
  }, [project?.id]);

  const loadSessions = async () => {
    if (!project?.id) return;
    
    setIsLoading(true);
    try {
      const data = await base44.entities.CollaborationSession.filter(
        { project_id: project.id },
        '-created_date',
        20
      );
      setSessions(data);
      const active = data.find(s => s.status === 'active');
      if (active) setActiveSession(active);
    } catch (error) {
      console.error("Error loading sessions:", error);
    }
    setIsLoading(false);
  };

  const createSession = async () => {
    if (!newSessionName) return;
    
    try {
      const user = await base44.auth.me();
      
      const newSession = await base44.entities.CollaborationSession.create({
        project_id: project.id,
        session_name: newSessionName,
        participants: [{
          email: user.email,
          role: "owner",
          last_active: new Date().toISOString()
        }],
        changes_log: [{
          user: user.email,
          action: "Session created",
          timestamp: new Date().toISOString(),
          details: `Created session: ${newSessionName}`
        }],
        status: "active"
      });

      setNewSessionName("");
      await loadSessions();
      setActiveSession(newSession);
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  const endSession = async (sessionId) => {
    try {
      await base44.entities.CollaborationSession.update(sessionId, {
        status: "ended"
      });
      await loadSessions();
      if (activeSession?.id === sessionId) setActiveSession(null);
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Real-time Collaboration
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Collaborate with your team in real-time on architecture design
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Session name..."
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createSession()}
            />
            <Button onClick={createSession} disabled={!newSessionName}>
              <Plus className="w-4 h-4 mr-2" />
              Start
            </Button>
          </div>
        </CardContent>
      </Card>

      {activeSession && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-white border-green-200">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{activeSession.session_name}</CardTitle>
                  <Badge className="bg-green-100 text-green-800 mt-2">Active</Badge>
                </div>
                <Button onClick={() => endSession(activeSession.id)} variant="outline" size="sm">
                  End Session
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Participants ({activeSession.participants?.length || 0})
                </h4>
                <div className="space-y-2">
                  {activeSession.participants?.map((p, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm">{p.email}</span>
                      <Badge variant="outline">{p.role}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {activeSession.changes_log && activeSession.changes_log.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Recent Activity
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {activeSession.changes_log.slice(-5).reverse().map((log, i) => (
                      <div key={i} className="text-xs bg-gray-50 p-2 rounded">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{log.user}</span>
                          <span className="text-gray-500">
                            {format(new Date(log.timestamp), 'HH:mm:ss')}
                          </span>
                        </div>
                        <p className="text-gray-600">{log.details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Past Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.filter(s => s.status !== 'active').length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No past sessions</p>
          ) : (
            <div className="space-y-2">
              {sessions.filter(s => s.status !== 'active').map(session => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-sm">{session.session_name}</p>
                    <p className="text-xs text-gray-500">
                      {session.participants?.length || 0} participants
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{session.status}</Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(session.created_date), 'MMM d, HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export const APIExplorer = ({ integration, onTest }) => {
  const [testing, setTesting] = useState(false);
  const [request, setRequest] = useState({
    method: "GET",
    path: "",
    headers: "{}",
    body: "{}"
  });
  const [response, setResponse] = useState(null);

  const testEndpoint = async () => {
    setTesting(true);
    const startTime = Date.now();
    
    try {
      const headers = JSON.parse(request.headers);
      const url = `${integration.base_url}${request.path}`;
      
      // Add auth headers
      if (integration.auth_type === "bearer" && integration.auth_config?.token) {
        headers.Authorization = `Bearer ${integration.auth_config.token}`;
      } else if (integration.auth_type === "api_key" && integration.auth_config?.header_name) {
        headers[integration.auth_config.header_name] = integration.auth_config.token;
      }

      const options = {
        method: request.method,
        headers: { "Content-Type": "application/json", ...headers }
      };

      if (["POST", "PUT", "PATCH"].includes(request.method)) {
        options.body = request.body;
      }

      const res = await fetch(url, options);
      const responseTime = Date.now() - startTime;
      const data = await res.json().catch(() => res.text());

      const result = {
        status: res.status,
        statusText: res.statusText,
        responseTime,
        data,
        success: res.ok
      };

      setResponse(result);

      // Log the request
      await base44.entities.APILog.create({
        integration_id: integration.id,
        method: request.method,
        endpoint: request.path,
        status_code: res.status,
        response_time: responseTime,
        request_payload: request.body,
        response_payload: JSON.stringify(data),
        success: res.ok
      });

      // Update integration metrics
      const newMetrics = {
        total_requests: (integration.metrics?.total_requests || 0) + 1,
        avg_response_time: ((integration.metrics?.avg_response_time || 0) + responseTime) / 2,
        last_success: res.ok ? new Date().toISOString() : integration.metrics?.last_success,
        last_error: !res.ok ? new Date().toISOString() : integration.metrics?.last_error
      };

      await base44.entities.APIIntegration.update(integration.id, { metrics: newMetrics });
      onTest?.();
    } catch (error) {
      setResponse({
        status: 0,
        statusText: "Error",
        responseTime: Date.now() - startTime,
        error: error.message,
        success: false
      });
    }
    
    setTesting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-600" />
          API Explorer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={request.method} onValueChange={(v) => setRequest({...request, method: v})}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {methods.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="/endpoint/path"
              value={request.path}
              onChange={(e) => setRequest({...request, path: e.target.value})}
              className="flex-1 font-mono text-sm"
            />
            <Button onClick={testEndpoint} disabled={testing || !request.path}>
              {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Send
            </Button>
          </div>
        </div>

        <Tabs defaultValue="headers">
          <TabsList>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="body">Body</TabsTrigger>
          </TabsList>
          <TabsContent value="headers">
            <Textarea
              value={request.headers}
              onChange={(e) => setRequest({...request, headers: e.target.value})}
              placeholder='{"Content-Type": "application/json"}'
              className="font-mono text-sm h-32"
            />
          </TabsContent>
          <TabsContent value="body">
            <Textarea
              value={request.body}
              onChange={(e) => setRequest({...request, body: e.target.value})}
              placeholder='{"key": "value"}'
              className="font-mono text-sm h-32"
            />
          </TabsContent>
        </Tabs>

        {response && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border rounded-lg p-4 bg-gradient-to-r from-gray-50 to-blue-50"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {response.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <Badge className={response.success ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"}>
                  {response.status} {response.statusText}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {response.responseTime}ms
                </Badge>
              </div>
            </div>
            <div className="bg-gray-900 text-gray-100 rounded p-3 overflow-x-auto">
              <pre className="text-xs">{JSON.stringify(response.data || response.error, null, 2)}</pre>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};
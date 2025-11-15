import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, ArrowRight } from "lucide-react";

export default function SystemHealth({ stats }) {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Active Services</span>
          <Badge className="bg-green-100 text-green-800 border-green-200">
            {stats.totalServices} Running
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Deployment Status</span>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            All Healthy
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Last Updated</span>
          <span className="text-sm font-medium text-gray-900">Just now</span>
        </div>
        <Link to={createPageUrl("Analytics")}>
          <Button variant="outline" className="w-full mt-4 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200">
            View Analytics
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
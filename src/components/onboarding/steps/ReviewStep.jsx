import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Rocket, Server, GitBranch, BookOpen } from "lucide-react";
import PropTypes from "prop-types";

export default function ReviewStep({ data }) {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <CheckCircle2 className="w-6 h-6" />
            Ready to Launch!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-800">
            Review your project setup below. Click "Launch Project" to create everything.
          </p>
        </CardContent>
      </Card>

      {/* Project Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Rocket className="w-5 h-5 text-blue-600" />
            Project Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-sm font-semibold text-gray-700">Name</div>
            <div className="text-lg font-bold">{data.projectInfo?.icon} {data.projectInfo?.name}</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-700">Description</div>
            <p className="text-sm text-gray-600">{data.projectInfo?.description}</p>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">Category & Architecture</div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-100 text-blue-800">
                {data.projectInfo?.category}
              </Badge>
              <Badge className="bg-purple-100 text-purple-800">
                {data.architecture?.pattern}
              </Badge>
            </div>
          </div>
          {data.architecture?.technologies?.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Technologies</div>
              <div className="flex flex-wrap gap-2">
                {data.architecture.technologies.map((tech, i) => (
                  <Badge key={i} variant="outline">{tech}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Services */}
      {data.services?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="w-5 h-5 text-green-600" />
              Services ({data.services.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {data.services.map((service, i) => (
                <div key={i} className="p-3 border rounded-lg bg-gray-50">
                  <div className="font-semibold text-sm">{service.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{service.description}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="secondary" className="text-xs">{service.category}</Badge>
                    {service.endpoints?.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {service.endpoints.length} APIs
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CI/CD */}
      {data.cicdConfig?.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-indigo-600" />
              CI/CD Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-indigo-600 text-white">{data.cicdConfig.platform}</Badge>
                <span className="text-sm text-gray-600">
                  {Object.keys(data.cicdConfig.stages || {}).length} pipeline stages
                </span>
              </div>
              <div className="text-xs text-gray-600">
                Includes: Docker configs, automated testing, security scanning, and deployment automation
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documentation */}
      {data.documentation?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              Documentation ({data.documentation.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.documentation.map((doc, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>{doc.title}</span>
                  {doc.pinned && <span className="text-xs">📌</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Rocket className="w-8 h-8 text-blue-600" />
            <div>
              <div className="font-semibold text-blue-900">Everything is ready!</div>
              <div className="text-sm text-blue-700">
                Click "Launch Project" to create your complete microservices architecture
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

ReviewStep.propTypes = {
  data: PropTypes.object.isRequired
};
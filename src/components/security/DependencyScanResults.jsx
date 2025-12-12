import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, TrendingUp, ExternalLink } from "lucide-react";

/**
 * DependencyScanResults Component
 * 
 * Displays vulnerability scanning results for project dependencies
 */
export default function DependencyScanResults({ scanData }) {
  const [showOutdated, setShowOutdated] = useState(false);

  if (!scanData) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No dependency scan data available</p>
        </CardContent>
      </Card>
    );
  }

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-600',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-blue-500'
    };
    return colors[severity?.toLowerCase()] || 'bg-gray-500';
  };

  const vulnerablePackages = scanData.vulnerable_packages || [];
  const outdatedPackages = scanData.outdated_packages || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Vulnerable Packages</div>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-red-600">
              {vulnerablePackages.length}
            </div>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-red-600 text-white text-xs">
                Critical: {vulnerablePackages.filter(p => p.severity === 'critical').length}
              </Badge>
              <Badge className="bg-orange-500 text-white text-xs">
                High: {vulnerablePackages.filter(p => p.severity === 'high').length}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Outdated Packages</div>
              <TrendingUp className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-yellow-600">
              {outdatedPackages.length}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOutdated(!showOutdated)}
              className="mt-2"
            >
              {showOutdated ? 'Hide' : 'View'} Outdated
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Security Status</div>
              <Package className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-lg font-bold text-green-600">
              {vulnerablePackages.length === 0 ? '✓ Secure' : '⚠ Needs Attention'}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {vulnerablePackages.length === 0 
                ? 'No known vulnerabilities detected'
                : `${vulnerablePackages.length} vulnerabilities found`
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vulnerable Packages */}
      {vulnerablePackages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Vulnerable Dependencies
          </h3>
          <div className="space-y-3">
            {vulnerablePackages.map((pkg, idx) => (
              <Card key={idx} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        {pkg.package_name}
                        <Badge className={`${getSeverityColor(pkg.severity)} text-white`}>
                          {pkg.severity}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Current: {pkg.current_version} → Fixed: {pkg.fixed_version}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pkg.vulnerable_version && (
                    <div>
                      <span className="text-xs font-semibold text-red-700">Vulnerable Version:</span>
                      <code className="ml-2 text-sm bg-red-50 text-red-800 px-2 py-1 rounded">
                        {pkg.vulnerable_version}
                      </code>
                    </div>
                  )}

                  {pkg.cve_ids && pkg.cve_ids.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-gray-700">CVE IDs:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {pkg.cve_ids.map((cve, i) => (
                          <a
                            key={i}
                            href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                          >
                            {cve}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <span className="text-xs font-semibold text-green-700">Remediation:</span>
                    <p className="text-sm text-green-900 mt-1">{pkg.remediation}</p>
                    <code className="block mt-2 text-xs bg-green-900 text-green-100 px-3 py-2 rounded">
                      npm install {pkg.package_name}@{pkg.fixed_version}
                    </code>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Outdated Packages */}
      {showOutdated && outdatedPackages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-yellow-600" />
            Outdated Dependencies
          </h3>
          <div className="space-y-2">
            {outdatedPackages.map((pkg, idx) => (
              <Card key={idx} className="border-l-4 border-l-yellow-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{pkg.package_name}</div>
                      <div className="text-xs text-gray-600">
                        {pkg.current_version} → {pkg.latest_version}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {pkg.update_priority}
                    </Badge>
                  </div>
                  <code className="block mt-2 text-xs bg-gray-100 px-2 py-1 rounded">
                    npm install {pkg.package_name}@{pkg.latest_version}
                  </code>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {vulnerablePackages.length === 0 && (
        <Card className="border-2 border-green-200">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-green-700 mb-2">All Clear!</h3>
            <p className="text-gray-600">No vulnerable dependencies detected in your project.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
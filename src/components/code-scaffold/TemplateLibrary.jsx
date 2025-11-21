import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookTemplate, Download, Search, Filter, TrendingUp, 
  Code2, Database, Shield, Zap, Box 
} from "lucide-react";
import { motion } from "framer-motion";
import { downloadFile, CopyButton } from "../shared/FileActions";

const templateCategories = {
  api: { icon: Code2, label: "API Templates", color: "from-blue-500 to-cyan-500" },
  database: { icon: Database, label: "Database", color: "from-purple-500 to-pink-500" },
  auth: { icon: Shield, label: "Authentication", color: "from-green-500 to-emerald-500" },
  middleware: { icon: Zap, label: "Middleware", color: "from-orange-500 to-red-500" },
  utils: { icon: Box, label: "Utilities", color: "from-indigo-500 to-purple-500" }
};

const builtInTemplates = [
  {
    id: "rest-api-crud",
    category: "api",
    title: "RESTful CRUD API",
    description: "Complete CRUD operations with validation, error handling, and pagination",
    language: "Node.js",
    framework: "Express",
    code: `const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// GET all with pagination
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = '-created_at' } = req.query;
    
    const items = await Model.find()
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const count = await Model.countDocuments();
    
    res.json({
      items,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (err) {
    next(err);
  }
});

// GET by ID
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Model.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST create
router.post('/',
  [
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const item = new Model(req.body);
      await item.save();
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  }
);

// PUT update
router.put('/:id', async (req, res, next) => {
  try {
    const item = await Model.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// DELETE
router.delete('/:id', async (req, res, next) => {
  try {
    const item = await Model.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;`,
    usage_count: 245
  },
  {
    id: "jwt-auth-middleware",
    category: "auth",
    title: "JWT Authentication Middleware",
    description: "Secure JWT-based authentication with refresh tokens and role-based access",
    language: "Node.js",
    framework: "Express",
    code: `const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

module.exports = { authMiddleware, requireRole, generateTokens };`,
    usage_count: 189
  },
  {
    id: "error-handler",
    category: "middleware",
    title: "Global Error Handler",
    description: "Comprehensive error handling with logging and custom error types",
    language: "Node.js",
    framework: "Express",
    code: `class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Production
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      console.error('ERROR 💥', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong'
      });
    }
  }
};

const asyncHandler = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = { AppError, errorHandler, asyncHandler };`,
    usage_count: 167
  }
];

export const TemplateLibrary = ({ project, onSelectTemplate }) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [templates, setTemplates] = useState(builtInTemplates);

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
                         t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || t.category === category;
    return matchesSearch && matchesCategory;
  });

  const sortedTemplates = filteredTemplates.sort((a, b) => b.usage_count - a.usage_count);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookTemplate className="w-5 h-5 text-indigo-600" />
            Production-Ready Code Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={category === "all" ? "default" : "outline"}
              onClick={() => setCategory("all")}
            >
              All
            </Button>
            {Object.entries(templateCategories).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <Button
                  key={key}
                  size="sm"
                  variant={category === key ? "default" : "outline"}
                  onClick={() => setCategory(key)}
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {config.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {sortedTemplates.map((template, i) => {
          const categoryConfig = templateCategories[template.category];
          const Icon = categoryConfig?.icon || Code2;
          
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="hover:shadow-xl transition-all border-l-4 border-indigo-600">
                <CardHeader className={`bg-gradient-to-r ${categoryConfig?.color || 'from-gray-500 to-gray-600'} bg-opacity-10`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 bg-gradient-to-r ${categoryConfig?.color} rounded-xl flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{template.title}</CardTitle>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{template.language}</Badge>
                          {template.framework && (
                            <Badge variant="outline">{template.framework}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {template.usage_count} uses
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-gray-700">{template.description}</p>
                  
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-2">
                      View Code
                      <span className="group-open:rotate-90 transition-transform">▶</span>
                    </summary>
                    <div className="mt-3 relative">
                      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
                        <code>{template.code}</code>
                      </pre>
                      <div className="absolute top-2 right-2 flex gap-2">
                        <CopyButton content={template.code} id={template.id} />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadFile(`${template.id}.js`, template.code)}
                          className="bg-gray-800 hover:bg-gray-700 text-white"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </details>

                  <Button
                    onClick={() => onSelectTemplate && onSelectTemplate(template)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
                  >
                    Use This Template
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
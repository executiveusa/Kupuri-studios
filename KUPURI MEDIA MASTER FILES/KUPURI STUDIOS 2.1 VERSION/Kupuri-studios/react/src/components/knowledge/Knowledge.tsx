import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '../ui/card'
import { Switch } from '../ui/switch'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { ScrollArea } from '../ui/scroll-area'
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import TopMenu from '../TopMenu'

interface KnowledgeBase {
  id: string
  name: string
  description?: string
  content?: string
  cover?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

interface KnowledgeListParams {
  pageSize?: number
  pageNumber?: number
  search?: string
}

interface KnowledgeListResponse {
  list: KnowledgeBase[]
  pagination: {
    total_pages: number
  }
  is_admin: boolean
}

// Mock API functions
const mockGetKnowledgeList = async (params: KnowledgeListParams = {}): Promise<KnowledgeListResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 800))
  
  const mockKnowledge: KnowledgeBase[] = [
    {
      id: '1',
      name: 'AI Development Guide',
      description: 'Comprehensive guide for developing AI applications and systems',
      content: `# AI Development Guide

## Introduction
This guide covers the fundamentals of AI development, including machine learning, neural networks, and practical implementation strategies.

## Machine Learning Fundamentals
- Supervised Learning
- Unsupervised Learning
- Reinforcement Learning

## Neural Networks
- Architecture Design
- Training Techniques
- Optimization Methods

## Best Practices
- Data Preparation
- Model Selection
- Performance Evaluation

## Conclusion
AI development requires continuous learning and adaptation to new technologies and methodologies.`,
      is_public: true,
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-20T14:30:00Z',
    },
    {
      id: '2',
      name: 'Web Development Standards',
      description: 'Modern web development standards and best practices',
      content: `# Web Development Standards

## Frontend Technologies
- React.js
- Vue.js
- Angular

## Backend Technologies
- Node.js
- Python/Django
- Ruby on Rails

## Databases
- PostgreSQL
- MongoDB
- Redis

## DevOps
- CI/CD Pipelines
- Containerization
- Cloud Deployment`,
      is_public: true,
      created_at: '2025-01-10T09:00:00Z',
      updated_at: '2025-01-18T16:45:00Z',
    },
    {
      id: '3',
      name: 'Database Design Patterns',
      description: 'Common database design patterns and normalization techniques',
      content: `# Database Design Patterns

## Normalization
- First Normal Form (1NF)
- Second Normal Form (2NF)
- Third Normal Form (3NF)

## Design Patterns
- One-to-Many Relationships
- Many-to-Many Relationships
- One-to-One Relationships

## Indexing Strategies
- Primary Keys
- Foreign Keys
- Composite Indexes

## Performance Optimization
- Query Optimization
- Index Selection
- Partitioning`,
      is_public: false,
      created_at: '2025-01-05T11:00:00Z',
      updated_at: '2025-01-12T13:20:00Z',
    },
    {
      id: '4',
      name: 'Security Best Practices',
      description: 'Comprehensive security guidelines for web applications',
      content: `# Security Best Practices

## Authentication
- OAuth 2.0
- JWT Tokens
- Multi-Factor Authentication

## Authorization
- Role-Based Access Control (RBAC)
- Attribute-Based Access Control (ABAC)
- Permission Systems

## Data Protection
- Encryption Standards
- Data Masking
- Secure Storage

## Network Security
- HTTPS Implementation
- CORS Configuration
- Rate Limiting`,
      is_public: true,
      created_at: '2025-01-08T08:00:00Z',
      updated_at: '2025-01-22T15:10:00Z',
    },
    {
      id: '5',
      name: 'Mobile Development Guidelines',
      description: 'Guidelines for cross-platform mobile development',
      content: `# Mobile Development Guidelines

## Cross-Platform Frameworks
- React Native
- Flutter
- Xamarin

## Native Development
- iOS Swift
- Android Kotlin
- Platform-Specific APIs

## Performance Optimization
- Memory Management
- Battery Efficiency
- Network Optimization

## App Store Guidelines
- Review Process
- Submission Requirements
- Update Strategy`,
      is_public: true,
      created_at: '2025-01-12T07:00:00Z',
      updated_at: '2025-01-25T10:30:00Z',
    },
    {
      id: '6',
      name: 'DevOps Pipeline Setup',
      description: 'Step-by-step guide for setting up CI/CD pipelines',
      content: `# DevOps Pipeline Setup

## Infrastructure as Code
- Terraform
- CloudFormation
- Ansible

## CI/CD Tools
- Jenkins
- GitHub Actions
- GitLab CI

## Container Orchestration
- Kubernetes
- Docker Swarm
- Podman

## Monitoring and Logging
- Prometheus
- Grafana
- ELK Stack`,
      is_public: false,
      created_at: '2025-01-03T06:00:00Z',
      updated_at: '2025-01-28T09:45:00Z',
    },
  ]

  let filteredKnowledge = [...mockKnowledge]

  // Apply search filter
  if (params.search) {
    filteredKnowledge = filteredKnowledge.filter(knowledge =>
      knowledge.name.toLowerCase().includes(params.search!.toLowerCase()) ||
      knowledge.description?.toLowerCase().includes(params.search!.toLowerCase())
    )
  }

  const pageSize = params.pageSize || 12
  const pageNumber = params.pageNumber || 1
  const startIndex = (pageNumber - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedKnowledge = filteredKnowledge.slice(startIndex, endIndex)

  return {
    list: paginatedKnowledge,
    pagination: {
      total_pages: Math.ceil(filteredKnowledge.length / pageSize),
    },
    is_admin: true, // Mock as admin for testing
  }
}

const mockGetKnowledgeById = async (id: string): Promise<KnowledgeBase> => {
  await new Promise((resolve) => setTimeout(resolve, 500))
  
  const mockKnowledge: KnowledgeBase = {
    id,
    name: `Knowledge Base ${id}`,
    description: `Detailed description for knowledge base ${id}`,
    content: `# Content for Knowledge Base ${id}

This is the detailed content for the knowledge base with ID ${id}.

## Section 1
Overview and introduction to the topic.

## Section 2
Detailed explanation of key concepts and methodologies.

## Section 3
Practical examples and implementation guidelines.

## Section 4
Best practices and common pitfalls to avoid.

## Conclusion
Summary of key points and next steps.`,
    is_public: Math.random() > 0.5,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-30T00:00:00Z',
  }

  return mockKnowledge
}

const mockSaveEnabledKnowledgeDataToSettings = async (knowledgeData: KnowledgeBase[]) => {
  await new Promise((resolve) => setTimeout(resolve, 300))
  console.log(`Mock saving ${knowledgeData.length} knowledge items to settings`)
}

const mockGetSettings = async () => {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return {
    enabled_knowledge_data: [
      {
        id: '1',
        name: 'AI Development Guide',
        description: 'Comprehensive guide for developing AI applications',
        content: 'Mock content for AI Development Guide',
        is_public: true,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-20T14:30:00Z',
      },
      {
        id: '2',
        name: 'Web Development Standards',
        description: 'Modern web development standards',
        content: 'Mock content for Web Development Standards',
        is_public: true,
        created_at: '2025-01-10T09:00:00Z',
        updated_at: '2025-01-18T16:45:00Z',
      },
    ],
  }
}

export default function Knowledge() {
  const { t } = useTranslation()
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeBase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [enabledKnowledge, setEnabledKnowledge] = useState<Set<string>>(
    new Set()
  )
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  // Detail dialog state
  const [selectedKnowledge, setSelectedKnowledge] =
    useState<KnowledgeBase | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  const pageSize = 12
  const isAdminUser = isAdmin === true

  // Load enabled knowledge from settings
  useEffect(() => {
    const loadEnabledKnowledge = async () => {
      try {
        const settings = await mockGetSettings()
        const enabledData = settings.enabled_knowledge_data || []
        const enabledIds = enabledData.map((kb) => kb.id)
        setEnabledKnowledge(new Set(enabledIds))
      } catch (error) {
        console.error('Failed to load enabled knowledge from settings:', error)
      }
    }

    loadEnabledKnowledge()
  }, [])

  // Fetch knowledge list
  const fetchKnowledgeList = async (params: KnowledgeListParams = {}) => {
    try {
      setLoading(true)
      const response = await mockGetKnowledgeList({
        pageSize,
        pageNumber: currentPage,
        search: searchTerm.trim() || undefined,
        ...params,
      })

      setIsAdmin(response.is_admin)
      setKnowledgeList(response.list)
      setTotalPages(response.pagination.total_pages)
    } catch (error) {
      console.error('Failed to fetch knowledge list:', error)
      toast.error('获取知识库列表失败')
      setKnowledgeList([])
      setIsAdmin(null)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchKnowledgeList({ pageNumber: currentPage })
  }, [currentPage])

  // Search handler
  const handleSearch = () => {
    setCurrentPage(1)
    fetchKnowledgeList({ pageNumber: 1, search: searchTerm })
  }

  // Enter key search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Toggle knowledge enable/disable
  const toggleKnowledge = async (knowledgeId: string, enabled: boolean) => {
    if (!isAdminUser) {
      toast.error('仅管理员可以管理知识库')
      return
    }

    const newEnabled = new Set(enabledKnowledge)
    if (enabled) {
      newEnabled.add(knowledgeId)
    } else {
      newEnabled.delete(knowledgeId)
    }

    // Update local state immediately for UI responsiveness
    setEnabledKnowledge(newEnabled)

    // Get full knowledge data for enabled items and save to settings
    try {
      const enabledKnowledgeData: KnowledgeBase[] = []

      for (const id of newEnabled) {
        // Find in current list first
        let kb = knowledgeList.find((k) => k.id === id)

        // If not found or missing content, fetch full data
        if (!kb || !kb.content) {
          try {
            console.log(`Fetching full data for knowledge: ${id}`)
            kb = await mockGetKnowledgeById(id)
          } catch (error) {
            console.error(`Failed to fetch knowledge ${id}:`, error)
            // Use partial data if available
            kb = knowledgeList.find((k) => k.id === id)
          }
        }

        if (kb) {
          enabledKnowledgeData.push(kb)
        }
      }

      // Save complete data to settings
      await mockSaveEnabledKnowledgeDataToSettings(enabledKnowledgeData)
      console.log(
        `Saved ${enabledKnowledgeData.length} enabled knowledge items to settings`
      )
      toast.success('知识库设置已保存')
    } catch (error) {
      console.error('Failed to save knowledge data to settings:', error)
      toast.error('保存知识库设置失败')
      // Revert UI state on error
      const revertedEnabled = new Set(enabledKnowledge)
      if (enabled) {
        revertedEnabled.delete(knowledgeId)
      } else {
        revertedEnabled.add(knowledgeId)
      }
      setEnabledKnowledge(revertedEnabled)
    }
  }

  // Show knowledge detail
  const showKnowledgeDetail = (knowledge: KnowledgeBase) => {
    setSelectedKnowledge(knowledge)
    setShowDetailDialog(true)
  }

  // Close detail dialog
  const closeDetailDialog = () => {
    setShowDetailDialog(false)
    setSelectedKnowledge(null)
  }

  // Pagination handlers
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  return (
    <div>
      <TopMenu />
      <div className="flex flex-col px-6">

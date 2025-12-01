import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Edge,
  Node,
  OnConnect,
  NodeMouseHandler,
} from '@xyflow/react'
import debounce from 'lodash.debounce'
import { useTranslation } from 'react-i18next'
import { Save, Trash2, Zap, Download, Plus } from 'lucide-react'

import '@xyflow/react/dist/style.css'
import AgentNode from './AgentNode'
import { Textarea } from '../ui/textarea'
import TopMenu from '../TopMenu'
import { saveAgent, loadAgent, deleteAgent, listAgents, deployAgent } from '../../api/agent'

const LOCAL_STORAGE_KEY = 'agent-studio-graph'

const defaultNodes = [
  {
    id: '1',
    type: 'agent',
    position: { x: 0, y: 0 },
    data: { label: '1' },
  },
  {
    id: '2',
    type: 'agent',
    position: { x: 100, y: 100 },
    data: { label: '2' },
  },
]
// const defaultEdges = [{ id: 'e1-2', source: '1', target: '2' }]
const defaultEdges: Edge[] = []

const loadInitialGraph = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return [parsed.nodes || defaultNodes, parsed.edges || defaultEdges]
    }
  } catch (e) {
    console.warn('Failed to load saved graph', e)
  }
  return [defaultNodes, defaultEdges]
}

export default function AgentStudio() {
  const { t } = useTranslation()
  const [initialNodes, initialEdges] = loadInitialGraph()
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [agentName, setAgentName] = useState('')
  const [agentDescription, setAgentDescription] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [agentId, setAgentId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveGraph = useRef(
    debounce((nodes, edges) => {
      console.log('Saving graph', nodes, edges)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ nodes, edges }))
    }, 500)
  ).current

  useEffect(() => {
    saveGraph(nodes, edges)
  }, [nodes, edges, saveGraph])

  const onNodeClick: NodeMouseHandler<Node> = useCallback((_, node) => {
    console.log('onNodeClick', node)
    setSelectedNode(node)
  }, [])

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const handleSaveAgent = async () => {
    if (!agentName.trim()) {
      setError(t('agentStudio.nameRequired', 'Agent name is required'))
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await saveAgent({
        name: agentName,
        description: agentDescription,
        systemPrompt: systemPrompt,
        nodes: nodes as any,
        edges: edges as any,
      })

      setAgentId(response.id)
      setError(null)
      console.log('✅ Agent saved:', response.id)
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to save agent'
      setError(errorMsg)
      console.error('❌ Save failed:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeployAgent = async () => {
    if (!agentId) {
      setError(t('agentStudio.saveFirst', 'Save the agent first before deploying'))
      return
    }

    setIsDeploying(true)
    setError(null)

    try {
      const response = await deployAgent(agentId)
      setError(null)
      console.log('🚀 Agent deployed:', response)
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to deploy agent'
      setError(errorMsg)
      console.error('❌ Deploy failed:', err)
    } finally {
      setIsDeploying(false)
    }
  }

  const handleDeleteAgent = async () => {
    if (!agentId) return

    if (!confirm(t('agentStudio.confirmDelete', 'Delete this agent?'))) {
      return
    }

    setIsSaving(true)

    try {
      await deleteAgent(agentId)
      setAgentId(null)
      setAgentName('')
      setAgentDescription('')
      setSystemPrompt('')
      setError(null)
      console.log('🗑️  Agent deleted')
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to delete agent'
      setError(errorMsg)
      console.error('❌ Delete failed:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLoadAgent = async () => {
    // Show dialog to select agent
    try {
      const result = await listAgents(1, 10)
      if (result.agents.length === 0) {
        setError(t('agentStudio.noAgents', 'No saved agents found'))
        return
      }
      // TODO: Show modal to select from list
      console.log('Available agents:', result.agents)
    } catch (err: any) {
      setError(err?.message || 'Failed to load agents')
    }
  }

  const nodeTypes = {
    agent: AgentNode,
  }

  return (
    <div>
      <TopMenu />
      <div style={{ width: '100vw', height: '100vh' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
        />
      </div>
      {/* Sidebar */}
      {selectedNode && (
        <>
          <div
            className="absolute right-0 top-0 left-0 bottom-0"
            onClick={() => setSelectedNode(null)}
          />
          <div
            className="absolute right-0 top-0 h-[100vh] w-96 bg-sidebar"
            style={{
              width: '25%',
              padding: '16px',
              boxSizing: 'border-box',
              overflowY: 'auto',
            }}
          >
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder={t('agentStudio.enterName', 'Enter Agent Name')}
              className="w-full text-lg font-semibold outline-none border-none mb-2"
            />
            <textarea
              value={agentDescription}
              onChange={(e) => setAgentDescription(e.target.value)}
              placeholder={t('agentStudio.enterDescription', 'Enter Agent Description')}
              className="w-full text-sm outline-none border-none resize-none mb-2 h-16"
            />
            <div className="flex flex-col gap-2 mb-4">
              <p>
                <strong>{t('agentStudio.systemPrompt', 'System Prompt')}</strong>
              </p>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full text-sm mb-2 h-48"
                placeholder={t('agentStudio.enterSystemPrompt', 'Enter System Prompt')}
              />
            </div>

            {/* Agent ID Display */}
            {agentId && (
              <div className="mb-4 p-2 bg-slate-900 rounded text-xs text-slate-400">
                <p className="font-mono break-all">ID: {agentId}</p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-2 bg-red-900/20 border border-red-500/50 rounded text-xs text-red-300">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSaveAgent}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-sm font-medium text-white"
              >
                <Save size={16} />
                {isSaving ? t('agentStudio.saving', 'Saving...') : t('agentStudio.save', 'Save')}
              </button>

              <button
                onClick={handleDeployAgent}
                disabled={isDeploying || !agentId}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded text-sm font-medium text-white"
              >
                <Zap size={16} />
                {isDeploying ? t('agentStudio.deploying', 'Deploying...') : t('agentStudio.deploy', 'Deploy')}
              </button>

              <button
                onClick={handleLoadAgent}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-medium text-white"
              >
                <Download size={16} />
                {t('agentStudio.load', 'Load')}
              </button>

              <button
                onClick={handleDeleteAgent}
                disabled={isSaving || !agentId}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded text-sm font-medium text-white"
              >
                <Trash2 size={16} />
                {t('agentStudio.delete', 'Delete')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

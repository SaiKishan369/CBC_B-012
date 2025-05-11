import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import axios from 'axios';

interface RoadmapStep {
  step: number;
  title: string;
  description: string;
  actions: string[];
  resources: string[];
}

interface RoadmapData {
  title: string;
  description: string;
  timeline: string;
  steps: RoadmapStep[];
  tips: string[];
  milestones: string[];
}

const WellbeingRoadmap: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const createFlowElements = useCallback((data: RoadmapData) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Create main title node
    newNodes.push({
      id: 'title',
      data: { 
        label: (
          <div>
            <Typography variant="h6">{data.title}</Typography>
            <Typography variant="body2">{data.description}</Typography>
            <Typography variant="body2" color="text.secondary">
              Timeline: {data.timeline}
            </Typography>
          </div>
        )
      },
      position: { x: 0, y: 0 },
      style: {
        background: '#f5f5f5',
        padding: 20,
        borderRadius: 8,
        width: 350,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    });

    // Create step nodes
    data.steps.forEach((step, index) => {
      const nodeId = `step-${step.step}`;
      const xOffset = 400 * (index + 1); // Increased horizontal spacing
      const yOffset = 0; // Keep steps at the same vertical level

      newNodes.push({
        id: nodeId,
        data: {
          label: (
            <div>
              <Typography variant="subtitle1">Step {step.step}: {step.title}</Typography>
              <Typography variant="body2">{step.description}</Typography>
              <Typography variant="body2" color="primary">
                Actions:
              </Typography>
              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                {step.actions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ul>
              <Typography variant="body2" color="primary">
                Resources:
              </Typography>
              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                {step.resources.map((resource, i) => (
                  <li key={i}>{resource}</li>
                ))}
              </ul>
            </div>
          ),
        },
        position: { x: xOffset, y: yOffset },
        style: {
          background: '#ffffff',
          padding: 20,
          borderRadius: 8,
          width: 350,
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      });

      // Create edge from previous node
      if (index === 0) {
        newEdges.push({
          id: `edge-title-${nodeId}`,
          source: 'title',
          target: nodeId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#4a90e2' },
        });
      } else {
        newEdges.push({
          id: `edge-${data.steps[index - 1].step}-${step.step}`,
          source: `step-${data.steps[index - 1].step}`,
          target: nodeId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#4a90e2' },
        });
      }
    });

    // Create tips and milestones nodes
    const tipsNodeId = 'tips';
    const milestonesNodeId = 'milestones';
    const lastStepX = 400 * (data.steps.length + 1);
    const tipsY = 200;
    const milestonesY = -200;

    newNodes.push({
      id: tipsNodeId,
      data: {
        label: (
          <div>
            <Typography variant="subtitle1">Tips</Typography>
            <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
              {data.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        ),
      },
      position: { x: lastStepX, y: tipsY },
      style: {
        background: '#e3f2fd',
        padding: 20,
        borderRadius: 8,
        width: 300,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    });

    newNodes.push({
      id: milestonesNodeId,
      data: {
        label: (
          <div>
            <Typography variant="subtitle1">Milestones</Typography>
            <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
              {data.milestones.map((milestone, i) => (
                <li key={i}>{milestone}</li>
              ))}
            </ul>
          </div>
        ),
      },
      position: { x: lastStepX, y: milestonesY },
      style: {
        background: '#e8f5e9',
        padding: 20,
        borderRadius: 8,
        width: 300,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    });

    // Connect tips and milestones to the last step
    const lastStepId = `step-${data.steps[data.steps.length - 1].step}`;
    newEdges.push({
      id: `edge-${lastStepId}-${tipsNodeId}`,
      source: lastStepId,
      target: tipsNodeId,
      type: 'smoothstep',
      style: { stroke: '#4a90e2' },
    });
    newEdges.push({
      id: `edge-${lastStepId}-${milestonesNodeId}`,
      source: lastStepId,
      target: milestonesNodeId,
      type: 'smoothstep',
      style: { stroke: '#4a90e2' },
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:8000/api/wellbeing/roadmap/', {
        prompt,
      });

      if (response.data.roadmap) {
        setRoadmapData(response.data.roadmap);
        createFlowElements(response.data.roadmap);
      } else {
        setError('Invalid response format from server');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.error || err.message;
        setError(`Error: ${errorMessage}`);
        console.error('Full error:', err.response?.data);
      } else {
        setError('An unexpected error occurred');
        console.error('Error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Describe your wellbeing goals and challenges"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !prompt.trim()}
            sx={{ mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Generate Roadmap'}
          </Button>
        </form>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      <Box sx={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </Box>
    </Box>
  );
};

export default WellbeingRoadmap; 
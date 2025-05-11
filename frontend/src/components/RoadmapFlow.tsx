import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Typography, Paper, useTheme, alpha } from '@mui/material';

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

interface RoadmapFlowProps {
  roadmap: RoadmapData;
}

const NODE_WIDTH = 350;
const NODE_HEIGHT = 180;
const VERTICAL_GAP = 80;
const HORIZONTAL_GAP = 400;

const RoadmapFlow: React.FC<RoadmapFlowProps> = ({ roadmap }) => {
  const theme = useTheme();

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Title node
    nodes.push({
      id: 'title',
      data: {
        label: (
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1, textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>{roadmap.title}</Typography>
            <Typography variant="subtitle1" sx={{ color: 'white', opacity: 0.85 }}>{roadmap.description}</Typography>
            <Typography variant="subtitle2" sx={{ color: 'white', opacity: 0.7, mt: 1 }}>Timeline: {roadmap.timeline}</Typography>
          </Box>
        ),
      },
      position: { x: 0, y: 0 },
      style: {
        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
        borderRadius: 16,
        width: NODE_WIDTH + 100,
        minHeight: 120,
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
        border: `2px solid ${theme.palette.primary.main}`,
      },
      draggable: false,
    });

    // Step nodes
    roadmap.steps.forEach((step, idx) => {
      nodes.push({
        id: `step-${idx}`,
        data: {
          label: (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 'bold', mb: 1 }}>Step {step.step}: {step.title}</Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>{step.description}</Typography>
              <Typography variant="subtitle2" sx={{ color: theme.palette.info.main, fontWeight: 'bold' }}>Actions:</Typography>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {step.actions.map((a, i) => <li key={i} style={{ color: theme.palette.text.primary }}>{a}</li>)}
              </ul>
              <Typography variant="subtitle2" sx={{ color: theme.palette.success.main, fontWeight: 'bold', mt: 1 }}>Resources:</Typography>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {step.resources.map((r, i) => <li key={i} style={{ color: theme.palette.text.primary }}>{r}</li>)}
              </ul>
            </Box>
          ),
        },
        position: { x: 0, y: 180 + idx * (NODE_HEIGHT + VERTICAL_GAP) },
        style: {
          background: theme.palette.background.paper,
          borderRadius: 16,
          width: NODE_WIDTH,
          minHeight: NODE_HEIGHT,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: `2px solid ${theme.palette.primary.light}`,
        },
        draggable: false,
      });
      // Connect previous step (or title) to this step
      edges.push({
        id: `edge-step-${idx}`,
        source: idx === 0 ? 'title' : `step-${idx - 1}`,
        target: `step-${idx}`,
        type: 'smoothstep',
        animated: true,
        style: { stroke: theme.palette.primary.main, strokeWidth: 2 },
      });
    });

    // Tips and Milestones nodes at the bottom, horizontally
    const lastStepY = 180 + (roadmap.steps.length - 1) * (NODE_HEIGHT + VERTICAL_GAP);
    nodes.push({
      id: 'tips',
      data: {
        label: (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ color: theme.palette.warning.main, fontWeight: 'bold', mb: 1 }}>Tips</Typography>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {roadmap.tips.map((tip, i) => <li key={i} style={{ color: theme.palette.text.primary }}>{tip}</li>)}
            </ul>
          </Box>
        ),
      },
      position: { x: -HORIZONTAL_GAP, y: lastStepY + NODE_HEIGHT + 60 },
      style: {
        background: alpha(theme.palette.warning.main, 0.08),
        borderRadius: 16,
        width: NODE_WIDTH,
        minHeight: 120,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: `2px solid ${alpha(theme.palette.warning.main, 0.2)}`,
      },
      draggable: false,
    });
    nodes.push({
      id: 'milestones',
      data: {
        label: (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ color: theme.palette.secondary.main, fontWeight: 'bold', mb: 1 }}>Milestones</Typography>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {roadmap.milestones.map((m, i) => <li key={i} style={{ color: theme.palette.text.primary }}>{m}</li>)}
            </ul>
          </Box>
        ),
      },
      position: { x: HORIZONTAL_GAP, y: lastStepY + NODE_HEIGHT + 60 },
      style: {
        background: alpha(theme.palette.secondary.main, 0.08),
        borderRadius: 16,
        width: NODE_WIDTH,
        minHeight: 120,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: `2px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
      },
      draggable: false,
    });
    // Connect last step to tips and milestones
    if (roadmap.steps.length > 0) {
      edges.push({
        id: 'edge-tips',
        source: `step-${roadmap.steps.length - 1}`,
        target: 'tips',
        type: 'smoothstep',
        animated: true,
        style: { stroke: theme.palette.warning.main, strokeWidth: 2 },
      });
      edges.push({
        id: 'edge-milestones',
        source: `step-${roadmap.steps.length - 1}`,
        target: 'milestones',
        type: 'smoothstep',
        animated: true,
        style: { stroke: theme.palette.secondary.main, strokeWidth: 2 },
      });
    }

    return { nodes, edges };
  }, [roadmap, theme]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onInit = useCallback((reactFlowInstance: any) => {
    reactFlowInstance.fitView({ padding: 0.2 });
  }, []);

  return (
    <Box sx={{ width: '100%', height: 'calc(100vh - 100px)', position: 'relative', background: alpha(theme.palette.background.default, 0.8) }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color={theme.palette.grey[200]} gap={24} size={1} />
        <Controls 
          style={{ 
            background: theme.palette.background.paper,
            borderRadius: 12,
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            padding: '8px',
          }} 
        />
        <Panel position="top-right">
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              background: alpha(theme.palette.background.paper, 0.9),
              borderRadius: 2,
              backdropFilter: 'blur(8px)',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Use mouse wheel to zoom, drag to pan
            </Typography>
          </Paper>
        </Panel>
      </ReactFlow>
    </Box>
  );
};

export default RoadmapFlow; 
import React, { useMemo } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
  Label
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Typography, useTheme, Box } from '@mui/material';

const CustomTooltip = ({ active, payload, label }) => {
  const theme = useTheme();
  
  if (active && payload && payload.length) {
    // Safely get values with defaults
    const stepsValue = payload[0]?.value || 0;
    const distanceValue = payload[1]?.value || 0;
    
    // Format values safely
    const formattedSteps = typeof stepsValue === 'number' 
      ? stepsValue.toLocaleString() 
      : '0';
      
    const formattedDistance = typeof distanceValue === 'number' 
      ? distanceValue.toFixed(2) 
      : '0.00';

    return (
      <Box 
        sx={{
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: theme.shape.borderRadius,
          padding: theme.spacing(1.5),
          boxShadow: theme.shadows[3],
          minWidth: 180
        }}
      >
        <Typography variant="subtitle2" sx={{ 
          color: theme.palette.text.primary, 
          marginBottom: 1,
          fontWeight: 500
        }}>
          {label ? format(parseISO(label), 'EEEE, MMM d, yyyy') : 'No date'}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <Box>
            <Typography variant="caption" display="block" color="text.secondary">
              Steps
            </Typography>
            <Typography variant="body2" fontWeight={600} color="primary">
              {formattedSteps}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" display="block" color="text.secondary">
              Distance
            </Typography>
            <Typography variant="body2" fontWeight={600} color="secondary">
              {formattedDistance} km
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }
  return null;
};

const StepsChart = ({ data }) => {
  const theme = useTheme();

  const chartData = useMemo(() => {
    if (!data?.labels?.length) return [];
    
    return data.labels.map((date, index) => {
      // Ensure all values are properly formatted as numbers
      const steps = Number(data.steps?.[index]) || 0;
      const distance = data.distance_km ? (Number(data.distance_km[index]) || 0) : 0;
      
      return {
        date,
        steps,
        distance,
      };
    });
  }, [data]);
  
  const averageSteps = useMemo(() => {
    if (!chartData.length) return 0;
    const sum = chartData.reduce((acc, item) => acc + item.steps, 0);
    return sum / chartData.length;
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          p: 4,
          textAlign: 'center',
          color: 'text.secondary'
        }}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No activity data available
        </Typography>
        <Typography variant="body2">
          Start tracking your steps to see your activity history here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 20,
            left: 0,
            bottom: 5,
          }}
        >
          <defs>
            <linearGradient id="stepsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.05}/>
            </linearGradient>
            <linearGradient id="distanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false}
            stroke={theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
          />
          
          <XAxis 
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ 
              fill: theme.palette.text.secondary,
              fontSize: 12,
              fontFamily: theme.typography.fontFamily
            }}
            tickFormatter={(date) => format(parseISO(date), 'MMM d')}
            tickMargin={10}
          />
          
          <YAxis 
            yAxisId="left"
            orientation="left"
            axisLine={false}
            tickLine={false}
            tick={{ 
              fill: theme.palette.text.secondary,
              fontSize: 12,
              fontFamily: theme.typography.fontFamily
            }}
            tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value}
            width={40}
          />
          
          <YAxis 
            yAxisId="right"
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ 
              fill: theme.palette.text.secondary,
              fontSize: 12,
              fontFamily: theme.typography.fontFamily
            }}
            tickFormatter={(value) => `${value} km`}
            width={50}
          />
          
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{
              stroke: theme.palette.divider,
              strokeWidth: 1,
              strokeDasharray: '3 3',
            }}
          />
          
          <Legend 
            verticalAlign="top"
            height={36}
            formatter={(value) => (
              <span style={{ 
                color: theme.palette.text.primary,
                fontSize: '0.75rem',
                fontFamily: theme.typography.fontFamily
              }}>
                {value}
              </span>
            )}
          />
          
          <ReferenceLine 
            yAxisId="left"
            y={averageSteps} 
            stroke={theme.palette.primary.main}
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          >
            <Label 
              value={`Avg: ${Math.round(averageSteps).toLocaleString()}`}
              fill={theme.palette.text.secondary}
              fontSize={12}
              position="right"
            />
          </ReferenceLine>
          
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="steps"
            name="Steps"
            stroke={theme.palette.primary.main}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#stepsGradient)"
            activeDot={{
              r: 4,
              stroke: theme.palette.background.paper,
              strokeWidth: 2,
              fill: theme.palette.primary.main
            }}
          />
          
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="distance"
            name="Distance"
            stroke={theme.palette.secondary.main}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#distanceGradient)"
            activeDot={{
              r: 4,
              stroke: theme.palette.background.paper,
              strokeWidth: 2,
              fill: theme.palette.secondary.main
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default StepsChart;

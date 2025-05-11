import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Tabs, 
  Tab, 
  Grid, 
  Card, 
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  ListItemAvatar,
  LinearProgress
} from '@mui/material';
import { CheckCircle, CloudUpload, Description } from '@mui/icons-material';
import FileUploader from '../components/FileUploader';
import StepsChart from '../components/StepsChart';

const UploadDataPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [summary, setSummary] = useState(null);

  const handleUploadComplete = (data) => {
    // In a real app, you would fetch the updated data from the server
    // For now, we'll just show a success message
    setSummary({
      message: 'File uploaded successfully!',
      file: data.file.name,
      size: data.file.size,
      ...data.summary // Include any additional summary data from the response
    });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Mock data for the chart - in a real app, this would come from your API
  const chartData = {
    labels: Array.from({length: 30}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split('T')[0];
    }),
    steps: Array.from({length: 30}, () => Math.floor(Math.random() * 10000) + 2000),
    distance_km: Array.from({length: 30}, () => (Math.random() * 5 + 1).toFixed(2))
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Upload Health Data
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload Smartwatch Data
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Upload your Samsung Health data export to view detailed analytics and insights.
              Supported formats: .zip, .json, .csv, .xls, .xlsx
            </Typography>
            
            <FileUploader onUploadComplete={handleUploadComplete} />
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              sx={{ mb: 3 }}
              aria-label="data visualization tabs"
            >
              <Tab label="Steps" />
              <Tab label="Distance" />
              <Tab label="Calories" />
            </Tabs>
            
            <Box sx={{ height: 400 }}>
              <StepsChart data={chartData} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload Summary
            </Typography>
            
            {summary ? (
              <Box>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          Steps Imported
                        </Typography>
                        <Typography variant="h5" component="div">
                          {summary.stepsImported.toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          Daily Summaries
                        </Typography>
                        <Typography variant="h5" component="div">
                          {summary.dailySummaries}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Recent Activity
                </Typography>
                <Box sx={{ mt: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h5" gutterBottom>Upload Your Health Data</Typography>
                      <Typography paragraph>
                        Follow these simple steps to upload and analyze your Samsung Health data:
                      </Typography>
                      
                      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar>
                              <CloudUpload />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary="Step 1: Upload Your Data" 
                            secondary="Upload your Samsung Health export file" 
                          />
                        </ListItem>
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                          <LinearProgress sx={{ width: '80%' }} />
                        </Box>
                        
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar>
                              <Description />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary="Step 2: View Your Data" 
                            secondary="Analyze your health metrics and trends" 
                            sx={{ opacity: 0.7 }}
                          />
                        </ListItem>
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                          <LinearProgress sx={{ width: '80%' }} variant="determinate" value={0} />
                        </Box>
                        
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar>
                              <CheckCircle />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary="Step 3: Get Insights" 
                            secondary="Gain valuable insights into your health" 
                            sx={{ opacity: 0.7 }}
                          />
                        </ListItem>
                      </List>
                      
                      <Box sx={{ mt: 3 }}>
                        <FileUploader onUploadComplete={handleUploadComplete} />
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Upload your data to see a summary of your activity.
                </Typography>
              </Box>
            )}
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Data Privacy
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Your health data is processed securely and never shared with third parties.
              All data is encrypted in transit and at rest.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              For more information, please review our{' '}
              <a href="/privacy" style={{ color: 'inherit' }}>Privacy Policy</a>.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UploadDataPage;

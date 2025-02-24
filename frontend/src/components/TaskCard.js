// src/components/TaskCard.js
import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

function TaskCard({ task }) {
  return (
    <Card style={{ margin: '10px' }}>
      <CardContent>
        <Typography variant="h5" component="h2">
          {task.projectName} - {task.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {task.startDate} - {task.deadline}
        </Typography>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ flexGrow: 1, backgroundColor: '#e0e0e0', height: '10px', marginRight: '10px' }}>
            <div style={{ width: `${task.progress}%`, backgroundColor: '#3f51b5', height: '10px' }}></div>
          </div>
          <Typography variant="body2" color="text.secondary">
            {task.progress}%
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}

export default TaskCard;

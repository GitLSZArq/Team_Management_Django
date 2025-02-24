// src/components/ProjectCard.js
import React, { useState } from 'react';
import { Card, CardContent, Typography, Collapse } from '@mui/material';

function ProjectCard({ project }) {
  const [open, setOpen] = useState(false);

  return (
    <Card onClick={() => setOpen(!open)} style={{ margin: '10px', borderRadius: '50%', width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CardContent style={{ textAlign: 'center' }}>
        <Typography variant="h5" component="div">
          {project.name} ({project.code})
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Project ID: {project.id}
        </Typography>
        <Collapse in={open} timeout="auto" unmountOnExit>
          {/* Assuming tasks are not included here; you might adjust this part */}
        </Collapse>
      </CardContent>
    </Card>
  );
}

export default ProjectCard;

import React from 'react';
import { CircularProgress, Typography, Card, CardContent, CardActions, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

const ProjectCard = styled(Card)(({ theme }) => ({
  margin: theme.spacing(2),
  padding: theme.spacing(2),
  textAlign: 'center',
  backgroundColor: '#2c2c2c', /* Darker background */
  color: '#e0e0e0', /* Light text */
}));

function Projects({ projects }) {
  if (!projects || projects.length === 0) {
    return <CircularProgress />;
  }

  return (
    <div>
      {projects.map((project) => (
        <ProjectCard key={project.id}>
          <CardContent>
            <Typography variant="h5" component="h2">
              {project.name} ({project.code})
            </Typography>
            <Typography variant="body2" component="p">
              {project.tasks && project.tasks.filter(task => !task.parent).length > 0 ? `${project.tasks.filter(task => !task.parent).length} open tasks` : 'No tasks available'}
            </Typography>
            {project.tasks &&
              project.tasks.filter(task => !task.parent).map((task) => (
                <Typography key={task.id} variant="body2" component="p">
                  {task.name} - {task.progress}%
                </Typography>
              ))}
          </CardContent>
          <CardActions>
            <Button size="small">View Details</Button>
          </CardActions>
        </ProjectCard>
      ))}
    </div>
  );
}

export default Projects;

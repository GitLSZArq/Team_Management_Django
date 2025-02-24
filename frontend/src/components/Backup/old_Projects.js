import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

function Projects() {
  const [projects, setProjects] = useState([]); // Initialize as an array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/core/api/projects/')
      .then(response => {
        if (Array.isArray(response.data)) { // Check if the data is an array
          setProjects(response.data);
        } else {
          setError("Data format error: Expected an array");
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching projects:', error);
        setError(error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading projects...</div>;
  if (error) return <div>Error: {error.toString()}</div>;

  return (
    <div>
      {projects.map((project) => (
        <Card key={project.id} style={{ margin: 8 }}>
          <CardContent>
            <Typography variant="h5" component="h2">
              {project.name}
            </Typography>
            <Typography color="textSecondary">
              {project.description} {/* Assuming there's a description field */}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default Projects;

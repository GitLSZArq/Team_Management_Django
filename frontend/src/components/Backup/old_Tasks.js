import React, { useEffect, useState } from 'react';
import axios from 'axios';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/core/api/tasks/')
      .then(response => {
        setTasks(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching tasks:', error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading tasks...</div>;

  return (
    <List component="nav">
      {tasks.map((task, index) => (
        <React.Fragment key={task.id}>
          <ListItem button>
            <ListItemText primary={task.name} secondary={`Due: ${task.deadline}`} />
          </ListItem>
          {index < tasks.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  );
}

export default Tasks;

import React, { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import People from './components/People';
import Projects from './components/Projects';
import Tasks from './components/Tasks';
import Layout from './components/Layout';

const API_URL = process.env.REACT_APP_API_URL;

function App() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectsResponse = await axios.get(`${API_URL}/api/projects/`);
        const tasksResponse = await axios.get(`${API_URL}/api/tasks/`);
        setProjects(projectsResponse.data);
        setTasks(tasksResponse.data);
        setLoading(false);
        console.log('Projects:', projectsResponse.data);
        console.log('Tasks:', tasksResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading data: {error.message}</div>;
  }

  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            Task Management System
          </Typography>
          <Button color="inherit" component={Link} to="/people">People</Button>
          <Button color="inherit" component={Link} to="/projects">Projects</Button>
          <Button color="inherit" component={Link} to="/tasks">Tasks</Button>
          <Button color="inherit" component={Link} to="/">Home</Button>
        </Toolbar>
      </AppBar>
      <Layout>
        <Routes>
          <Route path="/people" element={<People />} />
          <Route path="/projects" element={<Projects projects={projects} />} />
          <Route
              path="/tasks"
              element={<Tasks tasks={tasks} setTasks={setTasks} projects={projects} />}
          />
          <Route path="/" element={<Home />} />
        </Routes>
      </Layout>
    </Router>
  );
}

function Home() {
  return <h2>Welcome to the Task Management System</h2>;
}

export default App;

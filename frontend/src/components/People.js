import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, Typography, Grid, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import './People.css';

const PersonCard = styled(Card)(({ theme }) => ({
  margin: theme.spacing(2),
  padding: theme.spacing(2),
  textAlign: 'center',
  backgroundColor: '#2c2c2c', /* Darker background */
  color: '#e0e0e0', /* Light text */
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  marginTop: theme.spacing(2),
  backgroundColor: '#2c2c2c', /* Dark background */
  color: '#e0e0e0', /* Light text */
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  color: '#e0e0e0', /* Light text */
  borderBottom: '1px solid #444', /* Darker border */
}));

function People() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/people/')
      .then(response => {
        setPeople(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setError(error);
        setLoading(false);
      });
  }, []);

  const handlePersonClick = (person) => {
    setSelectedPerson(person);
    fetchTasks(person.id);
  };

  const fetchTasks = (personId) => {
    axios.get(`http://127.0.0.1:8000/api/tasks/?assigned_to=${personId}&progress__lt=100`)
      .then(response => {
        const fetchedTasks = response.data;
        // Filter the tasks that are not completed and assigned to the selected person
        const personTasks = fetchedTasks.filter(task => task.assigned_to === personId && task.progress < 100);
        setTasks(personTasks);
        setShowTable(true);
      })
      .catch(error => {
        console.error('Error fetching tasks:', error);
      });
  };

  const handleCloseTable = () => {
    setShowTable(false);
    setSelectedPerson(null);
    setTasks([]);
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">Error loading people: {error.message}</Typography>;
  }

const renderTasksTable = (tasks) => {
    const sortedTasks = tasks.sort((a, b) => {
        return a.project_name.localeCompare(b.project_name) || 
               new Date(a.start_date) - new Date(b.start_date) || 
               (a.parent ? 1 : -1); // Ensure parent tasks come before subtasks
    });

    return (
        <StyledTableContainer component={Paper} className="people-table-container">
            <Table className="people-table">
                <TableHead>
                    <TableRow>
                        <StyledTableCell>Project Name</StyledTableCell>
                        <StyledTableCell>Task Name</StyledTableCell>
                        <StyledTableCell>Subtask</StyledTableCell>
                        <StyledTableCell>Start Date</StyledTableCell>
                        <StyledTableCell>End Date</StyledTableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedTasks.map(task => {
                        const subtasks = tasks.filter(subtask => subtask.parent === task.id).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

                        if (!task.parent && subtasks.length > 0) {
                            return subtasks.map(subtask => (
                                <TableRow key={subtask.id}>
                                    <StyledTableCell>{task.project_name}</StyledTableCell>
                                    <StyledTableCell>{task.name}</StyledTableCell>
                                    <StyledTableCell>{subtask.name}</StyledTableCell>
                                    <StyledTableCell>{subtask.start_date}</StyledTableCell>
                                    <StyledTableCell>{subtask.deadline}</StyledTableCell>
                                </TableRow>
                            ));
                        } else if (!task.parent && subtasks.length === 0) {
                            return (
                                <TableRow key={task.id}>
                                    <StyledTableCell>{task.project_name}</StyledTableCell>
                                    <StyledTableCell>{task.name}</StyledTableCell>
                                    <StyledTableCell>-</StyledTableCell>
                                    <StyledTableCell>{task.start_date}</StyledTableCell>
                                    <StyledTableCell>{task.deadline}</StyledTableCell>
                                </TableRow>
                            );
                        } else {
                            return null; // Skip rendering subtasks independently
                        }
                    })}
                </TableBody>
            </Table>
            <Button onClick={handleCloseTable} style={{ color: '#bb86fc', margin: '10px' }}>Close</Button>
        </StyledTableContainer>
    );
};




  return (
    <Grid container spacing={3} className="parent-container">
      {people.map(person => (
        <Grid item key={person.id} xs={12} sm={6} md={4}>
          <PersonCard onClick={() => handlePersonClick(person)}>
            <CardContent>
              <Typography variant="h5">{person.name}</Typography>
              <Typography variant="body1">{person.email}</Typography>
              <Typography variant="body2">{person.position}</Typography>
              {person.company && <Typography variant="body2">{person.company}</Typography>}
            </CardContent>
          </PersonCard>
        </Grid>
      ))}
      {selectedPerson && showTable && (
        <Grid item xs={12}>
          {renderTasksTable(tasks)}
        </Grid>
      )}
    </Grid>
  );
}



export default People;

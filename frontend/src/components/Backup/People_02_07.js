import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, Typography, Grid, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

const PersonCard = styled(Card)(({ theme }) => ({
  margin: theme.spacing(2),
  padding: theme.spacing(2),
  textAlign: 'center',
  backgroundColor: '#f5f5f5',
}));

function People() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">Error loading people: {error.message}</Typography>;
  }

  return (
    <Grid container spacing={3}>
      {people.map(person => (
        <Grid item key={person.id} xs={12} sm={6} md={4}>
          <PersonCard>
            <CardContent>
              <Typography variant="h5">{person.name}</Typography>
              <Typography variant="body1">{person.email}</Typography>
              <Typography variant="body2">{person.position}</Typography>
              {person.company && <Typography variant="body2">{person.company}</Typography>}
            </CardContent>
          </PersonCard>
        </Grid>
      ))}
    </Grid>
  );
}

export default People;

import React from 'react';
import { Container } from '@mui/material';
import { styled } from '@mui/material/styles';

const MainContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  padding: theme.spacing(4),
  backgroundColor: '#1f1f1f', /* Dark background */
  color: '#e0e0e0', /* Light text */
  borderRadius: theme.shape.borderRadius,
}));

function Layout({ children }) {
  return (
    <MainContainer maxWidth="lg">
      {children}
    </MainContainer>
  );
}

export default Layout;

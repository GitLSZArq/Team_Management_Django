import React from 'react';
import { Container } from '@mui/material';
import { styled } from '@mui/material/styles';

const MainContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  padding: theme.spacing(4),
  backgroundColor: '#f9f9f9',
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

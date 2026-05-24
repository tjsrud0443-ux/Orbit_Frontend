import React from 'react';
import { Pagination as MuiPagination, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';



const StyledPagination = styled(MuiPagination)(({ theme }) => ({

  '& .MuiPaginationItem-root': {
    fontFamily: 'inherit',
    fontWeight: 'bold',
    borderRadius: '12px',

    '&.Mui-selected': {
      backgroundColor: '#3530B8',
      color: '#fff',

      '&:hover': {
        backgroundColor: '#2a2594',
      },
    },

    '&:hover': {
      backgroundColor: '#F0F4FF',
      color: '#3530B8',
    },
  },
}));

const Pagination = ({ count, page, onChange }) => {

  return (
    <Stack spacing={2} sx={{ alignItems: 'center', py: 3 }}>
      <StyledPagination
        count={count}
        page={page}
        onChange={onChange}
        variant="outlined"
        shape="rounded"
        color="primary"
      />
    </Stack>

  );

};

export default Pagination;
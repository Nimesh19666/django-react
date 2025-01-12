import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TablePagination,
  MenuItem,
  Chip,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { inventoryApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    item: '',
    quantity: 0,
    transaction_type: 'IN',
    notes: '',
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchTransactions();
    fetchItems();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await inventoryApi.getTransactions();
      setTransactions(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await inventoryApi.getItems();
      setItems(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleOpen = () => {
    setFormData({
      item: '',
      quantity: 0,
      transaction_type: 'IN',
      notes: '',
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await inventoryApi.createTransaction(formData);
      handleClose();
      fetchTransactions();
      fetchItems(); // Refresh items to update quantities
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getTransactionTypeColor = (type) => {
    return type === 'IN' ? 'success' : 'error';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Transactions</Typography>
        {user?.is_staff && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpen}
          >
            Add Transaction
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Item</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{transaction.item_name}</TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.transaction_type === 'IN' ? 'Stock In' : 'Stock Out'}
                      color={getTransactionTypeColor(transaction.transaction_type)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{transaction.quantity}</TableCell>
                  <TableCell>{transaction.notes}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={transactions.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add Transaction</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              margin="dense"
              label="Item"
              select
              fullWidth
              required
              value={formData.item}
              onChange={(e) => setFormData({ ...formData, item: e.target.value })}
            >
              {items.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name} (Current Stock: {item.quantity})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              margin="dense"
              label="Transaction Type"
              select
              fullWidth
              required
              value={formData.transaction_type}
              onChange={(e) =>
                setFormData({ ...formData, transaction_type: e.target.value })
              }
            >
              <MenuItem value="IN">Stock In</MenuItem>
              <MenuItem value="OUT">Stock Out</MenuItem>
            </TextField>
            <TextField
              margin="dense"
              label="Quantity"
              type="number"
              fullWidth
              required
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: Number(e.target.value) })
              }
            />
            <TextField
              margin="dense"
              label="Notes"
              fullWidth
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Add
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

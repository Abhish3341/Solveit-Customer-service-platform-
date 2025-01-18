const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Ticket = require('../models/ticketModel');

// Create ticket
router.post('/', protect, async (req, res) => {
  try {
    const ticket = await Ticket.create({
      ...req.body,
      requester: req.user._id,
    });
    res.status(201).json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all tickets
router.get('/', protect, async (req, res) => {
  try {
    const tickets = await Ticket.find(
      req.user.role === 'customer' ? { requester: req.user._id } : {}
    )
    .populate('requester', 'name email')
    .populate('assignee', 'name email');
    res.json(tickets);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get ticket by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('requester', 'name email')
      .populate('assignee', 'name email')
      .populate('comments.user', 'name email');
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update ticket
router.put('/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    if (req.user.role === 'customer' && ticket.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedTicket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add comment
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.comments.push({
      text: req.body.text,
      user: req.user._id,
    });

    await ticket.save();
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
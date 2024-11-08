// src/routes/person.routes.js
const router = require('express').Router();
const personController = require('../controllers/person.controller');
const { validatePerson } = require('../middleware/validation.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Basic CRUD with admin/manager authorization
router.get('/persons', 
    authenticate, 
    personController.list
);

router.post('/persons', 
    authenticate, 
    authorize(['admin', 'manager']),
    validatePerson, 
    personController.create
);

router.get('/persons/:id', 
    authenticate, 
    personController.get
);

router.put('/persons/:id', 
    authenticate, 
    authorize(['admin', 'manager']),
    validatePerson, 
    personController.update
);

router.delete('/persons/:id', 
    authenticate, 
    authorize(['admin']),
    personController.delete
);

// Specialized endpoints
router.get('/persons/search', 
    authenticate,
    personController.search
);

router.get('/persons/:id/schedule', 
    authenticate,
    personController.getSchedule
);

router.get('/persons/:id/events', 
    authenticate,
    personController.getEvents
);

router.get('/persons/:id/availability', 
    authenticate,
    personController.getAvailability
);

// Bulk operations
router.post('/persons/bulk', 
    authenticate, 
    authorize(['admin']),
    personController.bulkCreate
);

router.put('/persons/bulk', 
    authenticate, 
    authorize(['admin']),
    personController.bulkUpdate
);

module.exports = router;
import { Note } from '../models/index.js';
import Logger from '../core/Logger.js';
const logger = Logger.getInstance();

class NoteController {
    create = async (req, res) => {
        try {
            const note = await Note.create({
                ...req.body,
                addedBy: req.user.username
            });

            logger.info(`Note created: ${note.id}`);
            return res.status(201).json(note);
        } catch (error) {
            logger.error(`Note creation failed: ${error.message}`);
            return res.status(400).json({ 
                message: 'Failed to create note',
                error: error.message 
            });
        }
    }

    delete = async (req, res) => {
        try {
            const note = await Note.findByPk(req.params.id);
            if (!note) {
                logger.warn(`Note not found for deletion: ${req.params.id}`);
                return res.status(404).json({ message: 'Note not found' });
            }

            await note.destroy();
            logger.info(`Note deleted: ${note.id}`);
            return res.status(204).send();
        } catch (error) {
            logger.error(`Note deletion failed: ${error.message}`);
            return res.status(500).json({ 
                message: 'Failed to delete note',
                error: error.message 
            });
        }
    }

    get = async (req, res) => {
        try {
            const note = await Note.findByPk(req.params.id);
            if (!note) {
                logger.warn(`Note not found: ${req.params.id}`);
                return res.status(404).json({ message: 'Note not found' });
            }
            return res.json(note);
        } catch (error) {
            logger.error(`Note retrieval failed: ${error.message}`);
            return res.status(500).json({ 
                message: 'Failed to get note',
                error: error.message 
            });
        }
    }

    getByDate = async (req, res) => {
        try {
            const date = new Date(req.params.date);
            if (isNaN(date.getTime())) {
                return res.status(400).json({ message: 'Invalid date format' });
            }

            const notes = await Note.findAll({
                where: { date },
                order: [['createdAt', 'DESC']]
            });

            logger.info(`Retrieved ${notes.length} notes for date: ${req.params.date}`);
            return res.json(notes);
        } catch (error) {
            logger.error(`Date search failed: ${error.message}`);
            return res.status(500).json({ 
                message: 'Failed to get notes by date',
                error: error.message 
            });
        }
    }

    list = async (req, res) => {
        try {
            const { page = 1, limit = 10, date } = req.query;
            const where = {};
            if (date) where.date = new Date(date);

            const notes = await Note.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset: (page - 1) * parseInt(limit),
                order: [['createdAt', 'DESC']]
            });

            logger.info(`Retrieved ${notes.count} notes`);
            return res.json({
                notes: notes.rows,
                total: notes.count,
                page: parseInt(page),
                totalPages: Math.ceil(notes.count / limit)
            });
        } catch (error) {
            logger.error(`Note listing failed: ${error.message}`);
            return res.status(500).json({ 
                message: 'Failed to list notes',
                error: error.message 
            });
        }
    }

    search = async (req, res) => {
        try {
            const { query, startDate, endDate } = req.query;
            const where = {};

            if (query) {
                where[Op.or] = [
                    { title: { [Op.iLike]: `%${query}%` } },
                    { content: { [Op.iLike]: `%${query}%` } }
                ];
            }

            if (startDate && endDate) {
                where.date = {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                };
            }

            const notes = await Note.findAll({
                where,
                order: [['createdAt', 'DESC']]
            });

            logger.info(`Search found ${notes.length} notes`);
            return res.json(notes);
        } catch (error) {
            logger.error(`Note search failed: ${error.message}`);
            return res.status(500).json({ 
                message: 'Failed to search notes',
                error: error.message 
            });
        }
    }

    update = async (req, res) => {
        try {
            const note = await Note.findByPk(req.params.id);
            if (!note) {
                logger.warn(`Note not found for update: ${req.params.id}`);
                return res.status(404).json({ message: 'Note not found' });
            }

            await note.update(req.body);
            logger.info(`Note updated: ${note.id}`);
            return res.json(note);
        } catch (error) {
            logger.error(`Note update failed: ${error.message}`);
            return res.status(400).json({ 
                message: 'Failed to update note',
                error: error.message 
            });
        }
    }
}

export { NoteController };
export default NoteController;
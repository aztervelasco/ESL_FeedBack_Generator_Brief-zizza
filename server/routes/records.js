import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// GET /api/records - Fetch all records (with optional student filter)
router.get('/', async (req, res) => {
  try {
    const { student } = req.query;
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is disabled. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the backend .env file.' });
    }

    let query = supabase
      .from('feedback_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (student) {
      // Filter case-insensitive, partial match
      query = query.ilike('student_name', `%${student}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching records from Supabase:', error);
    res.status(500).json({ error: 'Failed to retrieve records.' });
  }
});

// POST /api/records - Save a record
router.post('/', async (req, res) => {
  try {
    const { studentName, date, teacherName, lessonUnit, checkedItems, feedbackText, gender } = req.body;

    if (!studentName || !date || !feedbackText) {
      return res.status(400).json({ error: 'studentName, date, and feedbackText are required fields.' });
    }

    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is disabled. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the backend .env file.' });
    }

    const { data, error } = await supabase
      .from('feedback_records')
      .insert([
        {
          student_name: studentName,
          date: date,
          teacher_name: teacherName || '',
          lesson_unit: lessonUnit || '',
          checked_items: checkedItems || {},
          feedback_text: feedbackText,
          gender: gender || null
        }
      ])
      .select();

    if (error) {
      throw error;
    }

    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error saving record to Supabase:', error);
    res.status(500).json({ error: 'Failed to save record.' });
  }
});

// PUT /api/records/:id - Update a record in Supabase
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentName, date, teacherName, lessonUnit, feedbackText, gender } = req.body;

    if (!studentName || !date || !feedbackText) {
      return res.status(400).json({ error: 'studentName, date, and feedbackText are required fields.' });
    }

    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is disabled.' });
    }

    const { data, error } = await supabase
      .from('feedback_records')
      .update({
        student_name: studentName,
        date: date,
        teacher_name: teacherName || '',
        lesson_unit: lessonUnit || '',
        feedback_text: feedbackText,
        gender: gender || null
      })
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Record not found.' });
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Error updating record in Supabase:', error);
    res.status(500).json({ error: 'Failed to update record.' });
  }
});

// DELETE /api/records/:id - Delete a record from Supabase
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is disabled.' });
    }

    const { error } = await supabase
      .from('feedback_records')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({ message: 'Record deleted successfully.' });
  } catch (error) {
    console.error('Error deleting record from Supabase:', error);
    res.status(500).json({ error: 'Failed to delete record.' });
  }
});

export default router;

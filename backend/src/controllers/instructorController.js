const { prisma } = require('../config/db');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * @desc    Get all instructors
 * @route   GET /api/v1/instructors
 * @access  Public
 */
const getInstructors = async (req, res) => {
  try {
    const instructors = await prisma.instructors.findMany({
      orderBy: { id: 'desc' }
    });

    const serializedInstructors = instructors.map(inst => ({
      ...inst,
      id: inst.id.toString(),
    }));

    res.status(200).json({ success: true, count: serializedInstructors.length, data: serializedInstructors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create a new instructor
 * @route   POST /api/v1/instructors
 * @access  Private (Admin)
 */
const createInstructor = async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    return res.status(400).json({ success: false, message: 'Name and description are required' });
  }

  try {
    // Check if instructor already exists
    const existingInstructor = await prisma.instructors.findUnique({
      where: { Name: name }
    });

    if (existingInstructor) {
      return res.status(400).json({ success: false, message: 'Instructor with this name already exists' });
    }

    let imageUrl = null;

    if (req.file) {
      const file = req.file;
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('Instructors')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('Instructors')
        .getPublicUrl(fileName);

      imageUrl = publicUrl;
    }

    const instructor = await prisma.instructors.create({
      data: {
        Name: name,
        Description: description,
        Image: imageUrl
      }
    });

    res.status(201).json({
      success: true,
      data: { ...instructor, id: instructor.id.toString() }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update an instructor
 * @route   PUT /api/v1/instructors/:id
 * @access  Private (Admin)
 */
const updateInstructor = async (req, res) => {
  const { name, description } = req.body;
  let instructorId;
  
  try {
    instructorId = BigInt(req.params.id);
  } catch (err) {
    return res.status(400).json({ success: false, message: 'Invalid Instructor ID format' });
  }

  try {
    const instructor = await prisma.instructors.findUnique({
      where: { id: instructorId }
    });

    if (!instructor) {
      return res.status(404).json({ success: false, message: 'Instructor not found' });
    }

    let imageUrl = instructor.Image;

    if (req.file) {
      const file = req.file;
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('Instructors')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('Instructors')
        .getPublicUrl(fileName);

      imageUrl = publicUrl;
    }

    const updateData = {};
    if (name) updateData.Name = name;
    if (description) updateData.Description = description;
    if (imageUrl !== instructor.Image) updateData.Image = imageUrl;

    const updatedInstructor = await prisma.instructors.update({
      where: { id: instructorId },
      data: updateData
    });

    res.status(200).json({
      success: true,
      data: { ...updatedInstructor, id: updatedInstructor.id.toString() }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete an instructor
 * @route   DELETE /api/v1/instructors/:id
 * @access  Private (Admin)
 */
const deleteInstructor = async (req, res) => {
  let instructorId;
  
  try {
    instructorId = BigInt(req.params.id);
  } catch (err) {
    return res.status(400).json({ success: false, message: 'Invalid Instructor ID format' });
  }

  try {
    const instructor = await prisma.instructors.findUnique({
      where: { id: instructorId }
    });

    if (!instructor) {
      return res.status(404).json({ success: false, message: 'Instructor not found' });
    }

    // Optional: Delete image from Supabase storage if we wanted to
    // if (instructor.Image) { ... extract path and supabase.storage.from('Instructors').remove(...) }

    await prisma.instructors.delete({
      where: { id: instructorId }
    });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getInstructors,
  createInstructor,
  updateInstructor,
  deleteInstructor
};

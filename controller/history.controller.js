const Resume = require('../models/resume.model');
const cloudinary = require('cloudinary').v2;


const getUserResumes = async (req, res) => {
  try {
    const userId = req.params.userId;

    const resumes = await Resume.find({ userId }).sort({ uploadedAt: -1 });

    res.status(200).json(resumes);
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({ message: 'Failed to fetch resumes', error });
  }
};

// Delete a specific resume (with Cloudinary file deletion)
const deleteResume = async (req, res) => {
  try {
    const resumeId = req.params.resumeId;
    const resume = await Resume.findById(resumeId);

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    
    if (resume.public_id) {
      await cloudinary.uploader.destroy(resume.public_id);
    }

    await Resume.findByIdAndDelete(resumeId);

    res.status(200).json({
      message: 'Resume deleted successfully',
      deletedResume: resume, 
    });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({ message: 'Failed to delete resume', error });
  }
};


module.exports = {
  getUserResumes,
  deleteResume
};

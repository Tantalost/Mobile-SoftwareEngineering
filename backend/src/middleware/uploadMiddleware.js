import cloudinary from '../config/cloudinary.js'; 

export const uploadToCloudinary = (req, res, next) => {
   
    if (!req.file) return next();

    const stream = cloudinary.uploader.upload_stream(
        {
            folder: 'profile_pics', 
            allowed_formats: ['jpg', 'png', 'jpeg'],
        },
        (error, result) => {
            if (error) {
                console.error("Cloudinary Upload Error:", error);
                return res.status(500).json({ error: "Image upload failed" });
            }
            
            req.file.path = result.secure_url; 
            
            next(); 
        }
    );

    stream.end(req.file.buffer);
};
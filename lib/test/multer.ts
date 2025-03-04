import multer from "multer";

const upload = multer({
  storage: multer.diskStorage({
    destination: "./public/uploads", // Set upload directory
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`); // Add a timestamp to the file name
    },
  }),
});

const uploadMiddleware = upload.single("file");

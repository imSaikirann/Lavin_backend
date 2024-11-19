const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Initialize the S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION, // Specify your AWS region
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Upload function
const uploadToS3 = async (file) => {
    if (!file) {
        console.log('File is required');
        return Promise.resolve(); 
    }
    
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${Date.now()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    try {
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        const fileLocation = `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`; // URL to access the uploaded file
        return { Location: fileLocation };
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw new Error('S3 upload failed.');
    }
};

// Delete function
const deleteFileFromS3 = async (bucketName, fileKey) => {
    if (!fileKey) {
        console.log('File key is null or undefined, skipping deletion.');
        return Promise.resolve(); 
    }

    // Make sure the key is properly formatted
    const extractedKey = fileKey.split('/').pop(); // Extract the last part of the URL

    if (!extractedKey) {
        console.log('File key format is incorrect or empty, skipping deletion.');
        return Promise.resolve(); 
    }

    try {
        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: extractedKey,
        });
        await s3Client.send(command);
        console.log(`File with key ${extractedKey} deleted successfully.`);
    } catch (error) {
        console.error('Error deleting file from S3:', error);
        throw new Error('S3 deletion failed.');
    }
};


module.exports = { uploadToS3, deleteFileFromS3 };

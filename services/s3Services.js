const s3 = require('../config/aws')

const uploadToS3 = (file) => {
    if(!file)
    {
        console.log('File is required');
        return Promise.resolve(); 
    }
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,  
        Key: `${Date.now()}-${file.originalname}`, 
        Body: file.buffer,
        ContentType: file.mimetype,
       
    };

    return s3.upload(params).promise();
};

const deleteFileFromS3 = (bucketName, fileKey) => {
  
    if (!fileKey) {
        console.log('File key is null or undefined, skipping deletion.');
        return Promise.resolve(); 
    }

    const extractedKey = fileKey.split('/');
    
 
    if (!extractedKey[3]) {
        console.log('File key format is incorrect, skipping deletion.');
        return Promise.resolve(); 
    }

 
    return s3.deleteObject({
        Bucket: bucketName,
        Key: extractedKey[3]
    }).promise();
};


module.exports = { uploadToS3, deleteFileFromS3}
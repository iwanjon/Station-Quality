import { Router } from 'express';
import multer from 'multer';

import {
    getDocumentsByStationCode,
    uploadDocument,
    updateDocumentDescription,
    deleteDocument,
    downloadDocument
} from '../controllers/documents.controller.js';

const router = Router();

const ALLOWED_MIME_TYPES_BY_EXTENSION = {
    '.pdf': new Set([
        'application/pdf'
    ]),

    '.doc': new Set([
        'application/msword'
    ]),

    '.docx': new Set([
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]),

    '.xls': new Set([
        'application/vnd.ms-excel'
    ]),

    '.xlsx': new Set([
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]),

    '.ppt': new Set([
        'application/vnd.ms-powerpoint'
    ]),

    '.pptx': new Set([
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]),

    '.txt': new Set([
        'text/plain'
    ]),

    '.csv': new Set([
        'text/csv',
        'application/vnd.ms-excel'
    ]),

    '.xml': new Set([
        'application/xml',
        'text/xml'
    ])
};

const pathExtension = (filename) => {
    const lastDotIndex = filename.lastIndexOf('.');

    if (lastDotIndex < 0) {
        return '';
    }

    return filename.slice(lastDotIndex).toLowerCase();
};

const documentUpload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1
    },

    fileFilter: (req, file, cb) => {
        const extension = pathExtension(
            file.originalname
        );

        const allowedMimeTypes =
            ALLOWED_MIME_TYPES_BY_EXTENSION[extension];

        if (!allowedMimeTypes) {
            return cb(
                new Error('Jenis file tidak diizinkan')
            );
        }

        if (!allowedMimeTypes.has(file.mimetype)) {
            return cb(
                new Error(
                    'MIME type tidak sesuai dengan extension file'
                )
            );
        }

        return cb(null, true);
    }
});

const uploadDocumentMiddleware = (req, res, next) => {
    documentUpload.single('file')(
        req,
        res,
        (error) => {
            if (!error) {
                return next();
            }

            if (error instanceof multer.MulterError) {
                if (
                    error.code === 'LIMIT_FILE_SIZE'
                ) {
                    return res.status(413).json({
                        success: false,
                        message:
                            'Ukuran file maksimal 10 MB'
                    });
                }

                return res.status(400).json({
                    success: false,
                    message:
                        `Upload file gagal: ${error.message}`
                });
            }

            return res.status(400).json({
                success: false,
                message:
                    error.message ||
                    'File tidak valid'
            });
        }
    );
};

router.get(
    '/:code/documents',
    getDocumentsByStationCode
);

router.post(
    '/:code/documents',
    uploadDocumentMiddleware,
    uploadDocument
);

router.patch(
    '/:code/documents/:documentId',
    updateDocumentDescription
);

router.delete(
    '/:code/documents/:documentId',
    deleteDocument
);

router.get(
    '/:code/documents/:documentId/download',
    downloadDocument
);

export default router;
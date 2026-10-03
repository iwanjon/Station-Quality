import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

import pool from '../config/database.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCUMENT_STORAGE_ROOT = path.resolve(__dirname, '../storage/documents');
const DOCUMENT_STORAGE_PREFIX = 'storage/documents';

const getStationIdByCode = async (code) => {
    const [rows] = await pool.query(
        'SELECT stasiun_id FROM stasiun WHERE kode_stasiun = ? LIMIT 1',
        [code]
    );

    return rows.length > 0 ? rows[0].stasiun_id : null;
};

const getDocumentForStation = async (code, documentId) => {
    const [rows] = await pool.query(
        `
            SELECT
                d.document_id,
                d.stasiun_id,
                d.file_name,
                d.description,
                d.file_path,
                d.uploaded_at
            FROM documents d
            INNER JOIN stasiun s ON s.stasiun_id = d.stasiun_id
            WHERE s.kode_stasiun = ?
              AND d.document_id = ?
            LIMIT 1
        `,
        [code, documentId]
    );

    return rows.length > 0 ? rows[0] : null;
};

const getUniqueDisplayFilename = async (stationId, originalFilename) => {
    const [rows] = await pool.query(
        'SELECT file_name FROM documents WHERE stasiun_id = ?',
        [stationId]
    );

    const usedNames = new Set(
        rows.map((row) => row.file_name.toLowerCase())
    );

    const extension = path.extname(originalFilename);
    const baseName = path.basename(originalFilename, extension);

    if (!usedNames.has(originalFilename.toLowerCase())) {
        return originalFilename;
    }

    let counter = 1;
    let candidate = `${baseName} (${counter})${extension}`;

    while (usedNames.has(candidate.toLowerCase())) {
        counter += 1;
        candidate = `${baseName} (${counter})${extension}`;
    }

    return candidate;
};

const createPhysicalFilename = (originalFilename) => {
    const extension = path.extname(originalFilename).toLowerCase();
    return `${randomUUID()}${extension}`;
};

const getStoredFilePath = (relativeFilePath) => {
    const absolutePath = path.resolve(__dirname, '..', relativeFilePath);
    const rootWithSeparator = `${DOCUMENT_STORAGE_ROOT}${path.sep}`;

    if (
        absolutePath !== DOCUMENT_STORAGE_ROOT &&
        !absolutePath.startsWith(rootWithSeparator)
    ) {
        throw new Error('Invalid document storage path');
    }

    return absolutePath;
};

const deletePhysicalFile = async (relativeFilePath) => {
    const absolutePath = getStoredFilePath(relativeFilePath);

    try {
        await fs.unlink(absolutePath);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
};

// GET /api/stasiun/:code/documents
export const getDocumentsByStationCode = async (req, res) => {
    const { code } = req.params;

    try {
        const stationId = await getStationIdByCode(code);

        if (!stationId) {
            return res.status(404).json({
                success: false,
                message: 'Stasiun tidak ditemukan'
            });
        }

        const [rows] = await pool.query(
            `
                SELECT
                    document_id,
                    file_name,
                    description,
                    uploaded_at
                FROM documents
                WHERE stasiun_id = ?
                ORDER BY uploaded_at DESC, document_id DESC
            `,
            [stationId]
        );

        return res.json({
            success: true,
            data: rows,
            message: 'Dokumen stasiun berhasil diambil'
        });
    } catch (error) {
        logger.error('GET station documents failed', {
            code,
            message: error.message,
            stack: error.stack
        });

        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil dokumen stasiun'
        });
    }
};

// POST /api/stasiun/:code/documents
export const uploadDocument = async (req, res) => {
    const { code } = req.params;

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'File dokumen wajib diunggah'
        });
    }

    const originalFilename = path.basename(
        req.file.originalname.replace(/\0/g, '')
    );

    const description =
        typeof req.body.description === 'string'
            ? req.body.description.trim()
            : '';

    let physicalFilePath = null;

    try {
        const stationId = await getStationIdByCode(code);

        if (!stationId) {
            return res.status(404).json({
                success: false,
                message: 'Stasiun tidak ditemukan'
            });
        }

        await fs.mkdir(DOCUMENT_STORAGE_ROOT, { recursive: true });

        const physicalFilename = createPhysicalFilename(originalFilename);

        const relativeFilePath =
            `${DOCUMENT_STORAGE_PREFIX}/${physicalFilename}`;

        const absoluteFilePath = getStoredFilePath(relativeFilePath);

        physicalFilePath = relativeFilePath;

        // wx = create new file only; never overwrite existing file.
        await fs.writeFile(
            absoluteFilePath,
            req.file.buffer,
            { flag: 'wx' }
        );

        let displayFilename = originalFilename;
        let insertResult = null;

        for (let attempt = 0; attempt < 5; attempt += 1) {
            displayFilename = await getUniqueDisplayFilename(
                stationId,
                originalFilename
            );

            try {
                const [result] = await pool.query(
                    `
                        INSERT INTO documents (
                            stasiun_id,
                            file_name,
                            description,
                            file_path
                        )
                        VALUES (?, ?, ?, ?)
                    `,
                    [
                        stationId,
                        displayFilename,
                        description || null,
                        relativeFilePath
                    ]
                );

                insertResult = result;
                break;
            } catch (error) {
                if (
                    error.code !== 'ER_DUP_ENTRY' ||
                    attempt === 4
                ) {
                    throw error;
                }
            }
        }

        if (!insertResult) {
            throw new Error('Gagal membuat record dokumen');
        }

        const [rows] = await pool.query(
            `
                SELECT
                    document_id,
                    file_name,
                    description,
                    uploaded_at
                FROM documents
                WHERE document_id = ?
                LIMIT 1
            `,
            [insertResult.insertId]
        );

        return res.status(201).json({
            success: true,
            data: rows[0],
            message: 'Dokumen berhasil diunggah'
        });
    } catch (error) {
        if (physicalFilePath) {
            try {
                await deletePhysicalFile(physicalFilePath);
            } catch (cleanupError) {
                logger.error(
                    'Failed to cleanup document after upload error',
                    {
                        filePath: physicalFilePath,
                        message: cleanupError.message,
                        stack: cleanupError.stack
                    }
                );
            }
        }

        logger.error('POST station document failed', {
            code,
            message: error.message,
            stack: error.stack
        });

        return res.status(500).json({
            success: false,
            message: 'Gagal mengunggah dokumen'
        });
    }
};

// PATCH /api/stasiun/:code/documents/:documentId
export const updateDocumentDescription = async (req, res) => {
    const { code, documentId } = req.params;

    if (typeof req.body.description !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Description wajib berupa string'
        });
    }

    const description = req.body.description.trim();

    try {
        const document = await getDocumentForStation(
            code,
            documentId
        );

        if (!document) {
            return res.status(404).json({
                success: false,
                message:
                    'Dokumen tidak ditemukan pada stasiun tersebut'
            });
        }

        await pool.query(
            `
                UPDATE documents
                SET description = ?
                WHERE document_id = ?
            `,
            [
                description || null,
                document.document_id
            ]
        );

        const [rows] = await pool.query(
            `
                SELECT
                    document_id,
                    file_name,
                    description,
                    uploaded_at
                FROM documents
                WHERE document_id = ?
                LIMIT 1
            `,
            [document.document_id]
        );

        return res.json({
            success: true,
            data: rows[0],
            message: 'Deskripsi dokumen berhasil diperbarui'
        });
    } catch (error) {
        logger.error(
            'PATCH station document description failed',
            {
                code,
                documentId,
                message: error.message,
                stack: error.stack
            }
        );

        return res.status(500).json({
            success: false,
            message:
                'Gagal memperbarui deskripsi dokumen'
        });
    }
};

// DELETE /api/stasiun/:code/documents/:documentId
export const deleteDocument = async (req, res) => {
    const { code, documentId } = req.params;

    try {
        const document = await getDocumentForStation(
            code,
            documentId
        );

        if (!document) {
            return res.status(404).json({
                success: false,
                message:
                    'Dokumen tidak ditemukan pada stasiun tersebut'
            });
        }

        await deletePhysicalFile(document.file_path);

        await pool.query(
            'DELETE FROM documents WHERE document_id = ?',
            [document.document_id]
        );

        return res.json({
            success: true,
            message: 'Dokumen berhasil dihapus'
        });
    } catch (error) {
        logger.error(
            'DELETE station document failed',
            {
                code,
                documentId,
                message: error.message,
                stack: error.stack
            }
        );

        return res.status(500).json({
            success: false,
            message: 'Gagal menghapus dokumen'
        });
    }
};

// GET /api/stasiun/:code/documents/:documentId/download
export const downloadDocument = async (req, res) => {
    const { code, documentId } = req.params;

    try {
        const document = await getDocumentForStation(
            code,
            documentId
        );

        if (!document) {
            return res.status(404).json({
                success: false,
                message:
                    'Dokumen tidak ditemukan pada stasiun tersebut'
            });
        }

        const absoluteFilePath = getStoredFilePath(
            document.file_path
        );

        try {
            await fs.access(absoluteFilePath);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return res.status(404).json({
                    success: false,
                    message:
                        'File dokumen tidak ditemukan di storage'
                });
            }

            throw error;
        }

        return res.download(
            absoluteFilePath,
            document.file_name,
            (error) => {
                if (error && !res.headersSent) {
                    logger.error(
                        'Document download failed',
                        {
                            code,
                            documentId,
                            message: error.message,
                            stack: error.stack
                        }
                    );

                    res.status(500).json({
                        success: false,
                        message:
                            'Gagal mengunduh dokumen'
                    });
                }
            }
        );
    } catch (error) {
        logger.error(
            'GET station document download failed',
            {
                code,
                documentId,
                message: error.message,
                stack: error.stack
            }
        );

        return res.status(500).json({
            success: false,
            message: 'Gagal mengunduh dokumen'
        });
    }
};
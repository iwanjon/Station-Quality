import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all stasiun data with JOIN
export const getAllStasiun = async (req, res) => {
    try {
        console.log('Fetching all stasiun data');
        const [rows] = await pool.query(`
            SELECT 
                s.stasiun_id,
                s.net,
                s.kode_stasiun,
                s.lintang,
                s.bujur,
                s.elevasi,
                s.lokasi,
                p.nama_provinsi AS provinsi,
                s.provinsi_id,
                u.nama_upt AS upt_penanggung_jawab,
                s.upt_id,
                s.status,
                s.tahun_instalasi,
                j.nama_jaringan AS jaringan,
                s.jaringan_id,
                s.prioritas,
                s.keterangan,
                s.accelerometer,
                s.digitizer_komunikasi,
                s.tipe_shelter,
                s.lokasi_shelter,
                s.penjaga_shelter,
                s.kondisi_shelter,
                s.assets_shelter,
                s.access_shelter,
                s.photo_shelter,
                s.penggantian_terakhir_alat,
                s.updated_at
            FROM stasiun s
            LEFT JOIN jaringan j ON s.jaringan_id = j.jaringan_id
            LEFT JOIN upt u ON s.upt_id = u.upt_id        
            LEFT JOIN provinsi p ON s.provinsi_id = p.provinsi_id
        `);
        
        res.json(rows);
    } catch (error) {
        console.error("DB Error:", error);
        res.status(500).json({ 
            error: 'Gagal ambil data stasiun' 
        });
    }
};

// Get all stasiun codes only
export const getAllStasiunCodes = async (req, res) => {
    try {
        console.log('Fetching all stasiun codes');
        const [rows] = await pool.query(`
            SELECT 
                kode_stasiun
            FROM stasiun
            ORDER BY kode_stasiun
        `);
        
        res.json({
            success: true,
            data: rows,
            message: 'Data kode stasiun berhasil diambil'
        });
    } catch (error) {
        console.error("DB Error:", error);
        res.status(500).json({ 
            success: false,
            message: 'Gagal ambil data kode stasiun',
            error: error.message
        });
    }
};

// Get valid foreign key options for CSV template
export const getForeignKeyOptions = async (req, res) => {
    try {
        console.log('Fetching foreign key options for CSV template');
        
        // Get all provinces
        const [provinces] = await pool.query('SELECT nama_provinsi FROM provinsi ORDER BY nama_provinsi');
        
        // Get all UPT names
        const [upts] = await pool.query('SELECT nama_upt FROM upt ORDER BY nama_upt');
        
        // Get all network names
        const [networks] = await pool.query('SELECT nama_jaringan FROM jaringan ORDER BY nama_jaringan');
        
        res.json({
            success: true,
            data: {
                provinces: provinces.map(p => p.nama_provinsi),
                upts: upts.map(u => u.nama_upt),
                networks: networks.map(n => n.nama_jaringan)
            },
            message: 'Foreign key options fetched successfully'
        });
    } catch (error) {
        console.error("Error fetching foreign key options:", error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch foreign key options' 
        });
    }
};

// Get stasiun by code (query parameter)
export const getStasiunByCode = async (req, res) => {
    try {
        const { code } = req.query;
        
        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Station code is required'
            });
        }

        console.log(`Fetching stasiun data for code: ${code}`);
        
        const [rows] = await pool.query(`
            SELECT 
                s.stasiun_id,
                s.net,
                s.kode_stasiun,
                s.lintang,
                s.bujur,
                s.elevasi,
                s.lokasi,
                p.nama_provinsi AS provinsi,
                s.provinsi_id,
                u.nama_upt AS upt_penanggung_jawab,
                s.upt_id,
                s.status,
                s.tahun_instalasi,
                j.nama_jaringan AS jaringan,
                s.jaringan_id,
                s.prioritas,
                s.keterangan,
                s.accelerometer,
                s.digitizer_komunikasi,
                s.tipe_shelter,
                s.lokasi_shelter,
                s.penjaga_shelter,
                s.kondisi_shelter,
                s.assets_shelter,
                s.access_shelter,
                s.photo_shelter,
                s.penggantian_terakhir_alat,
                s.updated_at
            FROM stasiun s
            LEFT JOIN jaringan j ON s.jaringan_id = j.jaringan_id
            LEFT JOIN upt u ON s.upt_id = u.upt_id        
            LEFT JOIN provinsi p ON s.provinsi_id = p.provinsi_id
            WHERE s.kode_stasiun = ?
        `, [code]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Stasiun tidak ditemukan'
            });
        }

        res.json({
            success: true,
            data: rows[0],
            message: 'Data stasiun berhasil diambil'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data stasiun',
            error: error.message
        });
    }
};

// Update stasiun by code
export const updateStasiunByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const updateData = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Station code is required'
            });
        }

        // Log raw data yang diterima dari frontend
        console.log('📨 Received update request for station:', code);
        console.log('📦 Raw request body:', JSON.stringify(updateData, null, 2));
        console.log('🔍 Request body type:', typeof updateData);
        console.log('📊 Request body keys:', updateData ? Object.keys(updateData) : 'null/undefined');

        console.log(`Updating stasiun data for code: ${code}`);
        console.log('Update data:', updateData);

        // Remove fields that should not be updated
        // Convert names to IDs where needed
        const processedData = { ...updateData };

        // Convert provinsi name to provinsi_id
        if (processedData.provinsi && typeof processedData.provinsi === 'string') {
            const [provinsiRows] = await pool.query('SELECT provinsi_id FROM provinsi WHERE nama_provinsi = ?', [processedData.provinsi]);
            if (provinsiRows.length > 0) {
                processedData.provinsi_id = provinsiRows[0].provinsi_id;
                delete processedData.provinsi;
            } else {
                // Create new provinsi if it doesn't exist
                console.log(`Creating new province: ${processedData.provinsi}`);
                const [insertResult] = await pool.query('INSERT INTO provinsi (nama_provinsi) VALUES (?)', [processedData.provinsi]);
                processedData.provinsi_id = insertResult.insertId;
                delete processedData.provinsi;
            }
        }

        // Convert jaringan name to jaringan_id
        if (processedData.jaringan && typeof processedData.jaringan === 'string') {
            const [jaringanRows] = await pool.query('SELECT jaringan_id FROM jaringan WHERE nama_jaringan = ?', [processedData.jaringan]);
            if (jaringanRows.length > 0) {
                processedData.jaringan_id = jaringanRows[0].jaringan_id;
                delete processedData.jaringan;
            } else {
                // Create new jaringan if it doesn't exist
                console.log(`Creating new jaringan: ${processedData.jaringan}`);
                const [insertResult] = await pool.query('INSERT INTO jaringan (nama_jaringan) VALUES (?)', [processedData.jaringan]);
                processedData.jaringan_id = insertResult.insertId;
                delete processedData.jaringan;
            }
        }

        // Convert upt_penanggung_jawab name to upt_id
        if (processedData.upt_penanggung_jawab && typeof processedData.upt_penanggung_jawab === 'string') {
            const [uptRows] = await pool.query('SELECT upt_id FROM upt WHERE nama_upt = ?', [processedData.upt_penanggung_jawab]);
            if (uptRows.length > 0) {
                processedData.upt_id = uptRows[0].upt_id;
                delete processedData.upt_penanggung_jawab;
            } else {
                // Create new upt if it doesn't exist
                console.log(`Creating new UPT: ${processedData.upt_penanggung_jawab}`);
                const [insertResult] = await pool.query('INSERT INTO upt (nama_upt) VALUES (?)', [processedData.upt_penanggung_jawab]);
                processedData.upt_id = insertResult.insertId;
                delete processedData.upt_penanggung_jawab;
            }
        }

        console.log('🔄 Processed data (names converted to IDs):', JSON.stringify(processedData, null, 2));

        const forbiddenFields = ['stasiun_id', 'kode_stasiun', 'updated_at'];
        const filteredData = Object.keys(processedData).reduce((acc, key) => {
            if (!forbiddenFields.includes(key)) {
                acc[key] = processedData[key];
            }
            return acc;
        }, {});

        // Log data yang akan diupdate setelah filtering
        console.log('🔧 Filtered data to update:', JSON.stringify(filteredData, null, 2));
        console.log('🚫 Forbidden fields removed:', forbiddenFields);
        console.log('✅ Fields that will be updated:', Object.keys(filteredData));

        // Check if there are any fields to update
        if (Object.keys(filteredData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        // Build dynamic UPDATE query
        const setClause = Object.keys(filteredData)
            .map(key => `${key} = ?`)
            .join(', ');

        const values = Object.values(filteredData);
        values.push(code); // Add code for WHERE clause

        const updateQuery = `
            UPDATE stasiun
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP
            WHERE kode_stasiun = ?
        `;

        console.log('Update query:', updateQuery);
        console.log('Values:', values);

        const [result] = await pool.query(updateQuery, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Stasiun tidak ditemukan'
            });
        }

        // Fetch updated data
        const [updatedRows] = await pool.query(`
            SELECT
                s.stasiun_id,
                s.net,
                s.kode_stasiun,
                s.lintang,
                s.bujur,
                s.elevasi,
                s.lokasi,
                p.nama_provinsi AS provinsi,
                u.nama_upt AS upt_penanggung_jawab,
                s.status,
                s.tahun_instalasi,
                j.nama_jaringan AS jaringan,
                s.prioritas,
                s.keterangan,
                s.accelerometer,
                s.digitizer_komunikasi,
                s.tipe_shelter,
                s.lokasi_shelter,
                s.penjaga_shelter,
                s.kondisi_shelter,
                s.assets_shelter,
                s.access_shelter,
                s.photo_shelter,
                s.penggantian_terakhir_alat,
                s.updated_at
            FROM stasiun s
            LEFT JOIN jaringan j ON s.jaringan_id = j.jaringan_id
            LEFT JOIN upt u ON s.upt_id = u.upt_id
            LEFT JOIN provinsi p ON s.provinsi_id = p.provinsi_id
            WHERE s.kode_stasiun = ?
        `, [code]);

        res.json({
            success: true,
            data: updatedRows[0],
            message: 'Data stasiun berhasil diperbarui'
        });
    } catch (error) {
        console.error('Error updating stasiun:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal memperbarui data stasiun',
            error: error.message
        });
    }
};

// Import stations from CSV file
export const importStationsFromCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No CSV file uploaded'
            });
        }

        const csvData = req.file.buffer.toString('utf-8');
        const lines = csvData.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'CSV file must contain at least header and one data row'
            });
        }

        // Parse CSV headers
        const headers = lines[0].split(',').map(header => header.replace(/"/g, '').trim());
        const expectedHeaders = [
            'net', 'kode_stasiun', 'lintang', 'bujur', 'elevasi', 'lokasi', 'provinsi',
            'upt_penanggung_jawab', 'status', 'tahun_instalasi', 'jaringan', 'prioritas',
            'keterangan', 'accelerometer', 'digitizer_komunikasi', 'tipe_shelter',
            'lokasi_shelter', 'penjaga_shelter', 'kondisi_shelter', 'assets_shelter',
            'access_shelter', 'photo_shelter', 'penggantian_terakhir_alat', 'is_sample'
        ];

        // Validate headers
        const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));
        if (missingHeaders.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required headers: ${missingHeaders.join(', ')}`
            });
        }

        const stations = [];
        const errors = [];

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
            try {
                const values = lines[i].split(',').map(value => value.replace(/"/g, '').trim());

                if (values.length !== headers.length) {
                    errors.push(`Row ${i + 1}: Invalid number of columns`);
                    continue;
                }

                // Skip sample data rows
                const isSampleIndex = headers.indexOf('is_sample');
                if (isSampleIndex !== -1 && 
                    (values[isSampleIndex] === 'true' || values[isSampleIndex] === '1')) {
                    console.log(`Row ${i + 1}: Skipping sample data row`);
                    continue;
                }

                // Create station object (exclude is_sample field)
                const station = {};
                headers.forEach((header, index) => {
                    // Skip is_sample field as it's not a database column
                    if (header === 'is_sample') return;
                    
                    let value = values[index];

                    // Convert data types
                    if (['lintang', 'bujur', 'elevasi', 'tahun_instalasi'].includes(header)) {
                        value = value ? parseFloat(value) : null;
                    } else if (header === 'penggantian_terakhir_alat') {
                        value = value || null;
                    }

                    station[header] = value;
                });

                // Validate required fields
                if (!station.kode_stasiun || !station.net) {
                    errors.push(`Row ${i + 1}: Missing required fields (kode_stasiun, net)`);
                    continue;
                }

                // Check for duplicate kode_stasiun in current batch
                if (stations.some(s => s.kode_stasiun === station.kode_stasiun)) {
                    errors.push(`Row ${i + 1}: Duplicate kode_stasiun in file`);
                    continue;
                }

                stations.push(station);
            } catch (error) {
                errors.push(`Row ${i + 1}: Error parsing data - ${error.message}`);
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors found',
                errors: errors
            });
        }

        if (stations.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid stations to import'
            });
        }

        // Check for existing stations
        const existingCodes = [];
        for (const station of stations) {
            const [existing] = await pool.query(
                'SELECT kode_stasiun FROM stasiun WHERE kode_stasiun = ?',
                [station.kode_stasiun]
            );
            if (existing.length > 0) {
                existingCodes.push(station.kode_stasiun);
            }
        }

        if (existingCodes.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Stations already exist: ${existingCodes.join(', ')}`
            });
        }

        // Insert stations in batch
        let insertedCount = 0;
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            for (const station of stations) {
                // Get provinsi_id and upt_id from names with validation
                let provinsiId = null;
                let uptId = null;
                let jaringanId = null;

                if (station.provinsi) {
                    // First try exact match
                    let [provinsiResult] = await connection.query(
                        'SELECT provinsi_id, nama_provinsi FROM provinsi WHERE nama_provinsi = ?',
                        [station.provinsi]
                    );

                    if (provinsiResult.length === 0) {
                        // If no exact match, try case-insensitive match
                        [provinsiResult] = await connection.query(
                            'SELECT provinsi_id, nama_provinsi FROM provinsi WHERE LOWER(nama_provinsi) = LOWER(?)',
                            [station.provinsi]
                        );

                        if (provinsiResult.length === 0) {
                            // If still no match, try partial match
                            [provinsiResult] = await connection.query(
                                'SELECT provinsi_id, nama_provinsi FROM provinsi WHERE LOWER(nama_provinsi) LIKE LOWER(?)',
                                [`%${station.provinsi}%`]
                            );

                            if (provinsiResult.length === 0) {
                                // If no similar match found, create new provinsi
                                console.log(`Creating new province: ${station.provinsi}`);
                                const [insertResult] = await connection.query(
                                    'INSERT INTO provinsi (nama_provinsi) VALUES (?)',
                                    [station.provinsi]
                                );
                                provinsiId = insertResult.insertId;
                            } else {
                                // Use the first partial match found
                                provinsiId = provinsiResult[0].provinsi_id;
                                console.log(`Using similar province match: "${provinsiResult[0].nama_provinsi}" for input "${station.provinsi}"`);
                            }
                        } else {
                            // Use case-insensitive match
                            provinsiId = provinsiResult[0].provinsi_id;
                            console.log(`Using case-insensitive province match: "${provinsiResult[0].nama_provinsi}" for input "${station.provinsi}"`);
                        }
                    } else {
                        // Use exact match
                        provinsiId = provinsiResult[0].provinsi_id;
                    }
                }

                if (station.upt_penanggung_jawab) {
                    // First try exact match
                    let [uptResult] = await connection.query(
                        'SELECT upt_id, nama_upt FROM upt WHERE nama_upt = ?',
                        [station.upt_penanggung_jawab]
                    );

                    if (uptResult.length === 0) {
                        // If no exact match, try case-insensitive match
                        [uptResult] = await connection.query(
                            'SELECT upt_id, nama_upt FROM upt WHERE LOWER(nama_upt) = LOWER(?)',
                            [station.upt_penanggung_jawab]
                        );

                        if (uptResult.length === 0) {
                            // If still no match, try partial match
                            [uptResult] = await connection.query(
                                'SELECT upt_id, nama_upt FROM upt WHERE LOWER(nama_upt) LIKE LOWER(?)',
                                [`%${station.upt_penanggung_jawab}%`]
                            );

                            if (uptResult.length === 0) {
                                // If no similar match found, create new upt
                                console.log(`Creating new UPT: ${station.upt_penanggung_jawab}`);
                                const [insertResult] = await connection.query(
                                    'INSERT INTO upt (nama_upt) VALUES (?)',
                                    [station.upt_penanggung_jawab]
                                );
                                uptId = insertResult.insertId;
                            } else {
                                // Use the first partial match found
                                uptId = uptResult[0].upt_id;
                                console.log(`Using similar UPT match: "${uptResult[0].nama_upt}" for input "${station.upt_penanggung_jawab}"`);
                            }
                        } else {
                            // Use case-insensitive match
                            uptId = uptResult[0].upt_id;
                            console.log(`Using case-insensitive UPT match: "${uptResult[0].nama_upt}" for input "${station.upt_penanggung_jawab}"`);
                        }
                    } else {
                        // Use exact match
                        uptId = uptResult[0].upt_id;
                    }
                }

                if (station.jaringan) {
                    // First try exact match
                    let [jaringanResult] = await connection.query(
                        'SELECT jaringan_id, nama_jaringan FROM jaringan WHERE nama_jaringan = ?',
                        [station.jaringan]
                    );

                    if (jaringanResult.length === 0) {
                        // If no exact match, try fuzzy match (case insensitive)
                        [jaringanResult] = await connection.query(
                            'SELECT jaringan_id, nama_jaringan FROM jaringan WHERE LOWER(nama_jaringan) = LOWER(?)',
                            [station.jaringan]
                        );

                        if (jaringanResult.length === 0) {
                            // If still no match, try partial match
                            [jaringanResult] = await connection.query(
                                'SELECT jaringan_id, nama_jaringan FROM jaringan WHERE LOWER(nama_jaringan) LIKE LOWER(?)',
                                [`%${station.jaringan}%`]
                            );

                            if (jaringanResult.length === 0) {
                                // If no similar match found, create new jaringan
                                console.log(`Creating new network: ${station.jaringan}`);
                                const [insertResult] = await connection.query(
                                    'INSERT INTO jaringan (nama_jaringan) VALUES (?)',
                                    [station.jaringan]
                                );
                                jaringanId = insertResult.insertId;
                            } else {
                                // Use the first partial match found
                                jaringanId = jaringanResult[0].jaringan_id;
                                console.log(`Using similar network match: "${jaringanResult[0].nama_jaringan}" for input "${station.jaringan}"`);
                            }
                        } else {
                            // Use case-insensitive match
                            jaringanId = jaringanResult[0].jaringan_id;
                            console.log(`Using case-insensitive network match: "${jaringanResult[0].nama_jaringan}" for input "${station.jaringan}"`);
                        }
                    } else {
                        // Use exact match
                        jaringanId = jaringanResult[0].jaringan_id;
                    }
                }

                await connection.query(`
                    INSERT INTO stasiun (
                        net, kode_stasiun, lintang, bujur, elevasi, lokasi,
                        provinsi_id, upt_id, status, tahun_instalasi, jaringan_id,
                        prioritas, keterangan, accelerometer, digitizer_komunikasi,
                        tipe_shelter, lokasi_shelter, penjaga_shelter, kondisi_shelter,
                        assets_shelter, access_shelter, photo_shelter,
                        penggantian_terakhir_alat, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                `, [
                    station.net,
                    station.kode_stasiun,
                    station.lintang,
                    station.bujur,
                    station.elevasi,
                    station.lokasi,
                    provinsiId,
                    uptId,
                    station.status,
                    station.tahun_instalasi,
                    jaringanId,
                    station.prioritas,
                    station.keterangan,
                    station.accelerometer,
                    station.digitizer_komunikasi,
                    station.tipe_shelter,
                    station.lokasi_shelter,
                    station.penjaga_shelter,
                    station.kondisi_shelter,
                    station.assets_shelter,
                    station.access_shelter,
                    station.photo_shelter,
                    station.penggantian_terakhir_alat
                ]);

                insertedCount++;
            }

            await connection.commit();

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

        console.log(`✅ Successfully imported ${insertedCount} stations from CSV`);

        res.json({
            success: true,
            message: `Successfully imported ${insertedCount} stations`,
            insertedCount: insertedCount
        });

    } catch (error) {
        console.error('Error importing stations from CSV:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to import stations from CSV',
            error: error.message
        });
    }
};

// Upload site photo for a station
export const uploadSitePhoto = async (req, res) => {
    try {
        const { code } = req.params;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Station code is required'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No photo file provided'
            });
        }

        // Check if station exists
        const [stationRows] = await pool.query('SELECT stasiun_id, photo_shelter FROM stasiun WHERE kode_stasiun = ?', [code]);
        if (stationRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Station not found'
            });
        }

        // Generate unique filename
        const fileExtension = path.extname(req.file.originalname);
        const fileName = `site_${code}_${Date.now()}${fileExtension}`;
        const uploadPath = path.join(__dirname, '../public/uploads', fileName);

        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, '../public/uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Save file to disk
        fs.writeFileSync(uploadPath, req.file.buffer);

        // Update database with photo path (append to existing photos)
        const photoPath = `/uploads/${fileName}`;
        const existingPhotos = stationRows[0].photo_shelter || '';
        const photoList = existingPhotos ? existingPhotos.split(',').filter(p => p.trim()) : [];
        photoList.push(photoPath);
        const updatedPhotos = photoList.join(',');

        await pool.query('UPDATE stasiun SET photo_shelter = ? WHERE kode_stasiun = ?', [updatedPhotos, code]);

        res.json({
            success: true,
            message: 'Site photo uploaded successfully',
            data: {
                photoPath: photoPath,
                allPhotos: updatedPhotos
            }
        });

    } catch (error) {
        console.error('Error uploading site photo:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload site photo',
            error: error.message
        });
    }
};// Delete site photo for a station
export const deleteSitePhoto = async (req, res) => {
    try {
        const { code } = req.params;
        const { photoPath } = req.body; // Photo path to delete

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Station code is required'
            });
        }

        // Check if station exists and has photo
        const [stationRows] = await pool.query('SELECT photo_shelter FROM stasiun WHERE kode_stasiun = ?', [code]);
        if (stationRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Station not found'
            });
        }

        const existingPhotos = stationRows[0].photo_shelter;
        if (!existingPhotos) {
            return res.status(400).json({
                success: false,
                message: 'No photos to delete'
            });
        }

        // Split photos and filter out the one to delete
        const photoList = existingPhotos.split(',').filter(p => p.trim());
        const updatedPhotoList = photoList.filter(p => p !== photoPath);

        // Delete file from disk
        const filePath = path.join(__dirname, '../public', photoPath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Update database with remaining photos
        const updatedPhotos = updatedPhotoList.length > 0 ? updatedPhotoList.join(',') : null;
        await pool.query('UPDATE stasiun SET photo_shelter = ? WHERE kode_stasiun = ?', [updatedPhotos, code]);

        res.json({
            success: true,
            message: 'Site photo deleted successfully',
            data: {
                remainingPhotos: updatedPhotos
            }
        });

    } catch (error) {
        console.error('Error deleting site photo:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete site photo',
            error: error.message
        });
    }
};

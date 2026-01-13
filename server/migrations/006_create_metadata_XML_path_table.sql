-- CREATE TABLE metadata_XML_path (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     path TEXT,
--     updated_at DATETIME,
--     INDEX idx_metadata_xml_path_id (id)
-- );


CREATE TABLE metadata_XML_path (
    id INT AUTO_INCREMENT PRIMARY KEY,
    path TEXT NOT NULL,
    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

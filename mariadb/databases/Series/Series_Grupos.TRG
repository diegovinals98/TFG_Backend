TYPE=TRIGGERS
triggers='CREATE DEFINER=`root`@`%` TRIGGER after_insert_Series_Grupos\nAFTER INSERT ON Series_Grupos\nFOR EACH ROW\nBEGIN\n    -- Inserta en la tabla Series los usuarios correspondientes\n    INSERT INTO Series (ID_Usuario, ID_Serie)\n    SELECT ID_Usuario, NEW.ID_Serie\n    FROM Usuario_Grupo2\n    WHERE ID_Grupo = NEW.ID_Grupo;\nEND'
sql_modes=1411383296
definers='root@%'
client_cs_names='utf8mb4'
connection_cl_names='utf8mb4_unicode_ci'
db_cl_names='utf8mb4_general_ci'
created=1726220397246214

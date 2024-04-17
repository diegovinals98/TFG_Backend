TYPE=TRIGGERS
triggers='CREATE DEFINER=`root`@`%` TRIGGER `eliminar_registros_relacionados` AFTER DELETE ON `Series` FOR EACH ROW BEGIN\n    DECLARE serie_id INT;\n\n    -- Obtener el ID de la serie que se está eliminando\n    SET serie_id = OLD.ID_Serie;\n\n    -- Eliminar los registros relacionados en la tabla Capitulo\n    DELETE FROM Capitulo WHERE ID_Serie = serie_id;\n\n    -- Eliminar los registros relacionados en la tabla Visualizaciones\n    DELETE FROM Visualizaciones WHERE ID_Capitulo IN (SELECT ID_Capitulo FROM Capitulo WHERE ID_Serie = serie_id);\nEND'
sql_modes=524288
definers='root@%'
client_cs_names='utf8mb4'
connection_cl_names='utf8mb4_general_ci'
db_cl_names='utf8mb4_general_ci'
created=1711642899759325
